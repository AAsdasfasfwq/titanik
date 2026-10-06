// Ocean, sky, stars, icebergs, fog presets.
import * as THREE from 'three';
import { rng, fbm3, std } from './kit.js';

// ---------- SKY ----------
export const SKY_PRESETS = {
  day: { top: '#3d7fd0', mid: '#8fbde8', hor: '#e8eef2', sun: '#fff1d0', sunDir: [0.4, 0.35, -0.6], sunSize: 0.03, stars: 0 },
  golden: { top: '#3a5d9a', mid: '#e09a6a', hor: '#ffcf8a', sun: '#ffd28a', sunDir: [0.6, 0.06, -0.8], sunSize: 0.05, stars: 0 },
  dusk: { top: '#141a3a', mid: '#6a3c66', hor: '#f08a5a', sun: '#ff9a5a', sunDir: [0.7, 0.01, -0.7], sunSize: 0.04, stars: 0.3 },
  night: { top: '#01030a', mid: '#050b1e', hor: '#0e1a33', sun: '#9fb8ff', sunDir: [0.2, -0.4, -1], sunSize: 0.0, stars: 1 },
  deepnight: { top: '#000004', mid: '#020512', hor: '#071025', sun: '#000000', sunDir: [0, -1, 0], sunSize: 0, stars: 1.2 },
  dawn: { top: '#2a3a6a', mid: '#c98a8a', hor: '#ffd0a0', sun: '#ffe2b0', sunDir: [-0.7, 0.04, -0.7], sunSize: 0.05, stars: 0.15 },
  overcast: { top: '#5a6470', mid: '#8a939c', hor: '#b8bec4', sun: '#ffffff', sunDir: [0, 1, 0], sunSize: 0, stars: 0 },
  storm: { top: '#20262e', mid: '#3a434d', hor: '#5d6670', sun: '#ffffff', sunDir: [0, 1, 0], sunSize: 0, stars: 0 },
  sepia: { top: '#6b4a2a', mid: '#b08858', hor: '#e8c896', sun: '#fff0c8', sunDir: [0.5, 0.2, -0.8], sunSize: 0.04, stars: 0 },
};

export function makeSky(preset = 'day', radius = 9000) {
  const P = typeof preset === 'string' ? SKY_PRESETS[preset] : preset;
  const uniforms = {
    top: { value: new THREE.Color(P.top) }, mid: { value: new THREE.Color(P.mid) }, hor: { value: new THREE.Color(P.hor) },
    sunCol: { value: new THREE.Color(P.sun) }, sunDir: { value: new THREE.Vector3(...P.sunDir).normalize() },
    sunSize: { value: P.sunSize }, stars: { value: P.stars }, time: { value: 0 }, flare: { value: new THREE.Vector4(0, 0, 0, 0) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*p; gl_Position.z = gl_Position.w; }`,
    fragmentShader: `
      uniform vec3 top, mid, hor, sunCol, sunDir; uniform float sunSize, stars, time; uniform vec4 flare;
      varying vec3 vDir;
      float hash(vec3 p){ p = fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
      void main(){
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 c = mix(hor, mid, smoothstep(0.0, 0.18, h));
        c = mix(c, top, smoothstep(0.15, 0.75, h));
        if (h < 0.0) c = hor*0.85;
        float sd = max(dot(d, normalize(sunDir)), 0.0);
        if (sunSize > 0.0) {
          c += sunCol * pow(sd, 8.0) * 0.35 + sunCol * pow(sd, 64.0) * 0.6;
          c += sunCol * smoothstep(1.0 - sunSize*0.02, 1.0 - sunSize*0.012, sd) * 3.0;
        }
        if (stars > 0.0 && h > -0.02) {
          vec3 q = d * 420.0; vec3 id = floor(q); vec3 f = fract(q) - 0.5;
          float r = hash(id);
          float s = step(0.985, r) * smoothstep(0.32, 0.0, length(f)) * (0.6 + 0.4*sin(time*2.0 + r*80.0));
          vec3 q2 = d * 160.0; vec3 id2 = floor(q2); vec3 f2 = fract(q2)-0.5; float r2 = hash(id2+7.0);
          s += step(0.993, r2) * smoothstep(0.25, 0.0, length(f2)) * 1.6;
          float band = exp(-pow(dot(d, normalize(vec3(0.3,0.8,0.5)))*3.0, 2.0));
          c += vec3(0.08,0.09,0.14) * band * stars * 0.6;
          c += vec3(0.9,0.95,1.0) * s * stars * smoothstep(-0.02, 0.15, h);
        }
        if (flare.w > 0.0) { float fd = max(dot(d, normalize(flare.xyz)),0.0); c += vec3(1.0,0.95,0.85) * (pow(fd, 40.0)*0.6 + pow(fd, 900.0)*4.0) * flare.w; }
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 24), mat);
  m.frustumCulled = false; m.renderOrder = -10;
  m.userData.uniforms = uniforms;
  return m;
}

// ---------- OCEAN ----------
export const OCEAN_PRESETS = {
  day: { deep: '#0b3a5c', shallow: '#1f6f8f', sky: '#9fc8ea', amp: 0.6, chop: 1, spec: '#fff4d6' },
  golden: { deep: '#0a2238', shallow: '#24506a', sky: '#d89a68', amp: 0.5, chop: 1, spec: '#ffcf8a' },
  dusk: { deep: '#0c1428', shallow: '#253150', sky: '#e0805a', amp: 0.4, chop: 1, spec: '#ff9a5a' },
  night: { deep: '#01040b', shallow: '#04101f', sky: '#0b1a35', amp: 0.25, chop: 0.6, spec: '#a8c0ff' },
  glass: { deep: '#000208', shallow: '#020812', sky: '#0c1830', amp: 0.02, chop: 0.1, spec: '#c8d8ff' },
  dawn: { deep: '#1a2440', shallow: '#3d4a6a', sky: '#f0b090', amp: 0.3, chop: 0.8, spec: '#ffe2b0' },
  storm: { deep: '#141c22', shallow: '#2c3a42', sky: '#6a747d', amp: 1.2, chop: 1.4, spec: '#cccccc' },
  sepia: { deep: '#3a2a18', shallow: '#6b5030', sky: '#e8c896', amp: 0.5, chop: 1, spec: '#fff0c8' },
  river: { deep: '#1c2a26', shallow: '#3a4f45', sky: '#b8c4c8', amp: 0.08, chop: 0.4, spec: '#ffffff' },
};

export function makeOcean(preset = 'day', o = {}) {
  const P = typeof preset === 'string' ? OCEAN_PRESETS[preset] : preset;
  const size = o.size ?? 8000, seg = o.seg ?? 320;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg); geo.rotateX(-Math.PI / 2);
  const uniforms = {
    time: { value: 0 }, amp: { value: P.amp }, chop: { value: P.chop },
    deep: { value: new THREE.Color(P.deep) }, shallow: { value: new THREE.Color(P.shallow) }, skyc: { value: new THREE.Color(P.sky) },
    specCol: { value: new THREE.Color(P.spec) }, sunDir: { value: new THREE.Vector3(...(o.sunDir ?? [0.4, 0.35, -0.6])).normalize() },
    fogCol: { value: new THREE.Color(o.fog ?? P.sky) }, fogNear: { value: o.fogNear ?? 600 }, fogFar: { value: o.fogFar ?? 4200 },
    offset: { value: new THREE.Vector2() }, lights: { value: 0 }, lightPos: { value: new THREE.Vector3() }, lightLen: { value: 260 },
    flare: { value: new THREE.Vector4(0, 0, 0, 0) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, fog: false,
    vertexShader: `
      uniform float time, amp, chop; uniform vec2 offset;
      varying vec3 vW; varying vec3 vN;
      vec3 wave(vec2 p, vec2 dir, float L, float A, float sp, inout vec3 n){
        float k = 6.2831/L; float f = k*(dot(dir,p) - sp*time);
        float a = A;
        n.x -= dir.x*k*a*cos(f); n.z -= dir.y*k*a*cos(f);
        return vec3(dir.x*a*chop*0.4*cos(f), a*sin(f), dir.y*a*chop*0.4*cos(f));
      }
      void main(){
        vec3 p = position + vec3(offset.x, 0., offset.y);
        vec3 n = vec3(0.,1.,0.);
        vec3 d = vec3(0.);
        d += wave(p.xz, normalize(vec2(1.,0.3)), 60., amp*1.0, 6., n);
        d += wave(p.xz, normalize(vec2(-0.4,1.)), 31., amp*0.5, 4.5, n);
        d += wave(p.xz, normalize(vec2(0.8,-0.7)), 17., amp*0.28, 3.2, n);
        d += wave(p.xz, normalize(vec2(-0.9,-0.2)), 9., amp*0.15, 2.4, n);
        d += wave(p.xz, normalize(vec2(0.2,0.9)), 4.3, amp*0.07, 1.6, n);
        p += d;
        vW = p; vN = normalize(n);
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 deep, shallow, skyc, specCol, sunDir, fogCol, lightPos; uniform float fogNear, fogFar, time, lights, lightLen, chop; uniform vec4 flare;
      varying vec3 vW; varying vec3 vN;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
      float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
      void main(){
        vec3 V = normalize(cameraPosition - vW);
        float dist0 = length(cameraPosition - vW);
        float detail = clamp(1.0 - dist0/900.0, 0.0, 1.0);
        vec2 q = vW.xz*0.22 + vec2(time*0.35, time*0.21);
        vec2 q2 = vW.xz*0.9 + vec2(-time*0.6, time*0.4);
        vec3 pert = vec3(vnoise(q)-0.5, 0., vnoise(q+31.7)-0.5)*0.35 + vec3(vnoise(q2)-0.5, 0., vnoise(q2+11.3)-0.5)*0.25*detail;
        vec3 N = normalize(vN + pert*chop);
        float fres = 0.04 + 0.96*pow(1.0 - max(dot(N, V), 0.0), 5.0);
        vec3 R = reflect(-V, N);
        float el = clamp(R.y, 0.0, 1.0);
        vec3 skyRef = mix(skyc, skyc*0.45 + deep*0.3, pow(el, 0.6));
        vec3 body = mix(deep, shallow, clamp(0.2 + 0.6*(N.y-0.85)*4.0, 0.0, 1.0));
        vec3 col = mix(body, skyRef, clamp(fres*1.1, 0.0, 1.0));
        vec3 L = normalize(sunDir);
        vec3 H = normalize(V + L);
        float sp = pow(max(dot(N, H), 0.0), 380.0);
        float vis = smoothstep(-0.05, 0.05, L.y);
        col += specCol * sp * 6.0 * vis;
        col += specCol * pow(max(dot(R, L), 0.0), 24.0) * 0.25 * vis;
        // foam on crests
        float crest = smoothstep(0.55, 0.9, vnoise(vW.xz*0.08 + time*0.05)) * smoothstep(0.9, 0.7, N.y) * chop;
        col = mix(col, vec3(0.85,0.9,0.95)*max(0.25, skyc.g), crest*0.25);
        // ship light reflections (night)
        if (lights > 0.0) {
          vec2 rel = vW.xz - lightPos.xz;
          float along = smoothstep(lightLen*0.5, 0.0, abs(rel.x));
          float side = exp(-pow(abs(rel.y)/120.0, 1.2));
          float shimmer = 0.5 + 0.5*sin(vW.x*1.7 + vW.z*0.9 + time*3.0);
          col += vec3(1.0,0.75,0.4) * along * side * shimmer * lights * 0.35 * pow(fres+0.2, 0.6);
        }
        if (flare.w > 0.0) { float dd = length(vW.xz - flare.xz); col += vec3(1.0,0.9,0.75) * exp(-dd/250.0) * flare.w * 0.5; }
        float dist = length(cameraPosition - vW);
        float fog = smoothstep(fogNear, fogFar, dist);
        col = mix(col, fogCol, fog);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const m = new THREE.Mesh(geo, mat);
  m.frustumCulled = false;
  m.userData.uniforms = uniforms;
  // follow camera so the finite plane always surrounds it
  m.userData.follow = (cam) => { const s = size / seg; const x = Math.round(cam.position.x / s) * s, z = Math.round(cam.position.z / s) * s; m.position.set(x, 0, z); uniforms.offset.value.set(x, z); };
  return m;
}

// ---------- ICEBERG ----------
export function makeIceberg(o = {}) {
  const r = o.r ?? 30, seed = o.seed ?? 3;
  const geo = new THREE.IcosahedronGeometry(1, o.detail ?? 5);
  const pos = geo.attributes.position; const v = new THREE.Vector3();
  const R = rng(seed);
  const peaks = [...Array(3)].map(() => [R() * 2 - 1, R() * 0.6 + 0.4, R() * 2 - 1]);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    let n = fbm3(v.x * 1.6 + seed, v.y * 1.6, v.z * 1.6, 5);
    let s = 1 + n * 0.55;
    let y = v.y;
    let hgt = y > 0 ? (o.height ?? 1.1) : (o.depth ?? 1.6);
    for (const p of peaks) { const d = Math.hypot(v.x - p[0] * 0.6, v.z - p[2] * 0.6); if (y > 0) hgt += Math.max(0, 0.8 - d) * p[1] * (o.spiky ?? 0.9); }
    v.set(v.x * s * (o.sx ?? 1.2), y * s * hgt, v.z * s);
    // terraces: quantize slightly for blocky ice
    v.y = Math.round(v.y * 7) / 7 * 0.35 + v.y * 0.65;
    pos.setXYZ(i, v.x * r, v.y * r, v.z * r);
  }
  geo.computeVertexNormals();
  const cols = new Float32Array(pos.count * 3);
  const top = new THREE.Color(o.top ?? '#f4fbff'), side = new THREE.Color(o.side ?? '#9fd6ec'), under = new THREE.Color(o.under ?? '#2a8fb5');
  const nrm = geo.attributes.normal; const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / r, ny = nrm.getY(i);
    c.copy(side).lerp(top, THREE.MathUtils.clamp(ny * 0.8 + 0.3, 0, 1));
    if (y < 0) c.lerp(under, THREE.MathUtils.clamp(-y * 1.5, 0, 1));
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const geoFlat = geo.toNonIndexed(); geoFlat.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.0, flatShading: true, emissive: new THREE.Color(o.glow ?? '#0a2a3a'), emissiveIntensity: o.ei ?? 0.4, color: new THREE.Color(o.tint ?? '#ffffff') });
  const m = new THREE.Mesh(geoFlat, mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// ---------- foam / wake ----------
export function makeWake(len = 400, width = 40) {
  const tex = (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 1024; const g = c.getContext('2d');
    const R = rng(5);
    for (let i = 0; i < 2500; i++) {
      const y = R() * 1024, spread = 0.15 + (y / 1024) * 0.85;
      const x = 128 + (R() - 0.5) * 256 * spread * (R() < 0.6 ? 0.5 : 1);
      const a = (1 - y / 1024) * 0.25 * R();
      g.fillStyle = `rgba(255,255,255,${a})`; g.beginPath(); g.ellipse(x, y, 2 + R() * 10, 1 + R() * 4, 0, 0, 7); g.fill();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, len), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.9 }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

/** standard outdoor lighting rig */
export function outdoorLights(scene, o = {}) {
  const hemi = new THREE.HemisphereLight(o.sky ?? 0xbfd8ff, o.ground ?? 0x203040, o.hemi ?? 0.8); scene.add(hemi);
  const sun = new THREE.DirectionalLight(o.sun ?? 0xfff0d8, o.sunI ?? 2.2);
  const d = o.sunDir ?? [0.4, 0.35, -0.6];
  sun.position.set(d[0] * 500, d[1] * 500 + 50, d[2] * 500);
  if (o.shadow) {
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    const s = o.shadowSize ?? 200; Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 2000 });
    sun.shadow.bias = -0.0005;
  }
  scene.add(sun); scene.add(sun.target);
  return { hemi, sun };
}
