'use client';

import type { PlayOptions } from '@web-kits/audio';

const STORAGE_KEY = 'screeny:sound';
const JITTER: PlayOptions['jitter'] = { detune: 20, volume: 0.08 };
const ONE_GESTURE_MS = 50;

export type SoundName =
  | 'tap'
  | 'toggle-on'
  | 'toggle-off'
  | 'select'
  | 'tab-switch'
  | 'expand'
  | 'collapse'
  | 'modal-open'
  | 'modal-close'
  | 'drawer-open'
  | 'drawer-close'
  | 'page-enter'
  | 'page-exit'
  | 'tick'
  | 'copy'
  | 'save'
  | 'success'
  | 'error';

type Player = (options?: PlayOptions) => unknown;

let players: Record<SoundName, Player> | null = null;
let enabled = true;
let lastPlayedAt = -Infinity;
const listeners = new Set<() => void>();

function readPreference() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

async function loadPlayers() {
  if (!players) {
    const [{ defineSound }, { core }] = await Promise.all([import('@web-kits/audio'), import('./audio')]);
    players = {
      tap: defineSound(core.tap),
      'toggle-on': defineSound(core.toggleOn),
      'toggle-off': defineSound(core.toggleOff),
      select: defineSound(core.select),
      'tab-switch': defineSound(core.tabSwitch),
      expand: defineSound(core.expand),
      collapse: defineSound(core.collapse),
      'modal-open': defineSound(core.modalOpen),
      'modal-close': defineSound(core.modalClose),
      'drawer-open': defineSound(core.drawerOpen),
      'drawer-close': defineSound(core.drawerClose),
      'page-enter': defineSound(core.pageEnter),
      'page-exit': defineSound(core.pageExit),
      tick: defineSound(core.tick),
      copy: defineSound(core.copy),
      save: defineSound(core.save),
      success: defineSound(core.success),
      error: defineSound(core.error),
    };
  }
  return players;
}

if (typeof window !== 'undefined') {
  enabled = readPreference();
  const warmUp = () => void loadPlayers().catch(() => {});
  if ('requestIdleCallback' in window) window.requestIdleCallback(warmUp, { timeout: 4000 });
  else setTimeout(warmUp, 2000);
}

export function playSound(name: SoundName) {
  if (!enabled) return;
  const now = performance.now();
  if (now - lastPlayedAt < ONE_GESTURE_MS) return;
  lastPlayedAt = now;
  loadPlayers()
    .then((loaded) => loaded[name]({ jitter: JITTER }))
    .catch(() => {});
}

export function isSoundEnabled() {
  return enabled;
}

export function setSoundEnabled(next: boolean) {
  enabled = next;
  try {
    localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
  } catch {}
  listeners.forEach((listener) => listener());
}

export function subscribeToSound(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
