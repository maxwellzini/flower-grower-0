import { describe, expect, it } from 'vitest';
import { THREE_VERSION_COMPAT } from './index.js';

describe('three skeleton', () => {
  it('exports compat version', () => {
    expect(THREE_VERSION_COMPAT).toBe('>=0.160.0');
  });
});
