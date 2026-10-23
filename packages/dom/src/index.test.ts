import { describe, expect, it } from 'vitest';
import { DOM_VERSION } from './index.js';

describe('dom skeleton', () => {
  it('exports dom version', () => {
    expect(DOM_VERSION).toBe('0.0.1');
  });
});
