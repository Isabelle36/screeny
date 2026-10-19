'use client';

import { Children, useLayoutEffect, useRef, useState } from 'react';

const VARIANT_CLASSES = {
  cards: 'grid-cols-1 gap-x-[2vw] gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-[65px]',
  // auto-fill = column count follows the real width, so sidebar open/closed just works.
  // clamp keeps the icon size in a tight range (~85-110px) on every screen.
  icons: 'grid-cols-[repeat(auto-fill,minmax(clamp(96px,9vw,132px),1fr))] gap-x-2 gap-y-[clamp(44px,5vw,76px)]',
};

type GridProps = {
  variant: keyof typeof VARIANT_CLASSES;
  label: string;
  children: React.ReactNode;
};

type Shelf = { top: number; left: number; width: number; height: number };

const sameShelves = (a: Shelf[], b: Shelf[]) =>
  a.length === b.length && a.every((s, i) => s.top === b[i].top && s.left === b[i].left && s.width === b[i].width && s.height === b[i].height);

// Positions are all % of the row box (an IconCard is a square: icon = top 82%).
// shelf starts a bit above the icon's bottom edge so the icon "sits" in the glass
const SHELF_PANEL = [
  'absolute inset-x-0 top-[74%] h-[32%] rounded-full',
  'border border-white/90',
  'bg-[linear-gradient(90deg,rgba(150,222,255,0.5),rgba(196,218,255,0.42)_50%,rgba(214,196,255,0.5))]',
  'shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_-6px_12px_-6px_rgba(110,160,230,0.25),0_14px_28px_-14px_rgba(80,120,200,0.45)]',
].join(' ');

export function Grid({ variant, label, children }: GridProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const hasShelves = variant === 'icons';
  const itemCount = Children.count(children);

  // group the cards by row (same offsetTop) and measure how wide each row is.
  // this way the shelf always matches the real layout, whatever the column count is
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!hasShelves || !list) return;

    const measure = () => {
      const rows = new Map<number, Shelf>();
      for (const item of Array.from(list.children) as HTMLElement[]) {
        const left = item.offsetLeft;
        const right = left + item.offsetWidth;
        const row = rows.get(item.offsetTop);
        rows.set(
          item.offsetTop,
          row
            ? { ...row, left: Math.min(row.left, left), width: Math.max(row.left + row.width, right) - Math.min(row.left, left) }
            : { top: item.offsetTop, left, width: right - left, height: item.offsetHeight },
        );
      }
      const next = [...rows.values()];
      setShelves((prev) => (sameShelves(prev, next) ? prev : next));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [hasShelves, itemCount]);

  if (!hasShelves) {
    return (
      <ul aria-label={label} className={`grid ${VARIANT_CLASSES[variant]}`}>
        {children}
      </ul>
    );
  }

  return (
    <div className="relative">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {shelves.map((shelf) => (
          <div key={shelf.top} className="absolute" style={shelf}>
            <div className={SHELF_PANEL}>
              <span className="absolute inset-x-[5%] top-[3px] h-[45%] rounded-full bg-gradient-to-b from-white/80 to-white/0" />
            </div>
          </div>
        ))}
      </div>
      <ul ref={listRef} aria-label={label} className={`relative grid ${VARIANT_CLASSES[variant]}`}>
        {children}
      </ul>
    </div>
  );
}