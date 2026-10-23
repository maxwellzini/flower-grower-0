import { describe, expect, it } from 'vitest';
import { SPECIES_REGISTRY } from './index.js';

describe('species skeleton', () => {
  it('exports species registry', () => {
    expect(SPECIES_REGISTRY).toBeDefined();
  });
});
