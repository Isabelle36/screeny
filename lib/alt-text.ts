import type { GalleryApp, GalleryScreenshot } from './db/gallery';

// We don't have per-screenshot captions yet, so describe position + context rather than just the app name.
export function screenshotAltText(app: GalleryApp, screenshot: GalleryScreenshot) {
  return `${app.name} App Store screenshot ${screenshot.position + 1} of ${app.screenshots.length} — ${app.category} app by ${app.developer}`;
}

export function appIconAltText(app: GalleryApp) {
  return `${app.name} app icon`;
}
