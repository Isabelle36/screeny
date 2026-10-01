'use server';

import { ingestApp, IngestOptions } from '@/scripts/ingest';

// Helper to parse Apple App Store URLs (e.g., https://apps.apple.com/us/app/duolingo/id570060128)
function extractTrackId(input: string): number | null {
  const match = input.match(/id(\d+)/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  
  // Direct numeric ID input
  const numeric = parseInt(input, 10);
  return isNaN(numeric) ? null : numeric;
}

export async function submitAppAction(formData: FormData) {
  const urlOrId = formData.get('urlOrId') as string;
  const hasMascot = formData.get('hasMascot') === 'on';
  const rawTags = (formData.get('tags') as string) || '';

  const trackId = extractTrackId(urlOrId);

  if (!trackId) {
    return { success: false, error: 'Invalid App Store URL or Track ID.' };
  }

  const tags = rawTags
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  try {
    const options: IngestOptions = {
      hasMascot,
      tags,
      maxScreenshots: 10,
    };

    await ingestApp(trackId, options);
    return { success: true, message: 'App ingested successfully!' };
  } catch (error: unknown) {
    console.error('Submission Ingestion Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to ingest app.' };
  }
}