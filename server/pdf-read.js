import { createRequire } from 'node:module';
import { layoutPdfPages, pdfTextProblem } from './pdf-layout.js';
import { DocxError } from './docx-read.js';

const require = createRequire(import.meta.url);
const MAX_PAGES = 600;

export const PDF_SCAN_MSG = (name) => `Tệp "${name}" là PDF dạng ảnh (bản scan) hoặc không có lớp chữ. Hệ thống chỉ nhận PDF có chữ chọn/sao chép được. Hãy dùng bản gốc từ Word (Save as PDF), hoặc chạy nhận dạng ký tự (OCR) rồi lưu lại.`;
export const PDF_ENC_MSG = (name) => `Chữ trong tệp "${name}" bị lỗi mã hóa phông (thường gặp ở PDF dùng phông tiếng Việt cũ), nên không đọc đúng được. Hãy xuất lại PDF từ Word bằng phông Unicode (Times New Roman, Arial…) hoặc gửi bản .docx.`;

/** Đọc PDF có lớp chữ thành các khối văn bản (kind p/bold, kèm số trang). */
export async function readPdf(buffer, filename) {
  if (!buffer || buffer.length < 5 || buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
    throw new DocxError(`Tệp "${filename}" không phải tệp PDF hợp lệ (có thể bị hỏng hoặc chỉ đổi đuôi tệp).`);
  }
  const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
  let doc;
  try {
    // isEvalSupported:false chặn đường thực thi mã từ phông trong PDF lạ.
    doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false, disableFontFace: true, useSystemFonts: false, verbosity: 0 }).promise;
  } catch (e) {
    if (e?.name === 'PasswordException') throw new DocxError(`Tệp "${filename}" được bảo vệ bằng mật khẩu. Hãy gỡ mật khẩu rồi tải lại.`);
    throw new DocxError(`Không mở được tệp "${filename}". Tệp có thể bị hỏng.`);
  }
  try {
    if (doc.numPages > MAX_PAGES) throw new DocxError(`Tệp "${filename}" có ${doc.numPages} trang, vượt giới hạn ${MAX_PAGES} trang. Hãy tách thành nhiều tệp.`);
    const pages = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const tc = await page.getTextContent();
      pages.push(tc.items.filter((i) => typeof i.str === 'string').map((i) => ({ str: i.str, x: i.transform[4], y: i.transform[5], h: Math.abs(i.transform[3]) || i.height || 0, w: i.width || 0 })));
      page.cleanup();
    }
    const problem = pdfTextProblem(pages.map((it) => it.map((i) => i.str).join(' ')));
    if (problem === 'scan') throw new DocxError(PDF_SCAN_MSG(filename));
    if (problem === 'encoding') throw new DocxError(PDF_ENC_MSG(filename));
    const blocks = layoutPdfPages(pages);
    if (!blocks.length) throw new DocxError(PDF_SCAN_MSG(filename));
    const words = blocks.reduce((s, b) => s + (b.text.match(/\S+/g) || []).length, 0);
    return { filename, blocks, words, pages: doc.numPages };
  } finally {
    doc.destroy();
  }
}
