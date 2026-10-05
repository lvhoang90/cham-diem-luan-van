// Kiểm chứng máy móc: mọi đoạn trích nguyên văn mà mô hình đưa ra phải tồn tại thật trong văn bản được tải lên.
const norm = (s) => String(s).normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

export function buildIndex(corpus) {
  const parts = [];
  let offset = 0;
  const spans = [];
  for (const f of corpus) {
    for (const b of f.blocks) {
      const t = norm(b.kind === 'row' ? b.cells.join(' ') : b.text);
      spans.push({ start: offset, end: offset + t.length, n: b.n, file: f.fileIndex, filename: f.filename });
      parts.push(t);
      offset += t.length + 1;
    }
  }
  return { hay: parts.join(' '), spans };
}

const locate = (spans, pos) => spans.find((s) => pos >= s.start && pos <= s.end) || null;

/** Trả về { ok, location } — location là đoạn thật chứa trích dẫn (không tin vị trí do mô hình tự khai). */
export function verifyQuote(index, quote) {
  const pieces = String(quote || '').split(/…|\.{3,}/).map(norm).filter((p) => p.split(' ').filter(Boolean).length >= 3);
  if (pieces.length === 0) return { ok: false, location: null };
  let from = 0;
  let first = -1;
  for (const p of pieces) {
    const at = index.hay.indexOf(p, from);
    if (at < 0) return { ok: false, location: null };
    if (first < 0) first = at;
    from = at + p.length;
  }
  const span = locate(index.spans, first);
  return { ok: true, location: span ? { paragraph: span.n, file: span.file, filename: span.filename } : null };
}

/** Lọc danh sách bằng chứng; trả về bằng chứng đã xác thực và số bị loại. */
export function verifyEvidence(index, evidence = []) {
  const kept = [];
  let dropped = 0;
  const seen = new Set();
  for (const e of evidence) {
    const q = String(e?.quote || '').trim();
    if (!q) continue;
    const v = verifyQuote(index, q);
    if (!v.ok) { dropped++; continue; }
    const key = norm(q);
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push({ quote: q, note: e.note || '', ...v.location });
  }
  return { kept, dropped };
}
