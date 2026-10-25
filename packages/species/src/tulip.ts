import type { OrganShape, Species } from '@flower-grower/core';
import { TULIP_LEAF_SHAPE } from '@flower-grower/core';

export const TULIP_PETAL_SHAPE: OrganShape = {
  length: 1,
  widthProfile: [0.22, 0.48, 0.74, 0.92, 1.0, 0.98, 0.92, 0.84, 0.72, 0.55],
  tip: 'round',
  tipSharpness: 0.15,
  baseNarrow: 0.35,
  cupDepth: 0.12, // Subtle gentle chalice cup (under 0.20)
  curlTip: 0.0,
  reflex: 0.0,
  ruffle: 0.0,
  ruffleFreq: 1.0,
  midribBend: 0.30, // Natural outward belly bow
  veinCount: 5,
  veinDepth: 0.02,
};

export const tulip: Species = {
  id: 'tulip',
  name: 'Tulip',
  generator: 'straight',
  description:
    'Tulipa gesneriana with an erect cupped goblet formed of 6 broad overlapping tepals in two whorls and glaucous basal strap leaves.',
  ranges: {
    'stem.height': { lo: 1.3, hi: 1.8 },
    'stem.baseRadius': { lo: 0.038, hi: 0.048 },
    'stem.tipRadius': { lo: 0.022, hi: 0.028 },
    'stem.noiseAmp': { lo: 0.06, hi: 0.14 },
    'stem.growSpeed': { lo: 4.5, hi: 6.5 },
    'petal.count': { lo: 6, hi: 6 }, // 6 tepals
    'petal.length': { lo: 1.05, hi: 1.35 },
    'petal.width': { lo: 0.7, hi: 0.84 }, // broad tepals seamlessly cupping goblet
    'petal.cupDepth': { lo: 0.08, hi: 0.16 }, // Kept under 0.20
    'petal.curlTip': { lo: 0.0, hi: 0.0 },
    'petal.reflex': { lo: 0.0, hi: 0.0 },
    'petal.midribBend': { lo: 0.26, hi: 0.34 },
    'flower.whorlLayers': { lo: 2, hi: 2 }, // 3 inner + 3 outer
    'flower.whorlTilt': { lo: 1.28, hi: 1.36 }, // erect goblet
    'flower.whorlRadius': { lo: 0.042, hi: 0.055 }, // snug attachment directly at stem neck
    'flower.headScale': { lo: 1.0, hi: 1.2 },
    'flower.sepalCount': { lo: 0, hi: 0 }, // no calyx on tulip
    'flower.floretCount': { lo: 0, hi: 0 }, // no disc florets
    'leaf.count': { lo: 2, hi: 3 },
    'leaf.length': { lo: 1.1, hi: 1.5 },
    'leaf.width': { lo: 0.42, hi: 0.58 },
    'leaf.tilt': { lo: 0.45, hi: 0.65 },
    'growth.petalGrowDur': { lo: 1.0, hi: 1.4 },
    'growth.petalOpenDur': { lo: 1.3, hi: 1.8 },
    'color.petal': {
      light: [0.45, 0.78],
      chroma: [0.24, 0.38],
      hue: [15, 55], // Rich fiery scarlet to warm amber-orange
    },
    'color.leaf': {
      light: [0.38, 0.52],
      chroma: [0.06, 0.12],
      hue: [140, 160], // Glaucous blue-green
    },
  },
  petalShapes: [TULIP_PETAL_SHAPE],
  leafShapes: [TULIP_LEAF_SHAPE],
};
