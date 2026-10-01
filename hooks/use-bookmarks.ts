'use client';

import { useEffect, useState } from 'react';
import { addBookmark, bookmarkKey, listBookmarks, removeBookmark, type Bookmark, type BookmarkKind } from '@/lib/bookmarks-store';
import { playSound } from '@/lib/sound';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Map<string, Bookmark>>(new Map());

  useEffect(() => {
    listBookmarks()
      // Entries from the older per-screenshot format have no `kind`; they're simply not shown.
      .then((list) => setBookmarks(new Map(list.filter((bookmark) => bookmark.kind).map((bookmark) => [bookmark.id, bookmark]))))
      .catch(() => {}); // IndexedDB unavailable (private mode etc.) — saving just won't persist.
  }, []);

  const isSaved = (kind: BookmarkKind, appId: string) => bookmarks.has(bookmarkKey(kind, appId));

  const toggleSaved = (kind: BookmarkKind, appId: string) => {
    const id = bookmarkKey(kind, appId);
    const next = new Map(bookmarks);
    if (next.has(id)) {
      next.delete(id);
      removeBookmark(id).catch(() => {});
    } else {
      const bookmark = { id, appId, kind, savedAt: Date.now() };
      next.set(id, bookmark);
      addBookmark(bookmark).catch(() => {});
    }
    setBookmarks(next);
    playSound('toggle', { direction: next.has(id) ? 'forward' : 'back' });
  };

  return { savedCount: bookmarks.size, isSaved, toggleSaved };
}
