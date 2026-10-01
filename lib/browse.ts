import type { GalleryApp, GalleryScreenshot } from './db/gallery';

export type BrowseTab = 'screenshots' | 'icons' | 'mascots' | 'saved';

export const BROWSE_TABS: { id: BrowseTab; label: string }[] = [
  { id: 'screenshots', label: 'Screenshots' },
  { id: 'icons', label: 'Icons' },
  { id: 'mascots', label: 'Mascots' },
  { id: 'saved', label: 'Bookmarks' },
];

// Bookmarks live behind the nav bookmark button, so the sidebar only lists the browse tabs.
export const SIDEBAR_TABS: { id: BrowseTab; label: string; icon: { src: string; width: number; height: number } }[] = [
  { id: 'screenshots', label: 'Screenshots', icon: { src: '/figma/tab-screenshots.svg', width: 37, height: 17 } },
  { id: 'icons', label: 'Icons', icon: { src: '/figma/tab-icons.svg', width: 20, height: 20 } },
  { id: 'mascots', label: 'Mascots', icon: { src: '/figma/tab-mascots.svg', width: 20, height: 20 } },
];

export const SCREENSHOTS_PER_CARD = 3;

export type CardGroup = { key: string; app: GalleryApp; screenshots: GalleryScreenshot[] };

// Each card shows an app's screenshots three at a time. Normally one card per app;
// `showEveryGroup` (app filter, bookmarks) lays out all of them.
export function toCardGroups(app: GalleryApp, screenshots: GalleryScreenshot[], showEveryGroup: boolean): CardGroup[] {
  const groups: CardGroup[] = [];
  for (let start = 0; start < screenshots.length; start += SCREENSHOTS_PER_CARD) {
    groups.push({ key: `${app.id}:${start}`, app, screenshots: screenshots.slice(start, start + SCREENSHOTS_PER_CARD) });
    if (!showEveryGroup) break;
  }
  return groups;
}
