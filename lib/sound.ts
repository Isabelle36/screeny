'use client';

import type { PlayOptions, SoundName } from 'cuelume';

// Interaction sounds (cuelume: synthesized with Web Audio, no files).
// Rules, from cuelume's own guidance: only on deliberate actions, never on hover or arrow-key navigation,
// quiet by default, and a visible switch for anyone who doesn't want them.

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

// Loaded lazily so the audio engine never touches the server render or the first paint.
async function loadEngine() {
  if (!engine) {
    engine = await import('cuelume');
    engine.setVolume(VOLUME);
  }
  return engine;
}

if (typeof window !== 'undefined') enabled = readPreference();

export function playSound(name: SoundName, options?: PlayOptions) {
  if (!enabled) return;
  loadEngine()
    .then((cuelume) => cuelume.play(name, options))
    .catch(() => {}); // No Web Audio — silence is fine.
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
