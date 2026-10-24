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
      attribute vec4 iGrowthParams; // birth, grow, openDur, open0
      attribute vec4 iShapeParams;  // scale, cupDepth, curlTip, tilt
      attribute vec4 iCurveParams;  // midribBend, reflex, width, baseNarrow

      varying vec3 vNormal;
      varying vec3 vColor;
      varying vec2 vUv;
      varying float vGrowth;

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

        // Growth scale (0 until born, smoothstep to 1)
        float growProgress = clamp((uTime - iBirth) / max(0.001, iGrow), 0.0, 1.0);
        float sizeScale = smoothstep(0.0, 1.0, growProgress) * iScale;
        vGrowth = growProgress;

        // Bud unfurling (openness going from iOpen0 down to 0)
        // Petals start as an upright central bud and unfurl downwards and outwards
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
        // Deepest at u ~ 0.35, holding the petal's organic volume:
        float cupFactor = sin(clamp(u / 0.72, 0.0, 1.0) * 3.14159265);
        y -= iCupDepth * (1.0 - v * v) * cupFactor;

        // Azimuthal cylindrical wrap:
        // Petal edges wrap around the bud cylinder toward the center (+y in normal frame)
        float wrapR = 0.35;
        float phi = clamp(x / wrapR, -1.35, 1.35);
        x = wrapR * sin(phi);
        y += wrapR * (1.0 - cos(phi)) * (0.35 + iCupDepth * 0.65);

        // 2. Species-specific longitudinal & margin curvature:
        if (iMidribBend > 0.15) {
          // --- TULIP TEPAL ---
          // Deep chalice belly bowing outward:
          float belly = sin(u * 3.14159265);
          y -= iMidribBend * belly * 0.42;

          // Upper rim curves gently inward to clasp the goblet top:
          if (u > 0.52) {
            float inT = (u - 0.52) / 0.48;
            y += iMidribBend * 0.40 * inT * inT;
            z -= iMidribBend * 0.12 * inT;
          }

          // Tulip longitudinal keel:
          float keel = (1.0 - abs(v)) * 0.08 * sin(u * 3.14159265);
          y -= keel;
        } else if (iReflex > 0.05) {
          // --- ROSE PETAL (True botanical recurve & revolute margin) ---
          if (u > 0.38) {
            float archT = (u - 0.38) / 0.62;
            float archAngle = iReflex * archT * archT * 1.8;
            y -= sin(archAngle) * 0.42 * archT;
            z -= (1.0 - cos(archAngle)) * 0.28 * archT;

            // Revolute lateral wing roll:
            // Outer shoulders roll backward around the perimeter
            float wingT = smoothstep(0.35, 1.0, abs(v));
            float rollAngle = wingT * 1.6 * iReflex * archT;
            y -= sin(rollAngle) * 0.28 * wingT * archT;
            x *= (1.0 - (1.0 - cos(rollAngle)) * 0.24 * wingT);
          }
        } else {
          // --- DAISY / LEAF ---
          float midArc = sin(u * 3.14159265);
          y -= iMidribBend * midArc * 0.2;

          // Gentle central furrow:
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
        // In the bud (openness = 1.0), petals stand upright at ~85 deg (1.48 rad) in a tight central bud.
        // As openness -> 0, petals rotate DOWNWARD and OUTWARD to their mature tilt.
        float budTilt = 1.48; // ~85 degrees upright
        float dTheta = (budTilt - iTilt) * openness;
        float cosBeta = cos(dTheta);
        float sinBeta = sin(dTheta);

        // In the bud phase, petals also tuck in their width and wrap tighter around the bud dome
        if (openness > 0.0) {
          x *= (1.0 - 0.35 * openness);
          y -= 0.22 * openness * (1.0 - v * v) * u;
          z -= 0.06 * openness * u * u;
        }

        // Exact rotation around circumferential hinge axis (iBinormal)
        float rotZ = z * cosBeta - y * sinBeta;
        float rotY = z * sinBeta + y * cosBeta;
        float rotX = x;

        vec3 worldPos = iOrigin + (iBinormal * rotX + iNormal * rotY + iTangent * rotZ) * sizeScale;

        // Normal computation taking into account lateral cup, longitudinal slope, and wing roll
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

        // Rotate normal around hinge axis
        vec3 rotNorm = vec3(
          localNorm.x,
          localNorm.z * sinBeta + localNorm.y * cosBeta,
          localNorm.z * cosBeta - localNorm.y * sinBeta
        );

        vNormal = normalize(iBinormal * rotNorm.x + iNormal * rotNorm.y + iTangent * rotNorm.z);

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
        if (!gl_FrontFacing) {
          N = -N;
        }
        vec3 L = normalize(uLightDir);

        // Soft botanical wrap diffuse
        float diff = dot(N, L) * 0.5 + 0.5;
        // Subtle center to tip gradient
        vec3 color = mix(vColor * 0.90, vColor * 1.08, vUv.x);
        vec3 finalColor = color * (0.35 + 0.65 * diff);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
}
