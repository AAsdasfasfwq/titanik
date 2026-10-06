// ACT 5 — the freezing water, rescue, the reckoning, the wreck today, the Titan submersible.
import * as THREE from 'three';
import { card, oceanWorld, track, place, cam, paper, dark, toScreen, V, NIGHT, GLASS } from './common.js';
import { roomWorld, glow, underwaterWorld, rustMat, terraces } from './worlds.js';
import { std, box, cyl, sph, mesh, canvasTex, rng, particles, clamp, easeOut, easeIn, easeInOut, easeOutBack, lerp, smokeTex, metalTex, wobble, dotTex } from '../lib/kit.js';
import { txt, F, PAL, revealText, measure, shipSilhouette, personIcon, boatIcon, check, cross, strike, callout, nameTag, roundRect, clockIcon, thermometer, radioWaves, icebergIcon, glowBorder, route } from '../lib/draw2d.js';
import { newspaper, counter, drawMap, mapProjector, mapPin, PLACES } from './diagrams.js';
import { person, pose, crowd, gridSpots } from '../lib/people.js';
import { buildLiner, TITANIC, CARPATHIA } from '../lib/ship.js';
import { makeIceberg, makeWake } from '../lib/env.js';

const S5 = [];
const L = TITANIC.L;
const typedLine = (g, text, x, y, k, o = {}) => txt(g, text.slice(0, Math.floor(clamp(k) * text.length)), x, y, { align: 'left', ...o });

function lifeboat(o = {}) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); geo.scale(4.2, 1.0, 1.1);
  const hull = new THREE.Mesh(geo, std(0xf6f4ee, { rough: 0.5 })); hull.position.y = 0.6; g.add(hull);
  box(7.2, 0.1, 1.7, std(0x8a5a32), 0, 0.55, 0, g);
  const n = o.people ?? 8; const r = rng(o.seed ?? 1);
  for (let i = 0; i < n; i++) { const p = person(r() < 0.6 ? { female: true, dress: ['#3a2a4a', '#7a1f3d', '#d8cfb8', '#1d3a6a', '#4a5a3a'][Math.floor(r() * 5)], hair: '#6a4a2a' } : { coat: '#222', hat: 'cap' }); pose.sit(p); p.position.set(-3 + (i % 5) * 1.4, 0.55, i < 5 ? -0.35 : 0.35); p.rotation.y = i < 5 ? 0 : Math.PI; p.scale.setScalar(0.9); g.add(p); }
  if (o.lantern !== false) { const l = glow(0xffc070, 2.4, 0.95); l.position.set(3.4, 1.8, 0); g.add(l); const pl = new THREE.PointLight(0xffb060, 6, 14, 1.6); pl.position.copy(l.position); g.add(pl); }
  return g;
}

// 273 — card
S5.push(card(273, '1 HOUR', 'AFTER THE SINKING'));

// 274 — 1,500 people in 28°F water
S5.push({
  seg: 274, name: 'people in the water', amb: [{ kind: 'night', vol: 0.6 }, { kind: 'crowd', vol: 0.35 }], trans: 'fade',
  fx: { exposure: 1.4, bloom: 1.0, bloomThreshold: 0.45, saturation: 0.85, tint: [0.88, 0.97, 1.15], vignette: 0.85 },
  sfx: (S) => [{ t: S.find(275, /1,500/), type: 'hit', vol: 0.4 }, { t: S.find(275, /28/), type: 'drop', vol: 0.3, f0: 400, f1: 80 }, { t: S.at(276), type: 'pop', pitch: 300 }],
  build(E) {
    const st = oceanWorld({ ...GLASS, envMap: E.envMap, ship: false, fogNear: 300, fogFar: 2500 });
    st.dots = particles(1500, (i, t) => { const q = rng(i + 3); const a = q() * Math.PI * 2, r = Math.sqrt(q()) * 160; return [Math.cos(a) * r + Math.sin(t * 0.3 + i) * 0.4, 0.4 + Math.sin(t * 1.3 + i) * 0.1, Math.sin(a) * r]; }, { size: 0.9, color: 0xf2f2e8, opacity: 0.9, add: false });
    st.scene.add(st.dots);
    const r = rng(9); for (let i = 0; i < 120; i++) { const d = box(1 + r() * 3, 0.3, 0.6 + r(), std(0x6a4a2a, { rough: 0.9 }), (r() - 0.5) * 300, 0.1, (r() - 0.5) * 300, st.scene); d.rotation.y = r() * 6; }
    return st;
  },
  update(st, S) { track(st.camera, [[0, [0, 60, 220], [0, 0, 0], 40], [S.dur, [0, 30, 160], [0, 0, 0], 38]], S.lt); st.dots.userData.update(S.t); st.tick(S); },
  draw(st, g, S) {
    const { W, H, lt } = S;
    if (lt < S.at(275)) revealText(g, 'THE MOST TERRIFYING PART BEGINS', W / 2, 160, clamp(lt / 0.8), { font: F.cond(700, 66), ls: 6, color: '#fff', shadow: 30 });
    const n = lt - S.find(275, /1,500/);
    if (n > 0) counter(g, W / 2 - 300, 200, 1500, 'PEOPLE IN THE WATER', clamp(n / 1.0), { size: 130, suffix: '+' });
    const t = lt - S.find(275, /28/);
    if (t > 0) { thermometer(g, W - 330, H - 220, 520, lerp(0.35, 0.08, clamp(t / 1.5)), { color: '#3aa0ff' }); txt(g, '28°F', W - 250, 300, { font: F.cond(700, 110), color: '#9fe3ff', alpha: clamp(t * 3), align: 'left' }); txt(g, '−2°C', W - 250, 400, { font: F.cond(500, 50), color: '#fff', alpha: clamp(t * 3 - 1), align: 'left' }); }
    const s = lt - S.at(276);
    if (s > 0) txt(g, 'salt keeps seawater liquid below 32°F', W / 2, H - 250, { font: F.serif(42), color: '#dfe8ff', alpha: clamp(s * 2), shadow: 20 });
  },
});

// 277 — what the cold does to the body
S5.push(dark({
  seg: 277, name: 'cold shock body', c1: '#0a1e34', c2: '#01050a',
  sfx: (S) => [{ t: S.at(278), type: 'pop', pitch: 400 }, { t: S.find(279, /Cardiac/), type: 'heartbeat', n: 3, bpm: 140, vol: 0.5 }, { t: S.find(279, /hypothermia/), type: 'drop', vol: 0.3 }],
  paint(st, g, S) {
    const { W, H, lt } = S;
    revealText(g, 'THE BODY CANNOT ENDURE IT FOR LONG', W / 2, 120, clamp(lt / 0.7), { font: F.cond(700, 60), ls: 6, color: '#fff' });
    // silhouette
    g.save(); g.translate(W / 2 - 380, H / 2 + 60); g.scale(5.5, 5.5); g.fillStyle = 'rgba(159,227,255,0.14)'; g.strokeStyle = '#9fe3ff'; g.lineWidth = 0.6;
    g.beginPath(); g.arc(0, -34, 10, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.roundRect(-14, -22, 28, 40, 8); g.fill(); g.stroke(); g.fillRect(-12, 18, 10, 30); g.fillRect(2, 18, 10, 30); g.fillRect(-24, -20, 9, 34); g.fillRect(15, -20, 9, 34);
    g.restore();
    const items = [[S.at(278), 'COLD SHOCK', 'gasping · breathing disrupted', [W / 2 - 380, H / 2 - 20], '#9fe3ff'], [S.find(279, /Cardiac/), 'CARDIAC ARREST', 'the heart gives out', [W / 2 - 360, H / 2 + 10], PAL.red2], [S.find(279, /hypothermia/), 'RAPID HYPOTHERMIA', 'within 15–30 minutes', [W / 2 - 380, H / 2 + 160], '#ffd23f']];
    items.forEach(([t0, label, sub, [x, y], col], i) => {
      const k = lt - t0; if (k < 0) return;
      const e = easeOut(clamp(k / 0.5));
      g.save(); g.globalAlpha = e; g.fillStyle = col; g.beginPath(); g.arc(x, y, 12 + Math.sin(lt * 6) * 3, 0, 7); g.fill();
      g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 360 * e, y - 160 + i * 150); g.lineTo(x + 420 * e, y - 160 + i * 150); g.stroke(); g.restore();
      txt(g, label, x + 440, y - 175 + i * 150, { font: F.cond(700, 56), ls: 4, color: col, align: 'left', alpha: e });
      txt(g, sub, x + 442, y - 125 + i * 150, { font: F.serif(32), color: '#dfe8ff', align: 'left', alpha: e });
    });
  },
}));

// 280 — the sound of hundreds crying for help
S5.push({
  seg: 280, name: 'cries in the dark', amb: [{ kind: 'night', vol: 0.5 }, { kind: 'crowd', vol: 0.55 }],
  fx: { exposure: 1.4, bloom: 1.0, bloomThreshold: 0.45, saturation: 0.8, tint: [0.88, 0.96, 1.15], vignette: 0.9 },
  sfx: (S) => [{ t: 0.5, type: 'drop', vol: 0.15, f0: 220, f1: 110, dur: 4 }],
  build(E) {
    const st = oceanWorld({ ...GLASS, envMap: E.envMap, ship: false, fogNear: 200, fogFar: 2200 });
    st.dots = particles(900, (i, t) => { const q = rng(i + 3); const a = q() * Math.PI * 2, r = Math.sqrt(q()) * 200; return [Math.cos(a) * r, 0.4 + Math.sin(t + i) * 0.1, Math.sin(a) * r - 150]; }, { size: 0.7, color: 0xf2f2e8, opacity: 0.8, add: false });
    st.scene.add(st.dots);
    for (let i = 0; i < 6; i++) { const b = lifeboat({ seed: i, people: 6 }); b.position.set(-300 + i * 120, 0, 380 + (i % 2) * 60); b.rotation.y = i; st.scene.add(b); }
    return st;
  },
  update(st, S) { track(st.camera, [[0, [0, 2.5, 420], [0, 0, -150], 36], [S.dur, [0, 2.3, 400], [0, 0, -150], 30]], S.lt); st.dots.userData.update(S.t); st.tick(S); },
  draw(st, g, S) { revealText(g, 'hundreds of people crying for help', S.W / 2, S.H / 2 - 140, clamp((S.lt - 1) / 1.5), { font: F.serif(56), color: '#dfe8ff', style: 'blur', shadow: 20 }); },
});

// 282 — survivors in half-empty boats; Lifeboat 14 goes back
S5.push({
  seg: 282, name: 'lifeboat 14 returns', amb: [{ kind: 'night', vol: 0.7 }],
  fx: { bloom: 1.1, bloomThreshold: 0.45, saturation: 0.9, tint: [0.9, 0.97, 1.12], vignette: 0.85 },
  sfx: (S) => [{ t: S.at(286), type: 'pop', pitch: 400 }, { t: S.at(288), type: 'drop', vol: 0.25 }, { t: S.at(290), type: 'hit', vol: 0.35 }, { t: S.at(291), type: 'heartbeat', n: 2, bpm: 40, vol: 0.35 }],
  build(E) {
    const st = oceanWorld({ ...GLASS, envMap: E.envMap, ship: false, fogNear: 150, fogFar: 1800 });
    st.boats = []; for (let i = 0; i < 5; i++) { const b = lifeboat({ seed: i + 10, people: 5 }); b.position.set(-40 + i * 30, 0, -40 - (i % 2) * 20); b.rotation.y = 0.3 * i; st.scene.add(b); st.boats.push(b); }
    st.b14 = lifeboat({ seed: 14, people: 7 }); st.scene.add(st.b14);
    const lowe = person({ coat: '#141a2c', hat: 'officer', mustache: true }); lowe.position.set(3.0, 0.55, 0); lowe.rotation.y = Math.PI / 2; st.b14.add(lowe); st.lowe = lowe;
    st.beam = new THREE.SpotLight(0xfff0c8, 80, 120, 0.25, 0.5, 1.2); st.b14.add(st.beam, st.beam.target); st.beam.position.set(3.5, 2, 0);
    st.bodies = []; const r = rng(4);
    for (let i = 0; i < 30; i++) { const p = new THREE.Group(); const vest = box(0.6, 0.25, 0.8, std(0xe8e4d8, { rough: 0.9 }), 0, 0.1, 0, p); void vest; sph(0.13, std(0xd8c0b0), 0, 0.15, 0.5, p, 8, 6); p.position.set(60 + r() * 120, 0, -60 + r() * 120); p.rotation.y = r() * 6; st.scene.add(p); st.bodies.push(p); }
    return st;
  },
  update(st, S) {
    const a286 = S.at(286), a293 = S.dur;
    st.b14.position.set(lerp(0, 120, easeInOut(clamp((S.lt - a286) / (a293 - a286)))), 0, 20); st.b14.rotation.y = 0;
    st.beam.target.position.set(40, -2, Math.sin(S.t * 0.8) * 20);
    st.boats.forEach((b, i) => { b.position.y = Math.sin(S.t + i) * 0.1; });
    if (S.lt < a286) track(st.camera, [[0, [-30, 4, -10], [10, 1.5, -40], 44], [a286, [-25, 3.5, -12], [15, 1.5, -40], 40]], S.lt);
    else track(st.camera, [[a286, [st.b14.position.x - 14, 4, 34], [st.b14.position.x + 10, 1, 15], 44], [S.dur, [st.b14.position.x - 12, 3.5, 30], [st.b14.position.x + 12, 0.5, 10], 42]], S.lt);
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    if (lt < S.at(284)) txt(g, 'a few hundred yards away…', W / 2, 160, { font: F.serif(52), color: '#fff', alpha: clamp(lt * 2), shadow: 20 });
    const af = lt - S.at(284);
    if (af > 0 && lt < S.at(286)) { txt(g, 'AFRAID TO GO BACK', W / 2, 160, { font: F.cond(700, 80), ls: 8, color: '#fff', alpha: clamp(af * 3), shadow: 30 }); txt(g, 'fearing desperate swimmers would swamp the boats', W / 2, 240, { font: F.serif(38), color: '#dfe8ff', alpha: clamp(af * 3 - 1), shadow: 10 }); }
    nameTag(g, 110, H - 330, 'LIFEBOAT Nº 14', 'HAROLD LOWE GOES BACK TO SEARCH', clamp((lt - S.at(286)) / 0.6) * (lt < S.at(288) ? 1 : 0));
    const tl = lt - S.at(288);
    if (tl > 0 && lt < S.at(290)) revealText(g, 'TOO LATE FOR ALMOST EVERYONE', W / 2, 170, clamp(tl / 0.6), { font: F.cond(700, 70), ls: 6, color: '#fff', shadow: 30 });
    const f = lt - S.at(290);
    if (f > 0) {
      for (let i = 0; i < 4; i++) { const dead = i === 3 && lt > S.at(291); personIcon(g, W / 2 - 180 + i * 120, 220, 2.2, dead ? 'rgba(230,57,70,0.6)' : '#ffd23f', { alpha: clamp((f - i * 0.1) * 4) }); }
      txt(g, lt > S.at(291) ? '4 PULLED ALIVE · 1 SOON DIES' : '4 PULLED FROM THE WATER ALIVE', W / 2, 340, { font: F.cond(700, 50), ls: 6, color: '#fff', alpha: clamp(f * 3), shadow: 20 });
    }
  },
});

// 293 — card
S5.push(card(293, '2 HOURS', 'AFTER THE SINKING'));

// 294 — a flare: RMS Carpathia races through the ice
S5.push({
  seg: 294, name: 'carpathia rescue', amb: [{ kind: 'night', vol: 0.5 }, { kind: 'engine', vol: 0.8 }],
  fx: { bloom: 1.2, bloomThreshold: 0.45, saturation: 1.05, tint: [0.95, 0.98, 1.08] },
  sfx: (S) => [{ t: S.find(294, /flare/), type: 'rocket', vol: 0.15 }, { t: S.at(295), type: 'shimmer', vol: 0.06, notes: [69, 72, 76, 81] }, { t: S.at(297), type: 'pop', pitch: 420 }, { t: S.at(299), type: 'riser', dur: 2.5, vol: 0.15 }, { t: S.at(301), type: 'rocket', vol: 0.18 }, { t: S.at(301) + 1.4, type: 'rocket', vol: 0.15 }, { t: 1, type: 'horn', dur: 2, vol: 0.08, far: true }],
  build(E) {
    const st = oceanWorld({ ...NIGHT, ocean: 'glass', sky: 'deepnight', envMap: E.envMap, spec: CARPATHIA, lights: 1, wake: true, fogNear: 500, fogFar: 4000, smokeOpacity: 0.6 });
    const r = rng(294); for (let i = 0; i < 40; i++) { const b = makeIceberg({ r: 3 + r() * 14, seed: 500 + i, detail: 3, ei: 0.35 }); b.position.set(-200 + r() * 1600, -2, (r() < 0.5 ? -1 : 1) * (60 + r() * 400)); st.scene.add(b); }
    st.flare = glow(0xff6040, 30, 0); st.scene.add(st.flare);
    return st;
  },
  update(st, S) {
    const fl = S.find(294, /flare/);
    st.ship.position.x = S.lt * 14; const x = st.ship.position.x;
    st.flare.position.set(x + 2500, 120, -600); st.flare.material.opacity = S.lt > fl ? 0.8 + Math.sin(S.t * 9) * 0.2 : 0;
    const a297 = S.at(297), a299 = S.at(299);
    if (S.lt < a297) track(st.camera, [[0, [x - 100, 6, 40], [x + 2500, 100, -600], 40], [a297, [x - 80, 5, 40], [x + 2500, 110, -600], 36]], S.lt);
    else if (S.lt < a299) track(st.camera, [[a297, [x + 120, 8, 90], [x + 40, 16, 0], 36], [a299, [x + 90, 7, 80], [x + 30, 16, 0], 34]], S.lt);
    else track(st.camera, [[a299, [x + 220, 3, 60], [x, 14, 0], 36], [S.dur, [x + 180, 3, 70], [x, 14, 0], 34]], S.lt, { shake: 0.2 });
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    const r = lt - S.at(295);
    if (r > 0 && lt < S.at(297)) revealText(g, 'A RESCUE SHIP IS APPROACHING', W / 2, 170, clamp(r / 0.6), { font: F.cond(700, 72), ls: 6, color: '#ffe2a0', shadow: 30 });
    nameTag(g, 110, H - 330, 'CAPTAIN ARTHUR ROSTRON', 'RMS CARPATHIA', clamp((lt - S.find(297, /Arthur/)) / 0.6) * (lt < S.at(299) ? 1 : 0));
    const m = lt - S.at(299);
    if (m > 0) {
      const x0 = W - 760, y0 = 110, w = 640, h = 400;
      g.save(); g.globalAlpha = clamp(m * 3); g.beginPath(); g.roundRect(x0, y0, w, h, 16); g.clip();
      const proj = mapProjector(w, h, { lon0: -54, lon1: -44, lat0: 39.5, lat1: 43.5 }); g.translate(x0, y0); drawMap(g, w, h, proj, { sea1: '#123050' });
      const r2 = rng(3); for (let i = 0; i < 30; i++) { const [ix, iy] = proj([-51 + r2() * 4, 41.2 + r2() * 1.6]); icebergIcon(g, ix, iy, 0.05, { under: false }); }
      const a = proj([-47.6, 40.9]), b = proj(PLACES.wreck);
      const k = clamp(m / 4); g.strokeStyle = '#ffd23f'; g.lineWidth = 4; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(...a); g.lineTo(lerp(a[0], b[0], k), lerp(a[1], b[1], k)); g.stroke(); g.setLineDash([]);
      mapPin(g, proj, [-47.6, 40.9], 'CARPATHIA', 1, { color: '#ffd23f', size: 22, dy: 26 }); mapPin(g, proj, PLACES.wreck, 'TITANIC', 1, { color: PAL.red2, size: 22, align: 'right', dx: -14 });
      g.restore();
      g.save(); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2; g.beginPath(); g.roundRect(x0, y0, w, h, 16); g.stroke(); g.restore();
      txt(g, '58 MILES · FULL SPEED THROUGH THE ICE', x0 + w / 2, y0 + h + 40, { font: F.cond(600, 30), ls: 4, color: '#fff', alpha: clamp(m * 2), shadow: 10 });
    }
  },
});

// 302 — dawn: icebergs to the horizon, tiny white lifeboats
S5.push({
  seg: 302, name: 'dawn icebergs', amb: [{ kind: 'ocean', vol: 0.5 }, { kind: 'wind', vol: 0.4 }], trans: 'fade',
  fx: { bloom: 1.0, bloomThreshold: 0.6, saturation: 1.25, contrast: 1.05 },
  sfx: (S) => [{ t: 0.3, type: 'shimmer', vol: 0.06, notes: [72, 76, 79, 84] }, { t: S.at(305), type: 'pop', pitch: 600 }, { t: S.at(307) + 0.5, type: 'horn', dur: 2.5, vol: 0.08, far: true }],
  build(E) {
    const st = oceanWorld({ sky: 'dawn', ocean: 'dawn', envMap: E.envMap, spec: CARPATHIA, fogNear: 1500, fogFar: 9000, sunDir: [-0.7, 0.05, -0.7], sunI: 1.6, smoke: true });
    st.ship.position.set(600, 0, -300); st.ship.rotation.y = 0.6;
    const r = rng(302); for (let i = 0; i < 50; i++) { const b = makeIceberg({ r: 6 + r() * 30, seed: 600 + i, detail: 3, top: '#f0dcd8', side: '#c8a0c0', under: '#4a7ab0', glow: '#2a1a3a', ei: 0.15 }); const a = r() * Math.PI - 0.2, d = 200 + r() * 2500; b.position.set(Math.cos(a) * d, -3, -Math.sin(a) * d); st.scene.add(b); }
    st.lbs = []; for (let i = 0; i < 9; i++) { const b = lifeboat({ seed: i + 40, people: 6, lantern: false }); b.position.set(-200 + r() * 700, 0, -100 - r() * 400); b.rotation.y = r() * 6; st.scene.add(b); st.lbs.push(b); }
    return st;
  },
  update(st, S) {
    const a305 = S.at(305);
    if (S.lt < a305) track(st.camera, [[0, [0, 30, 300], [0, 20, -800], 50], [a305, [0, 40, 260], [100, 10, -600], 46]], S.lt);
    else track(st.camera, [[a305, [0, 80, 200], [0, 0, -260], 40], [S.dur, [80, 50, 160], [100, 0, -280], 38]], S.lt);
    st.lbs.forEach((b, i) => (b.position.y = Math.sin(S.t * 0.8 + i) * 0.2));
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    typedLine(g, 'DAWN · 15 APRIL 1912', 110, 120, lt / 0.8, { font: F.cond(600, 46), ls: 8, color: '#fff', shadow: 20 });
    const a = lt - S.at(304);
    if (a > 0 && lt < S.at(305)) revealText(g, 'ICEBERGS TO THE HORIZON', W / 2, 180, clamp(a / 0.6), { font: F.cond(700, 76), ls: 8, color: '#fff', shadow: 30 });
    const b = lt - S.at(306);
    if (b > 0) { const p = toScreen(st.lbs[3].getWorldPosition(new THREE.Vector3()), st.camera); callout(g, p[0] + 140, p[1] - 160, p[0], p[1], 'TITANIC’S LIFEBOATS', '705 survivors are picked up', clamp(b / 0.8)); }
  },
});

// 308 — card
S5.push(card(308, '3 DAYS', 'AFTER THE COLLISION'));

// 309 — New York, pouring rain, 30,000 silent people
S5.push({
  seg: 309, name: 'new york pier rain', amb: [{ kind: 'rain', vol: 1.2 }, { kind: 'city', vol: 0.4 }], trans: 'fade',
  fx: { bloom: 1.0, bloomThreshold: 0.5, saturation: 0.9, tint: [0.92, 0.97, 1.08], vignette: 0.8 },
  sfx: (S) => [{ t: 0.2, type: 'type', n: 16, vol: 0.14 }, { t: S.at(310) + 1, type: 'horn', dur: 3, vol: 0.1, far: true }, { t: S.find(311, /30,000/), type: 'hit', vol: 0.35 }],
  build(E) {
    const st = oceanWorld({ sky: 'storm', ocean: 'river', envMap: E.envMap, spec: CARPATHIA, lights: 1, fogColor: '#1a2028', fogNear: 60, fogFar: 900, sunI: 0.3, hemi: 0.4, smoke: true });
    st.sky.userData.uniforms.top.value.set('#05070a'); st.sky.userData.uniforms.mid.value.set('#0e1218'); st.sky.userData.uniforms.hor.value.set('#1a2028');
    const pier = box(400, 4, 60, std(0x3a3a3e, { rough: 0.3, metal: 0.2 }), 0, 1, -60, st.scene); pier.receiveShadow = true;
    const shed = box(380, 18, 30, std(0x4a4040, { rough: 0.8 }), 0, 12, -80, st.scene); void shed;
    for (let i = 0; i < 20; i++) { const l = glow(0xffd8a0, 8, 0.9); l.position.set(-180 + i * 19, 14, -63); st.scene.add(l); const pl = new THREE.PointLight(0xffc880, 15, 40, 1.6); pl.position.copy(l.position); st.scene.add(pl); }
    terraces(st.scene, { n: 30, rows: 2, x: 0, z: -200, h: 40, spacing: 14, lit: true, brick: '#3a3a40', seed: 30 });
    const r = rng(309); const spots = [];
    for (let i = 0; i < 1600; i++) spots.push({ x: -190 + r() * 380, y: 3, z: -35 - r() * 26, ry: Math.PI + (r() - 0.5) * 0.4 });
    st.crowd = crowd(spots, { hats: 0.95, seed: 31, palette: ['#111', '#1a1a1e', '#22242a', '#2a2620', '#151515'] }); st.scene.add(st.crowd);
    // umbrellas
    const um = new THREE.InstancedMesh(new THREE.ConeGeometry(0.6, 0.3, 8), std(0x0a0a0a, { rough: 0.4 }), 500); const m4 = new THREE.Matrix4();
    for (let i = 0; i < 500; i++) { const s = spots[i * 3]; m4.makeTranslation(s.x, s.y + 2.0, s.z); um.setMatrixAt(i, m4); } st.scene.add(um);
    st.rain = particles(3000, (i, t) => { const q = rng(i + 5); return [q() * 200 - 100, ((q() * 60 - t * 30) % 60 + 60) % 60, q() * 120 - 60]; }, { size: 0.12, color: 0xaabbd0, opacity: 0.55 }); st.scene.add(st.rain);
    return st;
  },
  update(st, S) {
    st.ship.position.set(lerp(-250, -60, easeOut(clamp(S.lt / S.dur))), 0, 40);
    track(st.camera, [[0, [60, 9, -20], [-100, 8, 30], 44], [S.dur, [50, 8, -24], [-60, 8, 30], 40]], S.lt);
    st.rain.position.set(st.camera.position.x - 30, 0, st.camera.position.z); st.rain.userData.update(S.t);
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    typedLine(g, '18 APRIL 1912', 110, H - 330, lt / 0.7, { font: F.cond(700, 72), ls: 6, color: '#fff', shadow: 20 });
    typedLine(g, 'NEW YORK · PIER 54', 112, H - 266, (lt - 0.6) / 0.9, { font: F.cond(400, 34), ls: 12, color: '#ffd23f', shadow: 10 });
    const c = lt - S.find(311, /30,000/);
    if (c > 0) counter(g, W / 2, 190, 30000, 'PEOPLE WAIT IN SILENCE', clamp(c / 1.2), { size: 130 });
    const f = lt - S.at(313);
    if (f > 0) txt(g, 'hoping for a miracle', W / 2, H - 250, { font: F.serif(48), color: '#fff', alpha: clamp(f * 2), shadow: 20 });
  },
});

// 314 — of 2,224, only 705 return
S5.push(dark({
  seg: 314, name: 'survivors 705', c1: '#1a0508', c2: '#030102',
  sfx: (S) => [{ t: S.find(314, /2,224/), type: 'hit', vol: 0.35 }, { t: S.find(315, /705/), type: 'boom', vol: 0.5 }, { t: S.at(316), type: 'drop', vol: 0.3 }],
  paint(st, g, S) {
    const { W, H, lt } = S;
    const a = lt - S.find(314, /2,224/), b = lt - S.find(315, /705/), c = lt - S.at(316);
    const cols = 74, total = 2224, per = 1; void per;
    // 1 icon = 1 person, small dots grid
    const size = 11, gap = 21;
    const x0 = W / 2 - (cols - 1) * gap / 2, y0 = 300;
    for (let i = 0; i < total; i++) {
      const x = x0 + (i % cols) * gap, y = y0 + Math.floor(i / cols) * gap;
      const k = clamp((a - i * 0.0004) / 0.2); if (k <= 0) continue;
      let col = '#dfe8ff';
      if (b > 0) col = i < 705 ? '#ffd23f' : `rgba(200,40,50,${lerp(1, 0.35, clamp(b / 1.5))})`;
      g.globalAlpha = k; g.fillStyle = col; g.beginPath(); g.arc(x, y, size / 2, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    counter(g, W / 2 - 450, 150, 2224, 'ABOARD', clamp(a / 0.8), { size: 100 });
    if (b > 0) counter(g, W / 2, 150, 705, 'RETURN', clamp(b / 0.8), { size: 100, color: '#ffd23f' });
    if (c > 0) counter(g, W / 2 + 450, 150, 1500, 'LIVES LOST', clamp(c / 1.0), { size: 100, color: PAL.red2, suffix: '+' });
  },
}));

// 317 — the world is stunned: black headlines
S5.push({
  seg: 317, name: 'headlines', amb: { kind: 'city', vol: 0.5 }, trans: 'whip',
  fx: { vignette: 0.6, grain: 0.07 },
  sfx: (S) => [{ t: 0, type: 'whoosh', vol: 0.3 }, { t: 0.6, type: 'stamp', vol: 0.5 }, { t: S.at(318) + 0.3, type: 'stamp', vol: 0.5 }, { t: S.at(319) + 0.2, type: 'stamp', vol: 0.5 }, { t: S.find(321, /Faith/), type: 'glass', vol: 0.3 }, { t: S.find(323, /devastating/), type: 'boom', vol: 0.5 }],
  draw(st, g, S) {
    const { W, H, lt } = S;
    const gr = g.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.7); gr.addColorStop(0, '#2a2420'); gr.addColorStop(1, '#050403'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const fa = S.find(321, /Faith/);
    if (lt < fa) {
      const papers = [[0, ['TITANIC SINKS', 'FOUR HOURS AFTER', 'HITTING ICEBERG'], 'THE MORNING GAZETTE', -0.08, -420], [S.at(318) + 0.3, ['1,500 LOST', 'IN THE ATLANTIC'], 'THE EVENING STANDARD-POST', 0.06, 0], [S.at(319) + 0.2, ['GREATEST SHIP', 'GOES DOWN ON', 'MAIDEN VOYAGE'], 'THE DAILY CHRONICLE', -0.03, 420]];
      papers.forEach(([t0, hl, mast, rot, dx], i) => { const k = easeOut(clamp((lt - t0) / 0.6)); if (k <= 0) return; newspaper(g, W / 2 + dx, H / 2 + 20, 480, hl, { rot: rot + (1 - k) * 8, scale: 0.1 + 0.9 * k, masthead: mast, seed: i + 2 }); });
    } else {
      const k = lt - fa;
      const word = 'FAITH IN TECHNOLOGY';
      txt(g, word, W / 2, H / 2 - 40, { font: F.cond(700, 130), ls: 10, color: '#dfe8ff', alpha: clamp(k * 3) });
      const sh = lt - S.find(323, /devastating/);
      if (sh > 0) {
        g.save(); g.strokeStyle = '#fff'; g.lineWidth = 3; const r = rng(3);
        for (let i = 0; i < 14; i++) { let x = W / 2 + (r() - 0.5) * 200, y = H / 2 - 40; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 6; s++) { x += (r() - 0.5) * 160 * clamp(sh * 3); y += (r() - 0.5) * 120 * clamp(sh * 3); g.lineTo(x, y); } g.stroke(); }
        g.restore();
        g.fillStyle = `rgba(0,0,0,${0.5 * clamp(sh)})`; g.fillRect(0, 0, W, H);
        txt(g, 'A DEVASTATING BLOW', W / 2, H / 2 + 130, { font: F.cond(700, 70), ls: 10, color: PAL.red2, alpha: clamp(sh * 3), shadow: 20 });
      }
      txt(g, '…and in humanity’s mastery of nature', W / 2, H / 2 + 60, { font: F.serif(44), color: '#fff', alpha: clamp((lt - S.at(322)) * 2) * (lt < S.find(323, /devastating/) ? 1 : 0.3) });
    }
  },
});

// 324 — Ismay branded a coward
S5.push({
  seg: 324, name: 'ismay coward', amb: [{ kind: 'rain', vol: 0.7 }, { kind: 'dark', vol: 0.6 }],
  fx: { bloom: 0.7, bloomThreshold: 0.5, saturation: 0.6, contrast: 1.2, vignette: 0.9 },
  sfx: (S) => [{ t: S.find(325, /condemnation/), type: 'stamp', vol: 0.5 }, { t: S.find(327, /coward/), type: 'boom', vol: 0.5 }],
  build(E) {
    const st = roomWorld({ w: 6, d: 5, h: 3, panel: true, wall: '#2a2a30', floor: 'wood', floorColor: '#2a1a10', keyI: 14, keyPos: [0, 2.9, 0.5], hemi: 0.1 }, E);
    const ismay = person({ coat: '#101218', hair: '#1a1410', mustache: true }); pose.sit(ismay); ismay.position.set(0, 0, 0); ismay.rotation.y = 0; st.scene.add(ismay); st.ismay = ismay;
    const ch = box(0.6, 0.5, 0.6, std(0x3a1a10), 0, 0.25, -0.1, st.scene); void ch;
    return st;
  },
  update(st, S) { track(st.camera, [[0, [0, 1.6, 3.4], [0, 1.1, 0], 36], [S.dur, [0, 1.4, 2.2], [0, 1.15, 0], 30]], S.lt); st.ismay.userData.head.rotation.x = 0.35; st.ismay.userData.armL.rotation.x = -0.6; st.ismay.userData.armR.rotation.x = -0.6; },
  draw(st, g, S) {
    const { W, H, lt } = S;
    nameTag(g, 110, H - 330, 'J. BRUCE ISMAY', 'ESCAPED IN A LIFEBOAT', clamp((lt - 0.2) / 0.6) * (lt < S.at(326) ? 1 : 0));
    const words = ['COWARD', 'J. “BRUTE” ISMAY', 'SHAME', 'WOMEN AND CHILDREN DIED', 'WHY DID HE LIVE?'];
    const k = lt - S.find(325, /condemnation/);
    words.forEach((w, i) => { const t = clamp((k - i * 0.5) / 0.2); if (t <= 0) return; const x = W / 2 + ((i * 541) % 1100) - 550, y = 160 + ((i * 337) % 620); g.save(); g.translate(x, y); g.rotate(((i * 13) % 9 - 4) * 0.04); g.scale(1 + 0.4 * (1 - t), 1 + 0.4 * (1 - t)); g.globalAlpha = t * 0.9; g.strokeStyle = PAL.red2; g.lineWidth = 6; const tw = measure(g, w, F.cond(700, 60), 4) + 50; roundRect(g, -tw / 2, -48, tw, 96, 8); g.stroke(); txt(g, w, 0, 0, { font: F.cond(700, 60), ls: 4, color: PAL.red2 }); g.restore(); });
    const c = lt - S.find(327, /coward/);
    if (c > 0) { g.fillStyle = `rgba(0,0,0,${0.4 * clamp(c)})`; g.fillRect(0, 0, W, H); revealText(g, 'BRANDED A COWARD — FOR LIFE', W / 2, H - 230, clamp(c / 0.6), { font: F.cond(700, 72), ls: 6, color: '#fff', shadow: 30 }); }
  },
});

// 329 — card
S5.push(card(329, '1 MONTH', 'AFTER THE COLLISION'));

// 330 — inquiries on both sides of the Atlantic
function flagUS(g, x, y, w) { const h = w * 0.53; g.save(); g.translate(x, y); for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#fff' : '#b22234'; g.fillRect(0, (i * h) / 13, w, h / 13 + 0.5); } g.fillStyle = '#3c3b6e'; g.fillRect(0, 0, w * 0.4, h * 7 / 13); g.fillStyle = '#fff'; for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) { g.beginPath(); g.arc(8 + c * w * 0.065, 8 + r * h * 0.1, 2.5, 0, 7); g.fill(); } g.restore(); }
function flagUK(g, x, y, w) { const h = w * 0.5; g.save(); g.translate(x, y); g.fillStyle = '#012169'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = h * 0.2; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke(); g.strokeStyle = '#c8102e'; g.lineWidth = h * 0.07; g.stroke(); g.fillStyle = '#fff'; g.fillRect(w * 0.42, 0, w * 0.16, h); g.fillRect(0, h * 0.34, w, h * 0.32); g.fillStyle = '#c8102e'; g.fillRect(w * 0.45, 0, w * 0.1, h); g.fillRect(0, h * 0.4, w, h * 0.2); g.restore(); }
S5.push(paper({
  seg: 330, name: 'inquiries', bg: { swooshColor: 'rgba(20,40,90,0.12)' },
  sfx: (S) => [{ t: S.find(330, /inquiries/), type: 'gavel', n: 2 }, { t: S.find(332, /negligence/), type: 'stamp', vol: 0.4 }, { t: S.find(332, /outdated/), type: 'stamp', vol: 0.4 }, { t: S.find(333, /chain/), type: 'stamp', vol: 0.45 }, { t: S.at(334), type: 'whoosh', vol: 0.2 }, { t: S.find(335, /tonnage/), type: 'clank', vol: 0.2, pitch: 0.6 }],
  paint(st, g, S) {
    const { W, H, lt } = S;
    const a334 = S.at(334);
    if (lt < a334) {
      const k = easeOut(clamp(lt / 0.6));
      txt(g, 'OFFICIAL INQUIRIES', W / 2, 140, { font: F.cond(700, 80), ls: 10, color: PAL.ink, alpha: k });
      g.save(); g.globalAlpha = clamp((lt - S.find(331, /United/)) * 3); g.shadowColor = 'rgba(0,0,0,0.3)'; g.shadowBlur = 20; flagUS(g, W / 2 - 520, 230, 300); g.restore();
      txt(g, 'U.S. SENATE', W / 2 - 370, 420, { font: F.cond(600, 36), ls: 6, color: PAL.ink, alpha: clamp((lt - S.find(331, /United/)) * 3) });
      g.save(); g.globalAlpha = clamp((lt - S.find(331, /Britain/)) * 3); g.shadowColor = 'rgba(0,0,0,0.3)'; g.shadowBlur = 20; flagUK(g, W / 2 + 220, 230, 300); g.restore();
      txt(g, 'BRITISH WRECK COMMISSIONER', W / 2 + 370, 420, { font: F.cond(600, 30), ls: 4, color: PAL.ink, alpha: clamp((lt - S.find(331, /Britain/)) * 3) });
      [[332, /negligence/, 'NEGLIGENCE'], [332, /outdated/, 'OUTDATED RULES'], [333, /chain/, 'A CHAIN OF FATAL CIRCUMSTANCES']].forEach(([seg, re, label], i) => { const t = lt - S.find(seg, re); if (t < 0) return; const sc = 1 + 0.5 * (1 - easeOut(clamp(t / 0.2))); g.save(); g.translate(W / 2, 560 + i * 120); g.rotate((i - 1) * 0.02); g.scale(sc, sc); g.globalAlpha = clamp(t * 5); g.strokeStyle = PAL.red; g.lineWidth = 6; const tw = measure(g, label, F.cond(700, 62), 6) + 60; roundRect(g, -tw / 2, -48, tw, 96, 8); g.stroke(); txt(g, label, 0, 2, { font: F.cond(700, 62), ls: 6, color: PAL.red }); g.restore(); });
    } else {
      const k = lt - a334;
      revealText(g, 'LIFEBOAT REQUIREMENTS WERE BASED ON', W / 2, 150, clamp(k / 0.8), { font: F.cond(600, 50), ls: 4, color: PAL.ink });
      const t1 = lt - S.find(335, /tonnage/), t2 = lt - S.find(336, /people/);
      const tilt = t2 > 0 ? 0.0 : t1 > 0 ? -0.0 : 0;
      void tilt;
      g.save(); g.globalAlpha = clamp(k * 2) * (t1 > 0 ? 1 : 0.45); card2(g, W / 2 - 420, 520, 'SHIP TONNAGE', '46,328 GRT', '#3a3a3a'); g.restore();
      g.save(); g.globalAlpha = clamp(k * 2 - 0.3) * (t2 > 0 ? 1 : 0.45); card2(g, W / 2 + 420, 520, 'PEOPLE ABOARD', '2,224', PAL.red); g.restore();
      txt(g, 'VS', W / 2, 520, { font: F.cond(700, 60), color: '#999', alpha: clamp(k * 2) });
      if (t1 > 0) check(g, W / 2 - 420, 380, 60, PAL.green, clamp(t1 / 0.4));
      if (t2 > 0) { cross(g, W / 2 + 420, 380, 70, PAL.red, clamp(t2 / 0.4)); txt(g, 'not the number of people', W / 2, H - 200, { font: F.serif(52, true, 800), color: PAL.red, alpha: clamp(t2 * 2) }); }
    }
  },
}));
function card2(g, x, y, label, value, col) { g.save(); g.shadowColor = 'rgba(0,0,0,0.25)'; g.shadowBlur = 30; g.shadowOffsetY = 12; g.fillStyle = '#fff'; roundRect(g, x - 280, y - 110, 560, 220, 18); g.fill(); g.restore(); txt(g, label, x, y - 40, { font: F.cond(500, 34), ls: 8, color: '#666' }); txt(g, value, x, y + 30, { font: F.cond(700, 86), color: col }); }

// 337 — SOLAS & the International Ice Patrol
S5.push(dark({
  seg: 337, name: 'solas', c1: '#0c2a3a', c2: '#02080c',
  sfx: (S) => [{ t: S.find(338, /SOLAS/), type: 'boom', vol: 0.4 }, ...[339, 340, 341, 343].map((s) => ({ t: S.at(s), type: 'pop', pitch: 500 + s })), { t: S.at(343), type: 'sonar', vol: 0.08 }],
  paint(st, g, S) {
    const { W, H, lt } = S;
    txt(g, 'INTERNATIONAL CONVENTION FOR THE', W / 2, 110, { font: F.cond(400, 34), ls: 10, color: '#9fd0e8', alpha: clamp(lt * 2) });
    txt(g, 'SAFETY OF LIFE AT SEA', W / 2, 175, { font: F.cond(700, 70), ls: 8, color: '#fff', alpha: clamp(lt * 2) });
    const so = lt - S.find(338, /SOLAS/);
    if (so > 0) { const sc = 1 + 0.4 * (1 - easeOut(clamp(so / 0.3))); g.save(); g.translate(W / 2, 290); g.scale(sc, sc); txt(g, 'S·O·L·A·S  1914', 0, 0, { font: F.cond(700, 100), ls: 16, color: '#ffd23f', shadow: 30, alpha: clamp(so * 4) }); g.restore(); }
    const rules = [[339, 'LIFEBOATS FOR EVERYONE ABOARD'], [340, '24-HOUR WIRELESS WATCH'], [341, 'SAFETY WARNINGS BEFORE PASSENGER MESSAGES'], [343, 'INTERNATIONAL ICE PATROL']];
    rules.forEach(([seg, label], i) => { const k = lt - S.at(seg); if (k < 0) return; const y = 460 + i * 120; g.save(); g.globalAlpha = clamp(k * 3); g.fillStyle = 'rgba(255,255,255,0.06)'; roundRect(g, W / 2 - 640, y - 46, 1280, 92, 14); g.fill(); g.restore(); check(g, W / 2 - 570, y, 46, PAL.green, clamp(k / 0.4)); revealText(g, label, W / 2 - 510, y, clamp(k / 0.5), { font: F.cond(600, 50), align: 'left', ls: 4, color: '#fff' }); });
    const ip = lt - S.at(343);
    if (ip > 0) radioWaves(g, W - 220, H - 160, lt, '#9fe3ff', { both: true, r: 160, alpha: clamp(ip * 2) });
  },
}));

// 345 — paid with their lives for the safety of generations
S5.push({
  seg: 345, name: 'wreath at sea', amb: [{ kind: 'ocean', vol: 0.5 }], trans: 'fade',
  fx: { bloom: 1.0, bloomThreshold: 0.6, saturation: 1.1, contrast: 1.05 },
  sfx: (S) => [{ t: 0.4, type: 'melody', instr: 'piano', vol: 0.05, beat: 0.55, notes: [[64, 0, 2], [62, 2, 1], [60, 3, 1], [60, 4, 2], [57, 6, 2], [55, 8, 4]] }],
  build(E) {
    const st = oceanWorld({ sky: 'dawn', ocean: 'dawn', envMap: E.envMap, ship: false, sunDir: [-0.5, 0.06, -0.85], fogNear: 300, fogFar: 4000 });
    const w = new THREE.Group(); st.scene.add(w); st.wreath = w;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.3, 12, 40), std(0x2a5a2a, { rough: 0.9 })); ring.rotation.x = Math.PI / 2; w.add(ring);
    const r = rng(5); for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2; const f = sph(0.14, std([0xc8102e, 0xf2f2f2, 0xd8a24a][i % 3], { rough: 0.7 }), Math.cos(a) * 1.2, 0.22, Math.sin(a) * 1.2, w, 8, 6); f.scale.setScalar(0.8 + r() * 0.5); }
    const rib = box(0.6, 0.02, 1.6, std(0xffffff), 0, 0.2, 1.4, w); rib.rotation.y = 0.3;
    return st;
  },
  update(st, S) { st.wreath.position.set(0, 0.3 + Math.sin(S.t * 0.9) * 0.08, 0); st.wreath.rotation.y = S.t * 0.04; track(st.camera, [[0, [0, 2.2, 5.5], [0, 0.2, 0], 40], [S.dur, [0, 5, 9], [0, 0.2, 0], 40]], S.lt); st.tick(S); },
  draw(st, g, S) { revealText(g, 'they paid with their lives', S.W / 2, 170, clamp(S.lt / 1.0), { font: F.serif(60), color: '#fff', shadow: 20, style: 'blur' }); revealText(g, 'FOR THE SAFETY OF GENERATIONS TO COME', S.W / 2, 260, clamp((S.lt - S.at(346)) / 0.9), { font: F.cond(600, 50), ls: 6, color: '#ffe2a0', shadow: 20 }); },
});

// 347 — card
S5.push(card(347, '114 YEARS', 'LATER', { def: { out: undefined } }));

// 348 — the wreck today
function wreckWorld(E) {
  const st = underwaterWorld({ color: '#03141f', density: 0.0075, hemi: 1.5, bedY: 0, lampI: 260 }, E);
  const fill = new THREE.DirectionalLight(0x6aaad8, 2.2); fill.position.set(100, 200, 120); st.scene.add(fill);
  const rust = rustMat({ repeat: [14, 2] }), rust2 = rustMat({ base: '#7a4a30', seed: 4, repeat: [6, 6] });
  const bow = buildLiner({ spec: { ...TITANIC, funnels: [], boats: { fore: [], aft: [] }, masts: [] }, range: [-10, L / 2], detail: 'low' });
  bow.traverse((m) => { if (m.isMesh) m.material = m.material.color && m.material.color.getHex() === 0xf1eee6 ? rust2 : rust; });
  bow.position.set(0, 4, 0); bow.rotation.set(0.02, 0.3, -0.03); st.scene.add(bow);
  // rusticles hanging from the bow rail
  const rg = new THREE.ConeGeometry(0.25, 1.6, 6); rg.rotateX(Math.PI);
  const ru = new THREE.InstancedMesh(rg, std(0x8a3a14, { rough: 1 }), 400); const m4 = new THREE.Matrix4(); const r = rng(77);
  for (let i = 0; i < 400; i++) { const x = -5 + r() * 140; const hb = bow.userData.hb(x); const side = r() < 0.5 ? -1 : 1; m4.makeTranslation(x, 14 + r() * 1.5, side * hb * 0.98); ru.setMatrixAt(i, m4); }
  bow.add(ru);
  // stern debris field
  const stern = new THREE.Group(); stern.position.set(-260, 0, 60); st.scene.add(stern);
  for (let i = 0; i < 60; i++) { const b = box(2 + r() * 14, 1 + r() * 6, 2 + r() * 10, r() < 0.5 ? rust : rust2, (r() - 0.5) * 60, r() * 8, (r() - 0.5) * 40, stern); b.rotation.set(r() * 0.8, r() * 3, r() * 0.8); }
  // plates, bench, shoes
  const props = new THREE.Group(); props.position.set(-60, 0, 30); st.scene.add(props);
  const plate = std(0xf2f0e8, { rough: 0.25 }), rim = std(0x2a4a8a);
  for (let i = 0; i < 9; i++) { const p = cyl(0.13, 0.11, 0.02, plate, (i % 3) * 0.32 + r() * 0.1, 0.05 + i * 0.012, Math.floor(i / 3) * 0.35, props, 20); p.rotation.set(r() * 0.3, 0, r() * 0.3); const rr = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.008, 4, 24), rim); rr.rotation.x = Math.PI / 2; rr.position.copy(p.position).setY(p.position.y + 0.012); props.add(rr); }
  const bench = new THREE.Group(); bench.position.set(4, 0, 0); props.add(bench); const bronze = std(0x5a6a3a, { metal: 0.6, rough: 0.6 });
  for (const x of [-0.8, 0.8]) { box(0.06, 0.45, 0.5, bronze, x, 0.25, 0, bench); box(0.06, 0.5, 0.06, bronze, x, 0.7, -0.24, bench); const arm = box(0.06, 0.06, 0.5, bronze, x, 0.55, 0, bench); void arm; }
  const shoes = new THREE.Group(); shoes.position.set(1.5, 0, 2); props.add(shoes); const leather = std(0x2a1a10, { rough: 0.7 });
  for (const [x, z, ry] of [[0, 0, 0.1], [0.14, 0.02, -0.05], [0.6, 0.3, 0.8], [0.72, 0.36, 0.7]]) { const s = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.18, 4, 8), leather); s.rotation.set(Math.PI / 2, 0, ry); s.position.set(x, 0.05, z); shoes.add(s); const heel = box(0.08, 0.1, 0.06, leather, x, 0.08, z - 0.1, shoes); void heel; }
  Object.assign(st, { bow, stern, props, plates: props, bench, shoes });
  return st;
}
S5.push({
  seg: 348, name: 'wreck today', amb: [{ kind: 'underwater', vol: 1.0 }], trans: 'fade',
  fx: { exposure: 1.6,  bloom: 0.8, bloomThreshold: 0.5, saturation: 1.15, contrast: 1.1, vignette: 0.85 },
  sfx: (S) => [{ t: 0.3, type: 'sonar', vol: 0.08 }, { t: 4, type: 'sonar', vol: 0.06 }, { t: S.at(350), type: 'hit', vol: 0.25 }, { t: S.at(352), type: 'pop', pitch: 300 }, { t: S.at(354), type: 'drop', vol: 0.2 }],
  build: (E) => wreckWorld(E),
  update(st, S) {
    const a350 = S.at(350), a351 = S.at(351), a352 = S.at(352), a353 = S.at(353), a354 = S.at(354);
    const pp = st.props.position; const sh = st.shoes.getWorldPosition(new THREE.Vector3()); const be = st.bench.getWorldPosition(new THREE.Vector3());
    if (S.lt < a350) track(st.camera, [[0, [175, 45, 90], [100, 8, 0], 50], [a350, [165, 25, 60], [110, 8, 0], 46]], S.lt);
    else if (S.lt < a351) track(st.camera, [[a350, [160, 14, 30], [130, 6, 0], 46], [a351, [150, 10, 26], [130, 4, 0], 44]], S.lt);
    else if (S.lt < a352) track(st.camera, [[a351, [-220, 30, 120], [-260, 4, 60], 48], [a352, [-230, 24, 110], [-260, 4, 60], 46]], S.lt);
    else if (S.lt < a353) track(st.camera, [[a352, [pp.x + 1.6, 1.4, pp.z + 2.0], [pp.x + 0.3, 0, pp.z + 0.3], 44], [a353, [pp.x + 1.2, 1.1, pp.z + 1.6], [pp.x + 0.3, 0, pp.z + 0.3], 40]], S.lt);
    else if (S.lt < a354) track(st.camera, [[a353, [be.x + 2.4, 1.4, be.z + 2.2], [be.x, 0.4, be.z], 40], [a354, [be.x + 2.0, 1.2, be.z + 2.0], [be.x, 0.4, be.z], 36]], S.lt);
    else track(st.camera, [[a354, [sh.x + 1.4, 0.9, sh.z + 1.4], [sh.x + 0.3, 0.05, sh.z + 0.15], 36], [S.dur, [sh.x + 0.9, 0.6, sh.z + 0.9], [sh.x + 0.3, 0.05, sh.z + 0.15], 30]], S.lt);
    st.lamp.position.copy(st.camera.position).add(new THREE.Vector3(0, 4, 0)); const d = new THREE.Vector3(); st.camera.getWorldDirection(d); st.lamp.target.position.copy(st.camera.position).add(d.multiplyScalar(20));
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    if (lt < S.at(350)) { const k = lt; txt(g, `${Math.round(12500 * easeOut(clamp(k / 2.5))).toLocaleString('en-US')} FT`, W - 140, 160, { font: F.cond(700, 90), align: 'right', color: '#9fe3ff', shadow: 20 }); txt(g, '≈ 3,800 M BELOW THE SURFACE', W - 140, 230, { font: F.cond(500, 30), ls: 6, align: 'right', color: '#fff', alpha: clamp(k * 2 - 1) }); }
    const labels = [[350, 'THE BOW', 'buried deep in the sediment'], [351, 'THE STERN', 'wrecked almost beyond recognition'], [352, 'PORCELAIN PLATES', 'still lying on the seabed'], [353, 'BRONZE BENCHES', 'the wooden slats long gone'], [354, 'PAIRS OF SHOES', 'where victims came to rest']];
    labels.forEach(([seg, a, b], i) => { const t0 = S.at(seg), t1 = labels[i + 1] ? S.at(labels[i + 1][0]) : S.dur + 1; if (lt >= t0 && lt < t1) nameTag(g, 110, H - 330, a, b.toUpperCase(), clamp((lt - t0) / 0.6), { accent: '#9fe3ff', roleColor: '#9fe3ff' }); });
    const bo = lt - S.at(355);
    if (bo > 0) { revealText(g, 'the bones are long gone', W / 2, 160, clamp(bo / 0.8), { font: F.serif(52), color: '#fff', shadow: 20, style: 'blur' }); if (lt > S.at(356)) revealText(g, 'but the leather survives', W / 2, 240, clamp((lt - S.at(356)) / 0.8), { font: F.serif(52, true, 800), color: '#ffe2a0', shadow: 20, style: 'blur' }); }
  },
});

// 358 — a memorial; rusticles; Halomonas titanicae; collapse
S5.push({
  seg: 358, name: 'memorial rusticles', amb: [{ kind: 'underwater', vol: 1.0 }],
  fx: { exposure: 1.6,  bloom: 0.8, bloomThreshold: 0.5, saturation: 1.2, contrast: 1.1, vignette: 0.85 },
  sfx: (S) => [{ t: 0.3, type: 'bell', freq: 520, n: 1, vol: 0.08, decay: 2 }, { t: S.at(361), type: 'bubbles', n: 20, dur: 2, vol: 0.06 }, { t: S.at(364), type: 'creak', dur: 4, vol: 0.18 }, { t: S.at(366), type: 'boom', vol: 0.3 }],
  build: (E) => wreckWorld(E),
  update(st, S) {
    const a361 = S.at(361), a364 = S.at(364);
    if (S.lt < a361) track(st.camera, [[0, [170, 22, 40], [128, 14, 0], 40], [a361, [165, 20, 34], [128, 15, 0], 34]], S.lt);
    else if (S.lt < a364) track(st.camera, [[a361, [60, 17, 18], [60, 14.5, 13], 30], [a364, [60, 16.5, 17], [60, 14.5, 13], 22]], S.lt);
    else { const k = clamp((S.lt - a364) / (S.dur - a364)); st.bow.rotation.z = -0.03 - k * 0.02; st.bow.position.y = 4 - k * 2; track(st.camera, [[a364, [230, 40, 160], [60, 8, 0], 46], [S.dur, [250, 46, 170], [60, 6, 0], 46]], S.lt, { shake: 0.1 * k }); }
    st.lamp.position.copy(st.camera.position).add(new THREE.Vector3(0, 4, 0)); const d = new THREE.Vector3(); st.camera.getWorldDirection(d); st.lamp.target.position.copy(st.camera.position).add(d.multiplyScalar(20));
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    if (lt < S.at(360)) { revealText(g, 'AN UNDERWATER MEMORIAL', W / 2, 160, clamp(lt / 0.7), { font: F.cond(700, 70), ls: 8, color: '#fff', shadow: 30 }); if (lt > S.at(359)) txt(g, 'a mass grave that deserves respect', W / 2, 240, { font: F.serif(44), color: '#ffe2a0', alpha: clamp((lt - S.at(359)) * 2), shadow: 20 }); }
    const b = lt - S.at(361);
    if (b > 0 && lt < S.at(364)) {
      const cx = W - 420, cy = H / 2 - 20, R = 280;
      g.save(); g.globalAlpha = clamp(b * 3); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.clip(); g.fillStyle = '#1a0e08'; g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      const r = rng(5); for (let i = 0; i < 120; i++) { const x = cx + (r() - 0.5) * 2 * R, y = cy + (r() - 0.5) * 2 * R, a = r() * 6; g.save(); g.translate(x + Math.sin(lt + i) * 4, y + Math.cos(lt * 0.8 + i) * 4); g.rotate(a); g.fillStyle = `rgba(${200 + r() * 55},${100 + r() * 60},40,0.85)`; g.beginPath(); g.roundRect(-14, -5, 28, 10, 5); g.fill(); g.restore(); }
      g.restore();
      g.save(); g.strokeStyle = '#ffb060'; g.lineWidth = 6; g.globalAlpha = clamp(b * 3); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke(); g.restore();
      txt(g, 'HALOMONAS TITANICAE', cx, cy + R + 50, { font: F.cond(700, 44), ls: 4, color: '#ffb060', alpha: clamp(b * 3) });
      txt(g, 'bacteria that eat the steel', cx, cy + R + 100, { font: F.serif(34), color: '#fff', alpha: clamp(b * 3 - 1) });
      const ru = lt - S.find(363, /rusticles/);
      if (ru > 0) txt(g, '→ “RUSTICLES”', 360, H / 2, { font: F.cond(700, 64), ls: 6, color: '#ffb060', alpha: clamp(ru * 3), shadow: 20, align: 'left' });
    }
    const c = lt - S.at(364);
    if (c > 0) {
      const x0 = 200, x1 = W - 200, y = H - 220;
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x0, y - 2, x1 - x0, 4);
      [[1912, 'SINKS'], [1985, 'FOUND'], [2026, 'TODAY'], [2050, 'COLLAPSE?']].forEach(([yr, lab], i) => { const x = lerp(x0, x1, (yr - 1912) / (2060 - 1912)); const k = clamp((c - i * 0.4) / 0.4); g.globalAlpha = k; g.fillStyle = i === 3 ? PAL.red2 : '#fff'; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); txt(g, String(yr), x, y - 40, { font: F.cond(700, 40), color: i === 3 ? PAL.red2 : '#fff' }); txt(g, lab, x, y + 44, { font: F.cond(500, 28), ls: 4, color: i === 3 ? PAL.red2 : '#9fe3ff' }); g.globalAlpha = 1; });
      revealText(g, 'WITHIN DECADES IT COULD COLLAPSE', W / 2, 160, clamp(c / 0.7), { font: F.cond(700, 64), ls: 6, color: '#fff', shadow: 30 });
    }
  },
});

// 367 — in the world's imagination, Titanic keeps sailing
S5.push({
  seg: 367, name: 'keeps sailing', amb: [{ kind: 'ocean', vol: 0.5 }], trans: 'fade',
  fx: { bloom: 1.3, bloomThreshold: 0.5, saturation: 1.2, tint: [1.08, 0.98, 0.9] },
  sfx: (S) => [{ t: 0.2, type: 'shimmer', vol: 0.07, notes: [75, 79, 82, 87, 91] }, { t: S.at(369), type: 'paper', vol: 0.15, dur: 0.6 }, { t: S.at(370), type: 'pop', pitch: 500 }, { t: 1.4, type: 'horn', dur: 3, vol: 0.08, far: true }],
  build: (E) => oceanWorld({ sky: 'golden', ocean: 'golden', envMap: E.envMap, wake: true, lights: 0.6, sunDir: [0.6, 0.06, -0.8] }),
  update(st, S) { st.ship.position.x = S.lt * 9; const x = st.ship.position.x; track(st.camera, [[0, [x + 280, 20, 240], [x, 20, 0], 34], [S.dur, [x + 160, 10, 220], [x, 22, 0], 32]], S.lt); st.tick(S); },
  draw(st, g, S) {
    const { W, H, lt } = S;
    g.fillStyle = 'rgba(255,220,170,0.08)'; g.fillRect(0, 0, W, H);
    revealText(g, 'in the world’s imagination', W / 2, 150, clamp(lt / 0.8), { font: F.serif(56), color: '#fff', shadow: 20, style: 'blur' });
    const k = lt - S.at(368);
    if (k > 0 && lt < S.at(369)) revealText(g, 'TITANIC KEEPS SAILING', W / 2, 250, clamp(k / 0.6), { font: F.cond(700, 100), ls: 12, color: '#fff', shadow: 40, style: 'scale' });
    const b = lt - S.at(369);
    if (b > 0) {
      for (let i = 0; i < 9; i++) { const kk = easeOutBack(clamp((b - i * 0.08) / 0.4)); g.save(); g.translate(W / 2 - 520 + i * 18, H - 260 - i * 26 * kk); g.fillStyle = ['#7a1a1e', '#1d3a6a', '#2d5a3a', '#c9a14a', '#3a2a4a'][i % 5]; g.globalAlpha = clamp(kk * 3); g.fillRect(-160, -14, 320, 26); g.fillStyle = 'rgba(255,215,120,0.8)'; g.fillRect(-120, -3, 160, 4); g.restore(); }
      txt(g, 'THOUSANDS OF BOOKS & STUDIES', W / 2 - 520, H - 140, { font: F.cond(600, 34), ls: 4, color: '#fff', alpha: clamp(b * 2), shadow: 10 });
    }
    const f = lt - S.at(370);
    if (f > 0) {
      g.save(); g.globalAlpha = clamp(f * 3); g.translate(W / 2 + 420, H - 260); g.rotate(lt * 0.6); g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(0, 0, 110, 0, 7); g.fill(); g.fillStyle = '#c9a14a'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(Math.cos(i) * 60, Math.sin(i) * 60, 22, 0, 7); g.fill(); } g.beginPath(); g.arc(0, 0, 14, 0, 7); g.fill(); g.restore();
      txt(g, 'JAMES CAMERON’S FILM · 1997', W / 2 + 420, H - 110, { font: F.cond(600, 34), ls: 4, color: '#fff', alpha: clamp(f * 2), shadow: 10 });
    }
  },
});

// 372 — the lesson not learned: the Titan submersible, June 2023
function subWorld(E) {
  const st = underwaterWorld({ color: '#031a2a', density: 0.03, hemi: 0.5, bedY: -3500 }, E);
  const sub = new THREE.Group(); st.scene.add(sub);
  const bodyGeo = new THREE.CylinderGeometry(1.2, 1.2, 4.2, 32); bodyGeo.rotateZ(Math.PI / 2);
  mesh(bodyGeo, std(0xf2f2f2, { rough: 0.35 }), 0, 0, 0, sub);
  mesh(new THREE.CylinderGeometry(1.22, 1.22, 2.2, 32).rotateZ(Math.PI / 2), std(0x1a1a1a, { rough: 0.5 }), 0, 0, 0, sub);
  const ti = std(0x9aa4ae, { metal: 0.9, rough: 0.3 });
  const capF = mesh(new THREE.SphereGeometry(1.25, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), ti, 2.1, 0, 0, sub); capF.rotation.z = -Math.PI / 2;
  const capB = mesh(new THREE.SphereGeometry(1.25, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), ti, -2.1, 0, 0, sub); capB.rotation.z = Math.PI / 2;
  const port = mesh(new THREE.CircleGeometry(0.28, 24), std(0x0a1a2a, { emissive: 0x8ac8ff, ei: 1.6 }), 3.36, 0, 0, sub); port.rotation.y = Math.PI / 2;
  for (const z of [-1.1, 1.1]) box(6.2, 0.15, 0.25, std(0x2a2a2a), 0, -1.4, z, sub);
  for (const [y, z] of [[0.6, 1.3], [0.6, -1.3], [-0.6, 1.3], [-0.6, -1.3]]) { const t = cyl(0.25, 0.25, 0.6, std(0x1a1a1a), -2.4, y, z, sub, 12); t.rotation.z = Math.PI / 2; }
  const lights = []; for (const z of [-0.8, 0.8]) { const l = new THREE.SpotLight(0xe8f4ff, 120, 60, 0.4, 0.5, 1.4); l.position.set(3.2, -0.6, z); l.target.position.set(20, -6, z); sub.add(l, l.target); lights.push(l); const gl = glow(0xe8f4ff, 1.2, 0.9); gl.position.set(3.3, -0.6, z); sub.add(gl); }
  const shock = mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 0, 0, st.scene);
  const frags = particles(400, () => [0, -9999, 0], { size: 0.25, color: 0xffffff, opacity: 1 }); st.scene.add(frags);
  Object.assign(st, { sub, shock, frags, subLights: lights });
  return st;
}
S5.push({
  seg: 372, name: 'titan submersible', amb: [{ kind: 'underwater', vol: 1.0 }], trans: 'fade',
  fx: { bloom: 1.0, bloomThreshold: 0.5, saturation: 1.1, contrast: 1.1, vignette: 0.85 },
  sfx: (S) => [{ t: S.at(374), type: 'type', n: 12, vol: 0.14 }, { t: S.at(375) + 1, type: 'sonar', vol: 0.1 }, { t: S.at(377), type: 'stamp', vol: 0.4 }, { t: S.at(378), type: 'stamp', vol: 0.4 }, { t: S.find(380, /imploded/), type: 'implosion', vol: 0.8 }, { t: S.at(381), type: 'heartbeat', n: 2, bpm: 40, vol: 0.3 }],
  build: (E) => subWorld(E),
  update(st, S) {
    const imp = S.find(380, /imploded/);
    const depth = lerp(200, 3300, easeInOut(clamp(S.lt / imp)));
    st.sub.position.set(0, -depth, 0); st.sub.rotation.z = -0.25; st.sub.rotation.y = 0.2;
    const sp = st.sub.position;
    const k = S.lt - imp;
    st.sub.visible = k < 0.02;
    st.shock.position.copy(sp); st.shock.scale.setScalar(Math.max(0.01, k * 30)); st.shock.material.opacity = k > 0 ? Math.max(0, 1 - k * 1.2) : 0;
    const fp = st.frags.geometry.attributes.position.array;
    for (let i = 0; i < 400; i++) { const q = rng(i + 2); if (k < 0) { fp[i * 3 + 1] = -9999; continue; } const a = q() * Math.PI * 2, b = q() * Math.PI, r = Math.min(1, k) * 12 * q() + k * 0.5; fp[i * 3] = sp.x + Math.cos(a) * Math.sin(b) * r; fp[i * 3 + 1] = sp.y + Math.cos(b) * r - k * 1.5; fp[i * 3 + 2] = sp.z + Math.sin(a) * Math.sin(b) * r; }
    st.frags.geometry.attributes.position.needsUpdate = true;
    if (S.lt < S.at(377)) track(st.camera, [[0, [sp.x + 14, sp.y + 4, sp.z + 14], [sp.x, sp.y, sp.z], 40], [S.at(377), [sp.x + 9, sp.y + 2, sp.z + 9], [sp.x, sp.y, sp.z], 36]], S.lt);
    else track(st.camera, [[S.at(377), [sp.x - 6, sp.y + 1, sp.z + 7], [sp.x + 1, sp.y, sp.z], 36], [imp + 3, [sp.x - 30, sp.y + 4, sp.z + 30], [sp.x, sp.y, sp.z], 50]], S.lt, { shake: k > 0 && k < 1 ? 1.2 * (1 - k) : 0 });
    S.fx.flash = k > 0 ? Math.max(0, 1 - k * 2.5) : 0;
    if (k > 0.5) S.fx.fade = clamp((k - 0.5) / 0.6) * 0.92;
    st.lamp.intensity = 0; st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    if (lt < S.at(374)) revealText(g, 'THE LESSON HAS NOT BEEN FULLY LEARNED', W / 2, 170, clamp((lt - 0.4) / 0.8), { font: F.cond(700, 64), ls: 6, color: '#fff', shadow: 30 });
    const y = lt - S.at(374);
    if (y > 0 && lt < S.at(377)) { typedLine(g, 'JUNE 2023', 110, H - 330, y / 0.6, { font: F.cond(700, 72), ls: 6, color: '#fff', shadow: 20 }); typedLine(g, 'SUBMERSIBLE “TITAN” · 5 PEOPLE ABOARD', 112, H - 266, (y - 0.5) / 1.0, { font: F.cond(400, 34), ls: 8, color: '#ffd23f', shadow: 10 }); }
    const imp = S.find(380, /imploded/);
    if (lt < imp) { const d = Math.round(lerp(200, 3300, easeInOut(clamp(lt / imp)))); txt(g, `${d.toLocaleString('en-US')} M`, W - 120, 150, { font: F.cond(700, 80), align: 'right', color: '#9fe3ff', shadow: 20 }); txt(g, 'DEPTH', W - 124, 215, { font: F.cond(500, 28), ls: 10, align: 'right', color: '#fff' }); }
    [[377, 'SAFETY STANDARDS DISMISSED'], [378, 'ENGINEERING WARNINGS IGNORED'], [379, 'FAITH IN “INNOVATION”']].forEach(([seg, label], i) => { const k = lt - S.at(seg); if (k < 0 || lt > imp) return; const sc = 1 + 0.4 * (1 - easeOut(clamp(k / 0.2))); g.save(); g.translate(W / 2, 220 + i * 120); g.scale(sc, sc); g.globalAlpha = clamp(k * 4); g.fillStyle = 'rgba(10,4,6,0.75)'; const tw = measure(g, label, F.cond(700, 56), 4) + 70; roundRect(g, -tw / 2, -46, tw, 92, 10); g.fill(); g.strokeStyle = PAL.red2; g.lineWidth = 4; roundRect(g, -tw / 2, -46, tw, 92, 10); g.stroke(); txt(g, label, 0, 2, { font: F.cond(700, 56), ls: 4, color: i === 2 ? '#ffd23f' : PAL.red2 }); g.restore(); });
    const k = lt - S.at(381);
    if (k > 0) { for (let i = 0; i < 5; i++) personIcon(g, W / 2 - 240 + i * 120, H / 2 - 40, 2.6, '#f2efe6', { alpha: clamp((k - i * 0.12) * 3) }); txt(g, 'ALL FIVE PEOPLE ABOARD WERE KILLED', W / 2, H / 2 + 120, { font: F.cond(700, 56), ls: 6, color: '#fff', alpha: clamp(k * 2 - 0.5) }); }
  },
});

// 382 — above the remains of a ship that became a symbol of the same arrogance (finale)
S5.push({
  seg: 382, name: 'finale', amb: [{ kind: 'underwater', vol: 0.8 }, { kind: 'dark', vol: 0.6 }],
  fx: { exposure: 1.6,  bloom: 0.9, bloomThreshold: 0.5, saturation: 1.1, contrast: 1.1, vignette: 0.9 },
  sfx: (S) => [{ t: S.find(384, /arrogance/), type: 'boom', vol: 0.45 }, { t: S.find(385, /invulnerability/), type: 'boom', vol: 0.55 }, { t: S.find(385, /invulnerability/) + 0.4, type: 'shimmer', vol: 0.05, notes: [62, 65, 69, 74] }, { t: S.dur - 3, type: 'bell', freq: 440, n: 1, vol: 0.1, decay: 3 }],
  build: (E) => wreckWorld(E),
  update(st, S) {
    const end = S.find(385, /invulnerability/) + 1.2;
    track(st.camera, [[0, [125, 30, 70], [80, 8, 0], 46], [end, [150, 70, 110], [60, 4, 0], 50], [S.dur, [160, 90, 120], [60, 0, 0], 52]], S.lt);
    st.lamp.position.set(110, 40, 40); st.lamp.target.position.set(80, 6, 0); st.lamp.intensity = 400;
    S.fx.fade = clamp((S.lt - end) / 1.0) * 0.75;
    S.fx.captions = S.lt < end;
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    const a = lt - S.find(384, /symbol/);
    if (a > 0) revealText(g, 'A SYMBOL OF THE SAME', W / 2, H / 2 - 180, clamp(a / 0.6), { font: F.cond(500, 56), ls: 10, color: '#dfe8ff', shadow: 20 });
    const b = lt - S.find(384, /arrogance/);
    if (b > 0) revealText(g, 'ARROGANCE', W / 2, H / 2 - 80, clamp(b / 0.4), { font: F.cond(700, 150), ls: 24, color: '#fff', shadow: 40, style: 'scale' });
    const c = lt - S.find(385, /belief/);
    if (c > 0) revealText(g, 'and the same belief in its own invulnerability', W / 2, H / 2 + 60, clamp(c / 1.2), { font: F.serif(52), color: '#ffe2a0', shadow: 20, style: 'blur' });
    const end = lt - (S.find(385, /invulnerability/) + 1.2);
    if (end > 0) {
      g.fillStyle = `rgba(0,0,0,${0.7 * clamp(end)})`; g.fillRect(0, 0, W, H);
      revealText(g, 'TITANIC', W / 2, H / 2 - 20, clamp(end / 1.0), { font: F.cond(700, 190), ls: 40, color: '#f4f1ea', shadow: 30, style: 'blur' });
      txt(g, '1912', W / 2 + 10, H / 2 + 120, { font: F.cond(400, 48), ls: 30, color: PAL.red2, alpha: clamp(end - 0.6) });
      g.fillStyle = `rgba(0,0,0,${clamp((end - 2.0) / 1.0)})`; g.fillRect(0, 0, W, H);
    }
  },
});

export default S5;
