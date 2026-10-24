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
});
