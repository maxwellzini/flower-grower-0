import { describe, expect, it } from 'vitest';
import { growDaisy } from './assemble.js';
import { evalShape } from './organs/evalShape.js';
import { DAISY_PETAL_SHAPE } from './assemble.js';

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
});
