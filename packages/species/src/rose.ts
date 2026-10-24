import type { OrganShape, Species } from '@flower-grower/core';
import { ROSE_LEAF_SHAPE } from '@flower-grower/core';

export const ROSE_PETAL_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.15, 0.45, 0.78, 0.95, 1.0, 1.0, 0.98, 0.92, 0.7, 0.0],
  tip: 'round',
  tipSharpness: 0.12,
  baseNarrow: 0.22,
  cupDepth: 0.38,
  curlTip: 0.42,
  reflex: 0.48,
  ruffle: 0.06,
  ruffleFreq: 3.5,
  midribBend: 0.04,
  veinCount: 5,
  veinDepth: 0.015,
};

export const rose: Species = {
  id: 'rose',
  name: 'Rose',
  generator: 'straight',
  description:
    'Rosa garden hybrid with dense imbricated spiral whorls, reflexed outer petals, velvety crimson tones, and compound serrated foliage.',
  ranges: {
    'stem.height': { lo: 1.5, hi: 2.5 },
    'stem.baseRadius': { lo: 0.045, hi: 0.065 },
    'stem.tipRadius': { lo: 0.028, hi: 0.038 },
    'stem.noiseAmp': { lo: 0.07, hi: 0.18 },
    'stem.growSpeed': { lo: 4.5, hi: 6.5 },
    'petal.count': { lo: 38, hi: 58 },
    'petal.length': { lo: 0.85, hi: 1.25 },
    'petal.width': { lo: 0.8, hi: 1.2 },
    'petal.cupDepth': { lo: 0.24, hi: 0.44 },
    'petal.curlTip': { lo: 0.2, hi: 0.5 },
    'petal.reflex': { lo: 0.25, hi: 0.5 },
    'petal.midribBend': { lo: 0.0, hi: 0.05 },
    'flower.whorlLayers': { lo: 5, hi: 6 },
    'flower.whorlTilt': { lo: 0.2, hi: 0.38 },
    'flower.whorlRadius': { lo: 0.08, hi: 0.15 },
    'flower.headScale': { lo: 0.88, hi: 1.22 },
    'flower.sepalCount': { lo: 5, hi: 5 },
    'flower.floretCount': { lo: 0, hi: 0 }, // no disc florets in rose
    'leaf.count': { lo: 4, hi: 8 },
    'leaf.length': { lo: 0.55, hi: 0.85 },
    'leaf.width': { lo: 0.35, hi: 0.52 },
    'leaf.tilt': { lo: 0.55, hi: 0.85 },
    'growth.petalGrowDur': { lo: 1.0, hi: 1.4 },
    'growth.petalOpenDur': { lo: 1.4, hi: 1.9 },
    'color.petal': {
      light: [0.3, 0.56],
      chroma: [0.22, 0.34],
      hue: [350, 28], // From deep velvet ruby to fiery warm rose
    },
    'color.leaf': {
      light: [0.28, 0.42],
      chroma: [0.1, 0.18],
      hue: [125, 145],
    },
  },
  petalShapes: [ROSE_PETAL_SHAPE],
  leafShapes: [ROSE_LEAF_SHAPE],
};
