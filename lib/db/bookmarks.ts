import { Prisma } from '@prisma/client';
import { prisma } from './client';

export type StoredBookmark = { kind: string; appId: string; savedAt: number };

export const BOOKMARK_KINDS = new Set(['screenshots', 'icon']);

export async function listUserBookmarks(userId: string): Promise<StoredBookmark[]> {
  const rows = await prisma.$queryRaw<{ kind: string; appId: string; createdAt: Date }[]>`
    SELECT "kind", "appId", "createdAt" FROM "Bookmark" WHERE "userId" = ${userId} ORDER BY "createdAt" DESC`;
  return rows.map((row) => ({ kind: row.kind, appId: row.appId, savedAt: row.createdAt.getTime() }));
}

export async function addUserBookmarks(userId: string, bookmarks: StoredBookmark[]) {
  if (bookmarks.length === 0) return;
  const values = bookmarks.map(
    (bookmark) => Prisma.sql`(${userId}::text, ${bookmark.kind}::text, ${bookmark.appId}::text, ${new Date(bookmark.savedAt).toISOString()}::timestamp)`,
  );
  await prisma.$executeRaw`
    INSERT INTO "Bookmark" ("userId", "kind", "appId", "createdAt")
    SELECT v."userId", v."kind", v."appId", v."createdAt"
    FROM (VALUES ${Prisma.join(values)}) AS v("userId", "kind", "appId", "createdAt")
    WHERE EXISTS (SELECT 1 FROM "App" WHERE "App"."id" = v."appId")
    ON CONFLICT DO NOTHING`;
}

export async function removeUserBookmark(userId: string, kind: string, appId: string) {
  await prisma.$executeRaw`DELETE FROM "Bookmark" WHERE "userId" = ${userId} AND "kind" = ${kind} AND "appId" = ${appId}`;
}
