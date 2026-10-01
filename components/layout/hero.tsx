'use client';

import { useAnimate, useReducedMotion } from 'motion/react';
import { useRef, type ReactNode } from 'react';
import { playSound } from '@/lib/sound';

type PeekImage = { src: string; alt: string };

type HeroProps = {
  onStart: () => void;
  // The featured app card, rendered by the caller so the hero stays free of bookmark wiring.
  featured: ReactNode;
  // Two screenshots that pop up beside "Screenshots," while that word is hovered.
  peekImages: PeekImage[];
};

// Hand-drawn arrow from Figma "Hover animations" (node 193:892), path unchanged. Styled after
// asciistudio.space's hover arrow: thick rounded stroke, open arrowhead, design-tool bezier handles
// along the curve and two sparkles at the tip.
const ARROW_VIEWBOX = { width: 480.219, height: 180.053 };
const ARROW_START = { x: 2.384, y: 47.977 };
const ARROW_END_X = 479.884;
const ARROW_PATH =
  'M2.38396 47.9774C8.38396 66.9774 27.684 108.777 56.884 123.977C86.084 139.177 115.717 148.311 126.884 150.977C132.884 148.311 143.084 141.077 135.884 133.477C126.884 123.977 104.884 101.584 107.884 123.977C110.884 146.371 110.884 170.977 126.884 174.977C142.884 178.977 223.384 179.977 245.884 165.477C263.884 153.877 282.717 139.311 289.884 133.477C323.884 98.3107 395.884 26.0774 411.884 18.4774C427.884 10.8774 463.884 4.64406 479.884 2.47739';
const ARROW_HEAD_PATH = 'M463.9 -5.84L479.884 2.477L466.6 14.6';
// Where the bezier handles sit along the path (fraction of its length), and how long they are (px).
const HANDLE_AT = [0.44, 0.74];
const HANDLE_REACH_PX = 22;
// Sparkles near the tip, in viewBox units, with their size in px.
const SPARKLES = [
  { x: 452, y: -30, size: 14 },
  { x: 496, y: -8, size: 9 },
];
const SPARKLE_PATH = 'M0-1C.12-.12.12-.12 1 0C.12.12.12.12 0 1C-.12.12-.12.12-1 0C-.12-.12-.12-.12 0-1Z';
const STROKE_PX = 6;
const HAIRLINE_PX = 1.25;

// A deliberate hover, not a pointer passing over the headline on its way somewhere.
const HOVER_INTENT_MS = 100;
const PEEKS = [
  { rotate: -8, x: 0 },
  { rotate: 9, x: 52 },
];
// Enter is a playful moment (spring with a little bounce); exit is quick and flat.
const PEEK_IN = { type: 'spring', bounce: 0.4, duration: 0.55 } as const;
const PEEK_OUT = { type: 'spring', bounce: 0, duration: 0.25 } as const;

export function Hero({ onStart, featured, peekImages }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const arrowTriggerRef = useRef<HTMLSpanElement>(null);
  const arrowRef = useRef<SVGSVGElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const timers = useRef({ peek: 0, arrow: 0 });
  const [peekScope, animate] = useAnimate();
  const prefersReducedMotion = useReducedMotion();

  // --- Peeks: hover "Screenshots," -----------------------------------------------------------
  const showPeeks = (event: React.PointerEvent) => {
    if (event.pointerType !== 'mouse' || prefersReducedMotion) return;
    timers.current.peek = window.setTimeout(() => {
      PEEKS.forEach((peek, index) =>
        animate(`[data-peek="${index}"]`, { opacity: 1, scale: 1, y: 0, rotate: peek.rotate }, { ...PEEK_IN, delay: index * 0.05 }),
      );
    }, HOVER_INTENT_MS);
  };
  const hidePeeks = () => {
    window.clearTimeout(timers.current.peek);
    animate('[data-peek]', { opacity: 0, scale: 0.85, y: 8, rotate: 0 }, PEEK_OUT);
  };

  // --- Arrow: hover "stealing from." ----------------------------------------------------------
  // Fit the arrow between the hovered words and the featured card, keeping the drawing's proportions,
  // and place the handle/sparkle decorations in px so they stay the same size at any scale.
  const placeArrow = () => {
    const section = sectionRef.current?.getBoundingClientRect();
    const trigger = arrowTriggerRef.current?.getBoundingClientRect();
    const card = featuredRef.current?.getBoundingClientRect();
    const arrow = arrowRef.current;
    if (!section || !trigger || !card || !arrow || card.width === 0) return false;

    const startX = trigger.left - section.left + trigger.width * 0.3;
    const startY = trigger.bottom - section.top + 2;
    const endX = card.left - section.left - 24;
    const scale = (endX - startX) / (ARROW_END_X - ARROW_START.x);
    if (scale <= 0.2) return false;

    arrow.style.left = `${startX - ARROW_START.x * scale}px`;
    arrow.style.top = `${startY - ARROW_START.y * scale}px`;
    arrow.style.width = `${ARROW_VIEWBOX.width * scale}px`;
    arrow.style.height = `${ARROW_VIEWBOX.height * scale}px`;
    arrow.style.setProperty('--arrow-stroke', `${STROKE_PX / scale}`);
    arrow.style.setProperty('--arrow-hairline', `${HAIRLINE_PX / scale}`);

    const line = arrow.querySelector<SVGPathElement>('.hero-arrow-line');
    if (line) {
      const length = line.getTotalLength();
      arrow.querySelectorAll<SVGGElement>('[data-handle]').forEach((handle, index) => {
        const at = length * HANDLE_AT[index];
        const point = line.getPointAtLength(at);
        const ahead = line.getPointAtLength(Math.min(length, at + 1));
        const angle = Math.atan2(ahead.y - point.y, ahead.x - point.x);
        const reach = HANDLE_REACH_PX / scale;
        const [dx, dy] = [Math.cos(angle) * reach, Math.sin(angle) * reach];
        const [lineEl] = handle.getElementsByTagName('line');
        lineEl.setAttribute('x1', `${point.x - dx}`);
        lineEl.setAttribute('y1', `${point.y - dy}`);
        lineEl.setAttribute('x2', `${point.x + dx}`);
        lineEl.setAttribute('y2', `${point.y + dy}`);
        const [anchor, endA, endB] = handle.getElementsByTagName('circle');
        for (const [circle, x, y, radius] of [
          [anchor, point.x, point.y, 3.5],
          [endA, point.x - dx, point.y - dy, 3],
          [endB, point.x + dx, point.y + dy, 3],
        ] as const) {
          circle.setAttribute('cx', `${x}`);
          circle.setAttribute('cy', `${y}`);
          circle.setAttribute('r', `${radius / scale}`);
        }
      });
    }
    arrow.querySelectorAll<SVGPathElement>('[data-sparkle]').forEach((sparkle, index) => {
      const { x, y, size } = SPARKLES[index];
      sparkle.setAttribute('transform', `translate(${x} ${y}) scale(${size / 2 / scale})`);
    });
    return true;
  };

  const showArrow = (event: React.PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    timers.current.arrow = window.setTimeout(() => {
      if (sectionRef.current) sectionRef.current.dataset.arrow = placeArrow() ? 'true' : 'false';
    }, HOVER_INTENT_MS);
  };
  const hideArrow = () => {
    window.clearTimeout(timers.current.arrow);
    if (sectionRef.current) sectionRef.current.dataset.arrow = 'false';
  };

  return (
    <section ref={sectionRef} data-arrow="false" className="hero relative flex items-start justify-between gap-12 px-4 pb-16 pt-12 md:px-8 lg:pb-[88px]">
      {/* Like the Figma frame, the headline (947px) may run past its 811px column at full width. */}
      <div className="max-w-[811px]">
        <h1 className="min-[1480px]:w-[947px] text-[clamp(2.5rem,4.5vw,var(--text-display))] leading-(--text-display--line-height) font-semibold tracking-(--text-display--letter-spacing)">
          App Store{' '}
          <span ref={peekScope} className="relative" onPointerEnter={showPeeks} onPointerLeave={hidePeeks}>
            Screenshots,
            {/* Centred on the word's line, just past the comma. */}
            <span aria-hidden="true" className="hero-flourish pointer-events-none absolute left-full top-1/2 ml-3 hidden h-[82px] w-[130px] -translate-y-1/2 lg:block">
              {peekImages.slice(0, 2).map((image, index) => (
                <img
                  key={image.src}
                  data-peek={index}
                  src={image.src}
                  alt=""
                  className="absolute top-0 h-[82px] w-[61px] rounded-[18px] border-[3px] border-white object-cover object-top shadow-[0_4px_14px_rgba(0,0,0,0.12)]"
                  // Initial state as a transform so Motion's y/scale/rotate take over from it (a separate `translate` would stick).
                  style={{ left: PEEKS[index].x, opacity: 0, transform: 'translateY(8px) scale(0.85)' }}
                />
              ))}
            </span>
          </span>{' '}
          {/* Break after "Screenshots," (Figma "Hover animations" frame) so the peek thumbnails sit in the space it leaves. */}
          <br className="hidden min-[1480px]:block" />
          actually worth{' '}
          <span ref={arrowTriggerRef} onPointerEnter={showArrow} onPointerLeave={hideArrow}>
            stealing from.
          </span>
        </h1>
        <p className="mt-[13px] max-w-[729px] text-body-lg text-muted md:text-title">
          Curated App Store screenshots, onboarding, paywalls, icons and design details from the best iOS apps
        </p>
        <button
          type="button"
          onClick={() => {
            playSound('tap');
            onStart();
          }}
          className="mt-10 inline-flex items-center gap-[13px] rounded-full bg-ink px-[19px] py-4 text-body-lg font-medium text-background shadow-[0_0_0_1px_rgba(0,0,0,0.15),inset_0_4px_5.6px_rgba(209,209,209,0.25)] transition-transform duration-150 ease-out active:scale-[0.97] lg:mt-[58px]"
        >
          <img src="/figma/bookmark-cta.svg" alt="" width={20} height={24} />
          Save what you like
        </button>
      </div>

      <div ref={featuredRef} className="hero-featured hidden shrink-0 lg:block">
        {featured}
      </div>

      <svg
        ref={arrowRef}
        aria-hidden="true"
        viewBox={`0 0 ${ARROW_VIEWBOX.width} ${ARROW_VIEWBOX.height}`}
        fill="none"
        className="hero-flourish hero-arrow pointer-events-none absolute hidden overflow-visible lg:block"
      >
        {HANDLE_AT.map((_, index) => (
          <g key={index} data-handle className="hero-arrow-handle" style={{ '--handle-delay': `${300 + index * 160}ms` } as React.CSSProperties}>
            <line />
            <circle className="hero-arrow-anchor" />
            <circle />
            <circle />
          </g>
        ))}
        <path d={ARROW_PATH} pathLength={1} className="hero-arrow-line" />
        <path d={ARROW_HEAD_PATH} pathLength={1} className="hero-arrow-head" />
        {SPARKLES.map((_, index) => (
          <path key={index} data-sparkle d={SPARKLE_PATH} className="hero-arrow-sparkle" style={{ '--sparkle-delay': `${720 + index * 90}ms` } as React.CSSProperties} />
        ))}
      </svg>
    </section>
  );
}
