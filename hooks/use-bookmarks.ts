'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { bookmarkKey, listBookmarks, removeBookmark, type Bookmark, type BookmarkKind } from '@/lib/bookmarks-store';
import { openLoginModal } from '@/hooks/use-login-modal';
import { playSound } from '@/lib/sound';

type AccountBookmark = { kind: BookmarkKind; appId: string; savedAt: number };

const JSON_HEADERS = { 'Content-Type': 'application/json' };

const toMap = (list: Bookmark[]) => new Map(list.map((bookmark) => [bookmark.id, bookmark]));

async function loadDeviceBookmarks(): Promise<Bookmark[]> {
  return (await listBookmarks()).filter((bookmark) => bookmark.kind === 'screenshots');
}

async function syncToAccount(deviceBookmarks: Bookmark[]): Promise<Bookmark[]> {
  if (deviceBookmarks.length > 0) {
    const upload = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ bookmarks: deviceBookmarks.map(({ kind, appId, savedAt }) => ({ kind, appId, savedAt })) }),
    });
    if (!upload.ok) throw new Error(`Bookmark upload failed (${upload.status})`);
  }
  const response = await fetch('/api/bookmarks');
  if (!response.ok) throw new Error(`Bookmark fetch failed (${response.status})`);
  const { bookmarks } = (await response.json()) as { bookmarks: AccountBookmark[] };
  return bookmarks
    .filter((bookmark) => bookmark.kind === 'screenshots')
    .map((bookmark) => ({ ...bookmark, id: bookmarkKey(bookmark.kind, bookmark.appId) }));
}

export function useBookmarks() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [bookmarks, setBookmarks] = useState<Map<string, Bookmark>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!isLoaded) return () => { cancelled = true; };
    if (!isSignedIn) {
      setBookmarks(new Map());
      setIsLoading(false);
      return () => { cancelled = true; };
    }
    setIsLoading(true);
    const load = async () => {
      const deviceBookmarks = await loadDeviceBookmarks().catch(() => []);
      try {
        const accountBookmarks = await syncToAccount(deviceBookmarks);
        await Promise.allSettled(deviceBookmarks.map((bookmark) => removeBookmark(bookmark.id)));
        return accountBookmarks;
      } catch {
        return deviceBookmarks;
      }
    };
    load().then((list) => {
      if (!cancelled) {
        setBookmarks(toMap(list));
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId]);

  const isSaved = (kind: BookmarkKind, appId: string) => bookmarks.has(bookmarkKey(kind, appId));

  const toggleSaved = (kind: BookmarkKind, appId: string) => {
    if (!isLoaded || isSignedIn === undefined || (isSignedIn && isLoading)) return;
    if (!isSignedIn) {
      openLoginModal();
      return;
    }
    const id = bookmarkKey(kind, appId);
    const isRemoving = bookmarks.has(id);
    const bookmark: Bookmark = bookmarks.get(id) ?? { id, appId, kind, savedAt: Date.now() };
    const applyChange = (remove: boolean) =>
      setBookmarks((current) => {
        const next = new Map(current);
        if (remove) next.delete(id);
        else next.set(id, bookmark);
        return next;
      });

    applyChange(isRemoving);
    playSound(isRemoving ? 'toggle-off' : 'toggle-on');

    fetch('/api/bookmarks', {
      method: isRemoving ? 'DELETE' : 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(isRemoving ? { kind, appId } : { bookmarks: [{ kind, appId, savedAt: bookmark.savedAt }] }),
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Bookmark ${isRemoving ? 'delete' : 'save'} failed (${response.status})`);
      })
      .catch(() => applyChange(!isRemoving));
  };

  const screenshotBookmarkCount = [...bookmarks.values()].filter((bookmark) => bookmark.kind === 'screenshots').length;
  return { savedCount: screenshotBookmarkCount, isSaved, toggleSaved, canBookmark: isLoaded && Boolean(isSignedIn), isLoading: isSignedIn === true && isLoading };
}
