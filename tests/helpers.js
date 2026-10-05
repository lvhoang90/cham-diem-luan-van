import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel } from 'docx';

export const P = (t, o = {}) => new Paragraph({ children: [new TextRun({ text: t, bold: o.bold })], heading: o.heading });
const cell = (t) => new TableCell({ children: [new Paragraph(t)] });
export const row = (a, b) => new TableRow({ children: [cell(a), cell(b)] });

export async function makeDocx(children) {
  return Packer.toBuffer(new Document({ sections: [{ children }] }));
}

export const templateDocx = () => makeDocx([
  P('PHIẾU NHẬN XÉT ĐỀ CƯƠNG LUẬN ÁN', { heading: HeadingLevel.HEADING_1 }),
  new Table({ rows: [row('Đề tài:', ''), row('Nghiên cứu sinh:', ''), row('Người nhận xét:', '')] }),
  P('1. Tính cấp thiết của đề tài', { bold: true }),
  P('2. Mục tiêu và câu hỏi nghiên cứu', { bold: true }),
  P('3. Phương pháp nghiên cứu', { bold: true }),
  P('4. Kết luận và đề nghị', { bold: true }),
]);

export const workDocx = (title = 'Ảnh hưởng của việc ứng dụng trí tuệ nhân tạo đến năng lực tự học của học sinh trung học phổ thông') => makeDocx([
  P(title, { heading: HeadingLevel.HEADING_1 }),
  P('Nghiên cứu này khảo sát 120 học sinh lớp 11 tại hai trường trung học phổ thông ở Đồng bằng sông Cửu Long nhằm xác định mức độ sử dụng công cụ trí tuệ nhân tạo trong học tập.'),
  P('Kết quả cho thấy 85% học sinh sử dụng công cụ này hằng tuần, tuy nhiên tác giả chưa mô tả cách chọn mẫu và công cụ đo lường năng lực tự học.'),
  P('Kết luận: việc ứng dụng trí tuệ nhân tạo làm tăng năng lực tự học của toàn bộ học sinh Việt Nam.'),
]);

import PDFDocument from 'pdfkit';
const FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf';
const FONT_B = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf';

/** pages: mảng các trang; mỗi trang là mảng {t, bold?, size?}; images:true thì chỉ vẽ hình (giả lập bản scan). */
export function makePdf(pages, { header = 'Trường Đại học Mẫu — Đề cương', imageOnly = false, garble = false } = {}) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 60 });
    const bufs = [];
    doc.on('data', (b) => bufs.push(b)).on('end', () => resolve(Buffer.concat(bufs)));
    pages.forEach((items, i) => {
      if (i) doc.addPage();
      if (imageOnly) { doc.rect(80, 120, 400, 500).fill('#cccccc'); return; }
      doc.font(FONT).fontSize(9).text(header, 60, 30);
      doc.y = 80;
      for (const it of items) {
        doc.font(it.bold ? FONT_B : FONT).fontSize(it.size || 12).text(garble ? it.t.replace(/[aeiouy]/gi, '¶©') : it.t, { align: 'justify', paragraphGap: 8 });
      }
      doc.page.margins.bottom = 0; // chân trang nằm sát đáy, không được sinh thêm trang
      doc.font(FONT).fontSize(9).text(String(i + 1), 60, 780, { align: 'center', lineBreak: false, width: 475 });
    });
    doc.end();
  });
}
