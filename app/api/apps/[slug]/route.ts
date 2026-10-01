import { getAppDetail } from '@/lib/db/app-detail';

// Details for the in-gallery app view: App Store description and facts, and every screenshot
// (the gallery payload carries only the first few per app).
export async function GET(_request: Request, context: RouteContext<'/api/apps/[slug]'>) {
  const { slug } = await context.params;
  const app = await getAppDetail(slug);
  if (!app) return Response.json({ error: 'App not found' }, { status: 404 });
  return Response.json(app, { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' } });
}
