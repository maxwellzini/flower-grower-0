import { describe, expect, it } from 'vitest';
import { createRNG } from '../rng.js';
import { vineWalker } from './vineWalker.js';
import type { GrowthGuide } from '../types.js';

describe('vineWalker generator', () => {
  it('generates stems deterministically from a guide path', () => {
    const guide: GrowthGuide = {
      paths: [
        [
          [0, 0, 0],
          [0, 1.5, 0],
          [0, 3.0, 0],
        ],
      ],
    };

    const rng1 = createRNG(42);
    const stems1 = vineWalker(guide, {}, rng1);

    const rng2 = createRNG(42);
    const stems2 = vineWalker(guide, {}, rng2);

    expect(stems1.length).toBeGreaterThan(0);
    expect(stems1.length).toBe(stems2.length);
    expect(stems1[0]!.nodes.length).toBe(stems2[0]!.nodes.length);
    expect(stems1[0]!.nodes[0]!.pos).toEqual(stems2[0]!.nodes[0]!.pos);
  });

  it('climbs an arbitrary 3D diagonal polyline with non-decreasing birth times', () => {
    const guide: GrowthGuide = {
      paths: [
        [
          [0, 0, 0],
          [1.0, 1.5, 0.5],
          [2.0, 3.0, 1.0],
        ],
      ],
    };

    const rng = createRNG(101);
    const stems = vineWalker(guide, { helixRadius: 0.1, stepLength: 0.05 }, rng);
    expect(stems.length).toBeGreaterThan(0);

    const mainStem = stems[0]!;
    expect(mainStem.kind).toBe('vine');
    expect(mainStem.nodes.length).toBeGreaterThan(20);

    // Verify non-decreasing birth times and non-NaN coordinates
    for (let i = 0; i < mainStem.nodes.length; i++) {
      const node = mainStem.nodes[i]!;
      expect(Number.isFinite(node.pos[0])).toBe(true);
      expect(Number.isFinite(node.pos[1])).toBe(true);
      expect(Number.isFinite(node.pos[2])).toBe(true);
      expect(node.radius).toBeGreaterThan(0);

      if (i > 0) {
        expect(node.birth).toBeGreaterThanOrEqual(mainStem.nodes[i - 1]!.birth);
      }
    }

    // Verify vine climbed upwards towards the target
    const startPos = mainStem.nodes[0]!.pos;
    const endPos = mainStem.nodes[mainStem.nodes.length - 1]!.pos;
    expect(endPos[1]).toBeGreaterThan(startPos[1] + 2.0);
  });

  it('produces helical wrapping around the guide path', () => {
    // Upright guide path
    const guide: GrowthGuide = {
      paths: [
        [
          [0, 0, 0],
          [0, 3.0, 0],
        ],
      ],
    };

    const rng = createRNG(77);
    const helixRadius = 0.12;
    const stems = vineWalker(guide, { helixRadius, helixPitch: 0.5, stepLength: 0.04 }, rng);
    const nodes = stems[0]!.nodes;

    // Check that radial distance to Y axis hovers near helixRadius
    const radialDists = nodes.map((n) => Math.hypot(n.pos[0], n.pos[2]));
    const avgRadial = radialDists.reduce((a, b) => a + b, 0) / radialDists.length;
    expect(avgRadial).toBeGreaterThan(helixRadius * 0.5);
    expect(avgRadial).toBeLessThan(helixRadius * 1.8);
  });

  it('spawns branch tendrils with valid parent references', () => {
    const guide: GrowthGuide = {
      paths: [
        [
          [0, 0, 0],
          [0, 4.0, 0],
        ],
      ],
    };

    const rng = createRNG(13);
    const stems = vineWalker(guide, { pBranch: 0.4 }, rng);

    if (stems.length > 1) {
      const branch = stems[1]!;
      expect(branch.kind).toBe('tendril');
      expect(branch.parent).toBe(0);
      expect(branch.parentNode).toBeGreaterThan(0);
      expect(branch.nodes.length).toBeGreaterThan(2);
      expect(branch.nodes[0]!.birth).toBeGreaterThan(0);
    }
  });
});
