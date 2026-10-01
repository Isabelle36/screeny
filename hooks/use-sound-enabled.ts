'use client';

import { useSyncExternalStore } from 'react';
import { isSoundEnabled, setSoundEnabled, subscribeToSound } from '@/lib/sound';

// Server render assumes "on" (the default); the client reads the stored preference.
export function useSoundEnabled() {
  const enabled = useSyncExternalStore(subscribeToSound, isSoundEnabled, () => true);
  return [enabled, setSoundEnabled] as const;
}
