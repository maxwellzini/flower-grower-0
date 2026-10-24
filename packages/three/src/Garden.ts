import * as THREE from 'three';
import type { Organ, Plant } from '@flower-grower/core';
import { createStemMaterial } from './shaders/stemShader.js';
import { createPetalMaterial } from './shaders/petalShader.js';
import { buildStemBufferGeometry } from './geometry/stemGeometry.js';
import { buildInstancedPetalGeometry } from './geometry/petalGeometry.js';
import { BotanicalPass } from './postprocessing/BotanicalPass.js';
import {
  DEFAULT_BOTANICAL_STYLE,
  type StyleName,
  type StyleOptions,
} from './styles/types.js';

export interface PlantHandle {
  id: number;
  plant: Plant;
  startTime: number;
  duration: number;
  setTime(t: number): void;
  group: THREE.Group;
}

export interface GardenOptions {
  renderer?: THREE.WebGLRenderer;
  canvas?: HTMLCanvasElement;
  transparent?: boolean;
  style?: StyleName | StyleOptions;
}

export class Garden {
  readonly scene: THREE.Scene;
  readonly renderer?: THREE.WebGLRenderer;
  private handles: PlantHandle[] = [];
  private nextHandleId = 1;
  private currentTime = 0;
  private materials: THREE.ShaderMaterial[] = [];
  private style: StyleOptions = { ...DEFAULT_BOTANICAL_STYLE };
  private botanicalPass = new BotanicalPass();

  constructor(options: GardenOptions = {}) {
    this.scene = new THREE.Scene();

    if (options.style) {
      this.setStyle(options.style);
    }

    if (options.renderer) {
      this.renderer = options.renderer;
    } else if (options.canvas) {
      this.renderer = new THREE.WebGLRenderer({
        canvas: options.canvas,
        antialias: true,
        alpha: options.transparent ?? true,
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    }
  }

  setStyle(style: StyleName | StyleOptions): void {
    if (typeof style === 'string') {
      if (style === 'botanical') {
        this.style = { ...DEFAULT_BOTANICAL_STYLE };
      } else if (style === 'minimal') {
        this.style = {
          name: 'minimal',
          inkEdges: false,
          paper: false,
          veins: false,
        };
      } else {
        this.style = { ...DEFAULT_BOTANICAL_STYLE, name: style };
      }
    } else {
      this.style = { ...DEFAULT_BOTANICAL_STYLE, ...style };
    }

    // Update material uniforms for veins
    for (const mat of this.materials) {
      if (mat.uniforms.uEnableVeins) {
        mat.uniforms.uEnableVeins.value = this.style.veins !== false ? 1.0 : 0.0;
      }
    }
  }

  getStyle(): StyleOptions {
    return { ...this.style };
  }

  add(plant: Plant, opts: { startTime?: number } = {}): PlantHandle {
    const startTime = opts.startTime ?? 0;
    const group = new THREE.Group();

    // 1. Stems
    if (plant.stems.length > 0) {
      const stemGeom = buildStemBufferGeometry(plant.stems);
      const stemMat = createStemMaterial();
      this.materials.push(stemMat);
      const stemMesh = new THREE.Mesh(stemGeom, stemMat);
      stemMesh.frustumCulled = false;
      group.add(stemMesh);
    }

    // 2. Organs grouped by shape
    const organsByShape = new Map<number, Organ[]>();
    for (const organ of plant.organs) {
      const shapeId = organ.shape;
      if (!organsByShape.has(shapeId)) {
        organsByShape.set(shapeId, []);
      }
      organsByShape.get(shapeId)!.push(organ);
    }

    for (const [shapeId, organs] of organsByShape.entries()) {
      const shape = plant.shapes[shapeId];
      if (!shape) continue;

      const petalGeom = buildInstancedPetalGeometry(organs, shape);
      const petalMat = createPetalMaterial();
      if (petalMat.uniforms.uEnableVeins) {
        petalMat.uniforms.uEnableVeins.value = this.style.veins !== false ? 1.0 : 0.0;
      }
      this.materials.push(petalMat);
      const petalMesh = new THREE.Mesh(petalGeom, petalMat);
      petalMesh.frustumCulled = false;
      group.add(petalMesh);
    }

    this.scene.add(group);

    const handle: PlantHandle = {
      id: this.nextHandleId++,
      plant,
      startTime,
      duration: plant.duration,
      group,
      setTime: (t: number) => {
        this.setTime(t);
      },
    };

    this.handles.push(handle);
    this.setTime(this.currentTime);

    return handle;
  }

  remove(handle: PlantHandle): void {
    const idx = this.handles.indexOf(handle);
    if (idx !== -1) {
      this.handles.splice(idx, 1);
      this.scene.remove(handle.group);
      handle.group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          for (const m of mats) {
            m.dispose();
            const matIdx = this.materials.indexOf(m as THREE.ShaderMaterial);
            if (matIdx !== -1) {
              this.materials.splice(matIdx, 1);
            }
          }
        }
      });
    }
  }

  setTime(time: number): void {
    this.currentTime = time;
    for (const mat of this.materials) {
      if (mat.uniforms.uTime) {
        mat.uniforms.uTime.value = time;
      }
    }
  }

  getTime(): number {
    return this.currentTime;
  }

  update(dt = 0.016): void {
    this.setTime(this.currentTime + dt);
  }

  render(camera: THREE.Camera): void {
    if (!this.renderer) return;

    if (this.style.inkEdges || this.style.paper) {
      this.botanicalPass.render(this.renderer, this.scene, camera, this.style);
    } else {
      this.renderer.render(this.scene, camera);
    }
  }

  dispose(): void {
    for (const handle of [...this.handles]) {
      this.remove(handle);
    }
    for (const mat of this.materials) {
      mat.dispose();
    }
    this.materials = [];
    this.botanicalPass.dispose();
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
