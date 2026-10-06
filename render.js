#!/usr/bin/env node
// Offline renderer: drives the page frame-by-frame with Puppeteer, pipes JPEG frames into ffmpeg,
// renders the Web Audio sound design offline, then muxes video + voice-over + SFX into an MP4.
//
//   node render.js                       full video -> out/titanic.mp4 (30 fps, 1920x1080)
//   node render.js --workers 4           split into 4 parallel browser workers
//   node render.js --start 540 --end 600 render a time range only (seconds) — handy for checks
//   node render.js --no-captions         without burned-in captions
//   node render.js --sfx 0.4             SFX/music level relative to voice (default 0.32)
//   CHROME_PATH=/path/to/chrome node render.js   use a specific Chrome/Chromium binary
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { startServer } from './server.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (name, def) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true) : def; };

const FPS = +arg('fps', 30);
const WORKERS = Math.max(1, +arg('workers', 1));
const OUT = path.resolve(arg('out', path.join(ROOT, 'out', 'titanic.mp4')));
const CRF = arg('crf', '20');
const PRESET = arg('preset', 'medium');
const SFX_LEVEL = +arg('sfx', 0.32);
const JPEG_Q = +arg('jpeg', 0.92);
const CAPTIONS = !argv.includes('--no-captions');
const SKIP_AUDIO = argv.includes('--no-audio');
const RESUME = argv.includes('--resume');
const GPU = arg('gl', 'auto'); // auto | swiftshader | egl | gl
const TMP = path.join(path.dirname(OUT), 'parts');
fs.mkdirSync(TMP, { recursive: true });

function chromeArgs() {
  const a = ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--window-size=1920,1080', '--force-device-scale-factor=1'];
  if (GPU === 'swiftshader') a.push('--use-angle=swiftshader');
  if (GPU === 'egl') a.push('--use-gl=egl');
  if (GPU === 'gl') a.push('--use-angle=gl');
  return a;
}
async function openPage(browser, url) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warn') console.log('  [page]', m.text()); });
  page.on('pageerror', (e) => console.log('  [page error]', e.message));
  await page.goto(url, { waitUntil: 'load', timeout: 0 });
  await page.waitForFunction('window.__ready === true', { timeout: 0, polling: 200 });
  return page;
}
function launch() {
  return puppeteer.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: chromeArgs(), protocolTimeout: 0 });
}
function run(cmd, args, opts = {}) {
  return new Promise((res, rej) => { const p = spawn(cmd, args, { stdio: opts.stdio ?? ['ignore', 'inherit', 'inherit'] }); p.on('close', (c) => (c === 0 ? res() : rej(new Error(`${cmd} exited ${c}`)))); });
}
const fmt = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 3600)}h${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m${String(s % 60).padStart(2, '0')}s`; };

async function renderRange(id, f0, f1, url, progress) {
  const part = path.join(TMP, `part_${String(id).padStart(3, '0')}_${f0}_${f1}.mp4`);
  if (RESUME && fs.existsSync(part + '.done')) { progress(id, f1 - f0); return part; }
  const browser = await launch();
  const page = await openPage(browser, url);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', PRESET, '-crf', String(CRF), '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', part], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg failed')))));
  for (let f = f0; f < f1; f++) {
    const t = f / FPS;
    const dataUrl = await page.evaluate((tt, q) => window.__T.frame(tt, q), t, JPEG_Q);
    const buf = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    progress(id, 1);
  }
  ff.stdin.end();
  await done;
  await browser.close();
  fs.writeFileSync(part + '.done', '');
  return part;
}

async function renderAudio(url, wavPath) {
  console.log('▶ Rendering sound design (Web Audio, offline)…');
  const browser = await launch();
  const page = await openPage(browser, url);
  const sr = 48000;
  const bytes = await page.evaluate((s) => window.__T.renderAudio(s, 0.5), sr);
  const fd = fs.openSync(wavPath, 'w');
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + bytes, 4); header.write('WAVE', 8); header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(2, 22); header.writeUInt32LE(sr, 24); header.writeUInt32LE(sr * 4, 28);
  header.writeUInt16LE(4, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(bytes, 40);
  fs.writeSync(fd, header);
  const CH = 4 * 1024 * 1024;
  for (let o = 0; o < bytes; o += CH) {
    const b64 = await page.evaluate((a, b) => window.__T.audioChunk(a, b), o, CH);
    fs.writeSync(fd, Buffer.from(b64, 'base64'));
  }
  fs.closeSync(fd);
  await browser.close();
  console.log(`  sfx -> ${path.relative(ROOT, wavPath)}`);
}

async function main() {
  const server = await startServer(0);
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}/index.html?render=1${CAPTIONS ? '' : '&nocaptions=1'}`;

  // probe duration
  const probe = await launch();
  const pp = await openPage(probe, url);
  const info = await pp.evaluate(() => ({ duration: window.__T.duration, gl: (() => { const c = document.createElement('canvas').getContext('webgl2'); const e = c && c.getExtension('WEBGL_debug_renderer_info'); return e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; })() }));
  await probe.close();
  console.log(`WebGL renderer: ${info.gl}`);
  if (/swiftshader|llvmpipe|software/i.test(info.gl)) console.log('  ⚠ software rendering detected — this will be slow. Try --gl egl or --gl gl, or run with a GPU.');

  const start = +arg('start', 0), end = Math.min(+arg('end', info.duration), info.duration);
  const F0 = Math.floor(start * FPS), F1 = Math.ceil(end * FPS), total = F1 - F0;
  console.log(`▶ Rendering ${total} frames (${(total / FPS).toFixed(1)} s) at ${FPS} fps with ${WORKERS} worker(s)…`);

  const wav = path.join(TMP, 'sfx.wav');
  if (!SKIP_AUDIO && !(RESUME && fs.existsSync(wav))) await renderAudio(url, wav);

  let doneFrames = 0; const t0 = Date.now(); let lastLog = 0;
  const progress = (_id, n) => {
    doneFrames += n; const now = Date.now();
    if (now - lastLog > 2000 || doneFrames === total) {
      lastLog = now; const el = (now - t0) / 1000; const fps = doneFrames / el;
      process.stdout.write(`\r  ${doneFrames}/${total} frames  ${(100 * doneFrames / total).toFixed(1)}%  ${fps.toFixed(2)} fps  ETA ${fmt((total - doneFrames) / Math.max(fps, 1e-6))}   `);
    }
  };
  const per = Math.ceil(total / WORKERS);
  const jobs = [];
  for (let w = 0; w < WORKERS; w++) { const a = F0 + w * per, b = Math.min(F1, a + per); if (b > a) jobs.push(renderRange(w, a, b, url, progress)); }
  const parts = await Promise.all(jobs);
  process.stdout.write('\n');

  const list = path.join(TMP, 'list.txt');
  fs.writeFileSync(list, parts.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'));
  const video = path.join(TMP, 'video.mp4');
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', video]);

  console.log('▶ Muxing audio…');
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const vo = path.join(ROOT, 'assets', 'voiceover.mp3');
  const ss = String(start), dur = String(end - start);
  if (SKIP_AUDIO) {
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-ss', ss, '-t', dur, '-i', vo, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', OUT]);
  } else {
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-ss', ss, '-t', dur, '-i', vo, '-ss', ss, '-t', dur, '-i', wav,
      '-filter_complex', `[1:a]aresample=48000,apad,volume=1.0[v];[2:a]volume=${SFX_LEVEL}[s];[v][s]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.97[a]`,
      '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-t', dur, '-movflags', '+faststart', OUT]);
  }
  console.log(`✔ Done: ${OUT}  (${fmt((Date.now() - t0) / 1000)})`);
  server.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
