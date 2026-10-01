'use client';

import { useSyncExternalStore } from 'react';
import { APP_PARAM, appViewHref } from '@/lib/app-view-url';

// The open app lives in the URL (/?app=<slug>): a reload or a shared link reopens it, and the browser's
// Back button closes it. Native pushState is enough — Next.js keeps its router in sync with it.
const CHANGE_EVENT = 'screeny:app-view';

const readOpenSlug = () => new URLSearchParams(window.location.search).get(APP_PARAM);
const announceChange = () => window.dispatchEvent(new Event(CHANGE_EVENT));

// True while the history entry below this one is the gallery we came from, so "Back" can step back to it
// instead of stacking another entry.
let openedFromGallery = false;

function subscribe(onChange: () => void) {
  const onPopState = () => {
    openedFromGallery = readOpenSlug() !== null;
    onChange();
  };
  window.addEventListener('popstate', onPopState);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onPopState);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function useAppView() {
  // The server render (and hydration) always shows the gallery; the URL is read once in the browser.
  const openSlug = useSyncExternalStore(subscribe, readOpenSlug, () => null);

  const open = (slug: string) => {
    const current = readOpenSlug();
    if (slug === current) return;
    // Switching from one app to another replaces the entry, so Back still lands on the gallery.
    if (current === null) {
      openedFromGallery = true;
      window.history.pushState(null, '', appViewHref(slug));
    } else {
      window.history.replaceState(null, '', appViewHref(slug));
    }
    announceChange();
  };

  // `stepBack`: the Back button and Escape-style exits return through history; jumping elsewhere (a tab,
  // a category) just drops the parameter, which is synchronous.
  const close = ({ stepBack }: { stepBack: boolean }) => {
    if (readOpenSlug() === null) return;
    if (stepBack && openedFromGallery) {
      openedFromGallery = false;
      window.history.back();
      return;
    }
    openedFromGallery = false;
    window.history.replaceState(null, '', window.location.pathname);
    announceChange();
  };

  return { openSlug, open, close };
}
