import type { ColorGene } from './types.js';
import { clamp, degToRad, lerp, radToDeg } from './math.js';

export interface RGB {
  r: number; // 0..1
  g: number; // 0..1
  b: number; // 0..1
}

/**
 * Converts OKLCH color to linear sRGB.
 * L: 0..1, C: >= 0, H: 0..360 degrees.
 */
export function oklchToLinearRgb(color: ColorGene): RGB {
  const { light: L, chroma: C, hue: H } = color;

  if (L <= 0) return { r: 0, g: 0, b: 0 };
  if (L >= 1 && C === 0) return { r: 1, g: 1, b: 1 };

  const hRad = degToRad(H);
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  const lPrime = L + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = L - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = L - 0.0894841775 * a - 1.291485548 * b;

  const l = lPrime * lPrime * lPrime;
  const m = mPrime * mPrime * mPrime;
  const s = sPrime * sPrime * sPrime;

  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return { r: rLin, g: gLin, b: bLin };
}

/**
 * Gamma correction: linear RGB [0..1] to standard sRGB [0..1].
 */
export function linearRgbToSrgb(linear: RGB): RGB {
  function gamma(c: number): number {
    const clamped = clamp(c, 0, 1);
    return clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * Math.pow(clamped, 1.0 / 2.4) - 0.055;
  }

  return {
    r: gamma(linear.r),
    g: gamma(linear.g),
    b: gamma(linear.b),
  };
}

/**
 * Converts OKLCH color to gamma-corrected sRGB [0..1].
 */
export function oklchToRgb(color: ColorGene): RGB {
  return linearRgbToSrgb(oklchToLinearRgb(color));
}

/**
 * Converts OKLCH to CSS hex string (e.g. #ffffff).
 */
export function oklchToHex(color: ColorGene): string {
  const rgb = oklchToRgb(color);
  const r = Math.round(rgb.r * 255);
  const g = Math.round(rgb.g * 255);
  const b = Math.round(rgb.b * 255);

  const hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  return `#${hex}`;
}

/**
 * Converts sRGB [0..1] to OKLCH.
 */
export function rgbToOklch(rgb: RGB): ColorGene {
  function ungamma(c: number): number {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  const r = ungamma(clamp(rgb.r, 0, 1));
  const g = ungamma(clamp(rgb.g, 0, 1));
  const b = ungamma(clamp(rgb.b, 0, 1));

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const lPrime = Math.cbrt(l);
  const mPrime = Math.cbrt(m);
  const sPrime = Math.cbrt(s);

  const L = 0.2104542553 * lPrime + 0.793617785 * mPrime - 0.0040720468 * sPrime;
  const a = 1.9779984951 * lPrime - 2.428592205 * mPrime + 0.4505937099 * sPrime;
  const bComp = 0.0259040371 * lPrime + 0.7827717662 * mPrime - 0.808675766 * sPrime;

  const C = Math.hypot(a, bComp);
  let hRad = Math.atan2(bComp, a);
  if (hRad < 0) hRad += 2 * Math.PI;
  const H = radToDeg(hRad);

  return { light: L, chroma: C, hue: H };
}

/**
 * Interpolates two OKLCH colors, correctly wrapping around the hue circle.
 */
export function lerpOklch(c1: ColorGene, c2: ColorGene, t: number): ColorGene {
  const light = lerp(c1.light, c2.light, t);
  const chroma = lerp(c1.chroma, c2.chroma, t);

  // Shortest angular path for hue
  let dH = c2.hue - c1.hue;
  while (dH > 180) dH -= 360;
  while (dH < -180) dH += 360;

  let hue = c1.hue + dH * t;
  while (hue < 0) hue += 360;
  while (hue >= 360) hue -= 360;

  return { light, chroma, hue };
}

export interface ColorStop {
  t: number;
  color: ColorGene;
}

/**
 * Samples an OKLCH gradient at parameter t in [0, 1].
 */
export function sampleOklchGradient(stops: readonly ColorStop[], t: number): ColorGene {
  if (stops.length === 0) {
    return { light: 0.5, chroma: 0, hue: 0 };
  }
  if (stops.length === 1) {
    return { ...stops[0]!.color };
  }

  const clampedT = clamp(t, 0, 1);
  if (clampedT <= stops[0]!.t) return { ...stops[0]!.color };
  if (clampedT >= stops[stops.length - 1]!.t) {
    return { ...stops[stops.length - 1]!.color };
  }

  for (let i = 0; i < stops.length - 1; i++) {
    const s0 = stops[i]!;
    const s1 = stops[i + 1]!;
    if (clampedT >= s0.t && clampedT <= s1.t) {
      const segT = (clampedT - s0.t) / (s1.t - s0.t);
      return lerpOklch(s0.color, s1.color, segT);
    }
  }

  return { ...stops[stops.length - 1]!.color };
}
