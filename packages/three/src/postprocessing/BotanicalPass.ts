import * as THREE from 'three';
import type { StyleOptions } from '../styles/types.js';

export class BotanicalPass {
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.OrthographicCamera;
  private readonly quadMesh: THREE.Mesh;
  private readonly material: THREE.ShaderMaterial;
  private renderTarget: THREE.WebGLRenderTarget | null = null;
  private width = 0;
  private height = 0;
  private readonly uniforms = {
    tColor: { value: null as THREE.Texture | null },
    tNormal: { value: null as THREE.Texture | null },
    tDepth: { value: null as THREE.DepthTexture | null },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uInkColor: { value: new THREE.Vector3(0.14, 0.11, 0.09) },
    uLineWidth: { value: 1.2 },
    uWobble: { value: 1.0 },
    uInkEdges: { value: 1.0 },
    uPaper: { value: 0.0 },
    uPaperColor: { value: new THREE.Vector3(0.965, 0.945, 0.915) },
    uCameraNear: { value: 0.1 },
    uCameraFar: { value: 100.0 },
    uIsOrtho: { value: 0.0 },
  };

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D tColor;
        uniform sampler2D tNormal;
        uniform sampler2D tDepth;
        uniform vec2 uResolution;
        uniform vec3 uInkColor;
        uniform float uLineWidth;
        uniform float uWobble;
        uniform float uInkEdges;
        uniform float uPaper;
        uniform vec3 uPaperColor;
        uniform float uCameraNear;
        uniform float uCameraFar;
        uniform float uIsOrtho;

        varying vec2 vUv;

        float readDepth(vec2 coord) {
          float d = texture2D(tDepth, coord).r;
          if (uIsOrtho > 0.5) {
            return uCameraNear + d * (uCameraFar - uCameraNear);
          }
          float z_ndc = 2.0 * d - 1.0;
          return (2.0 * uCameraNear * uCameraFar) / max(0.0001, (uCameraFar + uCameraNear - z_ndc * (uCameraFar - uCameraNear)));
        }

        void main() {
          vec2 texel = uLineWidth / max(vec2(1.0), uResolution);

          // Hand-drawn line wobble
          vec2 wobbleOffset = vec2(
            sin(vUv.y * 70.0 + vUv.x * 45.0),
            cos(vUv.x * 65.0 + vUv.y * 50.0)
          ) * (texel * 0.45 * uWobble);

          vec2 uv = vUv + wobbleOffset;

          vec4 cCenter = texture2D(tColor, uv);

          float edge = 0.0;
          if (uInkEdges > 0.5) {
            vec2 d0 = uv + vec2(-texel.x, -texel.y);
            vec2 d1 = uv + vec2( texel.x, -texel.y);
            vec2 d2 = uv + vec2(-texel.x,  texel.y);
            vec2 d3 = uv + vec2( texel.x,  texel.y);

            float z0 = readDepth(d0);
            float z1 = readDepth(d1);
            float z2 = readDepth(d2);
            float z3 = readDepth(d3);
            float zC = readDepth(uv);

            vec3 n0 = texture2D(tNormal, d0).xyz * 2.0 - 1.0;
            vec3 n1 = texture2D(tNormal, d1).xyz * 2.0 - 1.0;
            vec3 n2 = texture2D(tNormal, d2).xyz * 2.0 - 1.0;
            vec3 n3 = texture2D(tNormal, d3).xyz * 2.0 - 1.0;

            // Depth gradient (discontinuities between overlapping petals)
            float depthGradX = abs(z1 - z2);
            float depthGradY = abs(z3 - z0);
            float depthGrad = (depthGradX + depthGradY) / max(0.001, zC);
            float depthEdge = smoothstep(0.035, 0.08, depthGrad);

            // Normal gradient (creases and folds)
            float normDiff1 = 1.0 - max(0.0, dot(n0, n3));
            float normDiff2 = 1.0 - max(0.0, dot(n1, n2));
            float normEdge = smoothstep(0.18, 0.45, max(normDiff1, normDiff2));

            // Silhouette alpha edge
            float a0 = texture2D(tColor, d0).a;
            float a1 = texture2D(tColor, d1).a;
            float a2 = texture2D(tColor, d2).a;
            float a3 = texture2D(tColor, d3).a;
            float aMin = min(min(a0, a1), min(a2, a3));
            float aMax = max(max(a0, a1), max(a2, a3));
            float alphaEdge = (aMax - aMin) > 0.3 ? 1.0 : 0.0;

            edge = clamp(depthEdge + normEdge + alphaEdge, 0.0, 1.0);
          }

          vec3 inkedColor = mix(cCenter.rgb, uInkColor, edge * 0.92);
          float outAlpha = max(cCenter.a, edge);

          if (uPaper > 0.5) {
            // Antique botanical paper texture
            float grain = (fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.03;
            vec2 vigCoord = vUv * 2.0 - 1.0;
            float vig = 1.0 - dot(vigCoord, vigCoord) * 0.08;
            vec3 paper = (uPaperColor + vec3(grain)) * vig;
            vec3 finalRgb = mix(paper, inkedColor, outAlpha);
            gl_FragColor = vec4(finalRgb, 1.0);
          } else {
            gl_FragColor = vec4(inkedColor, outAlpha);
          }
        }
      `,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });

    this.quadMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.quadMesh.frustumCulled = false;
    this.scene.add(this.quadMesh);
  }

  private ensureRenderTarget(width: number, height: number): THREE.WebGLRenderTarget {
    if (this.renderTarget && this.width === width && this.height === height) {
      return this.renderTarget;
    }

    if (this.renderTarget) {
      this.renderTarget.dispose();
    }

    this.width = width;
    this.height = height;

    this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
      count: 2,
      depthTexture: new THREE.DepthTexture(width, height),
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
    });

    return this.renderTarget;
  }

  render(
    renderer: THREE.WebGLRenderer,
    mainScene: THREE.Scene,
    camera: THREE.Camera,
    style: StyleOptions,
  ): void {
    const size = renderer.getSize(new THREE.Vector2());
    const pixelRatio = renderer.getPixelRatio();
    const w = Math.floor(size.x * pixelRatio);
    const h = Math.floor(size.y * pixelRatio);

    const rt = this.ensureRenderTarget(w, h);

    // 1. Render main scene to MRT target (Color in 0, View Normal in 1)
    const oldTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(rt);
    renderer.clear();
    renderer.render(mainScene, camera);

    // 2. Configure post-processing uniforms
    this.uniforms.tColor.value = rt.textures[0] ?? null;
    this.uniforms.tNormal.value = rt.textures[1] ?? null;
    this.uniforms.tDepth.value = rt.depthTexture;
    this.uniforms.uResolution.value.set(w, h);
    this.uniforms.uLineWidth.value = style.lineWidth ?? 1.2;
    this.uniforms.uWobble.value = style.wobble ?? 1.0;
    this.uniforms.uInkEdges.value = style.inkEdges !== false ? 1.0 : 0.0;
    this.uniforms.uPaper.value = style.paper ? 1.0 : 0.0;

    if (style.inkColor) {
      this.uniforms.uInkColor.value.fromArray(style.inkColor);
    }
    if (style.paperColor) {
      this.uniforms.uPaperColor.value.fromArray(style.paperColor);
    }

    if (camera instanceof THREE.PerspectiveCamera) {
      this.uniforms.uCameraNear.value = camera.near;
      this.uniforms.uCameraFar.value = camera.far;
      this.uniforms.uIsOrtho.value = 0.0;
    } else if (camera instanceof THREE.OrthographicCamera) {
      this.uniforms.uCameraNear.value = camera.near;
      this.uniforms.uCameraFar.value = camera.far;
      this.uniforms.uIsOrtho.value = 1.0;
    }

    // 3. Render full-screen post-processing quad to screen (or original target)
    renderer.setRenderTarget(oldTarget);
    renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    if (this.renderTarget) {
      this.renderTarget.dispose();
      this.renderTarget = null;
    }
    this.material.dispose();
    this.quadMesh.geometry.dispose();
  }
}
