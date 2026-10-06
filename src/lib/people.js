// Stylised low-poly characters + instanced crowds.
import * as THREE from 'three';
import { std, rng, sph, box, cyl } from './kit.js';

const cache = new Map();
const M = (c, o = {}) => { const k = c + JSON.stringify(o); if (!cache.has(k)) cache.set(k, std(c, o)); return cache.get(k); };
export function resetPeopleCache() { cache.clear(); }

const capsule = (r, l, mat) => new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 4, 10), mat);

/**
 * person({ coat, pants, skin, hair, hat, beard, female, dress, shirt, tie, scale, mustache })
 * returns Group with userData { head, armL, armR, legL, legR, torso, pose(o) }
 */
export function person(o = {}) {
  const g = new THREE.Group();
  const skin = M(o.skin ?? '#e8b896', { rough: 0.7 });
  const coat = M(o.coat ?? '#22252e', { rough: 0.8 });
  const pants = M(o.pants ?? o.coat ?? '#1c1e24', { rough: 0.85 });
  const shirt = M(o.shirt ?? '#cfc9bd', { rough: 0.85 });
  const hairM = M(o.hair ?? '#3a2a1e', { rough: 0.9 });
  const shoe = M('#141414', { rough: 0.4 });

  const hips = new THREE.Group(); hips.position.y = 0.95; g.add(hips);
  // legs
  const mkLeg = (sx) => {
    const L = new THREE.Group(); L.position.set(sx * 0.1, 0, 0); hips.add(L);
    const leg = capsule(0.075, 0.72, pants); leg.position.y = -0.45; L.add(leg);
    const sh = box(0.12, 0.08, 0.26, shoe, 0, -0.9, 0.05, L); void sh;
    return L;
  };
  const legL = mkLeg(1), legR = mkLeg(-1);
  if (o.female || o.dress) {
    const dress = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.36, 0.95, 16), M(o.dress ?? o.coat ?? '#7a1f3d', { rough: 0.8 })); dress.position.y = -0.4; hips.add(dress);
  }
  // torso
  const torso = new THREE.Group(); hips.add(torso);
  const body = capsule(o.female ? 0.15 : 0.18, 0.42, coat); body.position.y = 0.36; body.scale.set(1.05, 1, 0.72); torso.add(body);
  if (!o.female) {
    const chest = box(0.13, 0.36, 0.05, shirt, 0, 0.42, 0.12, torso);
    void chest;
    if (o.tie !== false) box(0.04, 0.26, 0.02, M(o.tie ?? '#7a1218'), 0, 0.42, 0.15, torso);
  }
  // head
  const neck = new THREE.Group(); neck.position.y = 0.78; torso.add(neck);
  const head = new THREE.Group(); head.position.y = 0.14; neck.add(head);
  const skull = sph(0.12, skin, 0, 0, 0, head, 18, 14); skull.scale.set(0.95, 1.12, 1.0);
  sph(0.022, skin, 0, -0.01, 0.12, head, 8, 6); // nose
  const eye = M('#111');
  sph(0.016, eye, 0.042, 0.025, 0.105, head, 6, 4); sph(0.016, eye, -0.042, 0.025, 0.105, head, 6, 4);
  const brow = M(o.hair ?? '#3a2a1e');
  box(0.045, 0.01, 0.01, brow, 0.042, 0.055, 0.11, head); box(0.045, 0.01, 0.01, brow, -0.042, 0.055, 0.11, head);
  if (o.hat !== 'cap' && o.hat !== 'top' && o.hat !== 'officer' && o.hat !== 'bowler' && o.hat !== 'flat') {
    const hr = sph(0.128, hairM, 0, 0.035, -0.012, head, 16, 10); hr.scale.set(1, 0.9, 1.02);
    if (o.female) { const bun = sph(0.075, hairM, 0, 0.06, -0.12, head, 10, 8); void bun; }
  } else {
    const hr = sph(0.125, hairM, 0, 0.0, -0.02, head, 14, 8); hr.scale.set(1, 0.8, 1);
  }
  if (o.beard) { const b = sph(0.1, M(o.beardColor ?? '#e8e4dc', { rough: 1 }), 0, -0.07, 0.04, head, 12, 8); b.scale.set(1, 0.9, 0.85); }
  if (o.mustache) { box(0.08, 0.018, 0.02, M(o.beardColor ?? o.hair ?? '#3a2a1e'), 0, -0.04, 0.115, head); }
  if (o.hat) {
    const hm = M(o.hatColor ?? (o.hat === 'officer' ? '#151a2a' : '#141414'), { rough: 0.6 });
    if (o.hat === 'top') { cyl(0.1, 0.1, 0.2, hm, 0, 0.17, 0, head, 14); cyl(0.17, 0.17, 0.015, hm, 0, 0.08, 0, head, 16); }
    if (o.hat === 'bowler') { const d = sph(0.12, hm, 0, 0.08, 0, head, 14, 8); d.scale.y = 0.75; cyl(0.17, 0.17, 0.015, hm, 0, 0.06, 0, head, 16); }
    if (o.hat === 'officer' || o.hat === 'cap') { cyl(0.13, 0.12, 0.08, hm, 0, 0.1, 0, head, 14); box(0.16, 0.012, 0.09, M('#0a0a0a'), 0, 0.07, 0.11, head); if (o.hat === 'officer') box(0.07, 0.03, 0.01, M('#d9b54a', { metal: 0.8, rough: 0.3 }), 0, 0.11, 0.13, head); }
    if (o.hat === 'flat') { const d = sph(0.13, M(o.hatColor ?? '#4a3e30'), 0, 0.07, 0.01, head, 14, 6); d.scale.set(1, 0.4, 1.15); }
    if (o.hat === 'hood') { const d = sph(0.15, hm, 0, 0.02, -0.02, head, 14, 8); d.scale.set(1, 1.1, 1.05); }
  }
  // arms
  const mkArm = (sx) => {
    const A = new THREE.Group(); A.position.set(sx * 0.22, 0.62, 0); torso.add(A);
    const up = capsule(0.06, 0.26, coat); up.position.y = -0.17; A.add(up);
    const fore = new THREE.Group(); fore.position.y = -0.34; A.add(fore);
    const lo = capsule(0.052, 0.24, coat); lo.position.y = -0.15; fore.add(lo);
    sph(0.05, skin, 0, -0.31, 0, fore, 8, 6);
    A.userData.fore = fore;
    A.rotation.z = sx * 0.08;
    return A;
  };
  const armL = mkArm(1), armR = mkArm(-1);
  g.scale.setScalar(o.scale ?? 1);
  g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  g.userData = { head, neck, armL, armR, legL, legR, torso, hips };
  return g;
}

/** quick posing helpers */
export const pose = {
  idle(p, t, seed = 0) { const u = p.userData; u.torso.rotation.x = Math.sin(t * 1.3 + seed) * 0.015; u.head.rotation.y = Math.sin(t * 0.5 + seed) * 0.15; u.armL.rotation.x = Math.sin(t * 1.1 + seed) * 0.04; u.armR.rotation.x = -Math.sin(t * 1.1 + seed) * 0.04; },
  walk(p, t, speed = 1, seed = 0) { const u = p.userData; const s = Math.sin(t * 6 * speed + seed); u.legL.rotation.x = s * 0.5; u.legR.rotation.x = -s * 0.5; u.armL.rotation.x = -s * 0.4; u.armR.rotation.x = s * 0.4; u.hips.position.y = 0.95 + Math.abs(Math.cos(t * 6 * speed + seed)) * 0.03; },
  sit(p) { const u = p.userData; u.legL.rotation.x = -1.45; u.legR.rotation.x = -1.45; u.hips.position.y = 0.5; for (const L of [u.legL, u.legR]) L.children[0].position.set(0, -0.06, 0.4), L.children[0].rotation.x = 0; },
  armsUp(p, a = 1) { const u = p.userData; u.armL.rotation.z = 2.6 * a; u.armR.rotation.z = -2.6 * a; },
  reach(p, side = 'R', a = 1) { const u = p.userData; const A = side === 'R' ? u.armR : u.armL; A.rotation.x = -1.4 * a; A.userData.fore.rotation.x = -0.2 * a; },
  phone(p, a = 1) { const u = p.userData; u.armR.rotation.x = -0.6 * a; u.armR.rotation.z = -0.9 * a; u.armR.userData.fore.rotation.x = -2.3 * a; },
  hug(p, a = 1) { const u = p.userData; u.armL.rotation.x = -1.2 * a; u.armR.rotation.x = -1.2 * a; u.armL.rotation.z = -0.5 * a; u.armR.rotation.z = 0.5 * a; },
  shiver(p, t) { const u = p.userData; u.torso.rotation.z = Math.sin(t * 40) * 0.01; u.armL.rotation.x = -0.9; u.armR.rotation.x = -0.9; u.armL.rotation.z = -0.7; u.armR.rotation.z = 0.7; u.armL.userData.fore.rotation.x = -1.2; u.armR.userData.fore.rotation.x = -1.2; u.head.rotation.x = 0.15; },
  hammer(p, t, speed = 1, seed = 0) { const u = p.userData; const s = (t * 2.2 * speed + seed) % 1; const k = s < 0.7 ? s / 0.7 : 1 - (s - 0.7) / 0.3; u.armR.rotation.x = -2.6 * k - 0.2; u.armR.userData.fore.rotation.x = -0.4 * k; u.torso.rotation.x = 0.15 * (1 - k); },
};

/**
 * Instanced crowd of simple figures (for hundreds/thousands of people).
 * spots: array of {x,y,z,ry} ; palette: array of colours
 */
export function crowd(spots, o = {}) {
  const n = spots.length;
  const g = new THREE.Group();
  const bodyGeo = new THREE.CapsuleGeometry(0.2, 0.9, 3, 8); bodyGeo.translate(0, 0.65, 0);
  const headGeo = new THREE.SphereGeometry(0.13, 10, 8); headGeo.translate(0, 1.42, 0);
  const hatGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.06, 10); hatGeo.translate(0, 1.53, 0);
  const bodies = new THREE.InstancedMesh(bodyGeo, std(0xffffff, { rough: 0.85 }), n);
  const heads = new THREE.InstancedMesh(headGeo, std(0xffffff, { rough: 0.7 }), n);
  const hats = new THREE.InstancedMesh(hatGeo, std(0xffffff, { rough: 0.7 }), n);
  const r = rng(o.seed ?? 5);
  const pal = o.palette ?? ['#2a2c35', '#3a2c24', '#1d2a3a', '#4a3a2a', '#5a1f24', '#2d3a2a', '#6a5a48', '#1a1a1a', '#7a6650'];
  const skins = ['#e8b896', '#d9a27c', '#f0c8a8', '#c98d68'];
  const hatPal = ['#141414', '#2a2018', '#4a3e30', '#d8cfb8', '#1a1d26'];
  const c = new THREE.Color(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3();
  const data = spots.map((s) => ({ ...s, ph: r() * 10, sc: 0.9 + r() * 0.2, hat: r() < (o.hats ?? 0.7) }));
  data.forEach((d, i) => {
    bodies.setColorAt(i, c.set(pal[Math.floor(r() * pal.length)]));
    heads.setColorAt(i, c.set(skins[Math.floor(r() * skins.length)]));
    hats.setColorAt(i, c.set(hatPal[Math.floor(r() * hatPal.length)]));
  });
  g.add(bodies, heads, hats);
  bodies.castShadow = heads.castShadow = true;
  g.userData.update = (t, f) => {
    data.forEach((d, i) => {
      let x = d.x, y = d.y, z = d.z, ry = d.ry ?? 0, bob = Math.max(0, Math.sin(t * (o.bobSpeed ?? 2) + d.ph)) * (o.bob ?? 0.03);
      if (f) { const res = f(d, t, i); if (res) { x = res.x ?? x; y = res.y ?? y; z = res.z ?? z; ry = res.ry ?? ry; } }
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry); sc.setScalar(d.sc); p.set(x, y + bob, z);
      m4.compose(p, q, sc);
      bodies.setMatrixAt(i, m4); heads.setMatrixAt(i, m4);
      if (d.hat) hats.setMatrixAt(i, m4); else { m4.makeScale(0, 0, 0); hats.setMatrixAt(i, m4); }
    });
    bodies.instanceMatrix.needsUpdate = heads.instanceMatrix.needsUpdate = hats.instanceMatrix.needsUpdate = true;
  };
  g.userData.update(0);
  return g;
}

export function gridSpots(nx, nz, sx, sz, o = {}) {
  const r = rng(o.seed ?? 2); const out = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    if (o.density && r() > o.density) continue;
    out.push({ x: (i - nx / 2) * sx + (r() - 0.5) * sx * 0.8 + (o.x ?? 0), y: o.y ?? 0, z: (j - nz / 2) * sz + (r() - 0.5) * sz * 0.8 + (o.z ?? 0), ry: (o.ry ?? 0) + (r() - 0.5) * (o.ryJitter ?? 0.8) });
  }
  return out;
}
