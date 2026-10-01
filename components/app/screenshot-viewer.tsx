'use client';

import { useEffect, useRef } from 'react';
import { GalleryImage } from '@/components/gallery/gallery-image';
import { copyLabel, useCopyImage } from '@/hooks/use-copy-image';
import { screenshotAltText } from '@/lib/alt-text';
import type { GalleryApp } from '@/lib/db/gallery';
import { downloadImage } from '@/lib/image-actions';
import { playSound } from '@/lib/sound';
import { ChevronIcon, CloseIcon, CopyIcon, DownloadIcon } from './action-icons';

type ScreenshotViewerProps = {
  app: GalleryApp;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

const BAR_BUTTON =
  'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-background px-3.5 text-body-sm font-medium text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_var(--card-border)] transition-colors duration-[120ms] hover:bg-surface';
const ROUND_BUTTON =
  'grid size-11 cursor-pointer place-items-center rounded-full bg-background text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_var(--card-border)] transition-colors duration-[120ms] hover:bg-surface';

export const screenshotFileName = (app: GalleryApp, position: number) => `${app.slug}-screenshot-${position + 1}.webp`;

export function ScreenshotViewer({ app, index, onIndexChange, onClose }: ScreenshotViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { state: copyState, copy } = useCopyImage();
  const total = app.screenshots.length;
  const screenshot = app.screenshots[index];
  const step = (offset: number) => onIndexChange((index + offset + total) % total);

  useEffect(() => {
    dialogRef.current?.showModal();
    playSound('open');
  }, []);

  const close = () => {
    playSound('close');
    dialogRef.current?.close();
  };

  if (!screenshot) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-label={`${app.name} screenshots`}
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') step(-1);
        if (event.key === 'ArrowRight') step(1);
      }}
      onClick={(event) => event.target === event.currentTarget && close()}
      className="viewer m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-foreground backdrop:bg-white/80 backdrop:backdrop-blur-xl"
    >
      <div className="viewer-content pointer-events-none flex h-full flex-col">
        <header className="pointer-events-auto flex items-center gap-3 px-4 py-4 md:px-8">
          <h2 className="min-w-0 truncate text-body font-semibold text-card-title">{app.name}</h2>
          <span className="rounded-full bg-surface px-2.5 py-0.5 text-body-sm tabular-nums text-muted">
            {index + 1} / {total}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => copy(screenshot.r2Url)} className={BAR_BUTTON}>
              <CopyIcon size={15} />
              {copyLabel(copyState)}
            </button>
            <button type="button" onClick={() => downloadImage(screenshot.r2Url, screenshotFileName(app, screenshot.position))} className={BAR_BUTTON}>
              <DownloadIcon size={15} />
              <span className="hidden sm:inline">Download</span>
              <span className="sr-only sm:hidden">Download</span>
            </button>
            <button type="button" onClick={close} aria-label="Close" className={`${ROUND_BUTTON} size-9`}>
              <CloseIcon />
            </button>
          </div>
          <span aria-live="polite" className="sr-only">
            {copyState === 'copied' ? 'Screenshot copied' : copyState === 'failed' ? "Couldn't copy the screenshot" : ''}
          </span>
        </header>

        <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 md:px-24">
          <GalleryImage
            key={screenshot.id}
            src={screenshot.r2Url}
            alt={screenshotAltText(app, screenshot)}
            className="pointer-events-auto aspect-[9/19.5] h-full max-h-[min(100%,720px)] rounded-[28px] outline-1 -outline-offset-1 outline-black/10 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.25)]"
          />
          {total > 1 && (
            <>
              <button type="button" onClick={() => step(-1)} aria-label="Previous screenshot" className={`${ROUND_BUTTON} pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2 md:left-8`}>
                <ChevronIcon direction="left" size={20} />
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Next screenshot" className={`${ROUND_BUTTON} pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 md:right-8`}>
                <ChevronIcon direction="right" size={20} />
              </button>
            </>
          )}
        </div>

        {total > 1 && (
          <nav aria-label="All screenshots" className="pointer-events-auto flex justify-center px-4 py-5">
            <ul className="chip-rail flex max-w-full gap-2 overflow-x-auto p-1">
              {app.screenshots.map((thumbnail, thumbnailIndex) => {
                const isCurrent = thumbnailIndex === index;
                return (
                  <li key={thumbnail.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => onIndexChange(thumbnailIndex)}
                      aria-current={isCurrent}
                      aria-label={`Screenshot ${thumbnailIndex + 1}`}
                      className={`block w-10 cursor-pointer overflow-hidden rounded-[8px] transition-opacity duration-[120ms] ${
                        isCurrent ? 'opacity-100 ring-2 ring-foreground ring-offset-2 ring-offset-background' : 'opacity-50 hover:opacity-100'
                      }`}
                    >
                      <GalleryImage src={thumbnail.r2Url} alt="" className="aspect-[9/19.5] w-full" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </dialog>
  );
}
