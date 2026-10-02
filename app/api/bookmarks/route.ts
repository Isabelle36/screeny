import { auth } from '@clerk/nextjs/server';
import { addUserBookmarks, BOOKMARK_KINDS, listUserBookmarks, removeUserBookmark, type StoredBookmark } from '@/lib/db/bookmarks';

const MAX_BATCH = 500;

const unauthorized = () => Response.json({ error: 'Sign in to sync bookmarks.' }, { status: 401 });

function parseBookmark(value: unknown): StoredBookmark | null {
  if (typeof value !== 'object' || value === null) return null;
  const { kind, appId, savedAt } = value as Record<string, unknown>;
  if (typeof kind !== 'string' || !BOOKMARK_KINDS.has(kind)) return null;
  if (typeof appId !== 'string' || appId.length === 0 || appId.length > 64) return null;
  const time = typeof savedAt === 'number' && Number.isFinite(savedAt) ? savedAt : Date.now();
  return { kind, appId, savedAt: Math.min(time, Date.now()) };
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();
  return Response.json({ bookmarks: await listUserBookmarks(userId) });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();
  const body = await request.json().catch(() => null);
  const list: unknown[] = Array.isArray(body?.bookmarks) ? body.bookmarks.slice(0, MAX_BATCH) : [];
  const bookmarks = list.map(parseBookmark).filter((bookmark): bookmark is StoredBookmark => bookmark !== null);
  await addUserBookmarks(userId, bookmarks);
  return Response.json({ saved: bookmarks.length });
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();
  const bookmark = parseBookmark(await request.json().catch(() => null));
  if (!bookmark) return Response.json({ error: 'Invalid bookmark.' }, { status: 400 });
  await removeUserBookmark(userId, bookmark.kind, bookmark.appId);
  return Response.json({ removed: true });
}
