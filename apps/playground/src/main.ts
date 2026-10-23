import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { growDaisy } from '@flower-grower/core';
import type { Plant } from '@flower-grower/core';
import { Garden, type PlantHandle } from '@flower-grower/three';

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

const inputPetals = document.getElementById('input-petals') as HTMLInputElement;
const btnPetalsDec = document.getElementById('btn-petals-dec')!;
const btnPetalsInc = document.getElementById('btn-petals-inc')!;

const statDuration = document.getElementById('stat-duration')!;
const statOrgans = document.getElementById('stat-organs')!;
const statStems = document.getElementById('stat-stems')!;
const btnExportJson = document.getElementById('btn-export-json')!;

// 1. Setup Three.js scene & renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 2.2, 4.2);

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
const dirLight = new THREE.DirectionalLight(0xfff7ea, 1.2);
dirLight.position.set(3, 8, 4);
garden.scene.add(dirLight);

const ambientLight = new THREE.AmbientLight(0xd8e8f8, 0.7);
garden.scene.add(ambientLight);

// State
let currentSeed = 42;
let currentPetalCount = 21;
let currentPlant: Plant | null = null;
let currentHandle: PlantHandle | null = null;
let currentTime = 0;
let isPlaying = true;
let playbackSpeed = 1.0;

function updateTelemetry(plant: Plant): void {
  statDuration.textContent = `${plant.duration.toFixed(2)}s`;
  statOrgans.textContent = `${plant.organs.length}`;
  statStems.textContent = `${plant.stems.length} (${plant.stems[0]?.nodes.length || 0} nodes)`;

  scrubber.max = plant.duration.toFixed(3);
}

function loadPlant(): void {
  if (currentHandle) {
    garden.remove(currentHandle);
  }

  currentPlant = growDaisy({
    seed: currentSeed,
    petalCount: currentPetalCount,
  });

  currentHandle = garden.add(currentPlant);
  updateTelemetry(currentPlant);
  setTime(currentTime);
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
  loadPlant();
});

btnSeedDec.addEventListener('click', () => {
  currentSeed = Math.max(1, currentSeed - 1);
  inputSeed.value = currentSeed.toString();
  loadPlant();
});

btnSeedInc.addEventListener('click', () => {
  currentSeed += 1;
  inputSeed.value = currentSeed.toString();
  loadPlant();
});

btnRandomizeSeed.addEventListener('click', () => {
  currentSeed = Math.floor(Math.random() * 99999) + 1;
  inputSeed.value = currentSeed.toString();
  loadPlant();
});

// Petal controls
inputPetals.addEventListener('change', () => {
  currentPetalCount = Math.max(5, parseInt(inputPetals.value, 10) || 21);
  loadPlant();
});

btnPetalsDec.addEventListener('click', () => {
  currentPetalCount = Math.max(5, currentPetalCount - 1);
  inputPetals.value = currentPetalCount.toString();
  loadPlant();
});

btnPetalsInc.addEventListener('click', () => {
  currentPetalCount += 1;
  inputPetals.value = currentPetalCount.toString();
  loadPlant();
});

// Speed selector
document.querySelectorAll('.speed-pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.speed-pill').forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    playbackSpeed = parseFloat((pill as HTMLElement).dataset.speed || '1.0');
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
  a.download = `daisy-seed-${currentSeed}.json`;
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
      // Loop with smooth pause at end
      nextTime = 0;
    }
    setTime(nextTime);
  }

  controls.update();
  garden.render(camera);
}

animate();
