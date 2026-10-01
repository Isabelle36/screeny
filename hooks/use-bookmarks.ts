'use client';

import { useEffect, useState } from 'react';
import { addBookmark, bookmarkKey, listBookmarks, removeBookmark, type Bookmark, type BookmarkKind } from '@/lib/bookmarks-store';
import { playSound } from '@/lib/sound';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Map<string, Bookmark>>(new Map());

  useEffect(() => {
    listBookmarks()
      .then((list) => {
        const next = new Map<string, Bookmark>();
        for (const bookmark of list) {
          if (!bookmark.kind) continue;
          if (bookmark.kind === 'icon') {
            const migrated = { ...bookmark, kind: 'screenshots' as const, id: bookmarkKey('screenshots', bookmark.appId) };
            next.set(migrated.id, migrated);
            addBookmark(migrated).then(() => removeBookmark(bookmark.id)).catch(() => {});
          } else {
            next.set(bookmark.id, bookmark);
          }
        }
        setBookmarks(next);
      })
      .catch(() => {});
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
