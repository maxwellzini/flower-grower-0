import type { Species } from '@flower-grower/core';
import { daisy } from './daisy.js';
import { peony } from './peony.js';
import { ranunculus } from './ranunculus.js';
import { rose } from './rose.js';
import { tulip } from './tulip.js';
import { morningGlory } from './morningGlory.js';

export * from './daisy.js';
export * from './peony.js';
export * from './ranunculus.js';
export * from './rose.js';
export * from './tulip.js';
export * from './morningGlory.js';

export const SPECIES_REGISTRY: Record<string, Species> = {
  daisy,
  peony,
  ranunculus,
  rose,
  tulip,
  'morning-glory': morningGlory,
};
