import { AppIcon } from '@/components/ui/app-icon';
import { CategoryIcon } from '@/components/ui/category-icon';
import { SaveToggle } from '@/components/ui/save-toggle';
import { appViewHref } from '@/lib/app-view-url';
import { screenshotAltText } from '@/lib/alt-text';
import type { GalleryApp, GalleryScreenshot } from '@/lib/db/gallery';
import { GalleryImage } from './gallery-image';

const FRAME = 'rounded-[var(--card-radius)] p-[var(--card-inset)] gap-[var(--card-gap)] [--skeleton:var(--card-skeleton)]';
const PANEL_RADIUS = 'first:rounded-l-[var(--card-inner-radius)] last:rounded-r-[var(--card-inner-radius)]';
const PANEL_WIDTH = 'w-[calc((100cqw-2*var(--card-inset)-2*var(--card-gap))/3)]';
const FRAME_RING = 'shadow-[inset_0_0_0_1px_var(--card-border)]';

const SIZES = {
  grid: { root: '', icon: 'h-[45px] w-[49px] rounded-[14px]', title: 'text-body', gap: 'gap-4', metaIcon: 0 },
  featured: { root: 'w-[483px]', icon: 'h-[50px] w-[54px] rounded-[16px]', title: 'text-body-lg', gap: 'gap-3', metaIcon: 13 },
};

type AppCardProps = {
  app: GalleryApp;
  screenshots: GalleryScreenshot[];
  size?: keyof typeof SIZES;
  saved: boolean;
  onToggleSaved: () => void;
  onOpen: (from: HTMLElement) => void;
  as?: 'li' | 'div';
};

export function AppCard({ app, screenshots, size = 'grid', saved, onToggleSaved, onOpen, as: Tag = 'li' }: AppCardProps) {
  const styles = SIZES[size];
  const frameShade = app.darkScreenshots ? 'bg-card-frame-dark' : 'bg-card-frame';
  const appHref = appViewHref(app.slug);

  const openInPlace = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onOpen(event.currentTarget);
  };

  return (
    <Tag
      data-flip-group={size === 'grid' ? '' : undefined}
      data-app-card={size === 'grid' ? app.id : `featured:${app.id}`}
      className={`group/card @container min-w-0 [contain-intrinsic-size:auto_420px] [content-visibility:auto] ${styles.root}`}
    >
      <div data-flip={size === 'grid' ? 'scale' : undefined} className="relative w-fit">
        <a href={appHref} onClick={openInPlace} tabIndex={-1} className={`flex ${frameShade} ${FRAME_RING} ${FRAME}`}>
          {screenshots.map((screenshot) => (
            <span
              key={screenshot.id}
              className={`relative block shrink-0 overflow-hidden outline-1 -outline-offset-1 outline-black/10 ${PANEL_RADIUS} ${PANEL_WIDTH}`}
            >
              <GalleryImage
                src={screenshot.r2Url}
                alt={screenshotAltText(app, screenshot)}
                className="aspect-[9/19.5] w-full transition-[scale] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:group-hover/card:scale-[1.04]"
              />
            </span>
          ))}
        </a>
        <SaveToggle saved={saved} itemLabel={`${app.name} screenshots`} onToggle={onToggleSaved} />
      </div>

      <div data-flip={size === 'grid' ? 'move' : undefined} className={`mt-[30px] flex items-center ${styles.gap}`}>
        <AppIcon src={app.iconUrl} alt="" name={app.name} className={styles.icon} />
        <div className="min-w-0">
          <a
            href={appHref}
            onClick={openInPlace}
            className={`block max-w-full truncate rounded-sm text-left font-semibold text-card-title decoration-1 underline-offset-2 hover:underline ${styles.title}`}
          >
            {app.name}
          </a>
          <p className="mt-[3px] flex items-center gap-1 text-body-sm text-muted">
            {styles.metaIcon > 0 && <CategoryIcon category={app.category} size={styles.metaIcon} className="opacity-60" />}
            {app.category}
          </p>
        </div>
      </div>
    </Tag>
  );
}

export function CardSkeleton({ size = 'grid', as: Tag = 'li' }: { size?: keyof typeof SIZES; as?: 'li' | 'div' }) {
  const styles = SIZES[size];
  return (
    <Tag aria-hidden="true" className={`@container min-w-0 ${styles.root}`}>
      <div className={`flex bg-card-frame ${FRAME_RING} ${FRAME}`}>
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
