'use client';

import { useEffect, useRef } from 'react';
import { GalleryImage } from '@/components/gallery/gallery-image';
import { outlineButton } from '@/components/ui/button-styles';
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

const BAR_BUTTON = outlineButton({ surface: 'dark' });
const CLOSE_BUTTON = outlineButton({ size: 'icon-md', surface: 'dark' });
const ROUND_BUTTON = outlineButton({ size: 'icon-lg', surface: 'dark' });

const SWIPE_SLOP_PX = 8;
const SWIPE_MIN_DISTANCE_PX = 32;
const SWIPE_DISTANCE_RATIO = 0.25;
const SWIPE_MIN_VELOCITY = 0.1;
const SWIPE_ENTER_OFFSET_PX = 60;
const SETTLE_TRANSITION = 'translate 240ms cubic-bezier(0.23, 1, 0.32, 1)';

type Swipe = { pointerId: number; startX: number; startY: number; startTime: number; axis: 'x' | 'y' | null };

function useSwipe(onSwipe: (direction: 1 | -1) => void, isEnabled: boolean) {
  const stageRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<Swipe | null>(null);

  const settle = (fromX: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.transition = 'none';
    stage.style.translate = `${fromX}px 0`;
    stage.getBoundingClientRect();
    stage.style.transition = SETTLE_TRANSITION;
    stage.style.translate = '0px 0';
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (!isEnabled || event.pointerType === 'mouse') return;
    swipe.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, startTime: event.timeStamp, axis: null };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const current = swipe.current;
    const stage = stageRef.current;
    if (!current || !stage || current.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - current.startX;
    const deltaY = event.clientY - current.startY;
    if (!current.axis) {
      if (Math.hypot(deltaX, deltaY) < SWIPE_SLOP_PX) return;
      current.axis = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y';
      if (current.axis === 'x') event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (current.axis !== 'x') return;
    stage.style.transition = 'none';
    stage.style.translate = `${deltaX}px 0`;
  };

  const onPointerUp = (event: React.PointerEvent) => {
    const current = swipe.current;
    swipe.current = null;
    const stage = stageRef.current;
    if (!current || !stage || current.axis !== 'x') return;
    const deltaX = event.clientX - current.startX;
    const velocity = Math.abs(deltaX) / Math.max(event.timeStamp - current.startTime, 1);
    const isFarEnough = Math.abs(deltaX) > stage.offsetWidth * SWIPE_DISTANCE_RATIO;
    const isFlick = Math.abs(deltaX) > SWIPE_MIN_DISTANCE_PX && velocity > SWIPE_MIN_VELOCITY;
    if (!isFarEnough && !isFlick) {
      settle(deltaX);
      return;
    }
    const direction = deltaX < 0 ? 1 : -1;
    onSwipe(direction);
    settle(direction * SWIPE_ENTER_OFFSET_PX);
  };

  const onPointerCancel = () => {
    if (swipe.current?.axis === 'x') settle(Number.parseFloat(stageRef.current?.style.translate ?? '0') || 0);
    swipe.current = null;
  };

  return { stageRef, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } };
}

export const screenshotFileName = (app: GalleryApp, position: number) => `${app.slug}-screenshot-${position + 1}.webp`;

export function ScreenshotViewer({ app, index, onIndexChange, onClose }: ScreenshotViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { state: copyState, copy } = useCopyImage();
  const total = app.screenshots.length;
  const screenshot = app.screenshots[index];
  const step = (offset: number) => {
    playSound('tick');
    onIndexChange((index + offset + total) % total);
  };
  const { stageRef, handlers: swipeHandlers } = useSwipe(step, total > 1);

  useEffect(() => {
    dialogRef.current?.showModal();
    playSound('modal-open');
  }, []);

  const close = () => dialogRef.current?.close();

  if (!screenshot) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-label={`${app.name} screenshots`}
      onClose={() => {
        playSound('modal-close');
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') step(-1);
        if (event.key === 'ArrowRight') step(1);
      }}
      onClick={(event) => event.target === event.currentTarget && close()}
      className="viewer m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-white backdrop:bg-[rgb(10_10_10/0.82)] backdrop:backdrop-blur-xl"
    >
      <div className="viewer-content pointer-events-none flex h-full flex-col">
        <header className="pointer-events-auto flex items-center gap-3 px-4 py-4 md:px-8">
          <h2 className="min-w-0 truncate text-body font-semibold text-white">{app.name}</h2>
          <span className="shrink-0 whitespace-nowrap rounded-full bg-white/10 px-2.5 py-0.5 text-body-sm tabular-nums text-white/80">
            {index + 1} / {total}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => copy(screenshot.r2Url)} className={`${BAR_BUTTON} max-sm:px-4`}>
              <CopyIcon size={16} />
              {copyLabel(copyState)}
            </button>
            <button
              type="button"
              onClick={() => {
                playSound('save');
                downloadImage(screenshot.r2Url, screenshotFileName(app, screenshot.position));
              }}
              className={`${BAR_BUTTON} max-sm:w-[35px] max-sm:px-0`}
            >
              <DownloadIcon size={16} />
              <span className="max-sm:sr-only">Download</span>
            </button>
            <button type="button" onClick={close} aria-label="Close" className={CLOSE_BUTTON}>
              <CloseIcon />
            </button>
          </div>
          <span aria-live="polite" className="sr-only">
            {copyState === 'copied' ? 'Screenshot copied' : copyState === 'failed' ? "Couldn't copy the screenshot" : ''}
          </span>
        </header>

        <div
          {...swipeHandlers}
          onClick={(event) => event.target === event.currentTarget && close()}
          className="pointer-events-auto relative flex min-h-0 flex-1 touch-pan-y items-center justify-center px-4 md:px-24"
        >
          <div ref={stageRef} className="flex h-full items-center justify-center">
            <GalleryImage
              key={screenshot.id}
              src={screenshot.r2Url}
              alt={screenshotAltText(app, screenshot)}
              className="aspect-[9/19.5] h-full max-h-[min(100%,720px)] select-none rounded-[28px] shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_40px_100px_-30px_rgba(0,0,0,0.9)]"
            />
          </div>
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
            <ul className="flex max-w-full gap-2 overflow-x-auto p-1">
              {app.screenshots.map((thumbnail, thumbnailIndex) => {
                const isCurrent = thumbnailIndex === index;
                return (
                  <li key={thumbnail.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isCurrent) playSound('select');
                        onIndexChange(thumbnailIndex);
                      }}
                      aria-current={isCurrent}
                      aria-label={`Screenshot ${thumbnailIndex + 1}`}
                      className={`block w-10 cursor-pointer overflow-hidden rounded-[8px] transition-opacity duration-[120ms] ${
                        isCurrent ? 'opacity-100 outline-2 outline-offset-2 outline-white' : 'opacity-45 hover:opacity-100'
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
