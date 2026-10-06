// ACT 3 — April 1912: departure, the crossing, the ignored warnings, the last minute.
import * as THREE from 'three';
import { card, oceanWorld, track, place, cam, paper, dark, toScreen, V, NIGHT, GLASS } from './common.js';
import { roomWorld, painting, landscape, glow, chandelier, deckSet, terraces } from './worlds.js';
import { wirelessRoom, bridgeSet, diningSaloon, crowsNest } from './sets.js';
import { std, box, cyl, sph, mesh, canvasTex, rng, particles, clamp, easeOut, easeIn, easeInOut, easeOutBack, lerp, smokeTex, wobble } from '../lib/kit.js';
import { txt, F, PAL, revealText, measure, shipSilhouette, personIcon, check, cross, strike, callout, nameTag, roundRect, clockIcon, thermometer, radioWaves, icebergIcon, glowBorder, route } from '../lib/draw2d.js';
import { newspaper, counter, drawMap, mapProjector, mapPin, PLACES } from './diagrams.js';
import { person, pose, crowd, gridSpots } from '../lib/people.js';
import { buildLiner, TITANIC, NEWYORK, CALIFORNIAN, funnelSmoke } from '../lib/ship.js';
import { makeIceberg } from '../lib/env.js';

const S3 = [];
const typedLine = (g, text, x, y, k, o = {}) => txt(g, text.slice(0, Math.floor(clamp(k) * text.length)), x, y, { align: 'left', ...o });

// 72 — card + "Departure."
S3.push(card(72, '4 DAYS', 'BEFORE THE COLLISION', { extra: 'departure' }));

// 74 — Southampton, noon, April 10
function dockWorld(E, o = {}) {
  const st = oceanWorld({ sky: 'day', ocean: 'river', envMap: E.envMap, fogColor: '#d8e2ea', fogNear: 800, fogFar: 4000, sunDir: [0.5, 0.5, 0.6], wake: o.wake });
  const { scene } = st;
  const quay = box(900, 5, 80, std(0x6a645c, { rough: 0.95 }), -100, 1.5, -62, scene); quay.receiveShadow = true;
  for (let i = 0; i < 8; i++) { const sh = box(60, 14, 30, std(i % 2 ? 0x8a5a3a : 0x6a6a72, { rough: 0.9 }), -400 + i * 90, 11, -80, scene); sh.castShadow = true; box(62, 1, 32, std(0x3a3a3a), -400 + i * 90, 18.5, -80, scene); }
  for (let i = 0; i < 6; i++) { const c = new THREE.Group(); c.position.set(-250 + i * 70, 4, -30); scene.add(c); box(1, 30, 1, std(0x2a2a2a), 0, 15, 0, c); const j = box(0.8, 0.8, 24, std(0x2a2a2a), 0, 29, 8, c); j.rotation.x = -0.4; }
  const r = rng(74); const spots = [];
  for (let i = 0; i < 700; i++) spots.push({ x: -300 + r() * 500, y: 4, z: -28 - r() * 14, ry: Math.PI + (r() - 0.5) });
  st.crowd = crowd(spots, { hats: 0.9, seed: 74, palette: ['#2a2c35', '#3a2c24', '#1d2a3a', '#6a5a48', '#5a1f24', '#d8cfb8', '#7a6650', '#f2efe6'] }); scene.add(st.crowd);
  // tugs
  st.tugs = [];
  for (let i = 0; i < 2; i++) { const tug = new THREE.Group(); scene.add(tug); box(24, 4, 7, std(0x1a1a1a), 0, 0.5, 0, tug); box(8, 4, 5, std(0xe8e2d4), 0, 4, 0, tug); cyl(1, 1, 7, std(0xc8361e), 2, 8, 0, tug, 12); st.tugs.push(tug); }
  return st;
}
S3.push({
  seg: 74, name: 'southampton departure', amb: [{ kind: 'crowd', vol: 0.9 }, 'ocean'], trans: 'fade',
  fx: { bloom: 0.6, saturation: 1.2, contrast: 1.06 },
  sfx: (S) => [{ t: 0.2, type: 'type', n: 16, vol: 0.15 }, { t: S.find(74, /noon/), type: 'bell', freq: 900, n: 2, interval: 0.6, vol: 0.12 }, { t: S.find(74, /casts/), type: 'horn', dur: 3.2, vol: 0.2 }, { t: S.find(75, /2,224/), type: 'hit', vol: 0.4 }],
  build: (E) => dockWorld(E),
  update(st, S) {
    const c = S.find(74, /casts/);
    const m = easeIn(clamp((S.lt - c) / 10));
    st.ship.position.set(m * 80, 0, 60 + m * 30); st.ship.rotation.y = -m * 0.1;
    st.tugs.forEach((t, i) => t.position.set(st.ship.position.x + 150 - i * 300 + m * 30, 0, st.ship.position.z + 30 + i * 10));
    track(st.camera, [[0, [-230, 30, 280], [0, 20, 30], 40], [S.dur, [-180, 26, 300], [40, 18, 40], 38]], S.lt);
    st.crowd.userData.update(S.t, (d, t, i) => ({ y: d.y + (i % 3 === 0 ? Math.abs(Math.sin(t * 6 + i)) * 0.25 : 0) }));
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    typedLine(g, '10 APRIL 1912', 110, H - 330, lt / 0.7, { font: F.cond(700, 72), ls: 6, color: '#fff', shadow: 20 });
    typedLine(g, 'SOUTHAMPTON · ENGLAND', 112, H - 266, (lt - 0.6) / 0.9, { font: F.cond(400, 34), ls: 12, color: '#ffd23f', shadow: 10 });
    const n = lt - S.find(74, /noon/);
    if (n > 0) { g.save(); g.globalAlpha = clamp(n * 3); clockIcon(g, W - 200, 210, 100, 12 + Math.min(0, n - 1) * 0); g.restore(); txt(g, '12:00 NOON', W - 200, 350, { font: F.cond(600, 36), ls: 6, color: '#fff', alpha: clamp(n * 3), shadow: 10 }); }
    const k = lt - S.find(75, /2,224/);
    if (k > 0) counter(g, W / 2, 200, 2224, 'PEOPLE ABOARD', clamp(k / 1.2), { size: 150 });
  },
});

// 76 — first class: the richest people in the world
S3.push({
  seg: 76, name: 'first class notables', amb: 'room', trans: 'whip',
  fx: { bloom: 0.8, bloomThreshold: 0.6, saturation: 1.18, tint: [1.05, 1.0, 0.92] },
  sfx: (S) => [{ t: 0, type: 'whoosh', vol: 0.2 }, ...[77, 78, 79, 80].map((s, i) => ({ t: S.at(s), type: 'pop', pitch: 420 + i * 80 })), { t: 0.6, type: 'shimmer', vol: 0.05 }],
  build(E) {
    const st = roomWorld({ w: 20, d: 10, h: 5, wall: '#2a1a3a', wallAccent: '#d8b25a', floor: 'carpet', floorColor: '#3a0c18', floorAccent: '#d8b25a', keyI: 20, hemi: 0.4 }, E);
    const { scene } = st;
    for (const x of [-6, 0, 6]) chandelier(scene, x, 4.2, -1, 1.1, { intensity: 6, dist: 10 });
    const cast = [
      { x: -6, ps: [{ coat: '#0e0e12', hat: 'top', mustache: true, hair: '#4a3a2a' }, { female: true, dress: '#e8d8f0', hair: '#3a2a1e' }] },
      { x: -2, ps: [{ coat: '#121218', hair: '#1a1410', mustache: false, tie: '#d8d8d8' }] },
      { x: 2, ps: [{ coat: '#16161a', hair: '#d8d8d8', beard: true, beardColor: '#e8e8e8' }, { female: true, dress: '#2a1a3a', hair: '#9a9a9a' }] },
      { x: 6, ps: [{ coat: '#101218', hair: '#1a1410', mustache: true }, { coat: '#1a1c24', hair: '#3a2a1e' }] },
    ];
    st.cast = [];
    cast.forEach((c) => c.ps.forEach((o, i) => { const p = person(o); p.position.set(c.x + (i ? 0.55 : -0.35), 0, 0); p.rotation.y = i ? -0.2 : 0.15; scene.add(p); st.cast.push(p); const spot = new THREE.SpotLight(0xffe2b0, 25, 8, 0.45, 0.6, 1.5); spot.position.set(c.x, 4.6, 2); spot.target.position.set(c.x, 1.2, 0); scene.add(spot, spot.target); }));
    for (let i = -3; i <= 3; i++) painting(scene, i * 2.8, 2.9, -4.95, 1.4, 1.0, landscape(['#3a5a8a', '#6a3a5a', '#3a6a5a'][(i + 3) % 3], '#d8a060'));
    return st;
  },
  update(st, S) {
    const keys = [[0, -9, 46], [S.at(77), -6, 30], [S.at(78), -2, 30], [S.at(79), 2, 30], [S.at(80), 6.2, 32]];
    let i = 0; while (i < keys.length - 1 && S.lt >= keys[i + 1][0]) i++;
    const [t0, x, fov] = keys[i]; const k = S.lt - t0;
    if (i === 0) place(st.camera, [-2 + k * 0.8, 1.7, 7], [0, 1.4, 0]);
    else place(st.camera, [x + 0.2 - k * 0.08, 1.6, 3.6 - k * 0.12], [x + 0.1, 1.45, 0]);
    st.camera.fov = fov; st.camera.updateProjectionMatrix();
    st.cast.forEach((p, j) => pose.idle(p, S.t, j));
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    if (lt < S.at(77)) { revealText(g, 'FIRST CLASS', W / 2, 160, clamp(lt / 0.5), { font: F.cond(700, 90), ls: 16, color: '#ffe2a0', shadow: 30 }); txt(g, 'the richest and most influential people in the world', W / 2, 245, { font: F.serif(40), color: '#fff', alpha: clamp(lt * 2 - 0.6), shadow: 10 }); }
    const tags = [[77, 'JOHN JACOB ASTOR IV', 'RICHEST MAN ABOARD · WITH WIFE MADELEINE'], [78, 'BENJAMIN GUGGENHEIM', 'INDUSTRIALIST'], [79, 'ISIDOR STRAUS', 'CO-OWNER · MACY’S'], [80, 'BRUCE ISMAY & THOMAS ANDREWS', 'WHITE STAR LINE · HARLAND & WOLFF']];
    tags.forEach(([seg, name, role], i) => { const a = S.at(seg), b = tags[i + 1] ? S.at(tags[i + 1][0]) : S.dur + 1; if (lt >= a && lt < b) nameTag(g, 110, H - 320, name, role, clamp((lt - a) / 0.6)); });
  },
});

// 81 — departure nearly ends in disaster: SS New York
S3.push({
  seg: 81, name: 'near miss new york', amb: ['ocean', { kind: 'crowd', vol: 0.5 }], trans: 'whip',
  fx: { bloom: 0.5, saturation: 1.15, contrast: 1.08 },
  sfx: (S) => [{ t: 0, type: 'whoosh', vol: 0.25 }, { t: S.find(82, /pulls/), type: 'creak', dur: 3, vol: 0.2 }, { t: S.find(82, /moorings/) - 0.4, type: 'gunshot', vol: 0.2 }, { t: S.find(82, /moorings/) - 0.1, type: 'gunshot', vol: 0.15 }, { t: S.find(84, /narrowly/), type: 'riser', dur: 2, vol: 0.18 }, { t: S.find(84, /three/), type: 'hit', vol: 0.45 }, { t: S.find(84, /three/), type: 'horn', dur: 1.4, vol: 0.12 }],
  build(E) {
    const st = dockWorld(E);
    st.ny = buildLiner({ spec: NEWYORK }); st.scene.add(st.ny);
    st.ny2 = buildLiner({ spec: NEWYORK }); st.ny2.position.set(-120, 0, 0); st.scene.add(st.ny2); // Oceanic moored alongside
    return st;
  },
  update(st, S) {
    const pull = S.find(82, /pulls/), miss = S.find(84, /three/);
    const tx = -260 + S.lt * 11; st.ship.position.set(tx, 0, 75); st.ship.rotation.y = 0;
    const k = easeInOut(clamp((S.lt - pull) / (miss - pull)));
    st.ny.position.set(-30 + k * 40, 0, 0 + k * 42); st.ny.rotation.y = -k * 0.55;
    st.ny2.position.set(-210, 0, 0);
    st.tugs.forEach((t, i) => t.position.set(-30 + 140 * i, 0, 130));
    if (S.lt < miss - 1.5) track(st.camera, [[0, [-80, 330, 160], [-60, 0, 40], 40], [miss - 1.5, [-30, 300, 150], [-20, 0, 40], 38]], S.lt);
    else track(st.camera, [[miss - 1.5, [60, 14, 120], [10, 8, 50], 36], [S.dur, [70, 12, 115], [20, 8, 55], 34]], S.lt, { shake: 0.1 });
    st.crowd.userData.update(S.t, null);
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    const ny = toScreen(V(st.ny.position.x, 15, st.ny.position.z), st.camera), ti = toScreen(V(st.ship.position.x + 40, 25, 75), st.camera);
    if (lt < S.find(84, /three/) - 1.5) {
      callout(g, ny[0] - 330, ny[1] - 130, ny[0], ny[1], 'SS NEW YORK', 'pulled from her moorings', clamp((lt - S.find(82, /New/)) / 0.8), { align: 'right' });
      callout(g, ti[0] + 60, ti[1] + 120, ti[0], ti[1], 'TITANIC', 'displacing a huge volume of water', clamp((lt - 0.3) / 0.8));
    }
    const m = lt - S.find(84, /three/);
    if (m > 0) { txt(g, '≈ 3 FEET', W / 2, 200, { font: F.cond(700, 150), color: '#ff4040', alpha: clamp(m * 4), shadow: 40 }); txt(g, 'BETWEEN THE TWO HULLS', W / 2, 300, { font: F.cond(500, 36), ls: 12, color: '#fff', alpha: clamp(m * 3 - 0.5), shadow: 10 }); glowBorder(g, W, H, '#ff3030', 0.6 * (1 - clamp(m))); }
  },
});

// 85 — experienced sailors shake their heads: a bad omen
S3.push({
  seg: 85, name: 'bad omen', amb: [{ kind: 'wind', vol: 0.6 }, 'ocean'],
  fx: { bloom: 0.5, saturation: 0.9, contrast: 1.15, vignette: 0.8, tint: [0.95, 1.0, 1.05] },
  sfx: (S) => [{ t: S.at(86), type: 'boom', vol: 0.45 }],
  build(E) {
    const st = dockWorld(E);
    const sailor = person({ coat: '#1d2a3a', hat: 'cap', hatColor: '#1d2a3a', beard: true, beardColor: '#9a9a9a', hair: '#8a8a8a', tie: false, skin: '#c98d68' });
    sailor.position.set(-120, 4, -26); sailor.rotation.y = 0.2; st.scene.add(sailor); st.sailor = sailor;
    const s2 = person({ coat: '#2a2a2a', hat: 'flat', beard: true, beardColor: '#6a5a4a', tie: false, skin: '#d9a27c' }); s2.position.set(-121, 4, -27.2); s2.rotation.y = 0.6; st.scene.add(s2); st.s2 = s2;
    return st;
  },
  update(st, S) {
    st.ship.position.set(-100 + S.lt * 8, 0, 90);
    track(st.camera, [[0, [-118.4, 5.9, -23.5], [-120.3, 5.6, -26], 34], [S.dur, [-118.8, 5.8, -23.9], [-120.3, 5.65, -26], 28]], S.lt);
    st.sailor.userData.head.rotation.y = Math.sin(S.lt * 5) * 0.35 * clamp(S.lt * 2) * (1 - clamp((S.lt - 2.2) * 2));
    st.s2.userData.head.rotation.y = Math.sin(S.lt * 4 + 1) * 0.25;
    st.crowd.userData.update(S.t, null);
    st.tick(S);
  },
  draw(st, g, S) { const k = S.lt - S.at(86); if (k > 0) revealText(g, 'A BAD OMEN', S.W / 2, 180, clamp(k / 0.5), { font: F.cond(700, 120), ls: 20, color: '#fff', shadow: 40, style: 'blur' }); },
});

// 87 — Channel → Cherbourg → Queenstown → open Atlantic
S3.push({
  seg: 87, name: 'route map', amb: { kind: 'ocean', vol: 0.5 }, trans: 'whip',
  fx: { bloom: 0.4, bloomThreshold: 0.6 },
  sfx: (S) => [{ t: 0, type: 'whoosh', vol: 0.25 }, { t: S.find(87, /Cherbourg/), type: 'pop', pitch: 500 }, { t: S.find(88, /Queenstown/), type: 'pop', pitch: 600 }, { t: S.find(88, /Atlantic/), type: 'riser', dur: 1.2, vol: 0.15 }],
  draw(st, g, S) {
    const { W, H, lt } = S;
    const z = easeInOut(clamp((lt - S.find(88, /open/)) / 2.0));
    const proj = mapProjector(W, H, { lon0: lerp(-16, -78, z), lon1: lerp(6, 10, z), lat0: lerp(46.5, 34, z), lat1: lerp(55.5, 62, z) });
    drawMap(g, W, H, proj);
    const c = S.find(87, /Cherbourg/), q = S.find(88, /Queenstown/), a = S.find(88, /Atlantic/);
    const p1 = PLACES.southampton, p2 = PLACES.cherbourg, p3 = PLACES.queenstown, p4 = [-50, 41.7];
    const pts = [p1, [-1.0, 50.2], p2, [-5.5, 49.5], [-8.0, 51.0], p3, [-20, 49.5], [-35, 45], p4].map(proj);
    const prog = lt < c ? 0.17 * clamp(lt / c) : lt < q ? 0.17 + 0.43 * clamp((lt - c) / (q - c)) : lt < a ? 0.6 + 0.1 * clamp((lt - q) / (a - q)) : 0.7 + 0.3 * clamp((lt - a) / 2.5);
    const head = route(g, pts, prog, { color: '#ffd23f', w: 6, dash: [14, 10] });
    mapPin(g, proj, p1, 'SOUTHAMPTON', 1, { color: '#ffd23f' });
    if (lt > c - 0.2) mapPin(g, proj, p2, 'CHERBOURG', clamp((lt - c) * 3), { color: '#ffd23f', dy: 30 });
    if (lt > q - 0.2) mapPin(g, proj, p3, 'QUEENSTOWN', clamp((lt - q) * 3), { color: '#ffd23f', align: 'right', dx: -16 });
    if (lt > a) { txt(g, 'NEW YORK →', proj(PLACES.newyork)[0] + 90, proj(PLACES.newyork)[1], { font: F.cond(600, 30), ls: 4, color: '#fff', alpha: clamp((lt - a) * 2), align: 'left' }); }
    g.save(); g.translate(head[0], head[1]); g.fillStyle = '#fff'; g.shadowColor = '#ffd23f'; g.shadowBlur = 20; g.beginPath(); g.arc(0, 0, 10, 0, 7); g.fill(); g.restore();
    txt(g, 'MAIDEN VOYAGE', 110, 110, { font: F.cond(700, 50), ls: 10, color: '#fff', align: 'left', shadow: 10 });
  },
});

// 89 — card
S3.push(card(89, '2 DAYS', 'BEFORE THE COLLISION'));

// 90 — the crossing is going perfectly
S3.push({
  seg: 90, name: 'calm crossing', amb: ['ocean', { kind: 'wind', vol: 0.3 }], trans: 'fade',
  fx: { bloom: 0.7, saturation: 1.22, contrast: 1.05 },
  sfx: (S) => [{ t: 0.4, type: 'horn', dur: 2, vol: 0.06, far: true }, { t: S.find(91, /luxury/), type: 'shimmer', vol: 0.05 }],
  build(E) {
    const st = oceanWorld({ sky: 'day', ocean: 'day', envMap: E.envMap, wake: true, sunDir: [0.5, 0.4, 0.7] });
    const by = st.ship.userData.boatDeckY;
    st.walkers = [];
    for (let i = 0; i < 10; i++) { const f = i % 2 === 0; const p = person(f ? { female: true, dress: ['#e8d8c0', '#c8d8e8', '#7a1f3d', '#f2efe6', '#2d5a3a'][i % 5], hat: 'bowler', hatColor: '#e8e0d0' } : { coat: ['#1a1d26', '#3a3a3a', '#d8cfb8'][i % 3], hat: ['top', 'bowler', 'flat'][i % 3] }); p.position.set(-40 + i * 6, by - 1.2, 11.5); p.rotation.y = Math.PI / 2; st.scene.add(p); st.walkers.push(p); }
    return st;
  },
  update(st, S) {
    st.ship.position.x = S.lt * 11; const x = st.ship.position.x;
    if (S.lt < S.at(91) + 1.2) track(st.camera, [[0, [x + 250, 60, 260], [x, 15, 0], 34], [S.at(91) + 1.2, [x + 200, 45, 270], [x, 15, 0], 34]], S.lt);
    else track(st.camera, [[S.at(91) + 1.2, [x - 6, 19.6, 13.5], [x - 30, 18.4, 10.5], 46], [S.dur, [x - 4, 19.6, 13.5], [x - 30, 18.4, 10.5], 44]], S.lt);
    st.walkers.forEach((p, i) => { p.position.x = -40 + i * 6 + ((S.lt * 1.1 + i * 2) % 12) - 6; pose.walk(p, S.t, 0.6, i); });
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, lt } = S;
    revealText(g, 'CALM SEAS', W / 2, 150, clamp(lt / 0.5), { font: F.cond(700, 84), ls: 16, color: '#fff', shadow: 30 });
    if (lt > 0.7) txt(g, 'perfect weather · perfect speed', W / 2, 230, { font: F.serif(40), color: '#fff', alpha: clamp(lt * 2 - 1.4), shadow: 20 });
  },
});

// 92 — dinner in the first-class saloon with a string ensemble
S3.push({
  seg: 92, name: 'dining saloon', amb: { kind: 'crowd', vol: 0.35 }, trans: 'whip',
  fx: { bloom: 0.85, bloomThreshold: 0.6, saturation: 1.18, tint: [1.06, 1.0, 0.92] },
  sfx: (S) => [{ t: 0, type: 'whoosh', vol: 0.15 }, { t: 0.2, type: 'melody', instr: 'violin', vol: 0.03, beat: 0.42, notes: [[76, 0, 2], [79, 2, 1], [84, 3, 3], [83, 6, 1], [81, 7, 1], [79, 8, 3], [76, 11, 1]] }, { t: 0.2, type: 'melody', instr: 'cello', vol: 0.025, beat: 0.42, notes: [[48, 0, 3], [55, 3, 3], [53, 6, 3], [55, 9, 3]] }],
  build: (E) => diningSaloon(E),
  update(st, S) { track(st.camera, [[0, [7, 2.4, 6], [-3, 1.0, 0], 44], [S.dur, [3, 2.0, 6.3], [-7, 1.1, -1.5], 42]], S.lt); st.animate(S); },
  draw(st, g, S) { txt(g, 'FIRST-CLASS DINING SALOON', 110, 120, { font: F.cond(600, 46), ls: 8, color: '#fff', align: 'left', alpha: clamp(S.lt * 2), shadow: 20 }); },
});

// 93 — the wireless room: Phillips & Bride swamped with messages
const MSG = ['HAPPY BIRTHDAY MOTHER — ARRIVING WEDNESDAY', 'BUY 500 SHARES U.S. STEEL', 'DINNER RESERVED AT THE WALDORF', 'SELL COPPER AT ANY PRICE', 'ALL WELL ON BOARD — LOVE', 'MEET ME AT THE PIER', 'CONFIRM HOTEL SUITE NEW YORK'];
S3.push({
  seg: 93, name: 'wireless room', amb: 'radio', trans: 'whip',
  fx: { bloom: 0.9, bloomThreshold: 0.55, saturation: 1.15 },
  sfx: (S) => [{ t: 0, type: 'whoosh', vol: 0.2 }, { t: 0.4, type: 'morse', code: '-.-. --.- -.. . -- --. -.--', vol: 0.06 }, { t: 3.5, type: 'morse', code: '... - --- -.-. -.- ...', vol: 0.06, freq: 680 }, { t: 7.5, type: 'morse', code: '.-- .- .-.. -.. --- .-. ..-.', vol: 0.06 }, { t: 12, type: 'morse', code: '.. -.-. . .-- .- .-. -.', vol: 0.07, freq: 800 }, { t: 16, type: 'morse', code: '-- ... --. ...', vol: 0.06 }, { t: S.at(98), type: 'paper', dur: 1.2, vol: 0.18 }, { t: S.at(98) + 1, type: 'drop', vol: 0.2 }],
  build: (E) => wirelessRoom(E),
  update(st, S) {
    const a94 = S.at(94), a95 = S.at(95), a97 = S.at(97);
    if (S.lt < a94) track(st.camera, [[0, [1.8, 1.8, 1.6], [-0.2, 1.1, -1.2], 50], [a94, [1.3, 1.7, 1.2], [0, 1.1, -1.3], 46]], S.lt);
    else if (S.lt < a95) track(st.camera, [[a94, [0.3, 1.3, -0.95], [1.4, 1.4, -1.7], 40], [a95, [0.1, 1.35, -0.9], [1.4, 1.5, -1.7], 36]], S.lt);
    else if (S.lt < a97) track(st.camera, [[a95, [-0.2, 2.2, 0.6], [-0.4, 0.8, -1.3], 50], [a97, [0.2, 2.0, 0.4], [-0.2, 0.8, -1.3], 46]], S.lt);
    else track(st.camera, [[a97, [-1.1, 1.3, -0.6], [-1.2, 0.85, -1.3], 44], [S.dur, [-1.0, 1.2, -0.75], [-1.2, 0.85, -1.3], 38]], S.lt);
    st.animate(S, { transmit: S.lt < S.at(98) ? 1 : 0.3, pile: clamp((S.lt - a95) / (S.dur - a95)) });
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    const a94 = S.at(94);
    if (lt < a94) txt(g, 'THE MARCONI WIRELESS ROOM', 110, 120, { font: F.cond(600, 44), ls: 8, color: '#fff', align: 'left', alpha: clamp(lt * 2), shadow: 20 });
    nameTag(g, 110, H - 330, 'JACK PHILLIPS', 'SENIOR WIRELESS OPERATOR · 25', clamp((lt - S.find(93, /Phillips/)) / 0.6) * (lt < S.find(93, /Harold/) ? 1 : 0));
    nameTag(g, 110, H - 330, 'HAROLD BRIDE', 'JUNIOR WIRELESS OPERATOR · 22', clamp((lt - S.find(93, /Harold/)) / 0.6) * (lt < S.at(95) ? 1 : 0));
    if (lt > a94 && lt < S.at(95)) callout(g, W - 700, 250, W - 860, 430, 'MARCONI SET', '≈ 5 kW · range up to 400 miles', clamp((lt - a94 - 0.5) / 0.8));
    // flying telegrams
    const s96 = S.at(96), s97 = S.at(97);
    if (lt > S.at(95) && lt < s97) {
      MSG.forEach((m, i) => {
        const k = clamp((lt - s96 + 0.6 - i * 0.35) / 1.4); if (k <= 0) return;
        const x = 200 + ((i * 397) % (W - 900)), y = 180 + ((i * 211) % 520) - easeOut(k) * 40;
        g.save(); g.globalAlpha = clamp(k * 4) * (1 - clamp((k - 0.85) * 6)); g.translate(x, y); g.rotate((i % 2 ? -1 : 1) * 0.04);
        g.fillStyle = '#f2ecdc'; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 20; g.fillRect(0, 0, 560, 90); g.shadowBlur = 0;
        txt(g, 'MARCONIGRAM', 18, 22, { font: F.cond(700, 18), align: 'left', ls: 3, color: '#8a1d24' });
        txt(g, m, 18, 58, { font: F.type(24), align: 'left', color: '#222' });
        g.restore();
      });
      const p = lt - s96; if (p > 0) txt(g, 'PASSENGER MESSAGES', W / 2, H - 260, { font: F.cond(700, 54), ls: 8, color: '#ffd23f', alpha: clamp(p * 2), shadow: 20 });
    }
    const pd = lt - s97;
    if (pd > 0 && lt < S.at(98)) { txt(g, 'A PAID PASSENGER SERVICE', W / 2, 170, { font: F.cond(700, 64), ls: 6, color: '#fff', alpha: clamp(pd * 3), shadow: 20 }); txt(g, 'not an essential navigation tool', W / 2, 245, { font: F.serif(40), color: '#ffb0a0', alpha: clamp(pd * 3 - 0.8), shadow: 10 }); }
    const nv = lt - S.at(98);
    if (nv > 0) { revealText(g, 'NAVIGATIONAL REPORTS PILE UP', W / 2, 170, clamp(nv / 0.7), { font: F.cond(700, 64), ls: 6, color: '#ff8a7a', shadow: 20 }); }
  },
});

// 99 — warnings: ice lies directly ahead
S3.push({
  seg: 99, name: 'ice map warnings', amb: { kind: 'radio', vol: 0.8 },
  fx: { bloom: 0.5, bloomThreshold: 0.5 },
  sfx: (S) => [{ t: 0.1, type: 'morse', code: '.. -.-. .', vol: 0.08, freq: 900 }, { t: 1.3, type: 'morse', code: '.. -.-. .', vol: 0.07, freq: 820 }, { t: S.at(100), type: 'hit', vol: 0.4 }, { t: S.at(101), type: 'whoosh', vol: 0.2, dur: 1.2 }, { t: S.find(101, /south/), type: 'drop', vol: 0.25 }],
  draw(st, g, S) {
    const { W, H, lt } = S;
    const proj = mapProjector(W, H, { lon0: -72, lon1: -24, lat0: 36, lat1: 62 });
    drawMap(g, W, H, proj, { sea1: '#0f2a46', sea2: '#04101c' });
    // normal ice limit vs this year
    const a101 = S.at(101);
    const lim = (lat) => [[-60, lat + 6], [-52, lat + 2], [-46, lat], [-38, lat + 1.5]].map(proj);
    if (lt > a101) {
      const k = clamp((lt - a101) / 0.8);
      g.save(); g.setLineDash([12, 10]); g.strokeStyle = `rgba(255,255,255,${0.6 * k})`; g.lineWidth = 3; g.beginPath(); lim(45).forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p))); g.stroke(); g.restore();
      const [lx, ly] = proj([-38, 46.5]); txt(g, 'USUAL ICE LIMIT', lx + 10, ly - 20, { font: F.cond(500, 26), ls: 4, color: '#fff', alpha: k, align: 'left' });
      const s = clamp((lt - S.find(101, /south/)) / 1.2);
      const [ax, ay] = proj([-44, 58]), [bx, by] = proj([-48, 44]);
      g.save(); g.strokeStyle = `rgba(159,227,255,${s})`; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(ax, ay); g.lineTo(lerp(ax, bx, s), lerp(ay, by, s)); g.stroke(); g.restore();
      txt(g, 'WARM WINTER → ICE DRIFTS SOUTH', W / 2, H - 120, { font: F.cond(600, 44), ls: 6, color: '#9fe3ff', alpha: s, shadow: 10 });
    }
    // ice field
    const r = rng(7); const ik = clamp((lt - S.at(100) + 0.3) / 1.0);
    for (let i = 0; i < 60; i++) { const lon = -51 + r() * 4.5, lat = 41.3 + r() * 2.0; const [x, y] = proj([lon, lat]); g.save(); g.globalAlpha = ik * (0.5 + r() * 0.5); icebergIcon(g, x, y, 0.08 + r() * 0.08, { under: false }); g.restore(); }
    if (ik > 0) { const [x, y] = proj([-49, 43.6]); txt(g, 'ICE FIELD', x, y - 20, { font: F.cond(700, 40), ls: 8, color: '#eaf8ff', alpha: ik, shadow: 10 }); }
    // titanic route & position
    const pts = [[-30, 44.5], [-40, 43], [-47, 42], [-49.95, 41.73], [-60, 41], [-74, 40.7]].map(proj);
    route(g, pts, 1, { color: 'rgba(255,210,63,0.35)', w: 4, dash: [10, 10] });
    const prog = clamp(lt / S.dur) * 0.33;
    const head = route(g, pts, prog, { color: '#ffd23f', w: 6 });
    g.save(); g.translate(...head); g.fillStyle = '#fff'; g.shadowColor = '#ffd23f'; g.shadowBlur = 25; g.beginPath(); g.arc(0, 0, 12, 0, 7); g.fill(); g.restore();
    txt(g, 'TITANIC', head[0], head[1] + 40, { font: F.cond(600, 28), ls: 4, color: '#ffd23f' });
    // warning ships
    [[-56, 44.5], [-45, 45.8], [-52, 40.6], [-42, 43.8]].forEach((p, i) => {
      const k = clamp((lt - 0.2 - i * 0.8) / 0.4); if (k <= 0) return;
      const [x, y] = proj(p); g.save(); g.globalAlpha = k; shipSilhouette(g, x, y, 60, '#ff8a7a', { funnels: 1 }); g.restore();
      radioWaves(g, x, y - 10, lt + i * 0.3, '#ff8a7a', { both: true, r: 90, alpha: k });
    });
    txt(g, 'ICE WARNINGS FROM OTHER SHIPS', 110, 110, { font: F.cond(700, 46), ls: 6, color: '#fff', align: 'left', alpha: clamp(lt * 2), shadow: 10 });
  },
});

// 102 — card
S3.push(card(102, '12 HOURS', 'BEFORE THE COLLISION'));

// 103 — Sunday service; the lifeboat drill is cancelled
S3.push({
  seg: 103, name: 'service drill cancelled', amb: 'room', trans: 'fade',
  fx: { bloom: 0.7, bloomThreshold: 0.6, saturation: 1.12, tint: [1.04, 1.0, 0.95] },
  sfx: (S) => [{ t: 0.3, type: 'melody', instr: 'cello', vol: 0.03, beat: 0.6, notes: [[52, 0, 2], [55, 2, 2], [57, 4, 2], [52, 6, 3]] }, { t: S.find(104, /cancels/), type: 'stamp', vol: 0.6 }, { t: S.at(105), type: 'pop', pitch: 300 }],
  build(E) {
    const st = diningSaloon(E, { standing: true, band: false });
    const cap = person({ coat: '#141a2c', hat: 'officer', beard: true, hair: '#d8d8d8', beardColor: '#eeeeee' }); cap.position.set(-10, 0, 0); cap.rotation.y = Math.PI / 2; st.scene.add(cap); st.cap = cap;
    return st;
  },
  update(st, S) {
    track(st.camera, [[0, [4, 2.2, 0.5], [-10, 1.6, 0], 40], [S.dur, [-2, 2.0, 0.4], [-10, 1.6, 0], 34]], S.lt);
    st.animate(S); st.cap.userData.armR.rotation.x = -0.6 + Math.sin(S.t * 1.5) * 0.1;
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    if (lt < S.at(104)) { txt(g, 'SUNDAY, 14 APRIL 1912', 110, 120, { font: F.cond(600, 44), ls: 8, color: '#fff', align: 'left', alpha: clamp(lt * 2), shadow: 20 }); txt(g, 'morning service, first-class saloon', 112, 175, { font: F.serif(34), color: '#ffe2a0', align: 'left', alpha: clamp(lt * 2 - 0.5), shadow: 10 }); }
    const a = lt - S.at(104);
    if (a > 0) {
      const x = W / 2, y = H / 2 - 40;
      g.save(); g.globalAlpha = clamp(a * 3); g.translate(x, y); g.rotate(-0.02);
      g.fillStyle = '#f2ecdc'; g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 40; g.fillRect(-380, -160, 760, 320); g.shadowBlur = 0;
      txt(g, 'SCHEDULE · 14 APRIL', 0, -110, { font: F.cond(600, 30), ls: 8, color: '#8a1d24' });
      txt(g, '☐  DIVINE SERVICE', -300, -40, { font: F.cond(600, 44), align: 'left', color: '#222' });
      txt(g, '☐  LIFEBOAT DRILL', -300, 50, { font: F.cond(600, 44), align: 'left', color: '#222' });
      check(g, -280, -40, 34, PAL.green, clamp(a / 0.4));
      const c = clamp((lt - S.find(104, /cancels/)) / 0.25);
      if (c > 0) { strike(g, -310, 50, 120, c, PAL.red, 8); g.save(); g.rotate(-0.18); g.globalAlpha = c; g.strokeStyle = PAL.red; g.lineWidth = 7; roundRect(g, 60, 40, 300, 90, 8); g.stroke(); txt(g, 'CANCELLED', 210, 86, { font: F.cond(700, 52), ls: 4, color: PAL.red }); g.restore(); }
      g.restore();
    }
    const w = lt - S.at(105);
    if (w > 0) txt(g, 'reasons still unclear', W / 2, H - 250, { font: F.serif(46), color: '#fff', alpha: clamp(w * 2), shadow: 20 });
  },
});

// 106 — temperature falls; at least six ice warnings
S3.push(dark({
  seg: 106, name: 'six warnings', c1: '#0c2238', c2: '#02060c',
  sfx: (S) => [{ t: 0.1, type: 'drop', vol: 0.2, f0: 300, f1: 80 }, ...[...Array(6)].map((_, i) => ({ t: S.find(107, /six/) + i * 0.35, type: 'stamp', vol: 0.3 })), { t: 1.2, type: 'morse', code: '.. -.-. . .. -.-. .', vol: 0.06, freq: 900 }],
  paint(st, g, S) {
    const { W, H, lt } = S;
    const temp = lerp(0.7, 0.2, easeInOut(clamp(lt / 3)));
    thermometer(g, 230, H - 220, 560, temp, { color: '#3aa0ff' });
    txt(g, `${Math.round(lerp(43, 33, easeInOut(clamp(lt / 3))))}°F`, 330, H - 520, { font: F.cond(700, 64), align: 'left', color: '#9fe3ff', alpha: clamp(lt * 3) });
    txt(g, 'TEMPERATURE FALLING', 330, H - 450, { font: F.cond(500, 26), ls: 6, align: 'left', color: '#fff', alpha: clamp(lt * 3) });
    const ships = ['CARONIA', 'NOORDAM', 'BALTIC', 'AMERIKA', 'CALIFORNIAN', 'MESABA'];
    const s0 = S.find(107, /six/);
    ships.forEach((n, i) => {
      const k = clamp((lt - s0 - i * 0.35) / 0.3); if (k <= 0) return;
      const x = 820 + (i % 3) * 360, y = 330 + Math.floor(i / 3) * 300;
      g.save(); g.globalAlpha = k; g.translate(x, y + (1 - easeOutBack(k)) * -60); g.rotate(((i * 37) % 7 - 3) * 0.015);
      g.fillStyle = '#f2ecdc'; g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 30; g.fillRect(-160, -100, 320, 200); g.shadowBlur = 0;
      txt(g, `FROM: ${n}`, -140, -70, { font: F.cond(600, 24), align: 'left', ls: 2, color: '#8a1d24' });
      txt(g, 'ICE', 0, 0, { font: F.cond(700, 90), color: '#141414' });
      txt(g, 'BERGS · GROWLERS · FIELD ICE', 0, 66, { font: F.cond(400, 18), ls: 2, color: '#444' });
      g.restore();
    });
    if (lt > s0) { txt(g, 'AT LEAST', 1180, 140, { font: F.cond(400, 30), ls: 12, color: '#9fe3ff', alpha: clamp((lt - s0) * 3) }); txt(g, `${Math.min(6, Math.floor((lt - s0) / 0.35) + 1)} ICE WARNINGS`, 1180, 200, { font: F.cond(700, 64), ls: 6, color: '#fff', alpha: clamp((lt - s0) * 3) }); }
  },
}));

// 108 — the bridge: course south, speed unchanged, 22.5 knots
S3.push({
  seg: 108, name: 'bridge speed', amb: ['engine', { kind: 'wind', vol: 0.3 }], trans: 'whip',
  fx: { bloom: 0.7, bloomThreshold: 0.6, saturation: 1.1, tint: [1.0, 0.98, 1.04] },
  sfx: (S) => [{ t: 0, type: 'whoosh', vol: 0.2 }, { t: S.find(109, /south/), type: 'wheel', n: 10 }, { t: S.find(109, /not/), type: 'hit', vol: 0.4 }, { t: S.at(110), type: 'riser', dur: 2, vol: 0.15 }],
  build(E) {
    const st = bridgeSet(E, { night: false });
    const smith = person({ coat: '#141a2c', hat: 'officer', beard: true, hair: '#d8d8d8', beardColor: '#eeeeee' }); smith.position.set(-1.2, 0, -1.4); smith.rotation.y = Math.PI * 0.95; st.scene.add(smith);
    const off = person({ coat: '#141a2c', hat: 'officer', mustache: true }); off.position.set(0, 0, 0.75); off.rotation.y = Math.PI; st.scene.add(off);
    Object.assign(st, { smith, off });
    return st;
  },
  update(st, S) {
    if (S.lt < S.at(110)) track(st.camera, [[0, [2.8, 1.8, 2.2], [-1, 1.4, -1.5], 46], [S.at(110), [2.2, 1.7, 1.8], [-1, 1.5, -1.6], 42]], S.lt);
    else track(st.camera, [[S.at(110), [-2.2, 1.6, 0.4], [-2.2, 1.2, -0.6], 36], [S.dur, [-2.2, 1.5, 0.1], [-2.2, 1.2, -0.6], 30]], S.lt);
    st.wheel.rotation.z = Math.sin(S.t * 0.5) * 0.1 + (S.lt > S.find(109, /south/) ? -0.5 * clamp(S.lt - S.find(109, /south/)) : 0);
    pose.idle(st.smith, S.t); pose.idle(st.off, S.t, 2); st.off.userData.armL.rotation.x = -0.9; st.off.userData.armR.rotation.x = -0.9;
    st.tele[0].lever.rotation.z = -1.2;
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    if (lt < S.at(109)) revealText(g, 'SMITH KNOWS ABOUT THE DANGER', W / 2, 160, clamp(lt / 0.6), { font: F.cond(700, 64), ls: 6, color: '#fff', shadow: 30 });
    const c = lt - S.find(109, /course/);
    if (c > 0 && lt < S.at(110)) { txt(g, 'COURSE: SLIGHTLY FURTHER SOUTH', W / 2, 160, { font: F.cond(600, 50), ls: 4, color: PAL.green, alpha: clamp(c * 3), shadow: 20 }); const n = lt - S.find(109, /not/); if (n > 0) { txt(g, 'SPEED: NOT REDUCED', W / 2, 240, { font: F.cond(700, 64), ls: 6, color: PAL.red2, alpha: clamp(n * 3), shadow: 20 }); } }
    const s = lt - S.at(110);
    if (s > 0) {
      const cx = W - 420, cy = 520, R = 250;
      const v = 22.5 * easeOut(clamp(s / 1.5));
      g.save(); g.fillStyle = 'rgba(5,8,14,0.82)'; g.beginPath(); g.arc(cx, cy, R + 40, 0, 7); g.fill();
      g.lineCap = 'round'; g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 26; g.beginPath(); g.arc(cx, cy, R, Math.PI * 0.75, Math.PI * 2.25); g.stroke();
      const frac = v / 24; g.strokeStyle = frac > 0.9 ? PAL.red2 : '#ffd23f'; g.beginPath(); g.arc(cx, cy, R, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * frac)); g.stroke();
      g.strokeStyle = PAL.red2; g.lineWidth = 6; g.beginPath(); const ma = Math.PI * (0.75 + 1.5 * (23 / 24)); g.moveTo(cx + Math.cos(ma) * (R - 30), cy + Math.sin(ma) * (R - 30)); g.lineTo(cx + Math.cos(ma) * (R + 30), cy + Math.sin(ma) * (R + 30)); g.stroke();
      txt(g, 'MAX', cx + Math.cos(ma) * (R + 70), cy + Math.sin(ma) * (R + 70), { font: F.cond(600, 26), color: PAL.red2 });
      txt(g, v.toFixed(1), cx, cy - 10, { font: F.cond(700, 130), color: '#fff' });
      txt(g, 'KNOTS', cx, cy + 80, { font: F.cond(500, 34), ls: 12, color: '#ffd23f' });
      txt(g, '≈ 26 MPH', cx, cy + 135, { font: F.cond(500, 30), ls: 6, color: '#fff', alpha: clamp((lt - S.find(110, /26/)) * 3) });
      g.restore();
    }
  },
});

// 111 — Ismay wants to impress the American press
S3.push({
  seg: 111, name: 'ismay press', trans: 'whip',
  fx: { vignette: 0.6, grain: 0.06 },
  sfx: (S) => [{ t: 0, type: 'whoosh', vol: 0.25, dur: 0.6 }, { t: 0.65, type: 'stamp', vol: 0.45 }, { t: S.find(111, /ahead/), type: 'pop', pitch: 500 }],
  draw(st, g, S) {
    const { W, H, lt } = S;
    const gr = g.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.7); gr.addColorStop(0, '#2a3a4a'); gr.addColorStop(1, '#05080c'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const k = easeOut(clamp(lt / 0.65));
    newspaper(g, W / 2 + 220, H / 2 + 20, 560, ['TITANIC ARRIVES', 'AHEAD OF SCHEDULE!'], { rot: (1 - k) * -10 - 0.05, scale: 0.15 + 0.85 * k, masthead: 'THE NEW YORK DISPATCH', date: 'NEW YORK, APRIL 16, 1912', sub: '— what Ismay hoped to read' });
    nameTag(g, 110, 200, 'J. BRUCE ISMAY', 'WANTS A RECORD-BREAKING ARRIVAL', clamp((lt - 0.4) / 0.7));
    const a = lt - S.find(111, /ahead/);
    if (a > 0) { g.save(); g.globalAlpha = clamp(a * 3); g.fillStyle = PAL.red2; roundRect(g, 110, 400, 420, 80, 10); g.fill(); txt(g, 'EARLY = PRESTIGE', 320, 440, { font: F.cond(700, 44), ls: 4, color: '#fff' }); g.restore(); }
  },
});

// 112 — confidence borders on complacency
S3.push({
  seg: 112, name: 'complacency bridge night', amb: ['night', 'engine'],
  fx: { bloom: 0.8, bloomThreshold: 0.55, saturation: 1.0, tint: [0.92, 0.98, 1.1] },
  sfx: (S) => [{ t: S.find(112, /complacency/), type: 'drop', vol: 0.25 }, { t: S.find(113, /miles/), type: 'whoosh', vol: 0.1 }],
  build(E) {
    const st = bridgeSet(E, { night: true });
    for (const [x, ry] of [[-1.8, Math.PI], [1.4, Math.PI * 1.05]]) { const o = person({ coat: '#141a2c', hat: 'officer', mustache: x < 0 }); o.position.set(x, 0, -1.6); o.rotation.y = ry; st.scene.add(o); }
    return st;
  },
  update(st, S) { track(st.camera, [[0, [0.3, 1.7, 2.2], [0, 1.8, -2.5], 48], [S.dur, [0.1, 1.7, 0.8], [0, 1.9, -2.5], 42]], S.lt); },
  draw(st, g, S) {
    const { W, H, lt } = S;
    revealText(g, 'confidence', W / 2, 150, clamp(lt / 0.6), { font: F.serif(64), color: '#fff', shadow: 20, style: 'blur' });
    const c = lt - S.find(112, /complacency/);
    if (c > 0) revealText(g, 'COMPLACENCY', W / 2, 250, clamp(c / 0.5), { font: F.cond(700, 110), ls: 16, color: '#ff8a7a', shadow: 30, style: 'scale' });
    const m = lt - S.at(113);
    if (m > 0) { g.save(); g.globalAlpha = clamp(m * 2) * 0.9; g.fillStyle = 'rgba(5,10,20,0.75)'; roundRect(g, W / 2 - 520, H - 360, 1040, 110, 14); g.fill(); g.restore(); txt(g, '“On a clear night we will see an iceberg miles away.”', W / 2, H - 305, { font: F.serif(40), color: '#e8f0ff', alpha: clamp(m * 2) }); }
  },
});

// 114 — card
S3.push(card(114, '1 HOUR', 'BEFORE THE COLLISION'));

// 115 — the ocean is unnervingly still
S3.push({
  seg: 115, name: 'glass sea', amb: { kind: 'night', vol: 0.5 }, trans: 'fade',
  fx: { bloom: 0.9, bloomThreshold: 0.5, saturation: 1.05, tint: [0.9, 0.98, 1.12], vignette: 0.7 },
  sfx: (S) => [{ t: S.at(116), type: 'tick', vol: 0.2 }, { t: S.at(117), type: 'tick', vol: 0.2 }, { t: S.at(119), type: 'shimmer', vol: 0.04, notes: [88, 91, 95, 100] }, { t: S.at(120), type: 'drop', vol: 0.15, f0: 400, f1: 120 }],
  build: (E) => oceanWorld({ ...GLASS, envMap: E.envMap, lights: 1, wake: true, fogNear: 600, fogFar: 4000 }),
  update(st, S) {
    st.ship.position.x = S.lt * 11; const x = st.ship.position.x;
    st.ocean.userData.uniforms.lights.value = 1; st.ocean.userData.uniforms.lightPos.value.set(x, 0, 0);
    const a119 = S.at(119);
    if (S.lt < a119) track(st.camera, [[0, [x + 200, 3, 160], [x, 15, 0], 34], [a119, [x + 120, 2, 170], [x - 10, 15, 0], 32]], S.lt);
    else track(st.camera, [[a119, [x - 60, 5, 120], [x + 200, 120, -300], 50], [S.dur, [x - 60, 5, 120], [x + 200, 160, -300], 50]], S.lt);
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    [[116, 'NO WIND'], [117, 'NO SWELL'], [118, 'SURFACE LIKE GLASS']].forEach(([seg, label], i) => { const k = lt - S.at(seg); if (k > 0 && lt < S.at(119)) revealText(g, label, W / 2, 180 + i * 90, clamp(k / 0.4), { font: F.cond(600, 60), ls: 14, color: '#dfe8ff', shadow: 20 }); });
    const m = lt - S.at(119);
    if (m > 0 && lt < S.at(120)) revealText(g, 'NO MOON', W / 2, H - 300, clamp(m / 0.5), { font: F.cond(700, 80), ls: 20, color: '#fff', shadow: 30 });
    const f = lt - S.at(120);
    if (f > 0) { thermometer(g, W - 200, H - 200, 420, lerp(0.3, 0.12, clamp(f / 2)), { color: '#3aa0ff' }); txt(g, 'BELOW FREEZING', W - 300, H - 660, { font: F.cond(700, 44), ls: 6, color: '#9fe3ff', alpha: clamp(f * 3), align: 'right' }); }
  },
});

// 121 — the calm creates a deadly problem
S3.push(dark({
  seg: 121, name: 'no surf comparison', c1: '#0a1830', c2: '#01040a',
  sfx: (S) => [{ t: 0.1, type: 'hit', vol: 0.35 }, { t: S.at(122), type: 'splash', vol: 0.15 }, { t: S.find(122, /no/) + 0.2, type: 'drop', vol: 0.25 }],
  paint(st, g, S) {
    const { W, H, lt } = S;
    revealText(g, 'A DEADLY PROBLEM', W / 2, 130, clamp(lt / 0.6), { font: F.cond(700, 78), ls: 8, color: '#fff' });
    const panels = [['NORMAL SEA', true], ['THAT NIGHT', false]];
    panels.forEach(([label, surf], i) => {
      const k = easeOut(clamp((lt - S.at(122) + 0.5 - i * 0.5) / 0.6)); if (k <= 0) return;
      const x = W / 2 - 440 + i * 880, y = H / 2 + 80;
      g.save(); g.globalAlpha = k; g.beginPath(); g.roundRect(x - 400, y - 270, 800, 540, 20); g.clip();
      g.fillStyle = '#02050c'; g.fillRect(x - 400, y - 270, 800, 540);
      const r = rng(i + 3); for (let s = 0; s < 120; s++) { g.fillStyle = `rgba(255,255,255,${r() * 0.8})`; g.fillRect(x - 400 + r() * 800, y - 270 + r() * 300, 2, 2); }
      g.fillStyle = '#030a14'; g.fillRect(x - 400, y + 40, 800, 240);
      icebergIcon(g, x, y + 40, 1.4, { top: surf ? '#cfe8f8' : '#0b1626', under: false });
      if (surf) { for (let w = 0; w < 26; w++) { const wx = x - 150 + w * 12; g.fillStyle = `rgba(255,255,255,${0.6 + 0.4 * Math.sin(lt * 6 + w)})`; g.beginPath(); g.ellipse(wx, y + 40 + Math.sin(lt * 5 + w) * 4, 14, 6, 0, 0, 7); g.fill(); } }
      g.restore();
      g.save(); g.globalAlpha = k; g.strokeStyle = surf ? 'rgba(255,255,255,0.4)' : PAL.red2; g.lineWidth = 3; g.beginPath(); g.roundRect(x - 400, y - 270, 800, 540, 20); g.stroke(); g.restore();
      txt(g, label, x, y - 310, { font: F.cond(600, 40), ls: 10, color: surf ? '#fff' : PAL.red2, alpha: k });
      txt(g, surf ? 'WHITE SURF = VISIBLE' : 'NO SURF = INVISIBLE', x, y + 320, { font: F.cond(700, 44), ls: 4, color: surf ? '#9fe3ff' : PAL.red2, alpha: k });
      if (surf) check(g, x + 330, y - 220, 44, PAL.green, k); else cross(g, x + 330, y - 220, 50, PAL.red2, k);
    });
  },
}));

// 123 — 10:55 pm: SS Californian stops for the night, surrounded by ice
S3.push({
  seg: 123, name: 'californian stopped', amb: { kind: 'night', vol: 0.6 }, trans: 'whip',
  fx: { bloom: 0.9, bloomThreshold: 0.5, saturation: 1.05, tint: [0.92, 0.98, 1.1] },
  sfx: (S) => [{ t: 0, type: 'whoosh', vol: 0.2 }, { t: 0.3, type: 'ticks', n: 4, interval: 0.5, vol: 0.25 }, { t: S.at(124) + 0.5, type: 'morse', code: '.-- . .- .-. . ... - --- .--. .--. . -..', vol: 0.08, freq: 760 }],
  build(E) {
    const st = oceanWorld({ ...GLASS, envMap: E.envMap, spec: CALIFORNIAN, lights: 0.8, smoke: false, fogNear: 400, fogFar: 3000 });
    const r = rng(123); st.ice = [];
    for (let i = 0; i < 70; i++) { const b = makeIceberg({ r: 2 + r() * 5, seed: i + 30, detail: 2, height: 0.25, depth: 0.6, spiky: 0.2, ei: 0.25 }); const a = r() * Math.PI * 2, d = 90 + r() * 600; b.position.set(Math.cos(a) * d, -0.5, Math.sin(a) * d); b.rotation.y = r() * 6; st.scene.add(b); }
    for (let i = 0; i < 4; i++) { const b = makeIceberg({ r: 20 + r() * 20, seed: i + 300, ei: 0.2 }); b.position.set(-300 + i * 220, -4, -400 - r() * 300); st.scene.add(b); }
    return st;
  },
  update(st, S) {
    st.ocean.userData.uniforms.lights.value = 0.5; st.ocean.userData.uniforms.lightPos.value.set(0, 0, 0); st.ocean.userData.uniforms.lightLen.value = 120;
    track(st.camera, [[0, [230, 25, 200], [0, 8, 0], 36], [S.dur, [170, 18, 180], [0, 8, 0], 34]], S.lt);
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    g.save(); g.globalAlpha = clamp(lt * 3); clockIcon(g, W - 210, 210, 100, 10 + 55 / 60, { face: '#0b1626', rim: '#dfe8ff', hand: '#dfe8ff' }); g.restore();
    txt(g, '10:55 PM', W - 210, 350, { font: F.cond(700, 44), ls: 6, color: '#fff', alpha: clamp(lt * 3), shadow: 10 });
    nameTag(g, 110, H - 330, 'SS CALIFORNIAN', 'STOPPED FOR THE NIGHT · ICE ALL AROUND', clamp((lt - 0.6) / 0.7) * (lt < S.at(124) ? 1 : 0));
    nameTag(g, 110, H - 330, 'CYRIL EVANS', 'WIRELESS OPERATOR · CALIFORNIAN', clamp((lt - S.find(124, /Cyril/)) / 0.6));
    const w = lt - S.at(125);
    if (w > 0) { g.save(); g.globalAlpha = clamp(w * 3); g.fillStyle = '#f2ecdc'; g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 30; g.fillRect(W / 2 - 360, 120, 720, 130); g.shadowBlur = 0; txt(g, '“WE ARE STOPPED AND SURROUNDED BY ICE.”', W / 2, 185, { font: F.type(32), color: '#141414' }); g.restore(); }
  },
});

// 126 — the signal blasts into Phillips' headphones
S3.push({
  seg: 126, name: 'signal blasts', amb: 'radio',
  fx: { bloom: 1.0, bloomThreshold: 0.5, saturation: 1.1 },
  sfx: (S) => [{ t: 0.05, type: 'morse', code: '-- -- -- -- ', unit: 0.05, vol: 0.2, freq: 1100 }, { t: 0.05, type: 'hit', vol: 0.4, pitch: 300 }, { t: S.find(126, /Cape/), type: 'morse', code: '-.-. .- .--. . .-. .- -.-. .', vol: 0.06 }],
  build: (E) => wirelessRoom(E),
  update(st, S) { track(st.camera, [[0, [-0.55, 1.45, 0.4], [-0.6, 1.4, -0.6], 34], [S.dur, [-0.5, 1.45, 0.1], [-0.6, 1.42, -0.6], 26]], S.lt, { shake: S.lt < 1 ? 0.015 : 0.003 }); st.animate(S, { transmit: 1, pile: 0.9, wince: S.lt < 1.5 }); },
  draw(st, g, S) {
    const { W, H, lt } = S;
    radioWaves(g, W / 2 - 120, H / 2 - 120, lt * 2, '#ff6a5a', { both: true, r: 600, n: 6, lw: 8, a0: -0.9, a1: 0.9, alpha: 1 - clamp(lt / 2.5) });
    txt(g, 'LOUD, NEARBY SIGNAL', W / 2, 150, { font: F.cond(700, 64), ls: 8, color: '#ff8a7a', alpha: clamp(lt * 3) * (1 - clamp(lt - 3)), shadow: 20 });
    const c = lt - S.find(126, /Cape/);
    if (c > 0) { txt(g, 'BUSY: PASSENGER MESSAGES → CAPE RACE', W / 2, H - 280, { font: F.cond(600, 44), ls: 4, color: '#fff', alpha: clamp(c * 3), shadow: 20 }); }
  },
});

// 127 — "Shut up! Shut up! I'm working!"
S3.push({
  seg: 127, name: 'shut up', amb: { kind: 'radio', vol: 1.2 },
  fx: { bloom: 0.5, bloomThreshold: 0.4, aberration: 0.004 },
  sfx: (S) => [{ t: S.at(128), type: 'morse', code: '... ..- - ..-', unit: 0.045, vol: 0.12, freq: 820 }, { t: S.at(128), type: 'stamp', vol: 0.5 }, { t: S.at(129), type: 'stamp', vol: 0.55 }, { t: S.at(130), type: 'boom', vol: 0.5 }, { t: S.at(129), type: 'morse', code: '... ..- - ..-', unit: 0.045, vol: 0.12, freq: 820 }],
  draw(st, g, S) {
    const { W, H, lt } = S;
    g.fillStyle = '#060304'; g.fillRect(0, 0, W, H);
    const a128 = S.at(128), a129 = S.at(129), a130 = S.at(130);
    if (lt < a128) { revealText(g, 'exhausted and irritated, Phillips taps back:', W / 2, H / 2, clamp(lt / 0.8), { font: F.serif(52), color: '#c8c0b8', style: 'blur' }); return; }
    const sh = (t0) => (lt - t0 < 0.25 ? (1 - (lt - t0) / 0.25) * 18 : 0);
    const shake = Math.max(sh(a128), sh(a129), sh(a130));
    g.save(); g.translate(Math.sin(lt * 90) * shake, Math.cos(lt * 70) * shake);
    const lines = [[a128, 'SHUT UP!', '#fff'], [a129, 'SHUT UP!', '#fff'], [a130, 'I’M WORKING!', PAL.red2]];
    lines.forEach(([t0, text, col], i) => { const k = lt - t0; if (k < 0) return; const sc = 1 + 0.6 * (1 - easeOut(clamp(k / 0.18))); g.save(); g.translate(W / 2, 270 + i * 230); g.scale(sc, sc); txt(g, text, 0, 0, { font: F.cond(700, 200), ls: 12, color: col, shadow: 30, shadowColor: col === '#fff' ? 'rgba(255,255,255,0.3)' : 'rgba(230,57,70,0.5)' }); g.restore(); });
    g.restore();
    const code = '...  ..-  -  ..-  .--.';
    txt(g, code.slice(0, Math.floor(clamp((lt - a128) / 1.5) * code.length)), W / 2, H - 70, { font: F.cond(700, 40), ls: 10, color: '#ffd23f' });
  },
});

// 131 — Evans switches off and goes to bed
S3.push({
  seg: 131, name: 'evans switches off', amb: { kind: 'radio', vol: 0.6 },
  fx: { bloom: 0.8, bloomThreshold: 0.5, tint: [0.95, 0.98, 1.08] },
  sfx: (S) => [{ t: S.find(131, /switches/), type: 'clank', vol: 0.25, pitch: 1.5 }, { t: S.find(131, /switches/) + 0.05, type: 'drop', vol: 0.2, f0: 800, f1: 60, dur: 0.6 }, { t: S.at(132) + 0.3, type: 'boom', vol: 0.4 }],
  build: (E) => wirelessRoom(E, { ops: 1, lamp: 4 }),
  update(st, S) {
    const off = S.find(131, /switches/);
    const dark = clamp((S.lt - off) / 0.15);
    st.lampL.intensity = 4 * (1 - dark) + 0.2; st.lg.material.opacity = 0.6 * (1 - dark);
    st.animate(S, { transmit: S.lt < off ? 0.6 : 0, pile: 0.1 });
    if (S.lt > off + 0.6) { const p = st.ops[0]; p.position.z = -0.55 + (S.lt - off - 0.6) * 0.3; }
    if (S.lt < S.at(132)) track(st.camera, [[0, [0.6, 1.5, 1.4], [-0.5, 1.0, -1.2], 44], [S.at(132), [0.4, 1.5, 1.2], [-0.5, 1.0, -1.2], 40]], S.lt);
    else track(st.camera, [[S.at(132), [0.4, 1.5, 1.2], [-0.5, 1.0, -1.2], 40], [S.dur, [0.6, 1.6, 2.2], [-0.5, 1.0, -1.2], 44]], S.lt);
    S.fx.exposure = 1 - 0.5 * dark;
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    const k = lt - S.at(132);
    if (k > 0) { g.fillStyle = `rgba(0,0,0,${0.55 * clamp(k)})`; g.fillRect(0, 0, W, H); revealText(g, 'THE ONE SHIP THAT COULD HELP', W / 2, H / 2 - 50, clamp(k / 0.7), { font: F.cond(700, 72), ls: 6, color: '#fff', shadow: 20 }); revealText(g, 'IS NO LONGER LISTENING', W / 2, H / 2 + 50, clamp((k - 1.2) / 0.7), { font: F.cond(700, 72), ls: 6, color: PAL.red2, shadow: 20 }); }
  },
});

// 133 — card
S3.push(card(133, '1 MINUTE', 'BEFORE THE COLLISION', { boomVol: 0.9 }));

// 134 — the crow's nest: Fleet and Lee, no binoculars
S3.push({
  seg: 134, name: 'crows nest', amb: [{ kind: 'wind', vol: 1.0 }, { kind: 'night', vol: 0.4 }], trans: 'fade',
  fx: { bloom: 0.8, bloomThreshold: 0.5, saturation: 0.95, tint: [0.9, 0.98, 1.12], vignette: 0.75 },
  sfx: (S) => [{ t: S.find(135, /binoculars/), type: 'stamp', vol: 0.5 }, { t: 1, type: 'heartbeat', n: 6, bpm: 60, vol: 0.25 }],
  build: (E) => crowsNest(E),
  update(st, S) {
    const a135 = S.at(135);
    if (S.lt < a135) track(st.camera, [[0, [3.5, 3.8, 5.5], [0, 1.4, 0], 40], [a135, [2.2, 2.4, 3.0], [0, 1.5, 0], 38]], S.lt);
    else track(st.camera, [[a135, [0.05, 1.75, -1.4], [0, 1.65, 0.3], 40], [S.dur, [0.05, 1.72, -1.15], [0, 1.65, 0.3], 34]], S.lt);
    pose.shiver(st.fleet, S.t); pose.shiver(st.lee, S.t + 1);
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    nameTag(g, 110, H - 330, 'FREDERICK FLEET & REGINALD LEE', 'LOOKOUTS · CROW’S NEST', clamp((lt - S.find(134, /Frederick/)) / 0.6) * (lt < S.at(135) ? 1 : 0));
    const b = lt - S.find(135, /binoculars/);
    if (b > 0) {
      g.save(); g.translate(W / 2, 230); g.globalAlpha = clamp(b * 3); g.fillStyle = 'rgba(5,8,14,0.8)'; roundRect(g, -330, -90, 660, 180, 16); g.fill();
      g.fillStyle = '#dfe8ff'; for (const sx of [-1, 1]) { g.beginPath(); g.roundRect(sx * 55 - 210 - 35, -45, 70, 90, 20); g.fill(); } g.fillRect(-235, -10, 50, 20);
      g.restore();
      cross(g, W / 2 - 210, 230, 130, PAL.red2, clamp(b / 0.3));
      txt(g, 'NO BINOCULARS', W / 2 + 80, 230, { font: F.cond(700, 64), ls: 6, color: '#fff', alpha: clamp(b * 3) });
    }
    const u = lt - S.at(136);
    if (u > 0) txt(g, 'only their unaided eyes', W / 2, H - 260, { font: F.serif(44), color: '#dfe8ff', alpha: clamp(u * 2), shadow: 20 });
  },
});

// 137 — a black shape blotting out the stars
S3.push({
  seg: 137, name: 'black shape ahead', amb: [{ kind: 'wind', vol: 0.8 }, { kind: 'dark', vol: 1 }],
  fx: { bloom: 0.9, bloomThreshold: 0.45, saturation: 0.9, tint: [0.88, 0.97, 1.15], vignette: 0.8 },
  sfx: (S) => [{ t: 0.2, type: 'riser', dur: 3, vol: 0.12 }, { t: S.find(139, /iceberg/i), type: 'boom', vol: 0.55 }, { t: S.at(140), type: 'heartbeat', n: 4, bpm: 110, vol: 0.5 }, { t: S.find(141, /bell/), type: 'bell', freq: 1250, n: 3, interval: 0.42, vol: 0.28 }, { t: S.find(141, /telephone/), type: 'phone', dur: 0.9, vol: 0.08 }],
  build(E) {
    const st = oceanWorld({ ...GLASS, envMap: E.envMap, lights: 1, smoke: false, fogNear: 2000, fogFar: 6000 });
    st.berg = makeIceberg({ r: 34, seed: 137, top: '#1a2a38', side: '#0d1a26', under: '#04080e', glow: '#020a12', ei: 0.3, height: 1.4 }); st.scene.add(st.berg);
    return st;
  },
  update(st, S) {
    const v = 11.6; st.ship.position.x = S.lt * v; const x = st.ship.position.x;
    st.berg.position.set(x + 600 - S.lt * 6, -6, 5);
    const nest = [x + 94.5, 30.6, 1.7];
    const a141 = S.at(141);
    if (S.lt < a141) track(st.camera, [[0, nest, [nest[0] + 400, 25, 4], 45], [a141, nest, [nest[0] + 400, 18, 4], 40]], S.lt, { shake: 0.05 });
    else track(st.camera, [[a141, [nest[0] - 6, 34, 10], [nest[0], 30, 0], 42], [S.dur, [nest[0] - 7, 34, 10], [nest[0], 30.5, 0], 40]], S.lt);
    st.tick(S);
  },
  draw(st, g, S) {
    const { W, H, lt } = S;
    const i = lt - S.find(139, /iceberg/i);
    if (i > 0 && lt < S.at(141)) { revealText(g, 'ICEBERG', W / 2, 180, clamp(i / 0.3), { font: F.cond(700, 160), ls: 30, color: '#eaf8ff', shadow: 40, style: 'scale' }); txt(g, 'turned over — dark, reflecting little starlight', W / 2, 290, { font: F.serif(40), color: '#9fbcd8', alpha: clamp(i * 2 - 0.6), shadow: 10 }); }
    const b = lt - S.find(141, /bell/);
    if (b > 0) { for (let k = 0; k < 3; k++) { const kk = clamp((b - k * 0.42) / 0.1); g.save(); g.globalAlpha = kk * (1 - clamp((b - k * 0.42 - 0.4) / 0.6)); g.strokeStyle = '#ffd23f'; g.lineWidth = 6; g.beginPath(); g.arc(W / 2, H / 2, 80 + (b - k * 0.42) * 300, 0, 7); g.stroke(); g.restore(); } txt(g, 'THREE BELLS: OBJECT AHEAD', W / 2, 170, { font: F.cond(700, 64), ls: 6, color: '#ffd23f', alpha: clamp(b * 3), shadow: 20 }); }
  },
});

// 142 — the phone call
S3.push({
  seg: 142, name: 'phone call', amb: { kind: 'dark', vol: 0.8 },
  fx: { bloom: 0.4, bloomThreshold: 0.5, aberration: 0.003 },
  sfx: (S) => [{ t: 0.05, type: 'phone', dur: 0.6, vol: 0.08 }, { t: S.at(143), type: 'pop', pitch: 400 }, { t: S.at(144), type: 'stamp', vol: 0.65 }, { t: S.at(145), type: 'stamp', vol: 0.6 }, { t: S.at(147), type: 'drop', vol: 0.2 }, { t: S.at(144) - 0.4, type: 'heartbeat', n: 6, bpm: 120, vol: 0.45 }],
  draw(st, g, S) {
    const { W, H, lt } = S;
    g.fillStyle = '#05070c'; g.fillRect(0, 0, W, H);
    const panel = (x, w, title, sub, col) => { g.save(); g.fillStyle = col; g.fillRect(x, 0, w, H); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x, 0, w, H); txt(g, title, x + w / 2, 110, { font: F.cond(700, 44), ls: 10, color: '#fff' }); txt(g, sub, x + w / 2, 160, { font: F.cond(400, 26), ls: 8, color: 'rgba(255,255,255,0.7)' }); g.restore(); };
    panel(0, W / 2 - 4, 'CROW’S NEST', 'FREDERICK FLEET', '#0d1a2e');
    panel(W / 2 + 4, W / 2 - 4, 'THE BRIDGE', '6TH OFFICER JAMES MOODY', '#2a1a10');
    const bubble = (x, y, text, t0, col, size = 80) => { const k = lt - t0; if (k < 0) return; const sc = easeOutBack(clamp(k / 0.25)); g.save(); g.translate(x, y); g.scale(sc, sc); g.fillStyle = col; g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 30; const w = measure(g, text, F.cond(700, size), 4) + 80; roundRect(g, -w / 2, -size * 0.8, w, size * 1.6, 24); g.fill(); g.shadowBlur = 0; txt(g, text, 0, 0, { font: F.cond(700, size), ls: 4, color: col === '#fff' ? '#111' : '#fff' }); g.restore(); };
    bubble(W * 0.75, 420, '“WHAT DO YOU SEE?”', S.at(143), '#fff', 64);
    const s144 = S.at(144);
    const shake = lt > s144 && lt < s144 + 0.4 ? 14 * (1 - (lt - s144) / 0.4) : 0;
    g.save(); g.translate(Math.sin(lt * 80) * shake, 0);
    bubble(W * 0.25, 520, 'ICEBERG!', s144, PAL.red2, 120);
    bubble(W * 0.25, 720, 'RIGHT AHEAD!', S.at(145), PAL.red2, 90);
    g.restore();
    const ty = lt - S.at(147);
    if (ty > 0) { bubble(W * 0.75, 700, '“Thank you.”', S.at(147), '#fff', 56); txt(g, '→ 1ST OFFICER WILLIAM MURDOCH', W * 0.75, 900, { font: F.cond(600, 36), ls: 4, color: '#ffd23f', alpha: clamp((lt - S.find(147, /Murdoch/)) * 3) }); }
  },
});

// 148 — card: THE COLLISION
S3.push(card(148, 'THE COLLISION', null, { bigSize: 150, color: '#ff3b4a', boomVol: 1.0 }));

export default S3;
