import { cache } from 'react';
import { prisma } from './client';
import type { GalleryApp } from './gallery';

// Everything the app page shows: the gallery fields plus App Store details read from App.metadata
// (the iTunes lookup saved at ingest). Any of those can be missing, so each one falls back to ''/null.
export type AppDetail = GalleryApp & {
  description: string;
  rating: number | null;
  ratingCount: number | null;
  price: string;
  updatedAt: string | null;
  appStoreUrl: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// cache(): generateMetadata and the page ask for the same app during one request.
export const getAppDetail = cache(async (slug: string): Promise<AppDetail | null> => {
  const row = await prisma.app.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      developer: true,
      iconUrl: true,
      category: true,
      hasMascot: true,
      darkScreenshots: true,
      metadata: true,
      screenshots: { orderBy: { position: 'asc' }, select: { id: true, r2Url: true, position: true } },
    },
  });
  if (!row) return null;

  const { metadata, ...app } = row;
  const store = isRecord(metadata) ? metadata : {};
  const text = (key: string) => (typeof store[key] === 'string' ? (store[key] as string).trim() : '');
  const number = (key: string) => (typeof store[key] === 'number' ? (store[key] as number) : null);

  return {
    ...app,
    name: app.name.trim() || 'Untitled app',
    developer: app.developer.trim(),
    category: app.category.trim().replace(/\s+/g, ' ') || 'Uncategorized',
    screenshots: app.screenshots.filter((screenshot) => screenshot.r2Url.trim() !== ''),
    description: text('description'),
    rating: number('averageUserRating'),
    ratingCount: number('userRatingCount'),
    price: text('formattedPrice'),
    updatedAt: text('currentVersionReleaseDate') || null,
    appStoreUrl: text('trackViewUrl') || null,
  };
});
