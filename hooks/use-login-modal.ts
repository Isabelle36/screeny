'use client';

import { useSyncExternalStore } from 'react';

let isOpen = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function openLoginModal() {
  if (isOpen) return;
  isOpen = true;
  emit();
}

export function closeLoginModal() {
  if (!isOpen) return;
  isOpen = false;
  emit();
}

export function useLoginModal() {
  const open = useSyncExternalStore(subscribe, () => isOpen, () => false);
  return { isOpen: open, open: openLoginModal, close: closeLoginModal };
}
