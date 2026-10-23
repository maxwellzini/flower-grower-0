export type GeneKind = 'float' | 'int' | 'choice' | 'color';

export interface BaseGeneDef {
  name: string;
  group: 'stem' | 'leaf' | 'petal' | 'flower' | 'layout' | 'color' | 'growth' | 'style';
  description: string;
}

export interface FloatGeneDef extends BaseGeneDef {
  kind: 'float';
  min: number;
  max: number;
  default: number;
}

export interface IntGeneDef extends BaseGeneDef {
  kind: 'int';
  min: number;
  max: number;
  default: number;
}

export interface ChoiceGeneDef extends BaseGeneDef {
  kind: 'choice';
  options: readonly string[];
  default: string;
}

export interface ColorGeneDef extends BaseGeneDef {
  kind: 'color';
  light: [number, number]; // min, max
  chroma: [number, number]; // min, max
  hue: [number, number]; // min, max (degrees)
  default: { light: number; chroma: number; hue: number };
}

export type GeneDefinition = FloatGeneDef | IntGeneDef | ChoiceGeneDef | ColorGeneDef;

export type GeneBias = 'low' | 'mid' | 'high';

export interface NumericGeneRange {
  lo: number;
  hi: number;
  bias?: GeneBias;
}

export interface ChoiceGeneRange {
  options: readonly string[];
}

export interface ColorGeneRange {
  light: [number, number];
  chroma: [number, number];
  hue: [number, number];
}

export type GeneRange = NumericGeneRange | ChoiceGeneRange | ColorGeneRange;

export type GenomeValue =
  number | string | { light: number; chroma: number; hue: number };
export type Genome = Record<string, GenomeValue>;

export const GENES = {
  // Stem genes
  'stem.height': {
    name: 'stem.height',
    group: 'stem',
    kind: 'float',
    min: 0.5,
    max: 5.0,
    default: 2.2,
    description: 'Overall stem height in world units',
  },
  'stem.baseRadius': {
    name: 'stem.baseRadius',
    group: 'stem',
    kind: 'float',
    min: 0.01,
    max: 0.12,
    default: 0.045,
    description: 'Radius of the stem at ground level',
  },
  'stem.tipRadius': {
    name: 'stem.tipRadius',
    group: 'stem',
    kind: 'float',
    min: 0.005,
    max: 0.06,
    default: 0.022,
    description: 'Radius of the stem at the flower receptacle',
  },
  'stem.segments': {
    name: 'stem.segments',
    group: 'stem',
    kind: 'int',
    min: 6,
    max: 36,
    default: 18,
    description: 'Number of vertical cross-section rings along the stem',
  },
  'stem.noiseAmp': {
    name: 'stem.noiseAmp',
    group: 'stem',
    kind: 'float',
    min: 0.0,
    max: 0.35,
    default: 0.07,
    description: 'Amplitude of organic curvature noise',
  },
  'stem.growSpeed': {
    name: 'stem.growSpeed',
    group: 'stem',
    kind: 'float',
    min: 1.0,
    max: 12.0,
    default: 5.5,
    description: 'Rate of tip advancement in world units per second',
  },

  // Petal genes
  'petal.count': {
    name: 'petal.count',
    group: 'petal',
    kind: 'int',
    min: 4,
    max: 65,
    default: 21,
    description: 'Number of petals on the primary flower head',
  },
  'petal.length': {
    name: 'petal.length',
    group: 'petal',
    kind: 'float',
    min: 0.2,
    max: 2.5,
    default: 0.85,
    description: 'Radial length of petals in world units',
  },
  'petal.width': {
    name: 'petal.width',
    group: 'petal',
    kind: 'float',
    min: 0.05,
    max: 1.2,
    default: 0.28,
    description: 'Aspect ratio width of petals',
  },
  'petal.cupDepth': {
    name: 'petal.cupDepth',
    group: 'petal',
    kind: 'float',
    min: -0.2,
    max: 0.45,
    default: 0.08,
    description: 'Lateral concavity curvature across petal width',
  },
  'petal.curlTip': {
    name: 'petal.curlTip',
    group: 'petal',
    kind: 'float',
    min: -0.8,
    max: 0.8,
    default: 0.15,
    description: 'Longitudinal curvature at the petal tip in radians',
  },
  'petal.reflex': {
    name: 'petal.reflex',
    group: 'petal',
    kind: 'float',
    min: -0.2,
    max: 0.35,
    default: 0.05,
    description: 'Backward bending angle of mature petals',
  },
  'petal.midribBend': {
    name: 'petal.midribBend',
    group: 'petal',
    kind: 'float',
    min: -0.2,
    max: 0.5,
    default: 0.04,
    description: 'Longitudinal curvature along petal midrib from base to tip',
  },
  'petal.ruffle': {
    name: 'petal.ruffle',
    group: 'petal',
    kind: 'float',
    min: 0.0,
    max: 0.15,
    default: 0.02,
    description: 'Margin ondulance amplitude',
  },
  'petal.tip': {
    name: 'petal.tip',
    group: 'petal',
    kind: 'choice',
    options: ['round', 'point', 'notch', 'fringe'] as const,
    default: 'round',
    description: 'Petal apex termination profile',
  },
  'petal.tipSharpness': {
    name: 'petal.tipSharpness',
    group: 'petal',
    kind: 'float',
    min: 0.0,
    max: 1.0,
    default: 0.3,
    description: 'Tapering rate towards the tip',
  },
  'petal.baseNarrow': {
    name: 'petal.baseNarrow',
    group: 'petal',
    kind: 'float',
    min: 0.0,
    max: 0.8,
    default: 0.22,
    description: 'Claw tapering at petal attachment base',
  },

  // Flower head & whorl genes
  'flower.headScale': {
    name: 'flower.headScale',
    group: 'flower',
    kind: 'float',
    min: 0.3,
    max: 2.5,
    default: 1.0,
    description: 'Overall scale multiplier for the flower blossom',
  },
  'flower.whorlLayers': {
    name: 'flower.whorlLayers',
    group: 'flower',
    kind: 'int',
    min: 1,
    max: 8,
    default: 2,
    description: 'Number of concentric petal whorls',
  },
  'flower.whorlTilt': {
    name: 'flower.whorlTilt',
    group: 'flower',
    kind: 'float',
    min: 0.0,
    max: 1.2,
    default: 0.25,
    description: 'Upward conical flare angle of petal layers',
  },
  'flower.whorlRadius': {
    name: 'flower.whorlRadius',
    group: 'flower',
    kind: 'float',
    min: 0.02,
    max: 0.3,
    default: 0.08,
    description: 'Attachment radius from receptacle center',
  },
  'flower.floretCount': {
    name: 'flower.floretCount',
    group: 'flower',
    kind: 'int',
    min: 0,
    max: 120,
    default: 55,
    description: 'Number of center disc florets in phyllotaxis',
  },
  'flower.centerDome': {
    name: 'flower.centerDome',
    group: 'flower',
    kind: 'float',
    min: 0.0,
    max: 0.15,
    default: 0.04,
    description: 'Convex elevation of the flower center disc',
  },
  'flower.sepalCount': {
    name: 'flower.sepalCount',
    group: 'flower',
    kind: 'int',
    min: 0,
    max: 16,
    default: 0,
    description: 'Number of calyx sepals supporting the flower receptacle',
  },

  // Foliage / Leaf genes
  'leaf.count': {
    name: 'leaf.count',
    group: 'leaf',
    kind: 'int',
    min: 0,
    max: 20,
    default: 6,
    description: 'Number of cauline leaves along the stem',
  },
  'leaf.length': {
    name: 'leaf.length',
    group: 'leaf',
    kind: 'float',
    min: 0.2,
    max: 1.8,
    default: 0.7,
    description: 'Blade length of leaves',
  },
  'leaf.width': {
    name: 'leaf.width',
    group: 'leaf',
    kind: 'float',
    min: 0.08,
    max: 0.8,
    default: 0.3,
    description: 'Blade width of leaves',
  },
  'leaf.tilt': {
    name: 'leaf.tilt',
    group: 'leaf',
    kind: 'float',
    min: 0.2,
    max: 1.2,
    default: 0.6,
    description: 'Downward drooping tilt angle of leaves',
  },

  // Color genes (OKLCH)
  'color.petal': {
    name: 'color.petal',
    group: 'color',
    kind: 'color',
    light: [0.3, 0.98],
    chroma: [0.0, 0.28],
    hue: [0, 360],
    default: { light: 0.95, chroma: 0.03, hue: 75 },
    description: 'Petal OKLCH color palette',
  },
  'color.center': {
    name: 'color.center',
    group: 'color',
    kind: 'color',
    light: [0.2, 0.9],
    chroma: [0.05, 0.3],
    hue: [20, 110],
    default: { light: 0.74, chroma: 0.16, hue: 82 },
    description: 'Flower disc florets OKLCH color palette',
  },
  'color.stem': {
    name: 'color.stem',
    group: 'color',
    kind: 'color',
    light: [0.2, 0.7],
    chroma: [0.04, 0.22],
    hue: [110, 155],
    default: { light: 0.42, chroma: 0.12, hue: 135 },
    description: 'Stem and foliar vegetative OKLCH color',
  },

  // Growth & Timing genes
  'growth.stagger': {
    name: 'growth.stagger',
    group: 'growth',
    kind: 'float',
    min: 0.02,
    max: 0.45,
    default: 0.16,
    description: 'Temporal dispersion between adjacent petal unfurls',
  },
  'growth.petalGrowDur': {
    name: 'growth.petalGrowDur',
    group: 'growth',
    kind: 'float',
    min: 0.3,
    max: 2.5,
    default: 1.1,
    description: 'Seconds for an organ to expand to full dimensions',
  },
  'growth.petalOpenDur': {
    name: 'growth.petalOpenDur',
    group: 'growth',
    kind: 'float',
    min: 0.5,
    max: 3.5,
    default: 1.5,
    description: 'Seconds for an organ to unfurl from bud curl',
  },

  // Style genes
  'style.colorVariance': {
    name: 'style.colorVariance',
    group: 'style',
    kind: 'float',
    min: 0.0,
    max: 0.1,
    default: 0.03,
    description: 'Subtle per-organ seed color deviation',
  },
} as const satisfies Record<string, GeneDefinition>;

export type GeneName = keyof typeof GENES;
