import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import dotenv from 'dotenv';
import { ingestApp } from './ingest';

dotenv.config();

const prisma = new PrismaClient();

const STOREFRONTS = ['us', 'in', 'gb'];
const LOOKUP_BATCH = 100;
const MIN_SCREENSHOTS = 3;
const CONCURRENCY = 4;

type LookupResult = { trackId: number; trackName: string; kind?: string; screenshotUrls?: string[] };

async function lookupApps(trackIds: string[]) {
  const found = new Map<string, LookupResult>();
  for (const country of STOREFRONTS) {
    const pending = trackIds.filter((id) => !found.has(id));
    for (let start = 0; start < pending.length; start += LOOKUP_BATCH) {
      const ids = pending.slice(start, start + LOOKUP_BATCH).join(',');
      const response = await fetch(`https://itunes.apple.com/lookup?id=${ids}&country=${country}`);
      if (!response.ok) throw new Error(`App Store lookup failed: ${response.status}`);
      const { results = [] } = (await response.json()) as { results?: LookupResult[] };
      results.forEach((result) => found.set(String(result.trackId), result));
    }
  }
  return found;
}

async function main() {
  const [file] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
  const isDryRun = process.argv.includes('--dry-run');
  if (!file) throw new Error('Usage: npm run import:apps -- <track-ids.json> [--dry-run]');

  const requested = [...new Set((JSON.parse(fs.readFileSync(file, 'utf8')) as (string | number)[]).map(String))];
  const existing = new Set((await prisma.app.findMany({ select: { trackId: true } })).map((app) => app.trackId.toString()));
  const newIds = requested.filter((id) => !existing.has(id));
  const lookups = await lookupApps(newIds);

  const notOnStore = newIds.filter((id) => !lookups.has(id));
  const notIphone = newIds.filter((id) => lookups.has(id) && lookups.get(id)!.kind !== 'software');
  const tooFewScreenshots = newIds.filter(
    (id) => lookups.get(id)?.kind === 'software' && (lookups.get(id)!.screenshotUrls?.length ?? 0) < MIN_SCREENSHOTS,
  );
  const importable = newIds.filter(
    (id) => lookups.get(id)?.kind === 'software' && lookups.get(id)!.screenshotUrls!.length >= MIN_SCREENSHOTS,
  );

  console.log(`📋 ${requested.length} requested, ${requested.length - newIds.length} already in Screeny`);
  console.log(`   ${notOnStore.length} not on the App Store, ${notIphone.length} not iPhone apps, ${tooFewScreenshots.length} with < ${MIN_SCREENSHOTS} screenshots`);
  console.log(`   ${importable.length} to import`);
  if (isDryRun) return;

  const queue = [...importable].reverse();
  const failed: string[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < queue.length) {
        const trackId = queue[next++];
        try {
          await ingestApp(trackId, { maxScreenshots: 10 });
        } catch (error) {
          failed.push(trackId);
          console.warn(`⚠️  ${lookups.get(trackId)?.trackName ?? trackId}: ${(error as Error).message}`);
        }
      }
    }),
  );

  const stillFailing: string[] = [];
  for (const trackId of failed) {
    try {
      await ingestApp(trackId, { maxScreenshots: 10, forceReingest: true });
    } catch (error) {
      stillFailing.push(trackId);
      console.warn(`⚠️  Retry failed for ${lookups.get(trackId)?.trackName ?? trackId}: ${(error as Error).message}`);
    }
  }

  console.log(`✅ Imported ${importable.length - stillFailing.length} of ${importable.length}. Failed: ${stillFailing.join(', ') || 'none'}`);
}

main().finally(() => prisma.$disconnect());
