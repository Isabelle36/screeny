'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { SCREENSHOTS_PER_CARD } from '@/lib/browse';
import type { GalleryApp } from '@/lib/db/gallery';

const ROTATE_EVERY_MS = 6000;
const MAX_FEATURED = 8;

type FeaturedRotatorProps = {
  apps: GalleryApp[];
  renderCard: (app: GalleryApp) => ReactNode;
};

// The hero's featured card cycles through apps (like asoinspo), so the page shows more of the library.
// Rules for an auto-updating region (WCAG 2.2.2 + restraint):
// - pauses while hovered or focused, while the tab is hidden, and while scrolled out of view;
// - never auto-advances for people who prefer reduced motion;
// - a visible pause/play button stops it entirely.
// The next app's screenshots are preloaded so a switch never flashes skeletons.
export function FeaturedRotator({ apps, renderCard }: FeaturedRotatorProps) {
  const candidates = apps.filter((app) => app.screenshots.length >= SCREENSHOTS_PER_CARD).slice(0, MAX_FEATURED);
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isInteracting = useRef(false);
  const isVisible = useRef(true);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || candidates.length < 2 || isPaused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(([entry]) => (isVisible.current = entry.isIntersecting));
    observer.observe(root);
    const timer = window.setInterval(() => {
      if (isInteracting.current || !isVisible.current || document.hidden) return;
      setIndex((current) => (current + 1) % candidates.length);
    }, ROTATE_EVERY_MS);
    return () => {
      window.clearInterval(timer);
      observer.disconnect();
    };
  }, [candidates.length, isPaused]);

  // Warm the cache for the app that comes next.
  const next = candidates[(index + 1) % candidates.length];
  useEffect(() => {
    next?.screenshots.slice(0, SCREENSHOTS_PER_CARD).forEach((screenshot) => {
      const image = new Image();
      image.decoding = 'async';
      image.src = screenshot.r2Url;
    });
  }, [next]);

  const current = candidates[index % Math.max(candidates.length, 1)];
  if (!current) return null;

  return (
    <div
      ref={rootRef}
      className="relative"
      onPointerEnter={() => (isInteracting.current = true)}
      onPointerLeave={() => (isInteracting.current = false)}
      onFocus={() => (isInteracting.current = true)}
      onBlur={() => (isInteracting.current = false)}
    >
      {/* Keyed so each new app fades in; aria-live off — announcing every rotation would be noise. */}
      <div key={current.id} className="featured-enter">
        {renderCard(current)}
      </div>
      {candidates.length > 1 && (
        <button
          type="button"
          onClick={() => setIsPaused((paused) => !paused)}
          aria-pressed={isPaused}
          aria-label={isPaused ? 'Resume rotating featured apps' : 'Pause rotating featured apps'}
          className="absolute bottom-3 right-0 grid size-8 place-items-center rounded-full text-icon opacity-50 transition-opacity duration-[120ms] hover:opacity-100"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
            {isPaused ? <path d="M4.5 2.75v10.5L13 8z" /> : <path d="M4 2.5h2.75v11H4zM9.25 2.5H12v11H9.25z" />}
          </svg>
        </button>
      )}
    </div>
  );
}
