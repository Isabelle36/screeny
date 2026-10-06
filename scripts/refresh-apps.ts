import { Prisma, PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { lookupApps, type AppStoreLookup } from './app-store-lookup';
import { ingestApp } from './ingest';

dotenv.config();

const prisma = new PrismaClient();

const CONCURRENCY = 3;

const releaseTime = (lookup: AppStoreLookup | undefined) => {
  const time = lookup?.currentVersionReleaseDate ? Date.parse(lookup.currentVersionReleaseDate) : NaN;
  return Number.isNaN(time) ? null : time;
};

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const refreshEverything = process.argv.includes('--all');

  const apps = await prisma.app.findMany({ select: { id: true, trackId: true, name: true, sourceUpdatedAt: true } });
  const lookups = await lookupApps(apps.map((app) => app.trackId.toString()));

  const missing = apps.filter((app) => !lookups.has(app.trackId.toString()));
  const updated = apps.filter((app) => {
    const lookup = lookups.get(app.trackId.toString());
    if (!lookup) return false;
    if (refreshEverything) return true;
    const released = releaseTime(lookup);
    return released !== null && (!app.sourceUpdatedAt || released > app.sourceUpdatedAt.getTime());
  });
  const unchanged = apps.filter((app) => lookups.has(app.trackId.toString()) && !updated.includes(app));

  console.log(`🔎 ${apps.length} apps checked: ${updated.length} with a new version, ${unchanged.length} unchanged, ${missing.length} no longer on the App Store`);
  if (updated.length > 0) console.log(`   New versions: ${updated.map((app) => app.name).join(', ')}`);
  if (missing.length > 0) console.log(`   Missing from the App Store (not deleted): ${missing.map((app) => app.name).join(', ')}`);
  if (isDryRun) return;

  for (const app of unchanged) {
    await prisma.app.update({
      where: { id: app.id },
      data: { metadata: lookups.get(app.trackId.toString()) as Prisma.InputJsonObject, lastCheckedAt: new Date() },
    });
  }
  console.log(`📝 Refreshed ratings, price and description for ${unchanged.length} unchanged apps`);

  const failed: string[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < updated.length) {
        const app = updated[next++];
        try {
          await ingestApp(app.trackId.toString(), { maxScreenshots: 10, forceReingest: true });
        } catch (error) {
          failed.push(app.name);
          console.warn(`⚠️  ${app.name}: ${(error as Error).message}`);
        }
      }
    }),
  );

  console.log(`✅ Re-imported ${updated.length - failed.length} of ${updated.length}. Failed: ${failed.join(', ') || 'none'}`);
  if (failed.length > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(`❌ ${(error as Error).message}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
