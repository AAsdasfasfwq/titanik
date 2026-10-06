// Entry point: preview player (realtime) and deterministic render API for Puppeteer.
import { Engine } from './engine.js';
import { SCENES, MUSIC } from './scenes/index.js';
import { createMix, playCue, musicCues, cueLen } from './audio.js';

const params = new URLSearchParams(location.search);
const RENDER = params.has('render');
if (RENDER) document.body.classList.add('render');

const FONTS = ['700 40px Oswald', '500 40px Oswald', '400 40px Oswald', '300 40px Oswald', '800 40px Inter', '600 40px Inter', '400 40px Inter', '900 40px Inter',
  'italic 500 40px "Playfair Display"', 'italic 800 40px "Playfair Display"', '800 40px "Playfair Display"', '500 40px "Playfair Display"', '400 40px "Bebas Neue"', '400 40px "Special Elite"'];
await Promise.all(FONTS.map((f) => document.fonts.load(f)));
const script = await (await fetch('assets/script.json')).json();
const segs = script.segments;
const DURATION = segs[segs.length - 1].end + 3.2;

const canvas = document.getElementById('c');
const engine = new Engine(canvas, { script, scenes: SCENES, duration: DURATION });
if (params.has('nocaptions')) engine.showCaptions = false;

// ---------- sound cue list ----------
export function collectCues() {
  const cues = [];
  for (const sc of engine.scenes) {
    const S = engine.ctx(sc, sc.start);
    if (sc.amb) for (const a of [].concat(sc.amb)) { const A = typeof a === 'string' ? { kind: a } : a; cues.push({ t: sc.start, type: 'amb', dur: sc.dur + 0.4, vol: sc.ambVol ?? 1, ...A }); }
    if (sc.sfx) for (const c of sc.sfx(S)) if (c) cues.push({ ...c, t: sc.start + c.t });
  }
  const secs = MUSIC.map((m, i) => ({ ...m, t0: m.seg === 0 ? 0 : engine.T(m.seg) - 0.3 }));
  secs.forEach((s, i) => { s.t1 = i + 1 < secs.length ? secs[i + 1].t0 + 1.5 : DURATION; });
  cues.push(...musicCues(secs));
  cues.sort((a, b) => a.t - b.t);
  return cues;
}
const CUES = collectCues();

/** schedules cues into an audio context, each through its own output so it can be disconnected when finished */
function cueScheduler(ac, mix, offset = 0) {
  let idx = 0; const live = [];
  const play = (c, when) => {
    const out = ac.createGain(); out.connect(mix.master);
    const rv = ac.createGain(); rv.connect(mix.rev);
    playCue(ac, { master: out, rev: rv, comp: mix.comp }, c, when);
    live.push({ out, rv, end: when + cueLen(c) + 6 });
  };
  return {
    play,
    seek(t) { idx = 0; while (idx < CUES.length && CUES[idx].t < t) idx++; },
    until(T) { while (idx < CUES.length && CUES[idx].t < T) { const c = CUES[idx++]; play(c, Math.max(ac.currentTime + 0.005, c.t + offset)); } },
    cleanup(now) { for (let i = live.length - 1; i >= 0; i--) if (live[i].end < now) { live[i].out.disconnect(); live[i].rv.disconnect(); live.splice(i, 1); } },
  };
}

// ---------- render API (used by render.js) ----------
window.__T = {
  duration: DURATION,
  scenes: engine.scenes.map((s) => ({ name: s.name, start: s.start, end: s.end })),
  frame(t, quality = 0.92) { engine.frame(t); return canvas.toDataURL('image/jpeg', quality); },
  frameOnly(t) { engine.frame(t); return true; },
  async renderAudio(sampleRate = 48000, level = 0.5) {
    const len = Math.ceil(DURATION * sampleRate);
    const ac = new OfflineAudioContext(2, len, sampleRate);
    const mix = createMix(ac, ac.destination, level);
    // Create nodes lazily (a few seconds ahead) and disconnect finished cues, so the graph stays small.
    const STEP = 2, AHEAD = 2.5;
    const sched = cueScheduler(ac, mix);
    sched.until(STEP + AHEAD);
    for (let s = STEP; s < DURATION; s += STEP) {
      ac.suspend(s).then(() => { sched.cleanup(ac.currentTime); sched.until(ac.currentTime + STEP + AHEAD); ac.resume(); });
    }
    const buf = await ac.startRendering();
    const L = buf.getChannelData(0), R = buf.getChannelData(1);
    const pcm = new Int16Array(len * 2);
    for (let i = 0; i < len; i++) { pcm[i * 2] = Math.max(-1, Math.min(1, L[i])) * 32767; pcm[i * 2 + 1] = Math.max(-1, Math.min(1, R[i])) * 32767; }
    window.__pcm = new Uint8Array(pcm.buffer);
    return window.__pcm.length;
  },
  audioChunk(offset, size) {
    const sub = window.__pcm.subarray(offset, offset + size);
    let s = ''; const CH = 0x8000;
    for (let i = 0; i < sub.length; i += CH) s += String.fromCharCode.apply(null, sub.subarray(i, i + CH));
    return btoa(s);
  },
  cues: CUES.length,
};
document.getElementById('loading').remove();

if (RENDER) {
  window.__ready = true;
} else {
  // ---------- realtime preview ----------
  const vo = document.getElementById('vo');
  const btn = document.getElementById('play'), seek = document.getElementById('seek'), timeEl = document.getElementById('time'), sceneEl = document.getElementById('scene');
  const capEl = document.getElementById('cap'), volEl = document.getElementById('vol');
  seek.max = DURATION;
  let playing = false, t = +(params.get('t') || 0), wall0 = 0, t0 = 0;
  let ac = null, mix = null, bus = null, sched = null;
  const fmtT = (x) => `${Math.floor(x / 60)}:${(x % 60).toFixed(1).padStart(4, '0')}`;

  function startAudio() {
    if (!ac) ac = new AudioContext();
    ac.resume();
    bus = ac.createGain(); bus.gain.value = +volEl.value; bus.connect(ac.destination);
    mix = createMix(ac, bus, 0.5);
    sched = cueScheduler(ac, mix, ac.currentTime + 0.05 - t); // song time -> context time
    // beds already running at this point: start them now for their remaining duration
    for (const c of CUES) {
      if ((c.type === 'amb' || c.type === 'pad' || c.type === 'pulse') && c.t < t && c.t + c.dur > t + 0.3) sched.play({ ...c, t, dur: c.t + c.dur - t, att: 0.3, fi: 0.3 }, ac.currentTime + 0.05);
    }
    sched.seek(t);
  }
  function stopAudio() { if (bus) { const b = bus; b.gain.setTargetAtTime(0, ac.currentTime, 0.05); setTimeout(() => b.disconnect(), 400); bus = null; } }
  function schedule() {
    if (!bus) return;
    sched.until(t + 0.8);
    sched.cleanup(ac.currentTime);
  }
  function play() {
    playing = true; btn.textContent = '❚❚ Pause';
    vo.currentTime = Math.min(t, vo.duration || t); vo.play().catch(() => {});
    wall0 = performance.now(); t0 = t; startAudio();
  }
  function pause() { playing = false; btn.textContent = '▶ Play'; vo.pause(); stopAudio(); }
  btn.onclick = () => (playing ? pause() : play());
  seek.oninput = () => { const was = playing; if (was) pause(); t = +seek.value; if (was) play(); };
  capEl.onchange = () => (engine.showCaptions = capEl.checked);
  volEl.oninput = () => { if (bus) bus.gain.value = +volEl.value; };
  addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); btn.onclick(); }
    if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') { const was = playing; if (was) pause(); t = Math.max(0, Math.min(DURATION, t + (e.code === 'ArrowRight' ? 5 : -5))); if (was) play(); }
    if (e.code === 'PageDown' || e.code === 'PageUp') { const sc = engine.sceneAt(t); const n = engine.scenes[sc.index + (e.code === 'PageDown' ? 1 : -1)]; if (n) { const was = playing; if (was) pause(); t = n.start + 0.01; if (was) play(); } }
  });
  function loop() {
    if (playing) {
      if (!vo.paused && vo.currentTime > 0 && vo.currentTime < vo.duration - 0.05) t = vo.currentTime; else t = t0 + (performance.now() - wall0) / 1000;
      if (t >= DURATION) { t = DURATION; pause(); }
      schedule();
    }
    const sc = engine.frame(t);
    seek.value = t; timeEl.textContent = `${fmtT(t)} / ${fmtT(DURATION)}`; sceneEl.textContent = `#${sc.index} ${sc.name ?? ''}`;
    requestAnimationFrame(loop);
  }
  loop();
}
