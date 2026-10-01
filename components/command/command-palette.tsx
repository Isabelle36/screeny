'use client';

import { Command } from 'cmdk';
import { useMemo, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Chip } from '@/components/ui/chip';
import type { GalleryApp } from '@/lib/db/gallery';

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

  return (
    <Command.Dialog
      open={isOpen}
      onOpenChange={changeOpen}
      label="Search Screeny"
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

      <div role="group" aria-label="Filter results by category" className="chip-rail flex shrink-0 gap-2 overflow-x-auto px-4 py-3">
        <Chip size="sm" label="All" pressed={category === null} onPress={() => setCategory(null)} />
        {categories.map((name) => (
          <Chip
            key={name}
            size="sm"
            label={name}
            iconCategory={name}
            pressed={category === name}
            onPress={() => setCategory(category === name ? null : name)}
          />
        ))}
      </div>

      <Command.List className="palette-list min-h-0 flex-1 overflow-y-auto px-2 pb-2">
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

      <div className="flex shrink-0 items-center justify-between border-t border-border px-5 py-2.5 text-body-sm text-muted">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <kbd className="palette-kbd">↑</kbd>
            <kbd className="palette-kbd">↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="palette-kbd">↵</kbd>
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
