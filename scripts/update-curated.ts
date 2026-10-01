import { PrismaClient } from '@prisma/client';
import { ingestApp } from './ingest';

const prisma = new PrismaClient();

async function updateCuratedApps() {
  const apps = await prisma.app.findMany({
    where: { curated: true },
    select: { trackId: true, name: true },
    orderBy: { name: 'asc' },
  });

  console.log(`🔄 Checking ${apps.length} curated app(s)...`);

  for (const app of apps) {
    try {
      await ingestApp(app.trackId.toString(), {
        forceReingest: true,
        maxScreenshots: 10,
      });
    } catch (error) {
      console.error(`❌ Failed to update "${app.name}":`, error);
    }
  }
}

updateCuratedApps()
  .catch((error) => {
    console.error('❌ Curated update failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());