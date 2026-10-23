import { describe, expect, it } from 'vitest';
import type { Plant, OrganShape } from './types.js';

describe('Plant data model serialization', () => {
  it('guarantees Plant data model round-trips through JSON without data loss', () => {
    const testShape: OrganShape = {
      length: 1,
      widthProfile: [0.1, 0.4, 0.7, 0.9, 1.0, 0.95, 0.7, 0.4, 0.1, 0],
      tip: 'round',
      tipSharpness: 0.5,
      baseNarrow: 0.2,
      cupDepth: 0.15,
      curlTip: 0.3,
      reflex: 0.1,
      ruffle: 0.05,
      ruffleFreq: 4,
      midribBend: 0.1,
      veinCount: 5,
      veinDepth: 0.02,
      lobes: { count: 3, depth: 0.2 },
    };

    const plant: Plant = {
      seed: 42,
      speciesId: 'daisy',
      generatorVersion: 1,
      stems: [
        {
          id: 0,
          parent: null,
          parentNode: null,
          kind: 'trunk',
          nodes: [
            { pos: [0, 0, 0], radius: 0.05, birth: 0 },
            { pos: [0, 1, 0], radius: 0.045, birth: 0.5 },
            { pos: [0, 2, 0], radius: 0.04, birth: 1.0 },
          ],
        },
      ],
      organs: [
        {
          id: 0,
          type: 'petal',
          stemId: 0,
          stemNode: 2,
          origin: [0, 2, 0],
          tangent: [1, 0, 0],
          normal: [0, 1, 0],
          binormal: [0, 0, 1],
          shape: 0,
          scale: 0.8,
          rotation: 0.2,
          color: { light: 0.9, chroma: 0.05, hue: 60 },
          birth: 1.2,
          growDuration: 0.5,
          openDuration: 0.8,
          openness0: 1.0,
          age: 0,
        },
      ],
      shapes: [testShape],
      duration: 3.5,
      bounds: {
        min: [-1, 0, -1],
        max: [1, 2.5, 1],
      },
    };

    const json = JSON.stringify(plant);
    const parsed: Plant = JSON.parse(json);

    expect(parsed).toEqual(plant);
  });
});
