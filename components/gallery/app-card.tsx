import { AppIcon } from '@/components/ui/app-icon';
import { CategoryIcon } from '@/components/ui/category-icon';
import { SaveToggle } from '@/components/ui/save-toggle';
import { screenshotAltText } from '@/lib/alt-text';
import { NEUTRAL_FRAME_COLOR } from '@/lib/color/frame';
import type { GalleryApp, GalleryScreenshot } from '@/lib/db/gallery';
import { GalleryImage } from './gallery-image';

// Panels are a third of the card (100cqw minus frame borders and the two 5px gaps), so every card
// keeps the same panel size even when an app has fewer than three screenshots.
const SIZES = {
  grid: {
    root: '',
    frame: 'border-4',
    panel: 'w-[calc((100cqw-18px)/3)]',
    icon: 'h-[45px] w-[49px]',
    title: 'text-body',
    gap: 'gap-4',
    metaIcon: 0,
  },
  // The hero's larger single card.
  featured: {
    root: 'w-[483px]',
    frame: 'border-[7px]',
    panel: 'w-[calc((100cqw-24px)/3)]',
    icon: 'h-[50px] w-[54px]',
    title: 'text-body-lg',
    gap: 'gap-3',
    metaIcon: 13,
  },
};

type AppCardProps = {
  app: GalleryApp;
  screenshots: GalleryScreenshot[];
  size?: keyof typeof SIZES;
  saved: boolean;
  onToggleSaved: () => void;
  onShowApp: () => void;
  as?: 'li' | 'div';
};

// Up to three screenshots side by side in a frame tinted with the app's own accent color,
// with the app's icon, name and category below. One save button covers the whole card.
export function AppCard({ app, screenshots, size = 'grid', saved, onToggleSaved, onShowApp, as: Tag = 'li' }: AppCardProps) {
  const styles = SIZES[size];
  const frameColor = app.accentColor ?? NEUTRAL_FRAME_COLOR;

  return (
    // content-visibility lets the browser skip layout/paint for off-screen cards (big win with ~200 cards).
    <Tag className={`group/card @container min-w-0 [contain-intrinsic-size:auto_420px] [content-visibility:auto] ${styles.root}`}>
      <div className="relative w-fit">
        <div
          className={`flex gap-[5px] overflow-hidden rounded-[26px] shadow-[0_0_0_0.5px_#ababab] ${styles.frame}`}
          style={{ backgroundColor: frameColor, borderColor: frameColor }}
        >
          {screenshots.map((screenshot) => (
            <a
              key={screenshot.id}
              href={screenshot.r2Url}
              target="_blank"
              rel="noreferrer"
              className={`relative block shrink-0 ${styles.panel}`}
            >
              <GalleryImage
                src={screenshot.r2Url}
                alt={screenshotAltText(app, screenshot)}
                // A 10% inset outline defines light screenshots against light frames without adding layout.
                className="aspect-[9/19.5] w-full object-cover outline-1 -outline-offset-1 outline-black/10"
              />
              <span className="sr-only"> (opens full size in a new tab)</span>
            </a>
          ))}
        </div>
        <SaveToggle saved={saved} itemLabel={`${app.name} screenshots`} onToggle={onToggleSaved} />
      </div>

      <div className={`mt-[30px] flex items-center ${styles.gap}`}>
        <AppIcon src={app.iconUrl} alt="" className={`${styles.icon} shrink-0 rounded-[17px]`} />
        <div className="min-w-0">
          <button
            type="button"
            onClick={onShowApp}
            className={`block max-w-full truncate rounded-sm text-left font-semibold text-card-title decoration-1 underline-offset-2 hover:underline ${styles.title}`}
          >
            {app.name}
            <span className="sr-only"> — show all screenshots</span>
          </button>
          <p className="mt-[3px] flex items-center gap-1 text-body-sm text-muted">
            {styles.metaIcon > 0 && <CategoryIcon category={app.category} size={styles.metaIcon} className="opacity-60" />}
            {app.category}
          </p>
        </div>
      </div>
    </Tag>
  );
}
