'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { BackButton } from '@/components/ui/back-button';
import { outlineButton } from '@/components/ui/button-styles';
import { CategoryIcon } from '@/components/ui/category-icon';
import { copyLabel, useCopyImage } from '@/hooks/use-copy-image';
import type { AppDetail } from '@/lib/db/app-detail';
import type { GalleryApp } from '@/lib/db/gallery';
import { downloadImage } from '@/lib/image-actions';
import { playPatchSound, playSound } from '@/lib/sound';
import { ArrowUpRightIcon, BookmarkIcon, CheckIcon, CloseIcon, CopyIcon, DownloadIcon } from './action-icons';
import { ScreenshotTile } from './screenshot-tile';
import { screenshotFileName, ScreenshotViewer } from './screenshot-viewer';


type AppViewProps = {
  app: GalleryApp;
  saved: boolean;
  onToggleSaved: () => void;
  onBack: () => void;
};

export function AppView({ app, saved, onToggleSaved, onBack }: AppViewProps) {
  const detail = useAppDetail(app.slug);
  const screenshots = detail.data?.screenshots ?? app.screenshots;
  const viewApp = useMemo(() => ({ ...app, screenshots }), [app, screenshots]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());
  const toggleSelected = (screenshotId: string) => {
    playSound('select');
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(screenshotId)) next.delete(screenshotId);
      else next.add(screenshotId);
      return next;
    });
  };

  const selectedScreenshots = screenshots.filter((screenshot) => selectedIds.has(screenshot.id));

  const downloadSelected = () => {
    selectedScreenshots.forEach((screenshot, order) =>
      window.setTimeout(() => downloadImage(screenshot.r2Url, screenshotFileName(app, screenshot.position)), order * 250),
    );
  };

  const clearSelection = (event: React.MouseEvent) => {
    playPatchSound('deselect');
    const firstSelected = selectedScreenshots[0];
    setSelectedIds(new Set());
    if (event.detail === 0 && firstSelected) {
      document.querySelector<HTMLElement>(`[data-select-for="${CSS.escape(firstSelected.id)}"]`)?.focus();
    }
  };

  return (
    <section aria-labelledby="app-view-name" className="pb-6">
      <BackButton onBack={onBack} />

      <div className="max-w-[760px] pt-3 sm:pt-[25px]">
        <div className="flex items-center gap-4 sm:gap-5">
          <AppIcon src={app.iconUrl} alt="" name={app.name} className="size-[76px] shrink-0 rounded-[22.37%] sm:size-[88px]" />
          <div className="min-w-0 flex-1">
            <h1 id="app-view-name" className="text-[1.5rem] leading-[1.15] font-semibold tracking-[-0.03em] text-card-title">
              {app.name}
            </h1>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <p className={TAG}>
                <CategoryIcon category={app.category} size={14} className="opacity-60" />
                {app.category}
              </p>
              <button type="button" onClick={onToggleSaved} aria-pressed={saved} className={`${saved ? TAG_ACTION_ON : TAG_ACTION} sm:hidden`}>
                <BookmarkIcon filled={saved} size={13} />
                {saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
          <button type="button" onClick={onToggleSaved} aria-pressed={saved} className={`${outlineButton()} gap-2 max-sm:hidden`}>
            <BookmarkIcon filled={saved} />
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>

        {detail.status === 'loading' ? (
          <div aria-hidden="true" className="mt-5 space-y-4">
            <div className="space-y-2">
              <span className="skeleton block h-3.5 w-full rounded-full" />
              <span className="skeleton block h-3.5 w-2/3 rounded-full" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[88, 52, 120, 140, 96].map((width) => (
                <span key={width} className="skeleton block h-7 rounded-full" style={{ width }} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {detail.data?.description && <Description text={detail.data.description} />}
            <StoreTags detail={detail.data} developer={app.developer} />
          </>
        )}
      </div>

      <ScreenshotStrip
        app={viewApp}
        selectedIds={selectedIds}
        onExpand={setViewerIndex}
        onToggleSelected={toggleSelected}
      />

      <p aria-live="polite" className="sr-only">
        {selectedIds.size > 0 ? `${selectedIds.size} selected` : ''}
      </p>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <SelectionBar
              count={selectedIds.size}
              copySource={selectedScreenshots.length === 1 ? selectedScreenshots[0].r2Url : null}
              onClear={clearSelection}
              onDownload={downloadSelected}
            />
          )}
        </AnimatePresence>
      </div>

      {viewerIndex !== null && (
        <ScreenshotViewer app={viewApp} index={viewerIndex} onIndexChange={setViewerIndex} onClose={() => setViewerIndex(null)} />
      )}
    </section>
  );
}

type DetailState = { status: 'loading' | 'ready' | 'failed'; data: AppDetail | null };

function useAppDetail(slug: string): DetailState {
  const [state, setState] = useState<DetailState>({ status: 'loading', data: null });
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/apps/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then((response) => (response.ok ? (response.json() as Promise<AppDetail>) : Promise.reject(new Error(`${response.status}`))))
      .then((data) => setState({ status: 'ready', data }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'failed', data: null });
      });
    return () => controller.abort();
  }, [slug]);
  return state;
}

const BAR_ICON = outlineButton({ size: 'icon-lg' });
const BAR_PILL = `${outlineButton({ size: 'lg' })} max-[359px]:w-11 max-[359px]:px-0 h-11`;
const BAR_LABEL = 'max-[359px]:sr-only';

type SelectionBarProps = {
  count: number;
  copySource: string | null;
  onClear: (event: React.MouseEvent) => void;
  onDownload: () => void;
};

function SelectionBar({ count, copySource, onClear, onDownload }: SelectionBarProps) {
  const { state: copyState, copy } = useCopyImage();
  const noun = count === 1 ? 'screenshot' : 'screenshots';

  return (
    <motion.div
      role="group"
      aria-label="Selected screenshots"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.15, ease: 'easeOut' } }}
      transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
      className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-background p-1.5 pl-5 text-foreground shadow-[0_16px_40px_-12px_rgba(0,0,0,0.3),0_0_0_1px_var(--card-border)]"
    >
      <span className="min-w-5 text-body font-medium tabular-nums">{count}</span>
      <span aria-hidden="true" className="ml-2.5 mr-1 h-5 w-px bg-border" />
      <button type="button" onClick={onClear} aria-label="Clear selection" title="Clear selection" className={BAR_ICON}>
        <CloseIcon size={18} />
      </button>
      <button
        type="button"
        onClick={() => copySource && copy(copySource)}
        disabled={!copySource}
        title={copySource ? undefined : 'Select one screenshot to copy'}
        className={BAR_PILL}
      >
        {copyState === 'copied' ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
        <span className={BAR_LABEL}>{copyLabel(copyState)}</span>
        <span className="sr-only">{copySource ? ' screenshot' : ' (select one screenshot to copy)'}</span>
      </button>
      <button type="button" onClick={onDownload} className={BAR_PILL}>
        <DownloadIcon size={18} />
        <span className={BAR_LABEL}>Download</span>
        <span className="sr-only">
          {' '}
          {count} {noun}
        </span>
      </button>
      <span aria-live="polite" className="sr-only">
        {copyState === 'copied' ? 'Screenshot copied' : copyState === 'failed' ? "Couldn't copy the screenshot" : ''}
      </span>
    </motion.div>
  );
}

type ScreenshotStripProps = {
  app: GalleryApp;
  selectedIds: ReadonlySet<string>;
  onExpand: (index: number) => void;
  onToggleSelected: (screenshotId: string) => void;
};

function ScreenshotStrip({ app, selectedIds, onExpand, onToggleSelected }: ScreenshotStripProps) {
  return (
    <div className="mt-12">
      <h2 className="text-body-lg font-semibold text-card-title">
        Screenshots <span className="font-normal tabular-nums text-muted">{app.screenshots.length}</span>
      </h2>

      {app.screenshots.length > 0 ? (
        <ul
          id="screenshot-row"
          className="chip-rail -mx-3 mt-4 flex gap-4 overflow-x-auto px-3 py-3"
        >
          {app.screenshots.map((screenshot, index) => (
            <ScreenshotTile
              key={screenshot.id}
              app={app}
              screenshot={screenshot}
              selected={selectedIds.has(screenshot.id)}
              isSelecting={selectedIds.size > 0}
              onExpand={() => onExpand(index)}
              onToggleSelected={() => onToggleSelected(screenshot.id)}
              className="w-[62vw] max-w-[236px] shrink-0 sm:w-[clamp(168px,16vw,236px)]"
            />
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-body text-muted">No screenshots for this app yet.</p>
      )}
    </div>
  );
}

function Description({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const element = textRef.current;
    if (!element || isExpanded) return;
    const measure = () => setIsClamped(element.scrollHeight > element.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [isExpanded, text]);

  return (
    <div className="mt-4 sm:mt-6">
      <p
        ref={textRef}
        id="app-description"
        className={`whitespace-pre-line text-body-sm leading-[1.6] text-muted sm:text-body sm:leading-normal ${isExpanded ? '' : 'line-clamp-2 sm:line-clamp-3'}`}
      >
        {text}
      </p>
      {(isClamped || isExpanded) && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="app-description"
          className="mt-1 cursor-pointer rounded-sm text-body-sm font-medium text-foreground underline-offset-2 hover:underline sm:text-body"
        >
          {isExpanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

const compactCount = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const shortDate = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

const TAG_SHAPE = 'inline-flex h-7 w-fit items-center gap-1.5 rounded-full border px-3 text-[0.8125rem] tracking-[-0.01em] whitespace-nowrap';
const TAG = `${TAG_SHAPE} border-border text-muted`;
const TAG_VALUE = 'font-medium text-card-title tabular-nums';
const TAG_ACTION_SHAPE = `${TAG_SHAPE} cursor-pointer font-medium transition-[color,background-color,border-color,scale] duration-150 ease-[ease] active:scale-[0.97]`;
const TAG_ACTION = `${TAG_ACTION_SHAPE} border-border-strong text-foreground hover:border-ink hover:bg-ink hover:text-background`;
const TAG_ACTION_ON = `${TAG_ACTION_SHAPE} border-ink bg-ink text-background`;

function StoreTags({ detail, developer }: { detail: AppDetail | null; developer: string }) {
  const updated = detail?.updatedAt && !Number.isNaN(Date.parse(detail.updatedAt)) ? shortDate.format(new Date(detail.updatedAt)) : null;

  return (
    <ul aria-label="App details" className="mt-4 flex flex-wrap gap-2">
      {detail?.rating != null && (
        <li className={TAG}>
          <span aria-hidden="true">★</span>
          <span className="sr-only">Rated</span>
          <span className={TAG_VALUE}>{detail.rating.toFixed(1)}</span>
          {detail.ratingCount !== null && (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {compactCount.format(detail.ratingCount)}
                <span className="sr-only"> ratings</span>
              </span>
            </>
          )}
        </li>
      )}
      {detail?.price && (
        <li className={TAG}>
          <span className={TAG_VALUE}>{detail.price}</span>
        </li>
      )}
      {developer && (
        <li className={`${TAG} max-w-full`}>
          by <span className={`${TAG_VALUE} truncate`}>{developer}</span>
        </li>
      )}
      {updated && (
        <li className={TAG}>
          updated <span className={TAG_VALUE}>{updated}</span>
        </li>
      )}
      {detail?.appStoreUrl && (
        <li>
          <a href={detail.appStoreUrl} target="_blank" rel="noreferrer" className={TAG_ACTION}>
            App Store
            <ArrowUpRightIcon size={13} />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      )}
    </ul>
  );
}
