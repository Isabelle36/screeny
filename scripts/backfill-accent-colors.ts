import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { extractAccentColor } from '../lib/color/accent-color';

dotenv.config();

const prisma = new PrismaClient();

// One-off (and re-runnable) backfill for App.accentColor.
// New apps get their color in ingest.ts; pass --all to recompute every app after tuning the algorithm.
async function main() {
  const recomputeAll = process.argv.includes('--all');
  const apps = await prisma.app.findMany({
    where: recomputeAll ? {} : { accentColor: null },
    select: { id: true, name: true, iconUrl: true },
  });
  console.log(`🎨 Extracting accent colors for ${apps.length} apps...`);

  let failures = 0;
  for (const app of apps) {
    try {
      if (!app.iconUrl) throw new Error('no icon');
      const response = await fetch(app.iconUrl);
      if (!response.ok) throw new Error(`icon fetch ${response.status}`);
      const accentColor = await extractAccentColor(Buffer.from(await response.arrayBuffer()));
      await prisma.app.update({ where: { id: app.id }, data: { accentColor } });
      console.log(`   ${accentColor}  ${app.name}`);
    } catch (error) {
      failures++;
      console.warn(`   ⚠️  ${app.name}: ${(error as Error).message}`);
    }
  }

  console.log(`✅ Done. ${apps.length - failures} updated, ${failures} skipped.`);
}

main().finally(() => prisma.$disconnect());
