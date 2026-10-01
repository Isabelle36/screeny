import type { GalleryApp, GalleryScreenshot } from './db/gallery';

export type BrowseTab = 'screenshots' | 'icons' | 'mascots' | 'saved';

export const BROWSE_TABS: { id: BrowseTab; label: string }[] = [
  { id: 'screenshots', label: 'Screenshots' },
  { id: 'icons', label: 'Icons' },
  { id: 'mascots', label: 'Mascots' },
  { id: 'saved', label: 'Bookmarks' },
];

export const SIDEBAR_TABS: { id: BrowseTab; label: string; icon: { src: string; width: number; height: number; ink: boolean } }[] = [
  { id: 'screenshots', label: 'Screenshots', icon: { src: '/figma/tab-screenshots-glyph.svg', width: 18, height: 18, ink: false } },
  { id: 'icons', label: 'Icons', icon: { src: '/figma/tab-icons.svg', width: 20, height: 20, ink: true } },
  { id: 'mascots', label: 'Mascots', icon: { src: '/figma/tab-mascots.svg', width: 20, height: 20, ink: true } },
];

export const SCREENSHOTS_PER_CARD = 3;

export type CardGroup = { key: string; app: GalleryApp; screenshots: GalleryScreenshot[] };

export function toCardGroups(app: GalleryApp, screenshots: GalleryScreenshot[]): CardGroup[] {
  if (screenshots.length === 0) return [];
  return [{ key: `${app.id}:0`, app, screenshots: screenshots.slice(0, SCREENSHOTS_PER_CARD) }];
}
