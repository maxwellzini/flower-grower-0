import * as THREE from 'three';

export function createPetalMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: {
      uTime: { value: 0.0 },
      uLightDir: { value: new THREE.Vector3(0.5, 1.0, 0.8).normalize() },
      uEnableVeins: { value: 1.0 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;

      in vec3 iOrigin;
      in vec3 iTangent;
      in vec3 iNormal;
      in vec3 iBinormal;
      in vec3 iColor;
      in vec4 iGrowthParams; // birth, grow, openDur, open0
      in vec4 iShapeParams;  // scale, cupDepth, curlTip, tilt
      in vec4 iCurveParams;  // midribBend, reflex, width, ruffle

      out vec3 vNormal;
      out vec3 vViewNormal;
      out vec3 vColor;
      out vec2 vUv;
      out float vGrowth;
      out vec3 vWorldPos;

      void main() {
        vUv = uv;
        vColor = iColor;

        float iBirth = iGrowthParams.x;
        float iGrow = iGrowthParams.y;
        float iOpenDur = iGrowthParams.z;
        float iOpen0 = iGrowthParams.w;

        float iScale = iShapeParams.x;
        float iCupDepth = iShapeParams.y;
        float iCurlTip = iShapeParams.z;
        float iTilt = iShapeParams.w;

        float iMidribBend = iCurveParams.x;
        float iReflex = iCurveParams.y;
        float iWidthScale = iCurveParams.z > 0.01 ? iCurveParams.z : 0.5;
        float iRuffle = iCurveParams.w;

        // Growth scale (0 until born, smoothstep to 1)
        float growProgress = clamp((uTime - iBirth) / max(0.001, iGrow), 0.0, 1.0);
        float sizeScale = smoothstep(0.0, 1.0, growProgress) * iScale;
        vGrowth = growProgress;

        // Bud unfurling (openness going from iOpen0 down to 0)
        float openProgress = clamp((uTime - (iBirth + iGrow * 0.15)) / max(0.001, iOpenDur), 0.0, 1.0);
        float openness = mix(iOpen0, 0.0, smoothstep(0.0, 1.0, openProgress));

        // Base grid: u runs 0..1 along length (from uv.x), v runs -1..1 across width
        float u = uv.x;
        float v = position.x;
        float w = position.y; // base width profile
        float z = position.z; // smooth rounded apex cap coordinate

        // Cross-sectional width scaled by the botanical petal.width gene
        float x = v * w * (iWidthScale * 0.5);
        float y = 0.0;

        // 1. Base concavity / spoon bowl
        float cupFactor = sin(clamp(u / 0.72, 0.0, 1.0) * 3.14159265);
        y -= iCupDepth * (1.0 - v * v) * cupFactor;

        // Azimuthal cylindrical wrap:
        float wrapR = 0.35;
        float phi = clamp(x / wrapR, -1.35, 1.35);
        x = wrapR * sin(phi);
        y += wrapR * (1.0 - cos(phi)) * (0.35 + iCupDepth * 0.65);

        // Margin ruffles (sinusoidal undulations on petal margins)
        if (iRuffle > 0.001) {
          float margin = smoothstep(0.35, 1.0, abs(v));
          float wave = sin(u * 18.0 + v * 9.0);
          y += iRuffle * margin * wave * smoothstep(0.3, 1.0, u) * 0.45;
        }

        // 2. Species-specific longitudinal & margin curvature:
        if (iMidribBend > 0.15) {
          // --- TULIP TEPAL ---
          float belly = sin(u * 3.14159265);
          y -= iMidribBend * belly * 0.42;

          if (u > 0.52) {
            float inT = (u - 0.52) / 0.48;
            y += iMidribBend * 0.40 * inT * inT;
            z -= iMidribBend * 0.12 * inT;
          }

          float keel = (1.0 - abs(v)) * 0.08 * sin(u * 3.14159265);
          y -= keel;
        } else if (iReflex > 0.05) {
          // --- ROSE / PEONY PETAL ---
          if (u > 0.38) {
            float archT = (u - 0.38) / 0.62;
            float archAngle = iReflex * archT * archT * 1.8;
            y -= sin(archAngle) * 0.42 * archT;
            z -= (1.0 - cos(archAngle)) * 0.28 * archT;

            float wingT = smoothstep(0.35, 1.0, abs(v));
            float rollAngle = wingT * 1.6 * iReflex * archT;
            y -= sin(rollAngle) * 0.28 * wingT * archT;
            x *= (1.0 - (1.0 - cos(rollAngle)) * 0.24 * wingT);
          }
        } else {
          // --- DAISY / LEAF ---
          float midArc = sin(u * 3.14159265);
          y -= iMidribBend * midArc * 0.2;

          float furrow = -abs(v) * (1.0 - abs(v)) * 0.14 * midArc;
          y += furrow;

          if (iCurlTip > 0.01 && u > 0.65) {
            float curlT = (u - 0.65) / 0.35;
            float curlAngle = iCurlTip * curlT * curlT * 1.5;
            y -= sin(curlAngle) * 0.2 * curlT;
            z -= (1.0 - cos(curlAngle)) * 0.14 * curlT;
          }
        }

        // 3. Central bud formation & downward unfurling
        float budTilt = 1.48;
        float dTheta = (budTilt - iTilt) * openness;
        float cosBeta = cos(dTheta);
        float sinBeta = sin(dTheta);

        if (openness > 0.0) {
          x *= (1.0 - 0.35 * openness);
          y -= 0.22 * openness * (1.0 - v * v) * u;
          z -= 0.06 * openness * u * u;
        }

        float rotZ = z * cosBeta - y * sinBeta;
        float rotY = z * sinBeta + y * cosBeta;
        float rotX = x;

        vec3 worldPos = iOrigin + (iBinormal * rotX + iNormal * rotY + iTangent * rotZ) * sizeScale;
        vWorldPos = worldPos;

        // Normal computation
        float slopeX = 2.0 * v * iCupDepth;
        float slopeZ = 0.0;
        if (iMidribBend > 0.15) {
          slopeZ -= iMidribBend * cos(u * 3.14159265) * 0.42;
          if (u > 0.52) {
            slopeZ += iMidribBend * 0.80 * ((u - 0.52) / 0.48);
          }
        } else if (iReflex > 0.05 && u > 0.38) {
          slopeZ -= iReflex * 1.6 * ((u - 0.38) / 0.62);
          slopeX += sign(v) * smoothstep(0.35, 1.0, abs(v)) * iReflex * 1.2;
        }
        vec3 localNorm = normalize(vec3(slopeX, 1.0, -slopeZ));

        vec3 rotNorm = vec3(
          localNorm.x,
          localNorm.z * sinBeta + localNorm.y * cosBeta,
          localNorm.z * cosBeta - localNorm.y * sinBeta
        );

        vec3 worldNormal = normalize(iBinormal * rotNorm.x + iNormal * rotNorm.y + iTangent * rotNorm.z);
        vNormal = worldNormal;
        vViewNormal = normalize(mat3(viewMatrix) * worldNormal);

        gl_Position = projectionMatrix * viewMatrix * vec4(worldPos, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uLightDir;
      uniform float uEnableVeins;

      in vec3 vNormal;
      in vec3 vViewNormal;
      in vec3 vColor;
      in vec2 vUv;
      in float vGrowth;
      in vec3 vWorldPos;

      layout(location = 0) out vec4 outColor;
      layout(location = 1) out vec4 outNormal;

      void main() {
        if (vGrowth <= 0.001) {
          discard;
        }

        vec3 N = normalize(vNormal);
        if (!gl_FrontFacing) {
          N = -N;
        }
        vec3 L = normalize(uLightDir);

        // Soft botanical wrap diffuse (half-Lambert)
        float diff = dot(N, L) * 0.5 + 0.5;

        // Base-to-tip organic color gradient
        vec3 color = mix(vColor * 0.88, vColor * 1.08, vUv.x);

        // Soft procedural botanical venation (subtle, non-intrusive)
        if (uEnableVeins > 0.5) {
          float vAcross = (vUv.y - 0.5) * 2.0;
          float midrib = exp(-vAcross * vAcross * 120.0) * 0.05 * smoothstep(0.05, 0.35, vUv.x);
          float branchParam = vUv.x * 8.0 - abs(vAcross) * 3.5;
          float lateral = exp(-pow(sin(branchParam * 3.14159265), 2.0) * 12.0) * 0.035 *
                          smoothstep(0.15, 0.70, vUv.x) * smoothstep(0.1, 0.6, abs(vAcross));
          float veinShade = 1.0 - (midrib + lateral);
          color *= veinShade;
        }

        // Faint warm rim lighting on silhouettes
        vec3 V = normalize(-vWorldPos);
        float rim = pow(1.0 - max(0.0, dot(N, V)), 2.8) * 0.20;
        vec3 warmRim = vec3(1.0, 0.94, 0.85) * rim;

        vec3 finalColor = color * (0.35 + 0.65 * diff) + warmRim * color;

        outColor = vec4(finalColor, 1.0);
        outNormal = vec4(normalize(vViewNormal) * 0.5 + 0.5, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
}
