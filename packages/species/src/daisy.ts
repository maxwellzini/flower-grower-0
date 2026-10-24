import type { Species } from '@flower-grower/core';
import { DAISY_LEAF_SHAPE, DAISY_PETAL_SHAPE } from '@flower-grower/core';

export const daisy: Species = {
  id: 'daisy',
  name: 'Daisy',
  generator: 'straight',
  description:
    'Classic Bellis perennis with radial white or blush ray florets, a golden phyllotaxis center disc, and basal spatulate leaves.',
  ranges: {
    'stem.height': { lo: 1.6, hi: 2.8 },
    'stem.baseRadius': { lo: 0.035, hi: 0.055 },
    'stem.tipRadius': { lo: 0.018, hi: 0.028 },
    'stem.noiseAmp': { lo: 0.06, hi: 0.16 },
    'petal.count': { lo: 13, hi: 34 },
    'petal.length': { lo: 0.65, hi: 1.05 },
    'petal.width': { lo: 0.18, hi: 0.28 },
    'petal.cupDepth': { lo: 0.02, hi: 0.12 },
    'petal.curlTip': { lo: 0.04, hi: 0.18 },
    'petal.reflex': { lo: 0.02, hi: 0.12 },
    'petal.midribBend': { lo: 0.01, hi: 0.06 },
    'flower.whorlLayers': { lo: 1, hi: 2 },
    'flower.whorlTilt': { lo: 0.08, hi: 0.26 },
    'flower.headScale': { lo: 0.88, hi: 1.2 },
    'flower.floretCount': { lo: 45, hi: 85 },
    'flower.centerDome': { lo: 0.025, hi: 0.065 },
    'flower.sepalCount': { lo: 14, hi: 20 }, // green involucral bracts
    'leaf.count': { lo: 4, hi: 8 },
    'leaf.length': { lo: 0.45, hi: 0.75 },
    'leaf.width': { lo: 0.22, hi: 0.38 },
    'leaf.tilt': { lo: 0.6, hi: 0.95 },
    'color.petal': {
      light: [0.9, 0.98],
      chroma: [0.01, 0.07],
      hue: [40, 110], // Creamy white to soft sunshine tinted petals
    },
    'color.center': {
      light: [0.68, 0.82],
      chroma: [0.15, 0.25],
      hue: [70, 95], // Golden to amber-green disc
    },
    'color.leaf': {
      light: [0.32, 0.45],
      chroma: [0.12, 0.2],
      hue: [125, 142],
    },
  },
  petalShapes: [DAISY_PETAL_SHAPE],
  leafShapes: [DAISY_LEAF_SHAPE],
};
