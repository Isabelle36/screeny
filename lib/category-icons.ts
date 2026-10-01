export type CategoryGlyph = { box: number; glyph: [x: number, y: number, width: number, height: number] };

const GLYPHS: Record<string, CategoryGlyph> = {
  'books': { box: 34, glyph: [2.8, 3.8, 24, 22] },
  'business': { box: 22, glyph: [1.1, 1.1, 19.7, 19.7] },
  'developer-tools': { box: 31, glyph: [1.6, 1.6, 27.8, 27.8] },
  'education': { box: 22, glyph: [0.9, 0.9, 20.2, 19.6] },
  'entertainment': { box: 23, glyph: [2.5, 1.9, 17.3, 19.9] },
  'finance': { box: 25, glyph: [1.3, 1.3, 22.4, 22.4] },
  'food-and-drink': { box: 25, glyph: [1.3, 1.3, 22.4, 22.4] },
  'games': { box: 30, glyph: [1.6, 4.1, 26.9, 20.6] },
  'graphics-and-design': { box: 26, glyph: [2.5, 2.2, 21.1, 22.2] },
  'health-and-fitness': { box: 25, glyph: [1.3, 1.3, 22.4, 22.4] },
  'lifestyle': { box: 18, glyph: [0.9, 0.9, 16.1, 16.1] },
  'magazines-and-newspapers': { box: 25, glyph: [1.3, 1.3, 21.4, 22.4] },
  'medical': { box: 28, glyph: [1.5, 2.6, 25.1, 22.8] },
  'music': { box: 25, glyph: [1.3, 2.3, 22.4, 20.3] },
  'navigation': { box: 24, glyph: [1.3, 1.3, 21.5, 21.5] },
  'news': { box: 19, glyph: [1, 1.8, 17, 15] },
  'photo-and-video': { box: 20, glyph: [1.5, 1, 17, 17.9] },
  'productivity': { box: 19, glyph: [1.2, 1.9, 16.5, 15.3] },
  'reference': { box: 20, glyph: [1, 1, 17.9, 17.9] },
  'shopping': { box: 24, glyph: [1.3, 2.2, 19.7, 19.5] },
  'social-networking': { box: 24, glyph: [2.3, 1.2, 19.5, 20.5] },
  'sports': { box: 29, glyph: [1.5, 1.5, 26, 26] },
  'travel': { box: 29, glyph: [4, 3, 21.8, 23.7] },
  'utilities': { box: 24, glyph: [1.8, 1.2, 20.4, 21.5] },
  'weather': { box: 22, glyph: [1.1, 1.1, 19.7, 19.7] },
};

const ALIASES: Record<string, string> = { book: 'books' };

function glyphKey(category: string) {
  const key = category.toLowerCase().trim().replace(/\s*&\s*/g, ' and ').replace(/\s+/g, '-');
  return ALIASES[key] ?? key;
}

export function categoryGlyphFor(category: string): (CategoryGlyph & { src: string }) | undefined {
  const key = glyphKey(category);
  const glyph = GLYPHS[key];
  return glyph && { ...glyph, src: `/figma/categories/${key}.svg` };
}
