'use client';

import { useSyncExternalStore } from 'react';

export type LoginResume = { pendingEmail: string } | { message: string };

let isOpen = false;
let resume: LoginResume | null = null;
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

export function openLoginModalToResume(request: LoginResume) {
  resume = request;
  openLoginModal();
}

export const peekLoginResume = () => resume;

export function closeLoginModal() {
  resume = null;
  if (!isOpen) return;
  isOpen = false;
  emit();
}

export function useLoginModal() {
  const open = useSyncExternalStore(subscribe, () => isOpen, () => false);
  return { isOpen: open, open: openLoginModal, close: closeLoginModal };
}
