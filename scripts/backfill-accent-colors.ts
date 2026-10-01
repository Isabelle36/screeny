import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { extractAccentColor, hasDarkScreenshots } from '../lib/color/accent-color';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const recomputeAll = process.argv.includes('--all');
  const apps = await prisma.app.findMany({
    where: recomputeAll ? {} : { accentColor: null },
    select: {
      id: true,
      name: true,
      iconUrl: true,
      screenshots: { orderBy: { position: 'asc' }, take: 3, select: { r2Url: true } },
    },
  });
  console.log(`🎨 Extracting accent colors for ${apps.length} apps...`);

  let failures = 0;
  const CONCURRENCY = 8;
  const download = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`fetch ${response.status} ${url}`);
    return Buffer.from(await response.arrayBuffer());
  };
  for (let start = 0; start < apps.length; start += CONCURRENCY) {
    await Promise.all(
      apps.slice(start, start + CONCURRENCY).map(async (app) => {
        try {
          const screenshots = await Promise.all(app.screenshots.filter((s) => s.r2Url).map((s) => download(s.r2Url)));
          const icon = app.iconUrl ? await download(app.iconUrl).catch(() => undefined) : undefined;
          const accentColor = await extractAccentColor({ screenshots, icon });
          const darkScreenshots = await hasDarkScreenshots(screenshots);
          await prisma.app.update({ where: { id: app.id }, data: { accentColor, darkScreenshots } });
          console.log(`   ${accentColor} ${darkScreenshots ? 'dark ' : 'light'}  ${app.name}`);
        } catch (error) {
          failures++;
          console.warn(`   ⚠️  ${app.name}: ${(error as Error).message}`);
        }
      }),
    );
  }

  console.log(`✅ Done. ${apps.length - failures} updated, ${failures} skipped.`);
}

main().finally(() => prisma.$disconnect());
