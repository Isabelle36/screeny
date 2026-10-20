import { getGalleryData } from '@/lib/db/gallery';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawOffset = Number(url.searchParams.get('offset') ?? 0);
  const offset = Number.isSafeInteger(rawOffset) ? Math.max(0, rawOffset) : 0;
  const mascotsOnly = url.searchParams.get('mascotsOnly') === 'true';
  const data = await getGalleryData({ offset, mascotsOnly });

  return Response.json(data, {
    headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=600' },
  });
}
