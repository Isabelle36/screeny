import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import dotenv from 'dotenv';
import { extractTrackIds, lookupApps } from './app-store-lookup';
import { ingestApp } from './ingest';

dotenv.config();

const prisma = new PrismaClient();

const MIN_SCREENSHOTS = 3;
const CONCURRENCY = 4;
const USAGE = 'Usage: npm run import:apps -- <track-ids.json> [--dry-run]\n   or: npm run import:apps -- --ids "<App Store IDs or links>" [--dry-run]';

function readRequestedIds() {
  const args = process.argv.slice(2);
  const idsFlag = args.indexOf('--ids');
  if (idsFlag !== -1) return extractTrackIds(args[idsFlag + 1] ?? '');
  const [file] = args.filter((arg) => !arg.startsWith('--'));
  if (!file) throw new Error(USAGE);
  return [...new Set((JSON.parse(fs.readFileSync(file, 'utf8')) as (string | number)[]).map(String))];
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const requested = readRequestedIds();
  if (requested.length === 0) throw new Error(`No App Store IDs found.\n${USAGE}`);

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
  console.log(`   ${importable.length} to import${importable.length > 0 ? `: ${importable.map((id) => lookups.get(id)?.trackName ?? id).join(', ')}` : ''}`);
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

  const imported = importable.filter((id) => !stillFailing.includes(id));
  if (imported.length > 0) {
    await prisma.submission.updateMany({
      where: { trackId: { in: imported.map((id) => BigInt(id)) } },
      data: { status: 'imported' },
    });
  }

  console.log(`✅ Imported ${imported.length} of ${importable.length}. Failed: ${stillFailing.join(', ') || 'none'}`);
  if (stillFailing.length > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(`❌ ${(error as Error).message}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
