import { mediaHandlers } from '@/lib/media-state';

type AppIconProps = {
  src: string;
  alt: string;
  className: string;
  name?: string;
};

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
