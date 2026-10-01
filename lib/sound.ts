'use client';

import type { PlayOptions, SoundName } from 'cuelume';

const STORAGE_KEY = 'screeny:sound';
const VOLUME = 0.35;

let engine: typeof import('cuelume') | null = null;
let enabled = true;
const listeners = new Set<() => void>();

function readPreference() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

async function loadEngine() {
  if (!engine) {
    engine = await import('cuelume');
    engine.setVolume(VOLUME);
  }
  return engine;
}

if (typeof window !== 'undefined') {
  enabled = readPreference();
  const warmUp = () => {
    void loadEngine().catch(() => {});
    void loadPatchPlayers().catch(() => {});
  };
  if ('requestIdleCallback' in window) window.requestIdleCallback(warmUp, { timeout: 4000 });
  else setTimeout(warmUp, 2000);
}

export function playSound(name: SoundName, options?: PlayOptions) {
  if (!enabled) return;
  loadEngine()
    .then((cuelume) => cuelume.play(name, options))
    .catch(() => {});
}

export type PatchSoundName = 'key-press' | 'page-exit' | 'deselect' | 'success';

let patchPlayers: Record<PatchSoundName, () => unknown> | null = null;

async function loadPatchPlayers() {
  if (!patchPlayers) {
    const [{ defineSound }, { playful, crisp }] = await Promise.all([import('@web-kits/audio'), import('./audio')]);
    patchPlayers = {
      'key-press': defineSound(playful.keyPress),
      'page-exit': defineSound(playful.pageExit),
      deselect: defineSound(playful.deselect),
      success: defineSound(crisp.success),
    };
  }
  return patchPlayers;
}

export function playPatchSound(name: PatchSoundName) {
  if (!enabled) return;
  loadPatchPlayers()
    .then((players) => players[name]())
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
