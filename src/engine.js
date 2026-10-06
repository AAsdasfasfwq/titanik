// Rendering engine: WebGL scene + bloom + 2D overlay compositing, timeline & captions.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { disposeObject, clamp } from './lib/kit.js';
import { resetPeopleCache } from './lib/people.js';
import { buildCaptions, drawCaptions } from './captions.js';

export const W = 1920, H = 1080;

const FinalShader = {
  uniforms: {
    tDiffuse: { value: null }, tOverlay: { value: null }, time: { value: 0 }, res: { value: new THREE.Vector2(W, H) },
    vignette: { value: 0.45 }, grain: { value: 0.05 }, aberration: { value: 0.0015 }, fade: { value: 0 }, flash: { value: 0 }, zoomBlur: { value: 0 },
    saturation: { value: 1.1 }, contrast: { value: 1.05 }, tint: { value: new THREE.Vector3(1, 1, 1) }, lift: { value: new THREE.Vector3(0, 0, 0) },
    letterbox: { value: 0 }, overlayUnder: { value: 0 }, flicker: { value: 0 }, mono: { value: 0 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse, tOverlay; uniform vec2 res; uniform float time, vignette, grain, aberration, fade, flash, zoomBlur, saturation, contrast, letterbox, flicker, mono;
    uniform vec3 tint, lift; varying vec2 vUv;
    float hash(vec2 p){ p = fract(p*vec2(443.897,441.423)); p += dot(p, p.yx+19.19); return fract((p.x+p.y)*p.x); }
    vec3 scene(vec2 uv){ vec2 d = uv-0.5; float r = aberration*(0.5+dot(d,d)*4.0); return vec3(texture2D(tDiffuse, uv-d*r).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv+d*r).b); }
    void main(){
      vec2 uv = vUv; vec3 col;
      if (zoomBlur > 0.001) { col = vec3(0.); for (int i=0;i<12;i++){ float k = float(i)/11.0; col += scene(mix(uv, vec2(0.5), k*zoomBlur*0.25)); } col/=12.0; }
      else col = scene(uv);
      float l = dot(col, vec3(0.2126,0.7152,0.0722));
      col = mix(vec3(l), col, saturation * (1.0 - mono));
      col = (col - 0.5)*contrast + 0.5;
      col = col*tint + lift;
      vec2 d = (uv-0.5)*vec2(1.0, 0.85);
      col *= mix(1.0, smoothstep(0.85, 0.15, length(d)*1.25), vignette);
      vec4 o = texture2D(tOverlay, uv);
      col = mix(col, o.rgb, o.a);
      float n = hash(uv*res + fract(time*13.37)*100.0) - 0.5;
      col += n*grain;
      col *= 1.0 - flicker*(0.5+0.5*sin(time*60.0))*0.08;
      col = mix(col, vec3(0.0), clamp(fade,0.0,1.0));
      col = mix(col, vec3(1.0), clamp(flash,0.0,1.0));
      if (uv.y < letterbox || uv.y > 1.0-letterbox) col = vec3(0.0);
      gl_FragColor = vec4(clamp(col,0.0,1.0), 1.0);
    }`,
};

export const DEFAULT_FX = () => ({
  bloom: 0.55, bloomRadius: 0.45, bloomThreshold: 0.82, exposure: 1.0, vignette: 0.5, grain: 0.022, aberration: 0.0016,
  saturation: 1.12, contrast: 1.06, tint: [1, 1, 1], lift: [0, 0, 0], fade: 0, flash: 0, zoomBlur: 0, letterbox: 0, flicker: 0, mono: 0,
  captions: true, captionStyle: 'default',
});

export class Engine {
  constructor(canvas, { script, scenes, duration }) {
    this.canvas = canvas;
    this.script = script;
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' }));
    r.setPixelRatio(1); r.setSize(W, H, false);
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(r, rt);
    this.black = new THREE.Scene(); this.black.background = new THREE.Color(0);
    this.dummyCam = new THREE.PerspectiveCamera();
    this.renderPass = new RenderPass(this.black, this.dummyCam);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.5, 0.4, 0.85);
    this.output = new OutputPass();
    this.final = new ShaderPass(FinalShader);
    this.composer.addPass(this.renderPass); this.composer.addPass(this.bloom); this.composer.addPass(this.output); this.composer.addPass(this.final);
    // overlay canvas
    this.ov = document.createElement('canvas'); this.ov.width = W; this.ov.height = H;
    this.g = this.ov.getContext('2d');
    this.ovTex = new THREE.CanvasTexture(this.ov); this.ovTex.colorSpace = THREE.NoColorSpace; this.ovTex.flipY = true;
    this.ovTex.minFilter = THREE.LinearFilter; this.ovTex.generateMipmaps = false;
    this.final.uniforms.tOverlay.value = this.ovTex;
    // environment map for reflections
    const pm = new THREE.PMREMGenerator(r);
    this.envMap = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    // timeline
    this.duration = duration;
    this.segs = script.segments;
    this.scenes = this.compile(scenes);
    this.captions = buildCaptions(script);
    this.built = new Map();
    this.showCaptions = true;
  }

  T(id) { return this.segs[id].start; }
  E(id) { return this.segs[id].end; }
  /** absolute time of word wi inside segment id (negative index counts from end) */
  WT(id, wi) { const w = this.segs[id].words; const k = wi < 0 ? w.length + wi : wi; return w[Math.max(0, Math.min(w.length - 1, k))].start; }
  /** time of the first word matching regex in segment id */
  find(id, re) {
    if (!this._merged) this._merged = this.segs.map((sg) => sg.words.reduce((acc, w) => { if (!w.word.startsWith(' ') && acc.length) acc[acc.length - 1].word += w.word.trim(); else acc.push({ word: w.word.trim(), start: w.start }); return acc; }, []));
    const w = this._merged[id].find((x) => re.test(x.word)); return w ? w.start : this.segs[id].start;
  }

  compile(defs) {
    const LEAD = 0.12;
    const list = defs.map((d) => ({ ...d, start: d.at != null ? (typeof d.at === 'function' ? d.at(this) : d.at) : d.seg === 0 ? 0 : this.T(d.seg) - (d.lead ?? LEAD) }));
    list.sort((a, b) => a.start - b.start);
    list.forEach((s, i) => { s.index = i; s.end = i + 1 < list.length ? list[i + 1].start : this.duration; s.dur = s.end - s.start; });
    return list;
  }

  sceneAt(t) {
    const L = this.scenes; let lo = 0, hi = L.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (L[m].start <= t) lo = m; else hi = m - 1; }
    return L[lo];
  }

  /** helper object passed to scene callbacks */
  ctx(sc, t) {
    const self = this; const lt = t - sc.start;
    return {
      t, lt, dur: sc.dur, p: clamp(lt / sc.dur), W, H, start: sc.start,
      at: (id) => self.T(id) - sc.start, end: (id) => self.E(id) - sc.start,
      wt: (id, wi) => self.WT(id, wi) - sc.start, find: (id, re) => self.find(id, re) - sc.start,
      engine: self,
    };
  }

  ensure(sc) {
    if (this.built.has(sc.index)) return this.built.get(sc.index);
    const st = sc.build ? sc.build({ THREE, W, H, envMap: this.envMap, engine: this, S: this.ctx(sc, sc.start) }) || {} : {};
    this.built.set(sc.index, st);
    // keep memory bounded: dispose scenes that are far away
    for (const [k, v] of this.built) {
      if (Math.abs(k - sc.index) > 1) {
        const seen = new Set();
        const drop = (o) => { if (o && o.isScene && !seen.has(o)) { seen.add(o); disposeObject(o); } };
        drop(v.scene); for (const val of Object.values(v)) { drop(val); if (val && typeof val === 'object' && !val.isObject3D) drop(val.scene); }
        if (v.dispose) v.dispose(); this.built.delete(k);
      }
    }
    if (this.built.size <= 1) resetPeopleCache();
    return st;
  }

  frame(t) {
    const sc = this.sceneAt(t);
    const st = this.ensure(sc);
    const S = this.ctx(sc, t);
    const fx = (S.fx = DEFAULT_FX());
    Object.assign(fx, sc.fx || {});
    // transitions at cut
    const tr = sc.trans ?? 'cut';
    if (tr === 'fade') fx.fade = Math.max(fx.fade, 1 - clamp(S.lt / 0.5));
    if (tr === 'whip') { fx.zoomBlur = Math.max(fx.zoomBlur, 1 - clamp(S.lt / 0.3)); fx.flash = Math.max(fx.flash, 0.25 * (1 - clamp(S.lt / 0.15))); }
    if (tr === 'flash') fx.flash = Math.max(fx.flash, 1 - clamp(S.lt / 0.35));
    if (tr === 'dip') fx.fade = Math.max(fx.fade, 1 - clamp(S.lt / 0.25));
    if (sc.out === 'fade') fx.fade = Math.max(fx.fade, clamp((S.lt - (sc.dur - 0.4)) / 0.4));
    // update scene
    if (sc.update) sc.update(st, S);
    // 2D overlay
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.globalAlpha = 1; g.filter = 'none';
    if (sc.draw) { g.save(); sc.draw(st, g, S); g.restore(); }
    if (fx.captions && this.showCaptions) drawCaptions(g, this.captions, t, fx);
    this.ovTex.needsUpdate = true;
    // 3D
    if (st.scene && st.camera) {
      st.camera.aspect = W / H; st.camera.updateProjectionMatrix();
      this.renderPass.scene = st.scene; this.renderPass.camera = st.camera;
    } else { this.renderPass.scene = this.black; this.renderPass.camera = this.dummyCam; }
    this.renderer.toneMappingExposure = fx.exposure;
    this.bloom.strength = fx.bloom * 0.75; this.bloom.radius = fx.bloomRadius; this.bloom.threshold = Math.max(0.95, fx.bloomThreshold + 0.45);
    const u = this.final.uniforms;
    u.time.value = t; u.vignette.value = fx.vignette; u.grain.value = Math.min(fx.grain, 0.05) * 0.5; u.aberration.value = fx.aberration; u.fade.value = fx.fade; u.flash.value = fx.flash;
    u.zoomBlur.value = fx.zoomBlur; u.saturation.value = fx.saturation; u.contrast.value = fx.contrast; u.tint.value.set(...fx.tint); u.lift.value.set(...fx.lift);
    u.letterbox.value = fx.letterbox; u.flicker.value = fx.flicker; u.mono.value = fx.mono;
    this.composer.render();
    return sc;
  }
}
