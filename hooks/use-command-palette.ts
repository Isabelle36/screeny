'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { playSound } from '@/lib/sound';

export function useCommandPalette(fallbackFocusRef: RefObject<HTMLElement | null>) {
  const [isOpen, setIsOpen] = useState(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    const active = document.activeElement;
    returnFocusRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
    setIsOpen(true);
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
