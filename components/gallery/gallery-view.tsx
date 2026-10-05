'use client';

import { useAuth } from '@clerk/nextjs';
import { MotionConfig } from 'motion/react';
import { useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AppView } from '@/components/app/app-view';
import { LoginModal } from '@/components/auth/login-modal';
import { SsoCallback } from '@/components/auth/sso-callback';
import { CommandPalette } from '@/components/command/command-palette';
import { InfoView } from '@/components/info/info-view';
import { Hero } from '@/components/layout/hero';
import { Nav } from '@/components/layout/nav';
import { Sidebar } from '@/components/layout/sidebar';
import { useAppView } from '@/hooks/use-app-view';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { useCommandPalette } from '@/hooks/use-command-palette';
import { takeInfoReturnScroll, useInfoView } from '@/hooks/use-info-view';
import { openLoginModal } from '@/hooks/use-login-modal';
import { useIsCompletingSso } from '@/hooks/use-sso-callback';
import { SCREENSHOTS_PER_CARD, toCardGroups, type BrowseTab } from '@/lib/browse';
import type { GalleryApp } from '@/lib/db/gallery';
import { playSound } from '@/lib/sound';
import { AppCard } from './app-card';
import { CategoryChips } from './category-chips';
import { EmptyState } from './empty-state';
import { FeaturedRotator } from './featured-rotator';
import { Grid } from './grid';
import { IconCard } from './icon-card';

type GalleryViewProps = { apps: GalleryApp[]; categories: string[] };

type ReturnPoint =
  | { kind: 'card'; cardId: string; top: number; scrollY: number }
  | { kind: 'scroll'; scrollY: number }
  | { kind: 'browse' }
  | { kind: 'top' };

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const NAV_HEIGHT = 75;

export function GalleryView({ apps, categories }: GalleryViewProps) {
  const [activeTab, setActiveTab] = useState<BrowseTab>('screenshots');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { savedCount, isSaved, toggleSaved, canBookmark } = useBookmarks();
  const { isSignedIn } = useAuth();
  const appView = useAppView();
  const infoView = useInfoView();
  const openApp = appView.openSlug ? apps.find((app) => app.slug === appView.openSlug) : undefined;
  const returnPoint = useRef<ReturnPoint | null>(null);

  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const browseRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const palette = useCommandPalette(searchTriggerRef);

  const isBookmarksTab = activeTab === 'saved';
  const shownTab = useDeferredValue(activeTab);
  const isBookmarksView = shownTab === 'saved';

  const visibleApps = useMemo(
    () =>
      apps.filter(
        (app) =>
          (isBookmarksView || !selectedCategory || app.category === selectedCategory) &&
          (shownTab !== 'mascots' || app.hasMascot) &&
          (!isBookmarksView || isSaved('screenshots', app.id)),
      ),
    [apps, selectedCategory, shownTab, isBookmarksView, isSaved],
  );

  const featuredApp = useMemo(
    () => apps.find((app) => app.screenshots.length >= SCREENSHOTS_PER_CARD) ?? apps.find((app) => app.screenshots.length > 0),
    [apps],
  );

  const showCards = shownTab !== 'icons';
  const showIcons = shownTab === 'icons';
  const cardGroups = showCards
    ? visibleApps
        .filter((app) => !isBookmarksView || isSaved('screenshots', app.id))
        .flatMap((app) => toCardGroups(app, app.screenshots))
    : [];
  const iconItems = showIcons ? visibleApps : [];
  const peekImages = apps
    .filter((app) => app.id !== featuredApp?.id && app.screenshots.length > 0)
    .slice(0, 2)
    .map((app) => ({ src: app.screenshots[0].r2Url, alt: '' }));
  const screenshotCount = cardGroups.reduce((total, group) => total + group.screenshots.length, 0);

  const overlayKey = openApp?.id ?? (infoView.isOpen ? 'info' : null);
  const isCompletingSignIn = useIsCompletingSso();
  const showHero = !isBookmarksView && !overlayKey && !isSignedIn && !isCompletingSignIn;
  const heroRef = useRef<HTMLDivElement>(null);
  const heroHeight = useRef(0);
  const previousHeroState = useRef({ showHero, isSignedIn });

  useEffect(() => {
    if (isSignedIn === undefined || isCompletingSignIn) return;
    document.documentElement.toggleAttribute('data-signed-in', isSignedIn);
  }, [isSignedIn, isCompletingSignIn]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const observer = new ResizeObserver(() => {
      heroHeight.current = hero.offsetHeight;
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, [showHero]);

  useLayoutEffect(() => {
    const previous = previousHeroState.current;
    const heroRemovedBySignIn = previous.showHero && !showHero && previous.isSignedIn === false && isSignedIn;
    previousHeroState.current = { showHero, isSignedIn };
    if (heroRemovedBySignIn) window.scrollBy({ top: -Math.min(heroHeight.current, window.scrollY), behavior: 'instant' });
  }, [showHero, isSignedIn]);

  useLayoutEffect(() => {
    if (overlayKey) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    const point = returnPoint.current;
    returnPoint.current = null;
    const infoReturnScroll = takeInfoReturnScroll();
    if (!point) {
      if (infoReturnScroll !== null) window.scrollTo({ top: infoReturnScroll, behavior: 'instant' });
      return;
    }
    if (point.kind === 'top') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else if (point.kind === 'browse') {
      window.scrollTo({ top: Math.max(0, (browseRef.current?.offsetTop ?? 0) - NAV_HEIGHT), behavior: 'instant' });
    } else {
      const card = point.kind === 'card' ? document.querySelector<HTMLElement>(`[data-app-card="${CSS.escape(point.cardId)}"]`) : null;
      if (card && point.kind === 'card') {
        const alignCard = () => window.scrollBy({ top: card.getBoundingClientRect().top - point.top, behavior: 'instant' });
        alignCard();
        requestAnimationFrame(alignCard);
        card.querySelector<HTMLElement>('a:not([tabindex="-1"])')?.focus({ preventScroll: true });
      } else {
        window.scrollTo({ top: point.scrollY, behavior: 'instant' });
      }
    }
  }, [overlayKey]);

  const openAppView = (app: GalleryApp, from?: HTMLElement) => {
    if (!openApp) {
      const card = from?.closest<HTMLElement>('[data-app-card]');
      returnPoint.current = card
        ? { kind: 'card', cardId: card.dataset.appCard ?? '', top: card.getBoundingClientRect().top, scrollY: window.scrollY }
        : { kind: 'scroll', scrollY: window.scrollY };
    }
    playSound('page-enter');
    appView.open(app.slug);
  };

  const leaveOverlay = (destination: 'browse' | 'top') => {
    returnPoint.current = { kind: destination };
    if (openApp) appView.close({ stepBack: false });
    if (infoView.isOpen) infoView.close({ stepBack: false });
  };

  const selectTab = (tab: BrowseTab) => {
    if (tab !== activeTab) playSound('tab-switch');
    setActiveTab(tab);
    if (overlayKey) {
      leaveOverlay(tab === 'saved' ? 'top' : 'browse');
      return;
    }
    const browseTop = (browseRef.current?.offsetTop ?? 0) - NAV_HEIGHT;
    if (tab === 'saved' || window.scrollY > browseTop) window.scrollTo({ top: tab === 'saved' ? 0 : browseTop });
  };

  const startBrowsing = () => {
    browseRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    resultsRef.current?.focus({ preventScroll: true });
  };

  const skipToContent = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    mainRef.current?.focus({ preventScroll: true });
    mainRef.current?.scrollIntoView();
  };

  const clearFilters = () => setSelectedCategory(null);

  const selectCategory = (category: string | null) => {
    playSound('select');
    setSelectedCategory(category);
  };

  const cardHandlers = (app: GalleryApp) => ({
    saved: isSaved('screenshots', app.id),
    onToggleSaved: () => toggleSaved('screenshots', app.id),
    onOpen: (from: HTMLElement) => openAppView(app, from),
  });

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-dvh flex-col">
        <a
          href="#main"
          onClick={skipToContent}
          className="fixed left-4 top-3 z-50 -translate-y-[calc(100%+24px)] rounded-full bg-ink px-4 py-2.5 text-body font-medium text-background focus-visible:translate-y-0"
        >
          Skip to content
        </a>

        <Nav
          onOpenSearch={palette.open}
          searchTriggerRef={searchTriggerRef}
          isBookmarksOpen={isBookmarksTab}
          savedCount={savedCount}
          onOpenBookmarks={() => (canBookmark ? selectTab(isBookmarksTab ? 'screenshots' : 'saved') : openLoginModal())}
          activeTab={activeTab}
          onSelectTab={selectTab}
        />

        {showHero && (
          <div ref={heroRef}>
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
          </div>
        )}

        <div ref={browseRef} className="flex flex-1 scroll-mt-[75px]">
          <Sidebar activeTab={activeTab} onSelectTab={selectTab} />

          <main ref={mainRef} id="main" tabIndex={-1} className="flex min-w-0 flex-1 scroll-mt-[75px] flex-col px-4 pb-16 focus:outline-none md:px-8 lg:pl-0">
            {openApp ? (
              <AppView
                key={openApp.id}
                app={openApp}
                saved={isSaved('screenshots', openApp.id)}
                onToggleSaved={() => toggleSaved('screenshots', openApp.id)}
                onBack={() => appView.close({ stepBack: true })}
              />
            ) : infoView.isOpen ? (
              <InfoView appCount={apps.length} onBack={() => infoView.close({ stepBack: true })} />
            ) : (
              <>
                {isBookmarksView ? (
                  <div className="flex min-h-[58px] flex-wrap items-center gap-x-3 gap-y-1">
                    <h1 className="text-title font-medium text-foreground">Bookmarks</h1>
                    <p className="text-body text-muted sm:ml-2">Things you saved for later.</p>
                  </div>
                ) : (
                  <CategoryChips categories={categories} selected={selectedCategory} onSelect={selectCategory} />
                )}

                <p aria-live="polite" className="sr-only">
                  {screenshotCount} screenshots, {iconItems.length} icons shown
                </p>

                <div ref={resultsRef} tabIndex={-1} role="region" aria-label="Results" className="pt-[33px] focus:outline-none">
                  {cardGroups.length === 0 && iconItems.length === 0 ? (
                    <EmptyState
                      variant={apps.length === 0 ? 'empty-library' : isBookmarksView ? 'no-bookmarks' : 'no-matches'}
                      onAction={
                        apps.length === 0 ? () => window.location.reload() : isBookmarksView ? () => selectTab('screenshots') : clearFilters
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
              </>
            )}
          </main>
        </div>

        <CommandPalette
          isOpen={palette.isOpen}
          onOpenChange={palette.onOpenChange}
          apps={apps}
          categories={categories}
          onSelectApp={(appId) => {
            const app = apps.find((candidate) => candidate.id === appId);
            if (app) openAppView(app);
          }}
          onSelectCategory={(category) => {
            setSelectedCategory(category);
            if (isBookmarksTab) setActiveTab('screenshots');
            if (overlayKey) leaveOverlay('browse');
          }}
        />
        <LoginModal />
        <SsoCallback />
      </div>
    </MotionConfig>
  );
}
