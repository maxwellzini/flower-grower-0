import { describe, expect, it } from 'vitest';
import { growDaisy } from './assemble.js';
import { evalShape } from './organs/evalShape.js';
import { DAISY_PETAL_SHAPE } from './assemble.js';
import { leafArrangement } from './organs/placement.js';
import { dotVec3 } from './math.js';
import { growPlant } from './plantAssembler.js';

describe('Daisy Assembly and Shape Evaluation', () => {
  it('evaluates petal shape points and normals properly', () => {
    const pt = evalShape(DAISY_PETAL_SHAPE, 0.5, 0.0, 0.0);
    expect(Number.isFinite(pt.pos[0])).toBe(true);
    expect(Number.isFinite(pt.pos[1])).toBe(true);
    expect(Number.isFinite(pt.pos[2])).toBe(true);
    expect(Number.isFinite(pt.normal[0])).toBe(true);
    expect(Number.isFinite(pt.normal[1])).toBe(true);
    expect(Number.isFinite(pt.normal[2])).toBe(true);
  });

  it('grows a complete daisy plant deterministically', () => {
    const daisy1 = growDaisy({ seed: 100 });
    const daisy2 = growDaisy({ seed: 100 });

    expect(daisy1).toEqual(daisy2);
    expect(daisy1.stems.length).toBe(1);
    expect(daisy1.stems[0]!.nodes.length).toBeGreaterThan(10);
    expect(daisy1.organs.length).toBeGreaterThan(20);
    expect(daisy1.duration).toBeGreaterThan(2.0);

    // Verify births are non-decreasing along the stem
    const nodes = daisy1.stems[0]!.nodes;
    for (let i = 1; i < nodes.length; i++) {
      expect(nodes[i]!.birth).toBeGreaterThanOrEqual(nodes[i - 1]!.birth);
    }

    // Verify JSON serialization
    const json = JSON.stringify(daisy1);
    expect(JSON.parse(json)).toEqual(daisy1);
  });

  it('calculates proper leaf arrangement patterns', () => {
    const altLeaves = leafArrangement({ nodeCount: 20, count: 6, arrangement: 'alternate' });
    expect(altLeaves.length).toBe(6);
    expect(altLeaves[0]!.nodeIndex).toBeLessThan(altLeaves[5]!.nodeIndex);

    const basalLeaves = leafArrangement({ nodeCount: 20, count: 4, arrangement: 'basal' });
    expect(basalLeaves.length).toBe(4);
    // Basal leaves are on lower nodes
    expect(basalLeaves.every((l) => l.nodeIndex <= 10)).toBe(true);
  });

  it('generates orthonormal leaf attachments with valid timings', () => {
    const fakeSpecies = {
      id: 'test-plant',
      name: 'Test Plant',
      generator: 'straight' as const,
      ranges: {
        'leaf.count': { lo: 5, hi: 5 },
      },
      petalShapes: [DAISY_PETAL_SHAPE],
    };

    const plant = growPlant({ species: fakeSpecies, seed: 42 });
    const leaves = plant.organs.filter((o) => o.type === 'leaf');
    expect(leaves.length).toBe(5);

    for (const leaf of leaves) {
      expect(leaf.birth).toBeGreaterThan(0);
      expect(Number.isFinite(leaf.scale)).toBe(true);

      // Verify tangent and normal are orthogonal: dot product ~ 0
      const dotTN = dotVec3(leaf.tangent, leaf.normal);
      expect(Math.abs(dotTN)).toBeLessThan(1e-5);

      const dotTB = dotVec3(leaf.tangent, leaf.binormal);
      expect(Math.abs(dotTB)).toBeLessThan(1e-5);

      const dotNB = dotVec3(leaf.normal, leaf.binormal);
      expect(Math.abs(dotNB)).toBeLessThan(1e-5);
    }
  });

  it('generates properly oriented petals and variable sepals on vines', () => {
    const trellisGuide = {
      paths: [
        [
          [0, 0, 0] as [number, number, number],
          [0, 1, 0] as [number, number, number],
          [0, 2, 0] as [number, number, number],
        ],
      ],
    };

    const climbingRose = {
      id: 'rose',
      name: 'Rose',
      generator: 'straight' as const,
      ranges: {
        'petal.count': { lo: 15, hi: 15 },
        'flower.sepalCount': { lo: 5, hi: 5 },
        'flower.sepalScale': { lo: 0.35, hi: 0.45 },
        'flower.whorlTilt': { lo: 0.35, hi: 0.35 },
        'vine.flowerDensity': { lo: 1.0, hi: 1.0 },
      },
      petalShapes: [DAISY_PETAL_SHAPE],
    };

    const plant = growPlant({ species: climbingRose, guide: trellisGuide, seed: 123 });
    const petals = plant.organs.filter((o) => o.type === 'petal');
    const sepals = plant.organs.filter((o) => o.type === 'sepal');

    expect(petals.length).toBeGreaterThan(0);
    expect(sepals.length).toBeGreaterThan(0);

    for (const petal of petals) {
      // Rotation must store tilt (<= 1.5 rad), not azimuth angle (which can be up to 2*PI)
      expect(petal.rotation).toBeLessThanOrEqual(1.5);

      // Tangent, normal, and binormal must be mutually orthogonal
      const dotTN = dotVec3(petal.tangent, petal.normal);
      expect(Math.abs(dotTN)).toBeLessThan(1e-4);

      const dotTB = dotVec3(petal.tangent, petal.binormal);
      expect(Math.abs(dotTB)).toBeLessThan(1e-4);

      const dotNB = dotVec3(petal.normal, petal.binormal);
      expect(Math.abs(dotNB)).toBeLessThan(1e-4);
    }

    // Verify sepal scales vary across sepals
    const sepalScales = new Set(sepals.map((s) => s.scale.toFixed(4)));
    expect(sepalScales.size).toBeGreaterThan(1);
  });

  it('enforces spatial clearance and size-based separation between vine flowers', () => {
    const longTrellis = {
      paths: [
        [
          [0, 0, 0] as [number, number, number],
          [0, 2, 0] as [number, number, number],
          [0, 4, 0] as [number, number, number],
          [0, 6, 0] as [number, number, number],
        ],
      ],
    };

    const climbingSpecies = {
      id: 'rose',
      name: 'Rose',
      generator: 'straight' as const,
      ranges: {
        'petal.count': { lo: 10, hi: 10 },
        'petal.length': { lo: 0.8, hi: 0.8 },
        'flower.headScale': { lo: 1.0, hi: 1.0 },
        'vine.flowerDensity': { lo: 0.35, hi: 0.35 },
      },
      petalShapes: [DAISY_PETAL_SHAPE],
    };

    const plant = growPlant({ species: climbingSpecies, guide: longTrellis, seed: 99 });
    // Group petals by stemNode to identify individual flower heads
    const petals = plant.organs.filter((o) => o.type === 'petal');
    const flowersByNode = new Map<number, typeof petals>();
    for (const p of petals) {
      if (!flowersByNode.has(p.stemNode)) {
        flowersByNode.set(p.stemNode, []);
      }
      flowersByNode.get(p.stemNode)!.push(p);
    }

    const flowerOrigins = Array.from(flowersByNode.values()).map((headPetals) => headPetals[0]!.origin);
    expect(flowerOrigins.length).toBeGreaterThan(1);

    // Verify all flowers maintain clearance (no overlap): dist >= 2 * petal.length * 1.15
    const flowerRadius = 0.8;
    for (let i = 0; i < flowerOrigins.length; i++) {
      for (let j = i + 1; j < flowerOrigins.length; j++) {
        const d = Math.hypot(
          flowerOrigins[i]![0] - flowerOrigins[j]![0],
          flowerOrigins[i]![1] - flowerOrigins[j]![1],
          flowerOrigins[i]![2] - flowerOrigins[j]![2],
        );
        expect(d).toBeGreaterThanOrEqual(flowerRadius * 2 * 1.15);
      }
    }
  });
});
