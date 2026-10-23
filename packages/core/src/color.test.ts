import { describe, expect, it } from 'vitest';
import {
  lerpOklch,
  oklchToHex,
  oklchToRgb,
  rgbToOklch,
  sampleOklchGradient,
} from './color.js';

describe('OKLCH color conversion and gradient sampling', () => {
  it('converts pure black and white correctly', () => {
    const black = oklchToRgb({ light: 0, chroma: 0, hue: 0 });
    expect(black.r).toBeCloseTo(0, 3);
    expect(black.g).toBeCloseTo(0, 3);
    expect(black.b).toBeCloseTo(0, 3);
    expect(oklchToHex({ light: 0, chroma: 0, hue: 0 })).toBe('#000000');

    const white = oklchToRgb({ light: 1, chroma: 0, hue: 0 });
    expect(white.r).toBeCloseTo(1, 3);
    expect(white.g).toBeCloseTo(1, 3);
    expect(white.b).toBeCloseTo(1, 3);
    expect(oklchToHex({ light: 1, chroma: 0, hue: 0 })).toBe('#ffffff');
  });

  it('converts known reference colors consistently', () => {
    // 50% gray
    const grayOklch = rgbToOklch({ r: 0.5, g: 0.5, b: 0.5 });
    expect(grayOklch.chroma).toBeCloseTo(0, 2);
    expect(grayOklch.light).toBeGreaterThan(0.5); // perceptual lightness of 0.5 sRGB is ~0.59

    const backToRgb = oklchToRgb(grayOklch);
    expect(backToRgb.r).toBeCloseTo(0.5, 2);
    expect(backToRgb.g).toBeCloseTo(0.5, 2);
    expect(backToRgb.b).toBeCloseTo(0.5, 2);

    // Pure Red sRGB [1, 0, 0]
    const redOklch = rgbToOklch({ r: 1, g: 0, b: 0 });
    // In OKLCH, pure red hue is around 29 degrees
    expect(redOklch.hue).toBeGreaterThan(20);
    expect(redOklch.hue).toBeLessThan(35);
    expect(redOklch.chroma).toBeGreaterThan(0.2);

    const redBack = oklchToRgb(redOklch);
    expect(redBack.r).toBeCloseTo(1, 2);
    expect(redBack.g).toBeCloseTo(0, 2);
    expect(redBack.b).toBeCloseTo(0, 2);
  });

  it('interpolates along the shortest angular path across hue 0/360 boundary', () => {
    const c1 = { light: 0.6, chroma: 0.1, hue: 10 };
    const c2 = { light: 0.6, chroma: 0.1, hue: 350 };

    // Halfway between 10 and 350 should cross 0/360, yielding hue 0
    const mid = lerpOklch(c1, c2, 0.5);
    expect(mid.hue).toBeCloseTo(0, 1);
  });

  it('samples multi-stop gradients smoothly', () => {
    const stops = [
      { t: 0, color: { light: 0.2, chroma: 0.05, hue: 120 } },
      { t: 0.5, color: { light: 0.7, chroma: 0.15, hue: 60 } },
      { t: 1, color: { light: 0.9, chroma: 0.2, hue: 30 } },
    ];

    const s0 = sampleOklchGradient(stops, 0);
    expect(s0.light).toBeCloseTo(0.2, 3);

    const sMid = sampleOklchGradient(stops, 0.5);
    expect(sMid.light).toBeCloseTo(0.7, 3);
    expect(sMid.hue).toBeCloseTo(60, 3);

    const s1 = sampleOklchGradient(stops, 1);
    expect(s1.light).toBeCloseTo(0.9, 3);
  });
});
