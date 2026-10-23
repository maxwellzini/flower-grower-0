import type { Species } from '@flower-grower/core';
import { daisy } from './daisy.js';
import { rose } from './rose.js';
import { tulip } from './tulip.js';

export * from './daisy.js';
export * from './rose.js';
export * from './tulip.js';

export const SPECIES_REGISTRY: Record<string, Species> = {
  daisy,
  rose,
  tulip,
};
