'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { playSound } from '@/lib/sound';

// Opens on ⌘K / Ctrl+K and returns focus to whatever opened it when it closes.
// cmdk's dialog (Radix) has no trigger element here, so without this focus would fall to <body>.
export function useCommandPalette(fallbackFocusRef: RefObject<HTMLElement | null>) {
  const [isOpen, setIsOpen] = useState(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    const active = document.activeElement;
    returnFocusRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
    setIsOpen(true);
    // Opened many times a day, so only the quietest cue.
    playSound('open', { emphasis: 'subtle' });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    playSound('close', { emphasis: 'subtle' });
    requestAnimationFrame(() => {
      const target = returnFocusRef.current?.isConnected ? returnFocusRef.current : fallbackFocusRef.current;
      target?.focus();
    });
  }, [fallbackFocusRef]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      if (isOpen) close();
      else open();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, open, close]);

  const onOpenChange = (next: boolean) => (next ? open() : close());

  return { isOpen, open, close, onOpenChange };
}
