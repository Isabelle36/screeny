'use client';

import { useSyncExternalStore } from 'react';
import { isSoundEnabled, setSoundEnabled, subscribeToSound } from '@/lib/sound';

export function useSoundEnabled() {
  const enabled = useSyncExternalStore(subscribeToSound, isSoundEnabled, () => true);
  return [enabled, setSoundEnabled] as const;
}
