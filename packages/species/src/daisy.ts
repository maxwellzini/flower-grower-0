import type { Species } from '@flower-grower/core';
import { DAISY_PETAL_SHAPE } from '@flower-grower/core';

export const daisy: Species = {
  id: 'daisy',
  name: 'Daisy',
  generator: 'straight',
  description:
    'Classic Bellis perennis with radial white ray florets and a golden phyllotaxis center disc.',
  ranges: {
    'stem.height': { lo: 1.8, hi: 2.6 },
    'stem.baseRadius': { lo: 0.035, hi: 0.05 },
    'stem.tipRadius': { lo: 0.018, hi: 0.026 },
    'petal.count': { lo: 13, hi: 34, bias: 'mid' },
    'petal.length': { lo: 0.65, hi: 0.95 },
    'petal.width': { lo: 0.18, hi: 0.26 },
    'petal.cupDepth': { lo: 0.03, hi: 0.06 },
    'petal.curlTip': { lo: 0.04, hi: 0.1 },
    'petal.reflex': { lo: 0.02, hi: 0.05 },
    'petal.midribBend': { lo: 0.01, hi: 0.03 },
    'flower.whorlLayers': { lo: 1, hi: 2 },
    'flower.whorlTilt': { lo: 0.08, hi: 0.18 },
    'flower.headScale': { lo: 0.95, hi: 1.05 },
    'flower.floretCount': { lo: 45, hi: 80 },
    'flower.centerDome': { lo: 0.03, hi: 0.055 },
    'color.petal': {
      light: [0.93, 0.98],
      chroma: [0.01, 0.04],
      hue: [60, 95],
    },
    'color.center': {
      light: [0.7, 0.8],
      chroma: [0.14, 0.22],
      hue: [75, 90],
    },
  },
  petalShapes: [DAISY_PETAL_SHAPE],
};
