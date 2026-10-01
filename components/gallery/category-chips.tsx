'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Chip } from '@/components/ui/chip';

type CategoryChipsProps = {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
};

const SCROLL_STEP_PX = 240;

export function CategoryChips({ categories, selected, onSelect }: CategoryChipsProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: false });

  const updateScrollEdges = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setCanScroll({
      left: rail.scrollLeft > 4,
      right: rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    updateScrollEdges();
    window.addEventListener('resize', updateScrollEdges);
    return () => window.removeEventListener('resize', updateScrollEdges);
  }, [updateScrollEdges]);

  const scrollRail = (direction: 1 | -1) => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    railRef.current?.scrollBy({ left: direction * SCROLL_STEP_PX, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <div className="relative">
      <div
        ref={railRef}
        onScroll={updateScrollEdges}
        role="group"
        aria-label="Filter by category"
        className="chip-rail flex gap-3 overflow-x-auto py-2.5 lg:gap-[25px]"
      >
        <Chip label="All" pressed={selected === null} onPress={() => onSelect(null)} />
        {categories.map((category) => (
          <Chip
            key={category}
            label={category}
            iconCategory={category}
            pressed={selected === category}
            onPress={() => onSelect(selected === category ? null : category)}
          />
        ))}
      </div>
      {/* Fades + arrows are a pointer affordance; keyboard users reach every chip by Tab, which scrolls them into view. */}
      <EdgeFade side="left" visible={canScroll.left} onClick={() => scrollRail(-1)} />
      <EdgeFade side="right" visible={canScroll.right} onClick={() => scrollRail(1)} />
    </div>
  );
}

function EdgeFade({ side, visible, onClick }: { side: 'left' | 'right'; visible: boolean; onClick: () => void }) {
  const isLeft = side === 'left';
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-y-0 flex w-24 items-center transition-opacity duration-150 ${
        isLeft ? 'left-0 bg-linear-to-r' : 'right-0 justify-end bg-linear-to-l'
      } from-background from-40% to-transparent ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <button
        type="button"
        tabIndex={-1}
        onClick={onClick}
        className={`rounded-full border border-border-strong bg-surface px-2 py-0.5 text-body-sm ${visible ? 'pointer-events-auto' : ''}`}
      >
        {isLeft ? '←' : '→'}
      </button>
    </div>
  );
}
