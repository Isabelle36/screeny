import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

type DemoSeed = {
  apps: Array<{
    trackId: string;
    slug: string;
    name: string;
    developer: string;
    iconUrl: string;
    category: string;
    hasMascot: boolean;
    accentColor: string | null;
    darkScreenshots: boolean;
    tags: string[];
    screenshots: Array<{ r2Url: string; position: number }>;
  }>;
};

const seed = JSON.parse(readFileSync('prisma/demo-seed.json', 'utf8')) as DemoSeed;
const prisma = new PrismaClient();

async function main() {
  for (const app of seed.apps) {
    const savedApp = await prisma.app.upsert({
      where: { trackId: BigInt(app.trackId) },
      create: {
        ...appFields(app),
        trackId: BigInt(app.trackId),
      },
      update: appFields(app),
      select: { id: true },
    });

    for (const screenshot of app.screenshots) {
      const existing = await prisma.screenshot.findFirst({
        where: { appId: savedApp.id, position: screenshot.position },
        select: { id: true },
      });

      if (existing) {
        await prisma.screenshot.update({
          where: { id: existing.id },
          data: { r2Url: screenshot.r2Url },
        });
      } else {
        await prisma.screenshot.create({
          data: {
            appId: savedApp.id,
            r2Url: screenshot.r2Url,
            position: screenshot.position,
          },
        });
      }
    }
  }

  console.log(`Seeded ${seed.apps.length} demo apps and their public image URLs.`);
}

function appFields(app: DemoSeed['apps'][number]) {
  return {
    slug: app.slug,
    name: app.name,
    developer: app.developer,
    iconUrl: app.iconUrl,
    category: app.category,
    hasMascot: app.hasMascot,
    accentColor: app.accentColor,
    darkScreenshots: app.darkScreenshots,
    tags: app.tags,
  };
}

main()
  .catch((error: unknown) => {
    console.error('Could not seed demo apps:', error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
