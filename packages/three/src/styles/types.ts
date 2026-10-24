export type StyleName = 'botanical' | 'watercolor' | 'realistic' | 'minimal';

export interface StyleOptions {
  name: StyleName;
  inkEdges?: boolean;
  inkColor?: [number, number, number]; // RGB 0..1 (default sepia [0.14, 0.11, 0.09])
  lineWidth?: number; // pixels, default 1.2
  wobble?: number; // hand-drawn line wobble intensity, default 1.0
  veins?: boolean; // procedural botanical venation, default true
  paper?: boolean; // antique paper background, default false (transparent)
  paperColor?: [number, number, number]; // RGB 0..1 (default [0.965, 0.945, 0.915])
}

export const DEFAULT_BOTANICAL_STYLE: StyleOptions = {
  name: 'botanical',
  inkEdges: true,
  inkColor: [0.14, 0.11, 0.09],
  lineWidth: 1.2,
  wobble: 1.0,
  veins: true,
  paper: false,
  paperColor: [0.965, 0.945, 0.915],
};
