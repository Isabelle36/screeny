import type { Ref } from 'react';
import type { BrowseTab } from '@/lib/browse';
import { AccountButton } from '@/components/auth/account-button';
import { Logo } from './logo';
import { MobileMenu } from './mobile-menu';

type NavProps = {
  onOpenSearch: () => void;
  searchTriggerRef: Ref<HTMLButtonElement>;
  isBookmarksOpen: boolean;
  savedCount: number;
  onOpenBookmarks: () => void;
  activeTab: BrowseTab;
  onSelectTab: (tab: BrowseTab) => void;
};

export function Nav({ onOpenSearch, searchTriggerRef, isBookmarksOpen, savedCount, onOpenBookmarks, activeTab, onSelectTab }: NavProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-background px-4 py-3 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-4 md:px-8 md:py-[15px]">
      <Logo />

      <button
        ref={searchTriggerRef}
        type="button"
        onClick={onOpenSearch}
        aria-keyshortcuts="Meta+K Control+K"
        className="flex h-10 min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-full bg-surface px-3 text-body text-muted transition-colors duration-150 hover:text-foreground md:h-auto md:w-[min(623px,48vw)] md:flex-none md:gap-2.5 md:px-[17px] md:py-1.5"
      >
        <img src="/figma/search.svg" alt="" width={22} height={22} className="icon-ink size-[18px] shrink-0 opacity-60 md:size-[22px]" />
        <span className="whitespace-nowrap text-[0.8125rem] md:hidden">
          Search<span className="max-[359px]:hidden"> apps and icons</span>
        </span>
        <span className="hidden truncate md:inline">Search apps, categories etc…</span>
        <img src="/figma/kbd-cmd-k.svg" alt="" width={38} height={33} className="ml-auto hidden shrink-0 md:block" />
      </button>

      <div className="flex shrink-0 items-center gap-1 justify-self-end">
        <button
          type="button"
          onClick={onOpenBookmarks}
          aria-pressed={isBookmarksOpen}
          aria-label={savedCount > 0 ? `Bookmarks, ${savedCount} saved` : 'Bookmarks'}
          className="relative grid size-10 place-items-center rounded-full lg:h-11 lg:rounded-md"
        >
          <img src="/figma/bookmark-nav.svg" alt="" width={20} height={24} />
          <img
            src="/figma/dot.svg"
            alt=""
            width={5}
            height={5}
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 transition-[opacity,scale] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] lg:bottom-0.5 ${
              isBookmarksOpen ? 'scale-100 opacity-100' : 'scale-40 opacity-0'
            }`}
          />
        </button>
        <AccountButton className="ml-1.5 max-md:hidden" />
        <MobileMenu activeTab={activeTab} onSelectTab={onSelectTab} />
      </div>
    </header>
  );
}
