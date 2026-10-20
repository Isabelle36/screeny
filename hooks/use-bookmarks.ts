'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useRef, useState } from 'react';
import { addBookmark, bookmarkKey, listBookmarks, removeBookmark, type Bookmark, type BookmarkKind } from '@/lib/bookmarks-store';
import { openLoginModal } from '@/hooks/use-login-modal';
import { playSound } from '@/lib/sound';

type AccountBookmark = { kind: BookmarkKind; appId: string; savedAt: number };
type BookmarkRequestError = Error & { status?: number };

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const EMPTY_BOOKMARKS = new Map<string, Bookmark>();

const toMap = (list: Bookmark[]) => new Map(list.map((bookmark) => [bookmark.id, bookmark]));

function requestError(status: number, action: string): BookmarkRequestError {
  return Object.assign(new Error(`Bookmark ${action} failed (${status})`), { status });
}

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
    if (!upload.ok) throw requestError(upload.status, 'upload');
    const { saved } = (await upload.json()) as { saved: number };
    if (saved !== deviceBookmarks.length) throw new Error('Bookmark upload was not fully confirmed');
  }
  const response = await fetch('/api/bookmarks', { cache: 'no-store' });
  if (!response.ok) throw requestError(response.status, 'fetch');
  const { bookmarks } = (await response.json()) as { bookmarks: AccountBookmark[] };
  return bookmarks
    .filter((bookmark) => bookmark.kind === 'screenshots')
    .map((bookmark) => ({ ...bookmark, id: bookmarkKey(bookmark.kind, bookmark.appId) }));
}

export function useBookmarks() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [bookmarks, setBookmarks] = useState<Map<string, Bookmark>>(new Map());
  const [bookmarksOwner, setBookmarksOwner] = useState<string | null>(null);
  const [completedLoad, setCompletedLoad] = useState<{ userId: string; version: number } | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const pendingRef = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;
    if (!isLoaded) return () => { cancelled = true; };
    if (!isSignedIn) return () => { cancelled = true; };
    let loadFailure: unknown = null;
    const load = async () => {
      const deviceBookmarks = await loadDeviceBookmarks(userId).catch(() => []);
      try {
        const accountBookmarks = await syncToAccount(deviceBookmarks);
        const confirmed = new Set(accountBookmarks.map((bookmark) => bookmark.id));
        const syncedDeviceBookmarks = deviceBookmarks.filter((bookmark) => confirmed.has(bookmark.id));
        await Promise.allSettled(syncedDeviceBookmarks.map((bookmark) => removeBookmark(bookmark.id)));
        return [...accountBookmarks, ...deviceBookmarks.filter((bookmark) => !confirmed.has(bookmark.id))];
      } catch (cause) {
        loadFailure = cause;
        console.error('Bookmark list request failed', cause);
        return null;
      }
    };
    load().then((list) => {
      if (!cancelled) {
        if (list) {
          setBookmarks(toMap(list));
          setBookmarksOwner(userId);
          setLoadError(null);
        } else {
          const status = (loadFailure as BookmarkRequestError | null)?.status;
          setLoadError(
            status === 401
              ? 'You appear signed in, but the bookmark service could not verify your session. Refresh the page and try again.'
              : status && status >= 500
                ? 'The bookmark service could not load your account bookmarks. Your on-device copies are still safe.'
                : 'Your bookmarks could not be loaded. Check your connection and try again.',
          );
        }
        setCompletedLoad({ userId, version: reloadVersion });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId, reloadVersion]);

  const isLoading = isSignedIn === true && (completedLoad?.userId !== userId || completedLoad.version !== reloadVersion);
  const accountBookmarks = isSignedIn && bookmarksOwner === userId ? bookmarks : EMPTY_BOOKMARKS;
  const isSaved = (kind: BookmarkKind, appId: string) => accountBookmarks.has(bookmarkKey(kind, appId));
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
    const isRemoving = accountBookmarks.has(id);
    const bookmark: Bookmark = accountBookmarks.get(id) ?? { id, appId, kind, savedAt: Date.now(), userId };
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
      let responseStatus: number | undefined;
      try {
        const response = await fetch('/api/bookmarks', {
          method: isRemoving ? 'DELETE' : 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify(isRemoving ? { kind, appId } : { bookmarks: [{ kind, appId, savedAt: bookmark.savedAt }] }),
        });
        responseStatus = response.status;
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
            : responseStatus === 401
              ? 'You appear signed in, but the bookmark service could not verify your session. Refresh the page and try again.'
              : responseStatus === 503
                ? storedLocally
                  ? 'Your bookmark is saved on this device, but the database could not store it. Please try again shortly.'
                  : 'The database could not store your bookmark. Please try again shortly.'
                : storedLocally
                  ? 'Your bookmark is saved on this device, but the account save failed. Please try again shortly.'
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

  const screenshotBookmarkCount = [...accountBookmarks.values()].filter((bookmark) => bookmark.kind === 'screenshots').length;
  return {
    savedCount: screenshotBookmarkCount,
    isSaved,
    isPending,
    toggleSaved,
    canBookmark: isLoaded && Boolean(isSignedIn),
    isLoading: isSignedIn === true && isLoading,
    error,
    loadError: isSignedIn ? loadError : null,
    reload: () => setReloadVersion((version) => version + 1),
  };
}
