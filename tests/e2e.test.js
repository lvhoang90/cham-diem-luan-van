process.env.MOCK_LLM = '1'; // phải đặt trước khi nạp mô-đun (import tĩnh được nâng lên đầu tệp)
import test from 'node:test';
import assert from 'node:assert/strict';
import mammoth from 'mammoth';
import { templateDocx, workDocx } from './helpers.js';

const { createApp } = await import('../server/index.js');
const { assemble, normalizeTemplate } = await import('../server/pipeline.js');
const { readDocx, buildCorpus } = await import('../server/docx-read.js');
const { buildIndex } = await import('../server/verify.js');

let server, base;
test.before(async () => { server = createApp().listen(0); base = `http://127.0.0.1:${server.address().port}`; });
test.after(() => server.close());

const form = (entries) => { const fd = new FormData(); for (const [k, v, n] of entries) (n ? fd.append(k, v, n) : fd.append(k, v)); return fd; };
const docxBlob = (buf) => new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

test('luồng đầy đủ: mẫu → công trình → kết quả → xuất .docx đúng khung mẫu', async () => {
  const t = await (await fetch(`${base}/api/template`, { method: 'POST', body: form([['template', docxBlob(await templateDocx()), 'mau.docx']]) })).json();
  assert.equal(t.template.sections.length, 5); // tiêu đề + 4 mục (demo suy từ tiêu đề/in đậm)
  assert.ok(t.template.info_fields.some((f) => f.label === 'Đề tài'));

  const works = [await workDocx(), await workDocx('Chương 2. Phương pháp')];
  const res = await fetch(`${base}/api/review`, { method: 'POST', body: form([['templateId', t.templateId], ['docType', 'dissertation'], ['role', 'reviewer'], ...works.map((w, i) => ['works', docxBlob(w), `c${i}.docx`])]) });
  assert.equal(res.status, 202);
  const { jobId } = await res.json();
  let job;
  for (let i = 0; i < 50; i++) { job = await (await fetch(`${base}/api/review/${jobId}`)).json(); if (job.status !== 'running') break; await new Promise((r) => setTimeout(r, 50)); }
  assert.equal(job.status, 'done', job.error);
  const r = job.result;
  assert.equal(r.sections.length, t.template.sections.length);
  assert.deepEqual(r.sections.map((s) => s.title), t.template.sections.map((s) => s.title));
  assert.equal(r.score.scheme, 'default');
  assert.equal(r.score.sumMax, 100);
  assert.ok(r.verification.dropped >= 1, 'trích dẫn bịa phải bị loại');
  assert.ok(r.sections.every((s) => s.evidence.every((e) => !/không hề có/.test(e.quote))));
  assert.ok(['reject', 'major_revision', 'minor_revision', 'accept_with_conditions', 'accept'].includes(r.decision.key));

  const ex = await fetch(`${base}/api/export`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(r) });
  assert.equal(ex.status, 200);
  const buf = Buffer.from(await ex.arrayBuffer());
  const { value } = await mammoth.extractRawText({ buffer: buf });
  for (const s of t.template.sections) assert.ok(value.includes(s.title), `thiếu mục ${s.title}`);
  assert.ok(value.includes('ĐỀ XUẤT ĐIỂM VÀ KHUYẾN NGHỊ'));
  assert.ok(value.includes('DEMO'));
});

test('từ chối tệp không phải docx và mẫu hết hạn', async () => {
  const bad = await fetch(`${base}/api/template`, { method: 'POST', body: form([['template', new Blob(['x']), 'mau.pdf']]) });
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

test('mã truy cập được kiểm tra khi cấu hình', async () => {
  const { config } = await import('../server/config.js');
  config.accessCode = 'bi-mat';
  try {
    assert.equal((await fetch(`${base}/api/review/x`)).status, 401);
    assert.equal((await fetch(`${base}/api/review/x`, { headers: { 'x-access-code': 'bi-mat' } })).status, 404);
    assert.equal((await fetch(`${base}/api/health`)).status, 200);
  } finally { config.accessCode = ''; }
});
