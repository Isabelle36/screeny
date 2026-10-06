'use client';

import { useAnimate, useReducedMotion } from 'motion/react';
import { useRef, type ReactNode } from 'react';
import { playSound } from '@/lib/sound';

type PeekImage = { src: string; alt: string };

type HeroProps = {
  onStart: () => void;
  featured: ReactNode;
  peekImages: PeekImage[];
};

type Point = { x: number; y: number };

const ARROW_GAP_PX = 18;
const ARROW_MIN_SPAN_PX = 80;
const ARROW_HEAD_PX = 11;
const ARROW_HEAD_SPREAD = 0.5;
const HANDLE_REACH_PX = 24;

const lerp = (from: Point, to: Point, t: number) => ({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });

function pointOnCurve([p0, p1, p2, p3]: Point[], t: number) {
  const [a, b, c] = [lerp(p0, p1, t), lerp(p1, p2, t), lerp(p2, p3, t)];
  const [d, e] = [lerp(a, b, t), lerp(b, c, t)];
  return { ...lerp(d, e, t), angle: Math.atan2(e.y - d.y, e.x - d.x) };
}

const setAttributes = (element: Element | null, attributes: Record<string, number | string>) =>
  Object.entries(attributes).forEach(([name, value]) => element?.setAttribute(name, typeof value === 'number' ? value.toFixed(1) : value));

const HOVER_INTENT_MS = 100;
const PEEKS = [
  { rotate: -8, x: 0 },
  { rotate: 9, x: 52 },
];
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

  const placeArrow = () => {
    const section = sectionRef.current?.getBoundingClientRect();
    const trigger = arrowTriggerRef.current?.getBoundingClientRect();
    const card = featuredRef.current?.getBoundingClientRect();
    const arrow = arrowRef.current;
    if (!section || !trigger || !card || !arrow || card.width === 0) return false;

    const start = { x: trigger.right - section.left - trigger.width * 0.12, y: trigger.top - section.top + trigger.height * 0.12 };
    const end = { x: card.left - section.left - ARROW_GAP_PX, y: Math.max(start.y + 24, card.top - section.top + 24) };
    const span = end.x - start.x;
    if (span < ARROW_MIN_SPAN_PX) return false;

    const lift = Math.min(Math.max(span * 0.5, 40), 110);
    const curve = [start, { x: start.x + span * 0.15, y: start.y - lift }, { x: end.x - span * 0.45, y: end.y - lift * 0.55 }, end];
    const [p0, p1, p2, p3] = curve;
    setAttributes(arrow.querySelector('[data-arrow-line]'), { d: `M${p0.x} ${p0.y}C${p1.x} ${p1.y} ${p2.x} ${p2.y} ${p3.x} ${p3.y}` });

    const tip = pointOnCurve(curve, 1);
    const [wingA, wingB] = [ARROW_HEAD_SPREAD, -ARROW_HEAD_SPREAD].map((spread) => ({
      x: tip.x - Math.cos(tip.angle + spread) * ARROW_HEAD_PX,
      y: tip.y - Math.sin(tip.angle + spread) * ARROW_HEAD_PX,
    }));
    setAttributes(arrow.querySelector('[data-arrow-head]'), { d: `M${wingA.x} ${wingA.y}L${tip.x} ${tip.y}L${wingB.x} ${wingB.y}` });

    const apex = pointOnCurve(curve, 0.5);
    const reach = { x: Math.cos(apex.angle) * HANDLE_REACH_PX, y: Math.sin(apex.angle) * HANDLE_REACH_PX };
    setAttributes(arrow.querySelector('[data-handle-line]'), { x1: apex.x - reach.x, y1: apex.y - reach.y, x2: apex.x + reach.x, y2: apex.y + reach.y });
    const [handleStart, handleEnd] = arrow.querySelectorAll('[data-handle-end]');
    setAttributes(handleStart, { cx: apex.x - reach.x, cy: apex.y - reach.y });
    setAttributes(handleEnd, { cx: apex.x + reach.x, cy: apex.y + reach.y });
    setAttributes(arrow.querySelector('[data-handle-anchor]'), { cx: apex.x, cy: apex.y });
    setAttributes(arrow.querySelector('[data-arrow-start]'), { cx: start.x, cy: start.y });
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
    <section ref={sectionRef} data-arrow="false" className="hero relative flex items-start justify-between gap-12 px-4 pb-12 pt-8 md:px-8 md:pb-16 md:pt-12 lg:pb-[88px]">
      <div className="max-w-[811px]">
        <h1 className="min-[1480px]:w-[947px] text-[clamp(2rem,4.5vw,var(--text-display))] leading-[1.1] font-semibold tracking-(--text-display--letter-spacing) md:leading-(--text-display--line-height)">
          App Store{' '}
          <span ref={peekScope} className="relative inline-block" onPointerEnter={showPeeks} onPointerLeave={hidePeeks}>
            Screenshots,
            <span aria-hidden="true" className="hero-flourish pointer-events-none absolute left-full top-1/2 ml-3 hidden h-[82px] w-[130px] -translate-y-1/2 lg:block">
              {peekImages.slice(0, 2).map((image, index) => (
                <img
                  key={image.src}
                  data-peek={index}
                  src={image.src}
                  alt=""
                  className="absolute top-0 h-[82px] w-[61px] rounded-[18px] border-[3px] border-white object-cover object-top shadow-[0_4px_14px_rgba(0,0,0,0.12)]"
                  style={{ left: PEEKS[index].x, opacity: 0, transform: 'translateY(8px) scale(0.85)' }}
                />
              ))}
            </span>
          </span>{' '}
          <br className="lg:hidden min-[1480px]:block" />
          <span className="inline-block text-wrap lg:inline">
            actually worth{' '}
            <span ref={arrowTriggerRef} onPointerEnter={showArrow} onPointerLeave={hideArrow}>
              stealing from.
            </span>
          </span>
        </h1>
        <p className="mt-4 max-w-[34ch] text-pretty text-body leading-[1.55] text-muted md:mt-[13px] md:max-w-[729px] md:text-title md:leading-(--text-title--line-height)">
          Hand-picked screenshots from the best iOS apps. Find inspiration for your next App Store listing.
        </p>
        <button
          type="button"
          onClick={() => {
            playSound('tap');
            onStart();
          }}
          className="mt-7 inline-flex h-[42px] items-center gap-2 rounded-full bg-ink px-5 text-body-sm font-semibold text-background shadow-[0_0_0_1px_rgba(0,0,0,0.15),inset_0_4px_5.6px_rgba(209,209,209,0.25)] transition-transform duration-150 ease-out active:scale-[0.97] md:mt-10 md:h-auto md:gap-[13px] md:px-[19px] md:py-4 md:text-body-lg md:font-medium lg:mt-[58px]"
        >
          <img src="/figma/bookmark-cta.svg" alt="" width={20} height={24} className="h-[17px] w-auto md:h-6" />
          Save what you like
        </button>
      </div>

      <div ref={featuredRef} className="hero-featured hidden shrink-0 lg:block">
        {featured}
      </div>

      <svg
        ref={arrowRef}
        aria-hidden="true"
        fill="none"
        className="hero-flourish hero-arrow pointer-events-none absolute inset-0 hidden size-full overflow-visible lg:block"
      >
        <path data-arrow-line pathLength={1} className="hero-arrow-line" />
        <path data-arrow-head pathLength={1} className="hero-arrow-head" />
        <g className="hero-arrow-handle">
          <line data-handle-line />
          <circle data-handle-end r={3} />
          <circle data-handle-end r={3} />
          <circle data-handle-anchor r={4} className="hero-arrow-anchor" />
        </g>
        <circle data-arrow-start r={3.5} className="hero-arrow-node" />
      </svg>
    </section>
  );
}
