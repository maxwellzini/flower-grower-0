import * as THREE from 'three';
import type { Organ, OrganShape } from '@flower-grower/core';
import { oklchToRgb, sampleWidthProfile } from '@flower-grower/core';

export function buildPetalBaseGrid(
  shape: OrganShape,
  uSegments = 10,
  vSegments = 6,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= uSegments; i++) {
    const u = i / uSegments;
    const w = sampleWidthProfile(shape.widthProfile, u);

    for (let j = 0; j <= vSegments; j++) {
      const v = (j / vSegments) * 2 - 1; // -1..1
      positions.push(v, w, u);
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
  uSegments = 10,
  vSegments = 6,
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
  const births = new Float32Array(count);
  const grows = new Float32Array(count);
  const openDurs = new Float32Array(count);
  const open0s = new Float32Array(count);
  const scales = new Float32Array(count);
  const cupDepths = new Float32Array(count);
  const curlTips = new Float32Array(count);
  const tilts = new Float32Array(count);
  const midribBends = new Float32Array(count);
  const reflexes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const organ = organs[i]!;
    const i3 = i * 3;

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

    births[i] = organ.birth;
    grows[i] = organ.growDuration;
    openDurs[i] = organ.openDuration;
    open0s[i] = organ.openness0;
    scales[i] = organ.scale;
    cupDepths[i] = shape.cupDepth;
    curlTips[i] = shape.curlTip;
    tilts[i] = organ.rotation;
    midribBends[i] = shape.midribBend;
    reflexes[i] = shape.reflex;
  }

  instanced.setAttribute('iOrigin', new THREE.InstancedBufferAttribute(origins, 3));
  instanced.setAttribute('iTangent', new THREE.InstancedBufferAttribute(tangents, 3));
  instanced.setAttribute('iNormal', new THREE.InstancedBufferAttribute(normals, 3));
  instanced.setAttribute('iBinormal', new THREE.InstancedBufferAttribute(binormals, 3));
  instanced.setAttribute('iColor', new THREE.InstancedBufferAttribute(colors, 3));
  instanced.setAttribute('iBirth', new THREE.InstancedBufferAttribute(births, 1));
  instanced.setAttribute('iGrow', new THREE.InstancedBufferAttribute(grows, 1));
  instanced.setAttribute('iOpenDur', new THREE.InstancedBufferAttribute(openDurs, 1));
  instanced.setAttribute('iOpen0', new THREE.InstancedBufferAttribute(open0s, 1));
  instanced.setAttribute('iScale', new THREE.InstancedBufferAttribute(scales, 1));
  instanced.setAttribute('iCupDepth', new THREE.InstancedBufferAttribute(cupDepths, 1));
  instanced.setAttribute('iCurlTip', new THREE.InstancedBufferAttribute(curlTips, 1));
  instanced.setAttribute('iTilt', new THREE.InstancedBufferAttribute(tilts, 1));
  instanced.setAttribute('iMidribBend', new THREE.InstancedBufferAttribute(midribBends, 1));
  instanced.setAttribute('iReflex', new THREE.InstancedBufferAttribute(reflexes, 1));

  return instanced;
}
