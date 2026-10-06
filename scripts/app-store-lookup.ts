export type AppStoreLookup = {
  trackId: number;
  trackName?: string;
  kind?: string;
  screenshotUrls?: string[];
  currentVersionReleaseDate?: string;
  [field: string]: unknown;
};

const STOREFRONTS = ['us', 'in', 'gb'];
const LOOKUP_BATCH = 100;

export async function lookupApps(trackIds: string[]) {
  const found = new Map<string, AppStoreLookup>();
  for (const country of STOREFRONTS) {
    const pending = trackIds.filter((id) => !found.has(id));
    for (let start = 0; start < pending.length; start += LOOKUP_BATCH) {
      const ids = pending.slice(start, start + LOOKUP_BATCH).join(',');
      const response = await fetch(`https://itunes.apple.com/lookup?id=${ids}&country=${country}`);
      if (!response.ok) throw new Error(`App Store lookup failed: ${response.status}`);
      const { results = [] } = (await response.json()) as { results?: AppStoreLookup[] };
      results.forEach((result) => found.set(String(result.trackId), result));
    }
  }
  return found;
}

export function extractTrackIds(text: string) {
  return [...new Set(text.match(/\d{6,12}/g) ?? [])];
}
