// Procedural ocean liners (Titanic & friends). Units: metres, waterline at y=0, bow towards +X.
import * as THREE from 'three';
import { rng, std, box, cyl, glow, canvasTex, sph } from './kit.js';

export const TITANIC = {
  L: 269, B: 28, keel: -10.5, deck: 11, sheer: 2.6,
  hull: '#111214', bottom: '#8e1e16', boot: '#f2efe6', line: '#c9a14a',
  funnels: [62, 29, -4, -37], funnelColor: '#d9a24e', funnelTop: '#0d0d0d', funnelH: 24, funnelR: [3.7, 2.9], rake: 0.085,
  supers: [
    // [x0, x1, y0, y1, inset]  (inset from hull side)
    [-95, 92, 11, 14.5, 0.4],
    [-82, 84, 14.5, 17.6, 1.4],
    [-62, 76, 17.6, 20.3, 6.5],
    [-118, -98, 11, 13.6, 0.6],
  ],
  bridge: 78, masts: [[97, 63], [-93, 58]], boats: { fore: [72, 64.5, 57, 49.5], aft: [-26, -33.5, -41, -48.5] },
  portholeRows: [2.6, 5.2, 7.8, 10.2], name: 'TITANIC',
};
export const LUSITANIA = { ...TITANIC, L: 240, B: 26.5, funnels: [52, 22, -8, -38], funnelColor: '#c8361e', funnelH: 23, funnelR: [3.1, 2.6], supers: [[-80, 80, 11, 14.5, 0.4], [-70, 72, 14.5, 17.4, 1.4], [-50, 65, 17.4, 19.8, 6]], bridge: 68, masts: [[85, 55], [-85, 52]], boats: { fore: [60, 54, 48, 42], aft: [-20, -26, -32, -46] }, name: '' };
export const CALIFORNIAN = { ...TITANIC, L: 136, B: 16, keel: -7, deck: 7, sheer: 1.8, funnels: [-4], funnelColor: '#151515', funnelTop: '#a02a1a', funnelH: 15, funnelR: [2.4, 2.1], supers: [[-14, 14, 7, 10, 0.6], [-10, 10, 10, 12.5, 2.5], [-58, -48, 7, 9.5, 0.6]], bridge: 12, masts: [[45, 38], [-38, 36]], boats: { fore: [8, 2], aft: [] }, portholeRows: [3, 5.5], name: '' };
export const CARPATHIA = { ...TITANIC, L: 170, B: 20, keel: -8, deck: 8, sheer: 2, funnels: [-2], funnelColor: '#c8361e', funnelTop: '#0d0d0d', funnelH: 21, funnelR: [3.2, 2.6], supers: [[-50, 45, 8, 11, 0.5], [-30, 35, 11, 13.8, 2]], bridge: 34, masts: [[62, 45], [-55, 43]], boats: { fore: [26, 20, 14], aft: [-14, -20, -26] }, portholeRows: [3, 5.8], name: '' };
export const NEWYORK = { ...TITANIC, L: 170, B: 19, keel: -8, deck: 8, sheer: 2, funnels: [14, -12], funnelColor: '#151515', funnelTop: '#151515', funnelH: 18, funnelR: [2.8, 2.4], supers: [[-45, 50, 8, 11, 0.5], [-28, 36, 11, 13.5, 2]], bridge: 40, masts: [[62, 42], [-40, 40], [-70, 38]], boats: { fore: [30, 24], aft: [-20, -26] }, portholeRows: [3, 5.8], name: '' };

function hullTexture(S, lit) {
  const W = 4096, H = 512, y0 = S.keel, y1 = S.deck + S.sheer + 0.5;
  const toPx = (y) => H - ((y - y0) / (y1 - y0)) * H;
  return canvasTex(W, H, (g) => {
    if (!lit) {
      g.fillStyle = S.hull; g.fillRect(0, 0, W, H);
      // plating seams
      const r = rng(9);
      for (let x = 0; x < W; x += 24) { g.fillStyle = `rgba(255,255,255,${0.015 + r() * 0.02})`; g.fillRect(x, 0, 1, H); }
      for (let y = toPx(0); y > 0; y -= 18) { g.fillStyle = 'rgba(255,255,255,0.025)'; g.fillRect(0, y, W, 1); }
      g.fillStyle = S.bottom; g.fillRect(0, toPx(-0.3), W, H);
      for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.12})`; g.fillRect(r() * W, toPx(-0.3) + r() * 200, 30 + r() * 80, 2 + r() * 6); }
      g.fillStyle = S.boot; g.fillRect(0, toPx(0.25), W, toPx(-0.3) - toPx(0.25));
      g.fillStyle = S.line; g.fillRect(0, toPx(S.deck - 0.6), W, 3);
    } else { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
    const r2 = rng(21);
    for (const row of S.portholeRows) {
      const y = toPx(row);
      for (let x = 30; x < W - 30; x += 15 + (r2() < 0.1 ? 10 : 0)) {
        const u = x / W; if (u > 0.965 || u < 0.03) continue;
        if (lit) { const on = r2() < 0.82; g.fillStyle = on ? `rgba(255,${200 + r2() * 40},${120 + r2() * 60},1)` : 'rgba(0,0,0,0)'; }
        else g.fillStyle = '#2b2e33';
        g.beginPath(); g.arc(x, y, 3.2, 0, 7); g.fill();
      }
    }
  });
}

function superTexture(lit, len, rows = 2) {
  return canvasTex(1024, 128, (g, w, h) => {
    g.fillStyle = lit ? '#000' : '#f1eee6'; g.fillRect(0, 0, w, h);
    const r = rng(len | 0);
    for (let row = 0; row < rows; row++) {
      const y = h * (0.28 + row * 0.42 / Math.max(1, rows - 1)) - 10;
      for (let x = 10; x < w - 10; x += 26) {
        if (lit) { if (r() < 0.8) { g.fillStyle = `rgb(255,${190 + r() * 50},${110 + r() * 70})`; g.fillRect(x, y, 14, rows > 1 ? 18 : 30); } }
        else { g.fillStyle = '#26303a'; g.fillRect(x, y, 14, rows > 1 ? 18 : 30); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x - 3, y + (rows > 1 ? 20 : 32), 20, 3); }
      }
    }
    if (!lit) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, h - 6, w, 6); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 0, w, 4); }
  }, { repeat: [Math.max(1, Math.round(len / 28)), 1] });
}

/**
 * Build a liner. opts: { spec, range:[x0,x1] (for broken halves), lights:0..1, detail }
 * returns Group with userData.setLights(v)
 */
export function buildLiner(opts = {}) {
  const S = opts.spec ?? TITANIC;
  const L = S.L, B = S.B;
  const xa = opts.range ? opts.range[0] : -L / 2, xb = opts.range ? opts.range[1] : L / 2;
  const inRange = (x) => x >= xa && x <= xb;
  const G = new THREE.Group();
  const emissiveMats = [];

  const hb = (x) => {
    const u = (x + L / 2) / L;
    let h = B / 2;
    if (u > 0.78) { const t = (u - 0.78) / 0.22; h *= Math.sqrt(Math.max(0.0, 1 - Math.pow(t, 2.1))); }
    if (u < 0.1) { const t = (0.1 - u) / 0.1; h *= Math.sqrt(Math.max(0.0, 1 - t * t * 0.82)); }
    return Math.max(h, 0.05);
  };
  const keelY = (x) => { const u = (x + L / 2) / L; return u < 0.07 ? S.keel + (0.07 - u) / 0.07 * (Math.abs(S.keel) * 0.75) : S.keel; };
  const topY = (x) => { const u = (x + L / 2) / L - 0.5; return S.deck + S.sheer * 4 * u * u + (u > 0.38 ? (u - 0.38) * 14 : 0); };
  const fullness = (x) => { const u = (x + L / 2) / L; if (u > 0.7) return THREE.MathUtils.lerp(6, 1.4, Math.min(1, (u - 0.7) / 0.3)); if (u < 0.2) return THREE.MathUtils.lerp(6, 2.2, Math.min(1, (0.2 - u) / 0.2)); return 6; };
  S._hb = hb; S._top = topY;

  // ---- hull loft ----
  const NX = opts.detail === 'low' ? 60 : 150, NR = 18;
  const yMin = S.keel, yMax = S.deck + S.sheer + 0.5;
  const pos = [], uv = [], idx = [];
  for (let side = 0; side < 2; side++) {
    const base = pos.length / 3;
    for (let i = 0; i <= NX; i++) {
      const x = xa + (xb - xa) * (i / NX);
      const k = keelY(x), tp = topY(x), w = hb(x), p = fullness(x);
      for (let j = 0; j <= NR; j++) {
        const s = j / NR;
        const y = k + (tp - k) * s;
        let z = w * (1 - Math.pow(1 - s, p));
        if (y > 0 && (x + L / 2) / L > 0.85) z *= 1 + (y / tp) * 0.06; // bow flare
        pos.push(x, y, side ? -z : z);
        uv.push((x + L / 2) / L, (y - yMin) / (yMax - yMin));
      }
    }
    for (let i = 0; i < NX; i++) for (let j = 0; j < NR; j++) {
      const a = base + i * (NR + 1) + j, b = a + NR + 1, c = a + 1, d = b + 1;
      if (side) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
    }
  }
  const hullGeo = new THREE.BufferGeometry();
  hullGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  hullGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  hullGeo.setIndex(idx); hullGeo.computeVertexNormals();
  const hullMat = new THREE.MeshStandardMaterial({ map: hullTexture(S, false), emissiveMap: hullTexture(S, true), emissive: new THREE.Color('#ffd9a0'), emissiveIntensity: 0, roughness: 0.45, metalness: 0.25, side: THREE.DoubleSide });
  emissiveMats.push([hullMat, 1.3]);
  const hull = new THREE.Mesh(hullGeo, hullMat); hull.castShadow = hull.receiveShadow = true; G.add(hull);

  // ---- deck strip ----
  {
    const dp = [], du = [], di = [];
    for (let i = 0; i <= NX; i++) {
      const x = xa + (xb - xa) * (i / NX), w = hb(x) * 0.995, y = topY(x) - 0.05;
      dp.push(x, y, w, x, y, -w); du.push(x / 8, 0, x / 8, w / 4);
      if (i < NX) { const a = i * 2; di.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dg.setAttribute('uv', new THREE.Float32BufferAttribute(du, 2)); dg.setIndex(di); dg.computeVertexNormals();
    const deckTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#b48a5a'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) { g.fillStyle = 'rgba(40,20,5,0.5)'; g.fillRect(0, y, w, 1); } }, { repeat: [1, 1] });
    deckTex.wrapS = deckTex.wrapT = THREE.RepeatWrapping;
    const deck = new THREE.Mesh(dg, std(0xb48a5a, { map: deckTex, rough: 0.8, side: THREE.DoubleSide })); deck.receiveShadow = true; G.add(deck);
  }
  // ---- end caps ----
  const capMat = opts.range ? std(0x2a1410, { rough: 0.9, emissive: 0x401005, ei: 0.4, side: THREE.DoubleSide }) : std(S.hull, { side: THREE.DoubleSide, rough: 0.5 });
  for (const [x, cut] of [[xa, opts.range && xa > -L / 2 + 1], [xb, opts.range && xb < L / 2 - 1]]) {
    if (!cut && x > 0) continue; // bow is closed naturally
    const k = keelY(x), tp = topY(x), w = hb(x), p = fullness(x);
    const shape = new THREE.Shape();
    const r = rng(Math.round(x * 10));
    const pts = [];
    for (let j = 0; j <= NR; j++) { const s = j / NR; pts.push([w * (1 - Math.pow(1 - s, p)), k + (tp - k) * s]); }
    shape.moveTo(0, k);
    for (const [z, y] of pts) shape.lineTo(z + (cut ? (r() - 0.5) * 1.5 : 0), y);
    for (let j = pts.length - 1; j >= 0; j--) shape.lineTo(-pts[j][0] + (cut ? (r() - 0.5) * 1.5 : 0), pts[j][1]);
    const sg = new THREE.ShapeGeometry(shape); sg.rotateY(Math.PI / 2);
    const cap = new THREE.Mesh(sg, capMat); cap.position.x = x; G.add(cap);
  }

  // ---- superstructure ----
  const white = std(0xf1eee6, { rough: 0.55 });
  for (const [x0, x1, y0, y1, ins] of S.supers) {
    const a = Math.max(x0, xa), b = Math.min(x1, xb); if (b - a < 2) continue;
    const len = b - a, cx = (a + b) / 2;
    const w = Math.min(hb(a), hb(b), hb(cx)) * 2 - ins * 2;
    const rows = y1 - y0 > 3.2 ? 2 : 1;
    const side = new THREE.MeshStandardMaterial({ map: superTexture(false, len, rows), emissiveMap: superTexture(true, len, rows), emissive: new THREE.Color('#ffd49a'), emissiveIntensity: 0, roughness: 0.55 });
    emissiveMats.push([side, 0.9]);
    const mats = [white, white, white, white, side, side];
    const bx = new THREE.Mesh(new THREE.BoxGeometry(len, y1 - y0, w), [side, side, white, white, side, side]);
    void mats;
    bx.position.set(cx, (y0 + y1) / 2, 0); bx.castShadow = bx.receiveShadow = true; G.add(bx);
    // railing line
    const rail = box(len, 0.08, w + 0.2, std(0xdedad0), cx, y1 + 0.5, 0, G); rail.material.transparent = true; rail.material.opacity = 0.6;
  }
  // bridge with wings
  if (inRange(S.bridge)) {
    const y = S.supers[2] ? S.supers[2][2] : S.deck + 6;
    const w = hb(S.bridge) * 2;
    const side = new THREE.MeshStandardMaterial({ map: superTexture(false, 14, 1), emissiveMap: superTexture(true, 14, 1), emissive: new THREE.Color('#ffe2b0'), emissiveIntensity: 0, roughness: 0.5 });
    emissiveMats.push([side, 1.1]);
    const br = new THREE.Mesh(new THREE.BoxGeometry(4, 3, w), [side, side, white, white, side, side]); br.position.set(S.bridge, y + 1.5, 0); br.castShadow = true; G.add(br);
    box(3.5, 0.3, w + 0.4, std(0xb48a5a), S.bridge, y + 3.1, 0, G);
  }
  // ---- funnels ----
  const fMat = std(S.funnelColor, { rough: 0.5 }), tMat = std(S.funnelTop, { rough: 0.6 });
  const funnels = [];
  const fBase = S.supers[2] ? S.supers[2][3] : S.supers.length ? S.supers[S.supers.length - 1][3] : S.deck + 8;
  S.funnels.forEach((fx, i) => {
    if (!inRange(fx)) return;
    const f = new THREE.Group(); f.position.set(fx, fBase - 1, 0); f.rotation.z = S.rake; G.add(f);
    const H = S.funnelH, top = H * 0.17;
    const body = cyl(1, 1, H - top, fMat, 0, (H - top) / 2, 0, f, 28); body.scale.set(S.funnelR[0], 1, S.funnelR[1]); body.castShadow = true;
    const cap = cyl(1, 1, top, tMat, 0, H - top / 2, 0, f, 28); cap.scale.set(S.funnelR[0] * 1.01, 1, S.funnelR[1] * 1.01);
    const inner = cyl(1, 1, 0.2, std(0x050505), 0, H + 0.01, 0, f, 28); inner.scale.set(S.funnelR[0] * 0.9, 1, S.funnelR[1] * 0.9);
    // guy wires
    funnels.push(f); f.userData.top = H; f.userData.dummy = i === 3;
  });
  // ---- masts & rigging ----
  const mastMat = std(0xb88a52, { rough: 0.6 });
  const lineMat = new THREE.LineBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.7 });
  const mastTops = [];
  for (const [mx, mh] of S.masts) {
    const y0 = topY(mx);
    const m = cyl(0.35, 0.55, mh - y0, mastMat, mx, (mh + y0) / 2, 0, inRange(mx) ? G : null, 8);
    if (inRange(mx)) { m.rotation.z = S.rake * 0.6; m.castShadow = true; box(0.3, 0.3, 6, mastMat, mx - 0.6, mh - 18, 0, G); mastTops.push(new THREE.Vector3(mx - (mh - y0) * S.rake * 0.3, mh, 0)); }
    if (inRange(mx) && mx > 0 && S === TITANIC) { // crow's nest
      const cn = cyl(1.1, 1.1, 1.8, std(0xf1eee6), mx - 1.2, y0 + 16, 0, G, 14); cn.castShadow = true;
    }
  }
  if (mastTops.length === 2 && !opts.range) {
    const pts = [mastTops[0], mastTops[1],
      new THREE.Vector3(L / 2 - 2, topY(L / 2 - 2), 0), mastTops[0], new THREE.Vector3(-L / 2 + 6, topY(-L / 2 + 6) + 1, 0), mastTops[1]];
    const lg = new THREE.BufferGeometry().setFromPoints(pts); G.add(new THREE.LineSegments(lg, lineMat));
  }
  // ---- lifeboats ----
  const boatMat = std(0xf6f4ee, { rough: 0.5 }), boatIn = std(0x8a5a32), davit = std(0x2a2a2a, { metal: 0.6, rough: 0.4 });
  const boats = [];
  const boatGeo = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); boatGeo.scale(4.2, 1.0, 1.1);
  const by = S.supers[2] ? S.supers[2][2] + 1.2 : S.deck + 4;
  for (const x of [...S.boats.fore, ...S.boats.aft]) {
    if (!inRange(x)) continue;
    for (const sd of [1, -1]) {
      const z = sd * (hb(x) - 1.3);
      const b = new THREE.Group(); b.position.set(x, by, z); G.add(b);
      const hullB = new THREE.Mesh(boatGeo, boatMat); hullB.position.y = 0.6; hullB.castShadow = true; b.add(hullB);
      const inside = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.1, 1.7), boatIn); inside.position.y = 0.55; b.add(inside);
      for (const dx of [-3.4, 3.4]) { const d = box(0.15, 2.4, 0.15, davit, dx, 1.0, -sd * 0.3, b); d.rotation.x = sd * 0.25; }
      b.userData.home = b.position.clone(); b.userData.side = sd; boats.push(b);
    }
  }
  // ---- vents / details ----
  const ventMat = std(0xe8e2d2, { rough: 0.5 });
  const r = rng(77);
  for (let i = 0; i < 14; i++) {
    const x = -70 + r() * 140; if (!inRange(x)) continue;
    const z = (r() - 0.5) * 14; const y = by - 1.2;
    const v = cyl(0.35, 0.35, 1.6, ventMat, x, y + 0.8, z, G, 10);
    const c = sph(0.55, ventMat, x + 0.2, y + 1.7, z, G, 10, 8); c.scale.set(1, 0.8, 1); void v;
  }
  // cranes at well decks
  for (const x of [104, 108, -102, -106]) if (inRange(x) && S === TITANIC) { const c = cyl(0.25, 0.3, 6, std(0x1d1d1d), x, topY(x) + 3, 3, G, 6); c.rotation.z = 0.5; }

  // night deck lamps
  const lamps = new THREE.Group(); G.add(lamps);
  for (let x = Math.max(xa, -100); x < Math.min(xb, 90); x += 9) for (const sd of [1, -1]) { const l = glow(0xffd8a0, 0.9, 0.0); l.position.set(x, by + 0.8, sd * (hb(x) - 0.4)); lamps.add(l); }
  lamps.visible = false;

  G.userData = {
    spec: S, funnels, boats, hb, topY, boatDeckY: by,
    setLights(v) { for (const [m, k] of emissiveMats) m.emissiveIntensity = v * k; lamps.visible = v > 0.01; lamps.children.forEach((l) => (l.material.opacity = v * 0.55)); },
  };
  G.userData.setLights(opts.lights ?? 0);
  return G;
}

/** funnel smoke emitter: returns Points; call update(t) */
export function funnelSmoke(ship, o = {}) {
  const pts = [];
  const funnels = ship.userData.funnels.filter((f) => !f.userData.dummy);
  const n = o.n ?? 160;
  const geo = new THREE.BufferGeometry(); const pos = new Float32Array(funnels.length * n * 3); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const tex = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const mat = new THREE.PointsMaterial({ size: o.size ?? 26, map: tex, color: o.color ?? 0x3a3530, transparent: true, opacity: o.opacity ?? 0.35, depthWrite: false });
  const P = new THREE.Points(geo, mat); P.frustumCulled = false;
  const r = rng(4);
  const seeds = [...Array(n)].map(() => [r(), r(), r()]);
  P.userData.update = (t) => {
    let k = 0;
    for (const f of funnels) {
      const top = new THREE.Vector3(0, f.userData.top, 0); f.localToWorld(top); ship.worldToLocal(top);
      for (let i = 0; i < n; i++) {
        const s = seeds[i]; const age = ((t * 0.12 + s[0]) % 1);
        pos[k++] = top.x - age * (o.drift ?? 90) + Math.sin(s[1] * 20 + t) * 2;
        pos[k++] = top.y + age * (o.rise ?? 22) + s[2] * 3;
        pos[k++] = top.z + (s[1] - 0.5) * age * 18;
      }
    }
    geo.attributes.position.needsUpdate = true;
  };
  P.userData.update(0);
  return P;
}
