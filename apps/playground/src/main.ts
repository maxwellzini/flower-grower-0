import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  GENES,
  growPlant,
  mutate,
  sample,
  createRNG,
  type Genome,
  type GrowthGuide,
  type Plant,
  type Species,
  type Vec3,
} from '@flower-grower/core';
import { Garden, type PlantHandle } from '@flower-grower/three';
import { daisy, SPECIES_REGISTRY } from '@flower-grower/species';

// DOM elements
const container = document.getElementById('canvas-container')!;
const scrubber = document.getElementById('scrubber') as HTMLInputElement;
const timeDisplay = document.getElementById('time-display')!;
const growthPill = document.getElementById('growth-pill')!;
const btnPlay = document.getElementById('btn-play')!;
const iconPlay = document.getElementById('icon-play')!;

const inputSeed = document.getElementById('input-seed') as HTMLInputElement;
const btnSeedDec = document.getElementById('btn-seed-dec')!;
const btnSeedInc = document.getElementById('btn-seed-inc')!;
const btnRandomizeSeed = document.getElementById('btn-randomize-seed')!;
const btnMutate = document.getElementById('btn-mutate')!;

const statSpecies = document.getElementById('stat-species')!;
const statPetals = document.getElementById('stat-petals')!;
const statDuration = document.getElementById('stat-duration')!;
const statOrgans = document.getElementById('stat-organs')!;
const statStems = document.getElementById('stat-stems')!;
const btnExportJson = document.getElementById('btn-export-json')!;

const tabLab = document.getElementById('tab-lab')!;
const tabTrellis = document.getElementById('tab-trellis')!;
const tabContactSheet = document.getElementById('tab-contact-sheet')!;
const contactSheetOverlay = document.getElementById('contact-sheet-overlay')!;
const contactSheetGrid = document.getElementById('contact-sheet-grid')!;
const contactSheetHeading = document.getElementById('contact-sheet-heading')!;
const geneSlidersContainer = document.getElementById('gene-sliders-container')!;

const controlPanel = document.getElementById('control-panel')!;
const trellisPanel = document.getElementById('trellis-panel')!;
const trellisDrawHint = document.getElementById('trellis-draw-hint');
const btnClearPath = document.getElementById('btn-clear-path');
const toggleTrellisMesh = document.getElementById('toggle-trellis-mesh') as HTMLInputElement | null;
const btnExportGuideJson = document.getElementById('btn-export-guide-json');
const btnCopyTrellisCode = document.getElementById('btn-copy-trellis-code');

// Trellis Presets & State
const TRELLIS_PRESETS: Record<string, Vec3[][]> = {
  arch: [
    [
      [-1.3, 0, 0],
      [-1.15, 1.4, 0],
      [-0.75, 2.5, 0],
      [0, 3.1, 0],
      [0.75, 2.5, 0],
      [1.15, 1.4, 0],
      [1.3, 0, 0],
    ],
  ],
  pole: [
    [
      [0, 0, 0],
      [0, 1.2, 0],
      [0, 2.4, 0],
      [0, 3.6, 0],
    ],
  ],
  zigzag: [
    [
      [-0.85, 0, 0],
      [0.85, 0.9, 0],
      [-0.85, 1.8, 0],
      [0.85, 2.7, 0],
      [0, 3.6, 0],
    ],
  ],
  spiral: [
    (() => {
      const pts: Vec3[] = [];
      const turns = 3.2;
      const steps = 40;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const theta = t * Math.PI * 2 * turns;
        const r = (1 - t * 0.55) * 0.8;
        pts.push([r * Math.cos(theta), t * 3.6, r * Math.sin(theta)]);
      }
      return pts;
    })(),
  ],
};

let activeGuide: GrowthGuide = { paths: TRELLIS_PRESETS['arch']! };
let isDrawMode = false;
let customPathPoints: Vec3[] = [
  [-0.6, 0, 0],
  [-0.2, 1.2, 0],
  [0.3, 2.2, 0],
  [0.6, 3.4, 0],
];

// 1. Setup Three.js scene & renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 2.2, 4.4);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 1.4, 0);
controls.maxPolarAngle = Math.PI / 2 + 0.1;
controls.minDistance = 0.5;
controls.maxDistance = 15;

// Subtle ground contact shadow
const shadowCanvas = document.createElement('canvas');
shadowCanvas.width = 128;
shadowCanvas.height = 128;
const sCtx = shadowCanvas.getContext('2d')!;
const grad = sCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
grad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.18)');
grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
sCtx.fillStyle = grad;
sCtx.fillRect(0, 0, 128, 128);

const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
const shadowGeo = new THREE.PlaneGeometry(1.6, 1.6);
const shadowMat = new THREE.MeshBasicMaterial({
  map: shadowTexture,
  transparent: true,
  depthWrite: false,
});
const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
shadowMesh.rotation.x = -Math.PI / 2;
shadowMesh.position.y = -0.01;

// 2. Initialize Garden (Clean / Minimal style by default)
const garden = new Garden({ renderer, style: 'minimal' });
garden.scene.add(shadowMesh);

// Lighting
const dirLight = new THREE.DirectionalLight(0xfff7ea, 1.25);
dirLight.position.set(3, 8, 4);
garden.scene.add(dirLight);

const ambientLight = new THREE.AmbientLight(0xd8e8f8, 0.7);
garden.scene.add(ambientLight);

// Application State
let activeSpecies: Species = daisy;
let currentSeed = 42;
let currentOverrides: Partial<Genome> = {};
let currentPlant: Plant | null = null;
let currentHandle: PlantHandle | null = null;
let currentTime = 0;
let isPlaying = true;
let playbackSpeed = 1.0;

function updateTelemetry(plant: Plant): void {
  statSpecies.textContent = activeSpecies.name;
  const petals = plant.organs.filter((o) => o.type === 'petal').length;
  statPetals.textContent = `${petals}`;
  statDuration.textContent = `${plant.duration.toFixed(2)}s`;
  statOrgans.textContent = `${plant.organs.length}`;
  statStems.textContent = `${plant.stems[0]?.nodes.length || 0}`;

  scrubber.max = plant.duration.toFixed(3);
}

const trellisMeshGroup = new THREE.Group();
garden.scene.add(trellisMeshGroup);

function updateTrellisMesh(): void {
  while (trellisMeshGroup.children.length > 0) {
    const child = trellisMeshGroup.children[0] as THREE.Mesh;
    trellisMeshGroup.remove(child);
    child.geometry?.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
      else child.material.dispose();
    }
  }

  const showMesh = isTrellisTab && (toggleTrellisMesh?.checked ?? true);
  if (!showMesh || !activeGuide?.paths) {
    trellisMeshGroup.visible = false;
    return;
  }

  trellisMeshGroup.visible = true;
  const trellisMat = new THREE.MeshStandardMaterial({
    color: 0x3d2c1e,
    roughness: 0.85,
    metalness: 0.05,
  });

  for (const path of activeGuide.paths) {
    if (path.length < 2) continue;
    const curvePoints = path.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeo = new THREE.TubeGeometry(curve, Math.max(20, path.length * 8), 0.026, 8, false);
    const tubeMesh = new THREE.Mesh(tubeGeo, trellisMat);
    trellisMeshGroup.add(tubeMesh);
  }
}

let isTrellisTab = false;

function frameCamera(): void {
  if (!currentPlant) return;
  if (isTrellisTab) {
    controls.target.set(0, 1.7, 0);
    camera.position.set(0.0, 1.8, 5.8);
  } else {
    const tipY = currentPlant.stems[0]?.nodes.slice(-1)[0]?.pos[1] ?? 2.0;
    controls.target.set(0, tipY * 0.6, 0);
    camera.position.set(1.6, tipY * 0.85 + 0.9, 5.0);
  }
  controls.update();
}

function loadPlant(refocus = false, preserveTime = true): void {
  if (currentHandle) {
    garden.remove(currentHandle);
  }

  const guide = isTrellisTab ? activeGuide : undefined;

  currentPlant = growPlant({
    species: activeSpecies,
    seed: currentSeed,
    overrides: currentOverrides,
    guide,
  });

  currentHandle = garden.add(currentPlant);
  updateTelemetry(currentPlant);
  updateTrellisMesh();

  if (preserveTime && currentPlant) {
    const targetTime =
      currentTime > 0 ? Math.min(currentTime, currentPlant.duration) : currentPlant.duration;
    setTime(targetTime);
  } else if (currentPlant) {
    setTime(0);
  }

  renderGeneSliders();

  if (refocus) {
    frameCamera();
  }
}

function setTime(time: number): void {
  if (!currentPlant) return;
  const duration = currentPlant.duration;
  currentTime = Math.max(0, Math.min(time, duration));

  garden.setTime(currentTime);
  scrubber.value = currentTime.toFixed(3);

  const pct = ((currentTime / duration) * 100).toFixed(1);
  growthPill.textContent = `${pct}% GROWN`;
  timeDisplay.textContent = `${currentTime.toFixed(2)}s / ${duration.toFixed(2)}s`;
}

function updatePlayButtonIcon(): void {
  if (isPlaying) {
    iconPlay.innerHTML = `
      <rect x="5" y="4" width="4" height="16" fill="currentColor"></rect>
      <rect x="15" y="4" width="4" height="16" fill="currentColor"></rect>
    `;
  } else {
    iconPlay.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"></polygon>`;
  }
}

// Scrubber events
scrubber.addEventListener('input', () => {
  isPlaying = false;
  updatePlayButtonIcon();
  setTime(parseFloat(scrubber.value));
});

function togglePlay(): void {
  isPlaying = !isPlaying;
  updatePlayButtonIcon();
  if (isPlaying && currentPlant && currentTime >= currentPlant.duration) {
    setTime(0);
  }
}

btnPlay.addEventListener('click', togglePlay);

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.key === ' ') {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    ) {
      return;
    }
    e.preventDefault();
    togglePlay();
  }
});

// Seed controls
function handleSeedChange(newSeed: number): void {
  currentSeed = Math.max(1, newSeed);
  inputSeed.value = currentSeed.toString();
  currentOverrides = {};
  loadPlant(false, true);
}

inputSeed.addEventListener('change', () => {
  handleSeedChange(parseInt(inputSeed.value, 10) || 42);
});

inputSeed.addEventListener('input', () => {
  const val = parseInt(inputSeed.value, 10);
  if (!Number.isNaN(val) && val > 0 && val !== currentSeed) {
    handleSeedChange(val);
  }
});

btnSeedDec.addEventListener('click', () => {
  handleSeedChange(currentSeed - 1);
});

btnSeedInc.addEventListener('click', () => {
  handleSeedChange(currentSeed + 1);
});

btnRandomizeSeed.addEventListener('click', () => {
  handleSeedChange(Math.floor(Math.random() * 99999) + 1);
});

btnMutate.addEventListener('click', () => {
  const rng = createRNG(currentSeed + 101);
  const baseGenome = sample(activeSpecies, rng);
  const merged: Genome = Object.assign({}, baseGenome, currentOverrides);
  currentOverrides = mutate(merged, 0.25, rng);
  loadPlant(false, true);
});

// Species selector
function selectSpecies(spId: string): void {
  const sp = SPECIES_REGISTRY[spId];
  if (!sp) return;
  activeSpecies = sp;
  currentOverrides = {};

  document.querySelectorAll('.species-pill').forEach((pill) => {
    const p = pill as HTMLElement;
    if (
      p.dataset.species === spId ||
      p.dataset.csSpecies === spId ||
      p.dataset.trellisSpecies === spId
    ) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  loadPlant(false, true);
  if (contactSheetOverlay.classList.contains('active')) {
    renderContactSheet();
  }
}

document.querySelectorAll('[data-species]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const sp = (e.currentTarget as HTMLElement).dataset.species;
    if (sp) selectSpecies(sp);
  });
});

document.querySelectorAll('[data-cs-species]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const sp = (e.currentTarget as HTMLElement).dataset.csSpecies;
    if (sp) selectSpecies(sp);
  });
});

document.querySelectorAll('[data-trellis-species]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const sp = (e.currentTarget as HTMLElement).dataset.trellisSpecies;
    if (sp) selectSpecies(sp);
  });
});

// Illustration Style Controls
const toggleInk = document.getElementById('toggle-ink') as HTMLInputElement | null;
const toggleWobble = document.getElementById('toggle-wobble') as HTMLInputElement | null;
const toggleVeins = document.getElementById('toggle-veins') as HTMLInputElement | null;

function syncStyle(): void {
  garden.setStyle({
    name: 'botanical',
    inkEdges: toggleInk?.checked ?? true,
    wobble: toggleWobble?.checked ? 1.0 : 0.0,
    veins: toggleVeins?.checked ?? true,
    paper: false,
  });
}

function updateStylePresetButtons(name: string): void {
  document.querySelectorAll('[data-style-preset]').forEach((btn) => {
    const el = btn as HTMLElement;
    if (el.dataset.stylePreset === name) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
}

[toggleInk, toggleWobble, toggleVeins].forEach((el) => {
  el?.addEventListener('change', () => {
    syncStyle();
    const isBotanical = (toggleInk?.checked ?? false) || (toggleVeins?.checked ?? false);
    updateStylePresetButtons(isBotanical ? 'botanical' : 'minimal');
  });
});

document.querySelectorAll('[data-style-preset]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const preset = (e.currentTarget as HTMLElement).dataset.stylePreset;
    if (preset === 'botanical') {
      if (toggleInk) toggleInk.checked = true;
      if (toggleWobble) toggleWobble.checked = true;
      if (toggleVeins) toggleVeins.checked = true;
      syncStyle();
      updateStylePresetButtons('botanical');
    } else if (preset === 'minimal') {
      if (toggleInk) toggleInk.checked = false;
      if (toggleWobble) toggleWobble.checked = false;
      if (toggleVeins) toggleVeins.checked = false;
      garden.setStyle('minimal');
      updateStylePresetButtons('minimal');
    }
  });
});

// Speed selector
document.querySelectorAll('.speed-pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.speed-pill').forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    playbackSpeed = parseFloat((pill as HTMLElement).dataset.speed || '1.0');
  });
});

// Dynamic Gene Sliders
function renderGeneSliders(): void {
  geneSlidersContainer.innerHTML = '';
  const keyGenes = [
    'petal.count',
    'petal.length',
    'petal.width',
    'petal.cupDepth',
    'petal.curlTip',
    'flower.whorlTilt',
    'stem.height',
    'flower.headScale',
    'leaf.count',
    'leaf.length',
  ] as const;

  for (const geneKey of keyGenes) {
    const def = GENES[geneKey];
    if (def.kind !== 'float' && def.kind !== 'int') continue;

    const row = document.createElement('div');
    row.className = 'gene-slider-row';

    const range = activeSpecies.ranges[geneKey];
    const lo = range && 'lo' in range ? range.lo : def.min;
    const hi = range && 'hi' in range ? range.hi : def.max;

    const isOverridden = currentOverrides[geneKey] !== undefined;
    const currentVal = isOverridden
      ? Number(currentOverrides[geneKey])
      : currentPlant?.genome && currentPlant.genome[geneKey] !== undefined
        ? Number(currentPlant.genome[geneKey])
        : (lo + hi) * 0.5;

    row.innerHTML = `
      <div class="gene-slider-label">
        <span class="gene-slider-name">${def.name} ${isOverridden ? '<span style="color: #fbbf24; font-size: 10px;">(manual)</span>' : ''}</span>
        <span id="val-${geneKey}" class="gene-slider-val" style="${isOverridden ? 'color: #fbbf24;' : ''}">
          ${def.kind === 'int' ? Math.round(currentVal) : currentVal.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        class="gene-slider"
        min="${def.min}"
        max="${def.max}"
        step="${def.kind === 'int' ? 1 : 0.01}"
        value="${currentVal}"
      />
    `;

    const slider = row.querySelector('input')!;
    const valDisplay = row.querySelector(`#val-${geneKey.replace('.', '\\.')}`)!;

    slider.addEventListener('input', () => {
      const v =
        def.kind === 'int' ? parseInt(slider.value, 10) : parseFloat(slider.value);
      valDisplay.textContent = def.kind === 'int' ? `${v}` : v.toFixed(2);
      currentOverrides[geneKey] = v;
      loadPlant(false, true);
    });

    geneSlidersContainer.appendChild(row);
  }
}

// 3D Isometric Thumbnail Generator for Contact Sheet
const thumbCanvas = document.createElement('canvas');
thumbCanvas.width = 240;
thumbCanvas.height = 200;
const thumbRenderer = new THREE.WebGLRenderer({
  canvas: thumbCanvas,
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true,
});
thumbRenderer.toneMapping = THREE.ACESFilmicToneMapping;
thumbRenderer.toneMappingExposure = 1.15;

const thumbAspect = 240 / 200;
const thumbCamera = new THREE.OrthographicCamera(-1.8 * thumbAspect, 1.8 * thumbAspect, 1.8, -1.8, 0.1, 50);

const thumbGarden = new Garden({ renderer: thumbRenderer });
const thumbDirLight = new THREE.DirectionalLight(0xfff7ea, 1.35);
thumbDirLight.position.set(5, 10, 6);
thumbGarden.scene.add(thumbDirLight);
const thumbAmbLight = new THREE.AmbientLight(0xd8e8f8, 0.75);
thumbGarden.scene.add(thumbAmbLight);

function createSeedThumbnail(plant: Plant): string {
  const mainStem = plant.stems[0];
  const tipNode = mainStem?.nodes[mainStem.nodes.length - 1];
  const headHeight = tipNode ? tipNode.pos[1] : 2.2;
  const totalHeight = headHeight + 0.6; // account for petals atop receptacle

  // True isometric projection: 30° elevation, 45° azimuth
  const frustumH = Math.max(3.0, totalHeight + 0.4);
  const halfH = frustumH * 0.5;
  const halfW = halfH * thumbAspect;

  thumbCamera.left = -halfW;
  thumbCamera.right = halfW;
  thumbCamera.top = halfH;
  thumbCamera.bottom = -halfH;
  thumbCamera.updateProjectionMatrix();

  const targetY = totalHeight * 0.48; // vertically centered in card
  const isoDist = 12;
  // Axonometric / isometric offset vector [1, 0.75, 1] normalized
  thumbCamera.position.set(isoDist * 0.65, targetY + isoDist * 0.55, isoDist * 0.65);
  thumbCamera.lookAt(0, targetY, 0);

  const h = thumbGarden.add(plant);
  h.setTime(plant.duration);
  thumbRenderer.render(thumbGarden.scene, thumbCamera);
  const dataUrl = thumbCanvas.toDataURL('image/jpeg', 0.85);
  thumbGarden.remove(h);
  return dataUrl;
}

// Contact Sheet (24 Seeds)
const FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

function renderContactSheet(): void {
  contactSheetHeading.textContent = `Breeder's Contact Sheet: ${activeSpecies.name} (24 Seeds)`;
  contactSheetGrid.innerHTML = '';

  for (let s = 1; s <= 24; s++) {
    const p = growPlant({ species: activeSpecies, seed: s });
    const petalCount = p.organs.filter((o) => o.type === 'petal').length;
    const leafCount = p.organs.filter((o) => o.type === 'leaf').length;
    const isFib = FIBONACCI.includes(petalCount);
    const thumbUrl = createSeedThumbnail(p);

    const card = document.createElement('div');
    card.className = 'seed-card';
    card.innerHTML = `
      <img class="seed-thumbnail" src="${thumbUrl}" alt="${activeSpecies.name} Seed #${s}" />
      <div class="seed-card-header">
        <span class="seed-badge">Seed #${s}</span>
        ${isFib ? '<span class="fibonacci-tag">Fibonacci 🌀</span>' : ''}
      </div>
      <div class="seed-details">
        <div>Petals: <strong>${petalCount}</strong> • Leaves: <strong>${leafCount}</strong></div>
        <div>Stem: <strong>${p.stems[0]?.nodes.length || 0} nodes</strong></div>
        <div>Grow Time: <strong>${p.duration.toFixed(2)}s</strong></div>
      </div>
      <button class="btn btn-primary" style="margin-top: 4px; font-size: 11px;">
        Open in Lab →
      </button>
    `;

    card.addEventListener('click', () => {
      currentSeed = s;
      inputSeed.value = s.toString();
      currentOverrides = {};
      switchToLab();
      loadPlant(true, true);
      setTime(p.duration);
    });

    contactSheetGrid.appendChild(card);
  }
}

function switchToLab(): void {
  isTrellisTab = false;
  tabLab.classList.add('active');
  tabTrellis.classList.remove('active');
  tabContactSheet.classList.remove('active');
  contactSheetOverlay.classList.remove('active');
  controlPanel.style.display = 'flex';
  trellisPanel.style.display = 'none';
  isDrawMode = false;
  if (trellisDrawHint) trellisDrawHint.style.display = 'none';
  loadPlant(true, true);
}

function switchToTrellis(): void {
  isTrellisTab = true;
  tabTrellis.classList.add('active');
  tabLab.classList.remove('active');
  tabContactSheet.classList.remove('active');
  contactSheetOverlay.classList.remove('active');
  controlPanel.style.display = 'none';
  trellisPanel.style.display = 'flex';

  controls.target.set(0, 1.7, 0);
  camera.position.set(0.0, 1.8, 5.8);
  controls.update();
  loadPlant(false, true);
}

function switchToContactSheet(): void {
  isTrellisTab = false;
  tabContactSheet.classList.add('active');
  tabLab.classList.remove('active');
  tabTrellis.classList.remove('active');
  contactSheetOverlay.classList.add('active');
  isDrawMode = false;
  renderContactSheet();
}

tabLab.addEventListener('click', switchToLab);
tabTrellis.addEventListener('click', switchToTrellis);
tabContactSheet.addEventListener('click', switchToContactSheet);

// Trellis Preset Controls
document.querySelectorAll('[data-trellis-preset]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('[data-trellis-preset]').forEach((b) => b.classList.remove('active'));
    const el = e.currentTarget as HTMLElement;
    el.classList.add('active');
    const preset = el.dataset.trellisPreset;

    if (preset === 'draw') {
      isDrawMode = true;
      if (trellisDrawHint) trellisDrawHint.style.display = 'block';
      activeGuide = { paths: [customPathPoints] };
    } else if (preset && TRELLIS_PRESETS[preset]) {
      isDrawMode = false;
      if (trellisDrawHint) trellisDrawHint.style.display = 'none';
      activeGuide = { paths: TRELLIS_PRESETS[preset]! };
    }
    loadPlant(false, true);
  });
});

// Interactive Click-to-Draw Trellis Path on Z=0 Plane
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const drawPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (!isDrawMode || e.button !== 0) return;

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersectPoint = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(drawPlane, intersectPoint)) {
    const pt: Vec3 = [
      Math.round(intersectPoint.x * 100) / 100,
      Math.max(0, Math.round(intersectPoint.y * 100) / 100),
      0,
    ];
    customPathPoints.push(pt);
    activeGuide = { paths: [customPathPoints] };
    loadPlant(false, true);
  }
});

btnClearPath?.addEventListener('click', () => {
  customPathPoints = [
    [0, 0, 0],
    [0, 0.6, 0],
  ];
  activeGuide = { paths: [customPathPoints] };
  loadPlant(false, true);
});

// Trellis Sliders
const sliderHelixRadius = document.getElementById(
  'slider-trellis-helixRadius',
) as HTMLInputElement | null;
const valHelixRadius = document.getElementById('val-trellis-helixRadius');
sliderHelixRadius?.addEventListener('input', () => {
  const v = parseFloat(sliderHelixRadius.value);
  if (valHelixRadius) valHelixRadius.textContent = v.toFixed(2);
  currentOverrides['vine.helixRadius'] = v;
  loadPlant(false, true);
});

const sliderHelixPitch = document.getElementById(
  'slider-trellis-helixPitch',
) as HTMLInputElement | null;
const valHelixPitch = document.getElementById('val-trellis-helixPitch');
sliderHelixPitch?.addEventListener('input', () => {
  const v = parseFloat(sliderHelixPitch.value);
  if (valHelixPitch) valHelixPitch.textContent = v.toFixed(2);
  currentOverrides['vine.helixPitch'] = v;
  loadPlant(false, true);
});

const sliderFlowerDensity = document.getElementById(
  'slider-trellis-flowerDensity',
) as HTMLInputElement | null;
const valFlowerDensity = document.getElementById('val-trellis-flowerDensity');
sliderFlowerDensity?.addEventListener('input', () => {
  const v = parseFloat(sliderFlowerDensity.value);
  if (valFlowerDensity) valFlowerDensity.textContent = v.toFixed(2);
  currentOverrides['vine.flowerDensity'] = v;
  loadPlant(false, true);
});

const sliderPBranch = document.getElementById(
  'slider-trellis-pBranch',
) as HTMLInputElement | null;
const valPBranch = document.getElementById('val-trellis-pBranch');
sliderPBranch?.addEventListener('input', () => {
  const v = parseFloat(sliderPBranch.value);
  if (valPBranch) valPBranch.textContent = v.toFixed(2);
  currentOverrides['vine.pBranch'] = v;
  loadPlant(false, true);
});

toggleTrellisMesh?.addEventListener('change', () => {
  updateTrellisMesh();
});

// Export Trellis Guide JSON
btnExportGuideJson?.addEventListener('click', () => {
  const json = JSON.stringify(activeGuide, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trellis-guide-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// Copy Code Snippet
btnCopyTrellisCode?.addEventListener('click', () => {
  const code = `import { growPlant } from '@flower-grower/core';
import { morningGlory } from '@flower-grower/species';

const plant = growPlant({
  species: morningGlory,
  seed: ${currentSeed},
  guide: ${JSON.stringify(activeGuide, null, 2)},
});
`;
  navigator.clipboard.writeText(code).then(() => {
    const originalText = btnCopyTrellisCode.textContent;
    btnCopyTrellisCode.textContent = '✅ Copied!';
    setTimeout(() => {
      btnCopyTrellisCode.textContent = originalText;
    }, 1500);
  });
});

// Export JSON
btnExportJson.addEventListener('click', () => {
  if (!currentPlant) return;
  const json = JSON.stringify(currentPlant, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${activeSpecies.id}-seed-${currentSeed}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// Responsive resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initial load
loadPlant(true);
updatePlayButtonIcon();

// Render Loop
let lastTime = performance.now();
function animate(): void {
  requestAnimationFrame(animate);

  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  if (isPlaying && currentPlant) {
    let nextTime = currentTime + dt * playbackSpeed;
    if (nextTime > currentPlant.duration) {
      nextTime = 0;
    }
    setTime(nextTime);
  }

  controls.update();
  garden.render(camera);
}

animate();
