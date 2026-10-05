process.env.MOCK_LLM = '1';
process.env.USAGE_LOG = ''; // không ghi nhật ký khi chạy kiểm thử // phải đặt trước khi nạp mô-đun (import tĩnh được nâng lên đầu tệp)
import test from 'node:test';
import assert from 'node:assert/strict';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { templateDocx, workDocx, makePdf } from './helpers.js';

const { createApp } = await import('../server/index.js');
const { assemble, normalizeTemplate } = await import('../server/pipeline.js');
const { readDocx, buildCorpus } = await import('../server/docx-read.js');
const { buildIndex } = await import('../server/verify.js');

let server, base;
test.before(async () => { server = createApp().listen(0); base = `http://127.0.0.1:${server.address().port}`; });
test.after(() => server.close());

const form = (entries) => { const fd = new FormData(); for (const [k, v, n] of entries) (n ? fd.append(k, v, n) : fd.append(k, v)); return fd; };
const docxBlob = (buf) => new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

test('luồng đầy đủ: nhiều công trình của nhiều người → mỗi tệp một kết quả riêng, một .docx riêng, không lẫn nhau', async () => {
  const t = await (await fetch(`${base}/api/template`, { method: 'POST', body: form([['template', docxBlob(await templateDocx()), 'mau.docx']]) })).json();
  assert.equal(t.template.sections.length, 5);
  assert.ok(t.template.info_fields.some((f) => f.label === 'Đề tài'));

  const works = [
    ['Nguyễn Văn A - de cuong.docx', await workDocx('Đề tài của người thứ nhất về năng lực tự học')],
    ['Trần Thị B - de cuong.docx', await workDocx('Đề tài của người thứ hai về chuyển đổi số trong trường học')],
  ];
  const res = await fetch(`${base}/api/review`, { method: 'POST', body: form([['templateId', t.templateId], ['docType', 'proposal'], ['role', 'reviewer'], ...works.map(([n, w]) => ['works', docxBlob(w), n])]) });
  assert.equal(res.status, 202);
  const { jobId, count } = await res.json();
  assert.equal(count, 2);
  let job;
  for (let i = 0; i < 100; i++) { job = await (await fetch(`${base}/api/review/${jobId}`)).json(); if (job.status !== 'running') break; await new Promise((r) => setTimeout(r, 50)); }
  assert.equal(job.status, 'done');
  assert.deepEqual(job.items.map((x) => x.status), ['done', 'done']);
  assert.deepEqual(job.items.map((x) => x.filename), works.map(([n]) => n));
  // Token và chi phí: tổng phiên = đọc mẫu + từng công trình.
  assert.ok(job.usage.totalTokens > 0 && job.items.every((x) => x.usage.totalTokens > 0));
  assert.equal(job.usage.totalTokens, t.usage.totalTokens + job.items.reduce((a, x) => a + x.usage.totalTokens, 0));
  assert.equal(job.usage.estimated, true, 'chế độ demo phải gắn nhãn ước lượng');

  const results = [];
  for (const it of job.items) results.push(await (await fetch(`${base}/api/review/${jobId}/${it.index}`)).json());
  // Mỗi kết quả chỉ thuộc về tệp của chính nó.
  results.forEach((r, i) => {
    assert.equal(r.files.length, 1);
    assert.equal(r.files[0].name, works[i][0]);
    assert.equal(r.sections.length, t.template.sections.length);
    assert.deepEqual(r.sections.map((s) => s.title), t.template.sections.map((s) => s.title));
    assert.equal(r.score.scheme, 'default');
    assert.equal(r.score.sumMax, 100);
    assert.ok(r.verification.dropped >= 1, 'trích dẫn bịa phải bị loại');
    const quotes = r.sections.flatMap((s) => s.evidence.map((e) => e.quote)).join(' ');
    assert.ok(r.info.some((x) => x.value.includes(i === 0 ? 'người thứ nhất' : 'người thứ hai')), 'thông tin đề tài lấy đúng từ tệp của mình');
    assert.ok(!quotes.includes(i === 0 ? 'người thứ hai' : 'người thứ nhất'));
  });

  const ex = await fetch(`${base}/api/export`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(results[1]) });
  assert.equal(ex.status, 200);
  assert.match(decodeURIComponent(ex.headers.get('content-disposition')), /Nhan-xet - Trần Thị B - de cuong\.docx/);
  const { value } = await mammoth.extractRawText({ buffer: Buffer.from(await ex.arrayBuffer()) });
  for (const s of t.template.sections) assert.ok(value.includes(s.title), `thiếu mục ${s.title}`);
  assert.ok(value.includes('ĐỀ XUẤT ĐIỂM VÀ KHUYẾN NGHỊ'));
  assert.ok(value.includes('Trần Thị B - de cuong.docx'));
  assert.ok(!value.includes('Nguyễn Văn A'));

  const zipRes = await fetch(`${base}/api/export-zip`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ results }) });
  assert.equal(zipRes.status, 200);
  const zip = await JSZip.loadAsync(Buffer.from(await zipRes.arrayBuffer()));
  assert.deepEqual(Object.keys(zip.files).sort(), ['Nhan-xet - Nguyễn Văn A - de cuong.docx', 'Nhan-xet - Trần Thị B - de cuong.docx']);
});

test('một công trình lỗi (PDF scan) không làm dừng các công trình khác; có thể dừng giữa chừng', async () => {
  const t = await (await fetch(`${base}/api/template`, { method: 'POST', body: form([['template', docxBlob(await templateDocx()), 'mau.docx']]) })).json();
  const scan = await makePdf([[], []], { imageOnly: true });
  const res = await fetch(`${base}/api/review`, { method: 'POST', body: form([['templateId', t.templateId], ['works', new Blob([scan]), 'scan.pdf'], ['works', docxBlob(await workDocx()), 'tot.docx']]) });
  const { jobId } = await res.json();
  let job;
  for (let i = 0; i < 100; i++) { job = await (await fetch(`${base}/api/review/${jobId}`)).json(); if (job.status !== 'running') break; await new Promise((r) => setTimeout(r, 50)); }
  assert.deepEqual(job.items.map((x) => x.status), ['error', 'done']);
  assert.match(job.items[0].error, /bản scan/);
  assert.equal((await fetch(`${base}/api/review/${jobId}/0`)).status, 409);
});

test('từ chối tệp không phải docx và mẫu hết hạn', async () => {
  const bad = await fetch(`${base}/api/template`, { method: 'POST', body: form([['template', new Blob(['x']), 'mau.txt']]) });
  assert.equal(bad.status, 400);
  assert.match((await bad.json()).error, /\.docx/);
  const gone = await fetch(`${base}/api/review`, { method: 'POST', body: form([['templateId', 'nope'], ['works', docxBlob(await workDocx()), 'a.docx']]) });
  assert.equal(gone.status, 400);
});

test('tên tệp tiếng Việt không bị lỗi font', async () => {
  const t = await (await fetch(`${base}/api/template`, { method: 'POST', body: form([['template', docxBlob(await templateDocx()), 'Mẫu nhận xét.docx']]) })).json();
  assert.equal(t.filename, 'Mẫu nhận xét.docx');
});

test('assemble: mục mẫu có điểm → quy đổi thang 100; mục thiếu bị đánh dấu; khuyết điểm nghiêm trọng hạ khuyến nghị', async () => {
  const file = await readDocx(await workDocx(), 'w.docx');
  const corpus = buildCorpus([file]);
  const template = normalizeTemplate({
    template_title: 'Mẫu', sections: [
      { title: 'Tính cấp thiết', kind: 'scored', max_points: 4 }, { title: 'Phương pháp', kind: 'scored', max_points: 6 }, { title: 'Kết luận', kind: 'conclusion' },
    ],
  });
  const raw = {
    sections: [{ section_id: 's1', content: 'a', points: 4, evidence: [] }, { section_id: 's3', content: 'c', points: 0, evidence: [] }],
    fatal_defects: [{ severity: 'fatal', description: 'Thiếu câu hỏi nghiên cứu', evidence: [] }],
    overall: { proposed_decision: 'accept' },
  };
  const r = assemble({ raw, template, corpus, meta: { docType: 'proposal', role: 'reviewer' }, rubric: null, index: buildIndex(corpus), mode: 'direct', workFiles: [file] });
  assert.equal(r.score.scheme, 'template');
  assert.equal(r.score.sumMax, 4); // mục s2 chưa chấm bị loại, không bị tính 0 điểm oan
  assert.equal(r.score.score100, 100);
  assert.equal(r.sections[1].missing, true);
  assert.ok(r.warnings.some((w) => /Phương pháp/.test(w)));
  assert.equal(r.decision.key, 'major_revision');
  assert.ok(r.decision.floorApplied && r.decision.mismatch);
});

test('không có điểm thành phần: không kết luận "từ chối" oan, báo cần chấm thủ công', async () => {
  const file = await readDocx(await workDocx(), 'w.docx');
  const corpus = buildCorpus([file]);
  const template = normalizeTemplate({ template_title: 'Mẫu', sections: [{ title: 'Nhận xét chung', kind: 'narrative' }] });
  const raw = { sections: [{ section_id: 's1', content: 'x', evidence: [], points: 0 }], rubric_scores: [], overall: {} };
  const rubric = [{ id: 'c1', label: 'A', max: 100 }];
  const r = assemble({ raw, template, corpus, meta: { docType: 'proposal', role: 'reviewer' }, rubric, index: buildIndex(corpus), mode: 'direct', workFiles: [file] });
  assert.equal(r.score.sumMax, 0);
  assert.equal(r.decision.key, 'unscored');
  assert.equal(r.decision.belowPass, false);
  assert.ok(r.warnings.length >= 1);
});

test('mã truy cập được kiểm tra khi cấu hình', async () => {
  const { config } = await import('../server/config.js');
  config.accessCode = 'bi-mat';
  try {
    assert.equal((await fetch(`${base}/api/review/x`)).status, 401);
    assert.equal((await fetch(`${base}/api/review/x`, { headers: { 'x-access-code': 'bi-mat' } })).status, 404);
    assert.equal((await fetch(`${base}/api/health`)).status, 200);
  } finally { config.accessCode = ''; }
});
