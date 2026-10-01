import type { Ref } from 'react';
import { Logo } from './logo';

type NavProps = {
  onOpenSearch: () => void;
  searchTriggerRef: Ref<HTMLButtonElement>;
  isBookmarksOpen: boolean;
  savedCount: number;
  onOpenBookmarks: () => void;
};

export function Nav({ onOpenSearch, searchTriggerRef, isBookmarksOpen, savedCount, onOpenBookmarks }: NavProps) {
  return (
    <header className="sticky top-0 z-30 grid grid-cols-[1fr_auto_1fr] items-center gap-4 bg-background px-4 py-[15px] md:px-8">
      <Logo />

      <button
        ref={searchTriggerRef}
        type="button"
        onClick={onOpenSearch}
        aria-keyshortcuts="Meta+K Control+K"
        className="flex w-[min(623px,48vw)] items-center gap-2.5 rounded-full bg-surface px-[17px] py-1.5 text-body text-muted transition-colors duration-150 hover:text-foreground"
      >
        <img src="/figma/search.svg" alt="" width={22} height={22} className="icon-ink shrink-0 opacity-60" />
        <span className="truncate">Search apps, categories etc…</span>
        <img src="/figma/kbd-cmd-k.svg" alt="" width={38} height={33} className="ml-auto hidden shrink-0 sm:block" />
      </button>

      <button
        type="button"
        onClick={onOpenBookmarks}
        aria-pressed={isBookmarksOpen}
        aria-label={savedCount > 0 ? `Bookmarks, ${savedCount} saved` : 'Bookmarks'}
        className="relative justify-self-end rounded-md p-2.5"
      >
        <img src="/figma/bookmark-nav.svg" alt="" width={20} height={24} />
        <img
          src="/figma/dot.svg"
          alt=""
          width={5}
          height={5}
          className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 transition-opacity duration-150 ${
            isBookmarksOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </button>
    </header>
  );
}
