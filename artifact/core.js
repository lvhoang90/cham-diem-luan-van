/* ===== Hằng số, thang điểm, ngưỡng (đồng bộ với server/rubric.js, server/config.js) ===== */
const DOC_TYPES = { proposal: 'Đề cương nghiên cứu', article: 'Bài báo khoa học', thesis: 'Luận văn thạc sĩ', dissertation: 'Luận án tiến sĩ', other: 'Công trình khoa học khác' };
const ROLES = { reviewer: 'Người phản biện', supervisor: 'Người hướng dẫn', council: 'Thành viên hội đồng', other: 'Vai trò khác' };
const TH = { reject: 40, major: 55, pass: 60, good: 75 };
const C = (id, label, max, description) => ({ id, label, max, description });
function defaultRubric(t) {
  if (t === 'proposal') return [C('c1', 'Tính cấp thiết và tổng quan nghiên cứu', 20, 'Vấn đề nghiên cứu có căn cứ; tổng quan nêu được những gì đã biết và khoảng trống tri thức.'), C('c2', 'Mục tiêu, câu hỏi và giả thuyết nghiên cứu', 15, 'Rõ ràng, nhất quán, kiểm chứng được, tương xứng với vấn đề.'), C('c3', 'Cơ sở lý thuyết và phương pháp nghiên cứu', 25, 'Khung lý thuyết, thiết kế, mẫu, công cụ, phương pháp phân tích phù hợp với câu hỏi nghiên cứu.'), C('c4', 'Tính mới và ý nghĩa khoa học, thực tiễn', 15, 'Đóng góp dự kiến có căn cứ, không phóng đại.'), C('c5', 'Tính khả thi và đạo đức nghiên cứu', 15, 'Thời gian, nguồn lực, tiếp cận dữ liệu, rủi ro, chuẩn mực đạo đức.'), C('c6', 'Cấu trúc, văn phong và tài liệu tham khảo', 10, 'Bố cục, lập luận, nhất quán trích dẫn, quy cách trình bày.')];
  if (t === 'article') return [C('c1', 'Tính mới và đóng góp khoa học', 20, 'Đóng góp so với tài liệu hiện có được nêu và chứng minh.'), C('c2', 'Tổng quan và khung lý thuyết', 15, 'Bao quát, chọn lọc, định vị đúng nghiên cứu.'), C('c3', 'Phương pháp nghiên cứu', 20, 'Thiết kế, mẫu, đo lường, quy trình có thể kiểm tra và lặp lại.'), C('c4', 'Kết quả và thảo luận', 20, 'Kết quả trung thực, phân tích đúng, diễn giải có đối chiếu tài liệu.'), C('c5', 'Kết luận và tính nhất quán của lập luận', 10, 'Kết luận được bằng chứng ủng hộ; nêu hạn chế.'), C('c6', 'Cấu trúc, văn phong và tài liệu tham khảo', 10, 'Bố cục, ngôn ngữ, trích dẫn, quy cách.'), C('c7', 'Đạo đức và minh bạch học thuật', 5, 'Chấp thuận đạo đức, dữ liệu, xung đột lợi ích, đóng góp tác giả, khai báo công cụ.')];
  if (t === 'dissertation') return [C('c1', 'Tính cấp thiết và tổng quan nghiên cứu', 10, 'Vấn đề, khoảng trống nghiên cứu, tổng quan có hệ thống.'), C('c2', 'Mục tiêu, câu hỏi, giả thuyết và khung lý thuyết', 15, 'Rõ ràng, nhất quán, có nền tảng lý thuyết vững.'), C('c3', 'Phương pháp nghiên cứu', 20, 'Thiết kế, mẫu, công cụ, độ tin cậy/giá trị, phương pháp phân tích.'), C('c4', 'Kết quả nghiên cứu và thảo luận', 20, 'Dữ liệu, phân tích, diễn giải có căn cứ, đối chiếu với tài liệu.'), C('c5', 'Đóng góp mới về khoa học và thực tiễn', 20, 'Đóng góp mới được chứng minh, có phân biệt với nghiên cứu trước.'), C('c6', 'Cấu trúc, lập luận và văn phong', 5, 'Bố cục chặt chẽ, lập luận mạch lạc, văn phong học thuật.'), C('c7', 'Tài liệu tham khảo và liêm chính học thuật', 10, 'Trích dẫn nhất quán, nguồn tin cậy, không có dấu hiệu bất thường về liêm chính.')];
  return [C('c1', 'Tính cấp thiết và tổng quan nghiên cứu', 15, 'Vấn đề, khoảng trống nghiên cứu, tổng quan.'), C('c2', 'Mục tiêu, câu hỏi, giả thuyết và khung lý thuyết', 15, 'Rõ ràng, nhất quán, có nền tảng lý thuyết.'), C('c3', 'Phương pháp nghiên cứu', 20, 'Thiết kế, mẫu, công cụ, phương pháp phân tích.'), C('c4', 'Kết quả nghiên cứu và thảo luận', 20, 'Dữ liệu, phân tích, diễn giải có căn cứ.'), C('c5', 'Đóng góp mới về khoa học và thực tiễn', 15, 'Đóng góp được chứng minh, không phóng đại.'), C('c6', 'Cấu trúc, lập luận và văn phong', 5, 'Bố cục, lập luận, văn phong học thuật.'), C('c7', 'Tài liệu tham khảo và liêm chính học thuật', 10, 'Trích dẫn nhất quán, nguồn tin cậy, liêm chính.')];
}
const DEC = {
  reject: ['danger', 'Không thông qua — đề nghị trả lại, viết lại toàn bộ', 'Công trình chưa đáp ứng yêu cầu tối thiểu về vấn đề nghiên cứu, thiết kế hoặc lập luận. Đề nghị không chấp thuận ở hình thức hiện tại và yêu cầu tác giả xây dựng lại toàn bộ trước khi nộp lại.', 'Từ chối'],
  major_revision: ['danger', 'Chưa thông qua — yêu cầu chỉnh sửa lớn và phản biện lại', 'Công trình có khiếm khuyết đáng kể ở nội dung cốt lõi (thiết kế nghiên cứu, dữ liệu, lập luận hoặc đóng góp). Đề nghị yêu cầu tác giả chỉnh sửa lớn, giải trình từng điểm và nộp lại để đánh giá lại trước khi xem xét thông qua.', 'Chỉnh sửa lớn'],
  minor_revision: ['warning', 'Chưa thông qua — cần chỉnh sửa, bổ sung trước khi xem xét lại', 'Điểm đề xuất thấp hơn ngưỡng 60 nhưng khiếm khuyết có thể khắc phục mà không phải thay đổi hướng nghiên cứu. Đề nghị tác giả chỉnh sửa theo các yêu cầu bắt buộc và nộp lại để xác nhận trước khi thông qua.', 'Chỉnh sửa trước khi thông qua'],
  accept_with_conditions: ['caution', 'Thông qua có điều kiện — chỉnh sửa theo góp ý', 'Công trình đạt yêu cầu tối thiểu nhưng còn hạn chế cần khắc phục. Đề nghị thông qua với điều kiện tác giả hoàn thành các chỉnh sửa bắt buộc và được người hướng dẫn xác nhận.', 'Thông qua có điều kiện'],
  accept: ['ok', 'Thông qua — chỉnh sửa nhỏ (nếu có)', 'Công trình đáp ứng yêu cầu; chỉ cần hoàn thiện các điểm nhỏ nêu trong nhận xét.', 'Thông qua'],
};
const ORDER = ['reject', 'major_revision', 'minor_revision', 'accept_with_conditions', 'accept'];
const decisionFromScore = (s) => (s < TH.reject ? 'reject' : s < TH.major ? 'major_revision' : s < TH.pass ? 'minor_revision' : s < TH.good ? 'accept_with_conditions' : 'accept');
function decide(score, fatal) {
  let key = decisionFromScore(score), floorApplied = false;
  if (fatal.some((d) => d.severity === 'fatal') && ORDER.indexOf(key) > 1) { key = 'major_revision'; floorApplied = true; }
  const d = DEC[key];
  return { key, severity: d[0], label: d[1], advice: d[2], short: d[3], floorApplied, belowPass: score < TH.pass || key === 'major_revision' || key === 'reject' };
}
const round1 = (x) => Math.round(x * 10) / 10;
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(x) ? x : 0));
function computeScore(items) {
  const rows = items.map((i) => { const max = Number(i.max) || 0; return { ...i, max, points: round1(clamp(Number(i.points), 0, max)) }; });
  const sumMax = rows.reduce((s, r) => s + r.max, 0), sum = rows.reduce((s, r) => s + r.points, 0);
  return { rows, sum: round1(sum), sumMax, score100: sumMax > 0 ? round1((sum / sumMax) * 100) : 0 };
}

/* ===== Đọc .docx trong trình duyệt ===== */
class AppError extends Error {}
const clean = (s) => s.replace(/\s+/g, ' ').trim();
function htmlToBlocks(html) {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  doc.querySelectorAll('img').forEach((im) => im.replaceWith(' [hình/biểu đồ] '));
  const blocks = [];
  const push = (kind, text, extra = {}) => { const t = clean(text); if (t) blocks.push({ kind, text: t, ...extra }); };
  const walkList = (el, depth) => {
    for (const li of el.children) {
      if (li.tagName !== 'LI') continue;
      const own = li.cloneNode(true);
      own.querySelectorAll('ul,ol').forEach((x) => x.remove());
      push('li', own.textContent, { depth });
      li.querySelectorAll(':scope > ul, :scope > ol').forEach((sub) => walkList(sub, depth + 1));
    }
  };
  for (const el of doc.body.children) {
    const tag = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) push('heading', el.textContent, { level: Number(tag[1]) });
    else if (tag === 'p') {
      const inner = el.innerHTML.trim();
      const allBold = /^<strong>[\s\S]*<\/strong>$/.test(inner) && !/<\/strong>[\s\S]*<strong>/.test(inner);
      push(allBold ? 'bold' : 'p', el.textContent);
    } else if (tag === 'ul' || tag === 'ol') walkList(el, 0);
    else if (tag === 'table') {
      el.querySelectorAll('tr').forEach((tr) => {
        const cells = [...tr.children].filter((c) => /^t[dh]$/i.test(c.tagName)).map((c) => clean(c.textContent));
        if (cells.some(Boolean)) push('row', cells.join(' | '), { cells: cells.map((c) => c || '[ô trống]') });
      });
    } else push('p', el.textContent);
  }
  return blocks;
}
const PDF_SCAN_MSG = (n) => `Tệp "${n}" là PDF dạng ảnh (bản scan) hoặc không có lớp chữ. Hệ thống chỉ nhận PDF có chữ chọn/sao chép được. Hãy dùng bản gốc từ Word (Save as PDF), hoặc chạy nhận dạng ký tự (OCR) rồi lưu lại.`;
const PDF_ENC_MSG = (n) => `Chữ trong tệp "${n}" bị lỗi mã hóa phông (thường gặp ở PDF dùng phông tiếng Việt cũ), nên không đọc đúng được. Hãy xuất lại PDF từ Word bằng phông Unicode (Times New Roman, Arial…) hoặc gửi bản .docx.`;
let pdfReady = false;
async function readPdf(file) {
  const name = file.name;
  const buf = await file.arrayBuffer();
  if (new TextDecoder('latin1').decode(new Uint8Array(buf, 0, Math.min(5, buf.byteLength))) !== '%PDF-') throw new AppError(`Tệp "${name}" không phải tệp PDF hợp lệ (có thể bị hỏng hoặc chỉ đổi đuôi tệp).`);
  if (!pdfReady) { pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([PDF_WORKER_SRC], { type: 'text/javascript' })); pdfReady = true; }
  let doc;
  try { doc = await pdfjsLib.getDocument({ data: new Uint8Array(buf), isEvalSupported: false, disableFontFace: true, verbosity: 0 }).promise; }
  catch (e) { throw new AppError(e?.name === 'PasswordException' ? `Tệp "${name}" được bảo vệ bằng mật khẩu. Hãy gỡ mật khẩu rồi tải lại.` : `Không mở được tệp "${name}". Tệp có thể bị hỏng.`); }
  try {
    if (doc.numPages > 600) throw new AppError(`Tệp "${name}" có ${doc.numPages} trang, vượt giới hạn 600 trang. Hãy tách thành nhiều tệp.`);
    const pages = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const tc = await (await doc.getPage(p)).getTextContent();
      pages.push(tc.items.filter((i) => typeof i.str === 'string').map((i) => ({ str: i.str, x: i.transform[4], y: i.transform[5], h: Math.abs(i.transform[3]) || i.height || 0, w: i.width || 0 })));
    }
    const problem = pdfTextProblem(pages.map((it) => it.map((i) => i.str).join(' ')));
    if (problem === 'scan') throw new AppError(PDF_SCAN_MSG(name));
    if (problem === 'encoding') throw new AppError(PDF_ENC_MSG(name));
    const blocks = layoutPdfPages(pages);
    if (!blocks.length) throw new AppError(PDF_SCAN_MSG(name));
    return fileFromBlocks(name, blocks);
  } finally { doc.destroy(); }
}
async function readDocument(file) { return /\.pdf$/i.test(file.name) ? readPdf(file) : readDocx(file); }
async function readDocx(file) {
  const name = file.name;
  if (!/\.docx$/i.test(name)) throw new AppError(`Tệp "${name}" không phải định dạng .docx hoặc .pdf. Với tệp .doc, hãy lưu lại từ Word bằng "Save as → Word Document (.docx)".`);
  const buf = await file.arrayBuffer();
  const head = new Uint8Array(buf, 0, Math.min(4, buf.byteLength));
  if (head.length < 4 || head[0] !== 0x50 || head[1] !== 0x4b) throw new AppError(`Tệp "${name}" không phải tệp Word hợp lệ (có thể bị hỏng hoặc chỉ đổi đuôi tệp).`);
  let html;
  try {
    ({ value: html } = await mammoth.convertToHtml({ arrayBuffer: buf }, { convertImage: mammoth.images.imgElement(() => Promise.resolve({ src: 'x', alt: '[hình/biểu đồ]' })) }));
  } catch { throw new AppError(`Không đọc được nội dung tệp "${name}". Tệp có thể bị hỏng.`); }
  const blocks = htmlToBlocks(html);
  if (!blocks.length) throw new AppError(`Tệp "${name}" không có văn bản đọc được (có thể chỉ chứa hình ảnh/bản scan).`);
  return fileFromBlocks(name, blocks);
}
const fileFromBlocks = (filename, blocks) => ({ filename, blocks, words: blocks.reduce((s, b) => s + (b.text.match(/\S+/g) || []).length, 0) });

function buildCorpus(files) { let n = 0; return files.map((f, i) => ({ fileIndex: i + 1, filename: f.filename, blocks: f.blocks.map((b) => ({ ...b, n: ++n })) })); }
function blockLine(b) {
  switch (b.kind) {
    case 'heading': return `[¶${b.n}] ${'#'.repeat(b.level)} ${b.text}`;
    case 'bold': return `[¶${b.n}] **${b.text}**`;
    case 'li': return `[¶${b.n}] ${'  '.repeat(b.depth || 0)}• ${b.text}`;
    case 'row': return `[¶${b.n}] | ${b.cells.join(' | ')} |`;
    default: return `[¶${b.n}] ${b.text}`;
  }
}
const corpusToText = (corpus, tags = true) => corpus.map((f) => { const body = f.blocks.map(blockLine).join('\n'); return tags ? `<tai_lieu tep="${f.fileIndex}" ten="${f.filename.replace(/"/g, "'")}">\n${body}\n</tai_lieu>` : body; }).join('\n\n');
const byteLen = (s) => new TextEncoder().encode(s).length;
const outlineOf = (corpus) => corpus.flatMap((f) => f.blocks.filter((b) => b.kind === 'heading' || b.kind === 'bold').map((b) => `[¶${b.n}] ${b.text}`)).slice(0, 400).join('\n');

/* ===== Kiểm chứng trích dẫn với bản gốc ===== */
const norm = (s) => String(s).normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
function buildIndex(corpus) {
  const parts = [], spans = []; let off = 0;
  for (const f of corpus) for (const b of f.blocks) { const t = norm(b.kind === 'row' ? b.cells.join(' ') : b.text); spans.push({ start: off, end: off + t.length, n: b.n, file: f.fileIndex, filename: f.filename, page: b.page }); parts.push(t); off += t.length + 1; }
  return { hay: parts.join(' '), spans };
}
function verifyQuote(index, quote) {
  const pieces = String(quote || '').split(/…|\.{3,}/).map(norm).filter((p) => p.split(' ').filter(Boolean).length >= 3);
  if (!pieces.length) return { ok: false };
  let from = 0, first = -1;
  for (const p of pieces) { const at = index.hay.indexOf(p, from); if (at < 0) return { ok: false }; if (first < 0) first = at; from = at + p.length; }
  const span = index.spans.find((s) => first >= s.start && first <= s.end);
  return { ok: true, location: span ? { paragraph: span.n, file: span.file, filename: span.filename, ...(span.page ? { page: span.page } : {}) } : {} };
}
function verifyEvidence(index, evidence) {
  const kept = []; let dropped = 0; const seen = new Set();
  for (const e of evidence || []) {
    const q = String(e?.quote || '').trim(); if (!q) continue;
    const v = verifyQuote(index, q);
    if (!v.ok) { dropped++; continue; }
    const k = norm(q); if (seen.has(k)) continue; seen.add(k);
    kept.push({ quote: q, note: e.note || '', ...v.location });
  }
  return { kept, dropped };
}
