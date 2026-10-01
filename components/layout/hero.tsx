'use client';

import { useRef, type ReactNode } from 'react';
import { playSound } from '@/lib/sound';

type PeekImage = { src: string; alt: string };

type HeroProps = {
  onStart: () => void;
  // The featured app card, rendered by the caller so the hero stays free of bookmark wiring.
  featured: ReactNode;
  // Two screenshots that pop up beside "Screenshots," while the headline is hovered.
  peekImages: PeekImage[];
};

// Hand-drawn arrow from Figma "Hover animations" (node 193:892), path unchanged; arrowhead added at its end.
const ARROW_VIEWBOX = { width: 480.219, height: 180.053 };
const ARROW_START = { x: 2.384, y: 47.977 };
const ARROW_END_X = 479.884;
const ARROW_PATH =
  'M2.38396 47.9774C8.38396 66.9774 27.684 108.777 56.884 123.977C86.084 139.177 115.717 148.311 126.884 150.977C132.884 148.311 143.084 141.077 135.884 133.477C126.884 123.977 104.884 101.584 107.884 123.977C110.884 146.371 110.884 170.977 126.884 174.977C142.884 178.977 223.384 179.977 245.884 165.477C263.884 153.877 282.717 139.311 289.884 133.477C323.884 98.3107 395.884 26.0774 411.884 18.4774C427.884 10.8774 463.884 4.64406 479.884 2.47739';
const ARROW_HEAD_PATH = 'M463.9 -5.84L479.884 2.477L466.6 14.6';
const ARROW_STROKE_PX = 4;

// A deliberate hover, not a pointer passing over the headline on its way somewhere.
const HOVER_INTENT_MS = 120;

export function Hero({ onStart, featured, peekImages }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const arrowRef = useRef<SVGSVGElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const intentTimer = useRef(0);

  // Fit the arrow between the hovered words and the featured card, keeping the drawing's proportions.
  const placeArrow = () => {
    const section = sectionRef.current?.getBoundingClientRect();
    const trigger = triggerRef.current?.getBoundingClientRect();
    const card = featuredRef.current?.getBoundingClientRect();
    const arrow = arrowRef.current;
    if (!section || !trigger || !card || !arrow || card.width === 0) return false;

    const startX = trigger.left - section.left + trigger.width * 0.3;
    const startY = trigger.bottom - section.top + 2;
    const endX = card.left - section.left - 20;
    const scale = (endX - startX) / (ARROW_END_X - ARROW_START.x);
    if (scale <= 0.2) return false;

    arrow.style.left = `${startX - ARROW_START.x * scale}px`;
    arrow.style.top = `${startY - ARROW_START.y * scale}px`;
    arrow.style.width = `${ARROW_VIEWBOX.width * scale}px`;
    arrow.style.height = `${ARROW_VIEWBOX.height * scale}px`;
    arrow.style.setProperty('--arrow-stroke', `${ARROW_STROKE_PX / scale}`);
    return true;
  };

  const onPointerEnter = (event: React.PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    intentTimer.current = window.setTimeout(() => {
      const section = sectionRef.current;
      if (!section) return;
      section.dataset.arrow = placeArrow() ? 'true' : 'false';
      section.dataset.peek = 'true';
    }, HOVER_INTENT_MS);
  };

  const onPointerLeave = () => {
    window.clearTimeout(intentTimer.current);
    if (sectionRef.current) sectionRef.current.dataset.peek = 'false';
  };

  return (
    <section ref={sectionRef} data-peek="false" className="hero relative flex items-start justify-between gap-12 px-4 pb-16 pt-12 md:px-8 lg:pb-[88px]">
      {/* Like the Figma frame, the headline (947px) may run past its 811px column at full width. */}
      <div className="max-w-[811px]">
        <h1 className="min-[1480px]:w-[947px] text-[clamp(2.5rem,4.5vw,var(--text-display))] leading-(--text-display--line-height) font-semibold tracking-(--text-display--letter-spacing)">
          App Store{' '}
          <span className="relative">
            Screenshots,
            <span aria-hidden="true" className="hero-flourish absolute left-full top-[-0.3em] ml-1 hidden h-0 w-[130px] lg:block">
              {peekImages.slice(0, 2).map((image, index) => (
                <img
                  key={image.src}
                  src={image.src}
                  alt=""
                  className="hero-peek absolute top-0 h-[82px] w-[61px] rounded-[18px] border-[3px] border-white object-cover object-top shadow-[0_4px_14px_rgba(0,0,0,0.12)]"
                  style={{ left: index * 52, '--peek-rotate': index === 0 ? '-8deg' : '9deg', '--peek-delay': `${index * 40}ms` } as React.CSSProperties}
                />
              ))}
            </span>
          </span>{' '}
          {/* Break after "Screenshots," (Figma "Hover animations" frame) so the peek thumbnails sit in the space it leaves. */}
          <br className="hidden min-[1480px]:block" />
          actually worth{' '}
          <span ref={triggerRef} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
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
        <path d={ARROW_PATH} pathLength={1} className="hero-arrow-line" />
        <path d={ARROW_HEAD_PATH} pathLength={1} className="hero-arrow-head" />
      </svg>
    </section>
  );
}
