export type Vec3 = [number, number, number];

export interface RNG {
  next(): number;
  range(a: number, b: number): number;
  int(a: number, b: number): number;
  pick<T>(arr: readonly T[]): T;
  gaussian(mean?: number, sd?: number): number;
  fork(label: string): RNG;
}

export type StemKind = 'trunk' | 'branch' | 'vine' | 'tendril' | 'peduncle';

export interface StemNode {
  pos: Vec3;
  radius: number;
  birth: number;
}

export interface Stem {
  id: number;
  parent: number | null;
  parentNode: number | null;
  nodes: StemNode[];
  kind: StemKind;
}

export type OrganType =
  'petal' | 'sepal' | 'leaf' | 'stamen' | 'pistil' | 'center' | 'bud' | 'seedhead';

export type ShapeId = number;

export interface ColorGene {
  light: number; // 0..1
  chroma: number; // >= 0
  hue: number; // 0..360 degrees
}

export interface Organ {
  id: number;
  type: OrganType;
  stemId: number;
  stemNode: number;
  origin: Vec3;
  tangent: Vec3;
  normal: Vec3;
  binormal: Vec3;
  shape: ShapeId;
  scale: number;
  rotation: number;
  color: ColorGene;
  birth: number;
  growDuration: number;
  openDuration: number;
  openness0: number;
  age: number;
}

export type OrganTip = 'round' | 'point' | 'notch' | 'fringe';

export interface OrganShape {
  length: 1;
  widthProfile: number[];
  tip: OrganTip;
  tipSharpness: number;
  baseNarrow: number;
  cupDepth: number;
  curlTip: number;
  reflex: number;
  ruffle: number;
  ruffleFreq: number;
  midribBend: number;
  veinCount: number;
  veinDepth: number;
  lobes?: {
    count: number;
    depth: number;
  };
}

export interface PlantBounds {
  min: Vec3;
  max: Vec3;
}

export interface Plant {
  seed: number;
  speciesId: string;
  generatorVersion?: number;
  stems: Stem[];
  organs: Organ[];
  shapes: OrganShape[];
  duration: number;
  bounds: PlantBounds;
}

export type Region =
  | { kind: 'sphere'; center: Vec3; radius: number }
  | { kind: 'box'; min: Vec3; max: Vec3 }
  | { kind: 'cylinder'; start: Vec3; end: Vec3; radius: number };

export interface GrowthGuide {
  paths: Vec3[][];
  attractors?: Vec3[];
  region?: Region;
  obstacles?: Region[];
  up?: Vec3;
}
