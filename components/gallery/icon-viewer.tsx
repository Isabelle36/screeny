'use client';

import { useEffect, useRef } from 'react';
import { BookmarkIcon, CloseIcon, CopyIcon, DownloadIcon } from '@/components/app/action-icons';
import { AppIcon } from '@/components/ui/app-icon';
import { outlineButton } from '@/components/ui/button-styles';
import { copyLabel, useCopyImage } from '@/hooks/use-copy-image';
import { appIconAltText } from '@/lib/alt-text';
import type { GalleryApp } from '@/lib/db/gallery';
import { downloadImage } from '@/lib/image-actions';
import { playSound } from '@/lib/sound';

type IconViewerProps = {
  app: GalleryApp;
  saved: boolean;
  onToggleSaved: () => void;
  onClose: () => void;
};

const BAR_BUTTON = `${outlineButton({ surface: 'dark' })} max-sm:px-4`;
const CLOSE_BUTTON = outlineButton({ size: 'icon-md', surface: 'dark' });

export function IconViewer({ app, saved, onToggleSaved, onClose }: IconViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { state: copyState, copy } = useCopyImage();

  useEffect(() => {
    dialogRef.current?.showModal();
    playSound('modal-open');
  }, []);

  const close = () => dialogRef.current?.close();
  const closeOnBackdrop = (event: React.MouseEvent) => event.target === event.currentTarget && close();

  return (
    <dialog
      ref={dialogRef}
      aria-label={`${app.name} icon`}
      onClose={() => {
        playSound('modal-close');
        onClose();
      }}
      onClick={closeOnBackdrop}
      className="viewer m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-white backdrop:bg-[rgb(10_10_10/0.82)] backdrop:backdrop-blur-xl"
    >
      <div onClick={closeOnBackdrop} className="viewer-content relative flex h-full flex-col items-center justify-center gap-6 px-6">
        <button type="button" onClick={close} aria-label="Close" className={`${CLOSE_BUTTON} absolute right-4 top-4 md:right-8`}>
          <CloseIcon />
        </button>

        <AppIcon
          src={app.iconUrl}
          alt={appIconAltText(app)}
          name={app.name}
          className="size-[min(56vw,240px)] rounded-[22%] shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_40px_100px_-30px_rgba(0,0,0,0.9)]"
        />

        <div className="text-center">
          <h2 className="text-title font-semibold text-white">{app.name}</h2>
          <p className="text-body text-white/70">{app.category}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {app.iconUrl && (
            <>
              <button type="button" onClick={() => copy(app.iconUrl)} className={BAR_BUTTON}>
                <CopyIcon size={16} />
                {copyLabel(copyState)}
              </button>
              <button
                type="button"
                onClick={() => {
                  playSound('save');
                  downloadImage(app.iconUrl, `${app.slug}-icon.webp`);
                }}
                className={BAR_BUTTON}
              >
                <DownloadIcon size={16} />
                Download
              </button>
            </>
          )}
          <button type="button" onClick={onToggleSaved} aria-pressed={saved} className={BAR_BUTTON}>
            <BookmarkIcon filled={saved} size={16} />
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>

        <span aria-live="polite" className="sr-only">
          {copyState === 'copied' ? `${app.name} icon copied` : copyState === 'failed' ? `Couldn't copy the ${app.name} icon` : ''}
        </span>
      </div>
    </dialog>
  );
}
