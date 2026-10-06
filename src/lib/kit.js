// Shared helpers: deterministic randomness, easing, materials, canvas textures, generic props.
import * as THREE from 'three';

// ---------- math / easing ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const inv = (a, b, x) => clamp((x - a) / (b - a));
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t) => Math.pow(clamp(t), 3);
export const easeInOut = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOutBack = (t, s = 1.7) => { t = clamp(t) - 1; return t * t * ((s + 1) * t + s) + 1; };
export const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t)));
/** value that goes 0 -> 1 between a..b (eased) */
export const ramp = (x, a, b, ease = smooth) => ease(inv(a, b, x));
export const pulse = (x, a, b, f = 0.15) => ramp(x, a, a + f) * (1 - ramp(x, b - f, b));

export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** smooth pseudo noise in [-1,1] for camera shake etc. */
export function wobble(t, seed = 0) {
  return (Math.sin(t * 1.7 + seed) * 0.5 + Math.sin(t * 3.1 + seed * 2.3) * 0.3 + Math.sin(t * 7.3 + seed * 5.1) * 0.2);
}
// 3D value noise (deterministic)
const P = new Uint8Array(512);
{ const r = rng(1337); const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) P[i] = p[i & 255]; }
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
function grad(h, x, y, z) { const u = h < 8 ? x : y; const v = h < 4 ? y : h === 12 || h === 14 ? x : z; return ((h & 1) ? -u : u) + ((h & 2) ? -v : v); }
export function noise3(x, y, z) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
  x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
  const u = fade(x), v = fade(y), w = fade(z);
  const A = P[X] + Y, AA = P[A] + Z, AB = P[A + 1] + Z, B = P[X + 1] + Y, BA = P[B] + Z, BB = P[B + 1] + Z;
  return lerp(lerp(lerp(grad(P[AA] & 15, x, y, z), grad(P[BA] & 15, x - 1, y, z), u), lerp(grad(P[AB] & 15, x, y - 1, z), grad(P[BB] & 15, x - 1, y - 1, z), u), v),
    lerp(lerp(grad(P[AA + 1] & 15, x, y, z - 1), grad(P[BA + 1] & 15, x - 1, y, z - 1), u), lerp(grad(P[AB + 1] & 15, x, y - 1, z - 1), grad(P[BB + 1] & 15, x - 1, y - 1, z - 1), u), v), w);
}
export function fbm3(x, y, z, oct = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += a * noise3(x * f, y * f, z * f); a *= 0.5; f *= 2.03; } return s; }

// ---------- materials ----------
export function std(color, o = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.6, metalness: o.metal ?? 0.0, flatShading: o.flat ?? false, emissive: o.emissive ?? 0x000000, emissiveIntensity: o.ei ?? 1, side: o.side ?? THREE.FrontSide, map: o.map ?? null, transparent: o.transparent ?? false, opacity: o.opacity ?? 1, envMapIntensity: o.env ?? 1, vertexColors: o.vc ?? false, emissiveMap: o.emissiveMap ?? null, depthWrite: o.depthWrite ?? true });
}
export function basic(color, o = {}) {
  return new THREE.MeshBasicMaterial({ color, transparent: o.transparent ?? false, opacity: o.opacity ?? 1, side: o.side ?? THREE.FrontSide, map: o.map ?? null, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: o.depthWrite ?? !o.add, fog: o.fog ?? true, toneMapped: o.toneMapped ?? true });
}

export function mesh(geo, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (parent) parent.add(m); return m;
}
export function box(w, h, d, mat, x = 0, y = 0, z = 0, parent) { return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent); }
export function cyl(rt, rb, h, mat, x = 0, y = 0, z = 0, parent, seg = 20) { return mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, parent); }
export function sph(r, mat, x = 0, y = 0, z = 0, parent, ws = 20, hs = 14) { return mesh(new THREE.SphereGeometry(r, ws, hs), mat, x, y, z, parent); }
export function shadows(obj, cast = true, receive = true) { obj.traverse((o) => { if (o.isMesh) { o.castShadow = cast; o.receiveShadow = receive; } }); return obj; }

// ---------- canvas textures ----------
export function canvasTex(w, h, draw, o = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = o.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
  return t;
}

/** plane with text drawn on it (signs, headlines, labels in 3D) */
export function textPlane(lines, o = {}) {
  const w = o.w ?? 1024, h = o.h ?? 256;
  const tex = canvasTex(w, h, (g) => {
    if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, w, h); }
    if (o.drawBg) o.drawBg(g, w, h);
    const arr = Array.isArray(lines) ? lines : [lines];
    const lh = h / arr.length;
    arr.forEach((ln, i) => {
      const L = typeof ln === 'string' ? { text: ln } : ln;
      g.fillStyle = L.color ?? o.color ?? '#fff';
      g.font = L.font ?? o.font ?? `700 ${Math.floor(lh * 0.7)}px Oswald`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(L.text, w / 2, lh * (i + 0.5));
    });
  });
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, toneMapped: false, depthWrite: o.depthWrite ?? true });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(o.size ?? 4, (o.size ?? 4) * h / w), mat);
  return m;
}

// ---------- patterns ----------
export function wallpaper(base, accent, o = {}) {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    g.fillStyle = accent; g.globalAlpha = o.alpha ?? 0.25;
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const cx = x * 128 + (y % 2 ? 64 : 0), cy = y * 128 + 64;
      g.beginPath(); g.ellipse(cx, cy, 22, 38, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(cx, cy, 38, 12, 0, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
    if (o.stripes) { g.fillStyle = accent; g.globalAlpha = 0.15; for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 6, h); g.globalAlpha = 1; }
  }, { repeat: o.repeat ?? [4, 2] });
}
export function woodTex(base = '#6b3a1e', o = {}) {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const r = rng(o.seed ?? 7);
    const planks = o.planks ?? 8;
    for (let i = 0; i < planks; i++) {
      const y = (i * h) / planks;
      g.fillStyle = `rgba(0,0,0,${0.08 + r() * 0.15})`; g.fillRect(0, y, w, h / planks);
      g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, y, w, 2);
      for (let k = 0; k < 14; k++) { g.strokeStyle = `rgba(255,220,180,${0.03 + r() * 0.05})`; g.beginPath(); const yy = y + r() * h / planks; g.moveTo(0, yy); g.bezierCurveTo(w * 0.3, yy + r() * 8 - 4, w * 0.6, yy + r() * 8 - 4, w, yy); g.stroke(); }
      const off = r() * w; g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(off, y, 2, h / planks);
    }
  }, { repeat: o.repeat ?? [2, 2] });
}
export function checkerTex(a, b, n = 8, o = {}) {
  return canvasTex(512, 512, (g, w, h) => {
    const s = w / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = (x + y) % 2 ? a : b; g.fillRect(x * s, y * s, s, s); }
  }, { repeat: o.repeat ?? [4, 4] });
}
export function carpetTex(base, accent, o = {}) {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    g.strokeStyle = accent; g.lineWidth = 6; g.globalAlpha = 0.5;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const cx = i * 128 + 64, cy = j * 128 + 64;
      g.beginPath(); g.moveTo(cx, cy - 40); g.lineTo(cx + 40, cy); g.lineTo(cx, cy + 40); g.lineTo(cx - 40, cy); g.closePath(); g.stroke();
      g.beginPath(); g.arc(cx, cy, 10, 0, 7); g.stroke();
    }
    g.globalAlpha = 1;
  }, { repeat: o.repeat ?? [6, 6] });
}
export function metalTex(base = '#3a3f45', o = {}) {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const r = rng(o.seed ?? 3);
    for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${r() * 0.05})`; g.fillRect(r() * w, r() * h, 2 + r() * 20, 1 + r() * 3); }
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2;
    for (let y = 0; y <= h; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    for (let x = 0; x <= w; x += 256) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.18)';
    for (let y = 6; y <= h; y += 128) for (let x = 4; x < w; x += 16) { g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); g.beginPath(); g.arc(x, y - 12 + 128, 2, 0, 7); g.fill(); }
    if (o.rust) { for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${150 + r() * 60},${60 + r() * 30},20,${r() * 0.25})`; g.beginPath(); g.ellipse(r() * w, r() * h, 3 + r() * 30, 2 + r() * 50, 0, 0, 7); g.fill(); } }
  }, { repeat: o.repeat ?? [2, 2] });
}

// ---------- particles ----------
/** simple deterministic particle cloud; positions computed per frame by fn(i, t) -> [x,y,z] */
export function particles(n, fn, o = {}) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const tex = o.tex ?? dotTex();
  const mat = new THREE.PointsMaterial({ size: o.size ?? 0.2, map: tex, color: o.color ?? 0xffffff, transparent: true, opacity: o.opacity ?? 1, depthWrite: false, blending: o.add === false ? THREE.NormalBlending : THREE.AdditiveBlending, sizeAttenuation: o.atten ?? true, fog: o.fog ?? true });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.userData.update = (t) => { for (let i = 0; i < n; i++) { const p = fn(i, t); pos[i * 3] = p[0]; pos[i * 3 + 1] = p[1]; pos[i * 3 + 2] = p[2]; } geo.attributes.position.needsUpdate = true; };
  pts.userData.update(0);
  return pts;
}
let _dot;
export function dotTex() {
  if (_dot) return _dot;
  _dot = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  return _dot;
}
let _smoke;
export function smokeTex() {
  if (_smoke) return _smoke;
  _smoke = canvasTex(128, 128, (g) => {
    const r = rng(11);
    for (let i = 0; i < 18; i++) { const x = 34 + r() * 60, y = 34 + r() * 60, rad = 18 + r() * 30; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  });
  return _smoke;
}
/** glowing sprite (lamps, flares) */
export function glow(color = 0xffcc88, size = 1, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  s.scale.setScalar(size); return s;
}

// ---------- generic props ----------
export function chandelier(parent, x, y, z, s = 1, o = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); parent.add(g);
  const gold = std(0xc9a14a, { metal: 0.9, rough: 0.3 });
  cyl(0.02, 0.02, 1.2, gold, 0, 0.6, 0, g, 6);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.03, 8, 24), gold); ring.rotation.x = Math.PI / 2; g.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 24), gold); ring2.rotation.x = Math.PI / 2; ring2.position.y = -0.25; g.add(ring2);
  const bulb = basic(0xfff1c8, { toneMapped: false });
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; sph(0.05, bulb, Math.cos(a) * 0.5, 0.06, Math.sin(a) * 0.5, g, 8, 6); const gl = glow(0xffd28a, 0.35, 0.6); gl.position.set(Math.cos(a) * 0.5, 0.08, Math.sin(a) * 0.5); g.add(gl); }
  sph(0.12, std(0xfff4dc, { emissive: 0xffd9a0, ei: 1.2 }), 0, -0.3, 0, g, 12, 8);
  if (o.light !== false) { const L = new THREE.PointLight(0xffcf8a, (o.intensity ?? 6) * 0.5, o.dist ?? 14, 1.6); L.position.y = -0.2; g.add(L); }
  return g;
}
export function table(parent, x, z, o = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  const w = o.w ?? 1.6, d = o.d ?? 1.0;
  box(w, 0.06, d, std(o.cloth ?? 0xf3efe6, { rough: 0.9 }), 0, 0.76, 0, g);
  box(w + 0.02, 0.3, d + 0.02, std(o.cloth ?? 0xf3efe6, { rough: 0.9 }), 0, 0.6, 0, g);
  const wood = std(0x4a2814, { rough: 0.5 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(0.03, 0.03, 0.45, wood, sx * (w / 2 - 0.1), 0.22, sz * (d / 2 - 0.1), g, 6);
  if (o.setting !== false) {
    const plate = std(0xffffff, { rough: 0.2 });
    const glass = std(0xddeeff, { rough: 0.05, transparent: true, opacity: 0.45 });
    for (let i = 0; i < (o.seats ?? 4); i++) {
      const a = (i / (o.seats ?? 4)) * Math.PI * 2;
      const px = Math.cos(a) * (w / 2 - 0.25), pz = Math.sin(a) * (d / 2 - 0.22);
      cyl(0.13, 0.11, 0.02, plate, px, 0.8, pz, g, 16);
      cyl(0.035, 0.02, 0.14, glass, px * 0.7, 0.86, pz * 0.7 + 0.1, g, 8);
    }
    if (o.candle !== false) {
      const candle = std(0xfff6e0, { emissive: 0xffaa55, ei: 0.4 });
      cyl(0.03, 0.03, 0.2, candle, 0, 0.9, 0, g, 8);
      const fl = glow(0xffb060, 0.12); fl.position.set(0, 1.03, 0); g.add(fl);
    }
  }
  return g;
}
export function chair(parent, x, z, rot = 0, o = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; parent.add(g);
  const wood = std(o.wood ?? 0x5a2e14, { rough: 0.5 });
  const fab = std(o.fabric ?? 0x8a1d24, { rough: 0.9 });
  box(0.48, 0.08, 0.48, fab, 0, 0.47, 0, g);
  box(0.48, 0.6, 0.06, fab, 0, 0.8, -0.22, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.04, 0.45, 0.04, wood, sx * 0.2, 0.22, sz * 0.2, g);
  return g;
}

export function disposeObject(obj) {
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of ms) { for (const k in m) { const v = m[k]; if (v && v.isTexture) v.dispose(); } m.dispose(); }
    }
  });
}
