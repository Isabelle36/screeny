'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useRef, useState } from 'react';
import { addBookmark, bookmarkKey, listBookmarks, removeBookmark, type Bookmark, type BookmarkKind } from '@/lib/bookmarks-store';
import { openLoginModal } from '@/hooks/use-login-modal';
import { playSound } from '@/lib/sound';

type AccountBookmark = { kind: BookmarkKind; appId: string; savedAt: number };

const JSON_HEADERS = { 'Content-Type': 'application/json' };

const toMap = (list: Bookmark[]) => new Map(list.map((bookmark) => [bookmark.id, bookmark]));

async function loadDeviceBookmarks(userId: string): Promise<Bookmark[]> {
  return (await listBookmarks()).filter(
    (bookmark) => bookmark.kind === 'screenshots' && (!bookmark.userId || bookmark.userId === userId),
  );
}

async function syncToAccount(deviceBookmarks: Bookmark[]): Promise<Bookmark[]> {
  if (deviceBookmarks.length > 0) {
    const upload = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ bookmarks: deviceBookmarks.map(({ kind, appId, savedAt }) => ({ kind, appId, savedAt })) }),
    });
    if (!upload.ok) throw new Error(`Bookmark upload failed (${upload.status})`);
    const { saved } = (await upload.json()) as { saved: number };
    if (saved !== deviceBookmarks.length) throw new Error('Bookmark upload was not fully confirmed');
  }
  const response = await fetch('/api/bookmarks', { cache: 'no-store' });
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
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const pendingRef = useRef(new Set<string>());
  const ownerRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!isLoaded) return () => { cancelled = true; };
    if (!isSignedIn) {
      ownerRef.current = null;
      setBookmarks(new Map());
      setIsLoading(false);
      setLoadError(null);
      return () => { cancelled = true; };
    }
    if (ownerRef.current !== userId) {
      ownerRef.current = userId;
      setBookmarks(new Map());
    }
    setIsLoading(true);
    const load = async () => {
      const deviceBookmarks = await loadDeviceBookmarks(userId).catch(() => []);
      try {
        const accountBookmarks = await syncToAccount(deviceBookmarks);
        const confirmed = new Set(accountBookmarks.map((bookmark) => bookmark.id));
        const syncedDeviceBookmarks = deviceBookmarks.filter((bookmark) => confirmed.has(bookmark.id));
        await Promise.allSettled(syncedDeviceBookmarks.map((bookmark) => removeBookmark(bookmark.id)));
        return [...accountBookmarks, ...deviceBookmarks.filter((bookmark) => !confirmed.has(bookmark.id))];
      } catch (cause) {
        console.error('Bookmark list request failed', cause);
        return null;
      }
    };
    load().then((list) => {
      if (!cancelled) {
        if (list) {
          setBookmarks(toMap(list));
          setLoadError(null);
        } else {
          setLoadError('Your bookmarks could not be loaded. Check your connection and try again.');
        }
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId, reloadVersion]);

  const isSaved = (kind: BookmarkKind, appId: string) => bookmarks.has(bookmarkKey(kind, appId));
  const isPending = (kind: BookmarkKind, appId: string) => pendingIds.has(bookmarkKey(kind, appId));

  const toggleSaved = (kind: BookmarkKind, appId: string) => {
    if (!isLoaded || isSignedIn === undefined || (isSignedIn && isLoading)) return;
    if (!isSignedIn) {
      openLoginModal();
      return;
    }
    const id = bookmarkKey(kind, appId);
    if (pendingRef.current.has(id)) return;
    pendingRef.current.add(id);
    setPendingIds((current) => new Set(current).add(id));
    setError(null);
    const isRemoving = bookmarks.has(id);
    const bookmark: Bookmark = bookmarks.get(id) ?? { id, appId, kind, savedAt: Date.now(), userId };
    const applyChange = (remove: boolean) => setBookmarks((current) => {
      const next = new Map(current);
      if (remove) next.delete(id);
      else next.set(id, bookmark);
      return next;
    });

    applyChange(isRemoving);
    playSound(isRemoving ? 'toggle-off' : 'toggle-on');

    void (async () => {
      const storedLocally = isRemoving ? false : await addBookmark(bookmark).then(() => true, () => false);
      try {
        const response = await fetch('/api/bookmarks', {
          method: isRemoving ? 'DELETE' : 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify(isRemoving ? { kind, appId } : { bookmarks: [{ kind, appId, savedAt: bookmark.savedAt }] }),
        });
        if (response.status === 401) openLoginModal();
        if (!response.ok) throw new Error(`Bookmark ${isRemoving ? 'delete' : 'save'} failed (${response.status})`);
        if (!isRemoving) {
          const { saved } = (await response.json()) as { saved: number };
          if (saved !== 1) throw new Error('Bookmark save was not confirmed by the database');
        }
        await removeBookmark(id).catch(() => undefined);
      } catch (cause: unknown) {
        if (isRemoving || !storedLocally) applyChange(!isRemoving);
        setError(
          isRemoving
            ? 'Could not remove this bookmark. It has been restored; please try again.'
            : storedLocally
              ? 'Saved on this device. It will sync to your account when the connection returns.'
              : 'Your bookmark could not be saved. Please try again.',
        );
        console.error('Bookmark request failed', cause);
      } finally {
        pendingRef.current.delete(id);
        setPendingIds((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
      }
    })();
  };

  const screenshotBookmarkCount = [...bookmarks.values()].filter((bookmark) => bookmark.kind === 'screenshots').length;
  return {
    savedCount: screenshotBookmarkCount,
    isSaved,
    isPending,
    toggleSaved,
    canBookmark: isLoaded && Boolean(isSignedIn),
    isLoading: isSignedIn === true && isLoading,
    error,
    loadError,
    reload: () => setReloadVersion((version) => version + 1),
  };
}
