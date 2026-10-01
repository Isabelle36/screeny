import { Prisma, PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createHash } from 'crypto';
import sharp from 'sharp';
import dotenv from 'dotenv';
import { extractAccentColor, hasDarkScreenshots } from '../lib/color/accent-color';

dotenv.config();

const prisma = new PrismaClient();

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

function slugify(text: string) {
  if (!text) return `app-${Date.now()}`;
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function uploadToR2(key: string, buffer: Buffer, contentType: string) {
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

type AppStoreLookupResult = Prisma.InputJsonObject & {
  trackId?: number;
  trackName?: string;
  trackCensoredName?: string;
  artistName?: string;
  artworkUrl512?: string;
  artworkUrl100?: string;
  primaryGenreName?: string;
  currentVersionReleaseDate?: string;
  releaseDate?: string;
  screenshotUrls?: string[];
};

export interface IngestOptions {
  hasMascot?: boolean;
  tags?: string[];
  maxScreenshots?: number;
  forceReingest?: boolean;
}

export async function ingestApp(trackIdInput: number | string, options: IngestOptions = {}) {
  const {
    hasMascot = false,
    tags = [],
    maxScreenshots = 10,
    forceReingest = false,
  } = options;

  const cleanedId = String(trackIdInput).replace(/\D/g, '');
  if (!cleanedId) {
    throw new Error(`Invalid trackId "${trackIdInput}" — no digits found.`);
  }
  const trackId = BigInt(cleanedId);

  if (!forceReingest) {
    const existing = await prisma.app.findUnique({
      where: { trackId },
      include: { screenshots: true },
    });

    if (existing && existing.screenshots.length > 0) {
      console.log(`⏩ Skipping "${existing.name}" (Already exists in DB & R2)`);
      return existing;
    }
  }

  console.log(`\n🚀 Fetching App Store data for ID: ${trackId}...`);

  const STOREFRONTS_TO_TRY = ['us', 'in', 'gb'];
  let appData: AppStoreLookupResult | null = null;

  for (const country of STOREFRONTS_TO_TRY) {
    const res = await fetch(
      `https://itunes.apple.com/lookup?id=${trackId}&country=${country}&entity=software`
    );
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      if (country !== 'us') {
        console.log(`   ↳ found on "${country}" storefront (not listed on US store)`);
      }
      appData = data.results[0];
      break;
    }
  }

  if (!appData) {
    throw new Error(
      `App with ID ${trackId} not found on App Store (tried: ${STOREFRONTS_TO_TRY.join(', ')}).`
    );
  }
  const appName = appData.trackName || appData.trackCensoredName || `App-${trackId}`;
  const realTrackId = BigInt(appData.trackId || trackId);
  const slug = slugify(appName);

  console.log(`📦 Found: "${appName}" by ${appData.artistName}`);

  const rawIconUrl: string = appData.artworkUrl512 || appData.artworkUrl100 || '';
  let iconR2Url = '';
  let iconImage: Buffer | undefined;

  if (rawIconUrl) {
    console.log(`   🎨 Fetching app icon...`);
    const iconRes = await fetch(rawIconUrl);
    const iconArrayBuffer = await iconRes.arrayBuffer();
    const iconWebp = await sharp(Buffer.from(iconArrayBuffer))
      .resize(512, 512)
      .webp({ quality: 90 })
      .toBuffer();

    iconImage = iconWebp;

    const iconKey = `apps/${slug}/icon.webp`;
    iconR2Url = await uploadToR2(iconKey, iconWebp, 'image/webp');
  }

  const app = await prisma.app.upsert({
    where: { trackId: realTrackId },
    update: {
      name: appName,
      developer: appData.artistName || 'Unknown Developer',
      iconUrl: iconR2Url || appData.artworkUrl512 || appData.artworkUrl100 || '',
      category: appData.primaryGenreName || 'Utilities',
      hasMascot,
      metadata: appData,
      sourceUpdatedAt: appData.currentVersionReleaseDate
        ? new Date(appData.currentVersionReleaseDate)
        : appData.releaseDate
        ? new Date(appData.releaseDate)
        : null,
      lastCheckedAt: new Date(),
      tags,
    },
    create: {
      trackId: realTrackId,
      slug,
      name: appName,
      developer: appData.artistName || 'Unknown Developer',
      iconUrl: iconR2Url || appData.artworkUrl512 || appData.artworkUrl100 || '',
      category: appData.primaryGenreName || 'Utilities',
      hasMascot,
      metadata: appData,
      sourceUpdatedAt: appData.currentVersionReleaseDate
        ? new Date(appData.currentVersionReleaseDate)
        : appData.releaseDate
        ? new Date(appData.releaseDate)
        : null,
      tags,
    },
  });

  const existingScreenshots = await prisma.screenshot.findMany({ where: { appId: app.id } });

  const allScreenshots: string[] = appData.screenshotUrls || [];
  const screenshotUrls = allScreenshots.slice(0, maxScreenshots);

  console.log(`📸 Processing ${screenshotUrls.length} screenshots (Capped at ${maxScreenshots})...`);
  const cardScreenshots: Buffer[] = [];

  for (let i = 0; i < screenshotUrls.length; i++) {
    const rawUrl = screenshotUrls[i];
    console.log(`   [${i + 1}/${screenshotUrls.length}] Converting & uploading to R2...`);

    const imgRes = await fetch(rawUrl);
    const arrayBuffer = await imgRes.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    const webpBuffer = await sharp(inputBuffer)
      .webp({ quality: 80 })
      .toBuffer();

    if (i < 3) cardScreenshots.push(webpBuffer);
    const hash = createHash('sha256').update(webpBuffer).digest('hex');
    const r2Key = `apps/${slug}/screenshots/screenshot-${i + 1}.webp`;
    const existing = existingScreenshots.find((screenshot) => screenshot.position === i);
    const r2Url = existing?.hash === hash
      ? existing.r2Url
      : await uploadToR2(r2Key, webpBuffer, 'image/webp');

    if (existing) {
      await prisma.screenshot.update({
        where: { id: existing.id },
        data: {
          sourceUrl: rawUrl,
          r2Url,
          hash,
          position: i,
          curated: existing.hash === hash ? existing.curated : false,
          lastSeenAt: new Date(),
        },
      });
    } else {
      await prisma.screenshot.create({
        data: {
          appId: app.id,
          sourceUrl: rawUrl,
          r2Url,
          hash,
          position: i,
        },
      });
    }
  }

  const observedPositions = new Set(screenshotUrls.map((_, index) => index));
  await prisma.screenshot.updateMany({
    where: { appId: app.id, position: { notIn: [...observedPositions] } },
    data: { lastSeenAt: new Date() },
  });

  const accentColor = await extractAccentColor({ screenshots: cardScreenshots, icon: iconImage });
  const darkScreenshots = await hasDarkScreenshots(cardScreenshots);
  await prisma.app.update({
    where: { id: app.id },
    data: { lastCheckedAt: new Date(), accentColor, darkScreenshots },
  });

  console.log(`✅ Successfully ingested "${app.name}" into Neon DB & R2!`);
  return app;
}