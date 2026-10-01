'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { CategoryIcon } from '@/components/ui/category-icon';
import type { AppDetail } from '@/lib/db/app-detail';
import type { GalleryApp } from '@/lib/db/gallery';
import { downloadImage } from '@/lib/image-actions';
import { playPatchSound, playSound } from '@/lib/sound';
import { ArrowUpRightIcon, BackIcon, BookmarkIcon, DownloadIcon } from './action-icons';
import { ScreenshotTile } from './screenshot-tile';
import { screenshotFileName, ScreenshotViewer } from './screenshot-viewer';

const PILL_BUTTON =
  'inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-background px-4 text-body font-medium text-foreground shadow-[0_0_0_1px_var(--card-border)] transition-colors duration-[120ms] hover:bg-surface disabled:cursor-default disabled:opacity-40 disabled:hover:bg-background';

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
  const backRef = useRef<HTMLButtonElement>(null);

  useEffect(() => backRef.current?.focus({ preventScroll: true }), []);

  const toggleSelected = (screenshotId: string) => {
    playSound('select');
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(screenshotId)) next.delete(screenshotId);
      else next.add(screenshotId);
      return next;
    });
  };

  const downloadSelected = () => {
    screenshots
      .filter((screenshot) => selectedIds.has(screenshot.id))
      .forEach((screenshot, order) =>
        window.setTimeout(() => downloadImage(screenshot.r2Url, screenshotFileName(app, screenshot.position)), order * 250),
      );
  };

  return (
    <section aria-labelledby="app-view-name">
      <div className="flex min-h-[58px] items-center">
        <button
          ref={backRef}
          type="button"
          onClick={() => {
            playPatchSound('page-exit');
            onBack();
          }}
          className="-ml-2 inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full pl-2 pr-3.5 text-body font-medium text-muted transition-colors duration-[120ms] hover:text-foreground"
        >
          <BackIcon size={20} />
          Back
        </button>
      </div>

      <div className="max-w-[760px] pt-[25px]">
        <div className="flex items-center gap-5">
          <AppIcon src={app.iconUrl} alt="" name={app.name} className="size-[88px] rounded-[22.37%]" />
          <div className="min-w-0 flex-1">
            <h1 id="app-view-name" className="text-title font-semibold text-card-title">
              {app.name}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-body text-muted">
              <CategoryIcon category={app.category} size={16} className="opacity-60" />
              {app.category}
              {app.developer && (
                <>
                  <span aria-hidden="true">·</span>
                  {app.developer}
                </>
              )}
            </p>
          </div>
          <button type="button" onClick={onToggleSaved} aria-pressed={saved} className={`${PILL_BUTTON} shrink-0`}>
            <BookmarkIcon filled={saved} />
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>

        {detail.status === 'loading' ? (
          <div aria-hidden="true" className="mt-6 space-y-2">
            <span className="skeleton block h-4 w-full rounded-full" />
            <span className="skeleton block h-4 w-2/3 rounded-full" />
          </div>
        ) : (
          detail.data && (
            <>
              {detail.data.description && <Description text={detail.data.description} />}
              <StoreFacts detail={detail.data} />
            </>
          )
        )}
      </div>

      <ScreenshotStrip
        app={viewApp}
        selectedIds={selectedIds}
        onExpand={setViewerIndex}
        onToggleSelected={toggleSelected}
        selectionActions={
          selectedIds.size > 0 && (
            <>
              <span className="text-body tabular-nums text-muted" aria-live="polite">
                {selectedIds.size} selected
              </span>
              <button type="button" onClick={downloadSelected} className={PILL_BUTTON}>
                <DownloadIcon />
                Download
              </button>
              <button type="button" onClick={() => setSelectedIds(new Set())} className={PILL_BUTTON}>
                Clear
              </button>
            </>
          )
        }
      />

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

type ScreenshotStripProps = {
  app: GalleryApp;
  selectedIds: ReadonlySet<string>;
  onExpand: (index: number) => void;
  onToggleSelected: (screenshotId: string) => void;
  selectionActions: React.ReactNode;
};

function ScreenshotStrip({ app, selectedIds, onExpand, onToggleSelected, selectionActions }: ScreenshotStripProps) {
  const rowRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });

  const measureEdges = () => {
    const row = rowRef.current;
    if (!row) return;
    const atStart = row.scrollLeft <= 1;
    const atEnd = row.scrollLeft + row.clientWidth >= row.scrollWidth - 1;
    setEdges((current) => (current.atStart === atStart && current.atEnd === atEnd ? current : { atStart, atEnd }));
  };

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const observer = new ResizeObserver(measureEdges);
    observer.observe(row);
    return () => observer.disconnect();
  }, [app.screenshots.length]);

  return (
    <div className="mt-12">
      <div className="flex min-h-10 flex-wrap items-center gap-3">
        <h2 className="text-body-lg font-semibold text-card-title">
          Screenshots <span className="font-normal tabular-nums text-muted">{app.screenshots.length}</span>
        </h2>
        <div className="ml-auto flex items-center gap-2">{selectionActions}</div>
      </div>

      {app.screenshots.length > 0 ? (
        <ul
          id="screenshot-row"
          ref={rowRef}
          onScroll={measureEdges}
          data-at-start={edges.atStart}
          data-at-end={edges.atEnd}
          className="screenshot-row chip-rail -mx-3 mt-4 flex gap-4 overflow-x-auto px-3 py-3"
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
              className="w-[clamp(168px,16vw,236px)] shrink-0"
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
  const isLong = text.length > 240;
  return (
    <div className="mt-6">
      <p id="app-description" className={`whitespace-pre-line text-body text-muted ${isExpanded || !isLong ? '' : 'line-clamp-3'}`}>
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="app-description"
          className="mt-1 cursor-pointer rounded-sm text-body font-medium text-foreground underline-offset-2 hover:underline"
        >
          {isExpanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

const compactCount = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const shortDate = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

function StoreFacts({ detail }: { detail: AppDetail }) {
  const facts: React.ReactNode[] = [];
  if (detail.rating !== null) {
    facts.push(
      <span key="rating" className="tabular-nums">
        <span aria-hidden="true">★ </span>
        <span className="sr-only">Rated </span>
        {detail.rating.toFixed(1)}
        {detail.ratingCount !== null && <span className="text-muted"> ({compactCount.format(detail.ratingCount)})</span>}
      </span>,
    );
  }
  if (detail.price) facts.push(<span key="price">{detail.price}</span>);
  if (detail.updatedAt && !Number.isNaN(Date.parse(detail.updatedAt))) {
    facts.push(<span key="updated">Updated {shortDate.format(new Date(detail.updatedAt))}</span>);
  }
  if (detail.appStoreUrl) {
    facts.push(
      <a
        key="store"
        href={detail.appStoreUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-0.5 rounded-sm font-medium text-foreground underline-offset-2 hover:underline"
      >
        App Store
        <ArrowUpRightIcon size={14} />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>,
    );
  }
  if (facts.length === 0) return null;

  return (
    <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-card-title">
      {facts.flatMap((fact, index) =>
        index === 0 ? [fact] : [<span key={`dot-${index}`} aria-hidden="true" className="text-muted">·</span>, fact],
      )}
    </p>
  );
}
