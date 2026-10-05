// Chế độ DEMO (MOCK_LLM=1): không gọi AI, chỉ để thử giao diện và luồng xử lý. Nội dung được ghi rõ là minh họa.

const BANNER = '[CHẾ ĐỘ DEMO — nội dung minh họa, KHÔNG phải đánh giá thật]';

export function mockTemplate(templateFile) {
  const sections = [];
  const info = [];
  let k = 0;
  for (const b of templateFile.blocks) {
    const isHead = b.kind === 'heading' || b.kind === 'bold' || /^([IVX]+|\d+)[.)]\s/.test(b.text);
    if (b.kind === 'row' && b.cells.length === 2 && b.cells[1] === '[ô trống]') {
      info.push({ label: b.cells[0].replace(/:$/, ''), fill_from_document: /đề tài|học viên|tác giả|nghiên cứu sinh/i.test(b.cells[0]) });
    } else if (isHead && b.text.length < 160) {
      const m = b.text.match(/^(([IVX]+|\d+)[.)]|[a-z]\))\s*(.*)$/);
      k++;
      sections.push({
        id: `s${k}`, number: m ? m[1] : '', title: m ? m[3] : b.text, level: b.kind === 'heading' ? b.level : 1,
        kind: /kết luận|đề nghị|kiến nghị/i.test(b.text) ? 'conclusion' : 'narrative', guidance: '', max_points: 0,
      });
    }
  }
  if (sections.length === 0) sections.push({ id: 's1', number: '1.', title: 'Nhận xét chung', level: 1, kind: 'narrative', guidance: '', max_points: 0 });
  return {
    template_title: templateFile.blocks[0]?.text.slice(0, 120) || 'Mẫu nhận xét', language: 'vi', purpose: 'Nhận xét (demo)',
    info_fields: info, sections, scale_total: 0, scoring_notes: '', ambiguities: [BANNER],
  };
}

export function mockReview({ template, corpus, rubric }) {
  const paras = corpus.flatMap((f) => f.blocks.filter((b) => b.kind === 'p' && b.text.split(/\s+/).length >= 12));
  const quote = (i) => {
    const b = paras[i % Math.max(1, paras.length)];
    return b ? { quote: b.text.split(/\s+/).slice(0, 18).join(' '), note: 'Đoạn minh họa (demo).' } : null;
  };
  const size = paras.length;
  const frac = (i) => 0.45 + ((i * 37 + size * 11) % 40) / 100;
  const sections = template.sections.map((s, i) => ({
    section_id: s.id,
    content: `${BANNER}\n\nĐây là nội dung nhận xét minh họa cho mục "${s.title}".`,
    strengths: ['Ưu điểm minh họa.'],
    weaknesses: ['Hạn chế minh họa.'],
    revisions: [{ priority: 'bat_buoc', action: 'Yêu cầu sửa minh họa.' }],
    evidence: [quote(i), { quote: 'Câu này không hề có trong tài liệu gốc của tác giả', note: 'Trích dẫn giả để thử bộ lọc.' }].filter(Boolean),
    points: s.max_points ? Math.round(s.max_points * frac(i) * 10) / 10 : 0,
    point_rationale: s.max_points ? 'Cơ sở minh họa.' : '',
    insufficient_basis: false,
  }));
  return {
    document_profile: { title: corpus[0].blocks[0]?.text.slice(0, 150) || 'Không xác định', author: 'Không xác định', field: '', type_detected: '', completeness: BANNER },
    info_values: template.info_fields.map((f) => ({ label: f.label, value: f.fill_from_document ? corpus[0].blocks[0]?.text.slice(0, 150) || '' : '' })),
    sections,
    fatal_defects: [],
    integrity_notes: [],
    overall: {
      summary: `${BANNER}\n\nNhận xét tổng quát minh họa.`, main_strengths: ['Minh họa'], main_weaknesses: ['Minh họa'],
      conclusion_text: `${BANNER} Kết luận minh họa.`, proposed_decision: 'accept_with_conditions',
    },
    questions_for_author: ['Câu hỏi minh họa?'],
    limitations: ['Đang chạy chế độ DEMO, không có đánh giá thật.'],
    ...(rubric ? { rubric_scores: rubric.map((c, i) => ({ criterion_id: c.id, points: Math.round(c.max * frac(i) * 10) / 10, rationale: 'Minh họa', evidence: [quote(i)].filter(Boolean) })) } : {}),
  };
}

