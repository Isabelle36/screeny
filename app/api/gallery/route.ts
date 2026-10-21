import { getGalleryData } from '@/lib/db/gallery';
import { GALLERY_PAGE_SIZE, MAX_GALLERY_PAGE_SIZE } from '@/lib/gallery-config';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawOffset = Number(url.searchParams.get('offset') ?? 0);
  const offset = Number.isSafeInteger(rawOffset) ? Math.max(0, rawOffset) : 0;
  const rawLimit = Number(url.searchParams.get('limit') ?? GALLERY_PAGE_SIZE);
  const limit = Number.isSafeInteger(rawLimit)
    ? Math.min(MAX_GALLERY_PAGE_SIZE, Math.max(1, rawLimit))
    : GALLERY_PAGE_SIZE;
  const mascotsOnly = url.searchParams.get('mascotsOnly') === 'true';
  const data = await getGalleryData({ offset, mascotsOnly, limit });

  return Response.json(data, {
    headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=600' },
  });
}
