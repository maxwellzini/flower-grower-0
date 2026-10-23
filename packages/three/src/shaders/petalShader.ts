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
      attribute float iCupDepth;
      attribute float iCurlTip;
      attribute float iTilt;
      attribute float iMidribBend;
      attribute float iReflex;

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
        // Petals start as an upright central bud and unfurl downwards and outwards
        float openProgress = clamp((uTime - (iBirth + iGrow * 0.2)) / max(0.001, iOpenDur), 0.0, 1.0);
        float openness = mix(iOpen0, 0.0, smoothstep(0.0, 1.0, openProgress));

        // Base grid: u runs 0..1 along length (base to tip), v runs -1..1 across width
        float u = position.z;
        float v = position.x;
        float w = position.y; // base width profile

        float x = v * w * 0.5;
        float y = 0.0;
        float z = u;

        // 1. Curving around the center of the flower (transverse / lateral curvature)
        // A. Lateral cup along normal (Y)
        y += iCupDepth * (1.0 - v * v) * sin(u * 3.14159265);

        // B. Azimuthal curve around floral cylinder (bending edges inward toward center)
        z -= 0.35 * (v * v) * (w * w) * (0.4 + iCupDepth);

        // 2. Longitudinal curvature from base (bottom) to tip (top), varying by plant type
        // Belly bow (midrib arc)
        float midribArc = sin(u * 3.14159265);
        y += iMidribBend * midribArc * 0.35;

        // Plant type curvature characteristics:
        // A. Inward-curving goblet cup (Tulip: iMidribBend > 0.1, tip curves inward toward floral center)
        if (iMidribBend > 0.1 && u > 0.45) {
          float inT = (u - 0.45) / 0.55;
          y += iMidribBend * 0.5 * inT * inT;
          z -= iMidribBend * 0.18 * inT;
        }

        // B. Outward reflexed lip (Rose: iReflex > 0.05, outer petals curl back and downward)
        if (iReflex > 0.05 && u > 0.55) {
          float refT = (u - 0.55) / 0.45;
          float reflexAngle = iReflex * refT * refT * 2.2;
          y -= sin(reflexAngle) * 0.35 * refT;
          z -= (1.0 - cos(reflexAngle)) * 0.25 * refT;
        }

        // C. Subtle tip droop (Daisy: iCurlTip > 0.01)
        if (iCurlTip > 0.01 && iReflex <= 0.05 && u > 0.65) {
          float curlT = (u - 0.65) / 0.35;
          float curlAngle = iCurlTip * curlT * curlT * 1.5;
          y -= sin(curlAngle) * 0.2 * curlT;
          z -= (1.0 - cos(curlAngle)) * 0.15 * curlT;
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
          y += 0.25 * openness * (1.0 - v * v) * u;
          z -= 0.08 * openness * u * u;
        }

        // Exact rotation around circumferential hinge axis (iBinormal)
        float rotZ = z * cosBeta - y * sinBeta;
        float rotY = z * sinBeta + y * cosBeta;
        float rotX = x;

        vec3 worldPos = iOrigin + (iBinormal * rotX + iNormal * rotY + iTangent * rotZ) * sizeScale;

        // Normal computation taking into account lateral cup, longitudinal slope, and bud rotation
        float slopeX = -v * iCupDepth * 2.0;
        float slopeZ = 0.0;
        if (iMidribBend > 0.1 && u > 0.45) {
          slopeZ += iMidribBend * 0.8 * ((u - 0.45) / 0.55);
        } else if (iReflex > 0.05 && u > 0.55) {
          slopeZ -= iReflex * 1.4 * ((u - 0.55) / 0.45);
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
