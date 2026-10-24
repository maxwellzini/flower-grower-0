import * as THREE from 'three';

export function createStemMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: {
      uTime: { value: 0.0 },
      uStemColor: { value: new THREE.Color(0x356635) },
      uLightDir: { value: new THREE.Vector3(0.5, 1.0, 0.8).normalize() },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      in float aBirth;
      in float aGrowSpan;
      in float aRadiusScale;
      in vec3 aAxis;
      in float aU;

      out vec3 vNormal;
      out vec3 vViewNormal;
      out vec3 vWorldPos;
      out float vU;

      void main() {
        vU = aU;
        float progress = clamp((uTime - aBirth) / max(0.001, aGrowSpan), 0.0, 1.0);
        float radiusEase = smoothstep(0.0, 1.0, progress);

        vec3 displaced = mix(aAxis, position, radiusEase);

        vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
        vWorldPos = worldPosition.xyz;
        vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
        vNormal = worldNormal;
        vViewNormal = normalize(mat3(viewMatrix) * worldNormal);

        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uStemColor;
      uniform vec3 uLightDir;

      in vec3 vNormal;
      in vec3 vViewNormal;
      in vec3 vWorldPos;
      in float vU;

      layout(location = 0) out vec4 outColor;
      layout(location = 1) out vec4 outNormal;

      void main() {
        vec3 N = normalize(vNormal);
        vec3 L = normalize(uLightDir);

        // Wrap diffuse lighting (botanical soft lighting)
        float diff = dot(N, L) * 0.5 + 0.5;
        vec3 color = mix(uStemColor * 0.85, uStemColor * 1.15, vU);

        // Faint warm rim
        vec3 V = normalize(-vWorldPos);
        float rim = pow(1.0 - max(0.0, dot(N, V)), 2.8) * 0.18;
        vec3 warmRim = vec3(1.0, 0.94, 0.85) * rim;

        vec3 finalColor = color * (0.35 + 0.65 * diff) + warmRim * color;

        outColor = vec4(finalColor, 1.0);
        outNormal = vec4(normalize(vViewNormal) * 0.5 + 0.5, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
}
