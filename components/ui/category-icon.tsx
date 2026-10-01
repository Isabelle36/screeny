import { categoryGlyphFor } from '@/lib/category-icons';

type CategoryIconProps = {
  category: string;
  // Slot size in px; the glyph is drawn at ~85% of it so every category reads at the same optical size.
  size?: number;
  className?: string;
};

// Decorative: always sits next to the category name, so screen readers skip it.
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
        // Centre the glyph's own bounding box (not its padded artboard) in the slot — optical alignment.
        style={{ left: size / 2 - (x + width / 2) * scale, top: size / 2 - (y + height / 2) * scale }}
      />
    </span>
  );
}
