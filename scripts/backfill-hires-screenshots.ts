import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import dotenv from 'dotenv';
import { fullResScreenshotUrl, screenshotKey, toScreenshotWebp, uploadToR2 } from './ingest';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.screenshot.findMany({
    where: { sourceUrl: { not: '' } },
    select: { id: true, sourceUrl: true, r2Url: true, position: true, hash: true, app: { select: { name: true, slug: true } } },
    orderBy: [{ appId: 'asc' }, { position: 'asc' }],
  });
  const screenshots = rows.filter((screenshot) => !/-[0-9a-f]{8}\.webp$/.test(screenshot.r2Url));
  console.log(`🖼️  Re-fetching ${screenshots.length} screenshots at full resolution...`);

  let updated = 0;
  let failures = 0;
  const CONCURRENCY = 8;
  for (let start = 0; start < screenshots.length; start += CONCURRENCY) {
    await Promise.all(
      screenshots.slice(start, start + CONCURRENCY).map(async (screenshot) => {
        const label = `${screenshot.app.name} #${screenshot.position + 1}`;
        try {
          const response = await fetch(fullResScreenshotUrl(screenshot.sourceUrl));
          if (!response.ok) throw new Error(`fetch ${response.status}`);
          const webp = await toScreenshotWebp(Buffer.from(await response.arrayBuffer()));
          const hash = createHash('sha256').update(webp).digest('hex');
          if (hash === screenshot.hash) return;

          const r2Url = await uploadToR2(screenshotKey(screenshot.app.slug, screenshot.position, hash), webp, 'image/webp');
          await prisma.screenshot.update({ where: { id: screenshot.id }, data: { r2Url, hash } });
          updated++;
        } catch (error) {
          failures++;
          console.warn(`   ⚠️  ${label}: ${(error as Error).message}`);
        }
      }),
    );
    console.log(`   ${Math.min(start + CONCURRENCY, screenshots.length)}/${screenshots.length}`);
  }

  console.log(`✅ Done. ${updated} updated, ${failures} failed.`);
}

main().finally(() => prisma.$disconnect());
