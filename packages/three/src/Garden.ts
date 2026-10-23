import * as THREE from 'three';
import type { Organ, Plant } from '@flower-grower/core';
import { createStemMaterial } from './shaders/stemShader.js';
import { createPetalMaterial } from './shaders/petalShader.js';
import { buildStemBufferGeometry } from './geometry/stemGeometry.js';
import { buildInstancedPetalGeometry } from './geometry/petalGeometry.js';

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
}

export class Garden {
  readonly scene: THREE.Scene;
  readonly renderer?: THREE.WebGLRenderer;
  private handles: PlantHandle[] = [];
  private nextHandleId = 1;
  private currentTime = 0;
  private materials: THREE.ShaderMaterial[] = [];

  constructor(options: GardenOptions = {}) {
    this.scene = new THREE.Scene();

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
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
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
    if (this.renderer) {
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
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
