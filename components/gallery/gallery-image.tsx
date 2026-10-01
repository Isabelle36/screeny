import { mediaHandlers } from '@/lib/media-state';

type GalleryImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export function GalleryImage({ src, alt, className = '' }: GalleryImageProps) {
  return (
    <span data-state={src ? 'loading' : 'error'} className={`skeleton relative block overflow-hidden ${className}`}>
      {src && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          className="media-img absolute inset-0 size-full object-cover object-top"
          {...mediaHandlers}
        />
      )}
      <span aria-hidden="true" className="media-fallback absolute inset-0 place-items-center">
        <svg viewBox="0 0 24 24" className="size-6 text-black/25" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
          <circle cx="9" cy="10" r="1.75" />
          <path d="m20.5 16-4.5-4.5-9.5 8" />
        </svg>
      </span>
    </span>
  );
}
