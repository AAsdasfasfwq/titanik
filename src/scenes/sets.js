// Interior sets used in several acts: Marconi wireless room, the bridge, dining saloon, crow's nest.
import * as THREE from 'three';
import { roomWorld, painting, landscape, chandelier, table, chair, glow } from './worlds.js';
import { std, box, cyl, sph, mesh, canvasTex, rng, particles, smokeTex, woodTex } from '../lib/kit.js';
import { person, pose } from '../lib/people.js';

export function wirelessRoom(E, o = {}) {
  const st = roomWorld({ w: 5, d: 4, h: 2.7, panel: true, wall: '#6a4a2e', floor: 'wood', floorColor: '#4a2e18', keyPos: [0.5, 2.6, 0.8], keyI: 18, keyColor: 0xffe2b0, hemi: 0.45 }, E);
  const { scene } = st;
  const desk = std(0x5a3418, { rough: 0.45 }), black = std(0x141414, { rough: 0.35, metal: 0.3 }), brass = std(0xc9a14a, { metal: 0.85, rough: 0.3 });
  box(3.6, 0.08, 0.9, desk, 0, 0.78, -1.45, scene); box(3.6, 0.75, 0.05, desk, 0, 0.4, -1.88, scene);
  // Marconi apparatus
  const eq = [];
  for (let i = 0; i < 5; i++) { const x = -1.4 + i * 0.7; const b = box(0.5, 0.45 + (i % 2) * 0.2, 0.4, black, x, 1.05 + (i % 2) * 0.1, -1.7, scene); eq.push(b); for (let k = 0; k < 3; k++) { const d = cyl(0.05, 0.05, 0.03, brass, x - 0.15 + k * 0.15, 1.05 + (i % 2) * 0.1, -1.49, scene, 12); d.rotation.x = Math.PI / 2; } }
  // spark gap (glows when transmitting)
  const spark = glow(0x9fd8ff, 0.5, 0); spark.position.set(1.4, 1.5, -1.6); scene.add(spark);
  const sparkL = new THREE.PointLight(0x9fd8ff, 0, 5, 1.5); sparkL.position.copy(spark.position); scene.add(sparkL);
  // telegraph keys
  for (const x of [-0.6, 0.6]) { box(0.2, 0.03, 0.12, black, x, 0.83, -1.2, scene); box(0.14, 0.02, 0.03, brass, x, 0.87, -1.2, scene); }
  // lamp
  const lampL = new THREE.PointLight(0xffd8a0, o.lamp ?? 6, 6, 1.6); lampL.position.set(0, 2.2, -0.8); scene.add(lampL);
  const lg = glow(0xffd8a0, 0.25, 0.6); lg.position.copy(lampL.position); scene.add(lg);
  // paper message slips (pile grows)
  const slips = [];
  const slipTex = canvasTex(128, 96, (g, w, h) => { const q = rng(5); g.fillStyle = '#f2ecdc'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2a2a'; g.font = '700 14px Oswald'; g.fillText('MARCONIGRAM', 8, 18); g.fillStyle = 'rgba(30,30,30,0.5)'; for (let y = 32; y < h - 8; y += 10) g.fillRect(8, y, 70 + q() * 40, 3); });
  const slipM = std(0xffffff, { map: slipTex, rough: 0.9 });
  const r = rng(93);
  for (let i = 0; i < 70; i++) { const s = mesh(new THREE.PlaneGeometry(0.2, 0.15), slipM, -1.5 + r() * 0.8 + (i % 2) * 2.0, 0.83 + i * 0.004, -1.25 + r() * 0.2, scene); s.rotation.x = -Math.PI / 2; s.rotation.z = (r() - 0.5) * 0.8; s.visible = false; slips.push(s); }
  // operators
  const ops = [person({ coat: '#14161c', hair: '#3a2a1e', skin: '#f0c8a8' }), person({ coat: '#1a1c24', hair: '#6a4a2a', skin: '#e8b896' })];
  ops.forEach((p, i) => { pose.sit(p); p.position.set(-0.6 + i * 1.2, 0, -0.55); p.rotation.y = Math.PI; scene.add(p); const hp = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.015, 6, 16, Math.PI), black); hp.position.y = 0.05; p.userData.head.add(hp); for (const sx of [-1, 1]) sph(0.045, black, sx * 0.13, 0, 0, p.userData.head, 8, 6); chair(scene, -0.6 + i * 1.2, -0.5, Math.PI, { fabric: 0x3a2a1a }); });
  if (o.ops === 1) { ops[1].visible = false; }
  Object.assign(st, { spark, sparkL, slips, ops, lampL, lg, eq });
  st.animate = (S, k = {}) => {
    const tx = k.transmit ?? 0;
    const flick = tx * (Math.sin(S.t * 47) > 0.2 ? 1 : 0.2) * (Math.sin(S.t * 9.3) > -0.3 ? 1 : 0);
    spark.material.opacity = flick; spark.scale.setScalar(0.3 + flick * 0.6); sparkL.intensity = flick * 8;
    const pile = Math.floor((k.pile ?? 0) * slips.length); slips.forEach((s, i) => (s.visible = i < pile));
    ops.forEach((p, i) => { p.userData.armR.rotation.x = -0.9; p.userData.armR.userData.fore.rotation.x = -0.9 + (i === 0 ? Math.max(0, Math.sin(S.t * 18)) * 0.15 * tx : 0); p.userData.armL.rotation.x = -0.8; p.userData.head.rotation.x = 0.2 + (k.wince && i === 0 ? Math.sin(S.t * 30) * 0.05 : 0); p.userData.head.rotation.y = i ? -0.1 : 0.05; });
  };
  return st;
}

export function bridgeSet(E, o = {}) {
  const st = roomWorld({ w: 10, d: 5, h: 3, panel: true, wall: '#7a5230', floor: 'wood', floorColor: '#6a4a2a', keyPos: [0, 2.9, 1], keyI: o.night ? 6 : 18, keyColor: 0xffd8a0, hemi: o.night ? 0.22 : 0.6 }, E);
  const { scene } = st;
  // windows looking forward (-z): night sky with stars
  const skyTex = canvasTex(1024, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, o.night ? '#02040c' : '#7aa8d8'); gr.addColorStop(0.62, o.night ? '#0a1430' : '#cfe0ee'); gr.addColorStop(0.63, o.night ? '#010206' : '#1f4a6a'); gr.addColorStop(1, o.night ? '#000' : '#123048'); g.fillStyle = gr; g.fillRect(0, 0, w, h); if (o.night) { const r = rng(3); for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`; g.fillRect(r() * w, r() * h * 0.6, 1.5, 1.5); } } });
  for (let i = -3; i <= 3; i++) { const w = mesh(new THREE.PlaneGeometry(1.1, 1.0), new THREE.MeshBasicMaterial({ map: skyTex, toneMapped: false }), i * 1.35, 1.9, -2.48, scene); w.material.map = skyTex.clone(); w.material.map.needsUpdate = true; w.material.map.repeat.set(0.14, 1); w.material.map.offset.set((i + 3) * 0.14, 0); box(0.12, 1.1, 0.08, std(0x5a3a1e), i * 1.35 + 0.62, 1.9, -2.44, scene); }
  const brass = std(0xc9a14a, { metal: 0.85, rough: 0.25 }), wood = std(0x6a3a1a, { rough: 0.4 });
  // ship's wheel
  const wheel = new THREE.Group(); wheel.position.set(0, 1.25, 0.2); scene.add(wheel);
  cyl(0.12, 0.16, 1.0, brass, 0, 0.6, 0.35, scene, 16);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.035, 8, 32), wood); wheel.add(rim);
  for (let i = 0; i < 8; i++) { const sp = box(0.03, 1.1, 0.03, wood, 0, 0, 0, wheel); sp.rotation.z = (i / 8) * Math.PI; }
  sph(0.07, brass, 0, 0, 0.02, wheel, 10, 8);
  // engine order telegraphs
  const tele = [];
  for (const x of [-2.2, 2.2]) {
    const T = new THREE.Group(); T.position.set(x, 0, -0.6); scene.add(T);
    cyl(0.12, 0.18, 1.0, brass, 0, 0.5, 0, T, 16);
    const face = cyl(0.3, 0.3, 0.12, brass, 0, 1.2, 0, T, 24); face.rotation.x = Math.PI / 2;
    const dial = mesh(new THREE.CircleGeometry(0.26, 32), std(0xffffff, { map: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#f4ecd8'; g.beginPath(); g.arc(128, 128, 128, 0, 7); g.fill(); g.fillStyle = '#8a1d24'; g.font = '700 20px Oswald'; g.textAlign = 'center'; ['FULL', 'HALF', 'SLOW', 'STOP', 'SLOW', 'HALF', 'FULL'].forEach((t, i) => { const a = -Math.PI * 0.85 + i * (Math.PI * 1.7 / 6); g.save(); g.translate(128 + Math.sin(a) * 95, 128 - Math.cos(a) * 95); g.rotate(a); g.fillText(t, 0, 6); g.restore(); }); g.fillStyle = '#222'; g.fillText('AHEAD', 128, 90); g.fillText('ASTERN', 128, 190); }) }), 0, 1.2, 0.065, T);
    void dial;
    const lever = new THREE.Group(); lever.position.set(0, 1.2, 0.09); T.add(lever); box(0.04, 0.32, 0.03, std(0x1a1a1a), 0, 0.14, 0, lever);
    tele.push({ T, lever });
  }
  // binnacle
  cyl(0.18, 0.22, 1.1, brass, 0, 0.55, -1.6, scene, 16); sph(0.2, brass, 0, 1.15, -1.6, scene, 16, 10);
  const lamp = new THREE.PointLight(0xffd8a0, o.night ? 3 : 6, 8, 1.6); lamp.position.set(0, 2.6, 0.5); scene.add(lamp);
  Object.assign(st, { wheel, tele });
  return st;
}

export function diningSaloon(E, o = {}) {
  const st = roomWorld({ w: 22, d: 14, h: 4.2, wall: '#efe8d8', wallAccent: '#c9a14a', patternAlpha: 0.12, floor: 'carpet', floorColor: '#8a1d24', floorAccent: '#e0b050', keyI: 40, hemi: 0.6, cornice: 0xf6efe0 }, E);
  const { scene } = st;
  for (const x of [-6, 0, 6]) for (const z of [-3, 3]) chandelier(scene, x, 3.6, z, 1.0, { intensity: 6, dist: 10 });
  const people = [];
  const r = rng(92);
  for (let i = 0; i < 12; i++) {
    const x = -8 + (i % 6) * 3.2, z = i < 6 ? -2.5 : 2.5;
    table(scene, x, z, { w: 1.3, d: 1.3, seats: 4, candle: false });
    for (let k = 0; k < 2; k++) {
      if (o.empty) break;
      const female = r() < 0.5;
      const p = person(female ? { female: true, dress: ['#7a1f3d', '#1d3a6a', '#2d5a3a', '#c9a14a', '#5a2a6a'][Math.floor(r() * 5)], hair: ['#3a2a1e', '#8a5a2a', '#c8a060'][Math.floor(r() * 3)] } : { coat: '#111', tie: '#111' });
      if (o.standing) { p.position.set(x + (k ? 0.5 : -0.5), 0, z + 0.9); p.rotation.y = Math.PI; }
      else { pose.sit(p); p.position.set(x + (k ? 0.75 : -0.75), 0, z); p.rotation.y = k ? -Math.PI / 2 : Math.PI / 2; chair(scene, x + (k ? 0.85 : -0.85), z, k ? -Math.PI / 2 : Math.PI / 2, { fabric: 0x8a1d24 }); }
      scene.add(p); people.push(p);
    }
  }
  // columns
  for (const x of [-9, -3, 3, 9]) for (const z of [-5.5, 5.5]) cyl(0.25, 0.3, 4.2, std(0xf6efe0, { rough: 0.5 }), x, 2.1, z, scene, 16);
  // string quartet / ensemble on a little stage
  const musicians = [];
  if (o.band !== false) for (let i = 0; i < 4; i++) {
    const m = person({ coat: '#111', hair: ['#2a1a10', '#6a4a2a', '#3a2a1e', '#1a1410'][i] }); m.position.set(-9.8 + i * 0.0, 0, -5 + i * 1.2); m.rotation.y = Math.PI / 2; scene.add(m);
    const vio = new THREE.Group(); const body = sph(0.12, std(0x8a4a1a, { rough: 0.3 }), 0, 0, 0, vio, 10, 8); body.scale.set(0.7, 1, 0.3); box(0.02, 0.3, 0.02, std(0x1a1a1a), 0, 0.2, 0, vio);
    vio.position.set(0.12, 0.62, 0.18); vio.rotation.set(0.3, 0, 0.9); m.userData.torso.add(vio);
    musicians.push(m);
  }
  Object.assign(st, { people, musicians });
  st.animate = (S) => { people.forEach((p, i) => pose.idle(p, S.t, i)); musicians.forEach((m, i) => { m.userData.armR.rotation.x = -1.0; m.userData.armR.rotation.z = -0.4 + Math.sin(S.t * 3 + i) * 0.35; m.userData.armL.rotation.x = -1.3; m.userData.armL.rotation.z = 0.6; m.userData.head.rotation.z = 0.25; }); };
  return st;
}

/** crow's nest close-up set (night) */
export function crowsNest(E, o = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02040a);
  scene.fog = new THREE.Fog(0x02040a, 30, 400);
  scene.add(new THREE.HemisphereLight(0x3a4a7a, 0x05070a, 0.35));
  const moon = new THREE.DirectionalLight(0x8aa0ff, 0.9); moon.position.set(-10, 20, -10); scene.add(moon);
  const faceL = new THREE.PointLight(0xaab8ff, 4, 6, 1.5); faceL.position.set(0.2, 2.1, -1.6); scene.add(faceL);
  const stars = particles(1500, (i) => { const q = rng(i + 4); const a = q() * Math.PI * 2, e = q() * 1.2 + 0.02; return [Math.cos(a) * Math.cos(e) * 300, Math.sin(e) * 300, Math.sin(a) * Math.cos(e) * 300]; }, { size: 1.6, color: 0xffffff, opacity: 0.9, atten: false, fog: false });
  scene.add(stars);
  const white = std(0xe8e2d4, { rough: 0.6 });
  const nest = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.3, 24, 1, true), std(0xe8e2d4, { side: THREE.DoubleSide, rough: 0.6 })); nest.position.y = 0.65; scene.add(nest);
  box(0.3, 30, 0.3, std(0xb88a52), 0, -14, 0, scene);
  const bell = new THREE.Group(); bell.position.set(0.9, 1.6, -0.6); scene.add(bell);
  const bm = std(0xc9a14a, { metal: 0.9, rough: 0.25 }); const b = mesh(new THREE.CylinderGeometry(0.08, 0.15, 0.2, 16, 1, true), std(0xc9a14a, { metal: 0.9, rough: 0.25, side: THREE.DoubleSide }), 0, 0, 0, bell); void b; box(0.04, 0.3, 0.04, bm, 0, 0.2, 0, bell);
  const phone = box(0.18, 0.28, 0.12, std(0x1a1a1a), -0.95, 1.3, -0.5, scene); void phone;
  const fleet = person({ coat: '#1a1d26', hat: 'cap', hatColor: '#1a1d26', tie: false, shirt: '#2a2a2a', skin: '#e8b896' });
  const lee = person({ coat: '#20222a', hat: 'cap', hatColor: '#20222a', tie: false, shirt: '#2a2a2a', skin: '#d9a27c' });
  fleet.position.set(-0.35, 0, 0.1); lee.position.set(0.45, 0, 0.3); fleet.rotation.y = Math.PI; lee.rotation.y = Math.PI * 0.95;
  scene.add(fleet, lee);
  const breath = particles(60, (i, t) => { const q = rng(i + 11); const age = (t * 0.5 + q()) % 1; const who = i % 2; const base = who ? [0.45, 1.75, 0.15] : [-0.35, 1.75, -0.05]; return [base[0] + (q() - 0.5) * age * 0.4, base[1] + age * 0.3, base[2] - age * 0.8]; }, { size: 0.07, color: 0xdde8ff, opacity: 0.18, add: false, tex: smokeTex() });
  scene.add(breath);
  const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.05, 2000);
  return { scene, camera, fleet, lee, bell, breath, stars, white, tick(S) { breath.userData.update(S.t); } };
}

export function grandStaircase(E) {
    const st = roomWorld({ w: 14, d: 14, h: 9, panel: true, wall: '#8a5a2e', floor: 'checker', floorA: '#f2ead8', floorB: '#1a1a1a', keyI: 30, hemi: 0.6, ceil: 0xf4ecd8 }, E);
    const { scene } = st;
    const oak = std(0x9a6a36, { rough: 0.45 }), rail = std(0x6a3a1a, { rough: 0.35 }), iron = std(0xc9a14a, { metal: 0.8, rough: 0.3 });
    for (let i = 0; i < 14; i++) { const s = box(5, 0.3, 0.6, std(0xb07a42, { rough: 0.5 }), 0, 0.15 + i * 0.3, 3 - i * 0.6, scene); s.receiveShadow = true; box(5, 0.3 * (i + 1), 0.6, oak, 0, 0.15 * (i + 1), 3 - i * 0.6, scene); }
    for (const sx of [-1, 1]) { const b = box(0.25, 0.25, 9, rail, sx * 2.6, 2.6, -1, scene); b.rotation.x = 0.46; for (let i = 0; i < 14; i++) { const p = cyl(0.03, 0.03, 1.0, iron, sx * 2.6, 0.75 + i * 0.3, 3 - i * 0.6, scene, 6); void p; } }
    box(14, 0.4, 5, oak, 0, 4.3, -4.6, scene);
    // cherub lamp
    const c = sph(0.2, iron, -2.6, 1.6, 3.4, scene); void c; const gl = glow(0xffd28a, 1.0, 1); gl.position.set(-2.6, 2.0, 3.4); scene.add(gl);
    // glass dome
    const domeTex = canvasTex(1024, 512, (g, w, h) => { g.fillStyle = '#fff6dc'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3a2a14'; g.lineWidth = 6; for (let x = 0; x < w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.fillStyle = 'rgba(160,200,255,0.4)'; for (let x = 0; x < w; x += 128) for (let y = 0; y < h; y += 96) g.fillRect(x + 6, y + 6, 52, 36); });
    const dome = mesh(new THREE.SphereGeometry(4, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ map: domeTex, side: THREE.BackSide, toneMapped: false }), 0, 8.9, 0, scene); void dome;
    const L = new THREE.PointLight(0xfff2d0, 40, 20, 1.2); L.position.set(0, 8, 0); scene.add(L);
    chandelier(scene, 0, 7.5, 0, 1.6, { intensity: 15, dist: 16 });
    const p1 = person({ female: true, dress: '#7a1f3d', hair: '#3a2a1e' }); p1.position.set(-0.6, 2.4, -1.2); scene.add(p1);
    const p2 = person({ coat: '#111', hat: 'top' }); p2.position.set(0.2, 2.4, -1.2); scene.add(p2);
    Object.assign(st, { dome, domeLight: L, couple: [p1, p2] });
    return st;
}

export { woodTex };
