// ============================================================
// Back Nine Demo — Three.js Placeholder 3D Scene
// ============================================================
// INTEGRATION POINT: To swap in the real venue GLB model:
//   1. Import GLTFLoader (already imported below)
//   2. Set REAL_MODEL_PATH to your .glb file path
//   3. Set USE_REAL_MODEL = true
//   The camera path / scroll-stop logic is fully independent
//   of the model — nothing else needs to change.
// ============================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ── INTEGRATION POINT ────────────────────────────────────────
const USE_REAL_MODEL  = false;          // ← flip to true after dropping in your GLB
const REAL_MODEL_PATH = './assets/venue.glb'; // ← path to your GLB model
// ─────────────────────────────────────────────────────────────

// ── Camera path: 6 stops matching the 6 scroll sections ──────
const CAMERA_STOPS = [
  // 0: Welcome — bird's eye, whole venue
  {
    pos:    new THREE.Vector3(0, 26, 32),
    target: new THREE.Vector3(0, 0, 0),
  },
  // 1: Reception/Bar — close, warm angle
  {
    pos:    new THREE.Vector3(-14, 5, 14),
    target: new THREE.Vector3(-12, 2, 0),
  },
  // 2: Bay 1 — facing the simulator screen
  {
    pos:    new THREE.Vector3(-5, 3.5, 9),
    target: new THREE.Vector3(-5, 2.5, -8),
  },
  // 3: Bays 2&3 — lateral sweep
  {
    pos:    new THREE.Vector3(4, 3.5, 9),
    target: new THREE.Vector3(4, 2.5, -8),
  },
  // 4: Private Room — large screen fills frame
  {
    pos:    new THREE.Vector3(14, 4, 11),
    target: new THREE.Vector3(14, 3, -6),
  },
  // 5: Find Us — high angle map view, entrance visible
  {
    pos:    new THREE.Vector3(0, 34, 8),
    target: new THREE.Vector3(0, 0, -4),
  },
];

// ── Scene setup ───────────────────────────────────────────────
const canvas  = document.getElementById('three-canvas');
if (!canvas) throw new Error('No #three-canvas element found');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.toneMapping       = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace  = THREE.SRGBColorSpace;

const scene  = new THREE.Scene();
scene.background = new THREE.Color(0x060a08);
scene.fog = new THREE.FogExp2(0x060a08, 0.011);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 300);
camera.position.copy(CAMERA_STOPS[0].pos);

// ── Smooth camera state ───────────────────────────────────────
const camTarget = new THREE.Vector3().copy(CAMERA_STOPS[0].target);
const camTargetGoal  = new THREE.Vector3().copy(CAMERA_STOPS[0].target);
const camPosGoal     = new THREE.Vector3().copy(CAMERA_STOPS[0].pos);
const LERP_FACTOR    = 0.055;

// ── Placeholder geometry — venue floor plan ───────────────────
function buildVenuePlaceholder() {
  const mat = {
    floor: new THREE.MeshStandardMaterial({ color: 0x2c3a2a, roughness: 0.9, metalness: 0 }),
    wall:  new THREE.MeshStandardMaterial({ color: 0x34403a, roughness: 0.85, metalness: 0.05 }),
    desk:  new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.7, metalness: 0.05 }),
    screen:new THREE.MeshStandardMaterial({ color: 0x0a1a12, roughness: 0.1, metalness: 0, emissive: new THREE.Color(0x0a3020), emissiveIntensity: 0.6 }),
    screen_big: new THREE.MeshStandardMaterial({ color: 0x061210, roughness: 0.05, metalness: 0, emissive: new THREE.Color(0x0a4028), emissiveIntensity: 0.9 }),
    tee:   new THREE.MeshStandardMaterial({ color: 0x2e4828, roughness: 0.6, metalness: 0 }),
    trim:  new THREE.MeshStandardMaterial({ color: 0x489142, roughness: 0.4, metalness: 0.2, emissive: new THREE.Color(0x1a5010), emissiveIntensity: 0.3 }),
    black: new THREE.MeshStandardMaterial({ color: 0x090d0b, roughness: 0.8 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x3a5a48, roughness: 0.1, metalness: 0.5, transparent: true, opacity: 0.35 }),
  };

  function box(w, h, d, m, x, y, z, rx=0, ry=0, rz=0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  // Floor
  box(60, 0.2, 36, mat.floor, 0, -0.1, 0);

  // No ceiling or front wall: a cutaway so the overhead camera can see in.

  // Perimeter walls — simplified
  box(60, 7.5, 0.2, mat.wall, 0, 3.6, -18);   // back wall
  box(0.2, 7.5, 36, mat.wall, -30, 3.6, 0);   // left wall
  box(0.2, 7.5, 36, mat.wall,  30, 3.6, 0);   // right wall

  // Reception desk (left zone)
  box(8, 1.1, 2, mat.desk, -14, 0.55, 4);
  box(8, 0.08, 2.4, mat.trim, -14, 1.1, 4);   // desk trim
  // Bar backboard
  box(0.15, 5, 6, mat.wall, -28.5, 2.5, 2);
  // Bar shelves
  [-1, 0.5, 2].forEach((y, i) => box(4, 0.08, 0.35, mat.trim, -27.5, y + 3, 2));

  // Simulator bays — 3 bays
  [[-5, 0], [0, 0], [5, 0]].forEach(([xOff], i) => {
    const bx = -5 + i * 10;
    // Bay floor mat (tee box)
    box(7.8, 0.05, 5, mat.tee, bx, 0.05, 6);
    // Back screen wall
    box(7.5, 5.5, 0.2, mat.screen, bx, 2.75, -10);
    // Screen glow trim
    box(7.6, 5.6, 0.06, mat.trim, bx, 2.75, -9.85);
    // Side dividers
    box(0.15, 5.5, 12, mat.wall, bx - 4, 2.75, -4);
    box(0.15, 5.5, 12, mat.wall, bx + 4, 2.75, -4);
    // Ball dispenser / tee peg
    box(0.3, 0.7, 0.3, mat.trim, bx, 0.35, 4);
  });

  // Private room (right side, larger)
  const prX = 20;
  box(0.15, 7, 18, mat.wall, prX - 5, 3.5, -1);  // partition
  box(9.5, 5.5, 0.2, mat.screen_big, prX, 2.75, -10); // big 4m screen
  box(9.6, 5.6, 0.06, mat.trim, prX, 2.75, -9.85);
  box(9, 0.05, 6, mat.tee, prX, 0.05, 4);        // tee area
  // Seating suggestion
  box(7, 0.5, 2, mat.desk, prX, 0.25, 8);
  box(7, 1.2, 0.4, mat.black, prX, 0.85, 9);

  // Entrance / lobby area
  box(6, 0.15, 0.15, mat.trim, -20, 0, -16); // welcome mat outline
  box(3, 2.5, 0.15, mat.glass, -20, 1.25, 17.5); // glass door suggestion

  // Ceiling trim strips (green accent)
  for (let i = -2; i <= 2; i++) {
    box(0.06, 0.06, 36, mat.trim, i * 10, 7.0, 0);
  }

  return mat;
}

// ── Lighting ──────────────────────────────────────────────────
function buildLighting() {
  // Ambient
  const ambient = new THREE.AmbientLight(0x334433, 0.8);
  scene.add(ambient);

  // Hemisphere (sky / ground)
  const hemi = new THREE.HemisphereLight(0x8fa88f, 0x1a201a, 1.1);
  scene.add(hemi);

  // Directional key light
  const dir = new THREE.DirectionalLight(0xffffff, 1.4);
  dir.position.set(10, 20, 10);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.far = 80;
  dir.shadow.camera.left = dir.shadow.camera.bottom = -30;
  dir.shadow.camera.right = dir.shadow.camera.top = 30;
  scene.add(dir);

  // Green accent — simulator screens
  [-5, 5, 15].forEach(x => {
    const pt = new THREE.PointLight(0x489142, 1.8, 20);
    pt.position.set(x, 3, -8);
    scene.add(pt);
  });

  // Big screen — private room
  const bigScreen = new THREE.PointLight(0x2a9a60, 2.5, 22);
  bigScreen.position.set(20, 3, -8);
  scene.add(bigScreen);

  // Warm reception light
  const recep = new THREE.PointLight(0xe8a040, 1.2, 16);
  recep.position.set(-14, 4, 2);
  scene.add(recep);

  // Ceiling strips
  for (let i = -2; i <= 2; i++) {
    const strip = new THREE.PointLight(0x3a6a34, 0.7, 12);
    strip.position.set(i * 10, 6.5, 0);
    scene.add(strip);
  }

  // Subtle orange accent in bar
  const bar = new THREE.PointLight(0xe0583c, 0.8, 10);
  bar.position.set(-26, 4, 2);
  scene.add(bar);
}

// ── Particle dust ─────────────────────────────────────────────
function buildParticles() {
  const count = 600;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i*3]   = (Math.random() - 0.5) * 56;
    pos[i*3+1] = Math.random() * 6.5;
    pos[i*3+2] = (Math.random() - 0.5) * 34;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0x4a8042, size: 0.06, transparent: true, opacity: 0.55 });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  return pts;
}

// ── Real model loader (activated when USE_REAL_MODEL = true) ──
function loadRealModel() {
  const loader = new GLTFLoader();
  loader.load(
    REAL_MODEL_PATH,
    gltf => {
      const model = gltf.scene;
      // Centre the model
      const box = new THREE.Box3().setFromObject(model);
      const centre = box.getCenter(new THREE.Vector3());
      model.position.sub(centre);
      model.traverse(child => {
        if (child.isMesh) {
          child.castShadow    = true;
          child.receiveShadow = true;
        }
      });
      scene.add(model);
      console.log('Back Nine: Real GLB model loaded.', gltf);
    },
    xhr => console.log('Model loading:', Math.round(xhr.loaded / xhr.total * 100) + '%'),
    err => console.error('Model load error:', err)
  );
}

// ── Scroll → camera progress ─────────────────────────────────
function getScrollProgress() {
  const total = Math.max(1, document.body.scrollHeight - window.innerHeight);
  return Math.min(1, Math.max(0, window.scrollY / total));
}

function getCameraGoal(progress) {
  const t   = progress * (CAMERA_STOPS.length - 1);
  const i   = Math.min(Math.floor(t), CAMERA_STOPS.length - 2);
  const a   = t - i;
  const cur = CAMERA_STOPS[i];
  const nxt = CAMERA_STOPS[i + 1];
  // Smooth step for more cinematic feel
  const s = a * a * (3 - 2 * a);
  return {
    pos:    cur.pos.clone().lerp(nxt.pos,    s),
    target: cur.target.clone().lerp(nxt.target, s),
    stop:   i,
    alpha:  a,
  };
}

// ── Resize handler ────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── Main init + render loop ───────────────────────────────────
let particles;

function init() {
  if (USE_REAL_MODEL) {
    loadRealModel();
  } else {
    buildVenuePlaceholder();
  }
  buildLighting();
  particles = buildParticles();
}

let animFrame;
function animate(time) {
  animFrame = requestAnimationFrame(animate);

  const progress = getScrollProgress();
  const goal = getCameraGoal(progress);

  // Lerp camera toward goal
  camPosGoal.copy(goal.pos);
  camTargetGoal.copy(goal.target);

  camera.position.lerp(camPosGoal, LERP_FACTOR);
  camTarget.lerp(camTargetGoal,    LERP_FACTOR);
  camera.lookAt(camTarget);

  // Gentle particle drift
  if (particles) {
    particles.rotation.y = time * 0.00008;
  }

  renderer.render(scene, camera);
}

// Only run on non-mobile (detect inline rather than waiting for nav.js)
const _isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ||
                  window.innerWidth < 768 ||
                  !window.WebGLRenderingContext;
if (!_isMobile) {
  init();
  animate(0);
} else {
  document.body.classList.add('is-mobile');
  // Hide the canvas element immediately so it doesn't flash
  canvas.style.display = 'none';
}

export { CAMERA_STOPS, getCameraGoal, getScrollProgress };
