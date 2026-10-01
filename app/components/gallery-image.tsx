'use client';

import { useEffect, useRef, useState } from 'react';

type GalleryImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export function GalleryImage({ src, alt, className }: GalleryImageProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    const image = imageRef.current;

    if (!image || !('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '1200px 0px' },
    );

    observer.observe(image);
    return () => observer.disconnect();
  }, []);

  return (
    <img
      ref={imageRef}
      src={src}
      alt={alt}
      loading={isNearViewport ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority="low"
      className={className}
    />
  );
}