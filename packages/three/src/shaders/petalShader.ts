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

        // Base grid: u runs 0..1 along length (base to tip), v runs -1..1 across width
        float u = position.z;
        float v = position.x;
        float w = position.y; // base width profile

        // Cross-sectional width scaled by the botanical petal.width gene
        float x = v * w * (iWidthScale * 0.5);
        float y = 0.0;
        float z = u;

        // 1. Curving around the center of the flower (transverse / lateral curvature)
        // iNormal points inward towards the stem axis.
        // Negative Y moves outward away from the stem axis (creating a concave inner cup cradling the flower center).
        float cupFactor = sin(u * 3.14159265);
        y -= iCupDepth * (1.0 - v * v) * cupFactor;

        // B. Azimuthal curve around floral cylinder (bending margins inward towards center)
        z -= 0.32 * (v * v) * (w * w) * (0.3 + iCupDepth);

        // C. Central midrib longitudinal trough/gutter (crisp crease definition for petals & leaves):
        float midribFurrow = -abs(v) * (1.0 - abs(v)) * 0.16 * max(0.12, iCupDepth) * cupFactor;
        y += midribFurrow;

        // 2. Longitudinal curvature from base (bottom) to tip (top), varying by plant type
        if (iMidribBend > 0.1) {
          // Tulip goblet cup & arched leaf:
          // Mid-section belly bows OUTWARD (negative Y in local frame where normal points inward):
          float belly = sin(u * 3.14159265);
          y -= iMidribBend * belly * 0.42;

          // Upper rim curves gently INWARD (positive Y) to clasp the top of the goblet:
          if (u > 0.55) {
            float inT = (u - 0.55) / 0.45;
            y += iMidribBend * 0.38 * inT * inT;
            z -= iMidribBend * 0.12 * inT;
          }
        } else {
          // Daisy & Rose:
          float midribArc = sin(u * 3.14159265);
          y -= iMidribBend * midribArc * 0.2;

          // Outward reflexed lip (Rose):
          if (iReflex > 0.03 && u > 0.45) {
            float refT = (u - 0.45) / 0.55;
            float reflexAngle = iReflex * refT * refT * 2.5;
            y -= sin(reflexAngle) * 0.42 * refT;
            z -= (1.0 - cos(reflexAngle)) * 0.28 * refT;

            // Rose petal edge margin roll:
            float marginRoll = smoothstep(0.55, 1.0, abs(v)) * iReflex * 0.18 * refT;
            y -= marginRoll;

            // Rose petal edge cusp/crease at the reflexed margin:
            float cusp = (1.0 - smoothstep(0.0, 0.25, abs(v))) * smoothstep(0.65, 1.0, u);
            y -= cusp * 0.08 * iReflex;
            z -= cusp * 0.06 * iReflex;
          } else if (iCurlTip > 0.01 && u > 0.65) {
            // Gentle daisy tip droop:
            float curlT = (u - 0.65) / 0.35;
            float curlAngle = iCurlTip * curlT * curlT * 1.5;
            y -= sin(curlAngle) * 0.18 * curlT;
            z -= (1.0 - cos(curlAngle)) * 0.12 * curlT;
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

        // Normal computation taking into account lateral cup, longitudinal slope, and bud rotation
        float slopeX = 2.0 * v * iCupDepth;
        float slopeZ = 0.0;
        if (iMidribBend > 0.1) {
          slopeZ -= iMidribBend * cos(u * 3.14159265) * 0.42;
          if (u > 0.55) {
            slopeZ += iMidribBend * 0.76 * ((u - 0.55) / 0.45);
          }
        } else if (iReflex > 0.03 && u > 0.45) {
          slopeZ -= iReflex * 1.6 * ((u - 0.45) / 0.55);
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
