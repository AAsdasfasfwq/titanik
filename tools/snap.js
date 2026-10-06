#!/usr/bin/env node
// Render single stills for quick checks:  node tools/snap.js 12.5 300 543.2 [--out dir] [--scenes]
// --scenes renders the middle frame of every scene.
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { startServer } from '../server.js';

const argv = process.argv.slice(2);
const oi = argv.indexOf('--out');
const out = oi >= 0 ? argv[oi + 1] : 'out/snaps';
fs.mkdirSync(out, { recursive: true });
const server = await startServer(0);
const browser = await puppeteer.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'], protocolTimeout: 0 });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warn') console.log('[page]', m.text()); });
page.on('pageerror', (e) => console.log('[page error]', e.message));
await page.goto(`http://127.0.0.1:${server.address().port}/index.html?render=1`, { waitUntil: 'load' });
await page.waitForFunction('window.__ready === true', { timeout: 0 });
let times = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--out').map(Number);
if (argv.includes('--scenes')) {
  const sc = await page.evaluate(() => window.__T.scenes);
  const pick = argv.includes('--mid') ? (s) => [(s.start + s.end) / 2] : (s) => [s.start + Math.min(1.2, (s.end - s.start) * 0.3), (s.start + s.end) / 2 + (s.end - s.start) * 0.2];
  times = sc.flatMap(pick);
}
for (const t of times) {
  const t0 = Date.now();
  let d;
  try { d = await page.evaluate((tt) => window.__T.frame(tt, 0.85), t); } catch (e) { console.log('ERROR at', t, e.message.split('\n').slice(0, 4).join(' | ')); continue; }
  const f = path.join(out, `t_${t.toFixed(2).padStart(8, '0')}.jpg`);
  fs.writeFileSync(f, Buffer.from(d.split(',')[1], 'base64'));
  console.log(f, `${Date.now() - t0}ms`);
}
await browser.close(); server.close();
