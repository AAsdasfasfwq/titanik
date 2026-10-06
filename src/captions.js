// Word-synchronised captions (short punchy chunks, current word highlighted).
import { clamp, easeOutBack } from './lib/kit.js';

// spelling fixes for names the speech-to-text got wrong
const FIX = { Peary: 'Pirrie', 'Peary,': 'Pirrie,', Wolfe: 'Wolff', 'Wolfe.': 'Wolff.', 'Wolfe,': 'Wolff,', Hitchens: 'Hichens', 'Hitchens.': 'Hichens.', Strauss: 'Straus', 'Strauss.': 'Straus.', Mauritania: 'Mauretania', 'Mauritania,': 'Mauretania,', Brandy: 'brandy', 'Brandy,': 'brandy,', Hardhats: 'hard hats', 'hardhats.': 'hard hats.' };

export function buildCaptions(script) {
  const words = [];
  const segs = script.segments;
  segs.forEach((s, i) => {
    if (i === segs.length - 1 && i > 0 && segs[i - 1].text.toLowerCase().includes(s.text.trim().toLowerCase())) return; // whisper duplicate at the very end
    for (const w of s.words) {
      let text = w.word.trim(); text = FIX[text] ?? text;
      words.push({ text, start: w.start, end: w.end });
    }
  });
  const chunks = [];
  let cur = [];
  const flush = () => { if (cur.length) { chunks.push({ words: cur, start: cur[0].start }); cur = []; } };
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    const chars = cur.map((x) => x.text).join(' ').length;
    if (/[.,!?;:]$/.test(w.text) || cur.length >= 3 || chars > 16 || !next || next.start - w.end > 0.35) flush();
  });
  chunks.forEach((c, i) => {
    const last = c.words[c.words.length - 1];
    const nextStart = chunks[i + 1] ? chunks[i + 1].start : last.end + 1;
    c.end = Math.min(nextStart, last.end + 0.6);
    c.start -= 0.04;
  });
  return chunks;
}

export function drawCaptions(g, chunks, t, fx) {
  let lo = 0, hi = chunks.length - 1, idx = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (chunks[m].start <= t) { idx = m; lo = m + 1; } else hi = m - 1; }
  if (idx < 0) return;
  const c = chunks[idx]; if (t > c.end) return;
  const W = g.canvas.width, H = g.canvas.height;
  const k = clamp((t - c.start) / 0.12);
  const s = 0.86 + 0.14 * easeOutBack(k);
  const y = H - (fx.captionY ?? 128);
  g.save();
  g.translate(W / 2, y); g.scale(s, s);
  g.font = '800 54px Inter'; g.textBaseline = 'middle'; g.textAlign = 'left';
  const parts = c.words.map((w) => w.text);
  const sp = g.measureText(' ').width;
  const widths = parts.map((p) => g.measureText(p).width);
  const total = widths.reduce((a, b) => a + b, 0) + sp * (parts.length - 1);
  let x = -total / 2;
  g.lineJoin = 'round';
  parts.forEach((p, i) => {
    const w = c.words[i];
    const active = t >= w.start - 0.03 && (i === parts.length - 1 || t < c.words[i + 1].start - 0.03);
    g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 18; g.shadowOffsetY = 4;
    g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,0.9)'; g.strokeText(p, x, 0);
    g.shadowBlur = 0; g.shadowOffsetY = 0;
    g.fillStyle = active ? (fx.captionHi ?? '#ffd23f') : '#ffffff';
    g.fillText(p, x, 0);
    x += widths[i] + sp;
  });
  g.restore();
}
