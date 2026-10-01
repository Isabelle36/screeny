'use client';

import { useEffect, useRef, useState } from 'react';
import { copyImage } from '@/lib/image-actions';
import { playSound } from '@/lib/sound';

export type CopyState = 'idle' | 'copied' | 'failed';

// Copies an image and reports the result for a moment ("Copied" / "Couldn't copy"), then resets.
export function useCopyImage() {
  const [state, setState] = useState<CopyState>('idle');
  const resetTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  const copy = async (src: string) => {
    window.clearTimeout(resetTimer.current);
    try {
      await copyImage(src);
      playSound('tap');
      setState('copied');
    } catch {
      setState('failed');
    }
    resetTimer.current = window.setTimeout(() => setState('idle'), 1600);
  };

  return { state, copy };
}

export const copyLabel = (state: CopyState) => (state === 'copied' ? 'Copied' : state === 'failed' ? "Couldn't copy" : 'Copy');
