/* ===== Dữ liệu ví dụ (văn bản thử do hệ thống tạo, không thuộc về ai) ===== */
const SAMPLE_TEMPLATE = [
  ['heading', 'PHIẾU NHẬN XÉT ĐỀ CƯƠNG NGHIÊN CỨU (MẪU THỬ)', 1],
  ['row', 'Đề tài:'], ['row', 'Học viên:'], ['row', 'Người nhận xét:'],
  ['bold', '1. Tính cấp thiết của đề tài'], ['p', '(Nhận xét về lý do chọn đề tài, khoảng trống nghiên cứu và mức độ cập nhật của tổng quan tài liệu.)'],
  ['bold', '2. Mục tiêu, câu hỏi nghiên cứu và giả thuyết'], ['p', '(Mục tiêu có rõ ràng, nhất quán với câu hỏi và giả thuyết hay không.)'],
  ['bold', '3. Cơ sở lý thuyết và phương pháp nghiên cứu'], ['p', '(Khung lý thuyết, thiết kế, mẫu, công cụ thu thập và phân tích dữ liệu có phù hợp hay không.)'],
  ['bold', '4. Tính mới, ý nghĩa khoa học và thực tiễn'], ['p', '(Đóng góp dự kiến có căn cứ hay không.)'],
  ['bold', '5. Tính khả thi, đạo đức nghiên cứu và hình thức trình bày'], ['p', '(Thời gian, nguồn lực, vấn đề đạo đức, bố cục, trích dẫn.)'],
  ['bold', '6. Kết luận và đề nghị'], ['p', '(Thông qua / thông qua có chỉnh sửa / không thông qua.)'],
];
const SAMPLE_WORK = [
  ['heading', 'Ảnh hưởng của việc sử dụng công cụ trí tuệ nhân tạo đến kết quả học tập của sinh viên Việt Nam', 1],
  ['bold', '1. Lý do chọn đề tài'],
  ['p', 'Trong những năm gần đây, các công cụ trí tuệ nhân tạo tạo sinh được sinh viên sử dụng rộng rãi trong học tập. Nhiều nghiên cứu cho thấy công cụ này mang lại lợi ích rất lớn cho người học, vì vậy việc nghiên cứu đề tài này là cần thiết.'],
  ['p', 'Theo Trần (2023), sinh viên sử dụng công cụ này thường xuyên có điểm số cao hơn. Tuy nhiên, tác giả chưa tìm thấy nghiên cứu nào về vấn đề này ở Việt Nam.'],
  ['bold', '2. Mục tiêu nghiên cứu'],
  ['p', 'Mục tiêu của đề tài là chứng minh rằng việc sử dụng công cụ trí tuệ nhân tạo làm tăng kết quả học tập của toàn bộ sinh viên Việt Nam.'],
  ['bold', '3. Phương pháp nghiên cứu'],
  ['p', 'Đề tài khảo sát 60 sinh viên năm hai của một lớp thuộc một trường đại học ở Đồng bằng sông Cửu Long bằng bảng hỏi do tác giả tự thiết kế. Sinh viên được chọn là những người tác giả quen biết và sẵn sàng tham gia.'],
  ['p', 'Dữ liệu được xử lý bằng phần mềm thống kê, so sánh điểm trung bình của nhóm dùng công cụ nhiều và nhóm dùng ít. Nếu nhóm dùng nhiều có điểm cao hơn thì kết luận công cụ làm tăng kết quả học tập.'],
  ['bold', '4. Ý nghĩa của đề tài'],
  ['p', 'Kết quả nghiên cứu sẽ là cơ sở để Bộ Giáo dục và Đào tạo ban hành chính sách bắt buộc sinh viên cả nước sử dụng công cụ trí tuệ nhân tạo trong học tập.'],
  ['bold', '5. Kế hoạch thực hiện'],
  ['p', 'Đề tài dự kiến hoàn thành trong hai tuần: một tuần phát bảng hỏi và một tuần viết báo cáo.'],
  ['bold', 'Tài liệu tham khảo'],
  ['li', 'Phạm (2021). Học tập trực tuyến trong đại dịch. Tạp chí Giáo dục, 12(3), 45–52.'],
];
const SAMPLE_WORK2 = [
  ['heading', 'Mối liên hệ giữa thời gian sử dụng mạng xã hội và mức độ tập trung học tập của học sinh trung học cơ sở tại một huyện', 1],
  ['bold', '1. Lý do chọn đề tài'],
  ['p', 'Học sinh trung học cơ sở dành nhiều thời gian cho mạng xã hội, trong khi giáo viên phản ánh tình trạng mất tập trung trong giờ học. Các nghiên cứu trước chủ yếu thực hiện ở bậc đại học, còn ở bậc trung học cơ sở tại địa bàn nông thôn thì số liệu còn ít, đây là khoảng trống mà đề tài hướng tới.'],
  ['bold', '2. Mục tiêu và câu hỏi nghiên cứu'],
  ['p', 'Đề tài nhằm mô tả thời gian sử dụng mạng xã hội và xem xét mối liên hệ giữa thời gian đó với mức độ tập trung học tập của học sinh. Câu hỏi nghiên cứu: (1) Học sinh dành bao nhiêu thời gian mỗi ngày cho mạng xã hội? (2) Thời gian này có liên quan thế nào đến mức độ tập trung học tập tự đánh giá? Giả thuyết: thời gian sử dụng càng nhiều thì mức độ tập trung càng thấp.'],
  ['bold', '3. Phương pháp nghiên cứu'],
  ['p', 'Nghiên cứu cắt ngang bằng bảng hỏi. Tổng thể là học sinh lớp 8 và lớp 9 của ba trường trong huyện; dự kiến chọn mẫu phân tầng theo trường và khối lớp, cỡ mẫu 300 học sinh. Thang đo tập trung được điều chỉnh từ một thang đo đã công bố và sẽ được thử nghiệm trên 30 học sinh trước khi khảo sát chính thức, đánh giá độ tin cậy bằng hệ số Cronbach alpha. Dữ liệu được phân tích bằng thống kê mô tả và tương quan.'],
  ['bold', '4. Đạo đức nghiên cứu và kế hoạch'],
  ['p', 'Đề tài xin sự đồng ý của nhà trường và phụ huynh, học sinh tham gia tự nguyện, bảng hỏi ẩn danh. Kế hoạch thực hiện trong sáu tháng gồm hoàn thiện công cụ, khảo sát, phân tích và viết báo cáo.'],
  ['bold', 'Tài liệu tham khảo'],
  ['li', 'Danh mục tài liệu tham khảo sẽ được bổ sung khi hoàn thiện đề cương.'],
];
const sampleFile = (name, arr) => fileFromBlocks(name, arr.map(([kind, text, level]) => (kind === 'row' ? { kind: 'row', text: `${text} | [ô trống]`, cells: [text, '[ô trống]'] } : kind === 'heading' ? { kind, text, level } : kind === 'li' ? { kind, text, depth: 0 } : { kind, text })));

/* ===== Trạng thái và tiện ích giao diện ===== */
const fmtTok = (n) => Number(n || 0).toLocaleString('vi-VN');
const usageLine = (u) => `≈ ${fmtTok(u.totalTokens)} token (vào ${fmtTok(u.inputTokens)} · ra ${fmtTok(u.outputTokens)}) · ≈ $${u.costUsd.toFixed(2)} (≈ ${fmtTok(u.costVnd)} đ)`;
const $ = (id) => document.getElementById(id);
const state = { step: 1, template: null, works: [], result: null, tplFile: null, ctl: null };
const STEPS = ['Mẫu nhận xét', 'Công trình', 'Thông tin', 'Phân tích', 'Kết quả'];
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v); }
  for (const kid of kids.flat()) if (kid != null) el.append(kid.nodeType ? kid : document.createTextNode(kid));
  return el;
}
const renderSteps = () => $('steps').replaceChildren(...STEPS.map((t, i) => h('li', { class: i + 1 === state.step ? 'on' : i + 1 < state.step ? 'done' : '' }, h('b', {}, String(i + 1)), t)));
function go(n) {
  state.step = n;
  for (let i = 1; i <= 5; i++) $('step' + i).hidden = i !== n;
  $('bar5').hidden = n !== 5;
  if (n === 4) renderConfirm();
  renderSteps(); window.scrollTo({ top: 0, behavior: 'smooth' });
}
function dropzone(zone, input, onFiles) {
  zone.addEventListener('click', (e) => { if (e.target !== input) input.click(); });
  zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
  ['dragenter', 'dragover'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove('over'); }));
  zone.addEventListener('drop', (e) => onFiles([...e.dataTransfer.files]));
  input.addEventListener('change', () => { onFiles([...input.files]); input.value = ''; });
}
function onlyDocx(files, into) {
  const bad = files.filter((f) => !/\.(docx|pdf)$/i.test(f.name));
  if (bad.length) into.textContent = `Chỉ nhận tệp .docx hoặc PDF có chữ (không phải bản scan). Không nhận: ${bad.map((f) => f.name).join(', ')}. Với tệp .doc, hãy lưu lại từ Word bằng "Save as → Word Document (.docx)".`;
  return files.filter((f) => /\.(docx|pdf)$/i.test(f.name));
}

/* ===== Bước 1 ===== */
dropzone($('drop1'), $('file1'), (files) => {
  const ok = onlyDocx(files.slice(0, 1), $('name1')); if (!ok.length) return;
  state.tplFile = ok[0]; state.tplSample = false;
  $('name1').textContent = `Đã chọn: ${ok[0].name}`; $('analyze').disabled = false; $('tplResult').hidden = true;
});
$('useSample').addEventListener('click', () => {
  state.tplFile = sampleFile('Mẫu phiếu nhận xét (ví dụ).docx', SAMPLE_TEMPLATE); state.tplSample = true;
  state.works = [sampleFile('Đề cương thử 1 (ví dụ).docx', SAMPLE_WORK), sampleFile('Đề cương thử 2 (ví dụ).docx', SAMPLE_WORK2)]; state.works.forEach((w) => { w.sample = true; });
  $('name1').textContent = 'Đã chọn bộ ví dụ: mẫu phiếu nhận xét và hai đề cương thử của hai người khác nhau (văn bản do hệ thống tạo để thử nghiệm).';
  $('analyze').disabled = false; $('tplResult').hidden = true; renderWorks();
});
$('analyze').addEventListener('click', async () => {
  const btn = $('analyze'); btn.disabled = true; btn.textContent = 'Đang đọc mẫu…';
  $('tplBusy').hidden = false; $('tplBusy').textContent = 'Đang đọc mẫu và nhận diện khung… có thể mất 10–40 giây (lần đầu sẽ hỏi quyền dùng Claude).';
  $('tplResult').hidden = true;
  try {
    const file = state.tplSample ? state.tplFile : await readDocument(state.tplFile);
    state.tplParsed = file;
    state.tplMeter = newMeter(); state.template = await analyzeTemplate(file, undefined, state.tplMeter);
    renderTemplate(state.template);
  } catch (e) { $('tplBusy').textContent = e instanceof AppError ? e.message : 'Có lỗi khi đọc mẫu. Vui lòng thử lại.'; btn.disabled = false; btn.textContent = 'Đọc mẫu và nhận diện khung'; return; }
  $('tplBusy').hidden = true; btn.disabled = false; btn.textContent = 'Đọc mẫu và nhận diện khung';
});
const KIND = { narrative: 'nhận xét', scored: 'chấm điểm', checklist: 'đạt/không đạt', conclusion: 'kết luận' };
function renderTemplate(t) {
  const scored = t.sections.some((s) => s.max_points > 0);
  $('tplSummary').textContent = `Mẫu “${t.template_title}” gồm ${t.sections.length} mục. ` + (scored ? `Mẫu có quy định điểm (tổng tối đa ${t.scale_total || 'theo các mục'}); hệ thống quy đổi về thang 100.` : 'Mẫu không quy định điểm thành phần; hệ thống đề xuất điểm trên thang 100 theo tiêu chí mặc định phù hợp loại văn bản.');
  $('tplList').replaceChildren(...t.sections.map((s) => h('li', { class: 'l' + s.level }, `${s.number} ${s.title}`.trim(), h('span', { class: 'badge' }, KIND[s.kind] || s.kind), s.max_points ? h('span', { class: 'badge' }, `${s.max_points} điểm`) : null)));
  $('tplCost').textContent = state.tplMeter ? `Chi phí đọc mẫu (một lần cho cả lô, ước lượng): ${usageLine(usageOf(state.tplMeter))}.` : '';
  $('tplInfo').textContent = t.info_fields.length ? `Trường thông tin đầu mẫu: ${t.info_fields.map((f) => f.label).join('; ')}.` : '';
  $('tplResult').hidden = false;
}
$('tplOk').addEventListener('click', () => go(2));

/* ===== Bước 2 ===== */
dropzone($('drop2'), $('file2'), async (files) => {
  const ok = onlyDocx(files, $('workList').previousElementSibling);
  for (const f of ok) if (state.works.length < 10 && !state.works.some((w) => w.filename === f.name && w.size === f.size)) {
    try { const parsed = await readDocument(f); parsed.size = f.size; state.works = state.works.filter((w) => !w.sample); state.works.push(parsed); } catch (e) { alert_(e.message); }
  }
  renderWorks();
});
function alert_(msg) { const n = $('workErr') || h('div', { id: 'workErr', class: 'alert danger', role: 'alert' }); n.textContent = msg; $('workList').before(n); setTimeout(() => n.remove(), 8000); }
function renderWorks() {
  $('workList').replaceChildren(...state.works.map((f, i) => h('li', {}, h('span', {}, f.filename, ' ', h('span', { class: 'muted' }, `(${f.words.toLocaleString('vi-VN')} từ${f.sample ? ' · ví dụ' : ''})`)),
    h('span', {}, i > 0 ? h('button', { title: 'Đưa lên', onclick: () => { [state.works[i - 1], state.works[i]] = [state.works[i], state.works[i - 1]]; renderWorks(); } }, '↑ ') : null, h('button', { onclick: () => { state.works.splice(i, 1); renderWorks(); } }, 'Bỏ')))));
  $('works2next').disabled = !state.works.length;
}
$('works2next').addEventListener('click', () => go(3));
document.addEventListener('click', (e) => { const g = e.target.dataset?.go; if (g) go(Number(g)); });

/* ===== Bước 3–4 ===== */
function renderConfirm() {
  $('confirm').replaceChildren(h('div', {}, h('b', {}, 'Mẫu: '), state.template?.template_title || ''), h('div', {}, h('b', {}, 'Công trình: '), state.works.map((f) => f.filename).join('; ')),
    h('div', {}, h('b', {}, 'Loại văn bản: '), $('docType').selectedOptions[0]?.textContent || '', ' · ', h('b', {}, 'Vai trò: '), $('role').selectedOptions[0]?.textContent || ''));
}
const ST = { queued: 'Chờ đến lượt', running: 'Đang phân tích', done: 'Xong', error: 'Lỗi', cancelled: 'Đã dừng' };
function drawQueue() {
  const items = state.items;
  $('queue').replaceChildren(...items.map((it) => h('li', { class: 'q ' + it.status },
    h('div', { class: 'qh' }, h('span', { class: 'qn' }, it.filename), h('span', { class: 'badge' }, ST[it.status])),
    it.status === 'running' ? h('div', { class: 'bar' }, h('div', { class: 'fill', style: `width:${it.progress}%` })) : null,
    h('div', { class: 'muted' }, it.status === 'error' ? it.error : it.status === 'done' ? `Điểm đề xuất ${it.result.score.score100}/100 — ${it.result.decision.short}` : it.message || ''),
    it.meter?.calls ? h('div', { class: 'muted' }, `Ước lượng đến nay: ${usageLine(usageOf(it.meter))}`) : null)));
  const done = items.filter((i) => ['done', 'error', 'cancelled'].includes(i.status)).length;
  $('barFill').style.width = Math.max(3, Math.round((done / items.length) * 100)) + '%';
  $('runMsg').textContent = `Đã xử lý ${done}/${items.length} công trình (tuần tự, mỗi công trình một bản nhận xét riêng). Đã dùng ${usageLine(usageOf(sumMeters([state.tplMeter || newMeter(), ...items.map((i) => i.meter || newMeter())])))}.`;
}
let tick;
$('runBtn').addEventListener('click', async () => {
  $('runErr').hidden = true; $('runBox').hidden = false; $('runBtn').disabled = true; $('back3').disabled = true; $('stopBtn').hidden = false;
  state.ctl = new AbortController(); const t0 = Date.now();
  state.items = state.works.map((w) => ({ filename: w.filename, status: 'queued', progress: 0, message: 'Đang chờ đến lượt' }));
  state.results = {}; drawQueue();
  const meta = { docType: $('docType').value, role: $('role').value, field: $('field').value.trim(), notes: $('notes').value.trim() };
  clearInterval(tick); tick = setInterval(() => { for (const it of state.items) if (it.status === 'running') it.message = it.base ? `${it.base} (${Math.round((Date.now() - it.t0) / 1000)} giây)` : it.message; drawQueue(); }, 1000);
  // Mỗi tệp là một công trình của một người: đọc tuần tự, mỗi công trình một lượt phân tích riêng, không dùng chung ngữ cảnh.
  for (let i = 0; i < state.works.length; i++) {
    const it = state.items[i];
    if (state.ctl.signal.aborted) { it.status = 'cancelled'; it.message = 'Đã dừng'; continue; }
    it.status = 'running'; it.progress = 3; it.t0 = Date.now(); it.base = 'Đang bắt đầu…'; it.meter = newMeter();
    try {
      it.result = await runReview({ template: state.template, workFiles: [state.works[i]], meta, onProgress: (p, m) => { it.progress = p; it.base = m; }, signal: state.ctl.signal, meter: it.meter });
      it.status = 'done'; it.progress = 100; state.results[i] = it.result; delete it.base;
    } catch (e) {
      if (e?.code === 'cancelled' || state.ctl.signal.aborted) { it.status = 'cancelled'; it.message = 'Đã dừng'; }
      else { it.status = 'error'; it.error = e instanceof AppError ? e.message : 'Có lỗi khi phân tích công trình này. Vui lòng thử lại.'; }
    }
    drawQueue();
  }
  clearInterval(tick); drawQueue();
  $('runBtn').disabled = false; $('back3').disabled = false; $('stopBtn').hidden = true;
  const first = state.items.findIndex((i) => i.status === 'done');
  if (first < 0) { $('runErr').textContent = 'Không có công trình nào được phân tích thành công. Xem lý do ở từng tệp phía trên.'; $('runErr').hidden = false; return; }
  state.cur = first; renderResults(); go(5);
});
$('stopBtn').addEventListener('click', () => { state.ctl?.abort(); $('stopBtn').hidden = true; });

/* ===== Bước 5: kết quả ===== */
const PRI = { bat_buoc: 'Bắt buộc', nen_lam: 'Nên thực hiện', goi_y: 'Gợi ý' };
const lines = (t) => t.split('\n').map((x) => x.trim()).filter(Boolean);
function area(value, onInput, rows) {
  const t = h('textarea', { rows: rows || 4 }); t.value = value || '';
  const fit = () => { t.style.height = 'auto'; t.style.height = Math.max(t.scrollHeight + 2, 60) + 'px'; };
  t.addEventListener('input', () => { onInput(t.value); fit(); }); setTimeout(fit, 0); return t;
}
function renderResults() {
  $('result').replaceChildren(h('h2', {}, 'Bước 5. Bản nháp nhận xét — mỗi công trình một bản riêng'), h('div', { id: 'usagePanel', class: 'card' }), h('p', { class: 'help' }, 'Mỗi tệp được phân tích độc lập, không lẫn nội dung giữa các tác giả. Chọn một dòng để xem, sửa và lưu bản nhận xét của công trình đó.'), h('div', { id: 'summary', class: 'tablewrap' }), h('div', { id: 'detail' }));
  drawUsage(); drawSummary(); renderDetail();
  $('zipBtn').hidden = Object.keys(state.results).length < 2;
}
function drawUsage() {
  const metered = state.items.filter((i) => i.meter?.calls);
  const total = usageOf(sumMeters([state.tplMeter || newMeter(), ...metered.map((i) => i.meter)]));
  const done = state.items.filter((i) => i.status === 'done').length;
  const rows = metered.map((it) => { const u = usageOf(it.meter); return h('tr', {}, h('td', {}, it.filename), h('td', { class: 'n' }, fmtTok(u.totalTokens)), h('td', { class: 'n' }, `≈ $${u.costUsd.toFixed(2)}`)); });
  if (state.tplMeter) { const u = usageOf(state.tplMeter); rows.unshift(h('tr', {}, h('td', {}, 'Đọc mẫu nhận xét (một lần)'), h('td', { class: 'n' }, fmtTok(u.totalTokens)), h('td', { class: 'n' }, `≈ $${u.costUsd.toFixed(2)}`))); }
  $('usagePanel').replaceChildren(
    h('h3', { style: 'margin-top:0' }, 'Token và chi phí của phiên này (ước lượng)'),
    h('p', {}, h('b', {}, `≈ ${fmtTok(total.totalTokens)} token`), ` (vào ${fmtTok(total.inputTokens)} · ra ${fmtTok(total.outputTokens)}) · `, h('b', {}, `≈ $${total.costUsd.toFixed(2)} (≈ ${fmtTok(total.costVnd)} đ)`), done > 1 ? ` · trung bình ≈ $${(total.costUsd / done).toFixed(2)}/công trình` : ''),
    h('p', { class: 'muted' }, 'Trang này không nhận được số token thật từ nền tảng nên chỉ ước lượng: khoảng 2,6 ký tự mỗi token với tiếng Việt, đầu ra nhân đôi để tính phần mô hình suy luận. Tiền tính theo giá API tham khảo của Claude Opus 5.5 ($4 vào / $20 ra mỗi triệu token), tỷ giá 1 USD ≈ 25.500 đ. Thực tế các lượt này trừ vào hạn mức gói Claude của người đang mở trang, không phát sinh hóa đơn API; sai số có thể vài chục phần trăm. Bản máy chủ ghi số token thật.'),
    h('details', {}, h('summary', {}, 'Chi tiết theo từng công trình'), h('div', { class: 'tablewrap' }, h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Hạng mục'), h('th', { class: 'n' }, 'Token'), h('th', { class: 'n' }, 'Chi phí'))), h('tbody', {}, rows)))));
}
function drawSummary() {
  const rows = state.items.map((it, i) => {
    const r = state.results[i];
    return h('tr', { class: r && i === state.cur ? 'cur' : '' },
      h('td', {}, h('b', {}, it.filename), r?.profile?.title && r.profile.title !== 'Không xác định' ? h('div', { class: 'muted' }, r.profile.title) : null, !r ? h('div', { class: 'muted' }, it.status === 'error' ? it.error : ST[it.status]) : null),
      h('td', { class: 'n' }, r && r.score.sumMax ? String(r.score.score100) : '—'),
      h('td', {}, r ? h('span', { class: 'pill ' + r.decision.severity }, r.decision.short, r.decision.belowPass ? ' ⚠' : '') : ''),
      h('td', {}, r ? h('button', { class: 'btn link', onclick: () => { state.cur = i; drawSummary(); renderDetail(); $('detail').scrollIntoView({ behavior: 'smooth' }); } }, 'Xem / sửa') : null));
  });
  $('summary').replaceChildren(h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Công trình (tệp)'), h('th', { class: 'n' }, 'Điểm /100'), h('th', {}, 'Khuyến nghị'), h('th', {}, ''))), h('tbody', {}, rows)));
}

function recompute() {
  const r = state.result;
  const sumMax = r.score.rows.reduce((s, x) => s + x.max, 0), sum = r.score.rows.reduce((s, x) => s + x.points, 0);
  r.score.sum = round1(sum); r.score.sumMax = sumMax; r.score.score100 = sumMax ? round1((sum / sumMax) * 100) : 0;
  r.decision = { ...(sumMax ? decide(r.score.score100, r.fatalDefects) : UNSCORED), mismatch: null };
  drawVerdict(); drawSummary();
}
function drawVerdict() {
  const r = state.result, d = r.decision, sc = r.score;
  $('verdict').replaceChildren(h('div', { class: 'card' },
    h('div', { class: 'score' }, h('div', { class: 'num' }, sc.sumMax ? String(sc.score100) : '—', h('small', {}, ' /100')),
      h('div', { style: 'flex:1;min-width:220px' }, h('div', { class: 'gauge' }, h('i', { style: `left:${Math.min(100, sc.score100)}%` })),
        h('div', { class: 'muted' }, 'Mốc: dưới 40 từ chối · 40–54 chỉnh sửa lớn · 55–59 chỉnh sửa trước khi thông qua · 60–74 có điều kiện · từ 75 thông qua'))),
    h('div', { class: 'alert ' + d.severity }, h('strong', {}, d.label), d.advice),
    d.belowPass ? h('div', { class: 'alert danger' }, h('strong', {}, 'CẢNH BÁO — điểm đề xuất dưới ngưỡng thông qua (60/100)'), 'Đề nghị người hướng dẫn, giáo sư hướng dẫn hoặc người phản biện cân nhắc kỹ trước khi thông qua. Hướng xử lý theo mức điểm: dưới 40 — trả lại, yêu cầu viết lại toàn bộ; 40–54 — chỉnh sửa lớn và phản biện lại; 55–59 — chỉnh sửa, bổ sung rồi xem xét lại.') : null,
    d.floorApplied ? h('p', { class: 'muted' }, 'Khuyến nghị được hạ mức do có khuyết điểm nghiêm trọng, dù điểm số cao hơn.') : null,
    d.mismatch ? h('p', { class: 'muted' }, `Nhận định văn bản của mô hình (${d.mismatch.modelLabel}) khác mức theo ngưỡng điểm; xin cân nhắc.`) : null));
}
function renderDetail() {
  const r = state.result = state.results[state.cur], root = $('detail'); root.replaceChildren();
  root.append(h('h3', { class: 'who' }, 'Công trình: ', r.files[0].name, r.profile?.title && r.profile.title !== 'Không xác định' ? h('div', { class: 'muted' }, r.profile.title + (r.profile.author && r.profile.author !== 'Không xác định' ? ` — ${r.profile.author}` : '')) : null), h('div', { id: 'verdict' }));
  if (r.warnings.length) root.append(h('div', { class: 'alert caution' }, r.warnings.map((w) => h('div', {}, w))));
  root.append(h('p', { class: 'muted' }, `Đã đối chiếu ${r.verification.kept} đoạn trích với bản gốc; loại ${r.verification.dropped} đoạn không khớp. Quý vị có thể sửa trực tiếp mọi nội dung và điểm dưới đây trước khi lưu.`));
  const tbody = h('tbody');
  r.score.rows.forEach((row) => {
    const inp = h('input', { type: 'number', min: 0, max: row.max, step: '0.5', value: row.points, 'aria-label': `Điểm ${row.label}` });
    inp.addEventListener('input', () => { row.points = Math.min(row.max, Math.max(0, Number(inp.value) || 0)); const sec = r.sections.find((s) => s.id === row.id); if (sec) sec.points = row.points; recompute(); $('sumCell').textContent = r.score.sum; });
    tbody.append(h('tr', {}, h('td', {}, row.label, row.rationale ? h('div', { class: 'muted' }, row.rationale) : null), h('td', { class: 'n' }, String(row.max)), h('td', { class: 'n' }, inp)));
  });
  root.append(h('details', { class: 'sec', open: true }, h('summary', {}, `Bảng điểm (${r.score.scheme === 'template' ? 'theo mẫu, quy đổi về thang 100' : 'thang 100 mặc định theo loại văn bản'})`),
    h('div', { class: 'body tablewrap' }, h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Tiêu chí'), h('th', { class: 'n' }, 'Tối đa'), h('th', { class: 'n' }, 'Đề xuất'))), tbody, h('tfoot', {}, h('tr', {}, h('td', {}, h('b', {}, 'Tổng')), h('td', { class: 'n' }, String(r.score.sumMax)), h('td', { class: 'n', id: 'sumCell' }, String(r.score.sum))))))));
  if (r.info.length) root.append(h('details', { class: 'sec', open: true }, h('summary', {}, 'Thông tin chung'), h('div', { class: 'body' }, r.info.map((x) => h('label', {}, x.label, (() => { const i = h('input', { value: x.value }); i.addEventListener('input', () => { x.value = i.value; }); return i; })())))));
  for (const s of r.sections) {
    const body = h('div', { class: 'body' });
    if (s.insufficient_basis) body.append(h('p', { class: 'lowbasis' }, s.missing ? 'Mô hình chưa trả lời mục này — cần quý vị tự nhận xét.' : 'Văn bản được nộp chưa đủ cơ sở để đánh giá đầy đủ mục này.'));
    body.append(area(s.content, (v) => { s.content = v; }, 6));
    if (s.max_points > 0) body.append(h('p', {}, h('b', {}, 'Điểm: '), `${s.points}/${s.max_points}`, s.point_rationale ? ` — ${s.point_rationale}` : ''));
    for (const [title, key] of [['Ưu điểm', 'strengths'], ['Hạn chế', 'weaknesses']]) if (s[key].length) body.append(h('h4', {}, title + ' (mỗi dòng một ý)'), area(s[key].join('\n'), (v) => { s[key] = lines(v); }, 3));
    if (s.revisions.length) body.append(h('h4', {}, 'Yêu cầu/đề nghị chỉnh sửa'), h('ul', {}, s.revisions.map((x) => h('li', {}, h('b', {}, `[${PRI[x.priority] || 'Gợi ý'}] `), x.action))));
    if (s.evidence.length) body.append(h('h4', {}, 'Căn cứ trong văn bản (đã đối chiếu với bản gốc)'), ...s.evidence.map((e) => h('div', { class: 'ev' }, `“${e.quote}”`, h('small', {}, `${e.filename ? e.filename + ' · ' : ''}đoạn ¶${e.paragraph || '?'}${e.page ? `, trang ${e.page}` : ''}${e.note ? ' — ' + e.note : ''}`))));
    root.append(h('details', { class: 'sec', open: true }, h('summary', {}, `${s.number} ${s.title}`.trim()), body));
  }
  root.append(h('details', { class: 'sec', open: true }, h('summary', {}, 'Nhận xét tổng quát và kết luận'), h('div', { class: 'body' }, h('h4', {}, 'Nhận xét tổng quát'), area(r.overall.summary, (v) => { r.overall.summary = v; }, 6), h('h4', {}, 'Kết luận và kiến nghị'), area(r.overall.conclusion, (v) => { r.overall.conclusion = v; }, 5))));
  const ev = (list) => (list || []).map((e) => h('div', { class: 'ev' }, `“${e.quote}”`, h('small', {}, `đoạn ¶${e.paragraph || '?'}`)));
  if (r.fatalDefects.length) root.append(h('details', { class: 'sec', open: true }, h('summary', {}, 'Khuyết điểm nghiêm trọng'), h('div', { class: 'body' }, r.fatalDefects.map((f) => h('div', {}, h('p', {}, h('b', {}, f.severity === 'fatal' ? '[Rất nghiêm trọng] ' : '[Nghiêm trọng] '), f.description), ev(f.evidence))))));
  if (r.integrityNotes.length) root.append(h('details', { class: 'sec', open: true }, h('summary', {}, 'Dấu hiệu cần kiểm tra về liêm chính (không phải kết luận vi phạm)'), h('div', { class: 'body' }, r.integrityNotes.map((n) => h('div', {}, h('p', {}, n.concern, n.suggested_check ? h('span', { class: 'muted' }, ` Đề nghị kiểm tra: ${n.suggested_check}`) : null), ev(n.evidence))))));
  if (r.questions.length) root.append(h('details', { class: 'sec' }, h('summary', {}, 'Câu hỏi đề nghị tác giả giải trình'), h('div', { class: 'body' }, h('ol', {}, r.questions.map((q) => h('li', {}, q))))));
  if (r.limitations.length) root.append(h('details', { class: 'sec' }, h('summary', {}, 'Giới hạn của bản nhận xét tự động'), h('div', { class: 'body' }, h('ul', {}, r.limitations.map((q) => h('li', {}, q))))));
  drawVerdict();
}

/* ===== Xuất .docx (đồng bộ với server/export-docx.js) ===== */
async function buildDocx(r) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, Footer, PageNumber } = docx;
  const FONT = 'Times New Roman', SIZE = 26, s = (v) => (v == null ? '' : String(v)), paras = (t) => s(t).split(/\n+/).map((x) => x.trim()).filter(Boolean);
  const run = (text, o = {}) => new TextRun({ text: s(text), font: FONT, size: o.size || SIZE, bold: o.bold, italics: o.italics });
  const P = (text, o = {}) => new Paragraph({ children: [run(text, o)], alignment: o.align || AlignmentType.JUSTIFIED, spacing: { after: o.after ?? 100, line: 300 }, indent: o.indent ? { left: o.indent } : undefined });
  const label = (l, t) => new Paragraph({ children: [run(l, { bold: true }), run(t)], spacing: { after: 80, line: 300 }, alignment: AlignmentType.JUSTIFIED });
  const bullet = (t) => new Paragraph({ children: [run(t)], bullet: { level: 0 }, spacing: { after: 60, line: 290 }, alignment: AlignmentType.JUSTIFIED });
  const H = (t, lv) => new Paragraph({ heading: [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][lv - 1], children: [run(t, { bold: true, size: lv === 1 ? 28 : SIZE })], spacing: { before: lv === 1 ? 280 : 180, after: 100 }, keepNext: true });
  const bd = { style: BorderStyle.SINGLE, size: 4, color: '808080' }, borders = { top: bd, bottom: bd, left: bd, right: bd };
  const cell = (t, w, o = {}) => new TableCell({ borders, width: { size: w, type: WidthType.PERCENTAGE }, shading: o.head ? { fill: 'EDEDED' } : undefined, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [run(t, { bold: o.bold || o.head, size: 24 })], alignment: o.right ? AlignmentType.RIGHT : AlignmentType.LEFT })] });
  const refOf = (e) => `${e.file ? `tệp ${e.file}, ` : ''}${e.paragraph ? `đoạn ¶${e.paragraph}` : ''}${e.page ? `, trang ${e.page}` : ''}`.replace(/, $/, '');
  const evb = (evs) => (evs?.length ? [P('Căn cứ trong văn bản:', { bold: true, after: 40 }), ...evs.map((e) => P(`“${s(e.quote)}” (${refOf(e) || 'vị trí không xác định'})`, { italics: true, size: 24, indent: 360, after: 60 }))] : []);
  const body = [], t = r.template || {};
  body.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [run(s(t.title || 'PHIẾU NHẬN XÉT').toUpperCase(), { bold: true, size: 30 })] }));
  body.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [run('Bản nháp do hệ thống hỗ trợ soạn thảo — người nhận xét thẩm định, chỉnh sửa và chịu trách nhiệm về nội dung cuối cùng', { italics: true, size: 22 })] }));
  const info = (r.info || []).filter((x) => x.label);
  if (info.length) { body.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: info.map((x) => new TableRow({ children: [cell(x.label, 35, { bold: true }), cell(x.value, 65)] })) })); body.push(P('', { after: 120 })); }
  for (const sec of r.sections || []) {
    body.push(H(`${s(sec.number)} ${s(sec.title)}`.trim(), Math.min(3, Math.max(1, sec.level || 1))));
    if (sec.insufficient_basis) body.push(P('Lưu ý: văn bản được nộp chưa đủ cơ sở để đánh giá đầy đủ mục này.', { italics: true }));
    paras(sec.content).forEach((x) => body.push(P(x)));
    if (sec.max_points > 0) body.push(label('Điểm đề xuất: ', `${s(sec.points)}/${s(sec.max_points)}${sec.point_rationale ? ` — ${s(sec.point_rationale)}` : ''}`));
    if (sec.strengths?.length) { body.push(P('Ưu điểm:', { bold: true, after: 40 })); sec.strengths.forEach((x) => body.push(bullet(x))); }
    if (sec.weaknesses?.length) { body.push(P('Hạn chế:', { bold: true, after: 40 })); sec.weaknesses.forEach((x) => body.push(bullet(x))); }
    if (sec.revisions?.length) { body.push(P('Yêu cầu/đề nghị chỉnh sửa:', { bold: true, after: 40 })); sec.revisions.forEach((x) => body.push(bullet(`[${PRI[x.priority] || 'Gợi ý'}] ${s(x.action)}`))); }
    body.push(...evb(sec.evidence));
  }
  const sc = r.score || {}, d = r.decision || {};
  body.push(H('ĐỀ XUẤT ĐIỂM VÀ KHUYẾN NGHỊ', 1));
  if (sc.rows?.length) {
    body.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [cell('Tiêu chí', 60, { head: true }), cell('Điểm tối đa', 20, { head: true, right: true }), cell('Điểm đề xuất', 20, { head: true, right: true })] }), ...sc.rows.map((x) => new TableRow({ children: [cell(x.label, 60), cell(String(x.max), 20, { right: true }), cell(String(x.points), 20, { right: true })] })), new TableRow({ children: [cell('Tổng', 60, { bold: true }), cell(String(sc.sumMax), 20, { bold: true, right: true }), cell(String(sc.sum), 20, { bold: true, right: true })] })] }));
    body.push(P('', { after: 80 }));
  }
  body.push(label('Điểm đề xuất (thang 100): ', s(sc.score100)), label('Khuyến nghị: ', s(d.label)), P(s(d.advice)));
  if (d.belowPass) body.push(P('CẢNH BÁO: điểm đề xuất thấp hơn ngưỡng thông qua (60/100). Đề nghị người hướng dẫn, giáo sư hướng dẫn hoặc người phản biện cân nhắc kỹ khuyến nghị nêu trên trước khi thông qua.', { bold: true }));
  if (d.floorApplied) body.push(P('Lưu ý: khuyến nghị được hạ mức do có khuyết điểm nghiêm trọng, dù điểm số cao hơn.', { italics: true }));
  if (d.mismatch) body.push(P(`Lưu ý: nhận định văn bản của mô hình (${s(d.mismatch.modelLabel)}) khác với mức theo ngưỡng điểm; người nhận xét cần cân nhắc.`, { italics: true }));
  const ov = r.overall || {};
  if (ov.summary || ov.conclusion) { body.push(H('Nhận xét tổng quát và kết luận', 2)); paras(ov.summary).forEach((x) => body.push(P(x))); paras(ov.conclusion).forEach((x) => body.push(P(x))); }
  if (r.fatalDefects?.length) { body.push(H('Khuyết điểm nghiêm trọng', 2)); for (const f of r.fatalDefects) { body.push(bullet(`${f.severity === 'fatal' ? '[Rất nghiêm trọng] ' : '[Nghiêm trọng] '}${s(f.description)}`)); body.push(...evb(f.evidence)); } }
  if (r.integrityNotes?.length) { body.push(H('Dấu hiệu cần kiểm tra về liêm chính học thuật', 2), P('Các nội dung dưới đây chỉ là dấu hiệu cần kiểm tra, không phải kết luận về vi phạm.', { italics: true })); for (const n of r.integrityNotes) { body.push(bullet(s(n.concern))); if (n.suggested_check) body.push(P(`Đề nghị kiểm tra: ${s(n.suggested_check)}`, { indent: 360, after: 60 })); body.push(...evb(n.evidence)); } }
  if (r.questions?.length) { body.push(H('Câu hỏi đề nghị tác giả giải trình', 2)); r.questions.forEach((q, i) => body.push(P(`${i + 1}. ${s(q)}`, { indent: 240 }))); }
  if (r.limitations?.length) { body.push(H('Giới hạn của bản nhận xét tự động', 2)); r.limitations.forEach((x) => body.push(bullet(x))); }
  body.push(P(`Đã đối chiếu ${r.verification?.kept ?? 0} đoạn trích với bản gốc (loại ${r.verification?.dropped ?? 0} đoạn không khớp). Hệ thống không kiểm tra trùng lặp (đạo văn) và không xác minh sự tồn tại của tài liệu tham khảo; người nhận xét cần thực hiện các việc này bằng công cụ chuyên dụng.`, { italics: true, size: 22 }));
  const doc = new Document({ creator: 'Người nhận xét', title: s(t.title || 'Phiếu nhận xét'), styles: { default: { document: { run: { font: FONT, size: SIZE } } } },
    sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1701, right: 1134 } } }, footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 22 })] })] }) }, children: body }] });
  return Packer.toBlob(doc);
}
/* Tên tệp nhận xét theo công trình (đồng bộ với server/export-docx.js) */
function exportFileName(r) {
  const base = String(r?.files?.[0]?.name || 'cong-trinh').replace(/\.(docx|pdf)$/i, '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) || 'cong-trinh';
  return `Nhan-xet - ${base}.docx`;
}
function uniqueName(name, used) { let n = name, i = 2; while (used.has(n.toLowerCase())) n = name.replace(/\.docx$/, ` (${i++}).docx`); used.add(n.toLowerCase()); return n; }
async function saveFile(btn, make) {
  btn.disabled = true;
  const old = $('saveMsg'); if (old) old.remove();
  const say = (m) => $('bar5').prepend(h('span', { id: 'saveMsg', class: 'muted', role: 'status', style: 'align-self:center;margin-right:auto' }, m));
  try {
    const dl = await claude.use('downloads');
    if (!dl) throw { code: 'unavailable' };
    const { filename, data } = await make();
    await dl.save({ filename, data });
    say('Đã gửi tệp để lưu.');
  } catch (e) { say(e?.code === 'declined' ? 'Đã hủy lưu.' : e?.code === 'unavailable' ? 'Chế độ xem này không cho lưu tệp. Hãy mở trang trong claude.ai.' : 'Không lưu được tệp. Vui lòng thử lại.'); }
  btn.disabled = false;
}
$('exportBtn').addEventListener('click', () => saveFile($('exportBtn'), async () => ({ filename: exportFileName(state.result), data: await buildDocx(state.result) })));
$('zipBtn').addEventListener('click', () => saveFile($('zipBtn'), async () => {
  const zip = new JSZip(), used = new Set();
  for (const r of Object.values(state.results)) zip.file(uniqueName(exportFileName(r), used), await buildDocx(r));
  return { filename: 'Cac-ban-nhan-xet.zip', data: await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }) };
}));
$('restart').addEventListener('click', () => { state.works = []; state.result = null; state.results = {}; state.items = []; renderWorks(); go(2); });

/* ===== Khởi động ===== */
for (const [id, map] of [['docType', DOC_TYPES], ['role', ROLES]]) $(id).replaceChildren(...Object.entries(map).map(([k, v]) => h('option', { value: k }, v)));
$('docType').value = 'thesis';
renderSteps(); go(1);
(async () => {
  try { sampleFn = window.claude ? await window.claude.use('sample') : null; } catch { sampleFn = null; }
  if (!sampleFn) { $('step1').hidden = true; $('nosample').hidden = false; }
})();
