import { describe, expect, it } from 'vitest';
import { ranunculusSpiral, roseSpiral, tulipWhorls, whorls } from './placement.js';

describe('Petal Placements', () => {
  it('ranunculusSpiral generates dense incurved spherical phyllotaxis', () => {
    const count = 90;
    const placements = ranunculusSpiral({ count, radius: 0.095, tilt: 1.15 });

    expect(placements.length).toBe(count);

    // Inner petal (index 0)
    const inner = placements[0]!;
    expect(inner.tilt).toBeGreaterThan(1.35); // tight vertical core
    expect(inner.scale).toBeLessThan(0.4);

    // Outer petal (index count - 1)
    const outer = placements[count - 1]!;
    // Incurved shell: outer petals maintain an erect cupped tilt (~65 deg) rather than reflexing
    expect(outer.tilt).toBeGreaterThan(1.0);
    expect(outer.scale).toBeGreaterThan(0.9);
  });

  it('roseSpiral generates golden spiral phyllotaxis with tangential yaw', () => {
    const count = 42;
    const placements = roseSpiral({ count, radius: 0.1, tilt: 0.35 });

    expect(placements.length).toBe(count);

    // Inner petal (index 0)
    const inner = placements[0]!;
    expect(inner.tilt).toBeGreaterThan(1.3); // erect bud core
    expect(inner.yaw).toBeGreaterThan(0.5); // tangential swirl
    expect(inner.scale).toBeLessThan(0.5); // smaller inner scale

    // Outer petal (index count - 1)
    const outer = placements[count - 1]!;
    expect(outer.tilt).toBeLessThan(0.6); // flared open
    expect(outer.yaw).toBeLessThan(0.05); // facing forward
    expect(outer.scale).toBeGreaterThan(0.9); // large guard petal

    // Radius monotonically expands on average from inner to outer
    const rInner = Math.hypot(inner.offset[0], inner.offset[2]);
    const rOuter = Math.hypot(outer.offset[0], outer.offset[2]);
    expect(rOuter).toBeGreaterThan(rInner * 3);
  });

  it('tulipWhorls generates 3 inner + 3 outer alternating trimerous tepals', () => {
    const placements = tulipWhorls({ radius: 0.05, tilt: 1.32 });
    expect(placements.length).toBe(6);

    const inner = placements.filter((p) => p.layer === 1);
    const outer = placements.filter((p) => p.layer === 0);

    expect(inner.length).toBe(3);
    expect(outer.length).toBe(3);

    // Inner tepals are spaced 120 deg apart
    const innerAngles = inner.map((p) => p.angle % (2 * Math.PI)).sort((a, b) => a - b);
    expect(innerAngles[1]! - innerAngles[0]!).toBeCloseTo((2 * Math.PI) / 3, 2);

    // Outer tepals are shifted by 60 deg (pi / 3)
    const outerRadius = Math.hypot(outer[0]!.offset[0], outer[0]!.offset[2]);
    const innerRadius = Math.hypot(inner[0]!.offset[0], inner[0]!.offset[2]);
    expect(outerRadius).toBeGreaterThan(innerRadius);
  });

  it('whorls maintains backwards compatibility for flat flowers', () => {
    const placements = whorls({ count: 21, layers: 2, radius: 0.08 });
    expect(placements.length).toBe(21);
  });
});
