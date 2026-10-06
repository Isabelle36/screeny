'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Chip } from '@/components/ui/chip';

type CategoryChipsProps = {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
};


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

  const leftStop = canScroll.left ? 'var(--chip-fade)' : '0px';
  const rightStop = canScroll.right ? 'calc(100% - var(--chip-fade))' : '100%';
  const mask = `linear-gradient(to right, transparent 0, #000 ${leftStop}, #000 ${rightStop}, transparent 100%)`;

  return (
    <div data-flip-group="" data-flip="move" className="relative">
      <div
        ref={railRef}
        onScroll={updateScrollEdges}
        role="group"
        aria-label="Filter by category"
        className="flex gap-2 overflow-x-auto py-2 [--chip-fade:40px] lg:gap-[25px] lg:py-2.5 lg:[--chip-fade:96px]"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
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
    </div>
  );
}
