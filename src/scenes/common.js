// Reusable scene builders: countdown cards, ocean world, paper infographic scenes, camera helpers.
import * as THREE from 'three';
import { makeSky, makeOcean, outdoorLights, SKY_PRESETS, makeWake } from '../lib/env.js';
import { buildLiner, funnelSmoke, TITANIC } from '../lib/ship.js';
import { clamp, easeOut, easeInOut, lerp, wobble, smooth } from '../lib/kit.js';
import { txt, F, PAL, measure, paperBg, darkBg } from '../lib/draw2d.js';

export { THREE };

// ---------- camera helpers ----------
export function cam(fov = 40, near = 0.1, far = 20000) { return new THREE.PerspectiveCamera(fov, 16 / 9, near, far); }
export function place(camera, from, to, roll = 0) { camera.position.set(...from); camera.up.set(Math.sin(roll), Math.cos(roll), 0); camera.lookAt(...to); }
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export function lerp3(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
/** move camera along keyframes [[time, from, to, fov?], ...] with smooth interpolation */
export function track(camera, keys, t, o = {}) {
  let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const k = b[0] === a[0] ? 1 : (o.ease ?? easeInOut)(clamp((t - a[0]) / (b[0] - a[0])));
  const from = lerp3(a[1], b[1], k), to = lerp3(a[2], b[2], k);
  if (o.shake) { from[0] += wobble(t * 3, 1) * o.shake; from[1] += wobble(t * 3, 2) * o.shake; to[1] += wobble(t * 2.7, 3) * o.shake * 0.5; }
  place(camera, from, to, o.roll ? lerp(a[4] ?? 0, b[4] ?? 0, k) : 0);
  if (a[3] != null) { camera.fov = lerp(a[3], b[3] ?? a[3], k); camera.updateProjectionMatrix(); }
}
export function shake(camera, t, amt = 0.1, seed = 0) { camera.position.x += wobble(t * 9, seed) * amt; camera.position.y += wobble(t * 10, seed + 4) * amt; }

// ---------- countdown cards ----------
/**
 * Black-screen title card ("Fourteen years before the collision").
 * big: main text, small: subline, accent colour etc.
 */
export function card(seg, big, small, o = {}) {
  return {
    seg, name: `card: ${big} ${small ?? ''}`, lead: 0.25, trans: 'cut', ...o.def,
    fx: { captions: false, vignette: 0.8, grain: 0.07, bloom: 0.0 },
    sfx: (S) => [
      { t: 0.05, type: 'boom', vol: o.boomVol ?? 0.75 },
      { t: 0.0, type: 'whoosh', dur: 0.5, vol: 0.18 },
      { t: 0.6, type: 'ticks', n: Math.max(2, Math.min(5, Math.floor(S.dur / 0.55))), interval: 0.55, vol: 0.28 },
    ],
    draw(st, g, S) {
      const { W, H, lt, dur } = S;
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      const out = clamp((lt - (dur - 0.3)) / 0.3);
      const a = easeOut(clamp(lt / 0.7));
      const ls = lerp(70, o.ls ?? 16, easeOut(clamp(lt / 1.4)));
      const bigFont = o.bigFont ?? F.cond(700, o.bigSize ?? 160);
      g.save();
      g.globalAlpha = a * (1 - out);
      g.filter = `blur(${(1 - a) * 14 + out * 8}px)`;
      const y = small ? H / 2 - 40 : H / 2;
      txt(g, big, W / 2 + ls / 2, y, { font: bigFont, ls, color: o.color ?? '#f4f1ea' });
      g.filter = 'none';
      if (small) {
        const b = easeOut(clamp((lt - 0.35) / 0.6));
        const lw = measure(g, small, F.cond(400, 50), 18);
        g.fillStyle = o.accent ?? PAL.red2; g.globalAlpha = b * (1 - out);
        g.fillRect(W / 2 - (lw / 2 + 40) * b, y + 92, (lw + 80) * b, 3);
        txt(g, small, W / 2 + 9, y + 140, { font: F.cond(400, 50), ls: 18, color: o.accent ?? PAL.red2, alpha: 1 });
      }
      if (o.extra) { const c = easeOut(clamp((lt - 0.7) / 0.6)); txt(g, o.extra, W / 2 + 6, y + 220, { font: F.serif(40), color: '#9b978f', alpha: c * (1 - out), ls: 2 }); }
      g.restore();
    },
  };
}

// ---------- ocean world ----------
export function oceanWorld(o = {}) {
  const scene = new THREE.Scene();
  const skyP = typeof o.sky === 'string' ? SKY_PRESETS[o.sky] : o.sky ?? SKY_PRESETS.day;
  const sunDir = o.sunDir ?? skyP.sunDir;
  const sky = makeSky({ ...skyP, sunDir });
  scene.add(sky);
  const ocean = makeOcean(o.ocean ?? 'day', { sunDir, fog: o.fogColor ?? skyP.hor, fogNear: o.fogNear ?? 500, fogFar: o.fogFar ?? 4500 });
  scene.add(ocean);
  scene.fog = new THREE.Fog(new THREE.Color(o.fogColor ?? skyP.hor), o.fogNear ?? 500, o.fogFar ?? 4500);
  const lights = outdoorLights(scene, { sunDir, sun: o.sunColor ?? skyP.sun, sunI: o.sunI ?? 2.4, hemi: o.hemi ?? 0.9, sky: o.hemiSky ?? 0xbfd8ff, ground: o.hemiGround ?? 0x1a2a3a, shadow: o.shadow ?? false, shadowSize: o.shadowSize ?? 180 });
  if (o.env !== false && o.envMap) { scene.environment = o.envMap; scene.environmentIntensity = o.envI ?? 0.5; }
  const camera = cam(o.fov ?? 35, 0.5, 20000);
  let ship = null, smoke = null, wake = null;
  if (o.ship !== false) {
    ship = buildLiner({ spec: o.spec ?? TITANIC, lights: o.lights ?? 0, range: o.range });
    scene.add(ship);
    if (o.smoke !== false) { smoke = funnelSmoke(ship, { color: o.smokeColor ?? 0x2e2a28, opacity: o.smokeOpacity ?? 0.45 }); ship.add(smoke); }
    if (o.wake) { wake = makeWake(600, 50); wake.position.set(-(ship.userData.spec.L / 2) - 290, 0.15, 0); ship.add(wake); }
  }
  const st = {
    scene, camera, sky, ocean, ship, smoke, wake, lights,
    tick(S) {
      const t = S.t;
      ocean.userData.uniforms.time.value = t; sky.userData.uniforms.time.value = t;
      ocean.userData.follow(camera);
      sky.position.copy(camera.position);
      if (smoke) smoke.userData.update(t);
    },
  };
  return st;
}

/** night-time preset bundle */
export const NIGHT = { sky: 'night', ocean: 'night', fogColor: '#050a16', fogNear: 300, fogFar: 3000, sunI: 0.35, sunColor: 0x8aa0ff, hemi: 0.35, hemiSky: 0x3a4a7a, hemiGround: 0x05070a, lights: 1 };
export const GLASS = { ...NIGHT, ocean: 'glass', sky: 'deepnight' };

// ---------- 2D scene helper ----------
export function paper(def) {
  return { ...def, fx: { captions: true, bloom: 0, vignette: 0.25, grain: 0.03, aberration: 0.0008, saturation: 1, contrast: 1, ...(def.fx || {}) }, draw(st, g, S) { paperBg(g, S.W, S.H, S.lt, def.bg || {}); def.paint(st, g, S); } };
}
export function dark(def) {
  return { ...def, fx: { captions: true, bloom: 0, vignette: 0.3, grain: 0.04, ...(def.fx || {}) }, draw(st, g, S) { darkBg(g, S.W, S.H, def.c1 ?? '#2a0508', def.c2 ?? '#050102', def.bg || {}); def.paint(st, g, S); } };
}

/** project a 3D point to overlay pixel coords */
export function toScreen(v, camera, W = 1920, H = 1080) {
  const p = v.clone().project(camera);
  return [(p.x * 0.5 + 0.5) * W, (-p.y * 0.5 + 0.5) * H, p.z];
}

export { clamp, easeOut, easeInOut, lerp, smooth };
