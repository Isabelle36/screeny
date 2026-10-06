'use client';

import { Command } from 'cmdk';
import { useMemo, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Chip } from '@/components/ui/chip';
import type { GalleryApp } from '@/lib/db/gallery';
import { playSound } from '@/lib/sound';

type CommandPaletteProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  apps: GalleryApp[];
  categories: string[];
  onSelectApp: (appId: string) => void;
  onSelectCategory: (category: string) => void;
};

export function CommandPalette({
  isOpen,
  onOpenChange,
  apps,
  categories,
  onSelectApp,
  onSelectCategory,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const visibleApps = useMemo(() => (category ? apps.filter((app) => app.category === category) : apps), [apps, category]);

  const changeOpen = (open: boolean) => {
    if (!open) {
      setQuery('');
      setCategory(null);
    }
    onOpenChange(open);
  };

  const selectAndClose = (action: () => void) => {
    action();
    changeOpen(false);
  };

  const chooseCategory = (next: string | null) => {
    playSound('select');
    setCategory(next);
  };

  return (
    <Command.Dialog
      open={isOpen}
      onOpenChange={changeOpen}
      label="Search Screeny"
      className="flex min-h-0 flex-1 flex-col"
      overlayClassName="fixed inset-0 z-40 bg-black/10 backdrop-blur-[6px]"
      contentClassName="palette fixed left-1/2 top-[12vh] z-50 flex max-h-[min(540px,64vh)] w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 flex-col overflow-hidden rounded-[20px] bg-background shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_24px_64px_-12px_rgba(0,0,0,0.25)]"
    >
      <div className="flex items-center gap-3 border-b border-border px-5">
        <img src="/figma/search.svg" alt="" width={22} height={22} className="icon-ink shrink-0 opacity-60" />
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Search apps and commands…"
          autoComplete="off"
          spellCheck={false}
          className="h-14 min-w-0 flex-1 bg-transparent text-body text-foreground outline-none placeholder:text-muted"
        />
        <button
          type="button"
          onClick={() => changeOpen(false)}
          aria-label="Close search"
          className="rounded-md bg-surface px-1.5 py-0.5 text-body-sm font-medium text-muted shadow-[0_0_0_1px_var(--color-border)] transition-colors duration-[120ms] hover:text-foreground"
        >
          Esc
        </button>
      </div>

      <div role="group" aria-label="Filter results by category" className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3">
        <Chip size="sm" label="All" pressed={category === null} onPress={() => chooseCategory(null)} />
        {categories.map((name) => (
          <Chip
            key={name}
            size="sm"
            label={name}
            iconCategory={name}
            pressed={category === name}
            onPress={() => chooseCategory(category === name ? null : name)}
          />
        ))}
      </div>

      <Command.List className="min-h-0 flex-1 scroll-py-2 overflow-y-auto overscroll-contain px-2 pb-2">
        <Command.Empty className="px-3 py-10 text-center text-body text-muted">No apps match “{query}”.</Command.Empty>

        <Command.Group heading={query ? 'Apps' : 'Suggestions'}>
          {visibleApps.map((app) => (
            <Command.Item
              key={app.id}
              value={`${app.name} ${app.developer} ${app.category} ${app.id}`}
              onSelect={() => selectAndClose(() => onSelectApp(app.id))}
            >
              <AppIcon src={app.iconUrl} alt="" name={app.name} className="size-10 shrink-0 rounded-[10px]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body font-semibold text-card-title">{app.name}</span>
                <span className="block truncate text-body-sm text-muted">{app.developer}</span>
              </span>
              <span className="shrink-0 text-body-sm text-muted">{app.category}</span>
            </Command.Item>
          ))}
        </Command.Group>

        {category && (
          <Command.Group heading="Category">
            <Command.Item value={`show all ${category}`} onSelect={() => selectAndClose(() => onSelectCategory(category))}>
              Show all {category} apps in the gallery
            </Command.Item>
          </Command.Group>
        )}
      </Command.List>

      <div className="flex shrink-0 items-center justify-between border-t border-border px-5 py-2.5 text-body-sm text-muted [@media(pointer:coarse)]:hidden">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="flex items-center gap-0.5">
              <kbd className="flex">
                <ArrowUpGlyph />
                <span className="sr-only">Up arrow</span>
              </kbd>
              <kbd className="flex">
                <ArrowDownGlyph />
                <span className="sr-only">Down arrow</span>
              </kbd>
            </span>
            Navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="flex">
              <EnterGlyph />
              <span className="sr-only">Enter</span>
            </kbd>
            Open
          </span>
        </div>
        <span className="flex items-center gap-1.5">
          <kbd className="palette-kbd">Esc</kbd>
          Close
        </span>
      </div>
    </Command.Dialog>
  );
}

const ArrowUpGlyph = () => (
  <svg aria-hidden="true" width={16} height={16} viewBox="0 0 24 24" fill="none">
    <path
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.4697 3.46967C11.7626 3.17678 12.2374 3.17678 12.5303 3.46967L18.5303 9.46967C18.8232 9.76256 18.8232 10.2374 18.5303 10.5303C18.2374 10.8232 17.7626 10.8232 17.4697 10.5303L12.75 5.81066L12.75 20C12.75 20.4142 12.4142 20.75 12 20.75C11.5858 20.75 11.25 20.4142 11.25 20L11.25 5.81066L6.53033 10.5303C6.23744 10.8232 5.76256 10.8232 5.46967 10.5303C5.17678 10.2374 5.17678 9.76256 5.46967 9.46967L11.4697 3.46967Z"
    />
  </svg>
);

const ArrowDownGlyph = () => (
  <svg aria-hidden="true" width={16} height={16} viewBox="0 0 24 24" fill="none">
    <path
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 3.25C12.4142 3.25 12.75 3.58579 12.75 4L12.75 18.1893L17.4697 13.4697C17.7626 13.1768 18.2374 13.1768 18.5303 13.4697C18.8232 13.7626 18.8232 14.2374 18.5303 14.5303L12.5303 20.5303C12.3897 20.671 12.1989 20.75 12 20.75C11.8011 20.75 11.6103 20.671 11.4697 20.5303L5.46967 14.5303C5.17678 14.2374 5.17678 13.7626 5.46967 13.4697C5.76256 13.1768 6.23744 13.1768 6.53033 13.4697L11.25 18.1893L11.25 4C11.25 3.58579 11.5858 3.25 12 3.25Z"
    />
  </svg>
);

const EnterGlyph = () => (
  <svg aria-hidden="true" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.75 4.75v7a3.25 3.25 0 0 1-3.25 3.25H5.75" />
    <path d="M10.25 10.5 5.75 15l4.5 4.5" />
  </svg>
);
