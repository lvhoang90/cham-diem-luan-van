// Dựng lại đoạn văn từ các mảnh chữ của PDF (hàm thuần, dùng chung cho máy chủ và bản artifact; không import gì).
// pages: [[{ str, x, y, h }]] — mỗi mảnh chữ theo thứ tự đọc của pdf.js; y là tọa độ từ đáy trang, h là cỡ chữ.

const HEAD_RE = /^(\d+(\.\d+)*[.)]?|[IVXLC]+[.)]|[a-zđ]\)|chương|phần|mục|bài|CHƯƠNG|PHẦN|MỤC)\s+\S/;
const LIST_RE = /^([•·●▪\-–—]|\d+[.)]|[a-zđ]\))\s+\S/;

const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const normKey = (t) => t.toLowerCase().replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();

function linesOfPage(items) {
  const lines = [];
  for (const it of items) {
    if (!it.str || !it.str.trim()) { if (it.str && lines.length) lines[lines.length - 1].tail = ' '; continue; }
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.y - it.y) <= Math.max(2, 0.45 * Math.max(last.h, it.h))) {
      const gap = it.x - last.endX;
      const sep = last.tail || gap > 0.18 * it.h ? ' ' : '';
      last.text += sep + it.str; last.endX = it.x + (it.w || 0); last.h = Math.max(last.h, it.h); last.tail = '';
    } else lines.push({ text: it.str, y: it.y, h: it.h, x: it.x, endX: it.x + (it.w || 0), tail: '' });
  }
  return lines.map((l) => ({ ...l, text: l.text.replace(/\s+/g, ' ').trim() })).filter((l) => l.text);
}

export function layoutPdfPages(pages) {
  const perPage = pages.map(linesOfPage);
  const nPages = perPage.length;
  // Bỏ số trang và đầu/chân trang lặp lại.
  const freq = new Map();
  perPage.forEach((ls) => new Set(ls.map((l) => normKey(l.text))).forEach((k) => freq.set(k, (freq.get(k) || 0) + 1)));
  const ys = perPage.flat().map((l) => l.y);
  const yMax = Math.max(...ys, 0), yMin = Math.min(...ys, 0), band = 0.06 * (yMax - yMin);
  const inMargin = (l) => l.y >= yMax - band || l.y <= yMin + band; // chỉ coi là đầu/chân trang khi nằm sát mép trên/dưới
  const isNoise = (l) => /^[-–\s]*\d{1,4}[-–\s]*$/.test(l.text) || /^trang\s+\d+/i.test(l.text) || (nPages >= 4 && inMargin(l) && l.text.length < 120 && freq.get(normKey(l.text)) >= Math.max(3, 0.4 * nPages));
  const allH = perPage.flat().map((l) => l.h).filter(Boolean);
  const bodyH = median(allH) || 12;
  const pitches = [];
  perPage.forEach((ls) => { for (let i = 1; i < ls.length; i++) { const d = ls[i - 1].y - ls[i].y; if (d > 0 && d < 3 * bodyH) pitches.push(d); } });
  const pitch = median(pitches) || bodyH * 1.2;

  const blocks = [];
  let cur = null;
  const flush = () => { if (cur) { blocks.push(cur); cur = null; } };
  perPage.forEach((ls, pi) => {
    const kept = ls.filter((l) => !isNoise(l));
    kept.forEach((l, i) => {
      const prev = i > 0 ? kept[i - 1] : null;
      const gap = prev ? prev.y - l.y : 0;
      const big = l.h > bodyH * 1.12;
      const headingLike = l.text.length < 140 && !/[.;,]$/.test(l.text) && (big || (HEAD_RE.test(l.text) && l.text.length < 100) || (l.text === l.text.toUpperCase() && /\p{L}{4}/u.test(l.text)));
      const startsNew = !cur || gap > pitch * 1.45 || LIST_RE.test(l.text) || headingLike || cur.heading || (prev && prev.x - l.x > 0 && l.x - prev.x > bodyH * 1.2 && false);
      if (startsNew) { flush(); cur = { text: l.text, page: pi + 1, heading: headingLike }; }
      else if (/[-‐]$/.test(cur.text) && /^\p{Ll}/u.test(l.text)) cur.text = cur.text.slice(0, -1) + l.text;
      else cur.text += ' ' + l.text;
    });
  });
  flush();
  return blocks.map((b) => ({ kind: b.heading ? 'bold' : 'p', text: b.text.replace(/\s+/g, ' ').trim(), page: b.page })).filter((b) => b.text);
}

/** Phát hiện PDF dạng ảnh scan hoặc phông lỗi mã. Trả về null nếu dùng được, ngược lại mã lỗi. */
export function pdfTextProblem(pageTexts) {
  const n = pageTexts.length;
  const total = pageTexts.reduce((s, t) => s + t.length, 0);
  const empty = pageTexts.filter((t) => t.replace(/\s/g, '').length < 20).length;
  if (n === 0 || total < 200 || total / n < 120 || empty / n > 0.6) return 'scan';
  const all = pageTexts.join(' ');
  const letters = (all.match(/\p{L}/gu) || []).length;
  const weird = (all.match(/[�-¡-¿\u0080-\u009F×÷]/g) || []).length;
  if (letters < 0.4 * all.replace(/\s/g, '').length || weird / Math.max(1, all.length) > 0.03) return 'encoding';
  return null;
}
