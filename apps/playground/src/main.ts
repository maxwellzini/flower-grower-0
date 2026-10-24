import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  GENES,
  growPlant,
  mutate,
  sample,
  createRNG,
  type Genome,
  type Plant,
  type Species,
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
const tabContactSheet = document.getElementById('tab-contact-sheet')!;
const contactSheetOverlay = document.getElementById('contact-sheet-overlay')!;
const contactSheetGrid = document.getElementById('contact-sheet-grid')!;
const contactSheetHeading = document.getElementById('contact-sheet-heading')!;
const geneSlidersContainer = document.getElementById('gene-sliders-container')!;

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

function frameCamera(): void {
  if (!currentPlant) return;
  const tipY = currentPlant.stems[0]?.nodes.slice(-1)[0]?.pos[1] ?? 2.0;
  controls.target.set(0, tipY * 0.6, 0);
  camera.position.set(1.6, tipY * 0.85 + 0.9, 5.0);
  controls.update();
}

function loadPlant(refocus = false, preserveTime = true): void {
  if (currentHandle) {
    garden.remove(currentHandle);
  }

  currentPlant = growPlant({
    species: activeSpecies,
    seed: currentSeed,
    overrides: currentOverrides,
  });

  currentHandle = garden.add(currentPlant);
  updateTelemetry(currentPlant);

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
    if (p.dataset.species === spId || p.dataset.csSpecies === spId) {
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
  tabLab.classList.add('active');
  tabContactSheet.classList.remove('active');
  contactSheetOverlay.classList.remove('active');
}

function switchToContactSheet(): void {
  tabContactSheet.classList.add('active');
  tabLab.classList.remove('active');
  contactSheetOverlay.classList.add('active');
  renderContactSheet();
}

tabLab.addEventListener('click', switchToLab);
tabContactSheet.addEventListener('click', switchToContactSheet);

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
