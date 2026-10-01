import { categoryGlyphFor } from '@/lib/category-icons';

type CategoryIconProps = {
  category: string;
  size?: number;
  className?: string;
};

export function CategoryIcon({ category, size = 20, className = '' }: CategoryIconProps) {
  const glyph = categoryGlyphFor(category);
  if (!glyph) return null;

  const [x, y, width, height] = glyph.glyph;
  const scale = (size * 0.85) / Math.max(width, height);
  const renderedBox = glyph.box * scale;

  return (
    <span aria-hidden="true" className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }}>
      <img
        src={glyph.src}
        alt=""
        width={renderedBox}
        height={renderedBox}
        className="absolute max-w-none"
        style={{ left: size / 2 - (x + width / 2) * scale, top: size / 2 - (y + height / 2) * scale }}
      />
    </span>
  );
}
