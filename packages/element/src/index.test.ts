import { describe, expect, it } from 'vitest';
import { ELEMENT_TAG } from './index.js';

describe('element skeleton', () => {
  it('exports element tag', () => {
    expect(ELEMENT_TAG).toBe('flower-grower');
  });
});
