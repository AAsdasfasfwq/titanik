// Shared 2D diagrams: hull cutaway with flooding compartments, newspaper, North Atlantic map, stopwatch.
import { txt, F, PAL, roundRect, shipSilhouette, measure, revealText } from '../lib/draw2d.js';
import { clamp, easeOut, rng, lerp } from '../lib/kit.js';

/**
 * Side cut-away of the hull with 16 watertight compartments.
 * o: { flood: number[16] (0..1 fill, compartment 0 = bow), tilt (rad, + = bow down), sink (px down), waterY (abs y of sea),
 *      bulkheadH (0..1 of hull height), highlight: index[], showNumbers, lit }
 */
export function cutaway(g, cx, cy, w, o = {}) {
  const h = w * 0.13;
  const N = 16;
  const bh = o.bulkheadH ?? 0.62;
  const tilt = o.tilt ?? 0;
  const sink = o.sink ?? 0;
  const seaY = o.waterY ?? cy + h * 0.15;
  const hullPath = () => {
    g.beginPath();
    g.moveTo(-w / 2, -h * 0.55); g.lineTo(w / 2 + w * 0.02, -h * 0.62); // deck line (bow higher)
    g.lineTo(w / 2 - w * 0.01, h * 0.1); g.quadraticCurveTo(w / 2 - w * 0.03, h * 0.5, w / 2 - w * 0.08, h * 0.5);
    g.lineTo(-w / 2 + w * 0.06, h * 0.5); g.quadraticCurveTo(-w / 2 - w * 0.01, h * 0.45, -w / 2, -h * 0.1); g.closePath();
  };
  // sea behind
  if (o.sea !== false) {
    const gr = g.createLinearGradient(0, seaY, 0, seaY + 400); gr.addColorStop(0, o.seaTop ?? 'rgba(30,90,140,0.55)'); gr.addColorStop(1, o.seaBot ?? 'rgba(5,20,40,0.9)');
    g.fillStyle = gr; g.fillRect(0, seaY, g.canvas.width, g.canvas.height - seaY);
  }
  g.save();
  g.translate(cx, cy + sink); g.rotate(tilt);
  // hull body
  hullPath(); g.fillStyle = o.hullFill ?? 'rgba(12,16,22,0.92)'; g.fill();
  g.save(); hullPath(); g.clip();
  const x0 = -w / 2 + w * 0.02, cw = (w * 0.94) / N;
  for (let i = 0; i < N; i++) {
    const idx = N - 1 - i; // draw from stern (left) to bow (right); idx 0 = bow
    const x = x0 + i * cw;
    const f = o.flood ? o.flood[idx] ?? 0 : 0;
    if (o.highlight && o.highlight.includes(idx)) { g.fillStyle = 'rgba(255,210,63,0.18)'; g.fillRect(x, -h, cw, h * 2); }
    if (f > 0) {
      // water level inside compartment, kept horizontal in world space
      g.save(); g.beginPath(); g.rect(x, -h * 0.62, cw, h * 1.2); g.clip();
      const top = h * 0.5 - (h * 1.05) * f;
      g.rotate(-tilt);
      const gr = g.createLinearGradient(0, top - 10, 0, h); gr.addColorStop(0, '#5fc8ff'); gr.addColorStop(1, '#0a4a8a');
      g.fillStyle = gr;
      // compute world-level: use compartment centre to place level
      const cxw = (x + cw / 2) * Math.cos(tilt), lvl = top + (x + cw / 2) * Math.sin(tilt);
      void cxw; g.fillRect(-w, lvl, w * 2, h * 3);
      g.strokeStyle = 'rgba(200,240,255,0.9)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-w, lvl); g.lineTo(w, lvl); g.stroke();
      g.restore();
    }
    if (o.showNumbers !== false) txt(g, String(idx + 1), x + cw / 2, h * 0.32, { font: F.cond(500, Math.max(12, cw * 0.35)), color: 'rgba(255,255,255,0.35)' });
  }
  // bulkheads
  for (let i = 1; i < N; i++) {
    const x = x0 + i * cw;
    g.fillStyle = o.bulkColor ?? '#e8e2d4';
    g.fillRect(x - 2, h * 0.5 - h * 1.05 * bh, 4, h * 1.05 * bh);
  }
  // decks
  g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1.5;
  for (let k = 1; k < 4; k++) { const y = -h * 0.55 + k * h * 0.26; g.beginPath(); g.moveTo(-w / 2, y); g.lineTo(w / 2, y); g.stroke(); }
  g.restore();
  hullPath(); g.strokeStyle = o.outline ?? '#e8e2d4'; g.lineWidth = 3; g.stroke();
  // superstructure & funnels (simple)
  g.fillStyle = o.superFill ?? 'rgba(232,226,212,0.95)';
  g.fillRect(-w * 0.33, -h * 0.55 - h * 0.28, w * 0.66, h * 0.28);
  for (let i = 0; i < 4; i++) { const fx = w * 0.22 - i * w * 0.12; g.save(); g.translate(fx, -h * 0.83); g.rotate(-0.08); g.fillStyle = '#d9a24e'; g.fillRect(-w * 0.012, -h * 0.7, w * 0.024, h * 0.7); g.fillStyle = '#111'; g.fillRect(-w * 0.012, -h * 0.7, w * 0.024, h * 0.13); g.restore(); }
  g.restore();
  // sea surface in front (semi-transparent)
  if (o.sea !== false) { g.fillStyle = o.front ?? 'rgba(30,110,170,0.28)'; g.fillRect(0, seaY, g.canvas.width, g.canvas.height - seaY); g.strokeStyle = 'rgba(160,220,255,0.8)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, seaY); g.lineTo(g.canvas.width, seaY); g.stroke(); }
  return { h, cw: (w * 0.94) / N };
}

/** classic newspaper front page */
export function newspaper(g, cx, cy, w, headline, o = {}) {
  const h = w * 1.3;
  g.save(); g.translate(cx, cy); g.rotate(o.rot ?? 0); g.scale(o.scale ?? 1, o.scale ?? 1);
  g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 50; g.shadowOffsetY = 20;
  g.fillStyle = o.paper ?? '#efe6d0'; g.fillRect(-w / 2, -h / 2, w, h); g.shadowBlur = 0; g.shadowOffsetY = 0;
  const r = rng(o.seed ?? 4);
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(80,60,30,${r() * 0.05})`; g.fillRect(-w / 2 + r() * w, -h / 2 + r() * h, 2 + r() * 6, 2 + r() * 6); }
  const ink = '#141210';
  txt(g, o.masthead ?? 'THE MORNING GAZETTE', 0, -h / 2 + w * 0.08, { font: `800 ${w * 0.075}px "Playfair Display"`, color: ink });
  g.fillStyle = ink; g.fillRect(-w / 2 + w * 0.05, -h / 2 + w * 0.13, w * 0.9, 3); g.fillRect(-w / 2 + w * 0.05, -h / 2 + w * 0.15, w * 0.9, 1);
  txt(g, o.date ?? 'NEW YORK, APRIL 16, 1912', 0, -h / 2 + w * 0.175, { font: F.cond(400, w * 0.025), ls: 4, color: ink });
  // headline (auto fit)
  const lines = Array.isArray(headline) ? headline : [headline];
  let y = -h / 2 + w * 0.29;
  lines.forEach((ln) => {
    let size = w * 0.13; g.font = F.cond(700, size); while (g.measureText(ln).width > w * 0.9 && size > 10) { size -= 2; g.font = F.cond(700, size); }
    txt(g, ln, 0, y, { font: F.cond(700, size), color: o.hlColor ?? ink }); y += size * 1.05;
  });
  if (o.sub) { txt(g, o.sub, 0, y + w * 0.01, { font: F.serif(w * 0.04), color: ink }); y += w * 0.06; }
  // photo
  const py = y + w * 0.04, ph = w * 0.32;
  g.fillStyle = '#c8bca4'; g.fillRect(-w / 2 + w * 0.05, py, w * 0.55, ph);
  shipSilhouette(g, -w / 2 + w * 0.325, py + ph * 0.72, w * 0.45, '#2a241c', { funnels: 4 });
  // columns of text
  g.fillStyle = 'rgba(20,18,16,0.55)';
  for (let c = 0; c < 2; c++) for (let l = 0; l < 14; l++) { const lx = -w / 2 + w * 0.05 + (c === 0 ? w * 0.58 : w * 0.05) * 1 + (c === 1 ? 0 : 0); void lx; }
  for (let l = 0; l < 14; l++) g.fillRect(w * 0.08, py + l * ph / 14 + 4, w * (0.3 + r() * 0.07), w * 0.009);
  for (let col = 0; col < 3; col++) for (let l = 0; l < 16; l++) g.fillRect(-w / 2 + w * 0.05 + col * w * 0.31, py + ph + w * 0.04 + l * w * 0.026, w * (0.25 + r() * 0.04), w * 0.009);
  g.restore();
}

// ---------- North Atlantic map ----------
const LAND = {
  gb: [[-5.7, 50.0], [-3.0, 50.6], [1.3, 51.2], [1.7, 52.7], [0.2, 53.5], [-0.1, 54.5], [-1.6, 55.6], [-2.0, 57.6], [-3.0, 58.6], [-5.0, 58.6], [-6.2, 57.5], [-5.6, 56.3], [-4.9, 55.0], [-3.0, 54.0], [-3.3, 53.4], [-4.6, 53.3], [-4.2, 52.3], [-5.3, 51.8], [-3.2, 51.4], [-5.7, 50.0]],
  ie: [[-6.0, 52.2], [-6.2, 53.3], [-6.0, 54.6], [-7.2, 55.3], [-8.5, 54.9], [-10.0, 54.2], [-9.9, 53.0], [-10.4, 51.8], [-8.5, 51.6], [-6.0, 52.2]],
  eu: [[14, 58], [10.5, 57.7], [10, 54], [8.5, 53.6], [6, 53.4], [3.5, 51.4], [1.6, 50.9], [1.0, 49.9], [-1.3, 49.6], [-1.9, 48.7], [-4.7, 48.4], [-4.3, 47.8], [-2.2, 47.1], [-1.2, 46.0], [-1.5, 43.5], [-8.0, 43.7], [-9.3, 43.0], [-8.8, 41.0], [-9.5, 38.7], [-8.9, 37.0], [-6.0, 36.2], [-5.6, 36.0], [0, 34], [14, 34]],
  sc: [[5, 58], [5.5, 59.5], [5, 62], [8, 63.5], [12, 66], [15, 68], [16, 70], [30, 71], [30, 55], [14, 55.5], [12, 56], [10.5, 57.7], [8, 58], [5, 58]],
  is: [[-22, 64], [-24, 65.5], [-22, 66.4], [-16, 66.5], [-13.5, 65.2], [-14.5, 64.3], [-18, 63.4], [-22, 64]],
  gl: [[-73, 78], [-60, 82], [-30, 83], [-20, 80], [-20, 72], [-25, 69], [-35, 66], [-40, 65], [-43, 60], [-48, 61], [-52, 64], [-54, 67], [-56, 70], [-62, 75], [-73, 78]],
  na: [[-90, 30], [-81, 31], [-80.5, 32.5], [-77, 34.6], [-75.5, 35.2], [-76, 37], [-74, 39.5], [-73.8, 40.6], [-72, 41], [-70, 41.6], [-70.5, 43], [-67, 44.8], [-66, 44.6], [-64.5, 45.5], [-61, 45.2], [-60, 45.8], [-61.3, 46.6], [-64.5, 48.5], [-66.5, 49.2], [-60, 50.2], [-57, 51.5], [-56, 52.5], [-58, 54], [-61, 56], [-64, 59], [-65, 60.5], [-70, 61], [-78, 62.5], [-90, 63]],
  ns: [[-66, 43.8], [-64, 44.4], [-61, 45.2], [-60, 45.8], [-63.5, 45.8], [-66, 44.6]],
  nf: [[-59.3, 47.6], [-56, 47.6], [-53, 46.6], [-52.6, 47.5], [-53.4, 49], [-55.5, 50], [-56, 51.6], [-55.5, 51.6], [-57.5, 50.5], [-59.4, 48.4], [-59.3, 47.6]],
};
export const PLACES = { southampton: [-1.4, 50.9], cherbourg: [-1.62, 49.65], queenstown: [-8.3, 51.85], wreck: [-49.95, 41.73], newyork: [-74.0, 40.7], halifax: [-63.6, 44.6], caperace: [-53.1, 46.65], carpathia: [-49.2, 41.15], californian: [-50.1, 42.1] };

/** returns projector (lon,lat)->[x,y]; view: {lon0, lon1, lat0, lat1} */
export function mapProjector(W, H, v = {}) {
  const lon0 = v.lon0 ?? -80, lon1 = v.lon1 ?? 12, lat0 = v.lat0 ?? 34, lat1 = v.lat1 ?? 64;
  const mx = W / (lon1 - lon0), my = H / (lat1 - lat0);
  return ([lon, lat]) => [(lon - lon0) * mx, (lat1 - lat) * my];
}
export function drawMap(g, W, H, proj, o = {}) {
  const gr = g.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.75); gr.addColorStop(0, o.sea1 ?? '#12304e'); gr.addColorStop(1, o.sea2 ?? '#061423');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.save(); g.strokeStyle = 'rgba(160,200,255,0.08)'; g.lineWidth = 1;
  for (let lon = -90; lon <= 30; lon += 10) { const [x] = proj([lon, 0]); g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let lat = 30; lat <= 80; lat += 5) { const [, y] = proj([0, lat]); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.restore();
  for (const k in LAND) {
    g.beginPath(); LAND[k].forEach((p, i) => { const [x, y] = proj(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath();
    g.fillStyle = o.land ?? '#d8cdb4'; g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 20; g.fill(); g.shadowBlur = 0;
    g.strokeStyle = o.coast ?? 'rgba(255,255,255,0.5)'; g.lineWidth = 2; g.stroke();
  }
}
export function mapPin(g, proj, place, label, a = 1, o = {}) {
  const [x, y] = proj(place);
  g.save(); g.globalAlpha = a;
  g.fillStyle = o.color ?? PAL.red2; g.beginPath(); g.arc(x, y, o.r ?? 9, 0, 7); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
  if (label) txt(g, label, x + (o.dx ?? 16), y + (o.dy ?? -18), { font: F.cond(600, o.size ?? 30), align: o.align ?? 'left', ls: 3, color: o.labelColor ?? '#fff', shadow: 10 });
  g.restore();
  return [x, y];
}

export function stopwatch(g, x, y, r, seconds, maxS = 60, o = {}) {
  g.save(); g.translate(x, y);
  g.fillStyle = o.face ?? '#111'; g.strokeStyle = o.rim ?? '#fff'; g.lineWidth = r * 0.06;
  g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.stroke();
  g.fillStyle = o.rim ?? '#fff'; g.fillRect(-r * 0.12, -r * 1.22, r * 0.24, r * 0.14);
  for (let i = 0; i < 60; i++) { g.save(); g.rotate((i / 60) * Math.PI * 2); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(-1.5, -r * 0.92, 3, r * (i % 5 ? 0.06 : 0.12)); g.restore(); }
  const a = (seconds / maxS) * Math.PI * 2;
  g.fillStyle = 'rgba(230,57,70,0.25)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r * 0.88, -Math.PI / 2, -Math.PI / 2 + a); g.closePath(); g.fill();
  g.strokeStyle = PAL.red2; g.lineWidth = r * 0.04; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(a) * r * 0.85, -Math.cos(a) * r * 0.85); g.stroke();
  txt(g, String(Math.floor(seconds)).padStart(2, '0'), 0, r * 0.42, { font: F.cond(700, r * 0.38), color: '#fff' });
  g.restore();
}

/** big number counter with label */
export function counter(g, x, y, value, label, p, o = {}) {
  const v = Math.round(value * easeOut(clamp(p)));
  txt(g, (o.prefix ?? '') + v.toLocaleString('en-US') + (o.suffix ?? ''), x, y, { font: o.font ?? F.cond(700, o.size ?? 150), color: o.color ?? '#fff', shadow: o.shadow ?? 30, align: o.align ?? 'center' });
  if (label) txt(g, label, x, y + (o.size ?? 150) * 0.62, { font: F.cond(500, (o.size ?? 150) * 0.24), ls: 10, color: o.labelColor ?? PAL.gold, alpha: clamp(p * 2), align: o.align ?? 'center', shadow: 10 });
}

export { revealText, measure, lerp };
