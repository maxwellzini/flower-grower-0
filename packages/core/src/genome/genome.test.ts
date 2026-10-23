import { describe, expect, it } from 'vitest';
import { createRNG } from '../rng.js';
import { GENES, type GeneName } from './schema.js';
import { blend, crossover, mutate, sample, type Species } from './operations.js';

const testSpecies: Species = {
  id: 'test-flower',
  name: 'Test Flower',
  generator: 'straight',
  ranges: {
    'stem.height': { lo: 1.0, hi: 3.0 },
    'petal.count': { lo: 10, hi: 30 },
  },
  petalShapes: [],
};

describe('Genome Operations and GENES Registry', () => {
  it('contains properly categorized genes in GENES registry', () => {
    const geneKeys = Object.keys(GENES);
    expect(geneKeys.length).toBeGreaterThanOrEqual(25);

    for (const [, geneDef] of Object.entries(GENES)) {
      expect(geneDef.name).toBeDefined();
      expect(geneDef.group).toBeDefined();
      expect(geneDef.description).toBeDefined();
      if (geneDef.kind === 'float' || geneDef.kind === 'int') {
        expect(geneDef.min).toBeLessThanOrEqual(geneDef.max);
      }
    }
  });

  it('samples genomes strictly within absolute GENES bounds', () => {
    const rng = createRNG(555);

    for (let i = 0; i < 50; i++) {
      const g = sample(testSpecies, rng);

      for (const [key, geneDef] of Object.entries(GENES)) {
        const geneName = key as GeneName;
        const val = g[geneName];
        expect(val).toBeDefined();

        if (geneDef.kind === 'float' || geneDef.kind === 'int') {
          const num = Number(val);
          expect(num).toBeGreaterThanOrEqual(geneDef.min);
          expect(num).toBeLessThanOrEqual(geneDef.max);
        } else if (geneDef.kind === 'choice') {
          expect(geneDef.options).toContain(val);
        } else if (geneDef.kind === 'color') {
          const col = val as { light: number; chroma: number; hue: number };
          expect(col.light).toBeGreaterThanOrEqual(geneDef.light[0]);
          expect(col.light).toBeLessThanOrEqual(geneDef.light[1]);
        }
      }
    }
  });

  it('blends two genomes smoothly within valid bounds', () => {
    const rng = createRNG(12);
    const gA = sample(testSpecies, rng);
    const gB = sample(testSpecies, rng);

    const mid = blend(gA, gB, 0.5);

    for (const [key, geneDef] of Object.entries(GENES)) {
      const geneName = key as GeneName;
      if (geneDef.kind === 'float' || geneDef.kind === 'int') {
        const num = Number(mid[geneName]);
        expect(num).toBeGreaterThanOrEqual(geneDef.min);
        expect(num).toBeLessThanOrEqual(geneDef.max);
      }
    }
  });

  it('mutates genomes within absolute bounds', () => {
    const rng = createRNG(77);
    const original = sample(testSpecies, rng);

    for (let i = 0; i < 20; i++) {
      const mutated = mutate(original, 0.4, rng);

      for (const [key, geneDef] of Object.entries(GENES)) {
        const geneName = key as GeneName;
        const val = mutated[geneName];

        if (geneDef.kind === 'float' || geneDef.kind === 'int') {
          const num = Number(val);
          expect(num).toBeGreaterThanOrEqual(geneDef.min);
          expect(num).toBeLessThanOrEqual(geneDef.max);
        }
      }
    }
  });

  it('performs crossover inheriting traits from parent genomes', () => {
    const rng = createRNG(99);
    const parentA = sample(testSpecies, rng);
    const parentB = sample(testSpecies, rng);

    const child = crossover(parentA, parentB, rng);

    // Each gene in child must come from either parentA or parentB
    for (const key of Object.keys(GENES)) {
      const val = child[key];
      const matchA = JSON.stringify(val) === JSON.stringify(parentA[key]);
      const matchB = JSON.stringify(val) === JSON.stringify(parentB[key]);
      expect(matchA || matchB).toBe(true);
    }
  });
});
