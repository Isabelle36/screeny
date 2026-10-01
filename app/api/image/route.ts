import type { NextRequest } from 'next/server';

// Same-origin copy of one of our R2 images. The browser needs it for two things: copying to the
// clipboard (the canvas must be able to read the pixels) and saving with a filename (the download
// attribute only works same-origin). Only URLs on our own bucket are served — never an open proxy.
export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get('src') ?? '';
  const filename = request.nextUrl.searchParams.get('filename');
  if (!isOwnImage(src)) return new Response('Not found', { status: 404 });

  const upstream = await fetch(src);
  if (!upstream.ok || !upstream.body) return new Response('Not found', { status: 404 });

  const headers = new Headers({
    'Content-Type': upstream.headers.get('Content-Type') ?? 'image/webp',
    'Cache-Control': 'public, max-age=86400',
  });
  if (filename) headers.set('Content-Disposition', `attachment; filename="${filename.replace(/[^\w.-]+/g, '-')}"`);
  return new Response(upstream.body, { headers });
}

function isOwnImage(src: string) {
  const publicBase = process.env.R2_PUBLIC_URL;
  if (!publicBase) return false;
  try {
    return new URL(src).origin === new URL(publicBase).origin;
  } catch {
    return false;
  }
}
