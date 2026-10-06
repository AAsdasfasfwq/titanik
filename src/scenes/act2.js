// ACT 2 — 1909 to 1912: Belfast, the launch, fitting out, luxury, the crew.
import * as THREE from 'three';
import { card, oceanWorld, track, place, cam, paper, dark, toScreen, V } from './common.js';
import { roomWorld, yardWorld, terraces, painting, landscape, glow, chandelier, table, chair, deckSet } from './worlds.js';
import { std, box, cyl, sph, mesh, canvasTex, rng, particles, clamp, easeOut, easeInOut, easeOutBack, lerp, smokeTex, wallpaper, woodTex, dotTex, wobble } from '../lib/kit.js';
import { txt, F, PAL, revealText, measure, shipSilhouette, personIcon, check, cross, strike, callout, nameTag, roundRect, clockIcon, card as card2d, glowBorder } from '../lib/draw2d.js';
import { cutaway, newspaper, stopwatch, counter } from './diagrams.js';
import { person, pose, crowd, gridSpots } from '../lib/people.js';
import { buildLiner, TITANIC, funnelSmoke } from '../lib/ship.js';
import { makeSky, outdoorLights } from '../lib/env.js';
import { grandStaircase } from './sets.js';

const S2 = [];
const typedLine = (g, text, x, y, k, o = {}) => txt(g, text.slice(0, Math.floor(clamp(k) * text.length)), x, y, { align: 'left', ...o });

// 28 — card
S2.push(card(28, '3 YEARS', 'BEFORE THE COLLISION'));

// 29 — the keel of hull 401 is laid
S2.push({
  seg: 29, name: 'keel laid belfast', amb: 'yard', trans: 'fade',
  fx: { bloom: 0.5, saturation: 1.15, contrast: 1.08, tint: [1.02, 1.0, 0.96] },
  sfx: (S) => [{ t: 0.2, type: 'type', n: 22, rate: 0.05, vol: 0.16 }, { t: S.find(30, /401/), type: 'stamp', vol: 0.5 }, { t: S.at(31), type: 'boom', vol: 0.35 }, { t: 1, type: 'clank', vol: 0.2, pitch: 0.5 }],
  build(E) {
    const st = yardWorld({}, E);
    st.setProgress(0.0);
    const plate = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#a0391e'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2efe6'; g.font = '700 170px Oswald'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('401', w / 2, h / 2 + 8); });
    const p = mesh(new THREE.PlaneGeometry(6, 3), std(0xffffff, { map: plate, rough: 0.8 }), 100, 2.2, 1.55, st.scene); void p;
    const workers = [];
    for (let i = 0; i < 6; i++) { const w = person({ coat: ['#3a3226', '#2a2e36', '#4a3a2a'][i % 3], hat: 'flat', tie: false, shirt: '#8a8070' }); w.position.set(70 + i * 9, 1.0, (i % 2 ? 4 : -4)); w.rotation.y = i % 2 ? Math.PI : 0; st.scene.add(w); workers.push(w); }
    st.workers = workers;
    return st;
  },
  update(st, S) {
    const a31 = S.at(31);
    st.setProgress(0.04 + 0.4 * clamp((S.lt - a31) / (S.dur - a31)));
    if (S.lt < a31) track(st.camera, [[0, [130, 3, 16], [80, 2, 0], 36], [a31, [112, 2.6, 9], [96, 2.4, 0], 32]], S.lt);
    else track(st.camera, [[a31, [200, 20, 120], [0, 10, 0], 42], [S.dur, [220, 110, 210], [-10, 20, 0], 42]], S.lt);
    st.workers.forEach((w, i) => pose.hammer(w, S.t, 1, i));
    st.tick(S);
  },
  draw(st, g, S) {
    const { H } = S;
    const k = S.lt;
    typedLine(g, '31 MARCH 1909', 110, H - 330, k / 0.9, { font: F.cond(700, 72), ls: 6, color: '#fff', shadow: 20 });
    typedLine(g, 'BELFAST · IRELAND', 112, H - 266, (k - 0.7) / 0.9, { font: F.cond(400, 34), ls: 12, color: PAL.gold, shadow: 10 });
    const h = S.lt - S.find(29, /hull/);
    if (h > 0 && S.lt < S.at(31)) { txt(g, 'HULL Nº 401', S.W - 110, 160, { font: F.cond(700, 80), align: 'right', ls: 6, color: '#fff', alpha: clamp(h * 3), shadow: 20 }); txt(g, 'TITANIC', S.W - 112, 230, { font: F.cond(500, 40), align: 'right', ls: 18, color: PAL.red2, alpha: clamp(h * 3 - 1), shadow: 10 }); }
    const m = S.lt - S.at(31);
    if (m > 0) revealText(g, 'A MONUMENTAL SCALE', S.W / 2, 170, clamp(m / 0.7), { font: F.cond(700, 90), ls: 10, color: '#fff', shadow: 30 });
  },
});

// 32 — 15,000 workers, 6am to 6pm, deafening rivets
S2.push({
  seg: 32, name: 'workers rivets', amb: 'yard', trans: 'whip',
  fx: { bloom: 0.8, bloomThreshold: 0.6, saturation: 1.15 },
  sfx: (S) => [{ t: 0, type: 'whoosh', vol: 0.2 }, { t: S.find(32, /15,000/), type: 'hit', vol: 0.4 }, { t: S.find(32, /6/), type: 'ticks', n: 6, interval: 0.25, vol: 0.25 }, { t: S.find(33, /hammering/), type: 'hammers', dur: 2.5, rate: 0.09, vol: 0.2 }],
  build(E) {
    const st = yardWorld({}, E); st.setProgress(0.75);
    const spots = [];
    const r = rng(31);
    for (let i = 0; i < 420; i++) { const lvl = Math.floor(r() * 7); spots.push({ x: -130 + r() * 260, y: lvl * 4 + 0.3, z: (r() < 0.5 ? -1 : 1) * (lvl ? 17.5 : 20 + r() * 25), ry: r() * 6 }); }
    st.crowd = crowd(spots, { palette: ['#3a3226', '#2a2e36', '#4a3a2a', '#5a4a3a', '#2a2a2a'], hats: 0.95, seed: 3 }); st.scene.add(st.crowd);
    const heroes = [];
    for (let i = 0; i < 3; i++) { const w = person({ coat: ['#3a3226', '#4a3a2a', '#2a2e36'][i], hat: 'flat', tie: false, shirt: '#9a9080', skin: '#d9a27c' }); w.position.set(36 + i * 2.2, 0.3, 21 - i * 0.6); w.rotation.y = Math.PI; st.scene.add(w); heroes.push(w); }
    st.heroes = heroes;
    st.sparks = particles(160, (i, t) => { const q = rng(i + 9); const ph = (t * 2.2 + q() * 0.3) % 1; const src = Math.floor(q() * 3); const k = (t * 2.2 + 0.0 + src) % 1; void k; return [36 + src * 2.2 + (q() - 0.5) * ph * 4, 1.4 + ph * (2 - ph * 4) * 0.8, 19.6 - src * 0.6 + (q() - 0.5) * ph * 3]; }, { size: 0.12, color: 0xffb040, opacity: 1 });
    st.scene.add(st.sparks);
    return st;
  },
  update(st, S) {
    const c = S.find(33, /deafening/);
    if (S.lt < c) track(st.camera, [[0, [10, 30, 110], [0, 10, 0], 42], [c, [40, 18, 80], [0, 10, 0], 40]], S.lt);
    else track(st.camera, [[c, [38, 1.8, 27], [37, 1.4, 19], 36], [S.dur, [38.5, 1.7, 25.5], [37, 1.4, 19], 32]], S.lt, { shake: 0.04 });
    st.crowd.userData.update(S.t, (d, t, i) => ({ y: d.y + Math.abs(Math.sin(t * 3 + i)) * 0.05 }));
    st.heroes.forEach((h, i) => pose.hammer(h, S.t, 1.3, i * 0.33));
    st.sparks.userData.update(S.t);
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    const a = lt - S.find(32, /15,000/);
    if (a > 0 && lt < S.find(33, /deafening/)) counter(g, W / 2, 210, 15000, 'WORKERS', clamp(a / 1.2), { prefix: '', suffix: '+', size: 140 });
    const b = lt - S.find(32, /morning/) + 0.4;
    if (b > 0) {
      const hrs = 6 + 12 * easeInOut(clamp(b / 2.2));
      g.save(); g.globalAlpha = clamp(b * 3); clockIcon(g, W - 220, H - 330, 110, hrs); g.restore();
      txt(g, '6 AM → 6 PM', W - 220, H - 180, { font: F.cond(600, 40), ls: 6, color: '#fff', alpha: clamp(b * 3), shadow: 10 });
      txt(g, '12 HOURS A DAY', W - 220, H - 135, { font: F.cond(400, 26), ls: 8, color: PAL.gold, alpha: clamp(b * 3 - 1), shadow: 10 });
    }
  },
});

// 34 — brutal conditions: worker high up, no harness, no hard hat
S2.push({
  seg: 34, name: 'no harness', amb: { kind: 'wind', vol: 1.0 }, trans: 'whip',
  fx: { bloom: 0.5, saturation: 1.05, contrast: 1.12, tint: [1.0, 0.98, 0.95] },
  sfx: (S) => [{ t: 0, type: 'whoosh', vol: 0.3 }, { t: S.find(35, /harnesses/), type: 'stamp', vol: 0.45 }, { t: S.find(35, /hardhats/), type: 'stamp', vol: 0.45 }, { t: 0.5, type: 'creak', dur: 2, vol: 0.1 }],
  build(E) {
    const st = yardWorld({}, E); st.setProgress(0.8);
    const beam = box(30, 0.6, 0.5, std(0xa0391e, { rough: 0.8 }), 20, 62, 30, st.scene); beam.castShadow = true;
    const w = person({ coat: '#3a3226', hat: 'flat', tie: false, shirt: '#9a9080', skin: '#d9a27c' }); w.position.set(20, 62.3, 30); w.rotation.y = 0.3; st.scene.add(w); st.w = w;
    return st;
  },
  update(st, S) {
    track(st.camera, [[0, [24, 66, 34], [18, 50, 26], 50], [S.dur, [25, 67, 33], [16, 40, 22], 48]], S.lt, { shake: 0.06 });
    pose.hammer(st.w, S.t, 0.8); st.w.rotation.z = Math.sin(S.t * 1.3) * 0.03;
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, lt } = S;
    revealText(g, 'BRUTAL CONDITIONS', W / 2, 150, clamp(lt / 0.6), { font: F.cond(700, 84), ls: 8, color: '#fff', shadow: 30 });
    const items = [[/harnesses/, 'SAFETY HARNESS'], [/hardhats/, 'HARD HAT']];
    items.forEach(([re, label], i) => {
      const k = lt - S.find(35, re); if (k < 0) return;
      const x = W / 2 - 280 + i * 560, y = 300;
      g.save(); g.globalAlpha = clamp(k * 4); g.fillStyle = 'rgba(10,10,12,0.75)'; roundRect(g, x - 230, y - 50, 460, 100, 14); g.fill(); g.restore();
      cross(g, x - 170, y, 50, PAL.red2, clamp(k / 0.3));
      txt(g, label, x + 30, y, { font: F.cond(600, 44), ls: 4, color: '#fff', alpha: clamp(k * 4) });
    });
  },
});

// 36 — 8 deaths, hundreds injured
S2.push(dark({
  seg: 36, name: 'eight deaths', c1: '#2a0606', c2: '#060101',
  sfx: (S) => [{ t: 0.1, type: 'boom', vol: 0.45 }, ...[...Array(8)].map((_, i) => ({ t: 0.6 + i * 0.18, type: 'tick', vol: 0.3, freq: 1800 })), { t: S.find(36, /hundreds/), type: 'drop', vol: 0.25 }],
  paint(st, g, S) {
    const { W, H, lt } = S;
    txt(g, 'OFFICIALLY', W / 2, 150, { font: F.cond(400, 34), ls: 20, color: '#c9a0a0', alpha: clamp(lt * 2) });
    for (let i = 0; i < 8; i++) { const k = clamp((lt - 0.5 - i * 0.18) / 0.3); personIcon(g, W / 2 - 490 + i * 140, 360, 2.6 * easeOutBack(k), '#f2efe6', { alpha: k }); }
    const c = clamp((lt - 2) / 0.5);
    txt(g, '8 WORKERS KILLED', W / 2, 520, { font: F.cond(700, 92), ls: 6, color: '#fff', alpha: c });
    const h = lt - S.find(36, /hundreds/);
    if (h > 0) {
      const r = rng(5);
      for (let i = 0; i < 240; i++) { const k = clamp((h - i * 0.006) / 0.3); personIcon(g, 140 + (i % 40) * 42, 640 + Math.floor(i / 40) * 52, 0.8, `rgba(230,57,70,${0.4 + r() * 0.5})`, { alpha: k }); }
      txt(g, 'HUNDREDS SERIOUSLY INJURED', W / 2, H - 70, { font: F.cond(500, 40), ls: 10, color: PAL.red2, alpha: clamp(h * 2) });
    }
  },
}));

// 38 — an acceptable price for progress
S2.push({
  seg: 38, name: 'price for progress', amb: 'yard',
  fx: { bloom: 0.9, bloomThreshold: 0.55, saturation: 1.2, contrast: 1.15 },
  sfx: (S) => [{ t: S.find(38, /acceptable/), type: 'hit', vol: 0.3 }, { t: S.find(38, /progress/), type: 'boom', vol: 0.4 }],
  build(E) {
    const st = yardWorld({ sky: { top: '#2a1a3a', mid: '#a04a3a', hor: '#ff9a4a', sun: '#ffb060', sunDir: [0.9, 0.04, 0.3], sunSize: 0.06, stars: 0 }, fog: '#c06a40', sun: 0xff9a50, sunI: 2.5, hemi: 0.4 }, E);
    st.setProgress(0.9);
    return st;
  },
  update(st, S) {
    track(st.camera, [[0, [-260, 10, 140], [0, 30, 0], 38], [S.dur, [-230, 14, 120], [0, 32, 0], 36]], S.lt);
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    revealText(g, 'an acceptable price', W / 2, H / 2 - 60, clamp((lt - S.find(38, /acceptable/) + 0.3) / 0.8), { font: F.serif(84, true, 800), color: '#fff', shadow: 30, style: 'blur' });
    const k = lt - S.find(38, /progress/);
    if (k > 0) revealText(g, 'FOR PROGRESS', W / 2, H / 2 + 60, clamp(k / 0.5), { font: F.cond(700, 110), ls: 16, color: '#ffd23f', shadow: 30, style: 'scale' });
  },
});

// 39 — mountain of steel over the city, 3 million rivets
S2.push({
  seg: 39, name: 'mountain of steel', amb: 'city', trans: 'whip',
  fx: { bloom: 0.6, saturation: 1.15, contrast: 1.08 },
  sfx: (S) => [{ t: 0, type: 'whoosh', vol: 0.25 }, { t: 0.4, type: 'creak', dur: 3, vol: 0.1 }, { t: S.at(40), type: 'hit', vol: 0.45 }, { t: S.at(40) + 0.2, type: 'hammers', dur: 2, rate: 0.05, vol: 0.12 }],
  build(E) {
    const st = yardWorld({}, E); st.setProgress(1);
    terraces(st.scene, { n: 30, rows: 3, x: -60, z: 70, spacing: 7, h: 7, rowGap: 16, seed: 21 });
    terraces(st.scene, { n: 30, rows: 3, x: -60, z: -120, spacing: 7, h: 7, rowGap: 16, seed: 23 });
    // people & a tram on the street
    st.people = crowd(gridSpots(30, 2, 6, 3, { x: -60, z: 60, y: 0, density: 0.5, seed: 4 }), { hats: 0.9 }); st.scene.add(st.people);
    return st;
  },
  update(st, S) {
    const a40 = S.at(40);
    if (S.lt < a40) track(st.camera, [[0, [-70, 1.7, 62], [-20, 30, 0], 50], [a40, [-60, 1.7, 58], [-10, 38, 0], 48]], S.lt);
    else track(st.camera, [[a40, [60, 4, 26], [60, 6, 14], 30], [S.dur, [60, 4, 22], [60, 6, 14], 24]], S.lt);
    st.people.userData.update(S.t, (d, t, i) => ({ x: d.x + ((t * 1.2 + i * 3) % 30) - 15 }));
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, lt } = S;
    if (lt < S.at(40)) { revealText(g, 'A MOUNTAIN OF STEEL', W / 2, 160, clamp((lt - 0.8) / 0.8), { font: F.cond(700, 84), ls: 10, color: '#fff', shadow: 30 }); }
    const k = lt - S.at(40);
    if (k > 0) counter(g, W / 2, 210, 3000000, 'STEEL RIVETS', clamp(k / 1.4), { size: 150, suffix: '+' });
  },
});

// 41 — Thomas Andrews: 16 watertight compartments
S2.push({
  seg: 41, name: 'compartments design', amb: { kind: 'room', vol: 0.6 },
  fx: { bloom: 0.3, bloomThreshold: 0.6, vignette: 0.5 },
  sfx: (S) => [{ t: 0.1, type: 'paper', dur: 0.5, vol: 0.15 }, { t: S.find(41, /16/), type: 'ticks', n: 8, interval: 0.07, vol: 0.2 }, { t: S.find(43, /two/), type: 'splash', vol: 0.15 }, { t: S.find(43, /three/), type: 'splash', vol: 0.15 }, { t: S.find(44, /four/), type: 'splash', vol: 0.18 }, { t: S.find(44, /bow/) + 0.4, type: 'pop', pitch: 700 }],
  draw(st, g, S) {
    const { W, H, lt } = S;
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0d2340'); gr.addColorStop(1, '#03080f'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.save(); g.strokeStyle = 'rgba(150,200,255,0.07)'; for (let x = 0; x < W; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } g.restore();
    const two = S.find(43, /two/), three = S.find(43, /three/), four = S.find(44, /four/);
    const flood = new Array(16).fill(0);
    const f = (t0) => easeOut(clamp((lt - t0) / 0.8)) * 0.75;
    if (lt < four) { flood[3] = f(two); flood[4] = f(two + 0.15); flood[6] = f(three); }
    else { [0, 1, 2, 3].forEach((i) => (flood[i] = f(four + i * 0.12))); }
    const tilt = lt > four ? 0.025 * easeOut(clamp((lt - four) / 1.5)) : 0;
    cutaway(g, W / 2, H / 2 + 60, 1500, { flood, tilt, waterY: H / 2 + 100, sink: lt > two ? 6 : 0, highlight: lt > S.find(41, /16/) && lt < two ? [...Array(16).keys()] : [] });
    nameTag(g, 110, 150, 'THOMAS ANDREWS', 'CHIEF DESIGNER · HARLAND & WOLFF', clamp((lt - 0.3) / 0.8) * (1 - clamp((lt - two + 0.5) / 0.5)));
    const c = lt - S.find(41, /16/);
    if (c > 0) { txt(g, '16', W - 300, 170, { font: F.cond(700, 150), color: '#ffd23f', alpha: clamp(c * 3), shadow: 30, shadowColor: '#ffb000' }); txt(g, 'WATERTIGHT COMPARTMENTS', W - 300, 260, { font: F.cond(500, 28), ls: 8, color: '#fff', alpha: clamp(c * 3 - 1) }); }
    if (lt > two) { const ok = clamp((lt - two - 0.8) / 0.3); txt(g, lt < four ? '2–3 FLOODED' : 'FIRST 4 FLOODED', W / 2, H - 260, { font: F.cond(600, 50), ls: 6, color: '#9fe3ff', alpha: ok }); check(g, W / 2 - 250 - (lt < four ? 0 : 60), H - 190, 46, PAL.green, ok); txt(g, 'STILL AFLOAT', W / 2 + 20, H - 190, { font: F.cond(700, 52), ls: 8, color: PAL.green, alpha: ok }); }
  },
});

// 45 — "Titanic is unsinkable"
S2.push({
  seg: 45, name: 'newspaper unsinkable', trans: 'whip',
  fx: { vignette: 0.6, grain: 0.06 },
  sfx: (S) => [{ t: 0, type: 'whoosh', dur: 0.8, vol: 0.3 }, { t: 0.85, type: 'stamp', vol: 0.55 }, { t: S.at(46), type: 'boom', vol: 0.4 }],
  draw(st, g, S) {
    const { W, H, lt } = S;
    const gr = g.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.7); gr.addColorStop(0, '#3a2a1a'); gr.addColorStop(1, '#0a0705'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const k = easeOut(clamp(lt / 0.85));
    const z = S.at(46);
    const zoom = lt > z ? 1 + easeInOut(clamp((lt - z) / 1.2)) * 0.5 : 1;
    newspaper(g, W / 2, H / 2 + 330 * (zoom - 1), 640, ['TITANIC', 'IS UNSINKABLE'], { rot: (1 - k) * 12 + 0.04, scale: (0.1 + 0.9 * k) * zoom, masthead: 'THE BELFAST HERALD', date: 'BELFAST, 1911', hlColor: lt > z ? '#8a0e18' : '#141210', sub: 'the greatest marvel of the age' });
    if (lt > z) glowBorder(g, W, H, '#ff3040', 0.5 * (1 - clamp((lt - z) / 1.0)));
  },
});

// 47 — card
S2.push(card(47, '1 YEAR', 'BEFORE THE COLLISION'));

// 48 — launch day: 100,000 spectators
function launchYard(E) {
  const st = yardWorld({ sky: { top: '#3a78c8', mid: '#9cc4ea', hor: '#e8eef2', sun: '#fff4d8', sunDir: [0.4, 0.5, 0.6], sunSize: 0.02, stars: 0 }, fog: '#dfe8ee', sunI: 2.8, fogNear: 500, fogFar: 3500 }, E);
  st.setProgress(1);
  st.scaf.visible = false;
  // paint hull properly for launch (black + red)
  const r = rng(48);
  const spots = [];
  for (let i = 0; i < 1400; i++) { const side = r() < 0.5 ? -1 : 1; spots.push({ x: 160 + r() * 140, y: 0.3, z: side * (50 + r() * 200), ry: side > 0 ? Math.PI + (r() - 0.5) : (r() - 0.5) }); }
  // grandstand
  for (let i = 0; i < 6; i++) box(80, 0.8, 4, std(0x7a2a2a, { rough: 0.8 }), 40, 1 + i * 1.6, -40 - i * 4, st.scene);
  for (let i = 0; i < 6; i++) for (let k = 0; k < 40; k++) spots.push({ x: 2 + k * 2 + r() * 0.5, y: 1.4 + i * 1.6, z: -40 - i * 4, ry: 0 });
  // opposite bank & crowds
  const bank = box(400, 2, 2000, std(0x4a5a3a, { rough: 1 }), 1500, 1, 0, st.scene); void bank;
  st.crowd = crowd(spots, { hats: 0.85, seed: 8, palette: ['#2a2c35', '#3a2c24', '#1d2a3a', '#6a5a48', '#5a1f24', '#d8cfb8', '#7a6650', '#2d3a2a'] }); st.scene.add(st.crowd);
  // bunting flags
  const flagCols = [0xc8102e, 0xffffff, 0x1d3a8a];
  for (let i = 0; i < 40; i++) { const f = mesh(new THREE.ConeGeometry(0.6, 1.2, 3), std(flagCols[i % 3], { rough: 0.9 }), -150 + i * 7.5, 66, -41, st.scene); f.rotation.x = Math.PI; }
  return st;
}
S2.push({
  seg: 48, name: 'launch crowd', amb: [{ kind: 'crowd', vol: 1.2 }, 'city'],
  fx: { bloom: 0.5, saturation: 1.2, contrast: 1.06 },
  sfx: (S) => [{ t: 0.15, type: 'type', n: 14, vol: 0.16 }, { t: S.find(49, /100,000/), type: 'hit', vol: 0.4 }, { t: S.find(49, /100,000/) + 0.2, type: 'cheer', dur: 3, vol: 0.25 }],
  build: (E) => launchYard(E),
  update(st, S) {
    track(st.camera, [[0, [330, 30, 260], [100, 15, 0], 40], [S.dur, [290, 60, 300], [60, 12, 0], 40]], S.lt);
    st.crowd.userData.update(S.t, null);
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    typedLine(g, '31 MAY 1911', 110, H - 330, lt / 0.7, { font: F.cond(700, 72), ls: 6, color: '#fff', shadow: 20 });
    typedLine(g, 'LAUNCH DAY · RIVER LAGAN', 112, H - 266, (lt - 0.6) / 0.9, { font: F.cond(400, 34), ls: 12, color: '#ffd23f', shadow: 12 });
    const k = lt - S.find(49, /100,000/);
    if (k > 0) counter(g, W / 2, 190, 100000, 'SPECTATORS', clamp(k / 1.3), { size: 140, suffix: '+' });
    const r = lt - S.find(49, /reporters/);
    if (r > 0) txt(g, '+ REPORTERS FROM AROUND THE WORLD', W / 2, 330, { font: F.cond(400, 32), ls: 8, color: '#fff', alpha: clamp(r * 2), shadow: 10 });
  },
});

// 51 — the hull slides into the water
S2.push({
  seg: 51, name: 'launch slide', amb: [{ kind: 'crowd', vol: 1.0 }, 'city'], trans: 'whip',
  fx: { bloom: 0.5, saturation: 1.2, contrast: 1.06 },
  sfx: (S) => [{ t: S.find(51, /28,000/), type: 'hit', vol: 0.4 }, { t: S.find(51, /slides/), type: 'creak', dur: 4, vol: 0.25 }, { t: S.find(51, /slides/) + 2.5, type: 'splash', vol: 0.5 }, { t: S.find(51, /slides/) + 3, type: 'cheer', dur: 4, vol: 0.3 }, { t: S.at(53), type: 'ticks', n: 6, interval: 0.4, vol: 0.25 }, { t: S.at(53) + 1.6, type: 'bell', freq: 1200, vol: 0.12 }],
  build: (E) => launchYard(E),
  update(st, S) {
    const s0 = S.find(51, /slides/);
    const k = easeInOut(clamp((S.lt - s0) / 6.5));
    st.hull.position.x = k * 320; st.hull.position.y = lerp(12, 0.3, clamp(k * 1.25)); st.hull.rotation.z = -0.02 * Math.sin(k * Math.PI);
    if (S.lt < s0) track(st.camera, [[0, [40, 4, 60], [80, 8, 0], 36], [s0, [60, 4, 55], [80, 8, 0], 34]], S.lt);
    else track(st.camera, [[s0, [380, 14, 160], [150, 8, 0], 42], [S.dur, [420, 18, 180], [260, 6, 0], 42]], S.lt);
    st.crowd.userData.update(S.t, (d, t, i) => ({ y: d.y + (S.lt > s0 + 2.5 ? Math.abs(Math.sin(t * 8 + i)) * 0.4 : 0) }));
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    const t = lt - S.find(51, /28,000/);
    if (t > 0 && lt < S.find(52, /soap/)) counter(g, W / 2, 190, 28000, 'U.S. TONS OF STEEL', clamp(t / 1.2), { size: 130, suffix: '+' });
    const so = lt - S.find(52, /soap/);
    if (so > 0 && lt < S.at(53)) { txt(g, 'SLIPWAYS GREASED WITH', W / 2, 160, { font: F.cond(400, 34), ls: 10, color: '#fff', alpha: clamp(so * 3), shadow: 10 }); txt(g, 'SOAP + ANIMAL FAT', W / 2, 230, { font: F.cond(700, 76), ls: 6, color: '#ffd23f', alpha: clamp(so * 3 - 0.5), shadow: 20 }); txt(g, '≈ 22 TONS', W / 2, 300, { font: F.cond(500, 30), ls: 10, color: '#fff', alpha: clamp(so * 3 - 1), shadow: 10 }); }
    const sw = lt - S.at(53);
    if (sw > 0) { g.save(); g.globalAlpha = clamp(sw * 4); stopwatch(g, W - 250, 260, 120, Math.min(62, sw * 30), 60); g.restore(); txt(g, '62 SECONDS', W - 250, 440, { font: F.cond(700, 54), ls: 6, color: '#fff', alpha: clamp(sw * 2 - 0.6), shadow: 20 }); }
  },
});

// 54 — no champagne; faith in engineering
S2.push(paper({
  seg: 54, name: 'no champagne',
  sfx: (S) => [{ t: 0.2, type: 'glass', vol: 0.12 }, { t: S.find(54, /no/), type: 'stamp', vol: 0.5 }, { t: S.at(55), type: 'whoosh', vol: 0.2 }, { t: S.find(55, /engineering/), type: 'hit', vol: 0.4 }, { t: S.find(55, /luck/), type: 'pop', pitch: 300 }],
  paint(st, g, S) {
    const { W, H, lt } = S;
    const a55 = S.at(55);
    if (lt < a55) {
      // champagne bottle
      const k = easeOutBack(clamp(lt / 0.6));
      g.save(); g.translate(W / 2, H / 2 + 40); g.rotate(-0.35 + Math.sin(lt * 2) * 0.03); g.scale(k, k);
      g.fillStyle = '#1f4a2a'; roundRect(g, -55, -120, 110, 280, 30); g.fill(); g.fillRect(-22, -250, 44, 140);
      g.fillStyle = '#d8b25a'; g.fillRect(-25, -270, 50, 70); g.fillStyle = '#f3e8cf'; roundRect(g, -50, -20, 100, 110, 8); g.fill();
      txt(g, 'CHAMPAGNE', 0, 35, { font: F.cond(600, 20), ls: 2, color: '#5a1014' });
      g.restore();
      const c = clamp((lt - S.find(54, /no/)) / 0.3);
      if (c > 0) { g.save(); g.strokeStyle = PAL.red; g.lineWidth = 22; g.globalAlpha = c; g.beginPath(); g.arc(W / 2, H / 2 + 40, 230, 0, 7); g.stroke(); g.beginPath(); g.moveTo(W / 2 - 160, H / 2 - 120); g.lineTo(W / 2 + 160 * c - 160 + 160, H / 2 + 200 * c - 120 + 0); g.stroke(); g.restore(); }
      revealText(g, 'WHITE STAR TRADITION', W / 2, 140, clamp(lt / 0.6), { font: F.cond(600, 54), ls: 10, color: PAL.ink });
      txt(g, 'no bottle broken against the bow', W / 2, H - 160, { font: F.serif(48), color: '#3a3a3a', alpha: clamp((lt - 0.8) * 2) });
    } else {
      const k = lt - a55;
      revealText(g, 'faith in', W / 2, 230, clamp(k / 0.5), { font: F.serif(60), color: '#3a3a3a', style: 'blur' });
      const e = lt - S.find(55, /engineering/);
      if (e > 0) {
        g.save(); g.translate(W / 2 - 300, H / 2 + 60); g.rotate(lt * 1.2); g.fillStyle = PAL.ink;
        for (let i = 0; i < 10; i++) { g.rotate(Math.PI / 5); g.fillRect(-18, -120, 36, 40); }
        g.beginPath(); g.arc(0, 0, 95, 0, 7); g.fill(); g.fillStyle = PAL.paper; g.beginPath(); g.arc(0, 0, 38, 0, 7); g.fill(); g.restore();
        txt(g, 'ENGINEERING', W / 2 - 300, H / 2 + 250, { font: F.cond(700, 60), ls: 6, color: PAL.ink, alpha: clamp(e * 3) });
      }
      const l = lt - S.find(55, /luck/);
      if (l > 0) {
        g.save(); g.translate(W / 2 + 300, H / 2 + 60); g.fillStyle = '#3a8a4a'; g.globalAlpha = clamp(l * 3);
        for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.beginPath(); g.arc(0, -55, 50, 0, 7); g.fill(); }
        g.restore();
        txt(g, 'LUCK', W / 2 + 300, H / 2 + 250, { font: F.cond(700, 60), ls: 6, color: '#3a8a4a', alpha: clamp(l * 3) });
        cross(g, W / 2 + 300, H / 2 + 60, 200, PAL.red, clamp((l - 0.2) / 0.4));
      }
    }
  },
}));

// 56 — fitting out: engines, boilers, funnels, electrics
S2.push({
  seg: 56, name: 'fitting out', amb: 'yard', trans: 'whip',
  fx: { bloom: 0.5, saturation: 1.15 },
  sfx: (S) => [{ t: 0, type: 'whoosh', vol: 0.2 }, ...[/engines/, /boilers/, /funnels/, /electrical/].map((re) => ({ t: S.find(57, re), type: 'pop', pitch: 500 })), { t: 0.6, type: 'creak', dur: 4, vol: 0.12 }],
  build(E) {
    const st = oceanWorld({ sky: 'overcast', ocean: 'river', envMap: E.envMap, fogColor: '#9aa4ae', fogNear: 700, fogFar: 3500, sunDir: [0.3, 0.7, 0.4], sunI: 1.6, hemi: 1.1, smoke: false });
    const quay = box(400, 6, 60, std(0x5a5550, { rough: 0.9 }), 0, 1, -50, st.scene); quay.receiveShadow = true;
    // floating crane
    const crane = new THREE.Group(); crane.position.set(-4, 0, 34); st.scene.add(crane);
    const red = std(0x8a2a1e, { rough: 0.7 });
    box(30, 6, 24, std(0x2a2a2a), 0, 1, 0, crane); box(6, 70, 6, red, 0, 38, 0, crane);
    const jib = box(4, 4, 50, red, 0, 72, -22, crane); void jib;
    st.funnel = st.ship.userData.funnels[2];
    st.funnelHome = st.funnel.position.clone();
    st.cable = box(0.3, 1, 0.3, std(0x111111), -4, 50, -12, st.scene);
    return st;
  },
  update(st, S) {
    const f = S.find(57, /funnels/);
    const k = easeInOut(clamp((S.lt - (f - 2.5)) / 4));
    st.funnel.position.set(st.funnelHome.x, st.funnelHome.y + (1 - k) * 40, st.funnelHome.z);
    const topY = st.funnel.position.y + 24;
    st.cable.scale.y = Math.max(0.1, 70 - topY); st.cable.position.set(st.funnelHome.x, topY + (70 - topY) / 2, 0);
    track(st.camera, [[0, [120, 40, 200], [0, 25, 0], 38], [S.dur, [60, 30, 170], [-10, 28, 0], 36]], S.lt);
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, lt } = S;
    revealText(g, 'FITTING OUT', W / 2, 140, clamp(lt / 0.6), { font: F.cond(700, 84), ls: 12, color: '#fff', shadow: 30 });
    const items = [[/engines/, 'ENGINES'], [/boilers/, 'BOILERS'], [/funnels/, 'FUNNELS'], [/electrical/, 'ELECTRICS']];
    items.forEach(([re, label], i) => {
      const k = lt - S.find(57, re); if (k < 0) return;
      const x = W / 2 - 540 + i * 360, y = 250;
      g.save(); g.globalAlpha = clamp(k * 4); g.fillStyle = 'rgba(10,12,16,0.8)'; roundRect(g, x - 150, y - 36, 300, 72, 36); g.fill(); g.fillStyle = PAL.gold; g.beginPath(); g.arc(x - 115, y, 14, 0, 7); g.fill(); g.restore();
      txt(g, label, x + 15, y, { font: F.cond(600, 38), ls: 6, color: '#fff', alpha: clamp(k * 4) });
    });
  },
});

// 58 — interiors to rival the finest hotels
function lounge(E, o = {}) {
  const st = roomWorld({ w: 16, d: 12, h: 5, wall: o.wall ?? '#e8dcc0', wallAccent: o.accent ?? '#c9a14a', patternAlpha: 0.3, floor: 'carpet', floorColor: o.carpet ?? '#2a4a3a', floorAccent: '#c9a14a', keyI: 50, hemi: 0.5, cornice: 0xf4ecd8 }, E);
  const { scene } = st;
  for (const x of [-4, 4]) chandelier(scene, x, 4.3, 0, 1.3, { intensity: 10, dist: 14 });
  const r = rng(58);
  for (let i = 0; i < 8; i++) { const x = -5 + (i % 4) * 3.3, z = -2 + Math.floor(i / 4) * 3.5; table(scene, x, z, { w: 1.0, d: 1.0, seats: 2, candle: false }); chair(scene, x - 0.8, z, Math.PI / 2, { fabric: 0x2a5a4a }); chair(scene, x + 0.8, z, -Math.PI / 2, { fabric: 0x2a5a4a }); }
  // columns & palms
  for (const x of [-7, 7]) for (const z of [-5, 5]) { cyl(0.35, 0.4, 5, std(0xf2ead8, { rough: 0.4 }), x, 2.5, z, scene, 16); cyl(0.5, 0.35, 0.5, std(0x8a5a2a), x - Math.sign(x) * 1.2, 0.25, z, scene, 12); for (let k = 0; k < 7; k++) { const leaf = mesh(new THREE.ConeGeometry(0.15, 1.6, 4), std(0x2d6a3a, { rough: 0.8 }), x - Math.sign(x) * 1.2, 1.2, z, scene); leaf.rotation.set(Math.cos(k) * 0.9, k, Math.sin(k) * 0.9); } }
  // tall windows
  for (let i = -2; i <= 2; i++) { const w = mesh(new THREE.PlaneGeometry(1.8, 3), std(0xffffff, { emissive: 0xfff0d0, ei: 0.9 }), i * 3, 2.4, -5.95, scene); void w; }
  void r;
  return st;
}
S2.push({
  at: (E) => E.T(58) - 0.1, name: 'luxury interiors', amb: 'room',
  fx: { bloom: 0.8, bloomThreshold: 0.6, saturation: 1.15, tint: [1.04, 1.0, 0.94] },
  sfx: (S) => [{ t: 0, type: 'shimmer', vol: 0.06 }, { t: S.find(58, /Paris/), type: 'pop', pitch: 600 }, { t: S.find(58, /London/), type: 'pop', pitch: 750 }],
  build: (E) => lounge(E),
  update(st, S) { track(st.camera, [[0, [6, 1.7, 5.5], [-2, 1.6, -2], 46], [S.dur, [2, 2.4, 5.5], [-3, 1.6, -3], 42]], S.lt); },
  draw(st, g, S) {
    const { W, lt } = S;
    revealText(g, 'to rival the finest hotels of', W / 2, 140, clamp(lt / 0.7), { font: F.serif(54), color: '#fff', shadow: 20, style: 'blur' });
    const p = lt - S.find(58, /Paris/), l = lt - S.find(58, /London/);
    if (p > 0) revealText(g, 'PARIS', W / 2 - 220, 240, clamp(p / 0.4), { font: F.cond(700, 96), ls: 14, color: '#ffe2a0', shadow: 30, style: 'scale' });
    if (l > 0) { txt(g, '&', W / 2, 240, { font: F.serif(70), color: '#fff', alpha: clamp(l * 3), shadow: 20 }); revealText(g, 'LONDON', W / 2 + 240, 240, clamp(l / 0.4), { font: F.cond(700, 96), ls: 14, color: '#ffe2a0', shadow: 30, style: 'scale' }); }
  },
});

// 59 — card
S2.push(card(59, '1 MONTH', 'BEFORE THE COLLISION'));

// 60 — fitting out complete: extraordinary
S2.push({
  seg: 60, name: 'titanic complete hero', amb: 'ocean', trans: 'fade',
  fx: { bloom: 0.9, bloomThreshold: 0.65, saturation: 1.2, contrast: 1.08 },
  sfx: (S) => [{ t: 0.1, type: 'type', n: 10, vol: 0.14 }, { t: S.at(61), type: 'shimmer', vol: 0.08 }, { t: S.at(61), type: 'boom', vol: 0.35 }, { t: 1.4, type: 'horn', dur: 2.4, vol: 0.12 }],
  build: (E) => oceanWorld({ sky: 'golden', ocean: 'golden', envMap: E.envMap, wake: true, sunDir: [-0.3, 0.12, -0.95], fogNear: 900, fogFar: 6000 }),
  update(st, S) {
    st.ship.position.x = S.lt * 6; const x = st.ship.position.x;
    const a = -0.4 + S.lt * 0.06;
    place(st.camera, [x + Math.cos(a) * 330, 30 - S.lt * 1.5, Math.sin(a) * -330 + 40], [x, 18, 0]);
    st.camera.fov = 34; st.camera.updateProjectionMatrix();
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    typedLine(g, 'MARCH 1912', 110, H - 330, lt / 0.6, { font: F.cond(700, 64), ls: 6, color: '#fff', shadow: 20 });
    typedLine(g, 'FITTING OUT COMPLETE', 112, H - 270, (lt - 0.5) / 0.8, { font: F.cond(400, 32), ls: 12, color: '#ffd23f', shadow: 10 });
    const k = lt - S.at(61);
    if (k > 0) revealText(g, 'EXTRAORDINARY', W / 2, 170, clamp(k / 0.6), { font: F.cond(700, 120), ls: 18, color: '#fff', shadow: 40, style: 'scale' });
  },
});

// 62 — first-class amenities (infographic)
const AMEN = [[/Turkish/, 'TURKISH BATHS', 'bath'], [/heated/, 'HEATED POOL', 'pool'], [/squash/, 'SQUASH COURT', 'squash'], [/gym/, 'GYMNASIUM', 'gym'], [/Parisian/, 'PARISIAN CAFÉ', 'cafe'], [/grand/, 'GRAND STAIRCASE', 'stairs']];
function amenIcon(g, kind, x, y, s, t) {
  g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = '#ffe2a0'; g.fillStyle = '#ffe2a0'; g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round';
  if (kind === 'bath') { g.beginPath(); g.moveTo(-50, 0); g.lineTo(50, 0); g.lineTo(40, 30); g.lineTo(-40, 30); g.closePath(); g.stroke(); for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * 22, -10); g.bezierCurveTo(i * 22 - 10, -25, i * 22 + 10, -35, i * 22, -50 - Math.sin(t * 3 + i) * 5); g.stroke(); } }
  if (kind === 'pool') { for (let k = 0; k < 3; k++) { g.beginPath(); for (let i = -50; i <= 50; i += 5) g.lineTo(i, -10 + k * 20 + Math.sin(i * 0.12 + t * 3 + k) * 6); g.stroke(); } }
  if (kind === 'squash') { g.save(); g.rotate(-0.6); g.beginPath(); g.ellipse(0, -18, 22, 30, 0, 0, 7); g.stroke(); g.beginPath(); g.moveTo(0, 12); g.lineTo(0, 50); g.stroke(); g.restore(); g.beginPath(); g.arc(30, -30, 9, 0, 7); g.fill(); }
  if (kind === 'gym') { g.fillRect(-50, -6, 100, 12); g.fillRect(-56, -26, 14, 52); g.fillRect(42, -26, 14, 52); g.fillRect(-42, -18, 10, 36); g.fillRect(32, -18, 10, 36); }
  if (kind === 'cafe') { g.beginPath(); g.moveTo(-35, -20); g.lineTo(25, -20); g.lineTo(20, 25); g.lineTo(-30, 25); g.closePath(); g.stroke(); g.beginPath(); g.arc(32, 0, 12, -1.4, 1.4); g.stroke(); for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * 14 - 5, -30); g.quadraticCurveTo(i * 14 + 5, -42, i * 14 - 5, -52 - Math.sin(t * 3 + i) * 3); g.stroke(); } }
  if (kind === 'stairs') { g.beginPath(); g.moveTo(-50, 40); for (let i = 0; i < 5; i++) { g.lineTo(-50 + i * 20, 40 - i * 18); g.lineTo(-30 + i * 20, 40 - i * 18); } g.stroke(); g.beginPath(); g.arc(0, -40, 26, Math.PI, 0); g.stroke(); }
  g.restore();
}
S2.push({
  seg: 62, name: 'amenities', amb: 'room',
  fx: { bloom: 0.4, bloomThreshold: 0.5 },
  sfx: (S) => AMEN.map(([re], i) => ({ t: S.find(i < 4 ? (i === 3 ? 62 : 62) : 63, re), type: 'pop', pitch: 450 + i * 70 })),
  draw(st, g, S) {
    const { W, H, lt } = S;
    const gr = g.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.7); gr.addColorStop(0, '#1a2a24'); gr.addColorStop(1, '#050a08'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // art-deco frame
    g.save(); g.strokeStyle = 'rgba(216,178,90,0.5)'; g.lineWidth = 2; g.strokeRect(60, 60, W - 120, H - 120); g.strokeRect(74, 74, W - 148, H - 148); g.restore();
    txt(g, 'FIRST CLASS', W / 2, 150, { font: F.cond(700, 72), ls: 20, color: '#ffe2a0', alpha: clamp(lt * 2) });
    txt(g, 'on board, for the privileged few', W / 2, 215, { font: F.serif(36), color: '#c8b88a', alpha: clamp(lt * 2 - 0.5) });
    AMEN.forEach(([re, label, kind], i) => {
      const seg = i < 3 ? 62 : i === 3 ? 62 : 63;
      const k = lt - S.find(seg, re); if (k < 0) return;
      const cx = W / 2 - 560 + (i % 3) * 560, cy = 430 + Math.floor(i / 3) * 330;
      const e = easeOutBack(clamp(k / 0.45));
      g.save(); g.globalAlpha = clamp(k * 4); g.fillStyle = 'rgba(216,178,90,0.08)'; roundRect(g, cx - 220, cy - 130, 440, 260, 20); g.fill(); g.strokeStyle = 'rgba(216,178,90,0.6)'; g.lineWidth = 2; roundRect(g, cx - 220, cy - 130, 440, 260, 20); g.stroke(); g.restore();
      amenIcon(g, kind, cx, cy - 30, 1.1 * e, lt);
      txt(g, label, cx, cy + 80, { font: F.cond(600, 40), ls: 6, color: '#fff', alpha: clamp(k * 3) });
    });
  },
});

// 63b — grand staircase beneath a glass dome
S2.push({
  at: (E) => E.find(64, /beneath/) - 0.9, name: 'grand staircase', amb: 'room',
  fx: { bloom: 1.0, bloomThreshold: 0.55, saturation: 1.2, tint: [1.06, 1.0, 0.9] },
  sfx: (S) => [{ t: 0, type: 'whoosh', vol: 0.2 }, { t: 0.4, type: 'shimmer', vol: 0.08, notes: [72, 76, 79, 84, 88] }],
  build: (E) => grandStaircase(E),
  update(st, S) { track(st.camera, [[0, [0, 1.6, 6.5], [0, 4, -2], 52], [S.dur, [0, 2.2, 5.8], [0, 8.6, 0], 56]], S.lt); },
  draw(st, g, S) { revealText(g, 'BENEATH A GLASS DOME', S.W / 2, S.H - 260, clamp((S.lt - 0.6) / 0.6), { font: F.cond(600, 60), ls: 10, color: '#fff', shadow: 30 }); },
});

// 65 — third class: better than many had known ashore
S2.push({
  seg: 65, name: 'third class cabin', amb: ['room', { kind: 'engine', vol: 0.6 }], trans: 'whip',
  fx: { bloom: 0.6, saturation: 1.12, tint: [1.0, 1.0, 1.04] },
  sfx: (S) => [{ t: 0, type: 'whoosh', vol: 0.2 }, { t: S.find(65, /mattresses/), type: 'pop', pitch: 500 }, { t: S.find(66, /basins/), type: 'pop', pitch: 600 }, { t: S.find(66, /better/), type: 'hit', vol: 0.3 }],
  build(E) {
    const st = roomWorld({ w: 4, d: 3.2, h: 2.6, wallTex: canvasTex(64, 64, (g) => { g.fillStyle = '#efeadf'; g.fillRect(0, 0, 64, 64); }), floor: 'wood', floorColor: '#8a6a4a', keyPos: [1, 2.5, 1], keyI: 12, hemi: 0.7 }, E);
    const { scene } = st;
    const frame = std(0x6a4a2a, { rough: 0.5 }), matt = std(0xffffff, { map: canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#e8e4dc'; g.fillRect(0, 0, w, h); g.fillStyle = '#5a7aa8'; for (let x = 0; x < w; x += 16) g.fillRect(x, 0, 6, h); }), rough: 0.9 }), blanket = std(0x8a1d24, { rough: 0.95 });
    for (const sx of [-1, 1]) for (const y of [0.45, 1.5]) { box(0.8, 0.08, 1.9, frame, sx * 1.55, y, -0.4, scene); box(0.75, 0.16, 1.85, matt, sx * 1.55, y + 0.12, -0.4, scene); box(0.76, 0.05, 1.0, blanket, sx * 1.55, y + 0.22, 0.05, scene); }
    const basin = box(0.6, 0.12, 0.45, std(0xf8f8f8, { rough: 0.2 }), 0, 0.9, -1.35, scene); void basin; box(0.5, 0.8, 0.4, frame, 0, 0.42, -1.35, scene);
    const port = mesh(new THREE.CircleGeometry(0.22, 24), std(0xffffff, { emissive: 0xbfe0ff, ei: 2.2 }), 0, 1.75, -1.58, scene); void port;
    const fam = [person({ female: true, dress: '#4a5a3a', hair: '#6a4a2a', hat: 'flat', hatColor: '#6a5a4a' }), person({ coat: '#4a3a2a', hat: 'flat', tie: false }), person({ coat: '#5a6a8a', scale: 0.62, tie: false })];
    pose.sit(fam[0]); fam[0].position.set(-1.45, 0.05, 0.3); fam[0].rotation.y = Math.PI / 2;
    pose.sit(fam[1]); fam[1].position.set(1.45, 0.05, 0.3); fam[1].rotation.y = -Math.PI / 2;
    fam[2].position.set(0.2, 0, 0.5); fam[2].rotation.y = Math.PI * 0.9;
    fam.forEach((p) => scene.add(p)); st.fam = fam;
    return st;
  },
  update(st, S) { track(st.camera, [[0, [0.3, 1.5, 1.5], [0, 0.9, -0.6], 62], [S.dur, [-0.2, 1.4, 1.35], [0, 1.0, -0.8], 58]], S.lt); st.fam.forEach((p, i) => pose.idle(p, S.t, i)); },
  draw(st, g, S) {
    const { W, H, lt } = S;
    txt(g, 'THIRD CLASS', 110, 130, { font: F.cond(700, 64), ls: 8, color: '#fff', align: 'left', alpha: clamp(lt * 2), shadow: 20 });
    txt(g, 'mostly emigrants', 112, 190, { font: F.serif(34), color: '#e8e0d0', align: 'left', alpha: clamp(lt * 2 - 0.5), shadow: 10 });
    [[65, /mattresses/, 'MATTRESSES'], [66, /basins/, 'WASH BASINS']].forEach(([seg, re, label], i) => {
      const k = lt - S.find(seg, re); if (k < 0) return;
      const y = 300 + i * 80;
      check(g, 140, y, 40, PAL.green, clamp(k / 0.4)); txt(g, label, 180, y, { font: F.cond(600, 44), align: 'left', ls: 4, color: '#fff', alpha: clamp(k * 3), shadow: 10 });
    });
    const b = lt - S.find(66, /better/);
    if (b > 0) revealText(g, 'BETTER THAN MANY HAD KNOWN ASHORE', W / 2, H - 260, clamp(b / 0.7), { font: F.cond(600, 52), ls: 6, color: '#ffd23f', shadow: 20 });
  },
});

// 67-70 — the crew & Captain Smith
S2.push({
  seg: 67, name: 'captain smith', amb: ['ocean', { kind: 'wind', vol: 0.4 }], trans: 'whip',
  fx: { bloom: 0.7, bloomThreshold: 0.65, saturation: 1.15, contrast: 1.06 },
  sfx: (S) => [{ t: 0, type: 'whoosh', vol: 0.2 }, { t: S.at(68), type: 'pop', pitch: 420 }, { t: S.find(68, /62/), type: 'hit', vol: 0.3 }, { t: S.at(70), type: 'shimmer', vol: 0.06 }],
  build(E) {
    const st = oceanWorld({ sky: 'day', ocean: 'day', envMap: E.envMap, sunDir: [0.6, 0.5, 0.6], smoke: true });
    const { scene } = st;
    const by = st.ship.userData.boatDeckY;
    const crew = [];
    const types = [{ coat: '#151a2a', hat: 'officer' }, { coat: '#f2efe6', pants: '#151515', tie: '#111' }, { coat: '#2a2a2a', hat: 'flat', tie: false, shirt: '#6a6a6a' }];
    for (let i = 0; i < 14; i++) { const p = person({ ...types[i % 3], skin: ['#e8b896', '#d9a27c', '#f0c8a8'][i % 3] }); p.position.set(40 - i * 1.3, by - 1.2, 10); scene.add(p); crew.push(p); }
    const smith = person({ coat: '#141a2c', hat: 'officer', beard: true, hair: '#d8d8d8', beardColor: '#eeeeee', skin: '#e8b8a0' });
    smith.position.set(78, by + 2.1, 9); smith.rotation.y = Math.PI * 0.85; scene.add(smith);
    // gold cuffs
    Object.assign(st, { crew, smith });
    return st;
  },
  update(st, S) {
    const a68 = S.at(68);
    if (S.lt < a68) track(st.camera, [[0, [27, 19.6, 14], [38, 18.6, 9.5], 50], [a68, [25, 19.8, 13.5], [40, 18.6, 9.5], 50]], S.lt);
    else track(st.camera, [[a68, [76.4, 22.9, 12.4], [78, 22.6, 9], 34], [S.dur, [76.9, 22.8, 11.7], [78, 22.7, 9], 26]], S.lt);
    st.crew.forEach((p, i) => pose.idle(p, S.t, i)); pose.idle(st.smith, S.t * 0.5);
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    if (lt < S.at(68)) revealText(g, 'THE CREW IS ASSEMBLED', W / 2, 150, clamp(lt / 0.5), { font: F.cond(700, 76), ls: 10, color: '#fff', shadow: 30 });
    nameTag(g, 110, H - 320, 'CAPTAIN EDWARD JOHN SMITH', 'WHITE STAR LINE · COMMODORE', clamp((lt - S.find(68, /Captain/)) / 0.8));
    const a = lt - S.find(68, /62/);
    if (a > 0) { txt(g, '62', W - 200, 200, { font: F.cond(700, 160), color: '#ffd23f', alpha: clamp(a * 3), shadow: 30 }); txt(g, 'YEARS OLD', W - 200, 300, { font: F.cond(500, 34), ls: 10, color: '#fff', alpha: clamp(a * 3 - 1), shadow: 10 }); }
    const f = lt - S.at(70);
    if (f > 0) { revealText(g, 'HIS FINAL VOYAGE', W / 2, 170, clamp(f / 0.6), { font: F.cond(700, 84), ls: 10, color: '#fff', shadow: 30 }); txt(g, 'before retirement', W / 2, 250, { font: F.serif(44), color: '#ffe2a0', alpha: clamp(f * 2 - 0.6), shadow: 20 }); }
  },
});

// 71 — roughly 900 crew
S2.push(dark({
  seg: 71, name: 'crew 900', c1: '#0e1c2e', c2: '#03070d',
  sfx: (S) => [{ t: 0.1, type: 'hit', vol: 0.35 }, { t: 0.5, type: 'ticks', n: 10, interval: 0.08, vol: 0.18 }, { t: S.find(71, /stokers/), type: 'pop', pitch: 400 }, { t: S.find(71, /stewards/), type: 'pop', pitch: 600 }],
  paint(st, g, S) {
    const { W, H, lt } = S;
    counter(g, W / 2, 170, 900, 'CREW MEMBERS', clamp(lt / 1.0), { prefix: '≈ ', size: 140 });
    const groups = [['DECK', 73, '#9fd0ff'], ['ENGINE ROOM', 325, '#ff8a4a'], ['VICTUALLING', 494, '#ffd23f']];
    let x = 160; const total = 892, bw = W - 320;
    groups.forEach(([label, n, col], i) => {
      const k = easeOut(clamp((lt - 0.5 - i * 0.4) / 0.8));
      const w = (n / total) * bw;
      g.fillStyle = col; g.globalAlpha = 0.9; roundRect(g, x, 420, Math.max(2, w * k - 6), 70, 8); g.fill(); g.globalAlpha = 1;
      txt(g, label, x + w / 2, 540, { font: F.cond(600, 34), ls: 4, color: col, alpha: k });
      txt(g, String(Math.round(n * k)), x + w / 2, 455, { font: F.cond(700, 40), color: '#081018', alpha: k });
      x += w;
    });
    const st1 = lt - S.find(71, /stokers/), st2 = lt - S.find(71, /stewards/);
    for (let i = 0; i < 40; i++) { const k = clamp((st1 - i * 0.02) / 0.3); personIcon(g, 200 + i * 38, 700, 1, '#ff8a4a', { alpha: k }); }
    for (let i = 0; i < 40; i++) { const k = clamp((st2 - i * 0.02) / 0.3); personIcon(g, 200 + i * 38, 830, 1, '#ffd23f', { alpha: k }); }
    if (st1 > 0) txt(g, 'from boiler-room stokers…', 200, 630, { font: F.serif(36), align: 'left', color: '#ffb080', alpha: clamp(st1 * 2) });
    if (st2 > 0) txt(g, '…to dining-room stewards', W - 200, 930, { font: F.serif(36), align: 'right', color: '#ffe2a0', alpha: clamp(st2 * 2) });
  },
}));

export default S2;
