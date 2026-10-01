'use client';

import { GalleryImage } from '@/components/gallery/gallery-image';
import { copyLabel, useCopyImage } from '@/hooks/use-copy-image';
import { screenshotAltText } from '@/lib/alt-text';
import type { GalleryApp, GalleryScreenshot } from '@/lib/db/gallery';
import { CheckIcon, CopyIcon, ExpandIcon } from './action-icons';

// White pill over a screenshot — same surface as the cards' save button.
export const OVERLAY_PILL =
  'inline-flex h-9 items-center gap-1.5 rounded-full bg-background/95 px-3.5 text-body-sm font-medium text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.12),0_0_0_0.5px_rgba(0,0,0,0.08)]';
// Hover-revealed controls: hidden until the tile is hovered, always shown for keyboard focus and on touch.
const REVEAL = 'opacity-0 transition-opacity duration-150 ease-out group-hover/shot:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100';

type ScreenshotTileProps = {
  app: GalleryApp;
  screenshot: GalleryScreenshot;
  selected: boolean;
  // Once anything is selected, every tile shows its select circle, so picking more doesn't need hovering.
  isSelecting: boolean;
  onExpand: () => void;
  onToggleSelected: () => void;
  // Sizing from the row (fixed width, no shrinking).
  className?: string;
};

// On hover the screenshot lifts a little and offers Expand (center — clicking anywhere on it does the
// same), Copy (bottom) and a select circle (top-right).
export function ScreenshotTile({ app, screenshot, selected, isSelecting, onExpand, onToggleSelected, className = '' }: ScreenshotTileProps) {
  const { state: copyState, copy } = useCopyImage();
  const alt = screenshotAltText(app, screenshot);

  return (
    <li className={`group/shot relative transition-[scale] duration-200 ease-out motion-safe:hover:scale-[1.02] ${className}`}>
      <button type="button" onClick={onExpand} className="block w-full cursor-pointer rounded-[var(--shot-radius)] text-left">
        <span
          className={`relative block overflow-hidden rounded-[inherit] outline-1 -outline-offset-1 outline-black/10 ${
            selected ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background' : ''
          }`}
        >
          <GalleryImage src={screenshot.r2Url} alt={alt} className="aspect-[9/19.5] w-full" />
          <span aria-hidden="true" className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover/shot:bg-black/10" />
          <span aria-hidden="true" className={`${OVERLAY_PILL} ${REVEAL} absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`}>
            <ExpandIcon size={15} />
            Expand
          </span>
        </span>
        <span className="sr-only">, expand</span>
      </button>

      <button
        type="button"
        onClick={() => copy(screenshot.r2Url)}
        className={`${OVERLAY_PILL} ${copyState === 'idle' ? REVEAL : ''} absolute bottom-3 left-1/2 -translate-x-1/2 cursor-pointer`}
      >
        <CopyIcon size={15} />
        {copyLabel(copyState)}
        <span className="sr-only"> screenshot {screenshot.position + 1}</span>
      </button>

      <button
        type="button"
        onClick={onToggleSelected}
        aria-pressed={selected}
        aria-label={`Select screenshot ${screenshot.position + 1}`}
        className={`absolute right-3 top-3 grid size-7 cursor-pointer place-items-center rounded-full transition-[opacity,background-color] duration-150 ease-out before:absolute before:-inset-2 before:content-[''] ${
          selected
            ? 'bg-foreground text-background'
            : `bg-background/80 text-transparent shadow-[0_0_0_1.5px_rgba(0,0,0,0.25)] ${isSelecting ? '' : REVEAL}`
        }`}
      >
        <CheckIcon size={14} />
      </button>

      <span aria-live="polite" className="sr-only">
        {copyState === 'copied' ? 'Screenshot copied' : copyState === 'failed' ? "Couldn't copy the screenshot" : ''}
      </span>
    </li>
  );
}
