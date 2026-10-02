'use client';

import { useSyncExternalStore } from 'react';

export const INFO_HREF = '/?view=info';
const CHANGE_EVENT = 'screeny:info-view';

const readIsOpen = () => new URLSearchParams(window.location.search).get('view') === 'info';
const announceChange = () => window.dispatchEvent(new Event(CHANGE_EVENT));

let openedFromGallery = false;
let returnScrollY: number | null = null;

function subscribe(onChange: () => void) {
  const onPopState = () => {
    openedFromGallery = readIsOpen();
    onChange();
  };
  window.addEventListener('popstate', onPopState);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onPopState);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function openInfoView() {
  if (readIsOpen()) return;
  returnScrollY = new URLSearchParams(window.location.search).size === 0 ? window.scrollY : null;
  openedFromGallery = true;
  window.history.pushState(null, '', INFO_HREF);
  announceChange();
}

export function takeInfoReturnScroll() {
  const scrollY = returnScrollY;
  returnScrollY = null;
  return scrollY;
}

export function useInfoView() {
  const isOpen = useSyncExternalStore(subscribe, readIsOpen, () => false);

  const close = ({ stepBack }: { stepBack: boolean }) => {
    if (!readIsOpen()) return;
    if (stepBack && openedFromGallery) {
      openedFromGallery = false;
      window.history.back();
      return;
    }
    openedFromGallery = false;
    window.history.replaceState(null, '', window.location.pathname);
    announceChange();
  };

  return { isOpen, open: openInfoView, close };
}
