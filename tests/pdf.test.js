import test from 'node:test';
import assert from 'node:assert/strict';
import { readDocument, DocxError } from '../server/docx-read.js';
import { layoutPdfPages, pdfTextProblem, dropLeaderLines } from '../server/pdf-layout.js';
import { makePdf } from './helpers.js';

const para = (s) => ({ t: s });
const long = 'Nghiên cứu này khảo sát mức độ sử dụng công cụ trí tuệ nhân tạo của học sinh trung học phổ thông tại Đồng bằng sông Cửu Long và phân tích mối liên hệ với năng lực tự học. ';
const page = (n) => [
  { t: `${n}. Mục số ${n} của đề cương`, bold: true, size: 14 },
  para(long.repeat(3) + `Đoạn một của mục ${n}.`),
  para(long.repeat(2) + `Đoạn hai của mục ${n}, bàn về phương pháp chọn mẫu và công cụ đo lường.`),
];

test('đọc PDF có chữ: giữ tiếng Việt, tách đoạn, bỏ đầu trang và số trang, ghi số trang', async () => {
  const buf = await makePdf([page(1), page(2), page(3), page(4), page(5)]);
  const f = await readDocument(buf, 'de-cuong.pdf');
  assert.equal(f.pages, 5);
  const text = f.blocks.map((b) => b.text).join('\n');
  assert.ok(text.includes('Đồng bằng sông Cửu Long'), 'giữ dấu tiếng Việt');
  assert.ok(!text.includes('Trường Đại học Mẫu'), 'đầu trang lặp lại bị bỏ');
  assert.ok(!f.blocks.some((b) => /^\d+$/.test(b.text)), 'số trang bị bỏ');
  const heads = f.blocks.filter((b) => b.kind === 'bold').map((b) => b.text);
  assert.ok(heads.includes('3. Mục số 3 của đề cương'), `tiêu đề nhận diện: ${heads}`);
  const p3 = f.blocks.filter((b) => b.kind === 'p' && /Đoạn một của mục 3/.test(b.text));
  assert.equal(p3.length, 1);
  assert.equal(p3[0].page, 3);
  assert.ok(f.blocks.filter((b) => b.kind === 'p').every((b) => b.text.length > 100), 'dòng ngắt trong cùng đoạn được nối lại');
});

test('từ chối PDF dạng ảnh (không có lớp chữ)', async () => {
  const buf = await makePdf([[], [], []], { imageOnly: true });
  await assert.rejects(readDocument(buf, 'scan.pdf'), (e) => e instanceof DocxError && /bản scan/.test(e.message));
});

test('từ chối PDF lỗi mã hóa phông', async () => {
  const buf = await makePdf([page(1), page(2)], { garble: true });
  await assert.rejects(readDocument(buf, 'loi-font.pdf'), (e) => e instanceof DocxError && /mã hóa phông/.test(e.message));
});

test('từ chối tệp đuôi .pdf nhưng không phải PDF', async () => {
  await assert.rejects(readDocument(Buffer.from('hello world'), 'gia.pdf'), (e) => e instanceof DocxError && /không phải tệp PDF/.test(e.message));
});

test('pdfTextProblem và layout: ngưỡng', () => {
  assert.equal(pdfTextProblem(['', '', '']), 'scan');
  assert.equal(pdfTextProblem(['x'.repeat(500), '']), null);
  const blocks = layoutPdfPages([[{ str: 'Chương 1', x: 60, y: 700, h: 16 }, { str: 'Nội dung dòng một', x: 60, y: 660, h: 12 }, { str: 'tiếp tục dòng hai.', x: 60, y: 646, h: 12 }]]);
  assert.equal(blocks[0].kind, 'bold');
  assert.equal(blocks[1].text, 'Nội dung dòng một tiếp tục dòng hai.');
});

test('bỏ dòng mục lục có dấu chấm dẫn, giữ nguyên các dòng khác', () => {
  const blocks = [
    { kind: 'p', text: '1.1. Lý do chọn đề tài ........................ 12' },
    { kind: 'p', text: 'Chương 2. Phương pháp . . . . . . . . . 25' },
    { kind: 'row', text: 'a | b', cells: ['Hình 2.3. Mô hình', '…………… 31'] },
    { kind: 'p', text: 'Kết quả cho thấy 85% học sinh sử dụng công cụ này. Giá trị p = 0.05.' },
    { kind: 'p', text: 'Năm 2023... tác giả đề xuất 3 giải pháp.' },
  ];
  const out = dropLeaderLines(blocks);
  assert.deepEqual(out.map((b) => b.text), ['Kết quả cho thấy 85% học sinh sử dụng công cụ này. Giá trị p = 0.05.', 'Năm 2023... tác giả đề xuất 3 giải pháp.']);
});
