import test from 'node:test';
import assert from 'node:assert/strict';
import { readDocx, DocxError, buildCorpus } from '../server/docx-read.js';
import { buildIndex, verifyQuote, verifyEvidence } from '../server/verify.js';
import { decisionFromScore, decide, defaultRubric, computeScore, DOC_TYPES } from '../server/rubric.js';
import { makeDocx, P, templateDocx, workDocx } from './helpers.js';

test('đọc .docx hợp lệ, nhận diện tiêu đề, mục in đậm và bảng', async () => {
  const f = await readDocx(await templateDocx(), 'mau.docx');
  assert.equal(f.blocks[0].kind, 'heading');
  assert.ok(f.blocks.some((b) => b.kind === 'bold' && b.text.startsWith('1. Tính cấp thiết')));
  const r = f.blocks.find((b) => b.kind === 'row');
  assert.deepEqual(r.cells, ['Đề tài:', '[ô trống]']);
});

test('từ chối tệp không phải .docx', async () => {
  await assert.rejects(readDocx(Buffer.from('abc'), 'a.doc'), DocxError);
  await assert.rejects(readDocx(Buffer.from('not a zip at all'), 'a.docx'), DocxError);
  const fakeZip = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]);
  await assert.rejects(readDocx(fakeZip, 'a.docx'), DocxError);
});

test('tệp docx rỗng bị từ chối', async () => {
  await assert.rejects(readDocx(await makeDocx([P('')]), 'rong.docx'), DocxError);
});

test('kiểm chứng trích dẫn: khớp, bỏ qua dấu câu, dấu "…", và loại trích dẫn bịa', async () => {
  const corpus = buildCorpus([await readDocx(await workDocx(), 'cong-trinh.docx')]);
  const idx = buildIndex(corpus);
  const ok = verifyQuote(idx, 'Kết quả cho thấy 85% học sinh sử dụng công cụ này hằng tuần');
  assert.ok(ok.ok);
  assert.equal(ok.location.paragraph, 3);
  assert.ok(verifyQuote(idx, 'kết quả cho thấy 85 học sinh sử dụng công cụ này hằng tuần!').ok);
  assert.ok(verifyQuote(idx, 'Kết quả cho thấy 85% học sinh … chưa mô tả cách chọn mẫu').ok);
  assert.ok(!verifyQuote(idx, 'Kết quả cho thấy 95% học sinh sử dụng công cụ này hằng tuần').ok);
  assert.ok(!verifyQuote(idx, 'Theo Nguyễn Văn A (2021), trí tuệ nhân tạo cải thiện học tập').ok);
  assert.ok(!verifyQuote(idx, 'ngắn quá').ok);
  const { kept, dropped } = verifyEvidence(idx, [{ quote: 'Kết luận: việc ứng dụng trí tuệ nhân tạo làm tăng năng lực tự học' }, { quote: 'một câu hoàn toàn bịa đặt không có trong văn bản' }]);
  assert.equal(kept.length, 1);
  assert.equal(dropped, 1);
});

test('ngưỡng khuyến nghị theo điểm', () => {
  assert.equal(decisionFromScore(39.9), 'reject');
  assert.equal(decisionFromScore(40), 'major_revision');
  assert.equal(decisionFromScore(54.9), 'major_revision');
  assert.equal(decisionFromScore(55), 'minor_revision');
  assert.equal(decisionFromScore(59.9), 'minor_revision');
  assert.equal(decisionFromScore(60), 'accept_with_conditions');
  assert.equal(decisionFromScore(74.9), 'accept_with_conditions');
  assert.equal(decisionFromScore(75), 'accept');
});

test('dưới 60 điểm luôn có cảnh báo; khuyết điểm "rất nghiêm trọng" hạ khuyến nghị', () => {
  assert.ok(decide(58, []).belowPass);
  assert.ok(!decide(61, []).belowPass);
  const d = decide(82, [{ severity: 'fatal' }]);
  assert.equal(d.key, 'major_revision');
  assert.ok(d.floorApplied && d.belowPass);
  assert.equal(decide(82, [{ severity: 'serious' }]).key, 'accept');
});

test('thang điểm mặc định cộng đúng 100 cho mọi loại văn bản', () => {
  for (const t of Object.keys(DOC_TYPES)) assert.equal(defaultRubric(t).reduce((s, c) => s + c.max, 0), 100, t);
});

test('tổng điểm do mã tính, kẹp trong khoảng cho phép và quy đổi thang 100', () => {
  const r = computeScore([{ max: 4, points: 9 }, { max: 6, points: 3 }, { max: 0, points: 5 }]);
  assert.equal(r.sum, 7);
  assert.equal(r.score100, 70);
  assert.equal(computeScore([{ max: 10, points: -3 }]).score100, 0);
});
