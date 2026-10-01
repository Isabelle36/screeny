import sharp from 'sharp';
import { NEUTRAL_FRAME_COLOR } from './frame';

const SAMPLE_WIDTH = 36;
const SAMPLE_HEIGHT = 78;
const EDGE_PX = 2;
const HUE_BUCKETS = 36;
const MIN_SATURATION = 0.3;
const MIN_ACCENT_SHARE = 0.002;
const DARK_LIGHTNESS = 0.22;
const DARK_SHARE = 0.4;
const DARK_MEAN_LIGHTNESS = 0.45;

type Rgb = [number, number, number];
type Oklab = [number, number, number];

const toLinear = (channel: number) => {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (value: number) => {
  const c = value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
};

function rgbToOklab([r, g, b]: Rgb): Oklab {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToLinearRgb([L, a, b]: Oklab): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function oklchToRgb(lightness: number, chroma: number, hueDegrees: number): Rgb {
  const hue = (hueDegrees * Math.PI) / 180;
  for (let c = chroma; c >= 0; c -= 0.005) {
    const linear = oklabToLinearRgb([lightness, c * Math.cos(hue), c * Math.sin(hue)]);
    if (linear.every((channel) => channel >= -0.0005 && channel <= 1.0005)) return linear.map(fromLinear) as Rgb;
  }
  return oklabToLinearRgb([lightness, 0, 0]).map(fromLinear) as Rgb;
}

const distance = (x: Oklab, y: Oklab) => Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
const toHex = (rgb: Rgb) => `#${rgb.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;

function hslOf([r, g, b]: Rgb) {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const lightness = (max + min) / 2;
  const delta = max - min;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return { saturation, lightness };
}

type Sample = { rgb: Rgb; lab: Oklab; isEdge: boolean };

async function sampleImage(image: Buffer): Promise<Sample[]> {
  const { data, info } = await sharp(image).resize(SAMPLE_WIDTH, SAMPLE_HEIGHT, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const samples: Sample[] = [];
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const offset = (y * info.width + x) * info.channels;
      const rgb: Rgb = [data[offset], data[offset + 1], data[offset + 2]];
      const isEdge = x < EDGE_PX || y < EDGE_PX || x >= info.width - EDGE_PX || y >= info.height - EDGE_PX;
      samples.push({ rgb, lab: rgbToOklab(rgb), isEdge });
    }
  }
  return samples;
}

function hueOf(lab: Oklab) {
  return ((Math.atan2(lab[2], lab[1]) * 180) / Math.PI + 360) % 360;
}

function frameColorFor(hue: number, edgeLightness: number): { rgb: Rgb; lab: Oklab } {
  const isLightEdges = edgeLightness > 0.8;
  const rgb = isLightEdges ? oklchToRgb(0.7, 0.16, hue) : oklchToRgb(0.87, 0.13, hue);
  return { rgb, lab: rgbToOklab(rgb) };
}

function harmonyWith(edgeHue: number | null, hue: number) {
  if (edgeHue === null) return 0;
  const apart = Math.abs(((hue - edgeHue + 540) % 360) - 180);
  if (apart < 25) return -0.2;
  if (apart <= 120) return 0.08;
  if (apart <= 150) return 0.02;
  return -0.05;
}

function isMostlyDark(samples: Sample[]) {
  const darkShare = samples.filter((sample) => hslOf(sample.rgb).lightness < DARK_LIGHTNESS).length / samples.length;
  const meanLightness = samples.reduce((sum, sample) => sum + sample.lab[0], 0) / samples.length;
  return darkShare > DARK_SHARE || meanLightness < DARK_MEAN_LIGHTNESS;
}

export async function hasDarkScreenshots(screenshots: Buffer[]): Promise<boolean> {
  const all = (await Promise.all(screenshots.map(sampleImage))).flat();
  return all.length > 0 && isMostlyDark(all);
}

export async function extractAccentColor({ screenshots, icon }: { screenshots: Buffer[]; icon?: Buffer }): Promise<string> {
  const perScreenshot = await Promise.all(screenshots.map(sampleImage));
  const all = perScreenshot.flat();
  if (all.length === 0) return NEUTRAL_FRAME_COLOR;

  if (isMostlyDark(all)) return NEUTRAL_FRAME_COLOR;

  const edges = all.filter((sample) => sample.isEdge).map((sample) => sample.lab);
  const edgeLightness = edges.reduce((sum, lab) => sum + lab[0], 0) / edges.length;
  let [edgeX, edgeY, edgeChroma] = [0, 0, 0];
  for (const lab of edges) {
    const chroma = Math.hypot(lab[1], lab[2]);
    if (chroma < 0.04) continue;
    edgeX += lab[1];
    edgeY += lab[2];
    edgeChroma += chroma;
  }
  const edgeHue = edgeChroma / edges.length > 0.03 ? ((Math.atan2(edgeY, edgeX) * 180) / Math.PI + 360) % 360 : null;

  const buckets = Array.from({ length: HUE_BUCKETS }, () => ({ count: 0, saturation: 0, x: 0, y: 0 }));
  for (const sample of all) {
    const { saturation, lightness } = hslOf(sample.rgb);
    if (saturation < MIN_SATURATION || lightness < 0.15 || lightness > 0.9) continue;
    const hue = hueOf(sample.lab);
    const bucket = buckets[Math.floor(hue / (360 / HUE_BUCKETS)) % HUE_BUCKETS];
    bucket.count++;
    bucket.saturation += saturation;
    bucket.x += Math.cos((hue * Math.PI) / 180);
    bucket.y += Math.sin((hue * Math.PI) / 180);
  }
  const candidates = buckets
    .filter((bucket) => bucket.count / all.length >= MIN_ACCENT_SHARE)
    .map((bucket) => ({
      hue: ((Math.atan2(bucket.y, bucket.x) * 180) / Math.PI + 360) % 360,
      share: bucket.count / all.length,
      vividness: bucket.saturation / bucket.count,
    }));

  if (candidates.length === 0 && icon) {
    const iconSamples = (await sampleImage(icon)).filter((sample) => hslOf(sample.rgb).saturation >= MIN_SATURATION);
    if (iconSamples.length > 0) {
      const [x, y] = iconSamples.reduce(([sx, sy], sample) => [sx + Math.cos((hueOf(sample.lab) * Math.PI) / 180), sy + Math.sin((hueOf(sample.lab) * Math.PI) / 180)], [0, 0]);
      candidates.push({ hue: ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360, share: MIN_ACCENT_SHARE, vividness: 0.6 });
    }
  }
  if (candidates.length === 0) return NEUTRAL_FRAME_COLOR;

  let best = { score: -Infinity, rgb: [163, 163, 163] as Rgb };
  for (const candidate of candidates) {
    const frame = frameColorFor(candidate.hue, edgeLightness);
    const edgeDistances = edges.map((edge) => distance(frame.lab, edge)).sort((a, b) => a - b);
    const nearEdges = edgeDistances.slice(0, Math.max(1, Math.floor(edgeDistances.length * 0.25)));
    const pop = nearEdges.reduce((sum, value) => sum + value, 0) / nearEdges.length;
    const score = pop + harmonyWith(edgeHue, candidate.hue) + 0.03 * Math.log10(candidate.share * 1000) + 0.05 * candidate.vividness;
    if (score > best.score) best = { score, rgb: frame.rgb };
  }
  return toHex(best.rgb);
}
