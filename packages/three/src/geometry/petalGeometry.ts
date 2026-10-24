import * as THREE from 'three';
import type { Organ, OrganShape } from '@flower-grower/core';
import { evalApexCap, oklchToRgb, sampleWidthProfile } from '@flower-grower/core';

export function buildPetalBaseGrid(
  shape: OrganShape,
  uSegments = 18,
  vSegments = 12,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= uSegments; i++) {
    const u = i / uSegments;
    const w = sampleWidthProfile(shape.widthProfile, u);

    for (let j = 0; j <= vSegments; j++) {
      const v = (j / vSegments) * 2 - 1; // -1..1
      const cap = evalApexCap(shape.tip, v, shape.tipSharpness);
      const z = u * cap;
      positions.push(v, w, z);
      uvs.push(u, (v + 1) * 0.5);
    }
  }

  const stride = vSegments + 1;
  for (let i = 0; i < uSegments; i++) {
    for (let j = 0; j < vSegments; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + j + 1;
      const d = i * stride + j + 1;

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const baseGeom = new THREE.BufferGeometry();
  baseGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  baseGeom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  baseGeom.setIndex(indices);
  return baseGeom;
}

export function buildInstancedPetalGeometry(
  organs: readonly Organ[],
  shape: OrganShape,
  uSegments = 18,
  vSegments = 12,
): THREE.InstancedBufferGeometry {
  const base = buildPetalBaseGrid(shape, uSegments, vSegments);
  const instanced = new THREE.InstancedBufferGeometry();

  instanced.index = base.index;
  instanced.attributes = { ...base.attributes };

  const count = organs.length;
  instanced.instanceCount = count;

  const origins = new Float32Array(count * 3);
  const tangents = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const binormals = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const growthParams = new Float32Array(count * 4); // birth, grow, openDur, open0
  const shapeParams = new Float32Array(count * 4); // scale, cupDepth, curlTip, tilt
  const curveParams = new Float32Array(count * 4); // midribBend, reflex, width, baseNarrow

  for (let i = 0; i < count; i++) {
    const organ = organs[i]!;
    const i3 = i * 3;
    const i4 = i * 4;

    origins[i3] = organ.origin[0];
    origins[i3 + 1] = organ.origin[1];
    origins[i3 + 2] = organ.origin[2];

    tangents[i3] = organ.tangent[0];
    tangents[i3 + 1] = organ.tangent[1];
    tangents[i3 + 2] = organ.tangent[2];

    normals[i3] = organ.normal[0];
    normals[i3 + 1] = organ.normal[1];
    normals[i3 + 2] = organ.normal[2];

    binormals[i3] = organ.binormal[0];
    binormals[i3 + 1] = organ.binormal[1];
    binormals[i3 + 2] = organ.binormal[2];

    const rgb = oklchToRgb(organ.color);
    colors[i3] = rgb.r;
    colors[i3 + 1] = rgb.g;
    colors[i3 + 2] = rgb.b;

    growthParams[i4] = organ.birth;
    growthParams[i4 + 1] = organ.growDuration;
    growthParams[i4 + 2] = organ.openDuration;
    growthParams[i4 + 3] = organ.openness0;

    shapeParams[i4] = organ.scale;
    shapeParams[i4 + 1] = shape.cupDepth;
    shapeParams[i4 + 2] = shape.curlTip;
    shapeParams[i4 + 3] = organ.rotation; // stored tilt

    curveParams[i4] = shape.midribBend;
    curveParams[i4 + 1] =
      shape.reflex * (organ.age !== undefined && organ.age >= 0 ? organ.age : 1.0);
    curveParams[i4 + 2] = organ.width ?? 0.5;
    curveParams[i4 + 3] = shape.ruffle;
  }

  instanced.setAttribute('iOrigin', new THREE.InstancedBufferAttribute(origins, 3));
  instanced.setAttribute('iTangent', new THREE.InstancedBufferAttribute(tangents, 3));
  instanced.setAttribute('iNormal', new THREE.InstancedBufferAttribute(normals, 3));
  instanced.setAttribute('iBinormal', new THREE.InstancedBufferAttribute(binormals, 3));
  instanced.setAttribute('iColor', new THREE.InstancedBufferAttribute(colors, 3));
  instanced.setAttribute(
    'iGrowthParams',
    new THREE.InstancedBufferAttribute(growthParams, 4),
  );
  instanced.setAttribute(
    'iShapeParams',
    new THREE.InstancedBufferAttribute(shapeParams, 4),
  );
  instanced.setAttribute(
    'iCurveParams',
    new THREE.InstancedBufferAttribute(curveParams, 4),
  );

  return instanced;
}
