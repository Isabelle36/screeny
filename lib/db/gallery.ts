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
  darkScreenshots: boolean;
  screenshots: GalleryScreenshot[];
};

export const GALLERY_PAGE_SIZE = 18;
const MAX_SCREENSHOTS_PER_APP = 10;

function normalizeCategoryLabel(raw: string) {
  return raw.trim().replace(/\s+/g, ' ');
}

export async function getGalleryData({ offset = 0, mascotsOnly = false }: { offset?: number; mascotsOnly?: boolean } = {}) {
  const where = mascotsOnly ? { hasMascot: true } : undefined;
  const [rows, total, categoryRows] = await Promise.all([
    prisma.app.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { name: 'asc' }, { id: 'asc' }],
      skip: offset,
      take: GALLERY_PAGE_SIZE + 1,
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
    }),
    prisma.app.count({ where }),
    prisma.app.findMany({ select: { category: true } }),
  ]);

  const apps = rows.slice(0, GALLERY_PAGE_SIZE).map((app) => ({
    ...app,
    name: app.name.trim() || 'Untitled app',
    developer: app.developer.trim(),
    iconUrl: app.iconUrl.trim(),
    category: normalizeCategoryLabel(app.category) || 'Uncategorized',
    screenshots: app.screenshots.filter((screenshot) => screenshot.r2Url.trim() !== ''),
  }));

  const categories = [...new Set(categoryRows.map((row) => normalizeCategoryLabel(row.category) || 'Uncategorized'))]
    .sort((a, b) => a.localeCompare(b));

  return {
    apps,
    categories,
    total,
    nextOffset: offset + apps.length,
    hasMore: offset + apps.length < total,
  };
}
