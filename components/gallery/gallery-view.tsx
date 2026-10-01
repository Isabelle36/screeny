'use client';

import { MotionConfig } from 'motion/react';
import { useMemo, useRef, useState } from 'react';
import { CommandPalette } from '@/components/command/command-palette';
import { Hero } from '@/components/layout/hero';
import { Nav } from '@/components/layout/nav';
import { Sidebar } from '@/components/layout/sidebar';
import { Chip } from '@/components/ui/chip';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { useCommandPalette } from '@/hooks/use-command-palette';
import { SIDEBAR_TABS, SCREENSHOTS_PER_CARD, toCardGroups, type BrowseTab } from '@/lib/browse';
import type { GalleryApp } from '@/lib/db/gallery';
import { playSound } from '@/lib/sound';
import { AppCard } from './app-card';
import { CategoryChips } from './category-chips';
import { EmptyState } from './empty-state';
import { FeaturedRotator } from './featured-rotator';
import { Grid } from './grid';
import { IconCard } from './icon-card';

type GalleryViewProps = { apps: GalleryApp[]; categories: string[] };

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Owns browse state (tab, category, app filter, sidebar) and lays out the page.
// Data arrives fully loaded from the server component; everything here is client-side filtering.
export function GalleryView({ apps, categories }: GalleryViewProps) {
  const [activeTab, setActiveTab] = useState<BrowseTab>('screenshots');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const { savedCount, isSaved, toggleSaved } = useBookmarks();

  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const browseRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const palette = useCommandPalette(searchTriggerRef);

  const isBookmarksTab = activeTab === 'saved';

  const visibleApps = useMemo(
    () =>
      apps.filter(
        (app) =>
          // Category chips are hidden on Bookmarks, so a leftover category must not filter it.
          (isBookmarksTab || !selectedCategory || app.category === selectedCategory) &&
          (!selectedAppId || app.id === selectedAppId) &&
          (activeTab !== 'mascots' || app.hasMascot) &&
          (!isBookmarksTab || isSaved('screenshots', app.id)),
      ),
    [apps, selectedCategory, selectedAppId, activeTab, isBookmarksTab, isSaved],
  );

  const featuredApp = useMemo(
    () => apps.find((app) => app.screenshots.length >= SCREENSHOTS_PER_CARD) ?? apps.find((app) => app.screenshots.length > 0),
    [apps],
  );

  const showCards = activeTab !== 'icons';
  // Bookmarks always show screenshot cards — saving an icon saves that app's card.
  const showIcons = activeTab === 'icons';
  // An app filter shows every screenshot (three per card); otherwise one card per app.
  const showEveryGroup = selectedAppId !== null;

  const cardGroups = showCards
    ? visibleApps
        .filter((app) => !isBookmarksTab || isSaved('screenshots', app.id))
        .flatMap((app) => toCardGroups(app, app.screenshots, showEveryGroup))
    : [];
  const iconItems = showIcons ? visibleApps : [];
  // Screenshots from two other apps pop up beside the headline on hover.
  const peekImages = apps
    .filter((app) => app.id !== featuredApp?.id && app.screenshots.length > 0)
    .slice(0, 2)
    .map((app) => ({ src: app.screenshots[0].r2Url, alt: '' }));
  const screenshotCount = cardGroups.reduce((total, group) => total + group.screenshots.length, 0);
  const selectedApp = selectedAppId ? apps.find((app) => app.id === selectedAppId) : undefined;

  const selectTab = (tab: BrowseTab) => {
    if (tab !== activeTab) playSound('select');
    setActiveTab(tab);
    // Bring the top of the results back into view if the user had scrolled past it.
    const browseTop = (browseRef.current?.offsetTop ?? 0) - 75;
    if (tab === 'saved' || window.scrollY > browseTop) window.scrollTo({ top: tab === 'saved' ? 0 : browseTop });
  };

  const startBrowsing = () => {
    setActiveTab('screenshots');
    browseRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    resultsRef.current?.focus({ preventScroll: true });
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedAppId(null);
  };

  const selectCategory = (category: string | null) => {
    playSound('select');
    setSelectedCategory(category);
  };

  const cardHandlers = (app: GalleryApp) => ({
    saved: isSaved('screenshots', app.id),
    onToggleSaved: () => toggleSaved('screenshots', app.id),
    onShowApp: () => setSelectedAppId(app.id),
  });

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-dvh flex-col">
        <Nav
          onOpenSearch={palette.open}
          searchTriggerRef={searchTriggerRef}
          isBookmarksOpen={isBookmarksTab}
          savedCount={savedCount}
          onOpenBookmarks={() => selectTab(isBookmarksTab ? 'screenshots' : 'saved')}
        />

        {!isBookmarksTab && (
          <Hero
            onStart={startBrowsing}
            peekImages={peekImages}
            featured={
              <FeaturedRotator
                apps={apps}
                renderCard={(app) => (
                  <AppCard
                    as="div"
                    size="featured"
                    app={app}
                    screenshots={app.screenshots.slice(0, SCREENSHOTS_PER_CARD)}
                    {...cardHandlers(app)}
                  />
                )}
              />
            }
          />
        )}

        <div ref={browseRef} className="flex flex-1 scroll-mt-[75px]">
          <Sidebar activeTab={activeTab} onSelectTab={selectTab} />

          <main className="flex min-w-0 flex-1 flex-col px-4 pb-16 md:pl-0 md:pr-8">
            {/* Below md the sidebar is hidden, so tabs move inline. */}
            <div role="group" aria-label="Browse" className="chip-rail flex gap-2 overflow-x-auto pb-3 md:hidden">
              {SIDEBAR_TABS.map((tab) => (
                <Chip key={tab.id} label={tab.label} pressed={activeTab === tab.id} onPress={() => selectTab(tab.id)} />
              ))}
            </div>

            {isBookmarksTab ? (
              // Same 58px row as the chips (and the sidebar toggle beside it), flush with the cards' left edge.
              <div className="flex min-h-[58px] flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="text-title font-medium text-foreground">Bookmarks</h1>
                {savedCount > 0 && (
                  <span className="rounded-full bg-chip px-2 py-0.5 text-body-sm tabular-nums text-muted shadow-[inset_0_0_0_1px_var(--color-chip-border)]">
                    {savedCount} {savedCount === 1 ? 'app' : 'apps'}
                  </span>
                )}
                <p className="text-body text-muted sm:ml-2">Things you saved for later.</p>
              </div>
            ) : (
              <CategoryChips categories={categories} selected={selectedCategory} onSelect={selectCategory} />
            )}

            {selectedApp && (
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedAppId(null)}
                  className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-body-sm"
                >
                  Showing {selectedApp.name}
                  <span aria-hidden="true">✕</span>
                  <span className="sr-only">— clear app filter</span>
                </button>
              </div>
            )}

            <p aria-live="polite" className="sr-only">
              {screenshotCount} screenshots, {iconItems.length} icons shown
            </p>

            <div ref={resultsRef} tabIndex={-1} aria-label="Results" className="pt-[33px] focus:outline-none">
              {cardGroups.length === 0 && iconItems.length === 0 ? (
                <EmptyState
                  variant={apps.length === 0 ? 'empty-library' : isBookmarksTab ? 'no-bookmarks' : 'no-matches'}
                  onAction={
                    apps.length === 0 ? () => window.location.reload() : isBookmarksTab ? () => selectTab('screenshots') : clearFilters
                  }
                />
              ) : (
                <div className="space-y-16">
                  {iconItems.length > 0 && (
                    <Grid variant="icons" label="App icons">
                      {iconItems.map((app) => (
                        <IconCard
                          key={app.id}
                          app={app}
                          saved={isSaved('screenshots', app.id)}
                          onToggleSaved={() => toggleSaved('screenshots', app.id)}
                        />
                      ))}
                    </Grid>
                  )}
                  {cardGroups.length > 0 && (
                    <Grid variant="cards" label="Screenshots">
                      {cardGroups.map(({ key, app, screenshots }) => (
                        <AppCard key={key} app={app} screenshots={screenshots} {...cardHandlers(app)} />
                      ))}
                    </Grid>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>

        <CommandPalette
          isOpen={palette.isOpen}
          onOpenChange={palette.onOpenChange}
          apps={apps}
          categories={categories}
          onSelectApp={(appId) => {
            setSelectedAppId(appId);
            setSelectedCategory(null);
            if (activeTab === 'icons' || isBookmarksTab) setActiveTab('screenshots');
          }}
          onSelectCategory={(category) => {
            setSelectedCategory(category);
            setSelectedAppId(null);
            if (isBookmarksTab) setActiveTab('screenshots');
          }}
          onSelectTab={selectTab}
        />
      </div>
    </MotionConfig>
  );
}
