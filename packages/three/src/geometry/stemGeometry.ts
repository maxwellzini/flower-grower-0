import * as THREE from 'three';
import type { Stem, Vec3 } from '@flower-grower/core';
import { computeParallelTransportFrames } from '@flower-grower/core';

export function buildStemBufferGeometry(
  stems: readonly Stem[],
  radialSegments = 8,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const axes: number[] = [];
  const births: number[] = [];
  const growSpans: number[] = [];
  const radiusScales: number[] = [];
  const us: number[] = [];
  const indices: number[] = [];

  let vertexOffset = 0;

  for (const stem of stems) {
    const nodes = stem.nodes;
    const nodeCount = nodes.length;
    if (nodeCount < 2) continue;

    const points: Vec3[] = nodes.map((n) => n.pos);
    const frames = computeParallelTransportFrames(points);

    const firstBirth = nodes[0]!.birth;
    const lastBirth = nodes[nodeCount - 1]!.birth;
    const totalSpan = Math.max(0.1, lastBirth - firstBirth);

    const baseVertex = vertexOffset;

    for (let i = 0; i < nodeCount; i++) {
      const node = nodes[i]!;
      const frame = frames[i]!;
      const r = node.radius;
      const u = i / (nodeCount - 1);
      const nodeSpan = Math.max(0.1, totalSpan * 0.4);

      for (let j = 0; j <= radialSegments; j++) {
        const theta = (j * 2 * Math.PI) / radialSegments;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        const nx = frame.normal[0] * cosT + frame.binormal[0] * sinT;
        const ny = frame.normal[1] * cosT + frame.binormal[1] * sinT;
        const nz = frame.normal[2] * cosT + frame.binormal[2] * sinT;

        const px = node.pos[0] + nx * r;
        const py = node.pos[1] + ny * r;
        const pz = node.pos[2] + nz * r;

        positions.push(px, py, pz);
        normals.push(nx, ny, nz);
        axes.push(node.pos[0], node.pos[1], node.pos[2]);
        births.push(node.birth);
        growSpans.push(nodeSpan);
        radiusScales.push(r);
        us.push(u);

        vertexOffset++;
      }
    }

    // Connect rings with quad faces (2 triangles per quad)
    const stride = radialSegments + 1;
    for (let i = 0; i < nodeCount - 1; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = baseVertex + i * stride + j;
        const b = baseVertex + (i + 1) * stride + j;
        const c = baseVertex + (i + 1) * stride + j + 1;
        const d = baseVertex + i * stride + j + 1;

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('aAxis', new THREE.Float32BufferAttribute(axes, 3));
  geometry.setAttribute('aBirth', new THREE.Float32BufferAttribute(births, 1));
  geometry.setAttribute('aGrowSpan', new THREE.Float32BufferAttribute(growSpans, 1));
  geometry.setAttribute(
    'aRadiusScale',
    new THREE.Float32BufferAttribute(radiusScales, 1),
  );
  geometry.setAttribute('aU', new THREE.Float32BufferAttribute(us, 1));
  geometry.setIndex(indices);

  return geometry;
}
