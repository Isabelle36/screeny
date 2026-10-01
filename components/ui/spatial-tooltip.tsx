'use client';

import { useCallback, useEffect, useRef } from 'react';

// One tooltip shared by a vertical rail of icon buttons (after Rauno Freiberg's "spatial tooltips").
// Moving between buttons slides the tooltip to the new one and rolls its label vertically, so it reads as
// a single object travelling with the pointer instead of tooltips blinking in and out.
//
// Everything here writes `style.translate` / opacity straight to the DOM from event handlers:
// no React state, no re-renders, compositor-only properties. CSS transitions retarget mid-flight,
// so however fast the pointer moves, the tooltip redirects smoothly instead of restarting.
//
// Timing follows "hover restraint": the first tooltip waits (so a pointer just passing through doesn't
// trigger it), then the rail stays "warm" and neighbours respond instantly. Keyboard focus skips the delay.

const OPEN_DELAY_MS = 450;
const WARM_GRACE_MS = 300;
export const TOOLTIP_LABEL_HEIGHT = 28;

export function useSpatialTooltip() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const timers = useRef({ open: 0, cool: 0 });
  const isVisible = useRef(false);
  const isWarm = useRef(false);

  const place = useCallback((target: HTMLElement, index: number) => {
    const container = containerRef.current;
    const tooltip = tooltipRef.current;
    const track = trackRef.current;
    if (!container || !tooltip || !track) return;
    const offsetY = target.getBoundingClientRect().top - container.getBoundingClientRect().top + target.offsetHeight / 2;
    tooltip.style.translate = `0 ${offsetY}px`;
    track.style.translate = `0 ${-index * TOOLTIP_LABEL_HEIGHT}px`;
  }, []);

  const reveal = useCallback(
    (target: HTMLElement, index: number) => {
      const tooltip = tooltipRef.current;
      if (!tooltip) return;
      // Appearing fresh: jump into place with no slide from wherever it was last hidden.
      tooltip.dataset.moving = 'false';
      place(target, index);
      void tooltip.offsetWidth; // commit the jump before re-enabling transitions
      tooltip.dataset.moving = 'true';
      tooltip.dataset.open = 'true';
      isVisible.current = true;
      isWarm.current = true;
    },
    [place],
  );

  const show = useCallback(
    (target: HTMLElement, index: number, immediate = false) => {
      window.clearTimeout(timers.current.open);
      window.clearTimeout(timers.current.cool);
      if (isVisible.current) return place(target, index);
      if (immediate || isWarm.current) return reveal(target, index);
      timers.current.open = window.setTimeout(() => reveal(target, index), OPEN_DELAY_MS);
    },
    [place, reveal],
  );

  const hide = useCallback(() => {
    window.clearTimeout(timers.current.open);
    if (tooltipRef.current) tooltipRef.current.dataset.open = 'false';
    isVisible.current = false;
    timers.current.cool = window.setTimeout(() => (isWarm.current = false), WARM_GRACE_MS);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      window.clearTimeout(pending.open);
      window.clearTimeout(pending.cool);
    };
  }, []);

  // Spread onto each trigger. Pointer: delayed first show. Keyboard focus: immediate.
  // Triggers should call `hide` from their own click handler.
  const triggerProps = (index: number) => ({
    onPointerEnter: (event: React.PointerEvent<HTMLElement>) => {
      if (event.pointerType === 'mouse') show(event.currentTarget, index);
    },
    onFocus: (event: React.FocusEvent<HTMLElement>) => {
      if (event.currentTarget.matches(':focus-visible')) show(event.currentTarget, index, true);
    },
    onBlur: hide,
  });

  return { containerRef, tooltipRef, trackRef, triggerProps, hide };
}

type SpatialTooltipProps = {
  labels: string[];
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  trackRef: React.RefObject<HTMLDivElement | null>;
  // Horizontal placement relative to the container (e.g. just past the rail's edge).
  style?: React.CSSProperties;
};

// Purely visual: every trigger already carries an aria-label, so assistive tech gets the name there.
export function SpatialTooltip({ labels, tooltipRef, trackRef, style }: SpatialTooltipProps) {
  return (
    <div
      ref={tooltipRef}
      aria-hidden="true"
      data-open="false"
      data-moving="false"
      className="spatial-tooltip pointer-events-none absolute top-0"
      style={style}
    >
      {/* translate positions it (set from JS); this inner box centres it on that point and handles appear/disappear. */}
      <div className="spatial-tooltip-body -translate-y-1/2 overflow-hidden rounded-lg bg-ink px-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.16)]" style={{ height: TOOLTIP_LABEL_HEIGHT }}>
        <div ref={trackRef} className="spatial-tooltip-track">
          {labels.map((label) => (
            <div
              key={label}
              className="flex items-center whitespace-nowrap text-body-sm font-medium text-background"
              style={{ height: TOOLTIP_LABEL_HEIGHT }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
