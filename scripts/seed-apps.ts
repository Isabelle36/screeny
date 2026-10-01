import { ingestApp, IngestOptions } from './ingest';

interface SeedItem {
  trackId: string;
  options: IngestOptions;
}

/** App Store IDs extracted from the mascot and non-mascot HTML catalog. */
const VERIFIED_TRACK_IDS = [
 '6745759423'
];

const MASCOT_TRACK_IDS = new Set<string>();


/**
 * Special metadata for apps where we already know
 * additional information.
 */
const VERIFIED_BENCHMARKS: SeedItem[] = VERIFIED_TRACK_IDS.map(
  (trackId) => ({
    trackId,
    options: MASCOT_TRACK_IDS.has(trackId) ? { hasMascot: true } : {},
  })
);

async function seed() {
  console.log(
    `🌱 Seeding ${VERIFIED_BENCHMARKS.length} verified apps...\n`
  );

  console.log(`📸 Max screenshots per app: 10`);
  for (let i = 0; i < VERIFIED_BENCHMARKS.length; i++) {
    const item = VERIFIED_BENCHMARKS[i];

    console.log(`--------------------------------------------------`);
    console.log(
      `[${i + 1}/${VERIFIED_BENCHMARKS.length}] Track ID: ${item.trackId}`
    );

    try {
      await ingestApp(item.trackId, {
        ...item.options,
        maxScreenshots: 10,
      });

      console.log(`✅ Imported ${item.trackId}`);
    } catch (err) {
      console.error(
        `❌ Error importing ${item.trackId}:`,
        err
      );
    }

    if (i < VERIFIED_BENCHMARKS.length - 1) {
      await new Promise((resolve) =>
        setTimeout(resolve, 1200)
      );
    }
  }

  console.log(
    `\n🎉 Verified benchmarks seeded successfully!`
  );
}

seed();