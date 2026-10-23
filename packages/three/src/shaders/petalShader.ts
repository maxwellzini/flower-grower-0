import * as THREE from 'three';

export function createPetalMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0.0 },
      uLightDir: { value: new THREE.Vector3(0.5, 1.0, 0.8).normalize() },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;

      attribute vec3 iOrigin;
      attribute vec3 iTangent;
      attribute vec3 iNormal;
      attribute vec3 iBinormal;
      attribute vec3 iColor;
      attribute float iBirth;
      attribute float iGrow;
      attribute float iOpenDur;
      attribute float iOpen0;
      attribute float iScale;
      attribute float iSeed;
      attribute float iCupDepth;
      attribute float iCurlTip;

      varying vec3 vNormal;
      varying vec3 vColor;
      varying vec2 vUv;
      varying float vGrowth;

      void main() {
        vUv = uv;
        vColor = iColor;

        // Growth scale (0 until born, smoothstep to 1)
        float growProgress = clamp((uTime - iBirth) / max(0.001, iGrow), 0.0, 1.0);
        float sizeScale = smoothstep(0.0, 1.0, growProgress) * iScale;
        vGrowth = growProgress;

        // Bud unfurling (openness going from iOpen0 down to 0)
        float openProgress = clamp((uTime - (iBirth + iGrow * 0.35)) / max(0.001, iOpenDur), 0.0, 1.0);
        float openness = mix(iOpen0, 0.0, smoothstep(0.0, 1.0, openProgress));

        // Base grid: u runs 0..1 along length (Z), v runs -1..1 across width (X)
        float u = position.z;
        float v = position.x;
        float w = position.y; // base width profile stored in position.y

        float x = v * w * 0.5;
        float y = 0.0;
        float z = u;

        // Lateral cup
        y += iCupDepth * (1.0 - v * v) * sin(u * 3.14159265);

        // Tip curl
        if (u > 0.6) {
          float curlT = (u - 0.6) / 0.4;
          float curlAngle = iCurlTip * curlT * curlT;
          y -= sin(curlAngle) * 0.3 * curlT;
          z -= (1.0 - cos(curlAngle)) * 0.2 * curlT;
        }

        // Bud curling (in bud phase, petals fold inward towards center)
        if (openness > 0.0) {
          float budCup = openness * 0.4 * (1.0 - v * v);
          y += budCup;
          float budAngle = openness * 1.15 * u;
          float origY = y;
          float origZ = z;
          y = origY * cos(budAngle) - origZ * sin(budAngle);
          z = origY * sin(budAngle) + origZ * cos(budAngle);
          x *= (1.0 - openness * 0.35);
        }

        vec3 localPos = vec3(x, y, z);
        vec3 worldPos = iOrigin + (iBinormal * localPos.x + iNormal * localPos.y + iTangent * localPos.z) * sizeScale;

        // Normal approximation
        vec3 localNormal = normalize(vec3(-v * iCupDepth * 2.0, 1.0, -0.2));
        vNormal = normalize(iBinormal * localNormal.x + iNormal * localNormal.y + iTangent * localNormal.z);

        gl_Position = projectionMatrix * viewMatrix * vec4(worldPos, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uLightDir;

      varying vec3 vNormal;
      varying vec3 vColor;
      varying vec2 vUv;
      varying float vGrowth;

      void main() {
        if (vGrowth <= 0.001) {
          discard;
        }

        vec3 N = normalize(vNormal);
        vec3 L = normalize(uLightDir);

        // Soft botanical wrap diffuse
        float diff = dot(N, L) * 0.5 + 0.5;
        // Subtle center to tip gradient
        vec3 color = mix(vColor * 0.92, vColor * 1.08, vUv.x);
        vec3 finalColor = color * (0.4 + 0.6 * diff);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
}
