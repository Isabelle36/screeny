import sharp from 'sharp';
import { NEUTRAL_FRAME_COLOR } from './frame';

// Server-only: runs at ingest time (sharp is a native module) and the result is stored on App.accentColor.
//
// How the accent is picked:
// 1. Downsample the icon to 48×48 — enough pixels to vote, cheap to scan, and it smooths gradients.
// 2. Ignore pixels that can't carry a brand color: transparent, near-white, near-black, or greyish.
// 3. Vote by hue (24 buckets of 15°), weighting each pixel by its saturation so vivid pixels win over muddy ones.
// 4. Average the RGB of the winning bucket — the app's dominant color.
// 5. Re-tone it for a card frame: keep the hue, cap saturation, pin lightness to a soft mid-tone,
//    so a neon icon and a dark icon both produce a frame that sits calmly next to its neighbours.
// Mostly-monochrome icons fall back to the Figma neutral frame.

const SAMPLE_SIZE = 48;
const HUE_BUCKETS = 24;
const MIN_SATURATION = 0.2;
const MIN_LIGHTNESS = 0.12;
const MAX_LIGHTNESS = 0.92;
// Fewer colorful pixels than this (as a share of the icon) means "no real accent" — use the neutral.
const MIN_COLORFUL_SHARE = 0.04;

const FRAME_LIGHTNESS = 0.7;
const FRAME_MAX_SATURATION = 0.6;

type Rgb = [number, number, number];
type Hsl = { hue: number; saturation: number; lightness: number };

function rgbToHsl([red, green, blue]: Rgb): Hsl {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return { hue: 0, saturation: 0, lightness };

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue: number;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  return { hue: (hue * 60 + 360) % 360, saturation, lightness };
}

function hslToHex({ hue, saturation, lightness }: Hsl) {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lightness - chroma / 2;
  const [r, g, b] =
    hue < 60 ? [chroma, x, 0] : hue < 120 ? [x, chroma, 0] : hue < 180 ? [0, chroma, x] : hue < 240 ? [0, x, chroma] : hue < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return `#${[r, g, b].map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, '0')).join('')}`;
}

export async function extractAccentColor(iconImage: Buffer): Promise<string> {
  const { data, info } = await sharp(iconImage)
    .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: 'cover' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buckets = Array.from({ length: HUE_BUCKETS }, () => ({ weight: 0, red: 0, green: 0, blue: 0 }));
  let colorfulPixels = 0;

  for (let offset = 0; offset < data.length; offset += info.channels) {
    if (data[offset + 3] < 128) continue;
    const rgb: Rgb = [data[offset], data[offset + 1], data[offset + 2]];
    const { hue, saturation, lightness } = rgbToHsl(rgb);
    if (saturation < MIN_SATURATION || lightness < MIN_LIGHTNESS || lightness > MAX_LIGHTNESS) continue;

    const bucket = buckets[Math.floor(hue / (360 / HUE_BUCKETS)) % HUE_BUCKETS];
    bucket.weight += saturation;
    bucket.red += rgb[0] * saturation;
    bucket.green += rgb[1] * saturation;
    bucket.blue += rgb[2] * saturation;
    colorfulPixels++;
  }

  if (colorfulPixels / (SAMPLE_SIZE * SAMPLE_SIZE) < MIN_COLORFUL_SHARE) return NEUTRAL_FRAME_COLOR;

  const winner = buckets.reduce((best, bucket) => (bucket.weight > best.weight ? bucket : best));
  const dominant = rgbToHsl([winner.red / winner.weight, winner.green / winner.weight, winner.blue / winner.weight]);

  return hslToHex({
    hue: dominant.hue,
    saturation: Math.min(dominant.saturation, FRAME_MAX_SATURATION),
    lightness: FRAME_LIGHTNESS,
  });
}
