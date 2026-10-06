// ACT 1 — 1898 to 1907: the novel "Futility", the age of arrogance, the Olympic-class decision.
import * as THREE from 'three';
import { card, oceanWorld, track, place, cam, paper, dark, toScreen, V, NIGHT } from './common.js';
import { roomWorld, bookshelf, painting, landscape, terraces, glow, chandelier, table, chair } from './worlds.js';
import { std, box, cyl, sph, mesh, canvasTex, rng, particles, clamp, easeOut, easeInOut, easeOutBack, lerp, ramp, smokeTex, wobble } from '../lib/kit.js';
import { txt, F, PAL, revealText, measure, fmt, shipSilhouette, personIcon, boatIcon, check, cross, strike, callout, nameTag, darkBg, blueprintBg, roundRect, card as card2d, icebergIcon } from '../lib/draw2d.js';
import { makeIceberg } from '../lib/env.js';
import { person, pose } from '../lib/people.js';
import { TITANIC, LUSITANIA, buildLiner } from '../lib/ship.js';

export const TITAN = { ...TITANIC, funnels: [50, 12, -26], name: 'TITAN' };

// ---------- helpers ----------
function rollingYear(g, year, x, y, p, o = {}) {
  const digits = String(year).split('');
  const font = o.font ?? F.cond(700, 300);
  g.save(); g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  const dw = measure(g, '0', font) * 1.02;
  const total = dw * digits.length; const h = o.lineH ?? 340;
  g.beginPath(); g.rect(x - total / 2 - 20, y - h * 0.5, total + 40, h); g.clip();
  digits.forEach((d, i) => {
    const k = easeOut(clamp(p * 1.6 - i * 0.18));
    const from = (o.from ?? 2026).toString()[i] ?? '0';
    const steps = ((+d - +from + 10) % 10) + 10 * (digits.length - i);
    const pos = steps * k;
    for (let s = Math.floor(pos) - 1; s <= Math.floor(pos) + 1; s++) {
      const val = (((+from + s) % 10) + 10) % 10;
      const off = (s - pos) * h;
      g.fillStyle = o.color ?? PAL.ink;
      g.fillText(String(val), x - total / 2 + dw * (i + 0.5), y + off);
    }
  });
  g.restore();
  return total;
}

function bookCoverTex() {
  return canvasTex(512, 768, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#7a1a1e'); gr.addColorStop(1, '#4a0c10'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const r = rng(3); for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.12})`; g.fillRect(r() * w, r() * h, 2, 2); }
    g.strokeStyle = '#d8b25a'; g.lineWidth = 6; g.strokeRect(30, 30, w - 60, h - 60); g.lineWidth = 2; g.strokeRect(44, 44, w - 88, h - 88);
    g.fillStyle = '#e8c46a'; g.textAlign = 'center';
    g.font = '700 86px Oswald'; g.letterSpacing = '8px'; g.fillText('FUTILITY', w / 2 + 4, 250);
    g.font = 'italic 500 30px "Playfair Display"'; g.letterSpacing = '1px'; g.fillText('a novel', w / 2, 310);
    g.beginPath(); g.moveTo(140, 360); g.lineTo(w - 140, 360); g.stroke();
    // little ship emblem
    g.save(); g.translate(w / 2, 470); g.scale(0.22, 0.22); g.fillStyle = '#e8c46a';
    g.beginPath(); g.moveTo(-500, -40); g.lineTo(500, -60); g.lineTo(470, 40); g.lineTo(-440, 40); g.closePath(); g.fill(); g.fillRect(-340, -95, 650, 55);
    for (let i = 0; i < 3; i++) { g.save(); g.translate(150 - i * 150, -120); g.rotate(-0.09); g.fillRect(-22, -150, 44, 150); g.restore(); }
    g.restore();
    g.font = '500 34px Oswald'; g.letterSpacing = '6px'; g.fillText('MORGAN ROBERTSON', w / 2 + 3, 650);
  });
}

/** blueprint line-drawing of a liner, drawn on progressively (p 0..1) */
export function blueprintShip(g, x, y, w, p, color = '#cfe8ff', o = {}) {
  const s = w / 1000;
  g.save(); g.translate(x, y); g.scale(s, s * 0.7);
  g.strokeStyle = color; g.lineWidth = (o.lw ?? 2.2) / s; g.lineJoin = 'round';
  g.shadowColor = color; g.shadowBlur = o.glow ?? 6;
  const paths = [];
  const P = (fn) => paths.push(fn);
  P(() => { g.moveTo(-500, -40); g.lineTo(500, -60); g.lineTo(470, 40); g.lineTo(-440, 40); g.quadraticCurveTo(-500, 20, -500, -40); });
  P(() => { g.moveTo(-480, 10); g.lineTo(482, 10); });
  P(() => { g.rect(-340, -95, 650, 55); });
  P(() => { g.rect(-250, -120, 520, 25); });
  for (let i = 0; i < (o.funnels ?? 4); i++) P(() => { const fx = 200 - i * 125; g.moveTo(fx - 22, -120); g.lineTo(fx - 22 - 13, -270); g.lineTo(fx + 22 - 13, -270); g.lineTo(fx + 22, -120); });
  P(() => { g.moveTo(384, -60); g.lineTo(380, -330); g.moveTo(-386, -50); g.lineTo(-390, -310); g.moveTo(380, -320); g.lineTo(-388, -300); });
  P(() => { for (let i = -460; i < 460; i += 18) { g.moveTo(i, -18); g.arc(i, -18, 3, 0, 7); } });
  const n = paths.length;
  paths.forEach((fn, i) => {
    const k = clamp(p * n - i);
    if (k <= 0) return;
    g.beginPath(); g.setLineDash([4000 * k, 4000]); fn(); g.stroke();
  });
  g.setLineDash([]);
  if (o.fill) { g.globalAlpha = o.fill; g.fillStyle = color; g.shadowBlur = 30; g.beginPath(); g.moveTo(-500, -40); g.lineTo(500, -60); g.lineTo(470, 40); g.lineTo(-440, 40); g.closePath(); g.fill(); g.fillRect(-340, -95, 650, 55); }
  g.restore();
}

const S1 = [];

// 0 — card
S1.push(card(0, '14 YEARS', 'BEFORE THE COLLISION'));

// 1 — The year is 1898
S1.push(paper({
  seg: 1, name: '1898',
  sfx: (S) => [{ t: 0.05, type: 'whoosh', dur: 0.4, vol: 0.2 }, { t: 0.1, type: 'wheel', n: 22, rate: 0.03 }, { t: S.find(1, /1898/) + 0.4, type: 'hit', vol: 0.5 }],
  paint(st, g, S) {
    const { W, H, lt } = S;
    revealText(g, 'the year is', W / 2, H / 2 - 230, clamp(lt / 0.5), { font: F.serif(64), color: '#3a3a3a', style: 'blur' });
    rollingYear(g, 1898, W / 2, H / 2 + 10, clamp((lt - 0.05) / 0.9), { font: F.cond(700, 300), from: 1912 });
    // timeline
    const y = H - 210, x0 = W / 2 - 520, x1 = W / 2 + 520, k = easeOut(clamp((lt - 0.4) / 1.2));
    g.fillStyle = 'rgba(20,20,20,0.25)'; g.fillRect(x0, y - 2, (x1 - x0) * k, 4);
    g.fillStyle = PAL.red; g.beginPath(); g.arc(x0, y, 14, 0, 7); g.fill();
    if (k > 0.95) { g.fillStyle = PAL.ink; g.beginPath(); g.arc(x1, y, 14, 0, 7); g.fill(); }
    txt(g, '1898', x0, y + 44, { font: F.cond(500, 34), color: PAL.red, alpha: k });
    txt(g, '1912', x1, y + 44, { font: F.cond(500, 34), color: PAL.ink, alpha: clamp(k * 3 - 2) });
    txt(g, '14 YEARS', W / 2, y - 36, { font: F.cond(500, 30), ls: 10, color: '#555', alpha: clamp(k * 3 - 2) });
  },
}));

// 2 — Bookstore: "Futility" by Morgan Robertson
S1.push({
  seg: 2, name: 'bookstore', amb: 'room', trans: 'whip',
  fx: { bloom: 0.6, bloomThreshold: 0.7, saturation: 1.15, tint: [1.05, 1.0, 0.92] },
  sfx: (S) => [{ t: 0.05, type: 'whoosh', dur: 0.5, vol: 0.25 }, { t: S.find(2, /Futility/), type: 'shimmer', vol: 0.05 }, { t: S.find(2, /Morgan/), type: 'paper', vol: 0.12, dur: 0.4 }],
  build(E) {
    const st = roomWorld({ w: 12, d: 9, h: 4.4, wall: '#1f3a2e', wallAccent: '#c9a14a', floor: 'wood', floorColor: '#5a3418', keyPos: [3, 4.2, 3], keyI: 70, hemi: 0.4 }, E);
    const { scene } = st;
    bookshelf(scene, 0, -4.2, 10, 3.6, 0, 1);
    bookshelf(scene, -5.7, 0, 7, 3.6, Math.PI / 2, 2);
    bookshelf(scene, 5.7, -1, 6, 3.6, -Math.PI / 2, 3);
    // display table with stacks
    const wood = std(0x5a2e14, { rough: 0.45 });
    box(2.6, 0.08, 1.4, wood, 0, 0.92, 0.6, scene); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.08, 0.9, 0.08, wood, sx * 1.2, 0.45, 0.6 + sz * 0.6, scene);
    const r = rng(9); const cols = [0x8a1d24, 0x1d3a6a, 0x2d5a3a, 0xc9a14a, 0x5a2a6a, 0x222222, 0xa0522d];
    for (let s = 0; s < 6; s++) { const sx = -1.0 + (s % 3) * 0.45 + (s > 2 ? 1.2 : 0) - 0.3, sz = 0.3 + (s % 2) * 0.5; let y = 0.96; for (let k = 0; k < 3 + Math.floor(r() * 4); k++) { const b = box(0.36, 0.06, 0.5, std(cols[Math.floor(r() * cols.length)], { rough: 0.7 }), sx, y + 0.03, sz, scene); b.rotation.y = (r() - 0.5) * 0.3; y += 0.06; } }
    // featured book on a stand
    const book = new THREE.Group(); book.position.set(0.25, 1.22, 0.7); book.rotation.x = -0.25; scene.add(book);
    const cover = canvasTex(64, 64, (c) => { c.fillStyle = '#5a1014'; c.fillRect(0, 0, 64, 64); });
    const mats = [std(0xf0e6cc), std(0x5a1014), std(0xf0e6cc), std(0xf0e6cc), std(0xffffff, { map: bookCoverTex(), rough: 0.6 }), std(0x5a1014, { map: cover })];
    book.add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.62, 0.08), mats));
    box(0.5, 0.05, 0.2, std(0xb8893a, { metal: 0.8, rough: 0.3 }), 0.25, 0.9, 0.82, scene);
    // lamps
    for (const [x, z] of [[-3, 1.5], [3.2, 1.8]]) { cyl(0.03, 0.03, 1.8, std(0x2a2a2a, { metal: 0.6 }), x, 0.9, z, scene, 8); const sh = cyl(0.12, 0.3, 0.3, std(0x2d5a3a, { emissive: 0x3a2a10, ei: 0.5 }), x, 1.9, z, scene, 16); void sh; const gl = glow(0xffc070, 1.4, 0.9); gl.position.set(x, 1.75, z); scene.add(gl); const L = new THREE.PointLight(0xffb060, 8, 8, 1.5); L.position.set(x, 1.7, z); scene.add(L); }
    // window shaft + dust
    const win = mesh(new THREE.PlaneGeometry(2.4, 2.4), std(0xffffff, { emissive: 0xfff0c8, ei: 2.5 }), 5.95, 2.4, 2.5, scene); win.rotation.y = -Math.PI / 2;
    const shaft = mesh(new THREE.ConeGeometry(2.5, 9, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe8b0, transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }), 2.5, 2.3, 1.8, scene); shaft.rotation.z = -1.2;
    const dust = particles(300, (i, t) => { const q = rng(i + 3); return [q() * 6 - 1, ((q() * 4 + t * 0.05 * (q() + 0.3)) % 4), q() * 4 - 1]; }, { size: 0.025, color: 0xffe6b0, opacity: 0.7 });
    scene.add(dust); st.dust = dust; st.book = book;
    // shopkeeper in background
    const keeper = person({ coat: '#3a2a1e', hair: '#6a6a6a', mustache: true, beardColor: '#8a8a8a' }); keeper.position.set(-3.2, 0, -2.6); keeper.rotation.y = 0.6; scene.add(keeper); st.keeper = keeper;
    return st;
  },
  update(st, S) {
    const tag = S.find(2, /Morgan/);
    track(st.camera, [[0, [-2.6, 2.4, 5.2], [0.2, 1.3, 0.4], 42], [tag, [-0.6, 1.7, 2.7], [0.25, 1.2, 0.7], 38], [S.dur, [0.05, 1.42, 1.75], [0.25, 1.2, 0.7], 34]], S.lt);
    st.dust.userData.update(S.t); pose.idle(st.keeper, S.t);
    st.book.rotation.y = Math.sin(S.t * 0.4) * 0.05;
  },
  draw(st, g, S) {
    const k = S.lt - S.find(2, /Morgan/);
    nameTag(g, 110, 160, 'MORGAN ROBERTSON', 'LITTLE-KNOWN AMERICAN WRITER', clamp(k / 0.8));
    const f = S.lt - S.find(2, /Futility/);
    if (f > 0) { txt(g, '“FUTILITY”', S.W - 120, 170, { font: F.serif(64, true, 800), align: 'right', color: '#fff', alpha: clamp(f * 2) * (1 - clamp(k - 2)), shadow: 20 }); txt(g, 'PUBLISHED 1898', S.W - 124, 232, { font: F.cond(500, 30), ls: 8, align: 'right', color: PAL.gold, alpha: clamp(f * 2 - 0.4) * (1 - clamp(k - 2)) }); }
  },
});

// 4 — The fictional liner Titan (sepia, storybook)
S1.push({
  seg: 4, name: 'titan liner (fiction)', amb: 'ocean', trans: 'whip',
  fx: { saturation: 0.55, tint: [1.12, 0.98, 0.78], contrast: 1.1, vignette: 0.8, grain: 0.09, bloom: 0.5 },
  sfx: (S) => [{ t: 0, type: 'whoosh', dur: 0.6, vol: 0.25 }, { t: S.find(4, /largest/), type: 'hit', vol: 0.35 }, { t: S.find(4, /luxurious/), type: 'hit', vol: 0.35, pitch: 200 }, { t: S.find(4, /triumph/), type: 'shimmer', vol: 0.06 }, { t: 1.2, type: 'horn', dur: 2.6, vol: 0.12, far: true }],
  build: (E) => oceanWorld({ sky: 'sepia', ocean: 'sepia', envMap: E.envMap, spec: TITAN, wake: true, fogNear: 400, fogFar: 3000 }),
  update(st, S) {
    st.ship.position.x = S.lt * 9;
    const x = st.ship.position.x;
    track(st.camera, [[0, [x + 180, 6, 120], [x + 40, 20, 0], 38], [S.dur, [x + 40, 14, 190], [x - 20, 22, 0], 34]], S.lt);
    st.ship.rotation.z = Math.sin(S.t * 0.6) * 0.004;
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H } = S;
    txt(g, 'THE “TITAN”', 110, 120, { font: F.cond(700, 54), align: 'left', ls: 6, color: '#f6e6c4', alpha: clamp(S.lt * 2), shadow: 18 });
    txt(g, 'a ship that never existed — 1898', 112, 172, { font: F.serif(32), align: 'left', color: '#e8d4b0', alpha: clamp(S.lt * 2 - 0.5), shadow: 12 });
    const items = [[/largest/, 'LARGEST'], [/luxurious/, 'MOST LUXURIOUS'], [/triumph/, 'TRIUMPH OF ENGINEERING']];
    items.forEach(([re, label], i) => {
      const k = S.lt - S.find(4, re); if (k < 0) return;
      const y = H - 330 + i * 78;
      g.fillStyle = `rgba(20,12,4,${0.55 * clamp(k * 3)})`; g.fillRect(W - 640, y - 32, 540 * easeOut(clamp(k * 2.5)), 64);
      g.fillStyle = PAL.gold; g.fillRect(W - 640, y - 32, 6, 64 * clamp(k * 4));
      revealText(g, label, W - 610, y, clamp(k / 0.5), { font: F.cond(600, 42), align: 'left', ls: 4, color: '#f6e6c4' });
    });
  },
});

// 5 — racing through fog, strikes an iceberg (fiction)
S1.push({
  seg: 5, name: 'titan hits iceberg (fiction)', amb: ['night', { kind: 'wind', vol: 0.6 }],
  fx: { saturation: 0.45, tint: [0.92, 1.0, 1.1], contrast: 1.15, vignette: 0.85, grain: 0.1, bloom: 0.6 },
  sfx: (S) => { const hit = S.find(6, /strikes/); return [{ t: S.find(5, /unsinkable/), type: 'stamp', vol: 0.5 }, { t: hit - 1.6, type: 'riser', dur: 1.6, vol: 0.2 }, { t: hit, type: 'tear', dur: 2, vol: 0.35 }, { t: S.find(6, /sinks/), type: 'drop', vol: 0.35, dur: 2.5 }, { t: 0.5, type: 'horn', dur: 2, vol: 0.08, far: true }]; },
  build(E) {
    const st = oceanWorld({ ...NIGHT, sky: 'night', ocean: 'night', fogColor: '#1b2430', fogNear: 40, fogFar: 520, envMap: E.envMap, spec: TITAN, lights: 0.8, hemi: 0.6, sunI: 0.5 });
    st.berg = makeIceberg({ r: 26, seed: 9, ei: 0.25 }); st.scene.add(st.berg);
    return st;
  },
  update(st, S) {
    const hit = S.find(6, /strikes/), sink = S.find(6, /sinks/);
    const speed = 12;
    const tx = Math.min(S.lt, hit) * speed + Math.max(0, S.lt - hit) * 2;
    st.ship.position.x = tx;
    st.berg.position.set(hit * speed + 150, -4, 14);
    const sinkK = easeInOut(clamp((S.lt - sink + 0.3) / 2.5));
    st.ship.rotation.z = -0.06 * sinkK; st.ship.position.y = -6 * sinkK;
    const x = tx;
    if (S.lt < hit - 2.2) track(st.camera, [[0, [x + 150, 3, 26], [x, 18, 0], 40], [hit - 2.2, [x + 140, 3, 34], [x - 20, 16, 0], 40]], S.lt);
    else track(st.camera, [[hit - 2.2, [x + 230, 30, -120], [x + 120, 12, 10], 38], [S.dur, [x + 250, 40, -150], [x + 110, 6, 10], 38]], S.lt, { shake: S.lt > hit && S.lt < hit + 1.2 ? 0.8 : 0 });
    S.fx.flash = Math.max(0, 0.7 - (S.lt - hit) * 2) * (S.lt > hit ? 1 : 0);
    st.tick(S);
  },
  draw(st, g, S) {
    const k = S.lt - S.find(5, /unsinkable/);
    if (k > 0 && k < 4.2) {
      g.save(); g.translate(S.W / 2, 190); g.rotate(-0.06); const sc = 1 + 0.5 * (1 - easeOut(clamp(k / 0.25))); g.scale(sc, sc); g.globalAlpha = clamp(k * 5) * (1 - clamp((k - 3.7) / 0.5));
      g.strokeStyle = PAL.red2; g.lineWidth = 8; roundRect(g, -330, -62, 660, 124, 10); g.stroke();
      txt(g, '“UNSINKABLE”', 0, 4, { font: F.cond(700, 86), ls: 8, color: PAL.red2 });
      g.restore();
    }
  },
});

// 7 — not enough lifeboats (fiction)
S1.push(dark({
  seg: 7, name: 'not enough lifeboats', c1: '#0d2236', c2: '#02060c',
  sfx: (S) => [{ t: 0.1, type: 'pop', pitch: 400 }, { t: S.find(7, /most/), type: 'drop', vol: 0.3 }, { t: S.find(7, /freezing/), type: 'splash', vol: 0.15 }],
  paint(st, g, S) {
    const { W, H, lt } = S;
    revealText(g, 'NOT ENOUGH LIFEBOATS', W / 2, 140, clamp(lt / 0.8), { font: F.cond(700, 76), ls: 6, color: '#fff' });
    const boats = 4, seats = 6;
    for (let b = 0; b < boats; b++) { const k = easeOutBack(clamp((lt - 0.2 - b * 0.12) / 0.4)); boatIcon(g, W / 2 - 420 + b * 280, 330, 1.5 * k, '#f2efe6'); }
    const most = S.find(7, /most/);
    const cols = 24, rows = 4;
    for (let i = 0; i < cols * rows; i++) {
      const cx = i % cols, cy = Math.floor(i / cols);
      const appear = clamp((lt - 0.4 - i * 0.008) / 0.3);
      let x = W / 2 - (cols - 1) * 33 + cx * 66, y = 520 + cy * 92;
      const saved = i < boats * seats;
      let col = '#cfd8e0', a = appear;
      if (saved) { const k = easeInOut(clamp((lt - 1.2 - i * 0.02) / 0.8)); const b = Math.floor(i / seats), s = i % seats; x = lerp(x, W / 2 - 420 + b * 280 - 50 + s * 20, k); y = lerp(y, 312, k); if (k > 0.98) a *= 0; }
      else if (lt > most) { const k = clamp((lt - most - (i % 7) * 0.08) / 1.2); col = `rgb(${200 + 30 * k},${210 - 150 * k},${220 - 170 * k})`; y += easeOut(k) * 160; a *= 1 - k * 0.6; }
      personIcon(g, x, y, 1.1, col, { alpha: a });
    }
    // freezing water band
    const wk = clamp((lt - most) / 1.0);
    if (wk > 0) {
      const gr = g.createLinearGradient(0, H - 260, 0, H); gr.addColorStop(0, 'rgba(60,160,220,0)'); gr.addColorStop(1, `rgba(60,160,220,${0.55 * wk})`); g.fillStyle = gr; g.fillRect(0, H - 300, W, 300);
      g.strokeStyle = `rgba(160,220,255,${0.6 * wk})`; g.lineWidth = 3; g.beginPath(); for (let x = 0; x <= W; x += 10) g.lineTo(x, H - 210 + Math.sin(x * 0.02 + lt * 3) * 8); g.stroke();
      txt(g, 'FREEZING WATER', W / 2, H - 70, { font: F.cond(500, 34), ls: 14, color: '#bfe8ff', alpha: wk });
    }
  },
}));

// 9 — Robertson names his ship TITAN (book page)
S1.push(paper({
  seg: 9, name: 'book page TITAN', bg: { swoosh: false, leaves: false },
  sfx: (S) => [{ t: 0, type: 'paper', vol: 0.2, dur: 0.5 }, { t: S.find(9, /Titan/), type: 'hit', vol: 0.5 }, { t: S.find(9, /Titan/), type: 'shimmer', vol: 0.06 }],
  paint(st, g, S) {
    const { W, H, lt } = S;
    const hl = S.find(9, /Titan/);
    const zoom = 1 + easeInOut(clamp(lt / S.dur)) * 0.35;
    g.save(); g.translate(W / 2, H * 0.35); g.rotate(-0.04); g.scale(zoom, zoom); g.translate(-W / 2, -H * 0.35);
    g.save(); g.shadowColor = 'rgba(0,0,0,0.4)'; g.shadowBlur = 60; g.shadowOffsetY = 30; g.fillStyle = '#f3e8cf'; g.fillRect(W / 2 - 560, 40, 1120, 1000); g.restore();
    const lines = ['She was the largest craft afloat and the', 'greatest of the works of men. In her', 'construction and maintenance were involved', 'every science, profession, and trade known', 'to civilization. On her bridge were', 'officers who were the pick of the navy.', 'Unsinkable — indestructible, she carried', 'as few boats as would satisfy the laws.', 'Her name was the TITAN.'];
    lines.forEach((ln, i) => {
      const y = 110 + i * 82;
      if (ln.includes('TITAN.')) {
        const k = clamp((lt - hl) / 0.35);
        const pre = 'Her name was the '; g.font = F.type(54); const px = W / 2 - 480 + g.measureText(pre).width;
        const tw = g.measureText('TITAN').width;
        if (k > 0) { g.save(); g.fillStyle = 'rgba(255,205,60,0.85)'; g.shadowColor = '#ffc840'; g.shadowBlur = 40 * k; g.fillRect(px - 10, y - 34, (tw + 20) * easeOut(k), 70); g.restore(); }
        txt(g, pre, W / 2 - 480, y, { font: F.type(54), align: 'left', color: '#2a2018' });
        txt(g, 'TITAN', px, y, { font: F.type(54), align: 'left', color: '#2a2018' });
        txt(g, '.', px + tw, y, { font: F.type(54), align: 'left', color: '#2a2018' });
      } else txt(g, ln, W / 2 - 480, y, { font: F.type(46), align: 'left', color: 'rgba(42,32,24,0.85)' });
    });
    g.restore();
  },
}));

// 10 — fiction vs reality comparison
S1.push(dark({
  seg: 10, name: 'titan vs titanic', c1: '#13243a', c2: '#03070d', trans: 'whip',
  sfx: (S) => [{ t: 0, type: 'whoosh', vol: 0.25 }, ...[0.6, 1.4, 2.2, 3.0, 3.8].map((t) => ({ t: t + 0.3, type: 'pop', pitch: 500 + t * 40 })), { t: S.find(11, /accuracy/), type: 'boom', vol: 0.35 }],
  paint(st, g, S) {
    const { W, H, lt } = S;
    const cx1 = W / 2 - 380, cx2 = W / 2 + 380;
    const a = easeOut(clamp(lt / 0.6));
    txt(g, 'FICTION', cx1, 110, { font: F.cond(500, 30), ls: 14, color: PAL.gold, alpha: a });
    txt(g, 'TITAN · 1898', cx1, 162, { font: F.cond(700, 64), ls: 4, color: '#fff', alpha: a });
    txt(g, 'REALITY', cx2, 110, { font: F.cond(500, 30), ls: 14, color: PAL.red2, alpha: a });
    txt(g, 'TITANIC · 1912', cx2, 162, { font: F.cond(700, 64), ls: 4, color: '#fff', alpha: a });
    shipSilhouette(g, cx1 - 30 * (1 - a), 300, 470, '#d8c8a8', { funnels: 3, funnelColor: '#c8a060', funnelTop: '#222' });
    shipSilhouette(g, cx2 + 30 * (1 - a), 300, 520, '#e8e8e8', { funnels: 4, funnelColor: '#d9a24e', funnelTop: '#111' });
    g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(W / 2 - 1, 90, 2, H - 220);
    txt(g, 'VS', W / 2, 300, { font: F.cond(700, 50), color: '#fff', alpha: a });
    const rows = [['LENGTH', '800 ft', '882 ft'], ['LIFEBOATS', '24', '20'], ['MONTH', 'APRIL', 'APRIL'], ['CAUSE', 'ICEBERG', 'ICEBERG'], ['CALLED', '“UNSINKABLE”', '“UNSINKABLE”']];
    rows.forEach(([k, l, r], i) => {
      const p = easeOut(clamp((lt - 0.6 - i * 0.8) / 0.5)); if (p <= 0) return;
      const y = 480 + i * 92;
      g.fillStyle = `rgba(255,255,255,${0.05 * p})`; roundRect(g, W / 2 - 700, y - 38, 1400, 76, 10); g.fill();
      txt(g, k, W / 2, y - 52, { font: F.cond(500, 20), ls: 8, color: '#8aa0b8', alpha: p });
      const same = l === r;
      txt(g, l, cx1 + (1 - p) * -60, y, { font: F.cond(600, 46), color: same ? '#ffd23f' : '#e8e0d0', alpha: p });
      txt(g, r, cx2 + (1 - p) * 60, y, { font: F.cond(600, 46), color: same ? '#ffd23f' : '#e8e0d0', alpha: p });
      if (same) { check(g, W / 2, y, 40, '#ffd23f', clamp((p - 0.3) * 2)); }
      else txt(g, '≈', W / 2, y, { font: F.cond(700, 50), color: '#8aa0b8', alpha: p });
    });
  },
}));

// 12 — dawn of the 20th century: industrial city
S1.push({
  seg: 12, name: 'city 1900', amb: 'city', trans: 'whip',
  fx: { bloom: 0.75, bloomThreshold: 0.7, saturation: 1.2, contrast: 1.08, tint: [1.06, 0.98, 0.9] },
  sfx: (S) => [{ t: 0, type: 'whoosh', vol: 0.25 }, { t: S.find(12, /century/), type: 'hit', vol: 0.4 }, { t: S.find(12, /optimism/), type: 'hit', vol: 0.35, pitch: 220 }, { t: S.find(13, /technology/), type: 'hit', vol: 0.35, pitch: 200 }, { t: S.find(13, /arrogance/), type: 'boom', vol: 0.5 }, { t: 2, type: 'horn', dur: 2, vol: 0.05, far: true }],
  build(E) {
    const st = oceanWorld({ sky: 'golden', ocean: 'river', ship: false, envMap: E.envMap, fogColor: '#e0a070', fogNear: 200, fogFar: 1800, sunDir: [0.8, 0.12, -0.5], sunI: 2.6 });
    const { scene } = st;
    const ground = mesh(new THREE.PlaneGeometry(1600, 900), std(0x4a3a30, { rough: 0.95 }), 0, 0.3, -480, scene); ground.rotation.x = -Math.PI / 2;
    const quay = box(1600, 3, 6, std(0x6a6058, { rough: 0.9 }), 0, 1, -32, scene); void quay;
    terraces(scene, { n: 40, rows: 6, x: 0, z: -260, lit: true });
    terraces(scene, { n: 30, rows: 4, x: 120, z: -110, seed: 9, brick: '#6a3020' });
    // factories & chimneys
    const brick = std(0x6a2a1a, { rough: 0.9 }), dark = std(0x2a2422);
    const smokes = [];
    const r = rng(12);
    for (let i = 0; i < 14; i++) {
      const x = -260 + i * 42 + r() * 20, z = -180 - r() * 140, h = 50 + r() * 50;
      box(30, 20 + r() * 10, 26, brick, x, 12, z, scene);
      cyl(2.2, 3, h, dark, x + 8, h / 2, z, scene, 12);
      const s = particles(60, (k, t) => { const q = rng(k + i * 100); const age = (t * 0.08 + q()) % 1; return [x + 8 + age * 70 + Math.sin(q() * 9 + t) * 3, h + age * 50, z + (q() - 0.5) * age * 20]; }, { size: 16, color: 0x3a3030, opacity: 0.35, add: false, tex: smokeTex() });
      scene.add(s); smokes.push(s);
    }
    // street lamps & tram wires
    const lampPost = std(0x1d1d1d, { metal: 0.6 });
    for (let i = 0; i < 26; i++) { const x = -260 + i * 22; cyl(0.25, 0.3, 9, lampPost, x, 4.5, -40, scene, 6); const gl = glow(0xffd28a, 6, 0.9); gl.position.set(x, 9, -40); scene.add(gl); }
    // big clock tower + glass exhibition hall (symbols of the age)
    box(18, 90, 18, std(0x8a6a4a, { rough: 0.8 }), 60, 45, -320, scene);
    const face = mesh(new THREE.CircleGeometry(6, 32), std(0xfff4dc, { emissive: 0xffd9a0, ei: 1.2 }), 60, 78, -310.9, scene); void face;
    const dome = mesh(new THREE.SphereGeometry(40, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), std(0x9fd0e8, { metal: 0.6, rough: 0.2, transparent: true, opacity: 0.6, emissive: 0x402010, ei: 0.4 }), -150, 20, -300, scene); void dome;
    st.smokes = smokes;
    return st;
  },
  update(st, S) {
    track(st.camera, [[0, [-60, 6, 60], [0, 30, -200], 45], [S.dur, [20, 70, 40], [40, 25, -260], 40]], S.lt);
    st.smokes.forEach((s) => s.userData.update(S.t));
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    const words = [[12, /century/, 'THE 20TH CENTURY', '#fff', 0], [12, /optimism/, 'BOUNDLESS OPTIMISM', '#ffe2a0', 1], [13, /technology/, 'FAITH IN TECHNOLOGY', '#cfe8ff', 2], [13, /arrogance/, 'HUMAN ARROGANCE', PAL.red2, 3]];
    words.forEach(([seg, re, label, color, i]) => {
      const k = lt - S.find(seg, re); if (k < 0) return;
      const y = 240 + i * 120;
      revealText(g, label, W / 2, y, clamp(k / 0.6), { font: F.cond(700, i === 3 ? 96 : 76), ls: 6, color, shadow: 30, style: i === 3 ? 'scale' : 'up' });
    });
  },
});

// 14 — humanity believes it has conquered nature
S1.push({
  seg: 14, name: 'conquered nature', amb: 'ocean',
  fx: { bloom: 0.9, bloomThreshold: 0.65, saturation: 1.15, contrast: 1.1 },
  sfx: (S) => [{ t: 0, type: 'whoosh', vol: 0.2 }, { t: S.find(14, /conquered/), type: 'boom', vol: 0.4 }],
  build: (E) => oceanWorld({ sky: 'golden', ocean: 'golden', envMap: E.envMap, wake: true, sunDir: [0.3, 0.1, -0.95] }),
  update(st, S) {
    st.ship.position.x = S.lt * 10; const x = st.ship.position.x;
    track(st.camera, [[0, [x + 150, 1.5, 22], [x + 100, 20, 0], 30], [S.dur, [x + 160, 1.2, 14], [x + 110, 28, 0], 26]], S.lt);
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, lt } = S;
    revealText(g, 'humanity believes it has', W / 2, 150, clamp(lt / 0.8), { font: F.serif(52), color: '#fff', shadow: 20, style: 'blur' });
    const k = lt - S.find(14, /conquered/);
    if (k > 0) revealText(g, 'CONQUERED NATURE', W / 2, 250, clamp(k / 0.5), { font: F.cond(700, 110), ls: 8, color: '#fff', shadow: 30, style: 'scale' });
  },
});

// 15 — card
S1.push(card(15, '5 YEARS', 'BEFORE THE COLLISION'));

// 16 — Summer 1907
S1.push(paper({
  seg: 16, name: 'summer 1907',
  sfx: (S) => [{ t: 0.05, type: 'wheel', n: 14, rate: 0.03 }, { t: S.find(16, /1907/), type: 'hit', vol: 0.45 }],
  paint(st, g, S) {
    const { W, H, lt } = S;
    // sun
    const k = easeOut(clamp(lt / 0.8));
    g.save(); g.translate(W / 2 + 330, H / 2 - 170); g.rotate(lt * 0.3); g.fillStyle = PAL.gold; g.globalAlpha = k;
    for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.fillRect(70, -5, 40 * k, 10); }
    g.beginPath(); g.arc(0, 0, 55 * k, 0, 7); g.fill(); g.restore();
    revealText(g, 'the summer of', W / 2, H / 2 - 210, clamp(lt / 0.5), { font: F.serif(64), color: '#3a3a3a', style: 'blur' });
    rollingYear(g, 1907, W / 2, H / 2 + 20, clamp((lt - 0.05) / 0.9), { from: 1898 });
    txt(g, 'LONDON', W / 2 + 10, H / 2 + 230, { font: F.cond(500, 40), ls: 24, color: PAL.red, alpha: clamp(lt * 2 - 1) });
  },
}));

// 17a — Downshire House exterior
S1.push({
  seg: 17, name: 'downshire house exterior', amb: ['night', 'rain'], ambVol: 0.6, trans: 'fade',
  fx: { bloom: 0.7, bloomThreshold: 0.75, saturation: 1.15, tint: [0.92, 0.98, 1.1], exposure: 0.9 },
  sfx: (S) => [{ t: 0.3, type: 'horn', dur: 1.2, vol: 0.03, far: true }, { t: S.find(17, /Downshire/), type: 'type', n: 16, rate: 0.05, vol: 0.2 }],
  build(E) {
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a1220, 30, 160); scene.background = new THREE.Color(0x070d18);
    scene.add(new THREE.HemisphereLight(0x3a4a7a, 0x100808, 0.2));
    scene.environment = E.envMap; scene.environmentIntensity = 0.06;
    const moon = new THREE.DirectionalLight(0x6a80c0, 0.5); moon.position.set(-30, 40, 40); scene.add(moon);
    const camera = cam(38, 0.1, 500);
    const stucco = std(0xb8b0a0, { rough: 0.8 }), col = std(0xd0c8b8, { rough: 0.7 }), dark = std(0x1a1a1a, { rough: 0.5, metal: 0.4 });
    // facade
    box(60, 26, 2, stucco, 0, 13, -10, scene);
    for (let fl = 0; fl < 3; fl++) for (let i = -5; i <= 5; i++) {
      const lit = rng(i * 7 + fl)() > 0.25;
      box(2.4, 3.6, 0.2, std(0x1a1a20, { emissive: 0xffb860, ei: lit ? 1.1 : 0.02 }), i * 5, 6 + fl * 7, -8.95, scene);
      box(3.0, 0.3, 0.6, col, i * 5, 3.9 + fl * 7, -8.7, scene);
    }
    for (const x of [-4, 4]) { cyl(0.6, 0.7, 9, col, x, 4.5, -6.5, scene, 16); }
    box(10, 0.8, 4, col, 0, 9.3, -7, scene);
    const door = box(3, 5, 0.3, std(0x1a1210, { rough: 0.4 }), 0, 2.5, -8.8, scene); void door;
    const fan = mesh(new THREE.CircleGeometry(1.5, 24, 0, Math.PI), std(0x1a1a20, { emissive: 0xffc070, ei: 2 }), 0, 5.1, -8.8, scene); void fan;
    // railings, steps, street
    box(60, 0.3, 30, std(0x2a2a30, { rough: 0.15, metal: 0.3 }), 0, -0.15, 5, scene);
    for (let i = 0; i < 3; i++) box(8, 0.3, 1, std(0xd8d0c0), 0, 0.15 + i * 0.3, -6 + i * -0.8 + 2.4, scene);
    for (let x = -28; x <= 28; x += 0.6) if (Math.abs(x) > 4) box(0.05, 1.2, 0.05, dark, x, 0.6, -5, scene);
    // gas lamps
    for (const x of [-12, 12]) { cyl(0.12, 0.15, 5, dark, x, 2.5, -3, scene, 8); const gl = glow(0xffc070, 3, 1); gl.position.set(x, 5.2, -3); scene.add(gl); const L = new THREE.PointLight(0xffb060, 9, 22, 1.6); L.position.set(x, 5, -3); scene.add(L); }
    // carriage
    const car = new THREE.Group(); car.position.set(-6, 0, 2); scene.add(car);
    box(4, 2, 2, std(0x0e0e10, { rough: 0.3, metal: 0.3 }), 0, 1.8, 0, car); for (const [x, z] of [[-1.3, 1.05], [1.3, 1.05], [-1.3, -1.05], [1.3, -1.05]]) { const w = cyl(0.8, 0.8, 0.1, std(0x3a1a10), x, 0.8, z, car, 16); w.rotation.x = Math.PI / 2; }
    const rain = particles(1200, (i, t) => { const q = rng(i + 5); return [q() * 50 - 25, ((q() * 20 - t * 14) % 20 + 20) % 20, q() * 20 - 8]; }, { size: 0.06, color: 0x9ab0d0, opacity: 0.6 });
    scene.add(rain);
    return { scene, camera, rain };
  },
  update(st, S) {
    track(st.camera, [[0, [16, 1.6, 26], [0, 8, -8], 42], [S.dur, [8, 1.5, 20], [0, 9, -8], 40]], S.lt);
    st.rain.userData.update(S.t);
  },
  draw(st, g, S) {
    const k = S.lt - S.find(17, /Downshire/);
    if (k > 0) {
      const t1 = 'DOWNSHIRE HOUSE', t2 = 'BELGRAVIA · LONDON';
      txt(g, t1.slice(0, Math.floor(clamp(k / 0.8) * t1.length)), 110, S.H - 300, { font: F.cond(700, 70), align: 'left', ls: 6, color: '#fff', shadow: 20 });
      txt(g, t2.slice(0, Math.floor(clamp((k - 0.6) / 0.8) * t2.length)), 112, S.H - 236, { font: F.cond(400, 34), align: 'left', ls: 12, color: PAL.gold, shadow: 10 });
    }
  },
});

// 17b..19 — the dinner: Pirrie & Ismay
function diningRoom(E) {
  const st = roomWorld({ w: 12, d: 9, h: 4.6, wall: '#6a1018', wallAccent: '#e0b050', floor: 'carpet', floorColor: '#3a0c10', floorAccent: '#c9a14a', keyPos: [0, 4.4, 1], keyI: 40, hemi: 0.35 }, E);
  const { scene } = st;
  chandelier(scene, 0, 3.6, 0.2, 1.2, { intensity: 14, dist: 12 });
  table(scene, 0, 0.2, { w: 3.0, d: 1.3, seats: 6, cloth: 0xf3ece0, candle: false });
  for (const x of [-2.2, 2.2]) { cyl(0.05, 0.12, 1.1, std(0xc9a14a, { metal: 0.8, rough: 0.3 }), x, 0.55, -3.8, scene, 10); const fl = glow(0xffb060, 0.35); fl.position.set(x, 1.2, -3.8); scene.add(fl); }
  painting(scene, -3, 2.5, -4.45, 2.4, 1.6, landscape('#3a5a8a', '#e0a060', '#1a3a5a'));
  painting(scene, 3, 2.5, -4.45, 1.6, 2.0, landscape('#2a2a3a', '#a07050', '#2a3a3a'));
  // fireplace
  const marble = std(0xe8e0d0, { rough: 0.3 });
  box(2.6, 1.6, 0.6, marble, 5.7, 0.8, 0, scene).rotation.y = Math.PI / 2;
  const fire = glow(0xff7a20, 1.6, 1); fire.position.set(5.5, 0.5, 0); scene.add(fire);
  const fireL = new THREE.PointLight(0xff8030, 10, 8, 1.5); fireL.position.set(5.2, 0.6, 0); scene.add(fireL);
  // brandy glasses + decanter
  const glass = std(0xe8f4ff, { rough: 0.05, transparent: true, opacity: 0.35 }); const brandy = std(0xa0501a, { rough: 0.1, emissive: 0x401505, ei: 0.5, transparent: true, opacity: 0.9 });
  for (const x of [-0.7, 0.7]) { const gl = sph(0.07, glass, x, 0.92, 0.2, scene, 14, 10); gl.scale.y = 0.9; const b = sph(0.05, brandy, x, 0.9, 0.2, scene, 12, 8); b.scale.y = 0.5; }
  const pirrie = person({ coat: '#14161c', hair: '#c8c8c8', beard: true, beardColor: '#d8d8d8', mustache: true, skin: '#e8b8a0' });
  pose.sit(pirrie); pirrie.position.set(-1.25, 0, 0.2); pirrie.rotation.y = Math.PI / 2; scene.add(pirrie);
  const ismay = person({ coat: '#101218', hair: '#1a1410', mustache: true, beardColor: '#1a1410', skin: '#e8b896' });
  pose.sit(ismay); ismay.position.set(1.25, 0, 0.2); ismay.rotation.y = -Math.PI / 2; scene.add(ismay);
  const butler = person({ coat: '#0a0a0a', hair: '#555', tie: '#111' }); butler.position.set(3.4, 0, -2.6); butler.rotation.y = -0.5; scene.add(butler);
  for (const [x, ry] of [[-1.25, Math.PI / 2], [1.25, -Math.PI / 2]]) chair(scene, x - Math.sign(x) * 0.25, 0.2, ry, { fabric: 0x5a1218 });
  const smoke = particles(120, (i, t) => { const q = rng(i + 77); const age = (t * 0.15 + q()) % 1; return [-0.95 + Math.sin(age * 6 + q() * 6) * 0.1 * age, 1.4 + age * 1.8, 0.35 + Math.cos(age * 5 + q() * 3) * 0.1 * age]; }, { size: 0.18, color: 0xc8c0b8, opacity: 0.18, add: false, tex: smokeTex() });
  scene.add(smoke);
  Object.assign(st, { pirrie, ismay, butler, smoke, fire, fireL });
  return st;
}
S1.push({
  at: (E) => E.find(17, /lavish/) - 0.15, name: 'downshire dinner', amb: 'room',
  fx: { bloom: 0.8, bloomThreshold: 0.6, saturation: 1.18, tint: [1.06, 0.98, 0.9] },
  sfx: (S) => [{ t: 0, type: 'whoosh', vol: 0.15 }, { t: S.at(18), type: 'pop', pitch: 420 }, { t: S.at(19), type: 'pop', pitch: 520 }],
  build: (E) => diningRoom(E),
  update(st, S) {
    const a18 = S.at(18), a19 = S.at(19);
    if (S.lt < a18) track(st.camera, [[0, [0, 2.6, 4.6], [0, 1.0, 0], 40], [a18, [-0.6, 2.0, 3.4], [0, 1.1, 0.2], 38]], S.lt);
    else if (S.lt < a19) track(st.camera, [[a18, [0.6, 1.45, 1.0], [-1.25, 1.55, 0.2], 32], [a19, [0.4, 1.4, 0.75], [-1.25, 1.6, 0.2], 28]], S.lt);
    else track(st.camera, [[a19, [-0.6, 1.45, 1.0], [1.25, 1.55, 0.2], 32], [S.dur, [-0.4, 1.4, 0.75], [1.25, 1.6, 0.2], 28]], S.lt);
    pose.idle(st.butler, S.t);
    const talk = (p, on) => { p.userData.head.rotation.x = on ? Math.sin(S.t * 7) * 0.04 : 0; p.userData.armR.rotation.x = -0.7 + (on ? Math.sin(S.t * 2) * 0.2 : 0); p.userData.armR.userData.fore.rotation.x = -0.8; };
    talk(st.pirrie, S.lt > a18 && S.lt < a19); talk(st.ismay, S.lt > a19);
    st.smoke.userData.update(S.t);
    st.fire.scale.setScalar(1.5 + Math.sin(S.t * 13) * 0.15 + Math.sin(S.t * 7.7) * 0.1); st.fireL.intensity = 10 + Math.sin(S.t * 11) * 2;
  },
  draw(st, g, S) {
    nameTag(g, 110, S.H - 300, 'LORD WILLIAM PIRRIE', 'CHAIRMAN · HARLAND & WOLFF SHIPYARD', clamp((S.lt - S.at(18) - 0.3) / 0.8) * (S.lt < S.at(19) ? 1 : 0));
    nameTag(g, 110, S.H - 300, 'J. BRUCE ISMAY', 'MANAGING DIRECTOR · WHITE STAR LINE', clamp((S.lt - S.at(19) - 0.3) / 0.8));
  },
});

// 20 — Cunard's racers
S1.push({
  seg: 20, name: 'cunard lusitania mauretania', amb: ['ocean', { kind: 'wind', vol: 0.5 }], trans: 'whip',
  fx: { bloom: 0.6, saturation: 1.2, contrast: 1.08 },
  sfx: (S) => [{ t: 0, type: 'whoosh', vol: 0.3 }, { t: S.find(20, /Lusitania/), type: 'hit', vol: 0.35 }, { t: S.find(20, /Mauritania/), type: 'hit', vol: 0.35, pitch: 200 }, { t: S.find(20, /fastest/), type: 'riser', dur: 1, vol: 0.15 }, { t: 0.4, type: 'horn', dur: 1.6, vol: 0.06 }],
  build(E) {
    const st = oceanWorld({ sky: 'day', ocean: 'day', envMap: E.envMap, spec: LUSITANIA, wake: true, sunDir: [0.5, 0.45, 0.6] });
    const second = buildLiner({ spec: LUSITANIA }); second.position.set(-40, 0, -110); st.scene.add(second);
    const w2 = st.wake.clone(); w2.position.copy(st.wake.position); second.add(w2);
    st.second = second;
    return st;
  },
  update(st, S) {
    const v = 22; st.ship.position.x = S.lt * v; st.second.position.x = S.lt * v - 60 + Math.sin(S.lt * 0.3) * 10;
    const x = st.ship.position.x;
    track(st.camera, [[0, [x + 170, 4, 95], [x + 10, 16, -40], 36], [S.dur, [x + 120, 6, 120], [x - 10, 16, -50], 34]], S.lt, { shake: 0.15 });
    st.ship.rotation.x = Math.sin(S.t * 0.8) * 0.006; st.second.rotation.x = Math.sin(S.t * 0.7 + 1) * 0.006;
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    const a = clamp(lt * 2);
    g.save(); g.globalAlpha = a; g.fillStyle = '#c8361e'; g.fillRect(110, 100, 300, 70); txt(g, 'CUNARD LINE', 260, 136, { font: F.cond(700, 40), ls: 6, color: '#fff' }); txt(g, 'THE MAIN RIVAL', 112, 200, { font: F.cond(400, 26), ls: 10, align: 'left', color: '#fff', shadow: 10 }); g.restore();
    const l = S.find(20, /Lusitania/), m = S.find(20, /Mauritania/), f = S.find(20, /fastest/);
    const p1 = toScreen(V(st.ship.position.x + 40, 40, 0), st.camera), p2 = toScreen(V(st.second.position.x + 40, 40, -110), st.camera);
    callout(g, p1[0] + 40, p1[1] - 170, p1[0], p1[1], 'LUSITANIA', 'launched 1906', clamp((lt - l) / 0.7));
    callout(g, p2[0] - 280, p2[1] - 150, p2[0], p2[1], 'MAURETANIA', 'launched 1906', clamp((lt - m) / 0.7), { align: 'right' });
    const k = lt - f; if (k > 0) { revealText(g, 'FASTEST ON THE ATLANTIC', W / 2, H - 290, clamp(k / 0.6), { font: F.cond(700, 72), ls: 6, color: '#fff', shadow: 30 }); txt(g, '≈ 25 KNOTS', W / 2, H - 215, { font: F.cond(500, 40), ls: 12, color: '#ffd23f', alpha: clamp(k * 2 - 0.6), shadow: 10 }); }
    // speed lines
    g.save(); g.globalAlpha = 0.25; g.strokeStyle = '#fff'; g.lineWidth = 2; const r = rng(Math.floor(lt * 20)); for (let i = 0; i < 12; i++) { const y = r() * H, x = r() * W; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 200 - r() * 200, y); g.stroke(); } g.restore();
  },
});

// 22 — they decide against competing on speed
S1.push(dark({
  seg: 22, name: 'not speed', c1: '#2a0508', c2: '#050102',
  sfx: (S) => [{ t: 0.1, type: 'riser', dur: 1.0, vol: 0.18 }, { t: S.find(22, /against/), type: 'stamp', vol: 0.6 }],
  paint(st, g, S) {
    const { W, H, lt } = S;
    const cx = W / 2, cy = H / 2 + 20, R = 240;
    const neg = S.find(22, /against/);
    g.save(); g.lineCap = 'round';
    g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 30; g.beginPath(); g.arc(cx, cy, R, Math.PI * 0.8, Math.PI * 2.2); g.stroke();
    const sweep = easeOut(clamp(lt / 1.1));
    const gr = g.createLinearGradient(cx - R, 0, cx + R, 0); gr.addColorStop(0, '#3ccf7a'); gr.addColorStop(0.6, '#ffd23f'); gr.addColorStop(1, PAL.red2);
    g.strokeStyle = gr; g.beginPath(); g.arc(cx, cy, R, Math.PI * 0.8, Math.PI * (0.8 + 1.4 * sweep)); g.stroke();
    for (let i = 0; i <= 10; i++) { const a = Math.PI * (0.8 + 0.14 * i); g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx + Math.cos(a) * (R - 50), cy + Math.sin(a) * (R - 50)); g.lineTo(cx + Math.cos(a) * (R - 26), cy + Math.sin(a) * (R - 26)); g.stroke(); }
    const na = Math.PI * (0.8 + 1.4 * sweep) + Math.sin(lt * 30) * 0.01;
    g.strokeStyle = PAL.red2; g.lineWidth = 10; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(na) * (R - 60), cy + Math.sin(na) * (R - 60)); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, 18, 0, 7); g.fill(); g.restore();
    txt(g, 'SPEED', cx, cy + 190, { font: F.cond(700, 110), ls: 14, color: '#fff' });
    const k = clamp((lt - neg) / 0.25);
    if (k > 0) { strike(g, cx - 230, cy + 190, cx + 240, k, PAL.red2, 16); txt(g, 'NOT THE GOAL', cx, 170, { font: F.cond(600, 60), ls: 12, color: PAL.red2, alpha: k }); }
  },
}));

// 23 — over brandy: an entirely new class
S1.push({
  seg: 23, name: 'brandy blueprint', amb: 'room', trans: 'whip',
  fx: { bloom: 0.8, bloomThreshold: 0.6, saturation: 1.15, tint: [1.08, 0.98, 0.88] },
  sfx: (S) => [{ t: 0.2, type: 'clank', vol: 0.06, pitch: 3 }, { t: 0.5, type: 'paper', vol: 0.18, dur: 0.6 }, { t: S.find(23, /Olympic/), type: 'shimmer', vol: 0.06 }, { t: S.find(23, /Olympic/), type: 'hit', vol: 0.35 }],
  build(E) {
    const st = diningRoom(E);
    const bp = canvasTex(1024, 640, (g, w, h) => { blueprintBg(g, w, h); blueprintShip(g, w / 2, h / 2 + 40, 880, 1, '#d8ecff', { glow: 0 }); g.fillStyle = '#d8ecff'; g.font = '700 40px Oswald'; g.letterSpacing = '6px'; g.fillText('OLYMPIC CLASS — HULLS 400 · 401 · 433', 40, 60); });
    const sheet = mesh(new THREE.PlaneGeometry(1.6, 1.0), std(0xffffff, { map: bp, rough: 0.8 }), 0, 0.805, 0.2, st.scene); sheet.rotation.x = -Math.PI / 2; sheet.rotation.z = 0.06;
    st.sheet = sheet;
    return st;
  },
  update(st, S) {
    track(st.camera, [[0, [0.7, 1.9, 1.5], [0, 0.8, 0.2], 36], [S.dur, [0.1, 1.75, 0.95], [0, 0.8, 0.15], 32]], S.lt);
    st.smoke.userData.update(S.t);
    st.fire.scale.setScalar(1.5 + Math.sin(S.t * 13) * 0.15);
  },
  draw(st, g, S) {
    const k = S.lt - S.find(23, /Olympic/);
    if (k > 0) { revealText(g, 'the', S.W / 2, S.H / 2 - 150, clamp(k / 0.4), { font: F.serif(56), color: '#fff', shadow: 20, style: 'blur' }); revealText(g, 'OLYMPIC CLASS', S.W / 2, S.H / 2 - 60, clamp(k / 0.6), { font: F.cond(700, 130), ls: 10, color: '#fff', shadow: 40, style: 'scale' }); }
  },
});

// 24 — blueprint: three ships, the largest, most luxurious...
S1.push({
  seg: 24, name: 'blueprint three ships', lead: 0.05,
  fx: { bloom: 0.5, bloomThreshold: 0.5, vignette: 0.5, grain: 0.04 },
  sfx: (S) => [{ t: 0.05, type: 'whoosh', vol: 0.2 }, { t: 0.3, type: 'type', n: 10, vol: 0.12 }, { t: S.find(24, /largest/), type: 'pop' }, { t: S.find(24, /luxurious/), type: 'pop', pitch: 600 }, { t: S.find(24, /dependable/), type: 'pop', pitch: 700 }],
  draw(st, g, S) {
    const { W, H, lt } = S;
    blueprintBg(g, W, H, lt);
    const names = ['OLYMPIC', 'TITANIC', 'BRITANNIC'];
    names.forEach((n, i) => {
      const p = clamp((lt - 0.2 - i * 0.5) / 1.6);
      const y = 300 + i * 250;
      blueprintShip(g, W / 2 - 300, y, 760, p, '#d8ecff');
      txt(g, n, W / 2 - 300, y + 70, { font: F.cond(500, 30), ls: 14, color: '#9fd0ff', alpha: clamp(p * 3 - 2) });
    });
    txt(g, '3', W / 2 + 420, 200, { font: F.cond(700, 200), color: '#d8ecff', alpha: clamp(lt * 2), shadow: 30, shadowColor: '#9fd0ff' });
    txt(g, 'SHIPS', W / 2 + 420, 330, { font: F.cond(500, 40), ls: 16, color: '#9fd0ff', alpha: clamp(lt * 2) });
    [[24, /largest/, 'THE LARGEST'], [24, /luxurious/, 'MOST LUXURIOUS'], [24, /dependable/, 'MOST DEPENDABLE']].forEach(([seg, re, label], i) => {
      const k = lt - S.find(seg, re); if (k < 0) return;
      const y = 520 + i * 90; check(g, W / 2 + 330, y, 44, '#ffd23f', clamp(k / 0.4));
      revealText(g, label, W / 2 + 380, y, clamp(k / 0.5), { font: F.cond(600, 50), align: 'left', ls: 4, color: '#fff' });
    });
  },
});

// 26 — comfort over speed (balance)
S1.push(paper({
  seg: 26, name: 'comfort vs speed',
  sfx: (S) => [{ t: 0.2, type: 'clank', vol: 0.12, pitch: 0.6 }, { t: 1.2, type: 'thump', vol: 0.4 }],
  paint(st, g, S) {
    const { W, H, lt } = S;
    const tilt = -0.28 * easeOutBack(clamp((lt - 0.6) / 1.0), 2.2);
    const cx = W / 2, cy = H / 2 - 40;
    g.save(); g.fillStyle = PAL.ink; g.fillRect(cx - 8, cy, 16, 330); g.fillRect(cx - 140, cy + 320, 280, 20); g.beginPath(); g.arc(cx, cy, 20, 0, 7); g.fill();
    g.translate(cx, cy); g.rotate(tilt); g.fillRect(-460, -6, 920, 12);
    for (const [side, label, color, size] of [[-1, 'COMFORT', PAL.gold, 1.2], [1, 'SPEED', '#7a8a9a', 0.8]]) {
      g.save(); g.translate(side * 440, 0); g.rotate(-tilt);
      g.strokeStyle = PAL.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(-120, 160); g.moveTo(0, 0); g.lineTo(120, 160); g.stroke();
      g.fillStyle = PAL.ink; g.beginPath(); g.ellipse(0, 165, 140, 18, 0, 0, 7); g.fill();
      g.fillStyle = color; roundRect(g, -110 * size, 150 - 120 * size, 220 * size, 110 * size, 12); g.fill();
      txt(g, label, 0, 150 - 65 * size, { font: F.cond(700, 44 * size), color: '#fff', ls: 3 });
      g.restore();
    }
    g.restore();
    revealText(g, 'unprecedented comfort', W / 2, 140, clamp(lt / 0.8), { font: F.serif(64, true, 800), color: PAL.ink });
    revealText(g, 'OVER SPEED', W / 2, 225, clamp((lt - 0.6) / 0.6), { font: F.cond(700, 60), ls: 10, color: PAL.red });
  },
}));

// 27 — the second giant will be named Titanic
S1.push({
  seg: 27, name: 'named titanic',
  fx: { bloom: 0.6, bloomThreshold: 0.45, vignette: 0.55 },
  sfx: (S) => [{ t: 0, type: 'whoosh', vol: 0.2 }, { t: S.find(27, /Titanic/), type: 'boom', vol: 0.55 }, { t: S.find(27, /Titanic/), type: 'shimmer', vol: 0.07 }],
  draw(st, g, S) {
    const { W, H, lt } = S;
    blueprintBg(g, W, H, lt);
    const hit = S.find(27, /Titanic/);
    const k = clamp((lt - hit) / 0.5);
    ['OLYMPIC', 'TITANIC', 'BRITANNIC'].forEach((n, i) => {
      const y = 300 + i * 250, hl = i === 1;
      g.save(); g.globalAlpha = hl ? 1 : 1 - 0.75 * clamp(lt / 0.8);
      blueprintShip(g, W / 2, y, hl ? 900 + 120 * k : 700, 1, hl ? (k > 0 ? '#ffd88a' : '#d8ecff') : '#9fc0e0', { fill: hl ? 0.15 * k : 0, glow: hl ? 20 * k + 6 : 4 });
      g.restore();
      if (!hl) txt(g, n, W / 2, y + 70, { font: F.cond(500, 28), ls: 14, color: '#9fc0e0', alpha: 0.25 });
    });
    txt(g, 'THE SECOND GIANT', W / 2, 120, { font: F.cond(500, 36), ls: 18, color: '#9fd0ff', alpha: clamp(lt * 2) });
    if (k > 0) {
      g.save(); g.fillStyle = 'rgba(5,15,30,0.55)'; g.fillRect(0, H / 2 + 120, W, 200 * easeOut(k)); g.restore();
      revealText(g, 'TITANIC', W / 2, H / 2 + 220, k, { font: F.cond(700, 170), ls: 30, color: '#ffe0a0', shadow: 40, style: 'scale' });
    }
  },
});

export default S1;
