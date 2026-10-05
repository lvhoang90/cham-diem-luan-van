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
