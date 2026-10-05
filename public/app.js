const $ = (id) => document.getElementById(id);
const state = { step: 1, templateId: null, template: null, works: [], result: null, health: null, code: sessionStorage.getItem('code') || '' };
const STEPS = ['Mẫu nhận xét', 'Công trình', 'Thông tin', 'Phân tích', 'Kết quả'];

function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null) el.append(kid.nodeType ? kid : document.createTextNode(kid));
  return el;
}

async function api(path, opts = {}) {
  const res = await fetch(path, { ...opts, headers: { ...(opts.headers || {}), 'x-access-code': state.code } });
  if (res.status === 401) { showGate(); throw new Error('Cần mã truy cập.'); }
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('json') ? await res.json() : res;
  if (!res.ok) throw new Error(data.error || 'Đã xảy ra lỗi.');
  return data;
}

function renderSteps() {
  $('steps').replaceChildren(...STEPS.map((t, i) => h('li', { class: i + 1 === state.step ? 'on' : i + 1 < state.step ? 'done' : '' }, h('b', {}, String(i + 1)), t)));
}
function go(n) {
  state.step = n;
  for (let i = 1; i <= 5; i++) $('step' + i).hidden = i !== n;
  $('gate').hidden = true;
  $('bar5').hidden = n !== 5;
  if (n === 4) renderConfirm();
  renderSteps();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function showGate() { for (let i = 1; i <= 5; i++) $('step' + i).hidden = true; $('gate').hidden = false; }

function dropzone(zone, input, onFiles) {
  zone.addEventListener('click', (e) => { if (e.target !== input) input.click(); });
  zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
  ['dragenter', 'dragover'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove('over'); }));
  zone.addEventListener('drop', (e) => onFiles([...e.dataTransfer.files]));
  input.addEventListener('change', () => { onFiles([...input.files]); input.value = ''; });
}
const isDocx = (f) => /\.(docx|pdf)$/i.test(f.name);
function rejectNonDocx(files) {
  const bad = files.filter((f) => !isDocx(f));
  if (bad.length) alert(`Chỉ chấp nhận tệp .docx hoặc PDF có chữ (không phải bản scan). Không nhận: ${bad.map((f) => f.name).join(', ')}.\nVới tệp .doc, hãy lưu lại từ Word bằng "Save as → Word Document (.docx)".`);
  return files.filter(isDocx);
}

// ---------- Bước 1
let tplFile = null;
dropzone($('drop1'), $('file1'), (files) => {
  const ok = rejectNonDocx(files.slice(0, 1));
  if (!ok.length) return;
  tplFile = ok[0];
  $('name1').textContent = `Đã chọn: ${tplFile.name}`;
  $('analyze').disabled = false;
  $('tplResult').hidden = true;
});
$('analyze').addEventListener('click', async () => {
  const btn = $('analyze');
  btn.disabled = true; btn.textContent = 'Đang đọc mẫu…';
  try {
    const fd = new FormData(); fd.append('template', tplFile);
    const r = await api('/api/template', { method: 'POST', body: fd });
    state.templateId = r.templateId; state.template = r.template;
    renderTemplate(r.template);
  } catch (e) { alert(e.message); }
  btn.disabled = false; btn.textContent = 'Đọc mẫu và nhận diện khung';
});
const KIND = { narrative: 'nhận xét', scored: 'chấm điểm', checklist: 'đạt/không đạt', conclusion: 'kết luận' };
function renderTemplate(t) {
  const scored = t.sections.some((s) => s.max_points > 0);
  $('tplSummary').textContent = `Mẫu “${t.template_title}” gồm ${t.sections.length} mục. ` + (scored
    ? `Mẫu có quy định điểm (tổng tối đa ${t.scale_total || 'theo các mục'}); hệ thống sẽ quy đổi về thang 100.`
    : 'Mẫu không quy định điểm thành phần; hệ thống sẽ đề xuất điểm trên thang 100 theo tiêu chí mặc định phù hợp loại văn bản.');
  $('tplList').replaceChildren(...t.sections.map((s) => h('li', { class: 'l' + s.level }, `${s.number} ${s.title}`.trim(), h('span', { class: 'badge' }, KIND[s.kind] || s.kind), s.max_points ? h('span', { class: 'badge' }, `${s.max_points} điểm`) : null)));
  $('tplInfo').textContent = t.info_fields.length ? `Trường thông tin đầu mẫu: ${t.info_fields.map((f) => f.label).join('; ')}.` : '';
  $('tplResult').hidden = false;
}
$('tplOk').addEventListener('click', () => go(2));

// ---------- Bước 2
dropzone($('drop2'), $('file2'), (files) => {
  const max = state.health?.limits?.maxWorkFiles || 10;
  for (const f of rejectNonDocx(files)) if (state.works.length < max && !state.works.some((w) => w.name === f.name && w.size === f.size)) state.works.push(f);
  renderWorks();
});
function renderWorks() {
  $('workList').replaceChildren(...state.works.map((f, i) => h('li', {}, h('span', {}, `${f.name} `, h('span', { class: 'muted' }, `(${(f.size / 1048576).toFixed(1)} MB)`)),
    h('span', {},
      i > 0 ? h('button', { title: 'Lên', onclick: () => { [state.works[i - 1], state.works[i]] = [state.works[i], state.works[i - 1]]; renderWorks(); } }, '↑') : null,
      h('button', { onclick: () => { state.works.splice(i, 1); renderWorks(); } }, 'Bỏ'))))); 
  $('works2next').disabled = state.works.length === 0;
}
$('works2next').addEventListener('click', () => go(3));
document.addEventListener('click', (e) => { const g = e.target.dataset?.go; if (g) go(Number(g)); });

// ---------- Bước 3–4
function renderConfirm() {
  const dt = $('docType').selectedOptions[0]?.textContent, ro = $('role').selectedOptions[0]?.textContent;
  $('confirm').replaceChildren(
    h('div', {}, h('b', {}, 'Mẫu: '), state.template?.template_title || ''),
    h('div', {}, h('b', {}, 'Công trình: '), `${state.works.length} tệp — mỗi tệp là một công trình riêng: ` + state.works.map((f) => f.name).join('; ')),
    h('div', {}, h('b', {}, 'Loại văn bản: '), dt || '', ' · ', h('b', {}, 'Vai trò: '), ro || ''));
}
const ST = { queued: 'Chờ đến lượt', running: 'Đang phân tích', done: 'Xong', error: 'Lỗi', cancelled: 'Đã dừng' };
function drawQueue(items) {
  $('queue').replaceChildren(...items.map((it) => h('li', { class: 'q ' + it.status },
    h('div', { class: 'qh' }, h('span', { class: 'qn' }, it.filename), h('span', { class: 'badge' }, ST[it.status] || it.status)),
    it.status === 'running' ? h('div', { class: 'bar' }, h('div', { class: 'fill', style: `width:${it.progress}%` })) : null,
    h('div', { class: 'muted' }, it.status === 'error' ? it.error : it.status === 'done' && it.summary ? `Điểm đề xuất ${it.summary.score100}/100 — ${it.summary.decision}` : it.message))));
  const done = items.filter((i) => ['done', 'error', 'cancelled'].includes(i.status)).length;
  $('barFill').style.width = Math.max(3, Math.round((done / items.length) * 100)) + '%';
  $('runMsg').textContent = `Đã xử lý ${done}/${items.length} công trình (tuần tự, mỗi công trình một bản nhận xét riêng).`;
}
let jobId = null;
$('runBtn').addEventListener('click', async () => {
  $('runErr').hidden = true; $('runBox').hidden = false; $('runBtn').disabled = true; $('back3').disabled = true; $('stopBtn').hidden = false;
  $('barFill').style.width = '3%'; $('runMsg').textContent = 'Đang tải tệp lên…'; $('queue').replaceChildren();
  let items = [];
  try {
    const fd = new FormData();
    fd.append('templateId', state.templateId);
    for (const k of ['docType', 'role', 'field', 'notes']) fd.append(k, $(k).value);
    state.works.forEach((f) => fd.append('works', f));
    ({ jobId } = await api('/api/review', { method: 'POST', body: fd }));
    for (;;) {
      await new Promise((r) => setTimeout(r, 2000));
      const j = await api('/api/review/' + jobId);
      items = j.items; drawQueue(items);
      if (j.status === 'done') break;
    }
    state.results = {}; state.items = items;
    for (const it of items) if (it.status === 'done') state.results[it.index] = await api(`/api/review/${jobId}/${it.index}`);
    const first = items.find((i) => i.status === 'done');
    if (!first) throw new Error('Không có công trình nào được phân tích thành công. Xem lý do ở từng tệp phía trên.');
    state.cur = first.index; renderResults(); go(5);
  } catch (e) {
    $('runErr').textContent = e.message; $('runErr').hidden = false;
  }
  $('runBtn').disabled = false; $('back3').disabled = false; $('stopBtn').hidden = true;
});
$('stopBtn').addEventListener('click', async () => { if (jobId) { try { await api(`/api/review/${jobId}/cancel`, { method: 'POST' }); $('stopBtn').hidden = true; $('runMsg').textContent = 'Đang dừng sau công trình hiện tại…'; } catch { /* bỏ qua */ } } });

// ---------- Bước 5
const PRI = { bat_buoc: 'Bắt buộc', nen_lam: 'Nên thực hiện', goi_y: 'Gợi ý' };
const lines = (t) => t.split('\n').map((x) => x.trim()).filter(Boolean);
function area(value, onInput, rows) {
  const t = h('textarea', { rows: rows || 4 });
  t.value = value || '';
  const fit = () => { t.style.height = 'auto'; t.style.height = Math.max(t.scrollHeight + 2, 60) + 'px'; };
  t.addEventListener('input', () => { onInput(t.value); fit(); });
  setTimeout(fit, 0);
  return t;
}
function decideClient(score, fatal) {
  const th = state.health.thresholds;
  let key = score < th.reject ? 'reject' : score < th.major ? 'major_revision' : score < th.pass ? 'minor_revision' : score < th.good ? 'accept_with_conditions' : 'accept';
  const order = ['reject', 'major_revision', 'minor_revision', 'accept_with_conditions', 'accept'];
  const floor = fatal.some((d) => d.severity === 'fatal') && order.indexOf(key) > 1;
  if (floor) key = 'major_revision';
  return { key, floor };
}
const DEC = {
  reject: ['danger', 'Không thông qua — đề nghị trả lại, viết lại toàn bộ', 'Công trình chưa đáp ứng yêu cầu tối thiểu về vấn đề nghiên cứu, thiết kế hoặc lập luận. Đề nghị không chấp thuận ở hình thức hiện tại và yêu cầu tác giả xây dựng lại toàn bộ trước khi nộp lại.'],
  major_revision: ['danger', 'Chưa thông qua — yêu cầu chỉnh sửa lớn và phản biện lại', 'Công trình có khiếm khuyết đáng kể ở nội dung cốt lõi. Đề nghị yêu cầu tác giả chỉnh sửa lớn, giải trình từng điểm và nộp lại để đánh giá lại trước khi xem xét thông qua.'],
  minor_revision: ['warning', 'Chưa thông qua — cần chỉnh sửa, bổ sung trước khi xem xét lại', 'Điểm thấp hơn ngưỡng 60 nhưng khiếm khuyết có thể khắc phục mà không phải thay đổi hướng nghiên cứu. Đề nghị tác giả chỉnh sửa theo các yêu cầu bắt buộc và nộp lại để xác nhận.'],
  accept_with_conditions: ['caution', 'Thông qua có điều kiện — chỉnh sửa theo góp ý', 'Công trình đạt yêu cầu tối thiểu nhưng còn hạn chế. Đề nghị thông qua với điều kiện hoàn thành các chỉnh sửa bắt buộc và được người hướng dẫn xác nhận.'],
  accept: ['ok', 'Thông qua — chỉnh sửa nhỏ (nếu có)', 'Công trình đáp ứng yêu cầu; hoàn thiện các điểm nhỏ nêu trong nhận xét.'],
};

function renderResults() {
  const root = $('result');
  root.replaceChildren(h('h2', {}, 'Bước 5. Bản nháp nhận xét — mỗi công trình một bản riêng'), h('p', { class: 'help' }, 'Mỗi tệp được phân tích độc lập, không lẫn nội dung giữa các tác giả. Chọn một dòng để xem, sửa và tải bản nhận xét của công trình đó.'), h('div', { id: 'summary', class: 'tablewrap' }), h('div', { id: 'detail' }));
  drawSummary(); renderDetail();
  $('zipBtn').hidden = Object.keys(state.results).length < 2;
}
const SEV = { danger: 'danger', warning: 'warning', caution: 'caution', ok: 'ok' };
function drawSummary() {
  const rows = state.items.map((it) => {
    const r = state.results[it.index];
    const act = r ? h('button', { class: 'btn link', onclick: () => { state.cur = it.index; drawSummary(); renderDetail(); $('detail').scrollIntoView({ behavior: 'smooth' }); } }, 'Xem / sửa') : null;
    return h('tr', { class: r && it.index === state.cur ? 'cur' : '' },
      h('td', {}, h('b', {}, it.filename), r?.profile?.title && r.profile.title !== 'Không xác định' ? h('div', { class: 'muted' }, r.profile.title) : null, !r ? h('div', { class: 'muted' }, it.status === 'error' ? it.error : ST[it.status]) : null),
      h('td', { class: 'n' }, r ? String(r.score.score100) : '—'),
      h('td', {}, r ? h('span', { class: 'pill ' + r.decision.severity }, r.decision.short, r.decision.belowPass ? ' ⚠' : '') : ''),
      h('td', {}, act));
  });
  $('summary').replaceChildren(h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Công trình (tệp)'), h('th', { class: 'n' }, 'Điểm /100'), h('th', {}, 'Khuyến nghị'), h('th', {}, ''))), h('tbody', {}, rows)));
}

function recompute() {
  const r = state.result;
  const sumMax = r.score.rows.reduce((s, x) => s + x.max, 0);
  const sum = r.score.rows.reduce((s, x) => s + x.points, 0);
  r.score.sum = Math.round(sum * 10) / 10; r.score.sumMax = sumMax;
  r.score.score100 = sumMax ? Math.round((sum / sumMax) * 1000) / 10 : 0;
  const { key, floor } = decideClient(r.score.score100, r.fatalDefects);
  Object.assign(r.decision, { key, label: DEC[key][1], short: DEC[key][1], advice: DEC[key][2], severity: DEC[key][0], floorApplied: floor, belowPass: r.score.score100 < state.health.thresholds.pass || key === 'major_revision' || key === 'reject' });
  r.decision.mismatch = null;
  drawVerdict(); drawSummary();
}

function drawVerdict() {
  const r = state.result, d = r.decision, sc = r.score;
  const box = $('verdict');
  box.replaceChildren(
    h('div', { class: 'card' },
      h('div', { class: 'score' },
        h('div', { class: 'num' }, String(sc.score100), h('small', {}, ' /100')),
        h('div', { style: 'flex:1;min-width:220px' }, h('div', { class: 'gauge' }, h('i', { style: `left:${Math.min(100, sc.score100)}%` })),
          h('div', { class: 'muted' }, 'Mốc: dưới 40 từ chối · 40–54 chỉnh sửa lớn · 55–59 chỉnh sửa trước khi thông qua · 60–74 có điều kiện · từ 75 thông qua'))),
      h('div', { class: 'alert ' + d.severity }, h('strong', {}, d.label), d.advice),
      d.belowPass ? h('div', { class: 'alert danger' }, h('strong', {}, 'CẢNH BÁO — điểm đề xuất dưới ngưỡng thông qua (60/100)'),
        'Đề nghị người hướng dẫn, giáo sư hướng dẫn hoặc người phản biện cân nhắc kỹ trước khi thông qua. Hướng xử lý theo mức điểm: dưới 40 — trả lại, yêu cầu viết lại toàn bộ; 40–54 — chỉnh sửa lớn và phản biện lại; 55–59 — chỉnh sửa, bổ sung rồi xem xét lại.') : null,
      d.floorApplied ? h('p', { class: 'muted' }, 'Khuyến nghị được hạ mức do có khuyết điểm nghiêm trọng, dù điểm số cao hơn.') : null,
      d.mismatch ? h('p', { class: 'muted' }, `Nhận định văn bản của mô hình (${d.mismatch.modelLabel}) khác mức theo ngưỡng điểm; xin cân nhắc.`) : null));
}

function renderDetail() {
  const r = state.result = state.results[state.cur];
  const root = $('detail');
  root.replaceChildren();
  if (r.demo) root.append(h('div', { class: 'alert caution' }, h('strong', {}, 'CHẾ ĐỘ DEMO'), 'Nội dung dưới đây chỉ để thử giao diện, không phải đánh giá thật.'));
  root.append(h('h3', { class: 'who' }, 'Công trình: ', r.files[0].name, r.profile?.title && r.profile.title !== 'Không xác định' ? h('div', { class: 'muted' }, r.profile.title + (r.profile.author && r.profile.author !== 'Không xác định' ? ` — ${r.profile.author}` : '')) : null));
  root.append(h('div', { id: 'verdict' }));
  if (r.warnings.length) root.append(h('div', { class: 'alert caution' }, r.warnings.map((w) => h('div', {}, w))));
  root.append(h('p', { class: 'muted' }, `Đã đối chiếu ${r.verification.kept} đoạn trích với bản gốc; loại ${r.verification.dropped} đoạn không khớp. Quý vị có thể sửa trực tiếp mọi nội dung và điểm dưới đây trước khi tải về.`));

  // bảng điểm
  const tbody = h('tbody');
  r.score.rows.forEach((row) => {
    const inp = h('input', { type: 'number', min: 0, max: row.max, step: '0.5', value: row.points, 'aria-label': `Điểm ${row.label}` });
    inp.addEventListener('input', () => {
      row.points = Math.min(row.max, Math.max(0, Number(inp.value) || 0));
      const sec = r.sections.find((s) => s.id === row.id); if (sec) sec.points = row.points;
      recompute(); $('sumCell').textContent = r.score.sum;
    });
    tbody.append(h('tr', {}, h('td', {}, row.label, row.rationale ? h('div', { class: 'muted' }, row.rationale) : null), h('td', { class: 'n' }, String(row.max)), h('td', { class: 'n' }, inp)));
  });
  root.append(h('details', { class: 'sec', open: true }, h('summary', {}, `Bảng điểm (${r.score.scheme === 'template' ? 'theo mẫu, quy đổi về thang 100' : 'thang 100 mặc định theo loại văn bản'})`),
    h('div', { class: 'body' }, h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Tiêu chí'), h('th', { class: 'n' }, 'Tối đa'), h('th', { class: 'n' }, 'Đề xuất'))), tbody,
      h('tfoot', {}, h('tr', {}, h('td', {}, h('b', {}, 'Tổng')), h('td', { class: 'n' }, String(r.score.sumMax)), h('td', { class: 'n', id: 'sumCell' }, String(r.score.sum))))))));

  if (r.info.length) root.append(h('details', { class: 'sec', open: true }, h('summary', {}, 'Thông tin chung'),
    h('div', { class: 'body' }, r.info.map((x) => h('label', {}, x.label, (() => { const i = h('input', { value: x.value }); i.addEventListener('input', () => { x.value = i.value; }); return i; })())))));

  for (const s of r.sections) {
    const body = h('div', { class: 'body' });
    if (s.insufficient_basis) body.append(h('p', { class: 'lowbasis' }, s.missing ? 'Mô hình chưa trả lời mục này — cần quý vị tự nhận xét.' : 'Văn bản được nộp chưa đủ cơ sở để đánh giá đầy đủ mục này.'));
    body.append(area(s.content, (v) => { s.content = v; }, 6));
    if (s.max_points > 0) body.append(h('p', {}, h('b', {}, 'Điểm: '), `${s.points}/${s.max_points}`, s.point_rationale ? ` — ${s.point_rationale}` : ''));
    for (const [title, key] of [['Ưu điểm', 'strengths'], ['Hạn chế', 'weaknesses']]) {
      if (s[key].length) body.append(h('h4', {}, title + ' (mỗi dòng một ý)'), area(s[key].join('\n'), (v) => { s[key] = lines(v); }, 3));
    }
    if (s.revisions.length) body.append(h('h4', {}, 'Yêu cầu/đề nghị chỉnh sửa'), h('ul', {}, s.revisions.map((x) => h('li', {}, h('b', {}, `[${PRI[x.priority] || 'Gợi ý'}] `), x.action))));
    if (s.evidence.length) body.append(h('h4', {}, 'Căn cứ trong văn bản (đã đối chiếu với bản gốc)'), ...s.evidence.map((e) => h('div', { class: 'ev' }, `“${e.quote}”`, h('small', {}, `${e.filename ? e.filename + ' · ' : ''}đoạn ¶${e.paragraph || '?'}${e.page ? `, trang ${e.page}` : ''}${e.note ? ' — ' + e.note : ''}`))));
    root.append(h('details', { class: 'sec', open: true }, h('summary', {}, `${s.number} ${s.title}`.trim()), body));
  }

  const ov = h('div', { class: 'body' }, h('h4', {}, 'Nhận xét tổng quát'), area(r.overall.summary, (v) => { r.overall.summary = v; }, 6), h('h4', {}, 'Kết luận và kiến nghị'), area(r.overall.conclusion, (v) => { r.overall.conclusion = v; }, 5));
  root.append(h('details', { class: 'sec', open: true }, h('summary', {}, 'Nhận xét tổng quát và kết luận'), ov));

  const ev = (list) => (list || []).map((e) => h('div', { class: 'ev' }, `“${e.quote}”`, h('small', {}, `đoạn ¶${e.paragraph || '?'}`)));
  if (r.fatalDefects.length) root.append(h('details', { class: 'sec', open: true }, h('summary', {}, 'Khuyết điểm nghiêm trọng'), h('div', { class: 'body' }, r.fatalDefects.map((f) => h('div', {}, h('p', {}, h('b', {}, f.severity === 'fatal' ? '[Rất nghiêm trọng] ' : '[Nghiêm trọng] '), f.description), ev(f.evidence))))));
  if (r.integrityNotes.length) root.append(h('details', { class: 'sec', open: true }, h('summary', {}, 'Dấu hiệu cần kiểm tra về liêm chính (không phải kết luận vi phạm)'), h('div', { class: 'body' }, r.integrityNotes.map((n) => h('div', {}, h('p', {}, n.concern, n.suggested_check ? h('span', { class: 'muted' }, ` Đề nghị kiểm tra: ${n.suggested_check}`) : null), ev(n.evidence))))));
  if (r.questions.length) root.append(h('details', { class: 'sec' }, h('summary', {}, 'Câu hỏi đề nghị tác giả giải trình'), h('div', { class: 'body' }, h('ol', {}, r.questions.map((q) => h('li', {}, q))))));
  if (r.limitations.length) root.append(h('details', { class: 'sec' }, h('summary', {}, 'Giới hạn của bản nhận xét tự động'), h('div', { class: 'body' }, h('ul', {}, r.limitations.map((q) => h('li', {}, q))))));
  drawVerdict();
}

async function saveBlob(res, fallback) {
  const cd = res.headers.get('content-disposition') || '';
  const m = cd.match(/filename\*=UTF-8''([^;]+)/);
  const name = m ? decodeURIComponent(m[1]) : fallback;
  const a = h('a', { href: URL.createObjectURL(await res.blob()), download: name });
  document.body.append(a); a.click(); a.remove();
}
const post = (path, body) => api(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
$('exportBtn').addEventListener('click', async () => {
  const btn = $('exportBtn'); btn.disabled = true;
  try { await saveBlob(await post('/api/export', state.result), 'Ban-nhan-xet.docx'); } catch (e) { alert(e.message); }
  btn.disabled = false;
});
$('zipBtn').addEventListener('click', async () => {
  const btn = $('zipBtn'); btn.disabled = true;
  try { await saveBlob(await post('/api/export-zip', { results: Object.values(state.results) }), 'Cac-ban-nhan-xet.zip'); } catch (e) { alert(e.message); }
  btn.disabled = false;
});
$('restart').addEventListener('click', () => { if (confirm('Làm lô công trình khác? Các bản nhận xét hiện tại sẽ bị xóa khỏi màn hình (hãy tải về trước).')) { state.works = []; state.result = null; state.results = {}; state.items = []; renderWorks(); go(2); } });

// ---------- khởi động
$('codeBtn').addEventListener('click', () => { state.code = $('codeInput').value; sessionStorage.setItem('code', state.code); init(); });
async function init() {
  try {
    state.health = await (await fetch('/api/health')).json();
    $('demoTag').hidden = !state.health.demo;
    for (const [id, map] of [['docType', state.health.docTypes], ['role', state.health.roles]]) $(id).replaceChildren(...Object.entries(map).map(([k, v]) => h('option', { value: k }, v)));
    $('docType').value = 'thesis';
    if (state.health.accessCodeRequired) { try { await api('/api/review/x'); } catch (e) { if (e.message.includes('truy cập')) return; } }
    go(state.step);
  } catch { alert('Không kết nối được máy chủ.'); }
}
renderSteps();
init();
