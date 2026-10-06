import { auth, clerkClient } from '@clerk/nextjs/server';
import { removeAllUserBookmarks } from '@/lib/db/bookmarks';

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Sign in to delete your account.' }, { status: 401 });
  await removeAllUserBookmarks(userId);
  const client = await clerkClient();
  await client.users.deleteUser(userId);
  return Response.json({ deleted: true });
}
