'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

const OPEN_DELAY_MS = 450;
const WARM_GRACE_MS = 300;
const GAP_PX = 6;
const PADDING_X = 10;

type TooltipApi = { showLabel: (index: number) => void };

export function useSpatialTooltip() {
  const containerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<TooltipApi>(null);
  const timers = useRef({ open: 0, cool: 0 });
  const isVisible = useRef(false);
  const isWarm = useRef(false);

  const place = useCallback((target: HTMLElement, index: number) => {
    const container = containerRef.current;
    const tooltip = tooltipRef.current;
    if (!container || !tooltip) return;
    const box = target.getBoundingClientRect();
    const origin = container.getBoundingClientRect();
    tooltip.style.translate = `${box.right - origin.left + GAP_PX}px ${box.top - origin.top + box.height / 2}px`;
    apiRef.current?.showLabel(index);
  }, []);

  const reveal = useCallback(
    (target: HTMLElement, index: number) => {
      const tooltip = tooltipRef.current;
      if (!tooltip) return;
      tooltip.dataset.moving = 'false';
      place(target, index);
      void tooltip.offsetWidth;
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

  const triggerProps = (index: number) => ({
    onPointerEnter: (event: React.PointerEvent<HTMLElement>) => {
      if (event.pointerType === 'mouse') show(event.currentTarget, index);
    },
    onFocus: (event: React.FocusEvent<HTMLElement>) => {
      if (event.currentTarget.matches(':focus-visible')) show(event.currentTarget, index, true);
    },
    onBlur: hide,
  });

  return { containerRef, tooltipRef, apiRef, triggerProps, hide };
}

type SpatialTooltipProps = {
  labels: string[];
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  apiRef: React.RefObject<TooltipApi | null>;
};

export function SpatialTooltip({ labels, tooltipRef, apiRef }: SpatialTooltipProps) {
  const [label, setLabel] = useState({ index: 0, direction: 1 });
  const bodyRef = useRef<HTMLDivElement>(null);
  const measureRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useImperativeHandle(
    apiRef,
    () => ({
      showLabel: (index: number) => {
        const body = bodyRef.current;
        const widest = Math.max(...measureRefs.current.map((span) => span?.offsetWidth ?? 0));
        const width = measureRefs.current[index]?.offsetWidth ?? widest;
        if (body) body.style.clipPath = `inset(0 ${widest - width}px 0 0 round 8px)`;
        setLabel((current) => (current.index === index ? current : { index, direction: index > current.index ? 1 : -1 }));
      },
    }),
    [],
  );

  return (
    <div ref={tooltipRef} aria-hidden="true" data-open="false" data-moving="false" className="spatial-tooltip pointer-events-none absolute left-0 top-0 z-20">
      <div className="spatial-tooltip-bubble flex -translate-y-1/2 items-center">
        <svg viewBox="0 0 6 12" className="-mr-px block h-3 w-[6px] shrink-0 text-ink" fill="currentColor">
          <path d="M6 0v12L1.1 7.4a2 2 0 0 1 0-2.8z" />
        </svg>
        <div ref={bodyRef} className="spatial-tooltip-body relative h-7 overflow-hidden bg-ink">
          <div className="invisible grid h-full">
            {labels.map((text, index) => (
              <span
                key={text}
                ref={(span) => {
                  measureRefs.current[index] = span;
                }}
                className="col-start-1 row-start-1 self-center justify-self-start whitespace-nowrap text-body-sm font-medium"
                style={{ paddingInline: PADDING_X }}
              >
                {text}
              </span>
            ))}
          </div>
          <AnimatePresence mode="popLayout" initial={false} custom={label.direction}>
            <motion.span
              key={label.index}
              custom={label.direction}
              variants={{
                enter: (direction: number) => ({ y: direction * 14, opacity: 0 }),
                center: { y: 0, opacity: 1 },
                exit: (direction: number) => ({ y: direction * -14, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="absolute inset-0 grid items-center justify-items-start whitespace-nowrap text-body-sm font-medium text-background"
              style={{ paddingInline: PADDING_X }}
            >
              {labels[label.index]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
