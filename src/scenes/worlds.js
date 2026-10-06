// Shared 3D environments used across several scenes: rooms, shipyard, underwater, city.
import * as THREE from 'three';
import { std, box, cyl, sph, mesh, wallpaper, woodTex, carpetTex, checkerTex, metalTex, canvasTex, rng, glow, particles, chandelier, table, chair, shadows, basic } from '../lib/kit.js';
import { cam } from './common.js';
import { makeSky, outdoorLights } from '../lib/env.js';
import { buildLiner, TITANIC } from '../lib/ship.js';

/** box room viewed from inside. o: {w,d,h, wall, wallAccent, floor:'wood'|'carpet'|'checker', ceil, light, env} */
export function roomWorld(o = {}, E) {
  const scene = new THREE.Scene();
  const w = o.w ?? 14, d = o.d ?? 10, h = o.h ?? 4.2;
  const wallTex = o.wallTex ?? (o.panel ? woodTex(o.wall ?? '#5a3018', { planks: 4, repeat: [w / 2, 1] }) : wallpaper(o.wall ?? '#6b1820', o.wallAccent ?? '#d9a24a', { repeat: [w / 2.5, h / 2.5], alpha: o.patternAlpha ?? 0.22 }));
  const walls = std(0xffffff, { map: wallTex, rough: 0.85, side: THREE.BackSide });
  const floorTex = o.floor === 'carpet' ? carpetTex(o.floorColor ?? '#5a1218', o.floorAccent ?? '#c9a14a', { repeat: [w / 2, d / 2] }) : o.floor === 'checker' ? checkerTex(o.floorA ?? '#e8e2d4', o.floorB ?? '#8a1d24', 8, { repeat: [w / 3, d / 3] }) : o.floor === 'metal' ? metalTex('#3a3a3a', { repeat: [w / 4, d / 4] }) : woodTex(o.floorColor ?? '#7a4a24', { repeat: [w / 3, d / 3] });
  const room = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [walls, walls, std(o.ceil ?? 0xf0e8d8, { side: THREE.BackSide, rough: 0.9 }), std(0xffffff, { map: floorTex, side: THREE.BackSide, rough: 0.6 }), walls, walls]);
  room.position.y = h / 2; room.receiveShadow = true; scene.add(room);
  // skirting & cornice
  const trim = std(o.trim ?? 0x3a1e0e, { rough: 0.5 });
  for (const [x, z, sx, sz] of [[0, -d / 2 + 0.03, w, 0.06], [0, d / 2 - 0.03, w, 0.06], [-w / 2 + 0.03, 0, 0.06, d], [w / 2 - 0.03, 0, 0.06, d]]) {
    box(sx, 0.25, sz, trim, x, 0.12, z, scene); box(sx, 0.2, sz, std(o.cornice ?? 0xe8dcc0), x, h - 0.1, z, scene);
  }
  scene.add(new THREE.HemisphereLight(o.hemiSky ?? 0xfff0dd, o.hemiGround ?? 0x402018, o.hemi ?? 0.55));
  if (E?.envMap && o.env !== false) { scene.environment = E.envMap; scene.environmentIntensity = o.envI ?? 0.35; }
  if (o.key !== false) {
    const key = new THREE.SpotLight(o.keyColor ?? 0xffd8a8, (o.keyI ?? 60) * 0.5, 30, 0.8, 0.6, 1.5);
    key.position.set(...(o.keyPos ?? [w * 0.3, h - 0.2, d * 0.3])); key.target.position.set(0, 0, 0); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
    scene.add(key, key.target);
  }
  const camera = cam(o.fov ?? 40, 0.05, 200);
  return { scene, camera, w, d, h, tick() {} };
}

/** a framed painting / poster */
export function painting(parent, x, y, z, w, h, draw, rotY = 0, o = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rotY; parent.add(g);
  box(w + 0.16, h + 0.16, 0.06, std(o.frame ?? 0xb8893a, { metal: 0.7, rough: 0.35 }), 0, 0, 0, g);
  const tex = canvasTex(512, Math.round(512 * h / w), draw);
  mesh(new THREE.PlaneGeometry(w, h), std(0xffffff, { map: tex, rough: 0.8 }), 0, 0, 0.035, g);
  return g;
}
export const landscape = (top = '#5a7ab0', bot = '#d8a060', sea = '#2a4a6a') => (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(0.6, bot); gr.addColorStop(0.61, sea); gr.addColorStop(1, '#13202e');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const r = rng(w + h); for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.1})`; g.fillRect(r() * w, r() * h, 20 + r() * 40, 3 + r() * 6); }
  g.fillStyle = '#1a1410'; g.beginPath(); g.moveTo(0, h * 0.6); g.lineTo(w * 0.2, h * 0.45); g.lineTo(w * 0.35, h * 0.6); g.fill();
  g.fillStyle = 'rgba(255,240,200,0.9)'; g.beginPath(); g.arc(w * 0.7, h * 0.35, w * 0.06, 0, 7); g.fill();
};

/** bookshelf full of colourful spines */
export function bookshelf(parent, x, z, w = 3, h = 3, rotY = 0, seed = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; parent.add(g);
  const wood = std(0x4a2612, { rough: 0.6 });
  box(w, h, 0.05, wood, 0, h / 2, -0.2, g);
  box(0.06, h, 0.45, wood, -w / 2, h / 2, 0, g); box(0.06, h, 0.45, wood, w / 2, h / 2, 0, g);
  const shelves = Math.round(h / 0.5);
  const spine = canvasTex(1024, 128, (c, cw, ch) => {
    const r = rng(seed); let x0 = 0;
    const cols = ['#8a1d24', '#1d3a6a', '#2d5a3a', '#c9a14a', '#5a2a6a', '#1a1a1a', '#a0522d', '#d8cfb8', '#3a6a8a', '#7a1f3d'];
    while (x0 < cw) { const bw = 18 + r() * 30; c.fillStyle = cols[Math.floor(r() * cols.length)]; const bh = ch * (0.7 + r() * 0.3); c.fillRect(x0, ch - bh, bw - 2, bh); c.fillStyle = 'rgba(255,215,120,0.7)'; c.fillRect(x0 + 3, ch - bh + 12, bw - 8, 3); c.fillRect(x0 + 3, ch - 18, bw - 8, 3); x0 += bw; }
  });
  for (let i = 0; i < shelves; i++) {
    const y = i * (h / shelves);
    box(w, 0.04, 0.42, wood, 0, y + 0.02, 0, g);
    const t = spine.clone(); t.needsUpdate = true; t.offset.x = (i * 0.37) % 1; t.wrapS = THREE.RepeatWrapping; t.repeat.x = w / 3;
    mesh(new THREE.PlaneGeometry(w - 0.1, h / shelves - 0.08), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.8 }), 0, y + (h / shelves) / 2, 0.12, g);
  }
  return g;
}

// ---------- shipyard ----------
/** Arrol gantry + slipway + hull. progress: 0 keel, 0.5 frames, 1 plated */
export function yardWorld(o = {}, E) {
  const scene = new THREE.Scene();
  const skyP = o.sky ?? { top: '#5a7090', mid: '#a8b4bc', hor: '#e0d4c0', sun: '#ffe0b0', sunDir: [0.5, 0.25, 0.6], sunSize: 0.02, stars: 0 };
  const sky = makeSky(skyP); scene.add(sky);
  scene.fog = new THREE.Fog(o.fog ?? skyP.hor, o.fogNear ?? 150, o.fogFar ?? 1600);
  outdoorLights(scene, { sunDir: skyP.sunDir, sun: o.sun ?? 0xffe2c0, sunI: o.sunI ?? 2.2, hemi: o.hemi ?? 0.9, sky: 0xc8d8ff, ground: 0x3a3028, shadow: true, shadowSize: 220 });
  if (E?.envMap) { scene.environment = E.envMap; scene.environmentIntensity = 0.3; }
  // ground & slip
  const ground = mesh(new THREE.PlaneGeometry(310, 3000), std(0x4a4238, { rough: 1, map: metalTex('#4a4238', { repeat: [20, 200] }) }), 0, 0, 0, scene); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  const slip = box(310, 1, 40, std(0x6a5a48, { rough: 0.9 }), 0, 0.5, 0, scene); slip.receiveShadow = true;
  const ground2 = mesh(new THREE.PlaneGeometry(3000, 3000), std(0x4a4238, { rough: 1 }), -1340, 0.05, 0, scene); ground2.rotation.x = -Math.PI / 2; void ground2;
  // water (river) beyond the slip end
  const water = mesh(new THREE.PlaneGeometry(1200, 2000), std(0x23343a, { rough: 0.15, metal: 0.3 }), 760, 0.3, 0, scene); water.rotation.x = -Math.PI / 2;
  // gantry
  const steel = std(o.gantryColor ?? 0x2b2f33, { rough: 0.6, metal: 0.5 });
  const G = new THREE.Group(); scene.add(G);
  const L = 280, Wd = 82, Ht = 70;
  for (let x = -L / 2; x <= L / 2; x += 20) {
    for (const z of [-Wd / 2, -Wd / 6, Wd / 6, Wd / 2]) { const c = box(1.2, Ht, 1.2, steel, x, Ht / 2, z, G); c.castShadow = true; }
    box(1, 1, Wd, steel, x, Ht, 0, G); box(1, 1, Wd, steel, x, Ht * 0.66, 0, G);
    for (const z of [-Wd / 2, Wd / 2]) { const br = box(0.5, 28, 0.5, steel, x + 10, Ht * 0.5, z, G); br.rotation.z = 0.62; const br2 = box(0.5, 28, 0.5, steel, x + 10, Ht * 0.83, z, G); br2.rotation.z = -0.62; }
  }
  for (const z of [-Wd / 2, -Wd / 6, Wd / 6, Wd / 2]) for (const y of [Ht, Ht * 0.66, Ht * 0.33]) box(L, 0.9, 0.9, steel, 0, y, z, G);
  // travelling cranes on top
  const cranes = [];
  for (let i = 0; i < 4; i++) { const c = new THREE.Group(); c.position.set(-100 + i * 65, Ht + 2, 0); G.add(c); box(4, 3, Wd + 4, std(0xb03a2a, { rough: 0.6 }), 0, 0, 0, c); const cable = box(0.15, 30, 0.15, steel, 0, -16, 8, c); const hook = box(1.2, 1.2, 1.2, std(0xd8a020), 0, -31, 8, c); cranes.push({ c, cable, hook }); }
  // hull under construction
  const hull = new THREE.Group(); hull.position.set(0, 12, 0); scene.add(hull);
  const primer = std(0xa0391e, { rough: 0.85, map: metalTex('#a0391e', { rust: true, repeat: [12, 2] }) });
  const keel = box(TITANIC.L, 1.6, 3, primer, 0, -10.5, 0, hull); keel.castShadow = true;
  // frames (ribs)
  const ribs = new THREE.Group(); hull.add(ribs);
  const ribMat = std(0x8a3a20, { rough: 0.8 });
  const ribCount = 80;
  for (let i = 0; i < ribCount; i++) {
    const x = -TITANIC.L / 2 + 6 + (i / (ribCount - 1)) * (TITANIC.L - 12);
    const u = (x + TITANIC.L / 2) / TITANIC.L;
    let hw = 14; if (u > 0.78) hw *= Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.78) / 0.22, 2.1))); if (u < 0.1) hw *= Math.sqrt(Math.max(0, 1 - Math.pow((0.1 - u) / 0.1, 2) * 0.82));
    const shape = new THREE.Group(); shape.position.x = x; ribs.add(shape);
    for (const s of [1, -1]) { const side = box(0.5, 21, 0.5, ribMat, 0, 0, s * Math.max(0.5, hw), shape); side.rotation.x = s * 0.05; }
    box(0.5, 0.5, Math.max(1, hw * 2), ribMat, 0, -10, 0, shape);
    box(0.4, 0.4, Math.max(1, hw * 2), ribMat, 0, 10.5, 0, shape);
    shape.userData.i = i;
  }
  const liner = buildLiner({ spec: { ...TITANIC, supers: [], funnels: [], masts: [], boats: { fore: [], aft: [] } }, lights: 0 });
  liner.position.y = 0; hull.add(liner);
  liner.traverse((m) => { if (m.isMesh) { m.castShadow = true; } });
  // scaffolding poles around the hull
  const scaf = new THREE.Group(); scene.add(scaf);
  const pole = std(0x6a5038, { rough: 0.9 });
  for (let x = -130; x <= 130; x += 6) for (const z of [-17, 17]) { const p = box(0.3, 34, 0.3, pole, x, 17, z, scaf); void p; }
  for (let y = 4; y < 34; y += 4) for (const z of [-17, 17]) box(264, 0.25, 0.25, pole, 0, y, z, scaf);
  const camera = cam(o.fov ?? 40, 0.5, 6000);
  const st = {
    scene, camera, sky, hull, keel, ribs, liner, scaf, cranes, gantry: G, water,
    setProgress(p) { // 0 keel only .. 0.8 all frames .. 1 plated hull
      const n = ribs.children.length;
      ribs.children.forEach((r, i) => { const k = THREE.MathUtils.clamp(p * 2.2 - (i / n) * 1.2, 0, 1); r.visible = k > 0.001; r.scale.y = Math.max(0.01, k); });
      liner.visible = p >= 0.8; ribs.visible = p < 0.98;
    },
    tick(S) { sky.position.copy(camera.position); cranes.forEach((c, i) => { c.c.position.x = -100 + i * 65 + Math.sin(S.t * 0.2 + i) * 12; c.cable.scale.y = 1 + Math.sin(S.t * 0.3 + i * 2) * 0.2; c.hook.position.y = -31 - Math.sin(S.t * 0.3 + i * 2) * 3; }); },
  };
  return st;
}

/** row houses (Belfast terraces / London), returns group */
export function terraces(parent, o = {}) {
  const g = new THREE.Group(); parent.add(g);
  const r = rng(o.seed ?? 3);
  const brick = canvasTex(256, 256, (c, w, h) => { c.fillStyle = o.brick ?? '#7a3a28'; c.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 ? 0 : 16; x < w; x += 32) { c.fillStyle = `rgba(0,0,0,${0.1 + r() * 0.15})`; c.fillRect(x, y, 30, 14); } c.fillStyle = 'rgba(30,20,15,0.5)'; for (let i = 0; i < 4; i++) { c.fillStyle = r() < 0.5 ? '#2a3440' : (o.lit ? '#ffc870' : '#2a3440'); c.fillRect(30 + i * 60, 50, 26, 40); c.fillRect(30 + i * 60, 150, 26, 40); } }, { repeat: [1, 1] });
  const wallM = std(0xffffff, { map: brick, rough: 0.9 }), roofM = std(o.roof ?? 0x3a3a44, { rough: 0.8 }), chimM = std(0x5a2a1e);
  const rows = o.rows ?? 4, n = o.n ?? 30, sp = o.spacing ?? 7;
  for (let j = 0; j < rows; j++) for (let i = 0; i < n; i++) {
    const x = (o.x ?? 0) + (i - n / 2) * sp, z = (o.z ?? 0) + j * (o.rowGap ?? 22);
    const h = (o.h ?? 8) + r() * 2;
    box(sp, h, 9, wallM, x, h / 2, z, g);
    const roof = box(sp, 0.6, 7, roofM, x, h + 1.6, z - 2, g); roof.rotation.x = 0.55;
    const roof2 = box(sp, 0.6, 7, roofM, x, h + 1.6, z + 2, g); roof2.rotation.x = -0.55;
    if (r() < 0.7) box(0.9, 2.5, 0.9, chimM, x + sp * 0.3, h + 3, z, g);
  }
  return g;
}

// ---------- underwater ----------
export function underwaterWorld(o = {}, E) {
  const scene = new THREE.Scene();
  const col = new THREE.Color(o.color ?? '#03121c');
  scene.background = col; scene.fog = new THREE.FogExp2(col, o.density ?? 0.02);
  scene.add(new THREE.HemisphereLight(0x4a8ab0, 0x0a0806, o.hemi ?? 0.5));
  if (E?.envMap) { scene.environment = E.envMap; scene.environmentIntensity = 0.15; }
  const seabedTex = canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#3a3428'; c.fillRect(0, 0, w, h); const r = rng(8); for (let i = 0; i < 3000; i++) { c.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '200,190,160'},${r() * 0.15})`; c.beginPath(); c.arc(r() * w, r() * h, r() * 4, 0, 7); c.fill(); } }, { repeat: [40, 40] });
  const bedGeo = new THREE.PlaneGeometry(800, 800, 120, 120); bedGeo.rotateX(-Math.PI / 2);
  const p = bedGeo.attributes.position; const R = rng(4);
  for (let i = 0; i < p.count; i++) p.setY(i, Math.sin(p.getX(i) * 0.05) * 0.8 + Math.cos(p.getZ(i) * 0.07) * 0.6 + R() * 0.15);
  bedGeo.computeVertexNormals();
  const bed = mesh(bedGeo, std(0xffffff, { map: seabedTex, rough: 1 }), 0, o.bedY ?? 0, 0, scene); bed.receiveShadow = true;
  const snow = particles(1500, (i, t) => { const r = rng(i + 1); const x = (r() - 0.5) * 80, y = ((r() * 40 - t * 0.3) % 40 + 40) % 40, z = (r() - 0.5) * 80; return [x, y, z]; }, { size: 0.12, color: 0xbfd8e8, opacity: 0.6 });
  scene.add(snow);
  const camera = cam(o.fov ?? 45, 0.05, 2000);
  const lamp = new THREE.SpotLight(0xdff2ff, o.lampI ?? 400, 120, 0.45, 0.6, 1.4); lamp.castShadow = true; scene.add(lamp, lamp.target);
  return { scene, camera, bed, snow, lamp, tick(S) { snow.position.set(camera.position.x, camera.position.y - 20, camera.position.z); snow.userData.update(S.t); } };
}

/** rusticles-covered material */
export function rustMat(o = {}) {
  const t = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = o.base ?? '#9a5230'; c.fillRect(0, 0, w, h); const r = rng(o.seed ?? 12);
    for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${140 + r() * 80},${50 + r() * 50},${10 + r() * 20},${0.2 + r() * 0.4})`; const x = r() * w, y = r() * h; c.beginPath(); c.ellipse(x, y, 2 + r() * 8, 6 + r() * 30, 0, 0, 7); c.fill(); }
    for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(20,10,5,${r() * 0.4})`; c.fillRect(r() * w, r() * h, 2 + r() * 6, 2 + r() * 6); }
  }, { repeat: o.repeat ?? [8, 2] });
  return std(0xffffff, { map: t, rough: 1 });
}

/** generic deck section (for close scenes on board): wooden deck, rail, lifeboats */
export function deckSet(parent, o = {}) {
  const g = new THREE.Group(); parent.add(g);
  const len = o.len ?? 60, wid = o.wid ?? 10;
  const deck = box(len, 0.3, wid, std(0xffffff, { map: woodTex('#a07850', { planks: 16, repeat: [len / 6, 1] }), rough: 0.7 }), 0, -0.15, 0, g); deck.receiveShadow = true;
  const white = std(0xf1eee6, { rough: 0.6 });
  const wall = box(len, 3.2, 0.3, white, 0, 1.6, -wid / 2, g); wall.receiveShadow = true;
  // windows on wall
  const win = std(0x2a3440, { emissive: 0xffc070, ei: o.lit ? 1.6 : 0 });
  for (let x = -len / 2 + 2; x < len / 2; x += 3) box(1.2, 1.2, 0.05, win, x, 1.9, -wid / 2 + 0.18, g);
  // rail
  const rail = std(o.railColor ?? 0x6a4a2a, { rough: 0.5 });
  box(len, 0.08, 0.12, rail, 0, 1.1, wid / 2, g);
  for (let x = -len / 2; x <= len / 2; x += 1.5) box(0.05, 1.1, 0.05, white, x, 0.55, wid / 2, g);
  return g;
}

export { glow, chandelier, table, chair, shadows, basic, sph, cyl, box };
