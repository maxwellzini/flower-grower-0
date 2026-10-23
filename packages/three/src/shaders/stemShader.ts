import * as THREE from 'three';

export function createStemMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0.0 },
      uStemColor: { value: new THREE.Color(0x356635) },
      uLightDir: { value: new THREE.Vector3(0.5, 1.0, 0.8).normalize() },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      attribute float aBirth;
      attribute float aGrowSpan;
      attribute float aRadiusScale;
      attribute vec3 aAxis;
      attribute float aU;

      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying float vU;

      void main() {
        vU = aU;
        // Compute growth progress for this node
        float progress = clamp((uTime - aBirth) / max(0.001, aGrowSpan), 0.0, 1.0);
        float radiusEase = smoothstep(0.0, 1.0, progress);

        // Collapse to axis when not yet grown
        vec3 displaced = mix(aAxis, position, radiusEase);

        vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
        vWorldPos = worldPosition.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);

        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uStemColor;
      uniform vec3 uLightDir;

      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying float vU;

      void main() {
        vec3 N = normalize(vNormal);
        vec3 L = normalize(uLightDir);

        // Wrap diffuse lighting (botanical soft lighting)
        float diff = dot(N, L) * 0.5 + 0.5;
        // Subtle base-to-tip gradient
        vec3 color = mix(uStemColor * 0.85, uStemColor * 1.15, vU);
        vec3 finalColor = color * (0.35 + 0.65 * diff);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
}
