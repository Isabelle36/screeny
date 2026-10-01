import { prisma } from './client';

export type GalleryScreenshot = { id: string; r2Url: string; position: number };

export type GalleryApp = {
  id: string;
  slug: string;
  name: string;
  developer: string;
  iconUrl: string;
  category: string;
  hasMascot: boolean;
  // Screenshots are mostly dark UI → darker card frame. Judged at ingest.
  darkScreenshots: boolean;
  screenshots: GalleryScreenshot[];
};

const MAX_SCREENSHOTS_PER_APP = 10;

// Collapse near-duplicates like "Social Networking " / "social networking" into one label.
function normalizeCategoryLabel(raw: string) {
  return raw.trim().replace(/\s+/g, ' ');
}

export async function getGalleryData(): Promise<{ apps: GalleryApp[]; categories: string[] }> {
  const rows = await prisma.app.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      slug: true,
      name: true,
      developer: true,
      iconUrl: true,
      category: true,
      hasMascot: true,
      darkScreenshots: true,
      screenshots: {
        orderBy: { position: 'asc' },
        take: MAX_SCREENSHOTS_PER_APP,
        select: { id: true, r2Url: true, position: true },
      },
    },
  });

  // Defensive normalisation: the UI must never render an empty title, an "undefined" category or a
  // screenshot slot with no URL, whatever ends up in a row.
  const labelByKey = new Map<string, string>();
  const apps = rows.map((app) => {
    const label = normalizeCategoryLabel(app.category) || 'Uncategorized';
    const key = label.toLowerCase();
    if (!labelByKey.has(key)) labelByKey.set(key, label);
    return {
      ...app,
      name: app.name.trim() || 'Untitled app',
      developer: app.developer.trim(),
      iconUrl: app.iconUrl.trim(),
      category: labelByKey.get(key)!,
      screenshots: app.screenshots.filter((screenshot) => screenshot.r2Url.trim() !== ''),
    };
  });

  const categories = [...labelByKey.values()].sort((a, b) => a.localeCompare(b));
  return { apps, categories };
}
