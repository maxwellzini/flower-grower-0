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

// 2. Initialize Garden
const garden = new Garden({ renderer });
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

function loadPlant(): void {
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
  setTime(currentTime);
  renderGeneSliders();
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

btnPlay.addEventListener('click', () => {
  isPlaying = !isPlaying;
  updatePlayButtonIcon();
  if (isPlaying && currentPlant && currentTime >= currentPlant.duration) {
    setTime(0);
  }
});

// Seed controls
inputSeed.addEventListener('change', () => {
  currentSeed = parseInt(inputSeed.value, 10) || 42;
  currentOverrides = {};
  loadPlant();
});

btnSeedDec.addEventListener('click', () => {
  currentSeed = Math.max(1, currentSeed - 1);
  inputSeed.value = currentSeed.toString();
  currentOverrides = {};
  loadPlant();
});

btnSeedInc.addEventListener('click', () => {
  currentSeed += 1;
  inputSeed.value = currentSeed.toString();
  currentOverrides = {};
  loadPlant();
});

btnRandomizeSeed.addEventListener('click', () => {
  currentSeed = Math.floor(Math.random() * 99999) + 1;
  inputSeed.value = currentSeed.toString();
  currentOverrides = {};
  loadPlant();
});

btnMutate.addEventListener('click', () => {
  const rng = createRNG(currentSeed + 101);
  const baseGenome = sample(activeSpecies, rng);
  const merged: Genome = Object.assign({}, baseGenome, currentOverrides);
  currentOverrides = mutate(merged, 0.25, rng);
  loadPlant();
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

  loadPlant();
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
    'stem.height',
    'flower.headScale',
  ] as const;

  for (const geneKey of keyGenes) {
    const def = GENES[geneKey];
    if (def.kind !== 'float' && def.kind !== 'int') continue;

    const row = document.createElement('div');
    row.className = 'gene-slider-row';

    const range = activeSpecies.ranges[geneKey];
    const lo = range && 'lo' in range ? range.lo : def.min;
    const hi = range && 'hi' in range ? range.hi : def.max;
    const currentVal =
      currentOverrides[geneKey] !== undefined
        ? Number(currentOverrides[geneKey])
        : (lo + hi) * 0.5;

    row.innerHTML = `
      <div class="gene-slider-label">
        <span class="gene-slider-name">${def.name}</span>
        <span id="val-${geneKey}" class="gene-slider-val">${def.kind === 'int' ? Math.round(currentVal) : currentVal.toFixed(2)}</span>
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
      loadPlant();
    });

    geneSlidersContainer.appendChild(row);
  }
}

// 3D Thumbnail Generator for Contact Sheet
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

const thumbCamera = new THREE.PerspectiveCamera(42, 240 / 200, 0.1, 50);

const thumbGarden = new Garden({ renderer: thumbRenderer });
const thumbDirLight = new THREE.DirectionalLight(0xfff7ea, 1.35);
thumbDirLight.position.set(2, 6, 3);
thumbGarden.scene.add(thumbDirLight);
const thumbAmbLight = new THREE.AmbientLight(0xd8e8f8, 0.7);
thumbGarden.scene.add(thumbAmbLight);

function createSeedThumbnail(plant: Plant): string {
  const mainStem = plant.stems[0];
  const tipNode = mainStem?.nodes[mainStem.nodes.length - 1];
  const headHeight = tipNode ? tipNode.pos[1] : 2.2;

  // Higher angle camera elevated above flower head, looking downward to capture full head & petals
  thumbCamera.position.set(0, headHeight + 1.3, 2.6);
  thumbCamera.lookAt(0, headHeight - 0.15, 0);

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
        <div>Petals: <strong>${petalCount}</strong></div>
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
      loadPlant();
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
loadPlant();
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
