// ACT 4 — the collision, the flooding, the evacuation, the sinking.
import * as THREE from 'three';
import { card, oceanWorld, track, place, cam, paper, dark, toScreen, V, NIGHT, GLASS } from './common.js';
import { roomWorld, painting, landscape, glow, chandelier, deckSet, underwaterWorld } from './worlds.js';
import { wirelessRoom, bridgeSet, diningSaloon, grandStaircase } from './sets.js';
import { std, box, cyl, sph, mesh, canvasTex, rng, particles, clamp, easeOut, easeIn, easeInOut, easeOutBack, lerp, smokeTex, metalTex, woodTex, wobble, dotTex } from '../lib/kit.js';
import { txt, F, PAL, revealText, measure, shipSilhouette, personIcon, boatIcon, check, cross, strike, callout, nameTag, roundRect, clockIcon, radioWaves, icebergIcon, glowBorder } from '../lib/draw2d.js';
import { cutaway, counter, stopwatch } from './diagrams.js';
import { person, pose, crowd, gridSpots } from '../lib/people.js';
import { buildLiner, TITANIC } from '../lib/ship.js';
import { makeIceberg } from '../lib/env.js';

const S4 = [];
const L = TITANIC.L;

// ---------- helpers ----------
/** night ship world, stopped & sinking. tilt: rad (negative = bow down) */
function sinkingWorld(E, o = {}) {
  const st = oceanWorld({ ...GLASS, envMap: E.envMap, lights: 1, smoke: o.smoke ?? false, fogNear: 800, fogFar: 5000, ...o });
  st.pivot = new THREE.Group(); st.scene.add(st.pivot);
  st.scene.remove(st.ship); st.pivot.add(st.ship);
  st.setSink = (tilt, depth) => { st.pivot.rotation.z = tilt; st.pivot.position.y = -depth; };
  st.pivot.position.set(o.pivotX ?? 60, 0, 0); st.ship.position.x = -(o.pivotX ?? 60);
  return st;
}
function rocketBurst(t, t0, x, y, z) {
  const k = t - t0;
  return k;
}

// 149 — the bridge: "Hard a-starboard!", full astern
S4.push({
  seg: 149, name: 'hard a starboard', amb: ['engine', { kind: 'dark', vol: 0.6 }], lead: 0.1,
  fx: { bloom: 0.8, bloomThreshold: 0.55, saturation: 1.05, tint: [0.95, 0.98, 1.08], vignette: 0.7 },
  sfx: (S) => [{ t: S.at(150), type: 'stamp', vol: 0.6 }, { t: S.at(150) + 0.3, type: 'wheel', n: 26, rate: 0.04 }, { t: S.find(153, /telegraph/), type: 'telegraph', vol: 0.25 }, { t: S.find(153, /astern/), type: 'telegraph', vol: 0.3 }, { t: S.find(153, /astern/) + 0.3, type: 'creak', dur: 2.5, vol: 0.2 }],
  build(E) {
    const st = bridgeSet(E, { night: true });
    const mur = person({ coat: '#141a2c', hat: 'officer', mustache: true, hair: '#3a2a1e' }); mur.position.set(1.5, 0, -0.9); mur.rotation.y = -Math.PI * 0.6; st.scene.add(mur);
    const hel = person({ coat: '#1d2230', hat: 'cap', hatColor: '#1d2230', tie: false }); hel.position.set(0, 0, 0.85); hel.rotation.y = Math.PI; st.scene.add(hel);
    Object.assign(st, { mur, hel });
    return st;
  },
  update(st, S) {
    const a150 = S.at(150), a152 = S.at(152), a153 = S.at(153);
    const turn = clamp((S.lt - a150 - 0.3) / 1.4);
    st.wheel.rotation.z = -turn * 5.5;
    const tel = clamp((S.lt - S.find(153, /astern/)) / 0.4); st.tele[1].lever.rotation.z = lerp(-1.2, 1.2, easeOut(tel));
    st.mur.userData.armR.rotation.x = S.lt > a150 ? -1.6 : -0.2; st.mur.userData.head.rotation.y = Math.sin(S.t * 4) * 0.1;
    pose.reach(st.hel, 'R', 1); pose.reach(st.hel, 'L', 1); st.hel.userData.torso.rotation.y = -turn * 0.3;
    if (S.lt < a150) track(st.camera, [[0, [2.6, 1.7, 0.6], [1.5, 1.6, -0.9], 40], [a150, [2.4, 1.7, 0.4], [1.5, 1.65, -0.9], 36]], S.lt);
    else if (S.lt < a152) track(st.camera, [[a150, [0, 1.6, 2.0], [0, 1.25, 0.2], 34], [a152, [0, 1.5, 1.3], [0, 1.25, 0.2], 28]], S.lt, { shake: 0.01 });
    else if (S.lt < a153) track(st.camera, [[a152, [0, 9, 0], [0, 0, -0.01], 50], [a153, [0, 9, 0], [0, 0, -0.01], 50]], S.lt);
    else track(st.camera, [[a153, [3.2, 1.5, 0.6], [2.2, 1.2, -0.6], 34], [S.dur, [2.9, 1.45, 0.1], [2.2, 1.2, -0.6], 28]], S.lt, { shake: S.lt > S.find(153, /astern/) ? 0.02 : 0 });
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    nameTag(g, 110, H - 330, '1ST OFFICER WILLIAM MURDOCH', 'OFFICER OF THE WATCH', clamp((lt - 0.2) / 0.6) * (lt < S.at(150) ? 1 : 0));
    const h = lt - S.at(150);
    if (h > 0 && lt < S.at(152)) { const sc = 1 + 0.5 * (1 - easeOut(clamp(h / 0.2))); g.save(); g.translate(W / 2, 200); g.scale(sc, sc); txt(g, '“HARD A-STARBOARD!”', 0, 0, { font: F.cond(700, 110), ls: 6, color: '#fff', shadow: 40 }); g.restore(); txt(g, 'HELMSMAN ROBERT HICHENS', W / 2, 300, { font: F.cond(500, 34), ls: 10, color: '#ffd23f', alpha: clamp((lt - S.at(151)) * 3), shadow: 10 }); }
    const d = lt - S.at(152);
    if (d > 0 && lt < S.at(153)) {
      // tiller order explanation
      g.fillStyle = 'rgba(4,8,16,0.85)'; g.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2 + 60;
      g.save(); g.translate(cx, cy); const turn = -0.5 * easeInOut(clamp((d - 0.8) / 1.6)); g.rotate(turn);
      shipSilhouette(g, 0, 0, 900, '#e8e2d4', { funnels: 4, squash: 0.25 }); g.restore();
      g.save(); g.strokeStyle = '#ffd23f'; g.lineWidth = 8; g.setLineDash([18, 12]); g.beginPath(); g.arc(cx - 200, cy - 520, 600, Math.PI * 0.25, Math.PI * 0.5 - 0.3 * clamp((d - 0.8) / 1.6)); g.stroke(); g.restore();
      txt(g, 'ORDER: “STARBOARD” (TILLER COMMAND)', W / 2, 160, { font: F.cond(600, 50), ls: 4, color: '#fff', alpha: clamp(d * 3) });
      txt(g, 'RESULT: THE BOW TURNS LEFT ←', W / 2, 240, { font: F.cond(700, 60), ls: 4, color: '#ffd23f', alpha: clamp(d * 3 - 1) });
    }
    const a = lt - S.find(153, /astern/);
    if (a > 0) { g.save(); g.globalAlpha = clamp(a * 4); g.fillStyle = PAL.red2; roundRect(g, W / 2 - 280, 120, 560, 120, 16); g.fill(); txt(g, 'FULL ASTERN', W / 2, 180, { font: F.cond(700, 84), ls: 10, color: '#fff' }); g.restore(); }
  },
});

// 154 — the longest minute: top-down race between bow and ice
S4.push({
  seg: 154, name: 'turning too slow', amb: [{ kind: 'dark', vol: 1 }, { kind: 'night', vol: 0.4 }],
  fx: { bloom: 0.9, bloomThreshold: 0.5, saturation: 1.0, tint: [0.92, 0.98, 1.1], vignette: 0.75 },
  sfx: (S) => [{ t: 0.2, type: 'heartbeat', n: Math.floor(S.dur / 0.75), bpm: 80, vol: 0.4 }, { t: 0.1, type: 'riser', dur: S.dur - 0.3, vol: 0.12 }, { t: S.at(158), type: 'creak', dur: 3, vol: 0.15 }, { t: S.at(160), type: 'hit', vol: 0.4 }],
  build(E) {
    const st = oceanWorld({ ...GLASS, envMap: E.envMap, lights: 1, smoke: true, fogNear: 1500, fogFar: 6000, wake: true });
    st.berg = makeIceberg({ r: 30, seed: 137, top: '#2a3a48', side: '#16283a', under: '#04080e', glow: '#0a1a2a', ei: 0.5, height: 1.3 }); st.scene.add(st.berg);
    return st;
  },
  update(st, S) {
    const p = S.lt / S.dur;
    const swing = easeIn(clamp((S.lt - S.at(158) + 1.5) / (S.dur - S.at(158) + 1.5)));
    st.ship.rotation.y = swing * 0.28;
    st.ship.position.set(S.lt * 9, 0, 0);
    st.berg.position.set(S.dur * 9 + 175, -5, 10);
    const x = st.ship.position.x;
    const a157 = S.at(157);
    if (S.lt < a157) track(st.camera, [[0, [x + 60, 480, 40], [x + 120, 0, 0], 38], [a157, [x + 80, 420, 30], [x + 130, 0, 0], 36]], S.lt);
    else track(st.camera, [[a157, [x + 230, 6, 70], [x + 100, 14, 0], 42], [S.dur, [x + 205, 5, 70], [x + 110, 16, 0], 40]], S.lt);
    S.fx.zoomBlur = 0.06 * p;
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    const a157 = S.at(157);
    // stopwatch of the 37 seconds
    g.save(); g.globalAlpha = 0.95; stopwatch(g, W - 200, 210, 100, Math.min(37, lt * 37 / S.dur), 60); g.restore();
    txt(g, '≈ 37 SECONDS', W - 200, 360, { font: F.cond(600, 34), ls: 6, color: '#fff', shadow: 10 });
    if (lt < a157) {
      const bow = toScreen(V(st.ship.position.x + L / 2, 0, 0), st.camera), ice = toScreen(st.berg.position.clone(), st.camera);
      g.save(); g.setLineDash([10, 8]); g.strokeStyle = '#ffd23f'; g.lineWidth = 3; g.beginPath(); g.moveTo(bow[0], bow[1]); g.lineTo(ice[0], ice[1]); g.stroke(); g.restore();
      const dist = Math.max(0, (st.berg.position.x - st.ship.position.x - L / 2));
      txt(g, `${Math.round(dist * 3.28)} FT`, (bow[0] + ice[0]) / 2, (bow[1] + ice[1]) / 2 - 30, { font: F.cond(700, 54), color: '#ffd23f', shadow: 20 });
      txt(g, 'MOMENTUM: 52,000 TONS AT 22 KNOTS', W / 2, H - 260, { font: F.cond(600, 40), ls: 4, color: '#fff', alpha: clamp((lt - S.at(155)) * 2), shadow: 20 });
    }
    const t157 = lt - a157;
    if (t157 > 0 && lt < S.at(158)) revealText(g, 'SECONDS STRETCH INTO AN ETERNITY', W / 2, 160, clamp(t157 / 0.8), { font: F.cond(700, 64), ls: 6, color: '#fff', shadow: 30, style: 'blur' });
    const sw = lt - S.at(158);
    if (sw > 0 && lt < S.at(160)) revealText(g, 'THE BOW BEGINS TO SWING LEFT', W / 2, 160, clamp(sw / 0.6), { font: F.cond(700, 64), ls: 6, color: '#9fe3ff', shadow: 30 });
    const too = lt - S.at(160);
    if (too > 0) { revealText(g, 'TOO LARGE · TOO CLOSE', W / 2, 170, clamp(too / 0.5), { font: F.cond(700, 96), ls: 10, color: PAL.red2, shadow: 30, style: 'scale' }); }
  },
});

// 161 — not head-on: a scrape along the starboard side
S4.push({
  seg: 161, name: 'scrape diagram', amb: { kind: 'dark', vol: 1 },
  fx: { bloom: 0.4, bloomThreshold: 0.5 },
  sfx: (S) => [{ t: 0.3, type: 'hit', vol: 0.3 }, { t: S.find(162, /scrapes/), type: 'tear', dur: 2.5, vol: 0.35 }],
  draw(st, g, S) {
    const { W, H, lt } = S;
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#081628'); gr.addColorStop(1, '#02060c'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const a162 = S.at(162);
    // left: what might have been
    const ka = easeOut(clamp(lt / 0.6));
    g.save(); g.globalAlpha = ka * (lt > a162 ? 0.35 : 1);
    g.save(); g.translate(W * 0.27, H / 2 + 40); g.rotate(-Math.PI / 2); shipSilhouette(g, 0, 0, 520, '#cfd8e0', { funnels: 4, squash: 0.25 }); g.restore();
    icebergIcon(g, W * 0.27, H / 2 - 330, 0.9, { under: false });
    g.fillStyle = PAL.red2; g.beginPath(); g.arc(W * 0.27, H / 2 - 250, 26 + Math.sin(lt * 8) * 4, 0, 7); g.fill();
    txt(g, 'HEAD-ON', W * 0.27, 140, { font: F.cond(700, 56), ls: 8, color: '#fff' });
    txt(g, 'crushed bow — might have survived', W * 0.27, 200, { font: F.serif(32), color: '#cfd8e0' });
    g.restore();
    // right: what happened
    const kb = clamp((lt - a162 + 0.3) / 0.6);
    if (kb > 0) {
      const sc = clamp((lt - S.find(162, /scrapes/)) / 2.5);
      g.save(); g.globalAlpha = kb;
      g.save(); g.translate(W * 0.72, H / 2 + 60); g.rotate(-Math.PI / 2 + 0.28); shipSilhouette(g, 0, 0, 560, '#e8e2d4', { funnels: 4, squash: 0.25 }); g.restore();
      const ix = W * 0.72 + 95, iy = H / 2 - 280 + sc * 300;
      icebergIcon(g, ix, iy, 0.8, { under: false });
      g.strokeStyle = PAL.red2; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(W * 0.72 + 70, H / 2 - 190); g.lineTo(W * 0.72 + 70 - sc * 70, H / 2 - 190 + sc * 260); g.stroke();
      txt(g, 'STARBOARD SCRAPE', W * 0.72, 140, { font: F.cond(700, 56), ls: 8, color: PAL.red2 });
      txt(g, 'gashes along the side, below the waterline', W * 0.72, 200, { font: F.serif(32), color: '#ffb0a0' });
      g.restore();
    }
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(W / 2 - 1, 120, 2, H - 240);
  },
});

// 163 — several feet below the surface, ancient ice tears at the steel
S4.push({
  seg: 163, name: 'underwater scrape', amb: [{ kind: 'underwater', vol: 1 }],
  fx: { bloom: 0.9, bloomThreshold: 0.5, saturation: 1.1, tint: [0.9, 1.0, 1.1], vignette: 0.75 },
  sfx: (S) => [{ t: 0.1, type: 'tear', dur: 3.5, vol: 0.4 }, { t: 1.2, type: 'clank', vol: 0.2, pitch: 0.4 }, { t: 2.0, type: 'clank', vol: 0.18, pitch: 0.5 }, { t: 2.6, type: 'bubbles', n: 20, dur: 1.5, vol: 0.06 }],
  build(E) {
    const st = underwaterWorld({ color: '#06243a', density: 0.02, hemi: 1.6, bedY: -60, lampI: 1500 }, E);
    const fill = new THREE.DirectionalLight(0x7ab8e0, 1.2); fill.position.set(20, 30, 40); st.scene.add(fill);
    const hull = box(400, 20, 1, std(0xffffff, { map: metalTex('#101214', { repeat: [40, 2] }), rough: 0.5, metal: 0.4 }), 0, 0, 0, st.scene);
    const bottom = box(400, 1, 30, std(0x8e1e16, { rough: 0.7 }), 0, -10, -15, st.scene); void bottom; void hull;
    const berg = makeIceberg({ r: 22, seed: 7, height: 1.2, depth: 1.2, ei: 0.6, glow: '#1a5a7a' }); berg.position.set(0, 0, 18); st.scene.add(berg); st.berg = berg;
    st.jets = particles(400, (i, t) => { const q = rng(i + 5); const seam = Math.floor(q() * 6); const sx = -30 + seam * 12; const age = (t * 1.2 + q()) % 1; return [sx + (q() - 0.5) * 2 + age * 2, -2 + (q() - 0.5) * 3, 0.5 - age * 8]; }, { size: 0.6, color: 0xcfefff, opacity: 0.7 });
    st.scene.add(st.jets);
    st.rivets = particles(120, (i, t) => { const q = rng(i + 50); const t0 = q() * 3; const age = Math.max(0, t - t0); return [-40 + q() * 80 + age * 2, -2 + (q() - 0.5) * 4 - age * age * 2, 0.6 + age * 3]; }, { size: 0.25, color: 0xffb060, opacity: 1 });
    st.scene.add(st.rivets);
    st.lamp.position.set(10, 6, 14); st.lamp.target.position.set(0, -2, 0);
    return st;
  },
  update(st, S) {
    st.berg.position.x = 30 - S.lt * 9; st.berg.rotation.y = S.lt * 0.05;
    track(st.camera, [[0, [45, -7, 10], [-10, -2, 4], 50], [S.dur, [38, -7, 10], [-15, -2, 4], 48]], S.lt, { shake: 0.12 });
    st.jets.userData.update(S.lt); st.rivets.userData.update(S.lt);
    st.jets.visible = S.lt > 0.6;
    st.tick(S);
  },
  draw(st, g, S) { txt(g, 'BELOW THE WATERLINE', 110, 120, { font: F.cond(700, 50), ls: 8, color: '#9fe3ff', align: 'left', alpha: clamp(S.lt * 2), shadow: 20 }); txt(g, 'rivets snap · seams open', 112, 175, { font: F.serif(34), color: '#fff', align: 'left', alpha: clamp(S.lt * 2 - 1), shadow: 10 }); },
});

// 164 — no explosive crash: a shudder, ice on deck
S4.push({
  seg: 164, name: 'shudder ice on deck', amb: ['night', { kind: 'room', vol: 0.4 }],
  fx: { bloom: 0.8, bloomThreshold: 0.55, saturation: 1.1 },
  sfx: (S) => [{ t: 0.3, type: 'creak', dur: 1.5, vol: 0.15 }, { t: S.at(165) - 0.1, type: 'glass', vol: 0.05 }, { t: S.at(166), type: 'splash', vol: 0.15 }, { t: S.at(166) + 0.3, type: 'clank', vol: 0.12, pitch: 2 }, { t: S.find(168, /laugh/), type: 'cheer', dur: 2, vol: 0.12 }, { t: S.find(168, /kick/), type: 'thump', vol: 0.2 }],
  build(E) {
    // cabin part
    const cab = roomWorld({ w: 5, d: 4, h: 2.8, wall: '#e8dcc0', wallAccent: '#7a8a5a', floor: 'carpet', floorColor: '#2a3a5a', keyI: 10, hemi: 0.5 }, E);
    const t = box(0.8, 0.05, 0.6, std(0x5a3418), 0, 0.7, 0, cab.scene); void t;
    const glass = mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.14, 16), std(0xe8f4ff, { rough: 0.05, transparent: true, opacity: 0.4 }), 0, 0.8, 0, cab.scene);
    const water = mesh(new THREE.CylinderGeometry(0.044, 0.04, 0.09, 16), std(0x9fd8ff, { rough: 0.05, transparent: true, opacity: 0.6 }), 0, 0.775, 0, cab.scene);
    const lampG = glow(0xffd8a0, 0.6, 0.9); lampG.position.set(-0.8, 1.6, -1.6); cab.scene.add(lampG);
    // deck part
    const st = oceanWorld({ ...GLASS, envMap: E.envMap, lights: 1, smoke: false });
    const ice = [];
    const r = rng(164);
    for (let i = 0; i < 40; i++) { const m = makeIceberg({ r: 0.3 + r() * 0.5, seed: i + 400, detail: 1, height: 0.8, depth: 0.8, spiky: 0.3, ei: 0.5 }); st.scene.add(m); ice.push({ m, x: 104 + r() * 8, z: (r() - 0.5) * 18, d: r() }); }
    const kids = [];
    for (let i = 0; i < 4; i++) { const p = person({ coat: ['#4a3a2a', '#3a3226', '#5a4a3a', '#2a2e36'][i], hat: 'flat', tie: false, skin: '#e8b896' }); p.position.set(101 + i * 1.5, 14.0, (i - 1.5) * 2.5); p.rotation.y = -Math.PI / 2 + i * 0.4; st.scene.add(p); kids.push(p); }
    Object.assign(st, { cab, glass, water, ice, kids });
    return st;
  },
  update(st, S) {
    const a166 = S.at(166);
    if (S.lt < a166) {
      st.active = st.cab;
      const sh = Math.max(0, 1 - Math.abs(S.lt - 0.8) / 1.5);
      st.glass.position.x = Math.sin(S.t * 60) * 0.004 * sh; st.water.scale.y = 1 + Math.sin(S.t * 40) * 0.08 * sh;
      track(st.cab.camera, [[0, [0.3, 0.95, 0.5], [0, 0.8, 0], 34], [a166, [0.25, 0.92, 0.42], [0, 0.8, 0], 30]], S.lt, { shake: 0.01 * sh });
      st.scene = st.cab.scene; st.camera = st.cab.camera;
    } else {
      st.scene = st.cab.scene === st.scene ? st._deck ?? st.scene : st.scene;
      st.scene = st._deckScene; st.camera = st._deckCam;
      const k = S.lt - a166;
      st.ice.forEach((o, i) => { const fall = clamp((k - o.d * 0.8) / 0.6); o.m.position.set(o.x, lerp(30, 14.3, easeIn(fall)), o.z); });
      const kick = S.find(168, /kick/);
      st.kids.forEach((p, i) => { pose.idle(p, S.t, i); if (S.lt > kick) { const s = (S.t * 2 + i) % 1; p.userData.legR.rotation.x = s < 0.3 ? -1.2 * Math.sin(s / 0.3 * Math.PI) : 0; } });
      if (S.lt > kick) { const o = st.ice[0]; o.m.position.set(102 + ((S.lt - kick) * 3) % 5, 14.3 + Math.abs(Math.sin((S.lt - kick) * 5)) * 0.6, 0); }
      track(st.camera, [[a166, [96, 16.5, 9], [106, 14.5, 0], 46], [S.dur, [97, 16, 8], [105, 14.4, -1], 42]], S.lt);
      st.tick(S);
    }
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    if (lt < S.at(166)) { revealText(g, 'NO EXPLOSIVE CRASH', W / 2, 150, clamp(lt / 0.5), { font: F.cond(700, 72), ls: 8, color: '#fff', shadow: 20 }); if (lt > S.at(165)) txt(g, 'just a shudder in the upper cabins', W / 2, 230, { font: F.serif(40), color: '#ffe2a0', alpha: clamp((lt - S.at(165)) * 2), shadow: 10 }); }
    else { const k = lt - S.at(166); txt(g, 'ICE ON THE FORWARD WELL DECK', 110, 120, { font: F.cond(600, 46), ls: 6, color: '#dfe8ff', align: 'left', alpha: clamp(k * 2), shadow: 20 }); const s = lt - S.find(168, /soccer/); if (s > 0) txt(g, 'kicked around like footballs', W / 2, H - 260, { font: F.serif(46), color: '#fff', alpha: clamp(s * 2), shadow: 20 }); }
  },
});
// small trick: remember the deck scene/camera after build
const _shud = S4[S4.length - 1]; const _b = _shud.build; _shud.build = (E) => { const st = _b(E); st._deckScene = st.scene; st._deckCam = st.camera; return st; };

// 169 — boiler rooms: seawater bursts through
S4.push({
  seg: 169, name: 'boiler room flooding', amb: [{ kind: 'boiler', vol: 1 }, { kind: 'water', vol: 0.8 }], trans: 'whip',
  fx: { bloom: 1.0, bloomThreshold: 0.5, saturation: 1.25, contrast: 1.12, tint: [1.08, 0.95, 0.88] },
  sfx: (S) => [{ t: 0, type: 'whoosh', vol: 0.25 }, { t: S.at(170), type: 'splash', vol: 0.5 }, { t: S.at(170) + 0.1, type: 'tear', dur: 1.5, vol: 0.25 }, { t: S.at(171), type: 'bell', freq: 700, n: 6, interval: 0.25, vol: 0.12 }],
  build(E) {
    const st = roomWorld({ w: 24, d: 12, h: 9, floor: 'metal', wallTex: metalTex('#2a2420', { repeat: [6, 2], rust: true }), keyI: 8, keyColor: 0xff8a40, hemi: 0.25, hemiSky: 0xff9a60, env: true }, E);
    const { scene } = st;
    const boilerM = std(0xffffff, { map: metalTex('#3a3430', { repeat: [3, 1] }), rough: 0.5, metal: 0.6 });
    st.fires = [];
    for (let i = 0; i < 3; i++) {
      const b = cyl(2.4, 2.4, 6, boilerM, -7 + i * 7, 2.6, -3.8, scene, 32); b.rotation.x = Math.PI / 2;
      for (const dx of [-1, 1]) { const door = mesh(new THREE.CircleGeometry(0.5, 20), std(0x111111, { emissive: 0xff6a10, ei: 2.5 }), -7 + i * 7 + dx * 1.1, 1.4, -0.75, scene); void door; const gl = glow(0xff7a20, 2.2, 0.9); gl.position.set(-7 + i * 7 + dx * 1.1, 1.4, -0.6); scene.add(gl); st.fires.push(gl); }
      const fl = new THREE.PointLight(0xff6a20, 25, 12, 1.6); fl.position.set(-7 + i * 7, 1.5, 0.6); scene.add(fl); st.fires.push(fl);
    }
    for (let i = 0; i < 5; i++) { const c = mesh(new THREE.ConeGeometry(1.2, 1.2, 6), std(0x0e0e0e, { rough: 0.9 }), -9 + i * 4.5, 0.6, 3.5, scene); void c; }
    st.stokers = [];
    for (let i = 0; i < 4; i++) { const p = person({ coat: '#3a3a3a', shirt: '#5a5a5a', tie: false, skin: '#b07a5a', hair: '#1a1410' }); p.position.set(-6 + i * 4, 0, 1.2); p.rotation.y = Math.PI; scene.add(p); st.stokers.push(p); }
    const ladder = new THREE.Group(); ladder.position.set(10, 0, 4); scene.add(ladder); for (let i = 0; i < 16; i++) box(1, 0.06, 0.06, std(0x8a8a8a, { metal: 0.6 }), 0, 0.5 + i * 0.5, 0, ladder); for (const x of [-0.5, 0.5]) box(0.06, 8, 0.06, std(0x8a8a8a), x, 4, 0, ladder);
    const water = mesh(new THREE.PlaneGeometry(24, 12), std(0x1a6a8a, { rough: 0.05, metal: 0.2, transparent: true, opacity: 0.8, emissive: 0x0a2a3a, ei: 0.5 }), 0, 0.01, 0, scene); water.rotation.x = -Math.PI / 2; st.water = water;
    st.jet = particles(500, (i, t) => { const q = rng(i + 70); const age = (t * 1.5 + q()) % 1; return [11.8 - age * 9 + (q() - 0.5), 2.5 + (q() - 0.5) * 1.2 - age * age * 2.5, -2 + (q() - 0.5) * 3]; }, { size: 0.35, color: 0xcfefff, opacity: 0.8 });
    scene.add(st.jet);
    const red = new THREE.PointLight(0xff2020, 0, 20, 1.5); red.position.set(0, 7, 0); scene.add(red); st.red = red;
    return st;
  },
  update(st, S) {
    const a170 = S.at(170), a171 = S.at(171);
    st.jet.visible = S.lt > a170; st.jet.userData.update(S.t);
    st.water.position.y = 0.01 + Math.max(0, S.lt - a170) * 0.18;
    st.fires.forEach((f, i) => { if (f.isPointLight) f.intensity = 25 + Math.sin(S.t * 13 + i) * 6; else f.scale.setScalar(2.2 + Math.sin(S.t * 11 + i) * 0.3); });
    st.red.intensity = S.lt > a171 ? (Math.sin(S.t * 8) > 0 ? 20 : 2) : 0;
    st.stokers.forEach((p, i) => { if (S.lt < a170) pose.hammer(p, S.t, 0.7, i * 0.3); else { pose.walk(p, S.t, 1.6, i); p.position.x = -6 + i * 4 + (S.lt - a170) * 2.2; p.rotation.y = Math.PI / 2; } });
    if (S.lt < a170) track(st.camera, [[0, [-11, 3, 6], [0, 1.5, -2], 50], [a170, [-10, 2.6, 5.5], [2, 1.5, -2], 46]], S.lt);
    else track(st.camera, [[a170, [3, 2.2, 5.5], [11, 2.3, -2], 46], [S.dur, [0, 2.6, 5.5], [9, 1.8, 0], 50]], S.lt, { shake: 0.06 });
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    txt(g, 'BOILER ROOM 6', 110, 120, { font: F.cond(700, 52), ls: 8, color: '#ffb080', align: 'left', alpha: clamp(lt * 2), shadow: 20 });
    const k = lt - S.at(170);
    if (k > 0) revealText(g, 'SEAWATER BURSTS IN', W / 2, 180, clamp(k / 0.4), { font: F.cond(700, 90), ls: 8, color: '#fff', shadow: 30, style: 'scale' });
    if (lt > S.at(171)) glowBorder(g, W, H, '#ff2020', 0.4 + 0.3 * Math.sin(lt * 8));
  },
});

// 172 — card
S4.push(card(172, '30 MINUTES', 'AFTER THE COLLISION'));

// 173 — Andrews' verdict: five compartments, the ice-cube tray
S4.push({
  seg: 173, name: 'flooding verdict', amb: [{ kind: 'water', vol: 0.5 }, { kind: 'dark', vol: 0.8 }],
  fx: { bloom: 0.4, bloomThreshold: 0.5, vignette: 0.6 },
  sfx: (S) => [{ t: 0.2, type: 'creak', dur: 2.5, vol: 0.12 }, { t: S.at(175), type: 'pop', pitch: 500 }, { t: S.at(176), type: 'stamp', vol: 0.5 }, { t: S.at(177), type: 'drop', vol: 0.25 }, { t: S.at(178), type: 'splash', vol: 0.15 }, { t: S.at(180) + 0.5, type: 'splash', vol: 0.15 }],
  build(E) {
    // corridor (first part): Andrews & Smith wading
    const st = roomWorld({ w: 3, d: 20, h: 2.7, wallTex: canvasTex(64, 64, (g) => { g.fillStyle = '#e8e4d8'; g.fillRect(0, 0, 64, 64); }), floor: 'metal', keyI: 4, keyColor: 0xffe0b0, hemi: 0.35 }, E);
    for (let z = -8; z <= 8; z += 4) { const l = glow(0xffe8c0, 0.6, 0.9); l.position.set(0, 2.6, z); st.scene.add(l); const pl = new THREE.PointLight(0xffe0b0, 2.5, 6, 1.6); pl.position.set(0, 2.5, z); st.scene.add(pl); }
    const water = mesh(new THREE.PlaneGeometry(3, 20), std(0x1a5a7a, { rough: 0.05, transparent: true, opacity: 0.75, emissive: 0x05202a, ei: 0.5 }), 0, 0.35, 0, st.scene); water.rotation.x = -Math.PI / 2;
    const andrews = person({ coat: '#2a2a30', hair: '#3a2a1e', mustache: false }); andrews.position.set(-0.4, 0, 2); andrews.rotation.y = Math.PI; st.scene.add(andrews);
    const smith = person({ coat: '#141a2c', hat: 'officer', beard: true, hair: '#d8d8d8', beardColor: '#eeeeee' }); smith.position.set(0.5, 0, 3.2); smith.rotation.y = Math.PI; st.scene.add(smith);
    Object.assign(st, { andrews, smith, water });
    return st;
  },
  update(st, S) {
    const a175 = S.at(175);
    if (S.lt < a175) {
      [st.andrews, st.smith].forEach((p, i) => { pose.walk(p, S.t, 0.5, i); p.position.z = (i ? 3.2 : 2) - S.lt * 0.6; });
      st.water.position.y = 0.3 + Math.sin(S.t * 2) * 0.01;
      track(st.camera, [[0, [0.2, 1.5, -5], [0, 1.2, 2], 50], [a175, [0.1, 1.4, -6], [0, 1.2, 0], 46]], S.lt);
    }
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    const a175 = S.at(175);
    if (lt < a175) {
      nameTag(g, 110, H - 330, 'SMITH & ANDREWS', 'INSPECTING THE DAMAGE BELOW', clamp((lt - 0.3) / 0.6));
      const n = lt - S.at(174); if (n > 0) revealText(g, 'NO ROOM FOR HOPE', W / 2, 170, clamp(n / 0.6), { font: F.cond(700, 84), ls: 10, color: '#fff', shadow: 30 });
      return;
    }
    // full-screen cutaway
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0b1d33'); gr.addColorStop(1, '#02070e'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const a176 = S.at(176), a177 = S.at(177), a178 = S.at(178), a180 = S.at(180), a181 = S.at(181);
    const flood = new Array(16).fill(0);
    const lv = (t0, max = 0.85, d = 1.5) => easeOut(clamp((lt - t0) / d)) * max;
    if (lt < a176) { [0, 1, 2, 3].forEach((i) => (flood[i] = lv(a175 + i * 0.2, 0.7))); }
    else { [0, 1, 2, 3, 4].forEach((i) => (flood[i] = 0.7 + lv(a176, 0.25))); if (i5(lt, a176)) flood[4] = lv(a176, 0.9); }
    const tilt = 0.06 * easeInOut(clamp((lt - a177) / 3)) + 0.04 * easeInOut(clamp((lt - a178) / 4));
    if (lt > a178 + 1.5) { const k = clamp((lt - a178 - 1.5) / 6); for (let i = 5; i < 10; i++) flood[i] = clamp(k * 1.6 - (i - 5) * 0.3) * 0.85; }
    cutaway(g, W / 2, H / 2 + 20, 1500, { flood, tilt, waterY: H / 2 + 60, sink: tilt * 900, bulkheadH: 0.62 });
    if (lt < a177) { txt(g, 'SURVIVABLE: 4 COMPARTMENTS', W / 2, 140, { font: F.cond(600, 50), ls: 6, color: PAL.green, alpha: clamp((lt - a175) * 3) }); }
    if (lt > a176 && lt < a178) { txt(g, '5 ARE FLOODING', W / 2, 140, { font: F.cond(700, 84), ls: 8, color: PAL.red2, alpha: clamp((lt - a176) * 4), shadow: 30 }); }
    if (lt > a177 && lt < a178) txt(g, 'THE BOW SINKS LOWER', W / 2, 230, { font: F.cond(500, 40), ls: 8, color: '#fff', alpha: clamp((lt - a177) * 3) });
    if (lt > a178 && lt < a180 + 0.2) { txt(g, 'WATER SPILLS OVER THE BULKHEADS', W / 2, 140, { font: F.cond(700, 64), ls: 6, color: '#9fe3ff', alpha: clamp((lt - a178) * 3), shadow: 20 }); txt(g, 'they do not reach all the way up', W / 2, 215, { font: F.serif(38), color: '#fff', alpha: clamp((lt - S.at(179)) * 3) }); }
    // ice cube tray analogy
    const it = lt - a181 + 0.3;
    if (it > 0) {
      const x = W - 380, y = 250;
      g.save(); g.globalAlpha = clamp(it * 3); g.fillStyle = 'rgba(5,10,20,0.85)'; roundRect(g, x - 280, y - 150, 560, 300, 20); g.fill();
      g.translate(x, y + 20); g.rotate(-0.12 * clamp(it)); g.strokeStyle = '#dfe8ff'; g.lineWidth = 4;
      for (let i = 0; i < 6; i++) { g.strokeRect(-210 + i * 70, -40, 70, 70); const f = clamp(it * 1.5 - i * 0.25); if (f > 0) { g.fillStyle = 'rgba(95,200,255,0.8)'; g.fillRect(-208 + i * 70, 28 - 66 * f, 66, 66 * f); } }
      g.restore();
      txt(g, 'LIKE AN ICE-CUBE TRAY', x, y - 100, { font: F.cond(600, 36), ls: 6, color: '#fff', alpha: clamp(it * 3) });
    }
  },
});
function i5(lt, t) { return lt > t; }

// 182 — "Titanic will sink." — "How much time?" — "An hour. Two at most."
S4.push({
  seg: 182, name: 'an hour two at most', amb: { kind: 'dark', vol: 1 },
  fx: { bloom: 0.7, bloomThreshold: 0.55, saturation: 0.9, contrast: 1.15, vignette: 0.85 },
  sfx: (S) => [{ t: S.find(182, /sink/), type: 'boom', vol: 0.5 }, { t: S.at(183), type: 'pop', pitch: 350 }, { t: S.at(185), type: 'ticks', n: 4, interval: 0.5, vol: 0.3 }, { t: S.at(186), type: 'hit', vol: 0.4 }],
  build(E) {
    const st = roomWorld({ w: 6, d: 5, h: 2.8, panel: true, wall: '#5a3a22', floor: 'carpet', floorColor: '#2a1a1a', keyI: 10, keyColor: 0xffd8a0, hemi: 0.2 }, E);
    const andrews = person({ coat: '#2a2a30', hair: '#3a2a1e' }); andrews.position.set(-0.5, 0, 0); andrews.rotation.y = Math.PI / 2; st.scene.add(andrews);
    const smith = person({ coat: '#141a2c', hat: 'officer', beard: true, hair: '#d8d8d8', beardColor: '#eeeeee', skin: '#e0c0b0' }); smith.position.set(0.5, 0, 0); smith.rotation.y = -Math.PI / 2; st.scene.add(smith);
    const plan = mesh(new THREE.PlaneGeometry(1.2, 0.8), std(0xffffff, { map: canvasTex(512, 340, (g, w, h) => { g.fillStyle = '#1d4f8a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d8ecff'; g.lineWidth = 3; g.strokeRect(20, 120, w - 40, 100); for (let i = 1; i < 16; i++) { g.beginPath(); g.moveTo(20 + i * (w - 40) / 16, 120); g.lineTo(20 + i * (w - 40) / 16, 220); g.stroke(); } }) }), 0, 0.8, 0.5, st.scene); plan.rotation.x = -Math.PI / 2; box(1.4, 0.05, 1.0, std(0x4a2a14), 0, 0.77, 0.5, st.scene);
    Object.assign(st, { andrews, smith });
    return st;
  },
  update(st, S) {
    const a183 = S.at(183), a185 = S.at(185);
    if (S.lt < a183) track(st.camera, [[0, [-1.6, 1.7, 1.6], [0.5, 1.6, 0], 32], [a183, [-1.4, 1.65, 1.3], [0.5, 1.6, 0], 28]], S.lt);
    else if (S.lt < a185) track(st.camera, [[a183, [-1.2, 1.65, 0.6], [0.5, 1.68, 0], 26], [a185, [-1.0, 1.66, 0.4], [0.5, 1.68, 0], 22]], S.lt);
    else track(st.camera, [[a185, [1.5, 1.65, 0.6], [-0.5, 1.66, 0], 26], [S.dur, [1.25, 1.66, 0.4], [-0.5, 1.68, 0], 22]], S.lt);
    pose.idle(st.andrews, S.t); pose.idle(st.smith, S.t * 0.6, 3);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    const sk = lt - S.find(182, /sink/);
    if (sk > 0 && lt < S.at(183)) revealText(g, 'TITANIC WILL SINK', W / 2, 170, clamp(sk / 0.5), { font: F.cond(700, 100), ls: 12, color: '#fff', shadow: 30, style: 'blur' });
    const q = lt - S.at(183);
    if (q > 0 && lt < S.at(185)) txt(g, '“How much time do we have?”', W / 2, H - 280, { font: F.serif(56), color: '#fff', alpha: clamp(q * 3), shadow: 20 });
    const a = lt - S.at(185), b = lt - S.at(186);
    if (a > 0) { g.save(); g.globalAlpha = clamp(a * 3); clockIcon(g, W - 260, 260, 130, 0.0 + clamp(a / 2) * (b > 0 ? 2 : 1)); g.restore(); revealText(g, 'AN HOUR.', W / 2 - 160, 200, clamp(a / 0.4), { font: F.cond(700, 110), ls: 8, color: '#fff', shadow: 30 }); }
    if (b > 0) revealText(g, 'TWO AT MOST.', W / 2 - 160, 330, clamp(b / 0.4), { font: F.cond(700, 110), ls: 8, color: PAL.red2, shadow: 30 });
  },
});

// 187 — the terrible arithmetic
S4.push(dark({
  seg: 187, name: 'lifeboat arithmetic', c1: '#1a0a10', c2: '#030102',
  sfx: (S) => [{ t: S.find(188, /2,224/), type: 'hit', vol: 0.4 }, { t: S.find(188, /20/), type: 'hit', vol: 0.4, pitch: 220 }, { t: S.at(189), type: 'ticks', n: 8, interval: 0.08, vol: 0.2 }, { t: S.at(190), type: 'boom', vol: 0.5 }, { t: S.at(191), type: 'morse', code: '-.-. --.- -.. ... --- ...', vol: 0.1, freq: 760 }],
  paint(st, g, S) {
    const { W, H, lt } = S;
    if (lt < S.at(188)) { revealText(g, 'THE TERRIBLE ARITHMETIC', W / 2, H / 2, clamp(lt / 0.7), { font: F.cond(700, 96), ls: 10, color: '#fff' }); return; }
    const a191 = S.at(191);
    if (lt > a191) {
      const k = lt - a191;
      revealText(g, 'DISTRESS CALLS', W / 2, 150, clamp(k / 0.5), { font: F.cond(700, 80), ls: 10, color: '#fff' });
      radioWaves(g, W / 2, H / 2 + 120, lt, '#ffd23f', { both: true, r: 700, n: 6, lw: 6, a0: -1.2, a1: 1.2 });
      txt(g, 'CQD · SOS', W / 2, H / 2 + 120, { font: F.cond(700, 150), ls: 20, color: '#ffd23f', alpha: clamp(k * 2), shadow: 40, shadowColor: 'rgba(255,210,63,0.6)' });
      return;
    }
    const p = lt - S.find(188, /2,224/), b = lt - S.find(188, /20/);
    counter(g, W / 2 - 450, 190, 2224, 'PEOPLE ABOARD', clamp(p / 1.0), { size: 120 });
    if (b > 0) counter(g, W / 2 + 450, 190, 20, 'LIFEBOATS', clamp(b / 0.6), { size: 120 });
    // icons: 1 icon = 20 people  (111 icons)
    const seats = lt - S.at(189);
    const cols = 37;
    for (let i = 0; i < 111; i++) {
      const x = W / 2 - (cols - 1) * 24 + (i % cols) * 48, y = 470 + Math.floor(i / cols) * 90;
      const k = clamp((p - 0.3 - i * 0.008) / 0.3); if (k <= 0) continue;
      let col = '#dfe8ff';
      if (seats > 0) col = i < 59 ? '#3ccf7a' : (lt > S.at(190) ? PAL.red2 : '#dfe8ff');
      personIcon(g, x, y, 1.15, col, { alpha: k });
    }
    if (seats > 0) { txt(g, 'SEATS FOR ≈ 1,178', W / 2, 820, { font: F.cond(700, 56), ls: 6, color: '#3ccf7a', alpha: clamp(seats * 3) }); }
    const h = lt - S.at(190);
    if (h > 0) { txt(g, 'HALF HAVE NO PLACE TO GO', W / 2, 900, { font: F.cond(700, 70), ls: 6, color: PAL.red2, alpha: clamp(h * 3), shadow: 20 }); }
    txt(g, '1 ICON = 20 PEOPLE', W - 140, H - 40, { font: F.cond(400, 22), ls: 4, color: 'rgba(255,255,255,0.4)', align: 'right' });
  },
}));

// 192 — card
S4.push(card(192, '1 HOUR', 'AFTER THE COLLISION'));

// 193 — lowering the first lifeboats; the band plays
S4.push({
  seg: 193, name: 'lifeboats lowering band', amb: [{ kind: 'night', vol: 0.6 }, { kind: 'crowd', vol: 0.3 }],
  fx: { bloom: 1.0, bloomThreshold: 0.5, saturation: 1.12, tint: [0.95, 0.98, 1.06] },
  sfx: (S) => [{ t: 0.3, type: 'creak', dur: 3, vol: 0.12 }, { t: S.at(199), type: 'melody', instr: 'violin', vol: 0.03, beat: 0.35, notes: [[79, 0, 1], [81, 1, 1], [83, 2, 2], [86, 4, 2], [84, 6, 1], [83, 7, 1], [81, 8, 3], [79, 11, 1], [76, 12, 2], [79, 14, 3]] }, { t: S.at(199), type: 'melody', instr: 'cello', vol: 0.02, beat: 0.35, notes: [[43, 0, 4], [48, 4, 4], [50, 8, 4], [43, 12, 4]] }],
  build(E) {
    const st = sinkingWorld(E, { pivotX: 90 });
    st.setSink(-0.03, 2);
    const boat = st.ship.userData.boats.find((b) => b.userData.side === 1 && b.position.x > 60);
    st.boat = boat;
    const ppl = [];
    for (let i = 0; i < 8; i++) { const p = person(i % 2 ? { female: true, dress: ['#7a1f3d', '#d8cfb8', '#1d3a6a', '#2d5a3a'][i % 4], hat: 'bowler', hatColor: '#e0d0c0' } : { female: true, dress: '#3a2a4a', hair: '#8a5a2a' }); p.scale.setScalar(i === 5 ? 0.6 : 1); pose.sit(p); p.position.set(-3 + i * 0.85, 0.6, 0); boat.add(p); ppl.push(p); }
    // band on deck
    const by = st.ship.userData.boatDeckY;
    st.band = [];
    for (let i = 0; i < 5; i++) { const m = person({ coat: '#111', hair: ['#2a1a10', '#6a4a2a', '#3a2a1e', '#1a1410', '#4a3a2a'][i] }); m.position.set(-20 + i * 1.3, by - 1.2, 11.5); m.rotation.y = 0.3; st.ship.add(m); st.band.push(m); }
    st.deckCrowd = [];
    for (let i = 0; i < 10; i++) { const p = person(i % 3 ? { coat: '#111', hat: 'top' } : { female: true, dress: ['#7a1f3d', '#e8d8c0', '#1d3a6a'][i % 3] }); p.position.set(-8 + i * 1.6, by - 1.2, 12 - (i % 2)); p.rotation.y = 0.2; st.ship.add(p); st.deckCrowd.push(p); }
    return st;
  },
  update(st, S) {
    const a199 = S.at(199);
    const lower = easeInOut(clamp(S.lt / (a199 - 0.5)));
    st.boat.position.copy(st.boat.userData.home); st.boat.position.z = 15.5; st.boat.position.y = st.boat.userData.home.y - lower * 15;
    const bp = new THREE.Vector3(); st.boat.getWorldPosition(bp);
    if (S.lt < a199) track(st.camera, [[0, [bp.x - 30, 22, 40], [bp.x, 14, 14], 40], [a199 - 0.2, [bp.x - 26, 10, 36], [bp.x, 6, 14], 40]], S.lt);
    else { const w = new THREE.Vector3(-18, st.ship.userData.boatDeckY + 0.5, 11.5); st.ship.localToWorld(w); track(st.camera, [[a199, [w.x + 5, w.y + 1.0, w.z - 3], [w.x - 1, w.y + 0.5, w.z + 1], 40], [S.dur, [w.x + 4, w.y + 0.9, w.z - 2.5], [w.x - 1, w.y + 0.6, w.z + 1], 36]], S.lt); }
    st.band.forEach((m, i) => { m.userData.armR.rotation.x = -1.0; m.userData.armR.rotation.z = -0.4 + Math.sin(S.t * 3 + i) * 0.35; m.userData.armL.rotation.x = -1.3; m.userData.armL.rotation.z = 0.6; });
    st.deckCrowd.forEach((p, i) => pose.idle(p, S.t, i));
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    if (lt < S.at(194)) txt(g, 'WOMEN AND CHILDREN FIRST', W / 2, 160, { font: F.cond(700, 72), ls: 8, color: '#fff', alpha: clamp((lt - S.find(194, /women/)) * 3), shadow: 30 });
    const c = lt - S.at(195);
    if (c > 0 && lt < S.at(197)) { txt(g, 'LITTLE PANIC', W / 2, 150, { font: F.cond(700, 72), ls: 8, color: '#fff', alpha: clamp(c * 3), shadow: 30 }); txt(g, 'mostly confusion and irritation', W / 2, 225, { font: F.serif(40), color: '#ffe2a0', alpha: clamp(c * 3 - 1), shadow: 10 }); }
    const b = lt - S.at(199);
    if (b > 0 && lt < S.at(200)) txt(g, 'THE BAND PLAYS ON', W / 2, 160, { font: F.cond(700, 72), ls: 10, color: '#ffe2a0', alpha: clamp(b * 3), shadow: 30 });
    const f = lt - S.at(200);
    if (f > 0) txt(g, '“The ship feels so secure. Why leave?”', W / 2, H - 270, { font: F.serif(46), color: '#fff', alpha: clamp(f * 2), shadow: 20 });
  },
});

// 204 — Lifeboat 7: room for 65, carries 28
S4.push(dark({
  seg: 204, name: 'lifeboat 7', c1: '#0c1a2c', c2: '#02050a',
  sfx: (S) => [{ t: 0.2, type: 'pop', pitch: 400 }, { t: S.find(205, /65/), type: 'ticks', n: 10, interval: 0.06, vol: 0.2 }, { t: S.find(205, /28/), type: 'hit', vol: 0.4 }, { t: S.at(208), type: 'drop', vol: 0.3 }],
  paint(st, g, S) {
    const { W, H, lt } = S;
    txt(g, 'LIFEBOAT Nº 7', W / 2, 130, { font: F.cond(700, 76), ls: 10, color: '#fff', alpha: clamp(lt * 3) });
    txt(g, 'the first to leave', W / 2, 200, { font: F.serif(38), color: '#9fbcd8', alpha: clamp(lt * 3 - 1) });
    boatIcon(g, W / 2, 560, 9, 'rgba(242,239,230,0.1)');
    g.save(); g.strokeStyle = 'rgba(242,239,230,0.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(W / 2 - 540, 470); g.lineTo(W / 2 + 540, 470); g.quadraticCurveTo(W / 2 + 450, 720, W / 2 + 270, 740); g.lineTo(W / 2 - 270, 740); g.quadraticCurveTo(W / 2 - 450, 720, W / 2 - 540, 470); g.stroke(); g.restore();
    const cap = lt - S.find(205, /65/), carry = lt - S.find(205, /28/);
    for (let i = 0; i < 65; i++) {
      const x = W / 2 - 420 + (i % 13) * 70, y = 520 + Math.floor(i / 13) * 46;
      const k = clamp((cap - i * 0.01) / 0.2); if (k <= 0) continue;
      const filled = carry > 0 && i < 28;
      g.save(); g.globalAlpha = k;
      if (filled) personIcon(g, x, y + 10, 0.75, '#ffd23f');
      else { g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.strokeRect(x - 14, y - 14, 28, 28); }
      g.restore();
    }
    if (cap > 0) txt(g, 'CAPACITY 65', W / 2 - 420, 860, { font: F.cond(600, 46), ls: 4, color: '#fff', alpha: clamp(cap * 3), align: 'left' });
    if (carry > 0) { txt(g, 'ABOARD: 28', W / 2 + 420, 860, { font: F.cond(700, 56), ls: 4, color: '#ffd23f', alpha: clamp(carry * 3), align: 'right' }); txt(g, '37 EMPTY SEATS', W / 2, 960, { font: F.cond(700, 50), ls: 8, color: PAL.red2, alpha: clamp(carry * 2 - 1) }); }
    const lo = lt - S.at(206);
    if (lo > 0) { g.fillStyle = `rgba(2,5,10,${0.85 * clamp(lo * 2)})`; g.fillRect(0, 0, W, H); revealText(g, 'MORE BOATS LEAVE HALF EMPTY', W / 2, H / 2 - 40, clamp(lo / 0.6), { font: F.cond(700, 84), ls: 6, color: '#fff' }); const pl = lt - S.at(208); if (pl > 0) revealText(g, 'PRECIOUS PLACES ARE LOST', W / 2, H / 2 + 80, clamp(pl / 0.6), { font: F.cond(700, 70), ls: 6, color: PAL.red2 }); }
  },
}));

// 209 — lights of another ship; white distress rockets
S4.push({
  seg: 209, name: 'rockets other ship', amb: [{ kind: 'night', vol: 0.7 }],
  fx: { bloom: 1.2, bloomThreshold: 0.45, saturation: 1.1, tint: [0.95, 0.98, 1.08] },
  sfx: (S) => [{ t: S.at(211) - 1.2, type: 'rocket', vol: 0.2 }, { t: S.at(211) + 1.5, type: 'rocket', vol: 0.18 }, { t: 0.5, type: 'morse', code: '-.-. --.- -..', vol: 0.05 }],
  build(E) {
    const st = sinkingWorld(E, { pivotX: 90 }); st.setSink(-0.045, 3);
    st.far = []; for (let i = 0; i < 3; i++) { const l = glow(i ? 0xffffff : 0xff4040, 22, 1); l.material.fog = false; l.position.set(-2000 + i * 18, 6 + (i === 2 ? 6 : 0), 3500); st.scene.add(l); st.far.push(l); }
    st.rocket = particles(90, (i, t) => [0, -100, 0], { size: 2.4, color: 0xffffff, opacity: 1 }); st.scene.add(st.rocket);
    return st;
  },
  update(st, S) {
    const a211 = S.at(211);
    const by = st.ship.userData.boatDeckY;
    const w = new THREE.Vector3(20, by + 1.7, 12.5); st.ship.localToWorld(w);
    if (S.lt < a211 - 1.4) track(st.camera, [[0, [w.x, w.y, w.z], [-1700, 40, 3500], 30], [a211 - 1.4, [w.x, w.y, w.z], [-1900, 20, 3500], 22]], S.lt);
    else track(st.camera, [[a211 - 1.4, [w.x + 220, 25, 320], [w.x - 40, 60, 0], 40], [S.dur, [w.x + 240, 30, 340], [w.x - 40, 90, 0], 42]], S.lt);
    // rockets
    const launches = [a211 - 1.2, a211 + 1.5];
    const pts = st.rocket.geometry.attributes.position.array;
    const base = new THREE.Vector3(30, 22, 0); st.ship.localToWorld(base);
    let any = 0;
    for (let i = 0; i < 90; i++) {
      const L0 = launches[i % 2]; const k = S.lt - L0; const q = rng(i + 1);
      if (k < 0 || k > 4) { pts[i * 3 + 1] = -500; continue; }
      if (k < 1.3) { pts[i * 3] = base.x; pts[i * 3 + 1] = base.y + k * 90 - (i % 5) * 2; pts[i * 3 + 2] = base.z; }
      else { const e = k - 1.3; const a = q() * Math.PI * 2, b = q() * Math.PI; pts[i * 3] = base.x + Math.cos(a) * Math.sin(b) * e * 30; pts[i * 3 + 1] = base.y + 117 + Math.cos(b) * e * 30 - e * e * 6; pts[i * 3 + 2] = base.z + Math.sin(a) * Math.sin(b) * e * 30; any = Math.max(any, 1 - e / 2.7); }
    }
    st.rocket.geometry.attributes.position.needsUpdate = true;
    st.sky.userData.uniforms.flare.value.set(base.x - st.camera.position.x, 140, base.z - st.camera.position.z, any * 0.8);
    st.ocean.userData.uniforms.flare.value.set(base.x, 0, base.z, any);
    st.far.forEach((l, i) => (l.material.opacity = 0.7 + Math.sin(S.t * 2 + i) * 0.2));
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    if (lt < S.at(211) - 1.4) { const p = toScreen(st.far[0].position, st.camera); callout(g, p[0] - 120, p[1] - 220, p[0], p[1], 'ANOTHER SHIP?', 'lights on the horizon', clamp((lt - 0.5) / 0.8), { align: 'right' }); }
    const n = lt - S.at(210);
    if (n > 0 && lt < S.at(211) - 1.4) txt(g, 'NO REPLY', W / 2, H - 260, { font: F.cond(700, 80), ls: 14, color: PAL.red2, alpha: clamp(n * 3), shadow: 20 });
    const r = lt - S.at(211) + 1.4;
    if (r > 0) txt(g, 'WHITE DISTRESS ROCKETS', W / 2, 160, { font: F.cond(700, 66), ls: 8, color: '#fff', alpha: clamp(r * 2), shadow: 30 });
  },
});

// 212 — card
S4.push(card(212, '2 HOURS', 'AFTER THE COLLISION'));

// 213 — the slope; water over the bow; panic; warning shots
S4.push({
  seg: 213, name: 'panic warning shots', amb: [{ kind: 'crowd', vol: 1.2 }, { kind: 'water', vol: 0.5 }],
  fx: { bloom: 1.0, bloomThreshold: 0.5, saturation: 1.05, contrast: 1.12, tint: [0.95, 0.98, 1.08] },
  sfx: (S) => [{ t: 0.2, type: 'creak', dur: 3, vol: 0.18 }, { t: S.at(214), type: 'splash', vol: 0.3 }, { t: S.at(215), type: 'riser', dur: 1.5, vol: 0.15 }, { t: S.find(218, /warning/) + 0.2, type: 'gunshot', vol: 0.4 }, { t: S.find(218, /shots/) + 0.4, type: 'gunshot', vol: 0.38 }, { t: S.find(219, /crowd/), type: 'gunshot', vol: 0.3 }],
  build(E) {
    const st = sinkingWorld(E, { pivotX: 40 }); st.setSink(-0.09, 6);
    const by = st.ship.userData.boatDeckY;
    const r = rng(213); const spots = [];
    for (let i = 0; i < 160; i++) spots.push({ x: -60 + r() * 100, y: by - 1.2, z: 8.5 + r() * 4.5, ry: Math.PI / 2 + (r() - 0.5) });
    st.crowdG = crowd(spots, { hats: 0.6, seed: 9, palette: ['#111', '#2a2c35', '#5a1f24', '#e8d8c0', '#1d3a6a', '#3a2c24'] }); st.ship.add(st.crowdG);
    const lowe = person({ coat: '#141a2c', hat: 'officer', mustache: true }); lowe.position.set(-25, by - 1.2, 12.5); lowe.rotation.y = -Math.PI / 2; st.ship.add(lowe); st.lowe = lowe;
    st.flash = glow(0xffe0a0, 2.5, 0); lowe.add(st.flash); st.flash.position.set(-0.6, 2.4, 0);
    return st;
  },
  update(st, S) {
    const tilt = -0.09 - S.lt * 0.002; st.setSink(tilt, 6 + S.lt * 0.15);
    const a218 = S.at(218);
    st.crowdG.userData.update(S.t, (d, t, i) => ({ x: d.x + Math.sin(t * 2 + i) * 0.6 + (S.lt > S.at(215) ? (t * 0.8 % 6) : 0), y: d.y + Math.abs(Math.sin(t * 7 + i)) * 0.1 }));
    pose.armsUp(st.lowe, S.lt > a218 ? 0.65 : 0); st.lowe.userData.armL.rotation.z = 0.1;
    const shots = [S.find(218, /warning/) + 0.2, S.find(218, /shots/) + 0.4, S.find(219, /crowd/)];
    st.flash.material.opacity = Math.max(...shots.map((s) => (S.lt > s && S.lt < s + 0.12 ? 1 : 0)));
    const w = new THREE.Vector3(-25, st.ship.userData.boatDeckY, 12.5); st.ship.localToWorld(w);
    if (S.lt < a218) track(st.camera, [[0, [w.x - 30, w.y + 4, w.z - 3], [w.x + 40, w.y - 6, w.z - 1], 46, 0.06], [a218, [w.x - 24, w.y + 3.5, w.z - 3], [w.x + 40, w.y - 8, w.z - 1], 42, 0.09]], S.lt, { roll: true });
    else track(st.camera, [[a218, [w.x + 3, w.y + 2.2, w.z - 3], [w.x, w.y + 2, w.z], 40, 0.08], [S.dur, [w.x + 2.6, w.y + 2.2, w.z - 2.6], [w.x, w.y + 2.2, w.z], 34, 0.08]], S.lt, { roll: true, shake: 0.03 });
    S.fx.flash = st.flash.material.opacity * 0.25;
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    const p = lt - S.at(215);
    if (p > 0 && lt < S.at(218)) revealText(g, 'REASSURANCE GIVES WAY TO PANIC', W / 2, 160, clamp(p / 0.6), { font: F.cond(700, 70), ls: 6, color: '#fff', shadow: 30 });
    if (lt < S.at(215)) { const k = lt - 0.3; txt(g, 'THE DECK SLOPES TOWARD THE BOW', W / 2, 160, { font: F.cond(600, 54), ls: 6, color: '#fff', alpha: clamp(k * 2), shadow: 20 }); }
    nameTag(g, 110, H - 330, '5TH OFFICER HAROLD LOWE', 'FIRES WARNING SHOTS', clamp((lt - S.at(218)) / 0.6));
  },
});

// 220 — third class: locked gates, unfamiliar corridors
S4.push({
  seg: 220, name: 'third class gates', amb: [{ kind: 'water', vol: 0.6 }, { kind: 'crowd', vol: 0.5 }],
  fx: { bloom: 0.9, bloomThreshold: 0.5, saturation: 1.0, contrast: 1.15, flicker: 0.6, vignette: 0.8 },
  sfx: (S) => [{ t: S.find(223, /locked/), type: 'clank', vol: 0.35, pitch: 0.5 }, { t: S.find(223, /locked/) + 0.4, type: 'clank', vol: 0.3, pitch: 0.55 }, { t: S.at(225), type: 'drop', vol: 0.25 }],
  build(E) {
    const st = roomWorld({ w: 3.2, d: 26, h: 2.6, wallTex: canvasTex(64, 64, (g) => { g.fillStyle = '#e0dccf'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#8a6a4a'; g.fillRect(0, 50, 64, 14); }), floor: 'metal', keyI: 3, hemi: 0.3 }, E);
    for (let z = -12; z <= 12; z += 3) { const l = glow(0xffe8c0, 0.5, 0.9); l.position.set(0, 2.5, z); st.scene.add(l); const pl = new THREE.PointLight(0xffe0b0, 1.6, 5, 1.6); pl.position.set(0, 2.4, z); st.scene.add(pl); }
    for (let z = -11; z <= 11; z += 2.5) for (const x of [-1.58, 1.58]) box(0.04, 2, 0.9, std(0x6a4a2a), x, 1, z, st.scene);
    const gate = new THREE.Group(); gate.position.set(0, 0, -6); st.scene.add(gate);
    const iron = std(0x2a2a2a, { metal: 0.7, rough: 0.4 });
    for (let x = -1.5; x <= 1.5; x += 0.18) cyl(0.025, 0.025, 2.5, iron, x, 1.25, 0, gate, 6);
    for (const y of [0.2, 1.3, 2.4]) box(3.2, 0.06, 0.06, iron, 0, y, 0, gate);
    const lock = box(0.15, 0.2, 0.1, std(0xc9a14a, { metal: 0.8 }), 0.2, 1.3, 0.06, gate); void lock;
    st.people = [];
    for (let i = 0; i < 9; i++) { const p = person(i % 3 === 0 ? { female: true, dress: ['#4a5a3a', '#6a3a2a', '#3a4a6a'][i % 3], hair: '#6a4a2a', hat: 'flat', hatColor: '#6a5a4a' } : { coat: ['#4a3a2a', '#3a3226', '#5a4a3a'][i % 3], hat: 'flat', tie: false }); p.position.set(-1 + (i % 3) * 1, 0, -5.5 + Math.floor(i / 3) * 0.8); p.rotation.y = Math.PI; st.scene.add(p); st.people.push(p); }
    const water = mesh(new THREE.PlaneGeometry(3.2, 26), std(0x1a5a7a, { rough: 0.05, transparent: true, opacity: 0.7, emissive: 0x05202a, ei: 0.4 }), 0, 0.1, 0, st.scene); water.rotation.x = -Math.PI / 2; st.water = water;
    return st;
  },
  update(st, S) {
    const lk = S.find(223, /locked/);
    st.people.forEach((p, i) => { if (S.lt < lk) { pose.walk(p, S.t, 0.8, i); p.position.z = -5.5 + Math.floor(i / 3) * 0.8 + 4 - S.lt * 0.7; } else { p.position.z = Math.max(-5.6 + Math.floor(i / 3) * 0.8, p.position.z); if (i < 3) { pose.reach(p, 'R', 1); pose.reach(p, 'L', 0.8); } } });
    st.water.position.y = 0.1 + S.lt * 0.012;
    if (S.lt < lk) track(st.camera, [[0, [0.6, 1.6, 6], [0, 1.3, -6], 50], [lk, [0.4, 1.5, 2], [0, 1.3, -6], 46]], S.lt);
    else track(st.camera, [[lk, [0.3, 1.5, -7.5], [0, 1.4, -5], 46], [S.dur, [0.2, 1.4, -7.0], [0, 1.4, -5], 40]], S.lt, { shake: 0.02 });
    const fl = S.t % 1.7 < 0.07 ? 0.4 : 1; S.fx.exposure = fl;
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    txt(g, 'DEEP INSIDE THE SHIP', 110, 120, { font: F.cond(600, 46), ls: 8, color: '#fff', align: 'left', alpha: clamp(lt * 2), shadow: 20 });
    const lk = lt - S.find(223, /locked/);
    if (lk > 0) { revealText(g, 'LOCKED GATES', W / 2, 170, clamp(lk / 0.4), { font: F.cond(700, 96), ls: 12, color: PAL.red2, shadow: 30, style: 'scale' }); txt(g, 'separating third class from first & second', W / 2, 260, { font: F.serif(38), color: '#fff', alpha: clamp(lk * 2 - 0.8), shadow: 10 }); }
    const n = lt - S.at(225);
    if (n > 0) txt(g, 'NO ONE CAME TO GUIDE THEM', W / 2, H - 260, { font: F.cond(700, 60), ls: 6, color: '#fff', alpha: clamp(n * 2), shadow: 20 });
  },
});

// 227 — Isidor & Ida Straus
S4.push({
  seg: 227, name: 'straus couple', amb: [{ kind: 'night', vol: 0.6 }, { kind: 'crowd', vol: 0.2 }], trans: 'fade',
  fx: { bloom: 1.0, bloomThreshold: 0.5, saturation: 0.95, tint: [1.0, 0.97, 1.02], vignette: 0.75 },
  sfx: (S) => [{ t: S.at(229), type: 'pop', pitch: 300 }, { t: S.at(230), type: 'melody', instr: 'piano', vol: 0.05, beat: 0.6, notes: [[64, 0, 2], [62, 2, 2], [60, 4, 2], [57, 6, 4], [60, 10, 2], [64, 12, 4]] }],
  build(E) {
    const st = sinkingWorld(E, { pivotX: 40 }); st.setSink(-0.07, 5);
    const by = st.ship.userData.boatDeckY;
    const isidor = person({ coat: '#1a1a1e', hat: 'bowler', beard: true, beardColor: '#d8d8d8', hair: '#d8d8d8', skin: '#e8c0a8' });
    const ida = person({ female: true, dress: '#2a1a3a', hair: '#b8b8b8', skin: '#ecc8b0' });
    const maid = person({ female: true, dress: '#1a1a1a', hair: '#3a2a1e' });
    isidor.position.set(10, by - 1.2, 12.0); ida.position.set(10.5, by - 1.2, 12.2); maid.position.set(13, by - 1.2, 11.6);
    isidor.rotation.y = 0.9; ida.rotation.y = -0.8; maid.rotation.y = -1.6;
    [isidor, ida, maid].forEach((p) => st.ship.add(p));
    const coat = box(0.5, 0.7, 0.2, std(0x8a6a4a, { rough: 1 }), 0, 0, 0); st.coat = coat; ida.userData.armR.userData.fore.add(coat); coat.position.set(0, -0.35, 0.1);
    Object.assign(st, { isidor, ida, maid });
    return st;
  },
  update(st, S) {
    const a230 = S.at(230), a232 = S.at(232);
    const w = new THREE.Vector3(10.25, st.ship.userData.boatDeckY + 0.4, 12.1); st.ship.localToWorld(w);
    if (S.lt < a230) { pose.reach(st.isidor, 'R', 0.8); st.coat.visible = true; pose.reach(st.ida, 'R', clamp((S.lt - S.at(229) - 1) / 0.5)); }
    else { st.coat.visible = false; pose.hug(st.isidor, 1); pose.hug(st.ida, 1); st.isidor.rotation.y = 1.4; st.ida.rotation.y = -1.6; st.ida.position.x = 10.45; }
    const by = st.ship.userData.boatDeckY - 1.2;
    const L = (x, y, z) => { const v = new THREE.Vector3(x, by + y, z); st.ship.localToWorld(v); return [v.x, v.y, v.z]; };
    if (S.lt < a230) track(st.camera, [[0, L(14.2, 1.7, 9.2), L(10.6, 1.25, 12.0), 42], [a230, L(13.4, 1.65, 9.6), L(10.5, 1.3, 12.0), 38]], S.lt);
    else if (S.lt < a232) track(st.camera, [[a230, L(11.9, 1.6, 10.0), L(10.3, 1.55, 12.1), 36], [a232, L(11.6, 1.6, 10.3), L(10.3, 1.6, 12.1), 32]], S.lt);
    else track(st.camera, [[a232, L(16, 2.4, 8.4), L(10.3, 1.0, 12.1), 42], [S.dur, L(19, 3.4, 8.2), L(10.3, 1.0, 12.1), 44]], S.lt);
    void w;
    pose.idle(st.maid, S.t);
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    nameTag(g, 110, H - 330, 'ISIDOR & IDA STRAUS', 'MARRIED 41 YEARS', clamp((lt - S.find(228, /Isidore/)) / 0.6) * (lt < S.at(230) ? 1 : 0));
    const f = lt - S.find(229, /fur/);
    if (f > 0 && lt < S.at(230)) txt(g, 'she gives her fur coat to her maid', W / 2, 170, { font: F.serif(44), color: '#fff', alpha: clamp(f * 2), shadow: 20 });
    const q1 = lt - S.at(230), q2 = lt - S.at(231);
    if (q1 > 0 && lt < S.at(232)) { g.fillStyle = `rgba(0,0,0,${0.45 * clamp(q1)})`; g.fillRect(0, H - 400, W, 400); revealText(g, '“We have lived together for many years.', W / 2, H - 270, clamp(q1 / 1.0), { font: F.serif(56), color: '#fff', style: 'blur', stagger: 0.8 }); if (q2 > 0) revealText(g, 'Where you go, I go.”', W / 2, H - 180, clamp(q2 / 0.8), { font: F.serif(62, true, 800), color: '#ffe2a0', style: 'blur', stagger: 0.8 }); }
  },
});

// 233 — Andrews before the painting; Guggenheim in evening dress
S4.push({
  seg: 233, name: 'smoking room guggenheim', amb: [{ kind: 'room', vol: 0.6 }, { kind: 'water', vol: 0.3 }],
  fx: { bloom: 0.9, bloomThreshold: 0.55, saturation: 1.1, tint: [1.05, 0.98, 0.9], vignette: 0.8 },
  sfx: (S) => [{ t: 0.3, type: 'creak', dur: 3, vol: 0.12 }, { t: S.at(235), type: 'whoosh', vol: 0.15 }, { t: S.find(237, /gentlemen/), type: 'boom', vol: 0.35 }],
  build(E) {
    const st = roomWorld({ w: 10, d: 8, h: 3.6, panel: true, wall: '#4a2a14', floor: 'carpet', floorColor: '#3a1a10', floorAccent: '#a07040', keyI: 14, hemi: 0.35 }, E);
    const { scene } = st;
    // stained glass windows
    for (let i = -2; i <= 2; i++) { const t = canvasTex(128, 256, (g, w, h) => { const r = rng(i + 9); for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { g.fillStyle = ['#c8361e', '#2a6aaa', '#e0b040', '#3a8a4a', '#f0e8d0'][Math.floor(r() * 5)]; g.fillRect(x + 1, y + 1, 30, 30); } }); const m = mesh(new THREE.PlaneGeometry(1.0, 2.0), std(0xffffff, { map: t, emissive: 0xffffff, emissiveMap: t, ei: 0.9 }), i * 1.8, 2.0, -3.95, scene); void m; }
    painting(scene, 4.9, 2.0, 0, 2.0, 1.3, landscape('#5a7ab0', '#e8c890', '#2a5a7a'), -Math.PI / 2);
    const fire = box(1.6, 1.2, 0.5, std(0x3a2a1a), 4.75, 0.6, 0, scene); fire.rotation.y = Math.PI / 2;
    const fg = glow(0xff8030, 1.2, 0.9); fg.position.set(4.6, 0.5, 0); scene.add(fg);
    const andrews = person({ coat: '#2a2a30', hair: '#3a2a1e' }); andrews.position.set(3.0, 0, 0); andrews.rotation.y = -Math.PI / 2; scene.add(andrews);
    const gug = person({ coat: '#0a0a0c', tie: '#f2f2f2', hair: '#2a1a10', mustache: true }); gug.position.set(-2.5, 0, 1.0); gug.rotation.y = 0.4; scene.add(gug);
    const valet = person({ coat: '#0a0a0c', tie: '#f2f2f2', hair: '#4a3a2a' }); valet.position.set(-1.7, 0, 0.6); valet.rotation.y = -0.2; scene.add(valet);
    Object.assign(st, { andrews, gug, valet });
    return st;
  },
  update(st, S) {
    const a235 = S.at(235);
    const roll = 0.07;
    if (S.lt < a235) track(st.camera, [[0, [0.6, 1.6, 2.4], [3.6, 1.8, -0.2], 40, roll], [a235, [1.3, 1.65, 1.6], [4.0, 1.9, 0], 34, roll]], S.lt, { roll: true });
    else track(st.camera, [[a235, [-1.6, 1.7, 3.4], [-2.1, 1.5, 0.7], 40, roll], [S.dur, [-1.8, 1.65, 2.9], [-2.1, 1.6, 0.7], 34, roll]], S.lt, { roll: true });
    st.gug.userData.armR.rotation.x = -1.2; st.gug.userData.armR.userData.fore.rotation.x = -1.4 + Math.sin(S.t * 2) * 0.1;
    st.valet.userData.armL.rotation.x = -0.8;
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    if (lt < S.at(235)) { txt(g, 'FIRST-CLASS SMOKING ROOM', 110, 120, { font: F.cond(600, 44), ls: 8, color: '#ffe2a0', align: 'left', alpha: clamp(lt * 2), shadow: 20 }); const m = lt - S.find(234, /motionless/); if (m > 0) txt(g, 'Thomas Andrews stands motionless', W / 2, H - 270, { font: F.serif(48), color: '#fff', alpha: clamp(m * 2), shadow: 20 }); }
    else {
      nameTag(g, 110, H - 340, 'BENJAMIN GUGGENHEIM', 'AND HIS VALET, VICTOR GIGLIO', clamp((lt - S.at(235)) / 0.6) * (lt < S.at(236) ? 1 : 0));
      const q = lt - S.at(236);
      if (q > 0) { g.fillStyle = `rgba(0,0,0,${0.45 * clamp(q)})`; g.fillRect(0, H - 400, W, 400); revealText(g, '“We are dressed in our best', W / 2, H - 270, clamp(q / 0.9), { font: F.serif(56), color: '#fff', style: 'blur' }); const r = lt - S.at(237); if (r > 0) revealText(g, 'and prepared to go down like gentlemen.”', W / 2, H - 180, clamp(r / 1.0), { font: F.serif(56, true, 800), color: '#ffe2a0', style: 'blur' }); }
    }
  },
});

// 238 — card
S4.push(card(238, '2 HOURS 30 MINUTES', 'AFTER THE COLLISION', { bigSize: 120 }));

// 239 — the bow underwater; the sea floods the grand staircase
S4.push({
  seg: 239, name: 'bow under staircase', amb: [{ kind: 'water', vol: 1.0 }, { kind: 'crowd', vol: 0.5 }],
  fx: { bloom: 1.0, bloomThreshold: 0.5, saturation: 1.05, contrast: 1.1 },
  sfx: (S) => [{ t: 0.2, type: 'creak', dur: 3, vol: 0.25 }, { t: S.at(241), type: 'splash', vol: 0.4 }, { t: S.find(242, /shattering/), type: 'glass', vol: 0.35 }, { t: S.find(242, /shattering/), type: 'boom', vol: 0.3 }],
  build(E) {
    const st = sinkingWorld(E, { pivotX: 20 }); st.setSink(-0.16, 10);
    const sc = grandStaircase(E);
    const water = mesh(new THREE.BoxGeometry(14, 9, 14), std(0x1a6a8a, { rough: 0.05, transparent: true, opacity: 0.55, emissive: 0x05303a, ei: 0.6 }), 0, -4.5, 0, sc.scene); sc.water = water;
    sc.shards = particles(300, (i, t) => [0, -100, 0], { size: 0.12, color: 0xdff4ff, opacity: 1 }); sc.scene.add(sc.shards);
    st.sc = sc; st._extScene = st.scene; st._extCam = st.camera;
    return st;
  },
  update(st, S) {
    const a241 = S.at(241);
    if (S.lt < a241) {
      st.scene = st._extScene; st.camera = st._extCam;
      st.setSink(-0.16 - S.lt * 0.004, 10 + S.lt * 0.5);
      track(st.camera, [[0, [220, 10, 260], [40, 0, 0], 38], [a241, [200, 8, 240], [40, 0, 0], 36]], S.lt);
      st.tick(S);
    } else {
      const sc = st.sc; st.scene = sc.scene; st.camera = sc.camera;
      const k = S.lt - a241;
      sc.water.position.y = -4.5 + k * 1.2;
      const sh = S.lt - S.find(242, /shattering/);
      sc.dome.visible = sh < 0.05;
      const pts = sc.shards.geometry.attributes.position.array;
      for (let i = 0; i < 300; i++) { const q = rng(i + 3); if (sh < 0) { pts[i * 3 + 1] = -100; continue; } const a = q() * Math.PI * 2, r = q() * 3.8; pts[i * 3] = Math.cos(a) * r + (q() - 0.5) * sh; pts[i * 3 + 1] = 9 - sh * sh * 5 - q() * sh * 2; pts[i * 3 + 2] = Math.sin(a) * r + (q() - 0.5) * sh; }
      sc.shards.geometry.attributes.position.needsUpdate = true;
      sc.domeLight.intensity = sh > 0 ? 5 : 40;
      track(sc.camera, [[a241, [0, 3.5, 6.5], [0, 2, -2], 52, 0.1], [S.dur, [0, 4.5, 6.0], [0, 8.5, 0], 56, 0.12]], S.lt, { roll: true, shake: sh > 0 && sh < 0.6 ? 0.05 : 0.01 });
    }
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    if (lt < S.at(241)) { revealText(g, 'THE END IS CLOSE', W / 2, 170, clamp(lt / 0.6), { font: F.cond(700, 90), ls: 12, color: '#fff', shadow: 30 }); if (lt > S.at(240)) txt(g, 'the bow is underwater', W / 2, 260, { font: F.serif(44), color: '#9fe3ff', alpha: clamp((lt - S.at(240)) * 2), shadow: 20 }); }
    else { const k = lt - S.at(241); txt(g, 'THE GRAND STAIRCASE', 110, 120, { font: F.cond(600, 46), ls: 8, color: '#ffe2a0', align: 'left', alpha: clamp(k * 2), shadow: 20 }); }
  },
});

// 243 — Smith releases Phillips & Bride; goes to the bridge
S4.push({
  seg: 243, name: 'captain releases operators', amb: [{ kind: 'radio', vol: 0.6 }, { kind: 'water', vol: 0.5 }],
  fx: { bloom: 0.9, bloomThreshold: 0.5, saturation: 1.05, tint: [1.0, 0.98, 1.04], vignette: 0.8 },
  sfx: (S) => [{ t: 0.3, type: 'morse', code: '... --- ... ... --- ...', vol: 0.08, freq: 760 }, { t: S.at(245), type: 'pop', pitch: 300 }, { t: S.at(247), type: 'creak', dur: 3, vol: 0.15 }],
  build(E) {
    const st = wirelessRoom(E);
    const smith = person({ coat: '#141a2c', hat: 'officer', beard: true, hair: '#d8d8d8', beardColor: '#eeeeee' }); smith.position.set(1.2, 0, 1.2); smith.rotation.y = Math.PI * 1.2; st.scene.add(smith); st.smith = smith;
    const water = mesh(new THREE.PlaneGeometry(5, 4), std(0x1a5a7a, { rough: 0.05, transparent: true, opacity: 0.7, emissive: 0x05202a, ei: 0.4 }), 0, 0.08, 0, st.scene); water.rotation.x = -Math.PI / 2; st.water = water;
    // outside: deck to bridge
    const ext = sinkingWorld(E, { pivotX: 20 }); ext.setSink(-0.18, 12);
    const cap2 = person({ coat: '#141a2c', hat: 'officer', beard: true, hair: '#d8d8d8', beardColor: '#eeeeee' }); cap2.position.set(40, ext.ship.userData.boatDeckY - 1.2, 11.5); cap2.rotation.y = Math.PI / 2; ext.ship.add(cap2);
    Object.assign(st, { ext, cap2, _room: st.scene, _roomCam: st.camera });
    return st;
  },
  update(st, S) {
    const a247 = S.at(247);
    if (S.lt < a247) {
      st.scene = st._room; st.camera = st._roomCam;
      st.animate(S, { transmit: 0.8, pile: 1 });
      st.water.position.y = 0.08 + S.lt * 0.01;
      pose.idle(st.smith, S.t); st.smith.userData.armR.rotation.x = -0.5 * clamp((S.lt - S.at(244)) * 2);
      track(st.camera, [[0, [-1.8, 1.7, 1.8], [0.3, 1.3, -0.6], 46, 0.1], [a247, [-1.5, 1.65, 1.4], [0.4, 1.4, -0.4], 40, 0.11]], S.lt, { roll: true });
    } else {
      const e = st.ext; st.scene = e.scene; st.camera = e.camera;
      const k = S.lt - a247;
      st.cap2.position.x = 40 + k * 1.2; pose.walk(st.cap2, S.t, 0.6);
      const w = new THREE.Vector3(st.cap2.position.x, st.cap2.position.y + 1.5, 11.5); e.ship.localToWorld(w);
      track(e.camera, [[a247, [w.x - 8, w.y + 0.6, w.z - 1.5], [w.x + 6, w.y, w.z + 0.5], 40, 0.17], [S.dur, [w.x - 9, w.y + 0.7, w.z - 1.5], [w.x + 6, w.y, w.z + 0.5], 38, 0.18]], S.lt, { roll: true });
      e.tick(S);
    }
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    const a = lt - S.at(244);
    if (a > 0 && lt < S.at(247)) { txt(g, 'RELEASED FROM DUTY', W / 2, 160, { font: F.cond(700, 76), ls: 8, color: '#fff', alpha: clamp(a * 3), shadow: 30 }); const b = lt - S.at(245); if (b > 0) txt(g, '“You have done all you can.', W / 2, H - 290, { font: F.serif(52), color: '#fff', alpha: clamp(b * 2), shadow: 20 }); const c = lt - S.at(246); if (c > 0) txt(g, 'Now save yourselves.”', W / 2, H - 210, { font: F.serif(52, true, 800), color: '#ffe2a0', alpha: clamp(c * 2), shadow: 20 }); }
    const s = lt - S.at(247);
    if (s > 0) txt(g, 'LAST SEEN HEADING TO THE BRIDGE', W / 2, 160, { font: F.cond(700, 64), ls: 6, color: '#fff', alpha: clamp(s * 2), shadow: 30 });
  },
});

// 249 — the band's final hymn: "Nearer, My God, to Thee"
const HYMN = [[64, 0, 2], [62, 2, 1], [60, 3, 1], [60, 4, 2], [57, 6, 2], [57, 8, 2], [55, 10, 2], [60, 12, 2], [64, 14, 2], [62, 16, 4], [64, 20, 2], [62, 22, 1], [60, 23, 1], [60, 24, 2], [57, 26, 2], [57, 28, 2], [55, 30, 2], [60, 32, 2], [59, 34, 2], [60, 36, 4]];
const HYMN_BASS = [[48, 0, 4], [45, 4, 4], [41, 8, 4], [43, 12, 4], [48, 16, 4], [48, 20, 4], [45, 24, 4], [41, 28, 4], [43, 32, 4], [36, 36, 4]];
S4.push({
  seg: 249, name: 'band final hymn', amb: [{ kind: 'water', vol: 0.8 }, { kind: 'crowd', vol: 0.4 }],
  fx: { bloom: 1.1, bloomThreshold: 0.5, saturation: 0.95, tint: [1.02, 0.98, 1.0], vignette: 0.8 },
  sfx: (S) => [{ t: 0.0, type: 'melody', instr: 'violin', vol: 0.05, beat: 0.42, notes: HYMN }, { t: 0.0, type: 'melody', instr: 'cello', vol: 0.035, beat: 0.42, notes: HYMN_BASS }, { t: S.at(253), type: 'boom', vol: 0.3 }, { t: S.at(254), type: 'splash', vol: 0.35 }],
  build(E) {
    const st = sinkingWorld(E, { pivotX: 0 }); st.setSink(-0.2, 14);
    const by = st.ship.userData.boatDeckY;
    st.band = [];
    for (let i = 0; i < 8; i++) { const m = person({ coat: '#111', hair: ['#2a1a10', '#6a4a2a', '#3a2a1e', '#1a1410'][i % 4], mustache: i === 0 }); m.position.set(-40 + (i % 4) * 1.4, by - 1.2, 11.2 + Math.floor(i / 4) * 1.3); m.rotation.y = -0.4; st.ship.add(m); st.band.push(m); }
    st.boat = st.ship.userData.boats.find((b) => b.userData.side === 1 && b.position.x < -40);
    return st;
  },
  update(st, S) {
    st.setSink(-0.2 - S.lt * 0.003, 14 + S.lt * 0.4);
    st.band.forEach((m, i) => { m.userData.armR.rotation.x = -1.0; m.userData.armR.rotation.z = -0.4 + Math.sin(S.t * 1.6 + i) * 0.35; m.userData.armL.rotation.x = -1.3; m.userData.armL.rotation.z = 0.6; m.userData.head.rotation.z = 0.25; });
    const w = new THREE.Vector3(-38, st.ship.userData.boatDeckY + 0.5, 11.8); st.ship.localToWorld(w);
    const a254 = S.at(254);
    if (S.lt < a254) track(st.camera, [[0, [w.x + 6, w.y + 1.5, w.z - 4], [w.x, w.y + 0.6, w.z], 42, 0.2], [a254, [w.x + 4, w.y + 1.2, w.z - 3], [w.x, w.y + 0.8, w.z], 34, 0.2]], S.lt, { roll: true });
    else { st.boat.position.y = st.boat.userData.home.y + Math.sin(S.lt * 3) * 0.3; st.boat.position.z = st.boat.userData.home.z + (S.lt - a254) * 2; track(st.camera, [[a254, [w.x + 60, w.y + 10, w.z + 70], [w.x, w.y - 4, w.z], 40], [S.dur, [w.x + 70, w.y + 12, w.z + 80], [w.x, w.y - 6, w.z], 40]], S.lt); }
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    nameTag(g, 110, H - 330, 'WALLACE HARTLEY', 'BANDLEADER', clamp((lt - S.find(251, /Wallace/)) / 0.6) * (lt < S.at(252) + 0.5 ? 1 : 0));
    const h = lt - S.at(252);
    if (h > 0 && lt < S.at(253)) { revealText(g, '“NEARER, MY GOD, TO THEE”', W / 2, 170, clamp(h / 0.9), { font: F.serif(70, true, 800), color: '#ffe2a0', shadow: 30, style: 'blur' }); }
    const n = lt - S.at(253);
    if (n > 0 && lt < S.at(254)) { for (let i = 0; i < 8; i++) personIcon(g, W / 2 - 420 + i * 120, 230, 1.8, '#f2efe6', { alpha: clamp((n - i * 0.08) * 4) * (1 - clamp((n - 1.2) * 0.8) * 0.6) }); txt(g, 'NONE OF THE 8 MUSICIANS SURVIVED', W / 2, 360, { font: F.cond(700, 56), ls: 6, color: '#fff', alpha: clamp(n * 2 - 0.5), shadow: 20 }); }
  },
});

// 255 — card: THE SINKING
S4.push(card(255, 'THE SINKING', null, { bigSize: 150, color: '#ff3b4a', boomVol: 1.0 }));

// 256..272 — stern rises, lights go out, the hull breaks, 2:20 a.m.
function breakupWorld(E) {
  const st = oceanWorld({ ...GLASS, envMap: E.envMap, ship: false, fogNear: 800, fogFar: 5000 });
  const SPLIT = -20; // between 3rd and 4th funnel
  const stern = buildLiner({ range: [-L / 2, SPLIT], lights: 1 }), bow = buildLiner({ range: [SPLIT, L / 2], lights: 1 });
  const sternP = new THREE.Group(), bowP = new THREE.Group(); st.scene.add(sternP, bowP);
  sternP.add(stern); bowP.add(bow);
  sternP.position.set(SPLIT, 0, 0); stern.position.x = -SPLIT; bowP.position.set(SPLIT, 0, 0); bow.position.x = -SPLIT;
  // propellers
  const bronze = std(0xb87a3a, { metal: 0.9, rough: 0.3 });
  for (const z of [-7, 0, 7]) { const pr = new THREE.Group(); pr.position.set(-L / 2 + 8, -8, z); stern.add(pr); for (let b = 0; b < 3; b++) { const bl = box(0.6, 3.4, 1.2, bronze, 0, 1.6, 0, pr); bl.rotation.x = 0.4; const piv = new THREE.Group(); piv.rotation.x = (b / 3) * Math.PI * 2; piv.add(bl); pr.add(piv); } }
  const rudder = box(8, 12, 0.6, std(0x8e1e16), -L / 2 + 2, -6, 0, stern); void rudder;
  const people = particles(260, () => [0, 0, 0], { size: 0.5, color: 0x1a1a1a, opacity: 0.9, add: false, tex: null });
  people.material.map = null; people.material.sizeAttenuation = true; stern.add(people);
  const pts = people.geometry.attributes.position.array; const r = rng(256);
  for (let i = 0; i < 260; i++) { pts[i * 3] = -L / 2 + 10 + r() * 100; pts[i * 3 + 1] = 13 + r() * 6; pts[i * 3 + 2] = (r() - 0.5) * 24; }
  people.geometry.attributes.position.needsUpdate = true;
  const debris = particles(500, () => [0, -999, 0], { size: 0.9, color: 0x6a5a4a, opacity: 0.9, add: false });
  st.scene.add(debris);
  const spray = particles(400, () => [0, -999, 0], { size: 2.5, color: 0xdfeeff, opacity: 0.8 });
  st.scene.add(spray);
  Object.assign(st, { stern, bow, sternP, bowP, people, debris, spray, SPLIT });
  return st;
}
S4.push({
  seg: 256, name: 'stern rises lights out', amb: [{ kind: 'water', vol: 0.9 }, { kind: 'crowd', vol: 0.9 }], lead: 0.2,
  fx: { bloom: 1.1, bloomThreshold: 0.45, saturation: 1.05, tint: [0.95, 0.98, 1.08], vignette: 0.75 },
  sfx: (S) => [{ t: 0.1, type: 'creak', dur: 5, vol: 0.3 }, { t: 4, type: 'creak', dur: 5, vol: 0.25 }, { t: S.at(260), type: 'drop', vol: 0.2 }, { t: S.find(262, /lights/) + 1.5, type: 'drop', vol: 0.4, f0: 600, f1: 40, dur: 1.2 }, { t: S.at(264), type: 'boom', vol: 0.45 }, { t: 10, type: 'creak', dur: 6, vol: 0.25 }],
  build: (E) => breakupWorld(E),
  update(st, S) {
    const k = clamp(S.lt / S.dur);
    const ang = lerp(-0.22, -0.42, easeInOut(k));
    st.sternP.rotation.z = ang; st.bowP.rotation.z = ang; st.sternP.position.y = st.bowP.position.y = -lerp(18, 26, k);
    const out = S.find(262, /lights/) + 1.2;
    const lightsOn = S.lt < out ? (S.lt > out - 1.0 && Math.sin(S.t * 40) > 0.3 ? 0.3 : 1) : 0;
    st.stern.userData.setLights(lightsOn); st.bow.userData.setLights(lightsOn);
    // people sliding / falling
    const pts = st.people.geometry.attributes.position.array; const r = rng(256);
    for (let i = 0; i < 260; i++) { const base = -L / 2 + 10 + r() * 100; const fall = Math.max(0, (S.lt - S.at(260)) * 0.8 - r() * 4); pts[i * 3] = base + fall * fall * 3; pts[i * 3 + 1] = 13 + r() * 6 - (i % 7 === 0 ? fall * fall * 2 : 0); r(); }
    st.people.geometry.attributes.position.needsUpdate = true;
    const a258 = S.at(258);
    if (S.lt < a258) track(st.camera, [[0, [-30, 6, 220], [-40, 35, 0], 40], [a258, [-60, 5, 200], [-60, 45, 0], 38]], S.lt);
    else if (S.lt < S.at(262)) track(st.camera, [[a258, [-110, 3, 110], [-122, 38, 0], 48], [S.at(262), [-115, 3, 100], [-125, 44, 0], 46]], S.lt);
    else track(st.camera, [[S.at(262), [60, 10, 300], [-40, 30, 0], 40], [S.dur, [50, 10, 280], [-40, 30, 0], 38]], S.lt);
    S.fx.exposure = 1;
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    if (lt < S.at(258)) revealText(g, 'THE STERN RISES INTO THE NIGHT', W / 2, 160, clamp((lt - 0.3) / 0.7), { font: F.cond(700, 70), ls: 6, color: '#fff', shadow: 30 });
    const p = lt - S.at(258);
    if (p > 0 && lt < S.at(259)) txt(g, 'BRONZE PROPELLERS AGAINST THE STARS', W / 2, 160, { font: F.cond(600, 52), ls: 6, color: '#ffe2a0', alpha: clamp(p * 2), shadow: 20 });
    const o = lt - (S.find(262, /lights/) + 1.2);
    if (o > 0 && lt < S.at(264) + 1) revealText(g, 'DARKNESS', W / 2, H / 2, clamp(o / 0.8), { font: F.cond(700, 140), ls: 40, color: '#fff', shadow: 40, style: 'blur' });
  },
});
S4.push({
  seg: 265, name: 'breaks in two', amb: [{ kind: 'water', vol: 1.0 }, { kind: 'crowd', vol: 0.8 }], lead: 0.2,
  fx: { bloom: 1.1, bloomThreshold: 0.45, saturation: 1.0, tint: [0.92, 0.98, 1.1], vignette: 0.8 },
  sfx: (S) => [{ t: 0.2, type: 'creak', dur: 4, vol: 0.35 }, { t: S.find(267, /deafening/), type: 'tear', dur: 3, vol: 0.55 }, { t: S.find(268, /two/), type: 'boom', vol: 0.7 }, { t: S.at(269), type: 'splash', vol: 0.4 }, { t: S.at(270) + 0.5, type: 'splash', vol: 0.45 }, { t: S.at(271) + 1.5, type: 'bubbles', n: 30, dur: 3, vol: 0.08 }, { t: S.find(272, /2/), type: 'ticks', n: 3, interval: 0.6, vol: 0.3 }],
  build: (E) => breakupWorld(E),
  update(st, S) {
    const brk = S.find(268, /breaks/), a269 = S.at(269), a270 = S.at(270), a271 = S.at(271), a272 = S.at(272);
    st.stern.userData.setLights(0); st.bow.userData.setLights(0);
    if (S.lt < brk) { const ang = -0.42 - S.lt * 0.004; st.sternP.rotation.z = st.bowP.rotation.z = ang; st.sternP.position.y = st.bowP.position.y = -26; }
    else {
      const k = S.lt - brk;
      st.bowP.rotation.z = -0.42 - Math.min(0.5, k * 0.15); st.bowP.position.y = -26 - k * k * 4; st.bowP.position.x = st.SPLIT + k * 4;
      const fall = easeOut(clamp((S.lt - a270) / 2.5)), rise = easeIn(clamp((S.lt - a271) / 4)), sink = clamp((S.lt - a271 - 2) / 5);
      st.sternP.rotation.z = lerp(-0.42, -0.06, Math.min(1, k / 1.5 + fall)) * (1 - rise) + rise * -1.45;
      st.sternP.rotation.x = Math.sin(clamp((S.lt - a270) / 3) * Math.PI) * 0.12;
      st.sternP.position.y = lerp(-26, -10, Math.min(1, k / 1.5 + fall)) * (1 - rise) + rise * -40 - sink * sink * 140;
    }
    st.sternP.visible = S.lt < a272 + 0.5; st.bowP.visible = S.lt < a270 + 3;
    // spray at the break & debris after
    const sp = st.spray.geometry.attributes.position.array; const ks = S.lt - brk;
    for (let i = 0; i < 400; i++) { const q = rng(i + 7); if (ks < 0 || ks > 4) { sp[i * 3 + 1] = -999; continue; } const a = q() * Math.PI * 2; sp[i * 3] = st.SPLIT + Math.cos(a) * ks * 18 * q(); sp[i * 3 + 1] = ks * 20 * q() - ks * ks * 6; sp[i * 3 + 2] = Math.sin(a) * ks * 18 * q(); }
    st.spray.geometry.attributes.position.needsUpdate = true;
    const db = st.debris.geometry.attributes.position.array; const kd = S.lt - a271 - 3;
    for (let i = 0; i < 500; i++) { const q = rng(i + 70); if (kd < 0) { db[i * 3 + 1] = -999; continue; } const a = q() * Math.PI * 2, r = q() * 120 * Math.min(1, kd / 3 + 0.3); db[i * 3] = -100 + Math.cos(a) * r; db[i * 3 + 1] = 0.3; db[i * 3 + 2] = Math.sin(a) * r; }
    st.debris.geometry.attributes.position.needsUpdate = true;
    if (S.lt < a272) track(st.camera, [[0, [30, 12, 260], [-30, 30, 0], 40], [brk, [25, 10, 250], [-30, 25, 0], 40], [a271, [50, 8, 300], [-60, 30, 0], 42], [a272, [50, 8, 300], [-90, 30, 0], 42]], S.lt, { shake: S.lt > brk && S.lt < brk + 1.5 ? 0.8 : 0 });
    else track(st.camera, [[a272, [-100, 90, 300], [-100, 0, 0], 40], [S.dur, [-100, 130, 260], [-100, 0, 0], 40]], S.lt);
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    const b = lt - S.find(268, /breaks/);
    if (b > 0 && lt < S.at(269)) revealText(g, 'THE HULL BREAKS IN TWO', W / 2, 170, clamp(b / 0.4), { font: F.cond(700, 96), ls: 8, color: '#fff', shadow: 30, style: 'scale' });
    const a = lt - S.at(272);
    if (a > 0) { g.save(); g.globalAlpha = clamp(a * 3); clockIcon(g, W / 2, H / 2 - 80, 140, 2 + 20 / 60, { face: '#0b1626', rim: '#dfe8ff', hand: '#dfe8ff' }); g.restore(); txt(g, '2:20 AM', W / 2, H / 2 + 150, { font: F.cond(700, 110), ls: 10, color: '#fff', alpha: clamp(a * 3), shadow: 30 }); txt(g, 'only a swirl of water and wreckage remain', W / 2, H / 2 + 250, { font: F.serif(42), color: '#9fbcd8', alpha: clamp(a * 2 - 1), shadow: 10 }); }
  },
});

export default S4;
