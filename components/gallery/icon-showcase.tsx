'use client';

import { useLayoutEffect, useState } from 'react';
import type { GalleryApp } from '@/lib/db/gallery';
import { IconCard } from './icon-card';

type IconShowcaseProps = {
  apps: GalleryApp[];
  isSaved: (appId: string) => boolean;
  onToggleSaved: (appId: string) => void;
};

// Keep row membership tied to the viewport. Sidebar animation changes available
// space, so cells scale smoothly without moving icons onto different rows.
function columnsForWidth(width: number) {
  if (width >= 1280) return 8;
  if (width >= 1024) return 7;
  if (width >= 768) return 5;
  if (width >= 640) return 4;
  return 3;
}

// % values are relative to the row (= one square card): icon ends at 82%,
// shelf starts a bit above that so the icon sits inside the glass
const SHELF = [
  'pointer-events-none absolute -inset-x-2 top-[72%] h-[36%] rounded-full',
  'bg-[linear-gradient(90deg,rgba(246,248,249,0.52),rgba(255,255,255,0.74)_50%,rgba(246,245,249,0.54))]',
  'backdrop-blur-md',
  'shadow-[inset_0_1px_2px_rgba(255,255,255,0.68),inset_0_-8px_14px_-10px_rgba(45,55,65,0.2),0_0_18px_rgba(160,175,185,0.16),0_14px_24px_-14px_rgba(35,45,55,0.32)]',
].join(' ');

export function IconShowcase({ apps, isSaved, onToggleSaved }: IconShowcaseProps) {
  const [columns, setColumns] = useState(3);

  useLayoutEffect(() => {
    const update = () => setColumns(columnsForWidth(window.innerWidth));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const rows = Array.from({ length: Math.ceil(apps.length / columns) }, (_, index) => apps.slice(index * columns, (index + 1) * columns));

  return (
    <div data-flip-group="" data-flip="scale" className="space-y-14 sm:space-y-[4.5rem]">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="relative">
          <div aria-hidden="true" className={SHELF}>
            <span className="absolute inset-x-[5%] top-[3px] h-[45%] rounded-full bg-gradient-to-b from-white/80 to-white/0" />
          </div>
          <ul
            aria-label={`App icons, row ${rowIndex + 1}`}
            className="relative grid gap-x-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {row.map((app) => (
              <IconCard key={app.id} app={app} saved={isSaved(app.id)} onToggleSaved={() => onToggleSaved(app.id)} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
