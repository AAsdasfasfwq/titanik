// Procedural sound design with the Web Audio API.
// Every cue is synthesised from oscillators + seeded noise, so the same code drives
// the realtime preview (AudioContext) and the offline render (OfflineAudioContext).
import { rng } from './lib/kit.js';

const noiseCache = new WeakMap();
function noise(ac) {
  if (noiseCache.has(ac)) return noiseCache.get(ac);
  const len = ac.sampleRate * 4;
  const r = rng(2024);
  const white = ac.createBuffer(1, len, ac.sampleRate), brown = ac.createBuffer(1, len, ac.sampleRate), pink = ac.createBuffer(1, len, ac.sampleRate);
  const w = white.getChannelData(0), b = brown.getChannelData(0), p = pink.getChannelData(0);
  let last = 0, b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) {
    const x = r() * 2 - 1; w[i] = x;
    last = (last + 0.02 * x) / 1.02; b[i] = last * 3.5;
    b0 = 0.99765 * b0 + x * 0.099046; b1 = 0.963 * b1 + x * 0.2965164; b2 = 0.57 * b2 + x * 1.0526913; p[i] = (b0 + b1 + b2 + x * 0.1848) * 0.2;
  }
  // de-click loop seams
  for (const buf of [w, b, p]) for (let i = 0; i < 2000; i++) { const k = i / 2000; buf[i] *= k; buf[len - 1 - i] *= k; }
  const res = { white, brown, pink, ir: makeIR(ac, 2.8) };
  noiseCache.set(ac, res);
  return res;
}
function makeIR(ac, sec) {
  const len = Math.floor(ac.sampleRate * sec); const buf = ac.createBuffer(2, len, ac.sampleRate); const r = rng(77);
  for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / len, 3.2) * (i < 200 ? i / 200 : 1); }
  return buf;
}

/** Output graph: master -> compressor -> destination, plus a reverb send. */
export function createMix(ac, dest, level = 0.5) {
  noise(ac);
  const master = ac.createGain(); master.gain.value = level;
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
  master.connect(comp); comp.connect(dest);
  const conv = ac.createConvolver(); conv.buffer = noise(ac).ir; const revOut = ac.createGain(); revOut.gain.value = 0.6;
  conv.connect(revOut); revOut.connect(master);
  return { master, rev: conv, comp };
}

// ---------- primitives ----------
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
function src(ac, kind = 'white', loop = true, offset = 0) { const s = ac.createBufferSource(); s.buffer = noise(ac)[kind]; s.loop = loop; s._off = offset; return s; }
function startSrc(s, t, dur) { s.start(t, (s._off ?? 0) % 3.5); if (dur != null) s.stop(t + dur + 0.05); }
function gainNode(ac, v = 0) { const g = ac.createGain(); g.gain.value = v; return g; }
function filt(ac, type, f, q = 0.7) { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }
function osc(ac, type, f) { const o = ac.createOscillator(); o.type = type; o.frequency.value = f; return o; }
function perc(p, t, peak, decay) { p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(peak, t + 0.004); p.exponentialRampToValueAtTime(0.0001, t + decay); }
function fadeBed(p, t, dur, vol, fi = 0.6, fo = 0.6) { p.setValueAtTime(0, t); p.linearRampToValueAtTime(vol, t + Math.min(fi, dur / 2)); p.setValueAtTime(vol, t + Math.max(dur - fo, dur / 2)); p.linearRampToValueAtTime(0, t + dur); }
function lfo(ac, f, depth, target, t, dur, type = 'sine') { const o = osc(ac, type, f); const g = gainNode(ac, depth); o.connect(g); g.connect(target); o.start(t); o.stop(t + dur + 0.1); return o; }
function send(ac, node, mix, amt) { if (amt > 0) { const s = gainNode(ac, amt); node.connect(s); s.connect(mix.rev); } }
function pan(ac, v) { const p = ac.createStereoPanner(); p.pan.value = v; return p; }

// ---------- synth catalogue ----------
const SY = {
  boom(ac, mix, t, c) {
    const v = c.vol ?? 1;
    const o = osc(ac, 'sine', 90); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(28, t + 1.6);
    const g = gainNode(ac); perc(g.gain, t, 0.9 * v, 3.2); o.connect(g); g.connect(mix.master); send(ac, g, mix, 0.5); o.start(t); o.stop(t + 3.3);
    const n = src(ac, 'brown'); const f = filt(ac, 'lowpass', 400); const g2 = gainNode(ac); perc(g2.gain, t, 0.7 * v, 1.8);
    n.connect(f); f.connect(g2); g2.connect(mix.master); send(ac, g2, mix, 0.6); startSrc(n, t, 2);
    const h = src(ac, 'white', true, 1.3); const hf = filt(ac, 'bandpass', 1800, 0.8); const hg = gainNode(ac); perc(hg.gain, t, 0.12 * v, 0.6); h.connect(hf); hf.connect(hg); hg.connect(mix.master); send(ac, hg, mix, 0.8); startSrc(h, t, 0.7);
  },
  hit(ac, mix, t, c) {
    const v = c.vol ?? 0.7;
    const o = osc(ac, 'sine', 160); o.frequency.setValueAtTime(c.pitch ?? 170, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.35);
    const g = gainNode(ac); perc(g.gain, t, v, 0.6); o.connect(g); g.connect(mix.master); send(ac, g, mix, 0.25); o.start(t); o.stop(t + 0.7);
    const n = src(ac, 'white', true, 0.7); const f = filt(ac, 'bandpass', 2500, 0.6); const g2 = gainNode(ac); perc(g2.gain, t, v * 0.35, 0.12); n.connect(f); f.connect(g2); g2.connect(mix.master); startSrc(n, t, 0.2);
  },
  tick(ac, mix, t, c) {
    const n = src(ac, 'white', true, (t * 7) % 3); const f = filt(ac, 'bandpass', c.freq ?? 3200, 4); const g = gainNode(ac); perc(g.gain, t, (c.vol ?? 0.5), 0.05);
    n.connect(f); f.connect(g); g.connect(mix.master); send(ac, g, mix, 0.3); startSrc(n, t, 0.08);
    const o = osc(ac, 'sine', (c.freq ?? 3200) / 3); const g2 = gainNode(ac); perc(g2.gain, t, (c.vol ?? 0.5) * 0.3, 0.04); o.connect(g2); g2.connect(mix.master); o.start(t); o.stop(t + 0.06);
  },
  ticks(ac, mix, t, c) { for (let i = 0; i < (c.n ?? 4); i++) SY.tick(ac, mix, t + i * (c.interval ?? 0.5), { freq: i % 2 ? 2400 : 3200, vol: c.vol ?? 0.35 }); },
  whoosh(ac, mix, t, c) {
    const d = c.dur ?? 0.6, v = c.vol ?? 0.35;
    const n = src(ac, 'pink', true, (t * 3) % 3); const f = filt(ac, 'bandpass', 400, 1.2); f.frequency.setValueAtTime(c.f0 ?? 250, t); f.frequency.exponentialRampToValueAtTime(c.f1 ?? 3500, t + d * 0.6); f.frequency.exponentialRampToValueAtTime(600, t + d);
    const g = gainNode(ac); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + d * 0.55); g.gain.linearRampToValueAtTime(0, t + d);
    const p = pan(ac, 0); p.pan.setValueAtTime(-0.6, t); p.pan.linearRampToValueAtTime(0.6, t + d);
    n.connect(f); f.connect(g); g.connect(p); p.connect(mix.master); send(ac, g, mix, 0.3); startSrc(n, t, d);
  },
  riser(ac, mix, t, c) {
    const d = c.dur ?? 2, v = c.vol ?? 0.25;
    const n = src(ac, 'white', true, 2.1); const f = filt(ac, 'highpass', 300, 0.7); f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(5000, t + d);
    const g = gainNode(ac); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + d * 0.95); g.gain.linearRampToValueAtTime(0, t + d + 0.05);
    n.connect(f); f.connect(g); g.connect(mix.master); send(ac, g, mix, 0.4); startSrc(n, t, d + 0.1);
    const o = osc(ac, 'sawtooth', 80); o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(320, t + d);
    const of = filt(ac, 'lowpass', 900); const og = gainNode(ac); og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(v * 0.25, t + d); og.gain.linearRampToValueAtTime(0, t + d + 0.05);
    o.connect(of); of.connect(og); og.connect(mix.master); o.start(t); o.stop(t + d + 0.1);
  },
  pop(ac, mix, t, c) {
    const f0 = c.pitch ?? 520, v = c.vol ?? 0.22;
    const o = osc(ac, 'sine', f0); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 1.9, t + 0.07);
    const g = gainNode(ac); perc(g.gain, t, v, 0.16); o.connect(g); g.connect(mix.master); send(ac, g, mix, 0.25); o.start(t); o.stop(t + 0.2);
  },
  blip(ac, mix, t, c) { SY.pop(ac, mix, t, { pitch: c.pitch ?? 1200, vol: (c.vol ?? 0.12) }); },
  type(ac, mix, t, c) {
    const r = rng(Math.floor(t * 100));
    for (let i = 0; i < (c.n ?? 8); i++) {
      const tt = t + i * (c.rate ?? 0.07) + r() * 0.02;
      const n = src(ac, 'white', true, r() * 3); const f = filt(ac, 'bandpass', 3000 + r() * 1500, 3); const g = gainNode(ac); perc(g.gain, tt, (c.vol ?? 0.3) * (0.7 + r() * 0.3), 0.04);
      n.connect(f); f.connect(g); g.connect(mix.master); startSrc(n, tt, 0.06);
      const o = osc(ac, 'square', 180 + r() * 40); const og = gainNode(ac); perc(og.gain, tt, (c.vol ?? 0.3) * 0.12, 0.03); const of = filt(ac, 'lowpass', 900); o.connect(of); of.connect(og); og.connect(mix.master); o.start(tt); o.stop(tt + 0.05);
    }
  },
  bell(ac, mix, t, c) {
    const n = c.n ?? 1, f = c.freq ?? 1150, v = c.vol ?? 0.3;
    for (let k = 0; k < n; k++) {
      const tt = t + k * (c.interval ?? 0.55);
      [[1, 1, 2.6], [2.0, 0.5, 1.6], [2.76, 0.4, 1.2], [5.4, 0.25, 0.7], [8.9, 0.12, 0.4]].forEach(([m, a, d]) => {
        const o = osc(ac, 'sine', f * m); const g = gainNode(ac); perc(g.gain, tt, v * a, d * (c.decay ?? 1)); o.connect(g); g.connect(mix.master); send(ac, g, mix, 0.5); o.start(tt); o.stop(tt + d * (c.decay ?? 1) + 0.1);
      });
    }
  },
  clank(ac, mix, t, c) {
    const v = c.vol ?? 0.25, p = c.pitch ?? 1, pn = pan(ac, c.pan ?? 0); pn.connect(mix.master);
    [[420, 0.5, 0.35], [1130, 0.35, 0.25], [2310, 0.25, 0.15], [3570, 0.15, 0.1]].forEach(([f, a, d]) => {
      const o = osc(ac, 'triangle', f * p); const g = gainNode(ac); perc(g.gain, t, v * a, d); o.connect(g); g.connect(pn); send(ac, g, mix, 0.4); o.start(t); o.stop(t + d + 0.05);
    });
    const n = src(ac, 'white', true, (t * 13) % 3); const f = filt(ac, 'highpass', 2000); const g = gainNode(ac); perc(g.gain, t, v * 0.4, 0.05); n.connect(f); f.connect(g); g.connect(pn); startSrc(n, t, 0.08);
  },
  hammers(ac, mix, t, c) {
    const r = rng(Math.floor(t * 10) + 3); const d = c.dur ?? 4; let tt = t;
    while (tt < t + d) { SY.clank(ac, mix, tt, { vol: (c.vol ?? 0.12) * (0.5 + r() * 0.5), pitch: 0.7 + r() * 0.8, pan: r() * 1.6 - 0.8 }); tt += (c.rate ?? 0.18) * (0.4 + r() * 1.2); }
  },
  horn(ac, mix, t, c) {
    const d = c.dur ?? 3, v = c.vol ?? 0.18;
    const f = filt(ac, 'lowpass', c.far ? 500 : 1100, 0.8); const g = gainNode(ac); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.25); g.gain.setValueAtTime(v, t + d - 0.4); g.gain.linearRampToValueAtTime(0, t + d);
    f.connect(g); g.connect(mix.master); send(ac, g, mix, c.far ? 1.2 : 0.6);
    for (const fr of [103.8, 130.8, 155.6]) { const o = osc(ac, 'sawtooth', fr); const vib = lfo(ac, 5, 0.6, o.frequency, t, d); void vib; o.connect(f); o.start(t); o.stop(t + d + 0.1); }
  },
  morse(ac, mix, t, c) {
    const unit = c.unit ?? 0.07, code = c.code ?? '-.-. --.- -..'; let tt = t;
    const g = gainNode(ac); g.connect(mix.master); send(ac, g, mix, 0.15);
    const o = osc(ac, 'sine', c.freq ?? 740); const f = filt(ac, 'bandpass', c.freq ?? 740, 2); o.connect(f); f.connect(g);
    g.gain.setValueAtTime(0, t);
    for (const ch of code) {
      if (ch === ' ') { tt += unit * 3; continue; }
      const len = ch === '-' ? unit * 3 : unit;
      g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(c.vol ?? 0.12, tt + 0.005); g.gain.setValueAtTime(c.vol ?? 0.12, tt + len); g.gain.linearRampToValueAtTime(0, tt + len + 0.005);
      tt += len + unit;
    }
    o.start(t); o.stop(tt + 0.1);
  },
  creak(ac, mix, t, c) {
    const d = c.dur ?? 2.5, v = c.vol ?? 0.2;
    const o = osc(ac, 'sawtooth', 45); const r = rng(Math.floor(t));
    o.frequency.setValueAtTime(40, t); for (let i = 1; i < 8; i++) o.frequency.linearRampToValueAtTime(30 + r() * 50, t + (d * i) / 8);
    const f = filt(ac, 'bandpass', 380, 6); f.frequency.setValueAtTime(250, t); f.frequency.linearRampToValueAtTime(600, t + d);
    const g = gainNode(ac); fadeBed(g.gain, t, d, v, 0.3, 0.5); o.connect(f); f.connect(g); g.connect(mix.master); send(ac, g, mix, 0.7); o.start(t); o.stop(t + d + 0.1);
  },
  tear(ac, mix, t, c) {
    const d = c.dur ?? 2.5, v = c.vol ?? 0.35;
    const n = src(ac, 'white', true, 0.4); const f = filt(ac, 'bandpass', 900, 3); const r = rng(Math.floor(t * 3));
    f.frequency.setValueAtTime(600, t); for (let i = 1; i < 12; i++) f.frequency.linearRampToValueAtTime(300 + r() * 2500, t + (d * i) / 12);
    const g = gainNode(ac); fadeBed(g.gain, t, d, v, 0.05, 0.8); n.connect(f); f.connect(g); g.connect(mix.master); send(ac, g, mix, 0.6); startSrc(n, t, d);
    SY.creak(ac, mix, t, { dur: d, vol: v * 0.8 });
    SY.boom(ac, mix, t + d * 0.6, { vol: v * 1.2 });
  },
  splash(ac, mix, t, c) {
    const v = c.vol ?? 0.3;
    const n = src(ac, 'white', true, 1.1); const f = filt(ac, 'lowpass', 2500); f.frequency.setValueAtTime(5000, t); f.frequency.exponentialRampToValueAtTime(300, t + 1.2);
    const g = gainNode(ac); perc(g.gain, t, v, 1.4); n.connect(f); f.connect(g); g.connect(mix.master); send(ac, g, mix, 0.4); startSrc(n, t, 1.5);
  },
  gunshot(ac, mix, t, c) {
    const v = c.vol ?? 0.35;
    const n = src(ac, 'white', true, 2.2); const g = gainNode(ac); perc(g.gain, t, v, 0.35); const f = filt(ac, 'lowpass', 4000); n.connect(f); f.connect(g); g.connect(mix.master); send(ac, g, mix, 1.0); startSrc(n, t, 0.4);
    const o = osc(ac, 'sine', 120); o.frequency.exponentialRampToValueAtTime(40, t + 0.2); const og = gainNode(ac); perc(og.gain, t, v * 0.8, 0.3); o.connect(og); og.connect(mix.master); o.start(t); o.stop(t + 0.35);
  },
  glass(ac, mix, t, c) {
    const v = c.vol ?? 0.25; const r = rng(Math.floor(t * 7));
    for (let i = 0; i < 26; i++) { const tt = t + r() * 0.6; const o = osc(ac, 'sine', 2500 + r() * 6000); const g = gainNode(ac); perc(g.gain, tt, v * (0.2 + r() * 0.3), 0.15 + r() * 0.4); o.connect(g); g.connect(mix.master); send(ac, g, mix, 0.6); o.start(tt); o.stop(tt + 0.6); }
    const n = src(ac, 'white', true, 0.2); const f = filt(ac, 'highpass', 3000); const g = gainNode(ac); perc(g.gain, t, v * 0.6, 0.5); n.connect(f); f.connect(g); g.connect(mix.master); startSrc(n, t, 0.6);
  },
  heartbeat(ac, mix, t, c) {
    const n = c.n ?? 4, iv = 60 / (c.bpm ?? 70), v = c.vol ?? 0.5;
    for (let i = 0; i < n; i++) for (const [dt, a] of [[0, 1], [0.18, 0.7]]) {
      const tt = t + i * iv + dt; const o = osc(ac, 'sine', 58); o.frequency.setValueAtTime(70, tt); o.frequency.exponentialRampToValueAtTime(38, tt + 0.15);
      const g = gainNode(ac); perc(g.gain, tt, v * a, 0.25); o.connect(g); g.connect(mix.master); o.start(tt); o.stop(tt + 0.3);
    }
  },
  rocket(ac, mix, t, c) {
    const v = c.vol ?? 0.2;
    const o = osc(ac, 'sine', 700); o.frequency.setValueAtTime(600, t); o.frequency.exponentialRampToValueAtTime(2200, t + 1.2);
    const g = gainNode(ac); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * 0.4, t + 0.2); g.gain.linearRampToValueAtTime(0, t + 1.25); o.connect(g); g.connect(mix.master); send(ac, g, mix, 0.6); o.start(t); o.stop(t + 1.3);
    SY.gunshot(ac, mix, t + 1.3, { vol: v * 0.9 });
  },
  implosion(ac, mix, t, c) {
    const v = c.vol ?? 0.6;
    // reverse suck
    const n = src(ac, 'brown', true, 0.3); const f = filt(ac, 'lowpass', 200); f.frequency.setValueAtTime(100, t - 1.2); f.frequency.exponentialRampToValueAtTime(2000, t);
    const g = gainNode(ac); g.gain.setValueAtTime(0, t - 1.2); g.gain.linearRampToValueAtTime(v * 0.6, t); g.gain.linearRampToValueAtTime(0, t + 0.05);
    n.connect(f); f.connect(g); g.connect(mix.master); startSrc(n, t - 1.2, 1.3);
    SY.boom(ac, mix, t, { vol: v * 1.3 });
  },
  drop(ac, mix, t, c) {
    const v = c.vol ?? 0.4, d = c.dur ?? 2;
    const o = osc(ac, 'sawtooth', 220); o.frequency.setValueAtTime(c.f0 ?? 180, t); o.frequency.exponentialRampToValueAtTime(c.f1 ?? 35, t + d);
    const f = filt(ac, 'lowpass', 600); const g = gainNode(ac); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * 0.4, t + 0.1); g.gain.linearRampToValueAtTime(0, t + d);
    o.connect(f); f.connect(g); g.connect(mix.master); send(ac, g, mix, 0.5); o.start(t); o.stop(t + d + 0.1);
  },
  shimmer(ac, mix, t, c) {
    const notes = c.notes ?? [76, 79, 83, 88, 91]; const v = c.vol ?? 0.07;
    notes.forEach((m, i) => { const tt = t + i * (c.rate ?? 0.09); const o = osc(ac, 'sine', mtof(m)); const g = gainNode(ac); perc(g.gain, tt, v, 1.8); o.connect(g); g.connect(mix.master); send(ac, g, mix, 0.9); o.start(tt); o.stop(tt + 2); });
  },
  paper(ac, mix, t, c) {
    const n = src(ac, 'white', true, (t * 5) % 3); const f = filt(ac, 'bandpass', 4500, 0.8); const g = gainNode(ac); const d = c.dur ?? 0.35;
    g.gain.setValueAtTime(0, t); const r = rng(Math.floor(t * 31)); for (let i = 0; i < 8; i++) g.gain.linearRampToValueAtTime((c.vol ?? 0.15) * r(), t + (d * i) / 8); g.gain.linearRampToValueAtTime(0, t + d);
    n.connect(f); f.connect(g); g.connect(mix.master); startSrc(n, t, d);
  },
  telegraph(ac, mix, t, c) { SY.bell(ac, mix, t, { freq: 1650, n: 2, interval: 0.22, vol: c.vol ?? 0.18, decay: 0.6 }); SY.clank(ac, mix, t - 0.05, { vol: 0.2, pitch: 0.6 }); },
  wheel(ac, mix, t, c) { const n = c.n ?? 18; for (let i = 0; i < n; i++) SY.tick(ac, mix, t + i * (c.rate ?? 0.045) * (1 + i * 0.03), { freq: 1800, vol: 0.18 }); },
  phone(ac, mix, t, c) {
    const d = c.dur ?? 1; const o = osc(ac, 'square', 30); const g = gainNode(ac); const f = filt(ac, 'bandpass', 2400, 3);
    const b = osc(ac, 'sine', 2400); const bg = gainNode(ac, 0); o.connect(bg.gain); b.connect(bg); bg.connect(f); f.connect(g); g.connect(mix.master);
    fadeBed(g.gain, t, d, c.vol ?? 0.12, 0.01, 0.05); o.start(t); b.start(t); o.stop(t + d); b.stop(t + d);
  },
  sonar(ac, mix, t, c) { const o = osc(ac, 'sine', c.freq ?? 1300); const g = gainNode(ac); perc(g.gain, t, c.vol ?? 0.12, 2.5); o.connect(g); g.connect(mix.master); send(ac, g, mix, 1.5); o.start(t); o.stop(t + 2.6); },
  bubbles(ac, mix, t, c) {
    const r = rng(Math.floor(t * 9)); const d = c.dur ?? 1.5;
    for (let i = 0; i < (c.n ?? 14); i++) { const tt = t + r() * d; const f0 = 300 + r() * 900; const o = osc(ac, 'sine', f0); o.frequency.setValueAtTime(f0, tt); o.frequency.exponentialRampToValueAtTime(f0 * 2.2, tt + 0.08); const g = gainNode(ac); perc(g.gain, tt, (c.vol ?? 0.06) * (0.5 + r()), 0.1); o.connect(g); g.connect(mix.master); send(ac, g, mix, 0.5); o.start(tt); o.stop(tt + 0.12); }
  },
  gavel(ac, mix, t, c) { for (let i = 0; i < (c.n ?? 2); i++) { SY.hit(ac, mix, t + i * 0.32, { pitch: 300, vol: 0.4 }); SY.clank(ac, mix, t + i * 0.32, { vol: 0.08, pitch: 0.4 }); } },
  stamp(ac, mix, t, c) { SY.hit(ac, mix, t, { pitch: 130, vol: c.vol ?? 0.6 }); SY.paper(ac, mix, t, { vol: 0.15, dur: 0.2 }); },
  cheer(ac, mix, t, c) { SY.amb(ac, mix, t, { kind: 'crowd', dur: c.dur ?? 3, vol: (c.vol ?? 0.3) * 1.6 }); },
  thump(ac, mix, t, c) { SY.hit(ac, mix, t, { pitch: 90, vol: c.vol ?? 0.5 }); },
  swell(ac, mix, t, c) { // reverse-cymbal-ish swell that peaks at t + dur
    const d = c.dur ?? 1.5; const n = src(ac, 'white', true, 1.7); const f = filt(ac, 'bandpass', 3000, 0.5); const g = gainNode(ac);
    g.gain.setValueAtTime(0, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.01); g.gain.linearRampToValueAtTime(c.vol ?? 0.18, t + d); g.gain.linearRampToValueAtTime(0, t + d + 0.03);
    n.connect(f); f.connect(g); g.connect(mix.master); send(ac, g, mix, 0.5); startSrc(n, t, d + 0.1);
  },

  // ---------- beds ----------
  amb(ac, mix, t, c) {
    const d = c.dur, v = c.vol ?? 1, out = gainNode(ac); fadeBed(out.gain, t, d, 1, c.fi ?? 0.5, c.fo ?? 0.5); out.connect(mix.master);
    const K = c.kind;
    const noiseBand = (kind, type, f, q, vol, lf = 0, ld = 0, off = 0) => { const n = src(ac, kind, true, off); const fl = filt(ac, type, f, q); const g = gainNode(ac, vol * v); n.connect(fl); fl.connect(g); g.connect(out); startSrc(n, t, d); if (lf) lfo(ac, lf, vol * v * ld, g.gain, t, d); return { fl, g }; };
    if (K === 'ocean') { noiseBand('brown', 'lowpass', 500, 0.5, 0.35, 0.09, 0.6); noiseBand('pink', 'bandpass', 1800, 0.6, 0.03, 0.13, 0.8, 1.3); }
    if (K === 'night') { noiseBand('brown', 'lowpass', 300, 0.5, 0.15, 0.06, 0.5); noiseBand('pink', 'bandpass', 900, 0.8, 0.02, 0.1, 0.9, 2.1); }
    if (K === 'wind') { const a = noiseBand('pink', 'bandpass', 600, 1.2, 0.12, 0.11, 0.7); lfo(ac, 0.07, 250, a.fl.frequency, t, d); noiseBand('brown', 'lowpass', 200, 0.5, 0.12); }
    if (K === 'room') { noiseBand('brown', 'lowpass', 250, 0.5, 0.06); const h = osc(ac, 'sine', 50); const hg = gainNode(ac, 0.01 * v); h.connect(hg); hg.connect(out); h.start(t); h.stop(t + d + 0.1); }
    if (K === 'crowd') { [420, 850, 1500].forEach((f, i) => noiseBand('pink', 'bandpass', f, 2.2, 0.09, 0.4 + i * 0.37, 0.6, i * 0.9)); noiseBand('brown', 'lowpass', 300, 0.5, 0.08); }
    if (K === 'yard') { noiseBand('brown', 'lowpass', 160, 0.5, 0.25, 0.2, 0.3); SY.hammers(ac, { ...mix, master: out }, t + 0.1, { dur: d - 0.3, rate: 0.16, vol: 0.09 * v }); }
    if (K === 'boiler') { noiseBand('brown', 'lowpass', 140, 0.6, 0.5, 0.5, 0.3); noiseBand('pink', 'bandpass', 260, 1.5, 0.12, 2.1, 0.5, 0.6); const o = osc(ac, 'sine', 42); const og = gainNode(ac, 0.08 * v); o.connect(og); og.connect(out); lfo(ac, 1.6, 0.06 * v, og.gain, t, d, 'square'); o.start(t); o.stop(t + d + 0.1); }
    if (K === 'engine') { const o = osc(ac, 'sine', 48); const og = gainNode(ac, 0.05 * v); o.connect(og); og.connect(out); lfo(ac, 1.4, 0.05 * v, og.gain, t, d); o.start(t); o.stop(t + d + 0.1); noiseBand('brown', 'lowpass', 180, 0.5, 0.15); }
    if (K === 'underwater') { noiseBand('brown', 'lowpass', 160, 0.7, 0.45, 0.05, 0.4); const o = osc(ac, 'sine', 36); const og = gainNode(ac, 0.05 * v); o.connect(og); og.connect(out); o.start(t); o.stop(t + d + 0.1); for (let k = 1; k < d - 1; k += 3.3) SY.bubbles(ac, { ...mix, master: out }, t + k, { n: 6, dur: 1, vol: 0.04 }); }
    if (K === 'rain') { noiseBand('white', 'highpass', 2500, 0.5, 0.06, 0.3, 0.3); noiseBand('pink', 'bandpass', 1200, 0.5, 0.08, 0.2, 0.2, 1.7); noiseBand('brown', 'lowpass', 200, 0.5, 0.12); }
    if (K === 'radio') { noiseBand('white', 'bandpass', 2600, 1.4, 0.03, 7.3, 0.9); noiseBand('brown', 'lowpass', 300, 0.5, 0.05); }
    if (K === 'water') { noiseBand('brown', 'lowpass', 900, 0.6, 0.5, 0.7, 0.4); noiseBand('pink', 'bandpass', 1500, 0.7, 0.12, 1.3, 0.5, 2.2); }
    if (K === 'dark') { const o = osc(ac, 'sine', 41.2); const og = gainNode(ac, 0.08 * v); o.connect(og); og.connect(out); o.start(t); o.stop(t + d + 0.1); noiseBand('brown', 'lowpass', 120, 0.5, 0.15, 0.05, 0.5); }
    if (K === 'city') { noiseBand('brown', 'lowpass', 250, 0.5, 0.2, 0.1, 0.3); noiseBand('pink', 'bandpass', 700, 1.5, 0.04, 0.3, 0.6, 0.8); SY.hammers(ac, { ...mix, master: out }, t + 0.5, { dur: d - 1, rate: 0.9, vol: 0.03 * v }); }
  },
  pad(ac, mix, t, c) {
    const d = c.dur, v = (c.vol ?? 0.035);
    const f = filt(ac, 'lowpass', c.cutoff ?? 900, 0.5); const g = gainNode(ac); const att = c.att ?? 2.2;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + att); g.gain.setValueAtTime(v, t + d - 0.01); g.gain.linearRampToValueAtTime(0, t + d + (c.rel ?? 2.5));
    f.connect(g); g.connect(mix.master); send(ac, g, mix, 0.9);
    lfo(ac, 0.08, (c.cutoff ?? 900) * 0.25, f.frequency, t, d + 3);
    c.notes.forEach((m, i) => {
      for (const det of [-7, 6]) { const o = osc(ac, c.wave ?? 'sawtooth', mtof(m)); o.detune.value = det + i; o.connect(f); o.start(t); o.stop(t + d + (c.rel ?? 2.5) + 0.1); }
    });
    if (c.sub !== false) { const o = osc(ac, 'sine', mtof(c.notes[0] - 12)); const sg = gainNode(ac, 0); sg.gain.setValueAtTime(0, t); sg.gain.linearRampToValueAtTime(v * 2.2, t + att); sg.gain.setValueAtTime(v * 2.2, t + d); sg.gain.linearRampToValueAtTime(0, t + d + 2); o.connect(sg); sg.connect(mix.master); o.start(t); o.stop(t + d + 2.6); }
  },
  pulse(ac, mix, t, c) { // low rhythmic ostinato for tension/industry
    const d = c.dur, iv = 60 / (c.bpm ?? 90); let tt = t; let i = 0;
    while (tt < t + d) { const m = c.notes[i % c.notes.length]; const o = osc(ac, 'triangle', mtof(m)); const f = filt(ac, 'lowpass', 500); const g = gainNode(ac); perc(g.gain, tt, (c.vol ?? 0.06) * (i % 4 === 0 ? 1 : 0.6), iv * 0.9); o.connect(f); f.connect(g); g.connect(mix.master); send(ac, g, mix, 0.3); o.start(tt); o.stop(tt + iv); tt += iv / (c.div ?? 2); i++; }
  },
  melody(ac, mix, t, c) {
    const instr = c.instr ?? 'violin';
    for (const [m, st, dur] of c.notes) {
      const tt = t + st * (c.beat ?? 0.5), d = dur * (c.beat ?? 0.5);
      const v = c.vol ?? 0.05;
      if (instr === 'violin' || instr === 'cello') {
        const f = filt(ac, 'lowpass', instr === 'cello' ? 900 : 2200, 1); const g = gainNode(ac);
        g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(v, tt + 0.12); g.gain.setValueAtTime(v * 0.85, tt + d * 0.8); g.gain.linearRampToValueAtTime(0, tt + d + 0.25);
        f.connect(g); g.connect(mix.master); send(ac, g, mix, 0.8);
        for (const det of [-4, 5]) { const o = osc(ac, 'sawtooth', mtof(m)); o.detune.value = det; lfo(ac, 5.5, 3.5, o.frequency, tt, d + 0.3); o.connect(f); o.start(tt); o.stop(tt + d + 0.3); }
      } else { // piano / celesta
        const g = gainNode(ac); perc(g.gain, tt, v, instr === 'celesta' ? 1.5 : 2.2); g.connect(mix.master); send(ac, g, mix, 0.6);
        for (const [k, a] of [[1, 1], [2, 0.3], [3, 0.12]]) { const o = osc(ac, instr === 'celesta' ? 'sine' : 'triangle', mtof(m) * k); const og = gainNode(ac, a); o.connect(og); og.connect(g); o.start(tt); o.stop(tt + 2.4); }
      }
    }
  },
};

export function playCue(ac, mix, cue, when) {
  const fn = SY[cue.type];
  if (!fn) { console.warn('unknown cue', cue.type); return; }
  try { fn(ac, mix, when, cue); } catch (e) { console.warn('cue failed', cue, e); }
}

// ---------- music direction ----------
const CH = {
  Dm9: [50, 57, 62, 64, 69], Bb: [46, 53, 58, 62, 65], F: [41, 53, 57, 60, 65], C: [48, 55, 60, 64, 67], Am: [45, 52, 57, 60, 64], G: [43, 50, 55, 59, 62],
  D: [50, 57, 62, 66, 69], A: [45, 52, 57, 61, 64], Bm: [47, 54, 59, 62, 66], Gmaj: [43, 50, 55, 59, 62], Em: [40, 52, 55, 59, 64],
  Ebmaj7: [51, 58, 62, 65, 70], Abmaj7: [44, 51, 55, 60, 63], Cm: [48, 55, 60, 63, 67], Ab: [44, 51, 56, 60, 63], Eb: [51, 58, 63, 67, 70], Fm: [41, 53, 56, 60, 65],
  Gm: [43, 50, 55, 58, 62], A7: [45, 52, 57, 61, 67], Dsus: [50, 57, 62, 67, 69], Ddark: [38, 45, 50, 51, 57], Cluster: [40, 47, 52, 53, 58], Low: [33, 40, 45, 46], Abyss: [29, 36, 41, 42],
};
export const MOODS = {
  mystery: { chords: ['Dm9', 'Bb', 'Dm9', 'Gm'], cutoff: 800, vol: 0.03 },
  grand: { chords: ['D', 'Bm', 'Gmaj', 'A'], cutoff: 1100, vol: 0.03 },
  industry: { chords: ['Am', 'F', 'Am', 'G'], cutoff: 700, vol: 0.028, pulse: { notes: [33, 33, 40, 33], bpm: 100 } },
  wonder: { chords: ['Ebmaj7', 'Abmaj7', 'Cm', 'Bb'], cutoff: 1200, vol: 0.03 },
  voyage: { chords: ['C', 'Am', 'F', 'G'], cutoff: 1100, vol: 0.03 },
  unease: { chords: ['Dm9', 'Ddark', 'Bb', 'A7'], cutoff: 700, vol: 0.03 },
  tension: { chords: ['Cluster', 'Ddark'], cutoff: 600, vol: 0.032, pulse: { notes: [26, 26], bpm: 72, div: 1 } },
  impact: { chords: ['Low', 'Cluster'], cutoff: 500, vol: 0.035 },
  dread: { chords: ['Dm9', 'Bb', 'Gm', 'A7'], cutoff: 750, vol: 0.032 },
  tragic: { chords: ['Cm', 'Ab', 'Eb', 'Bb'], cutoff: 850, vol: 0.032 },
  sinking: { chords: ['Low', 'Cluster', 'Abyss'], cutoff: 500, vol: 0.04, pulse: { notes: [26, 26, 26, 25], bpm: 60, div: 1 } },
  cold: { chords: ['Em', 'Cluster'], cutoff: 1400, vol: 0.022, wave: 'triangle' },
  hope: { chords: ['F', 'C', 'Am', 'Bb'], cutoff: 1200, vol: 0.03 },
  mourning: { chords: ['Am', 'F', 'C', 'G'], cutoff: 900, vol: 0.03 },
  resolve: { chords: ['D', 'A', 'Bm', 'Gmaj'], cutoff: 1100, vol: 0.03 },
  abyss: { chords: ['Abyss', 'Low'], cutoff: 400, vol: 0.04 },
  legacy: { chords: ['Ebmaj7', 'Bb', 'Cm', 'Abmaj7'], cutoff: 1100, vol: 0.03 },
  warning: { chords: ['Dm9', 'Ddark', 'Cluster', 'Ddark'], cutoff: 700, vol: 0.032, pulse: { notes: [26, 26, 26, 26], bpm: 84 } },
  silent: null,
};

/** turn music sections [{t0,t1,mood}] into pad cues */
export function musicCues(sections) {
  const cues = [];
  for (const s of sections) {
    const M = MOODS[s.mood]; if (!M) continue;
    const len = s.chordLen ?? 8.5;
    let i = 0;
    for (let t = s.t0; t < s.t1 - 1; t += len, i++) {
      const d = Math.min(len, s.t1 - t);
      cues.push({ t, type: 'pad', dur: d, notes: CH[M.chords[i % M.chords.length]], cutoff: M.cutoff, vol: (M.vol) * (s.vol ?? 1), wave: M.wave, att: i === 0 ? 2.5 : 1.5, rel: 2.2 });
    }
    if (M.pulse && s.pulse !== false) cues.push({ t: s.t0 + 0.5, type: 'pulse', dur: s.t1 - s.t0 - 1, notes: M.pulse.notes, bpm: M.pulse.bpm, div: M.pulse.div, vol: 0.05 * (s.vol ?? 1) });
  }
  return cues;
}

export const SYNTHS = SY;

/** approximate audible length of a cue in seconds (used to free finished nodes) */
export function cueLen(c) {
  switch (c.type) {
    case 'melody': return Math.max(...c.notes.map(([, st, d]) => (st + d) * (c.beat ?? 0.5))) + 3;
    case 'heartbeat': return (c.n ?? 4) * 60 / (c.bpm ?? 70) + 1;
    case 'ticks': return (c.n ?? 4) * (c.interval ?? 0.5) + 0.5;
    case 'type': return (c.n ?? 8) * (c.rate ?? 0.07) + 0.5;
    case 'bell': return (c.n ?? 1) * (c.interval ?? 0.55) + 3 * (c.decay ?? 1);
    case 'morse': return (c.code ?? '').length * (c.unit ?? 0.07) * 4 + 0.5;
    case 'wheel': return (c.n ?? 18) * (c.rate ?? 0.045) * 2 + 0.5;
    case 'tear': case 'creak': case 'riser': case 'drop': case 'swell': return (c.dur ?? 2.5) + 3;
    default: return (c.dur ?? 3) + 3;
  }
}
