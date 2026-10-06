// 2D motion-graphics helpers for the overlay canvas (infographics, titles, icons).
import { clamp, easeOut, easeOutBack, rng, inv, smooth } from './kit.js';

export const PAL = {
  paper: '#ece8e1', paper2: '#e2ddd4', ink: '#141414', red: '#c8102e', red2: '#e63946', gold: '#d8a24a', navy: '#0b1626',
  ice: '#9fe3ff', steel: '#8a96a3', cream: '#f6efe0', green: '#3ccf7a', blue: '#3a8dde', teal: '#2ab3a6',
};
export const F = {
  cond: (w = 700, s = 80) => `${w} ${s}px Oswald`,
  serif: (s = 60, it = true, w = 500) => `${it ? 'italic ' : ''}${w} ${s}px "Playfair Display"`,
  sans: (w = 800, s = 50) => `${w} ${s}px Inter`,
  bebas: (s = 120) => `400 ${s}px "Bebas Neue"`,
  type: (s = 40) => `400 ${s}px "Special Elite"`,
};

export function txt(g, text, x, y, o = {}) {
  g.save();
  g.font = o.font ?? F.sans(800, o.size ?? 48);
  g.fillStyle = o.color ?? '#fff';
  g.textAlign = o.align ?? 'center';
  g.textBaseline = o.baseline ?? 'middle';
  g.globalAlpha *= o.alpha ?? 1;
  if (o.ls != null) g.letterSpacing = `${o.ls}px`;
  if (o.shadow) { g.shadowColor = o.shadowColor ?? 'rgba(0,0,0,0.6)'; g.shadowBlur = o.shadow; g.shadowOffsetY = o.shadowY ?? 4; }
  if (o.stroke) { g.lineWidth = o.stroke; g.strokeStyle = o.strokeColor ?? '#000'; g.lineJoin = 'round'; g.strokeText(text, x, y); }
  g.fillText(text, x, y);
  g.restore();
}

export function measure(g, text, font, ls = 0) { g.save(); g.font = font; g.letterSpacing = `${ls}px`; const w = g.measureText(text).width; g.restore(); return w; }

/** per-character animated reveal. p: 0..1 progress, style: 'up' | 'blur' | 'drop' | 'scale' */
export function revealText(g, text, x, y, p, o = {}) {
  const font = o.font ?? F.sans(800, 64);
  g.save(); g.font = font; g.letterSpacing = `${o.ls ?? 0}px`;
  const chars = [...text];
  const widths = chars.map((c) => g.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0);
  let cx = o.align === 'left' ? x : o.align === 'right' ? x - total : x - total / 2;
  const stag = o.stagger ?? 0.6;
  g.textBaseline = 'middle'; g.textAlign = 'left';
  chars.forEach((c, i) => {
    const local = clamp((p * (1 + stag) - (i / Math.max(1, chars.length - 1)) * stag));
    const e = (o.style === 'scale' || o.style === 'drop') ? easeOutBack(local) : easeOut(local);
    g.save();
    g.globalAlpha = (o.alpha ?? 1) * clamp(local * 2.5);
    let dy = 0, sc = 1;
    if (o.style === 'drop') dy = (1 - e) * -(o.dist ?? 60);
    else if (o.style === 'scale') sc = e;
    else dy = (1 - e) * (o.dist ?? 40);
    if (o.style === 'blur') g.filter = `blur(${(1 - local) * 12}px)`;
    g.translate(cx + widths[i] / 2, y + dy); g.scale(sc, sc);
    if (o.shadow) { g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = o.shadow; g.shadowOffsetY = 4; }
    g.fillStyle = Array.isArray(o.color) ? o.color[i % o.color.length] : (o.color ?? '#fff');
    g.fillText(c, -widths[i] / 2, 0);
    g.restore();
    cx += widths[i];
  });
  g.restore();
  return total;
}

export const fmt = (n) => Math.round(n).toLocaleString('en-US');

// ---------- backgrounds ----------
let paperCanvas;
function getPaper(W, H) {
  if (paperCanvas) return paperCanvas;
  paperCanvas = document.createElement('canvas'); paperCanvas.width = W; paperCanvas.height = H;
  const g = paperCanvas.getContext('2d');
  g.fillStyle = PAL.paper; g.fillRect(0, 0, W, H);
  const r = rng(99);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${r() * 0.035})`; g.fillRect(r() * W, r() * H, 1 + r() * 3, 1 + r() * 3); }
  const gr = g.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 1.0); gr.addColorStop(0, 'rgba(255,255,255,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0.12)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  return paperCanvas;
}
export function paperBg(g, W, H, t = 0, o = {}) {
  g.drawImage(getPaper(W, H), 0, 0);
  if (o.swoosh !== false) {
    g.save(); g.strokeStyle = o.swooshColor ?? 'rgba(200,16,46,0.18)'; g.lineWidth = o.swooshW ?? 46; g.lineCap = 'round';
    g.beginPath();
    const k = Math.sin(t * 0.3) * 40;
    g.moveTo(-100, H * 0.62 + k); g.bezierCurveTo(W * 0.3, H * 0.35 - k, W * 0.6, H * 0.95 + k, W + 100, H * 0.55);
    g.stroke(); g.restore();
  }
  if (o.leaves !== false) { // decorative dark shapes in corners (like montage refs)
    g.save(); g.fillStyle = 'rgba(20,20,20,0.85)'; g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 30; g.shadowOffsetY = 18;
    const leaf = (x, y, a, s) => { g.save(); g.translate(x, y); g.rotate(a + Math.sin(t * 0.6 + x) * 0.05); g.scale(s, s); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(40, -90, 0, -200); g.quadraticCurveTo(-40, -90, 0, 0); g.fill(); g.restore(); };
    leaf(-10, 120, 2.3, 1.0); leaf(40, 60, 2.9, 0.8); leaf(W + 10, H - 120, -0.8, 1.0); leaf(W - 40, H - 60, -0.2, 0.8);
    g.restore();
  }
}
export function darkBg(g, W, H, c1 = '#1a0507', c2 = '#000', o = {}) {
  const gr = g.createRadialGradient(W * (o.cx ?? 0.5), H * (o.cy ?? 0.45), 50, W / 2, H / 2, W * 0.75);
  gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (o.grid) { g.save(); g.strokeStyle = o.grid; g.lineWidth = 1; for (let x = 0; x < W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } g.restore(); }
}
export function blueprintBg(g, W, H, t = 0) {
  const gr = g.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.8); gr.addColorStop(0, '#1d4f8a'); gr.addColorStop(1, '#0a1f3d');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.save(); g.strokeStyle = 'rgba(160,210,255,0.12)'; g.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = 0; y < H; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.strokeStyle = 'rgba(160,210,255,0.22)'; g.lineWidth = 2;
  for (let x = 0; x < W; x += 200) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = 0; y < H; y += 200) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.restore();
}

// ---------- shapes / icons ----------
export function roundRect(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
export function card(g, x, y, w, h, o = {}) {
  g.save(); g.shadowColor = o.shadowColor ?? 'rgba(0,0,0,0.35)'; g.shadowBlur = o.blur ?? 40; g.shadowOffsetY = o.oy ?? 20;
  g.fillStyle = o.fill ?? '#fff'; roundRect(g, x, y, w, h, o.r ?? 18); g.fill(); g.restore();
  if (o.stroke) { g.save(); g.strokeStyle = o.stroke; g.lineWidth = o.lw ?? 3; roundRect(g, x, y, w, h, o.r ?? 18); g.stroke(); g.restore(); }
}

export function personIcon(g, x, y, s, color, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = color; g.globalAlpha *= o.alpha ?? 1;
  g.beginPath(); g.arc(0, -34, 10, 0, 7); g.fill();
  g.beginPath(); g.roundRect(-13, -21, 26, 30, 8); g.fill();
  g.fillRect(-11, 5, 9, 24); g.fillRect(2, 5, 9, 24);
  if (o.dress) { g.beginPath(); g.moveTo(-13, -5); g.lineTo(13, -5); g.lineTo(18, 20); g.lineTo(-18, 20); g.fill(); }
  g.restore();
}
export function boatIcon(g, x, y, s, color = '#fff', o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = color; g.strokeStyle = color;
  g.beginPath(); g.moveTo(-60, -10); g.lineTo(60, -10); g.quadraticCurveTo(50, 18, 30, 20); g.lineTo(-30, 20); g.quadraticCurveTo(-50, 18, -60, -10); g.fill();
  if (o.oars) { g.lineWidth = 3; g.beginPath(); g.moveTo(-20, -10); g.lineTo(-45, 25); g.moveTo(20, -10); g.lineTo(45, 25); g.stroke(); }
  g.restore();
}
export function shipSilhouette(g, x, y, w, color = '#111', o = {}) {
  const s = w / 1000;
  g.save(); g.translate(x, y); g.scale(s, s * (o.squash ?? 0.7)); g.fillStyle = color;
  // hull
  g.beginPath(); g.moveTo(-500, -40); g.lineTo(500, -60); g.lineTo(470, 40); g.lineTo(-440, 40); g.quadraticCurveTo(-500, 20, -500, -40); g.fill();
  // superstructure
  g.fillRect(-340, -95, 650, 55); g.fillRect(-250, -120, 520, 26);
  g.fillRect(270, -130, 30, 40);
  const nf = o.funnels ?? 4; const fc = o.funnelColor ?? color;
  for (let i = 0; i < nf; i++) {
    const fx = 200 - i * 125;
    g.save(); g.translate(fx, -120); g.rotate(-0.09); g.fillStyle = fc; g.fillRect(-22, -150, 44, 150); g.fillStyle = o.funnelTop ?? color; g.fillRect(-22, -150, 44, 26); g.restore();
  }
  g.fillStyle = color; g.fillRect(380, -330, 8, 270); g.fillRect(-390, -310, 8, 250);
  if (o.lineColor) { g.strokeStyle = o.lineColor; g.lineWidth = 2; g.beginPath(); g.moveTo(384, -320); g.lineTo(-386, -300); g.stroke(); }
  if (o.waterline) { g.fillStyle = o.waterline; g.fillRect(-470, 18, 945, 22); }
  g.restore();
}
export function icebergIcon(g, x, y, s, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = o.top ?? '#eaf8ff'; g.beginPath(); g.moveTo(-90, 0); g.lineTo(-50, -70); g.lineTo(-20, -50); g.lineTo(10, -110); g.lineTo(50, -40); g.lineTo(90, 0); g.fill();
  if (o.under !== false) { g.fillStyle = o.underColor ?? 'rgba(120,200,240,0.45)'; g.beginPath(); g.moveTo(-90, 0); g.lineTo(90, 0); g.lineTo(140, 90); g.lineTo(60, 220); g.lineTo(-80, 200); g.lineTo(-150, 80); g.fill(); }
  g.restore();
}
export function clockIcon(g, x, y, r, hours, o = {}) {
  g.save(); g.translate(x, y);
  g.fillStyle = o.face ?? '#f8f4ea'; g.strokeStyle = o.rim ?? '#141414'; g.lineWidth = r * 0.08;
  g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.stroke();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillStyle = o.rim ?? '#141414'; g.save(); g.rotate(a); g.fillRect(-r * 0.02, -r * 0.92, r * 0.04, r * (i % 3 ? 0.08 : 0.16)); g.restore(); }
  const hA = (hours / 12) * Math.PI * 2, mA = (hours % 1) * Math.PI * 2;
  g.strokeStyle = o.hand ?? '#141414'; g.lineCap = 'round';
  g.lineWidth = r * 0.07; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(hA) * r * 0.5, -Math.cos(hA) * r * 0.5); g.stroke();
  g.lineWidth = r * 0.045; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(mA) * r * 0.78, -Math.cos(mA) * r * 0.78); g.stroke();
  g.fillStyle = o.accent ?? PAL.red; g.beginPath(); g.arc(0, 0, r * 0.06, 0, 7); g.fill();
  g.restore();
}
export function thermometer(g, x, y, h, level, o = {}) {
  g.save(); g.translate(x, y);
  const w = h * 0.12;
  g.fillStyle = o.glass ?? 'rgba(255,255,255,0.9)'; roundRect(g, -w / 2, -h, w, h, w / 2); g.fill();
  g.beginPath(); g.arc(0, w * 0.6, w, 0, 7); g.fill();
  const col = o.color ?? '#3aa0ff';
  g.fillStyle = col; g.beginPath(); g.arc(0, w * 0.6, w * 0.72, 0, 7); g.fill();
  const lh = (h - w) * clamp(level); roundRect(g, -w * 0.28, -lh, w * 0.56, lh + w * 0.6, w * 0.28); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2;
  for (let i = 1; i < 10; i++) { const yy = -(h - w) * (i / 10); g.beginPath(); g.moveTo(w / 2, yy); g.lineTo(w / 2 + (i % 5 ? 8 : 16), yy); g.stroke(); }
  g.restore();
}
export function check(g, x, y, s, color = PAL.green, p = 1) {
  g.save(); g.translate(x, y); g.strokeStyle = color; g.lineWidth = s * 0.16; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); const a = clamp(p * 2), b = clamp(p * 2 - 1);
  g.moveTo(-s * 0.4, 0); g.lineTo(-s * 0.4 + s * 0.3 * a, s * 0.3 * a);
  if (b > 0) g.lineTo(-s * 0.1 + s * 0.55 * b, s * 0.3 - s * 0.65 * b);
  g.stroke(); g.restore();
}
export function cross(g, x, y, s, color = PAL.red, p = 1) {
  g.save(); g.translate(x, y); g.strokeStyle = color; g.lineWidth = s * 0.16; g.lineCap = 'round';
  const a = clamp(p * 2), b = clamp(p * 2 - 1);
  g.beginPath(); g.moveTo(-s / 2, -s / 2); g.lineTo(-s / 2 + s * a, -s / 2 + s * a);
  if (b > 0) { g.moveTo(s / 2, -s / 2); g.lineTo(s / 2 - s * b, -s / 2 + s * b); }
  g.stroke(); g.restore();
}
/** strike-through line animated */
export function strike(g, x0, y, x1, p, color = PAL.red, w = 10) {
  g.save(); g.strokeStyle = color; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + (x1 - x0) * clamp(p), y); g.stroke(); g.restore();
}
export function underline(g, x0, y, x1, p, color = PAL.red, w = 8) { strike(g, x0, y, x1, p, color, w); }

export function radioWaves(g, x, y, t, color = '#9fe3ff', o = {}) {
  g.save(); g.strokeStyle = color; g.lineWidth = o.lw ?? 4;
  for (let i = 0; i < (o.n ?? 4); i++) {
    const k = (t * (o.speed ?? 1) + i / (o.n ?? 4)) % 1;
    g.globalAlpha = (1 - k) * (o.alpha ?? 1);
    g.beginPath(); g.arc(x, y, 20 + k * (o.r ?? 200), (o.a0 ?? -0.6), (o.a1 ?? 0.6)); g.stroke();
    if (o.both) { g.beginPath(); g.arc(x, y, 20 + k * (o.r ?? 200), Math.PI - (o.a1 ?? 0.6), Math.PI - (o.a0 ?? -0.6)); g.stroke(); }
  }
  g.restore();
}

/** label tag with line pointing at a target (used over 3D) */
export function callout(g, x, y, tx, ty, label, sub, p, o = {}) {
  const a = easeOut(p);
  if (a <= 0) return;
  g.save(); g.globalAlpha = clamp(p * 3);
  g.strokeStyle = o.line ?? '#fff'; g.lineWidth = 3;
  const mx = x + (tx - x) * a, my = y + (ty - y) * a;
  g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx + (x - tx) * a, ty + (y - ty) * a); g.stroke();
  g.fillStyle = o.dot ?? PAL.red; g.beginPath(); g.arc(tx, ty, 8, 0, 7); g.fill();
  void mx; void my;
  if (a > 0.6) {
    const k = (a - 0.6) / 0.4;
    g.font = o.font ?? F.cond(700, 44); const w = Math.max(g.measureText(label).width, sub ? measure(g, sub, F.sans(600, 24)) : 0) + 40;
    const bx = o.align === 'right' ? x - w : x, by = y - 34;
    g.globalAlpha = k;
    g.fillStyle = o.bg ?? 'rgba(10,10,14,0.85)'; roundRect(g, bx, by, w * k, sub ? 100 : 66, 8); g.fill();
    g.fillStyle = o.accent ?? PAL.red; g.fillRect(bx, by, 6, sub ? 100 : 66);
    g.save(); g.beginPath(); g.rect(bx, by, w * k, 110); g.clip();
    txt(g, label, bx + 22, by + 33, { font: o.font ?? F.cond(700, 44), align: 'left', color: o.color ?? '#fff' });
    if (sub) txt(g, sub, bx + 22, by + 76, { font: F.sans(600, 24), align: 'left', color: o.subColor ?? '#c9c9c9' });
    g.restore();
  }
  g.restore();
}

/** title lower-third: name + role (for characters) */
export function nameTag(g, x, y, name, role, p, o = {}) {
  if (p <= 0) return;
  const a = easeOut(clamp(p * 1.4)), b = easeOut(clamp(p * 1.4 - 0.25));
  g.save();
  const w = Math.max(measure(g, name, F.cond(700, 54), 2), measure(g, role, F.sans(600, 26), 3)) + 60;
  g.fillStyle = o.accent ?? PAL.red; g.fillRect(x, y - 40, 8, 112 * a);
  g.save(); g.beginPath(); g.rect(x + 8, y - 60, w * b, 160); g.clip();
  g.fillStyle = o.bg ?? 'rgba(8,8,10,0.78)'; g.fillRect(x + 8, y - 40, w, 112);
  txt(g, name, x + 34, y + 2, { font: F.cond(700, 54), align: 'left', ls: 2, color: '#fff' });
  txt(g, role, x + 34, y + 48, { font: F.sans(600, 26), align: 'left', ls: 3, color: o.roleColor ?? PAL.gold });
  g.restore(); g.restore();
}

/** horizontal comparison bar */
export function bar(g, x, y, w, h, p, color, o = {}) {
  g.save();
  g.fillStyle = o.track ?? 'rgba(255,255,255,0.08)'; roundRect(g, x, y, w, h, h / 2); g.fill();
  g.fillStyle = color; roundRect(g, x, y, Math.max(h, w * clamp(p)), h, h / 2); g.fill();
  g.restore();
}

/** dramatic glowing border (like ref video highlights) */
export function glowBorder(g, W, H, color = '#ffd400', a = 1) {
  if (a <= 0) return;
  g.save(); g.globalAlpha = a;
  for (const [w, al] of [[60, 0.15], [30, 0.3], [12, 0.6]]) { g.strokeStyle = color; g.globalAlpha = a * al; g.lineWidth = w; g.strokeRect(0, 0, W, H); }
  g.restore();
}

export function vignette2d(g, W, H, a = 0.6, color = '0,0,0') {
  const gr = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.7);
  gr.addColorStop(0, `rgba(${color},0)`); gr.addColorStop(1, `rgba(${color},${a})`); g.fillStyle = gr; g.fillRect(0, 0, W, H);
}

/** typewriter text (returns visible string) */
export function typed(text, p) { return text.slice(0, Math.floor(clamp(p) * text.length)); }

/** draw a polyline route progressively */
export function route(g, pts, p, o = {}) {
  let total = 0; const seg = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); total += d; }
  let rem = total * clamp(p);
  g.save(); g.strokeStyle = o.color ?? PAL.red; g.lineWidth = o.w ?? 6; g.lineCap = 'round'; g.setLineDash(o.dash ?? []);
  g.beginPath(); g.moveTo(...pts[0]);
  let head = pts[0];
  for (let i = 1; i < pts.length && rem > 0; i++) {
    const k = Math.min(1, rem / seg[i - 1]);
    head = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
    g.lineTo(...head); rem -= seg[i - 1];
  }
  g.stroke(); g.restore();
  return head;
}

export { clamp, inv, smooth, easeOut, easeOutBack };
