import type { RNG } from '../types.js';
import type {
  ChoiceGeneRange,
  ColorGeneDef,
  ColorGeneRange,
  GeneName,
  Genome,
  NumericGeneRange,
} from './schema.js';
import { GENES } from './schema.js';
import {
  applyCorrelations,
  defaultCorrelations,
  type Correlation,
} from './correlations.js';
import { clamp, lerp } from '../math.js';
import { lerpOklch } from '../color.js';
import type { OrganShape } from '../types.js';

export interface Species {
  id: string;
  name: string;
  generator: 'vine' | 'colonize' | 'lsystem' | 'straight';
  ranges: Partial<Record<GeneName, NumericGeneRange | ChoiceGeneRange | ColorGeneRange>>;
  correlations?: Correlation[];
  petalShapes: OrganShape[];
  description?: string;
}

/**
 * Shapes a random [0, 1) value using an optional bias.
 */
function applyBias(r: number, bias?: 'low' | 'mid' | 'high'): number {
  if (bias === 'low') return r * r;
  if (bias === 'high') return Math.sqrt(r);
  if (bias === 'mid')
    return (r + 0.5 * (r < 0.5 ? 2 * r * r : 1 - 2 * (1 - r) * (1 - r))) * 0.5;
  return r;
}

/**
 * Samples a genome from a species archetype ranges using seeded RNG.
 */
export function sample(species: Species, rng: RNG): Genome {
  const genome: Genome = {};

  for (const [key, geneDef] of Object.entries(GENES)) {
    const geneName = key as GeneName;
    const range = species.ranges[geneName];

    if (geneDef.kind === 'float') {
      const lo = (range as NumericGeneRange)?.lo ?? geneDef.min;
      const hi = (range as NumericGeneRange)?.hi ?? geneDef.max;
      const r = applyBias(rng.next(), (range as NumericGeneRange)?.bias);
      genome[geneName] = clamp(lerp(lo, hi, r), geneDef.min, geneDef.max);
    } else if (geneDef.kind === 'int') {
      const lo = (range as NumericGeneRange)?.lo ?? geneDef.min;
      const hi = (range as NumericGeneRange)?.hi ?? geneDef.max;
      const n = Math.round(lerp(lo, hi, rng.next()));
      genome[geneName] = clamp(n, geneDef.min, geneDef.max);
    } else if (geneDef.kind === 'choice') {
      const opts = (range as ChoiceGeneRange)?.options ?? geneDef.options;
      genome[geneName] = rng.pick(opts);
    } else if (geneDef.kind === 'color') {
      const cDef = geneDef as ColorGeneDef;
      const cRange = range as ColorGeneRange | undefined;
      const light = lerp(
        cRange?.light[0] ?? cDef.light[0],
        cRange?.light[1] ?? cDef.light[1],
        rng.next(),
      );
      const chroma = lerp(
        cRange?.chroma[0] ?? cDef.chroma[0],
        cRange?.chroma[1] ?? cDef.chroma[1],
        rng.next(),
      );
      const hue = lerp(
        cRange?.hue[0] ?? cDef.hue[0],
        cRange?.hue[1] ?? cDef.hue[1],
        rng.next(),
      );
      genome[geneName] = { light, chroma, hue };
    }
  }

  const correlations = species.correlations ?? defaultCorrelations;
  return applyCorrelations(genome, correlations);
}

/**
 * Pure interpolation between two genomes.
 */
export function blend(a: Genome, b: Genome, t: number): Genome {
  const result: Genome = {};
  const clampedT = clamp(t, 0, 1);

  for (const [key, geneDef] of Object.entries(GENES)) {
    const geneName = key as GeneName;
    const valA = a[geneName] ?? geneDef.default;
    const valB = b[geneName] ?? geneDef.default;

    if (geneDef.kind === 'float') {
      result[geneName] = clamp(
        lerp(Number(valA), Number(valB), clampedT),
        geneDef.min,
        geneDef.max,
      );
    } else if (geneDef.kind === 'int') {
      result[geneName] = Math.round(
        clamp(lerp(Number(valA), Number(valB), clampedT), geneDef.min, geneDef.max),
      );
    } else if (geneDef.kind === 'color') {
      const colA = valA as { light: number; chroma: number; hue: number };
      const colB = valB as { light: number; chroma: number; hue: number };
      result[geneName] = lerpOklch(colA, colB, clampedT);
    } else {
      // Categorical / choice: pick from a or b
      result[geneName] = clampedT < 0.5 ? valA : valB;
    }
  }

  return result;
}

/**
 * Perturbs numeric and color genes via Gaussian distribution, clamped to GENES bounds.
 */
export function mutate(genome: Genome, amount = 0.1, rng: RNG): Genome {
  const result: Genome = { ...genome };
  const clampedAmount = clamp(amount, 0, 1);

  for (const [key, geneDef] of Object.entries(GENES)) {
    const geneName = key as GeneName;
    const currentVal = result[geneName] ?? geneDef.default;

    if (geneDef.kind === 'float') {
      const span = geneDef.max - geneDef.min;
      const delta = rng.gaussian(0, span * clampedAmount * 0.25);
      result[geneName] = clamp(Number(currentVal) + delta, geneDef.min, geneDef.max);
    } else if (geneDef.kind === 'int') {
      const span = geneDef.max - geneDef.min;
      const delta = Math.round(rng.gaussian(0, Math.max(1, span * clampedAmount * 0.25)));
      result[geneName] = clamp(Number(currentVal) + delta, geneDef.min, geneDef.max);
    } else if (geneDef.kind === 'color') {
      const col = currentVal as { light: number; chroma: number; hue: number };
      const cDef = geneDef as ColorGeneDef;
      const dL = rng.gaussian(0, 0.1 * clampedAmount);
      const dC = rng.gaussian(0, 0.05 * clampedAmount);
      const dH = rng.gaussian(0, 30 * clampedAmount);

      result[geneName] = {
        light: clamp(col.light + dL, cDef.light[0], cDef.light[1]),
        chroma: clamp(col.chroma + dC, cDef.chroma[0], cDef.chroma[1]),
        hue: (col.hue + dH + 360) % 360,
      };
    } else if (geneDef.kind === 'choice') {
      if (rng.next() < clampedAmount * 0.2) {
        result[geneName] = rng.pick(geneDef.options);
      }
    }
  }

  return result;
}

/**
 * Crossover between two parent genomes by swapping gene groups.
 */
export function crossover(a: Genome, b: Genome, rng: RNG): Genome {
  const result: Genome = {};
  const groups = [
    'stem',
    'leaf',
    'petal',
    'flower',
    'layout',
    'color',
    'growth',
    'style',
  ] as const;
  const parentPick: Record<string, 'a' | 'b'> = {};

  for (const group of groups) {
    parentPick[group] = rng.next() < 0.5 ? 'a' : 'b';
  }

  for (const [key, geneDef] of Object.entries(GENES)) {
    const geneName = key as GeneName;
    const fromParent = parentPick[geneDef.group] === 'a' ? a : b;
    result[geneName] = fromParent[geneName] ?? geneDef.default;
  }

  return result;
}
