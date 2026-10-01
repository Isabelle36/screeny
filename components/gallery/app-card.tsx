import { AppIcon } from '@/components/ui/app-icon';
import { CategoryIcon } from '@/components/ui/category-icon';
import { SaveToggle } from '@/components/ui/save-toggle';
import { screenshotAltText } from '@/lib/alt-text';
import { NEUTRAL_FRAME_COLOR } from '@/lib/color/frame';
import type { GalleryApp, GalleryScreenshot } from '@/lib/db/gallery';
import { GalleryImage } from './gallery-image';

// Frame geometry follows the nested-radius rule: outer radius = inner radius + inset.
// The 8px inset is the frame's padding, so each screenshot gets its own concentric 16px corners
// (24 − 8) — every corner matches, and nothing is cropped by the frame's edge.
const FRAME = 'rounded-[24px] p-2 gap-1.5';
const PANEL_RADIUS = 'rounded-[16px]';
// A third of the card: 100cqw minus the frame's padding (2 × 8px) and the two 6px gaps.
const PANEL_WIDTH = 'w-[calc((100cqw-28px)/3)]';

const SIZES = {
  grid: { root: '', icon: 'h-[45px] w-[49px] rounded-[14px]', title: 'text-body', gap: 'gap-4', metaIcon: 0 },
  // The hero's larger single card.
  featured: { root: 'w-[483px]', icon: 'h-[50px] w-[54px] rounded-[16px]', title: 'text-body-lg', gap: 'gap-3', metaIcon: 13 },
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
      <div data-flip={size === 'grid' ? 'scale' : undefined} className="relative w-fit">
        <div
          // Panel skeletons inside a tinted frame read better as translucent white than as grey.
          className={`flex shadow-[0_0_0_0.5px_#ababab] [--skeleton:rgb(255_255_255/0.35)] ${FRAME}`}
          style={{ backgroundColor: frameColor }}
        >
          {screenshots.map((screenshot) => (
            <a
              key={screenshot.id}
              href={screenshot.r2Url}
              target="_blank"
              rel="noreferrer"
              className={`relative block shrink-0 ${PANEL_RADIUS} ${PANEL_WIDTH}`}
            >
              <GalleryImage
                src={screenshot.r2Url}
                alt={screenshotAltText(app, screenshot)}
                // A 10% inset outline defines light screenshots against light frames without adding layout.
                className={`aspect-[9/19.5] w-full outline-1 -outline-offset-1 outline-black/10 ${PANEL_RADIUS}`}
              />
              <span className="sr-only"> (opens full size in a new tab)</span>
            </a>
          ))}
        </div>
        <SaveToggle saved={saved} itemLabel={`${app.name} screenshots`} onToggle={onToggleSaved} />
      </div>

      <div data-flip={size === 'grid' ? 'move' : undefined} className={`mt-[30px] flex items-center ${styles.gap}`}>
        <AppIcon src={app.iconUrl} alt="" name={app.name} className={styles.icon} />
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

// Same geometry as AppCard, so content lands exactly where the skeleton was (no layout shift).
export function CardSkeleton({ size = 'grid', as: Tag = 'li' }: { size?: keyof typeof SIZES; as?: 'li' | 'div' }) {
  const styles = SIZES[size];
  return (
    <Tag aria-hidden="true" className={`@container min-w-0 ${styles.root}`}>
      <div className={`flex bg-surface shadow-[0_0_0_0.5px_var(--color-border)] ${FRAME}`}>
        {[0, 1, 2].map((panel) => (
          <span key={panel} className={`skeleton block aspect-[9/19.5] shrink-0 ${PANEL_RADIUS} ${PANEL_WIDTH}`} />
        ))}
      </div>
      <div className={`mt-[30px] flex items-center ${styles.gap}`}>
        <span className={`skeleton block shrink-0 ${styles.icon}`} />
        <span className="flex-1 space-y-2">
          <span className="skeleton block h-3.5 w-3/5 rounded-full" />
          <span className="skeleton block h-3 w-2/5 rounded-full" />
        </span>
      </div>
    </Tag>
  );
}
