import { ingestApp } from './ingest';

async function scrapeEditorial() {
  console.log(`🔍 Scraping Apple Top Featured Apps feed...\n`);

  // Fetch top 25 Productivity and Lifestyle apps from Apple RSS
  const rssUrl = `https://itunes.apple.com/us/rss/topfreeapplications/limit=25/genre=6007/json`;
  const res = await fetch(rssUrl);
  const data = await res.json();
  const entries = data.feed?.entry || [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const trackIdStr = entry.id?.attributes?.['im:id'];
    const trackId = parseInt(trackIdStr, 10);

    if (!trackId) continue;

    console.log(`[${i + 1}/${entries.length}] Candidate ID: ${trackId}`);
    try {
      await ingestApp(trackId, { maxScreenshots: 10 });
    } catch (err) {
      console.error(`Skipped candidate ${trackId}:`, err);
    }

    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`\n🎉 Editorial scrape complete!`);
}

scrapeEditorial();