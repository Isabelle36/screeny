import { mediaHandlers } from '@/lib/media-state';

type AppIconProps = {
  src: string;
  // Pass "" when the app name is already printed next to the icon, so it isn't read twice.
  alt: string;
  className: string;
  // Shown as a letter tile if the icon is missing or fails to load.
  name?: string;
};

// Skeleton while loading, then the icon fades in. Missing or broken icons become a neutral letter tile,
// so a slow or failing CDN never leaves a hole in the layout. The inset 10% outline keeps pale icons
// from dissolving into the light background.
export function AppIcon({ src, alt, className, name = '' }: AppIconProps) {
  return (
    <span
      data-state={src ? 'loading' : 'error'}
      className={`skeleton relative block shrink-0 overflow-hidden outline-1 -outline-offset-1 outline-black/10 ${className}`}
    >
      {src && (
        <img src={src} alt={alt} loading="lazy" decoding="async" className="media-img absolute inset-0 size-full object-cover" {...mediaHandlers} />
      )}
      <span aria-hidden="true" className="media-fallback absolute inset-0 place-items-center bg-surface text-[0.9em] font-semibold text-muted">
        {name.trim().charAt(0).toUpperCase()}
      </span>
    </span>
  );
}
