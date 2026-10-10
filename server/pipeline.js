import { config } from './config.js';
import { buildCorpus, corpusToText, corpusChars, blockLine } from './docx-read.js';
import { callJson, callText, LlmError } from './llm.js';
import { TEMPLATE_SCHEMA, reviewSchema } from './schemas.js';
import { SYSTEM_TEMPLATE, SYSTEM_REVIEWER, templatePrompt, digestPrompt, reviewPrompt } from './prompts.js';
import { defaultRubric, computeScore, decide, UNSCORED, DOC_TYPES, ROLES, DECISIONS, decisionFromScore } from './rubric.js';
import { buildIndex, verifyEvidence } from './verify.js';
import { mockTemplate, mockReview } from './mock.js';

const noop = () => {};

/** Bước 1: tách khung sườn của mẫu để người dùng xác nhận trước khi phân tích. */
export async function analyzeTemplate(templateFile, meter) {
  const corpus = buildCorpus([templateFile]);
  let t;
  if (config.mock) { t = mockTemplate(templateFile); meter?.addEstimate(JSON.stringify(templateFile.blocks).length + 3000, 1500); }
  else {
    t = await callJson({
      system: SYSTEM_TEMPLATE,
      user: templatePrompt(corpusToText(corpus, { withFileTags: false })),
      schema: TEMPLATE_SCHEMA,
      maxTokens: 32000,
      effort: 'medium',
      meter,
    });
  }
  return normalizeTemplate(t);
}

export function normalizeTemplate(t) {
  const kinds = new Set(['narrative', 'scored', 'checklist', 'conclusion']);
  const sections = (t.sections || [])
    .filter((s) => s && String(s.title || '').trim())
    .map((s, i) => ({
      id: `s${i + 1}`,
      number: String(s.number || ''),
      title: String(s.title).trim(),
      level: Math.min(3, Math.max(1, Number(s.level) || 1)),
      kind: kinds.has(s.kind) ? s.kind : 'narrative',
      guidance: String(s.guidance || ''),
      max_points: Math.max(0, Number(s.max_points) || 0),
    }));
  if (sections.length === 0) {
    throw new LlmError('Không nhận diện được các mục nào trong mẫu. Hãy kiểm tra mẫu có chứa văn bản (không phải ảnh quét) và thử lại.');
  }
  return {
    template_title: String(t.template_title || 'Phiếu nhận xét'),
    language: t.language === 'en' ? 'en' : 'vi',
    purpose: String(t.purpose || ''),
    info_fields: (t.info_fields || []).filter((f) => f?.label).map((f) => ({ label: String(f.label), fill_from_document: !!f.fill_from_document })),
    sections,
    scale_total: Math.max(0, Number(t.scale_total) || 0),
    scoring_notes: String(t.scoring_notes || ''),
    ambiguities: (t.ambiguities || []).map(String),
  };
}

function outlineOf(corpus) {
  return corpus
    .flatMap((f) => f.blocks.filter((b) => b.kind === 'heading' || b.kind === 'bold').map((b) => `[¶${b.n}] ${b.text}`))
    .slice(0, 400)
    .join('\n');
}

function chunkCorpus(corpus, size) {
  const chunks = [];
  let cur = [];
  let len = 0;
  for (const f of corpus) {
    for (const b of f.blocks) {
      const line = blockLine(b);
      if (len + line.length > size && cur.length) { chunks.push(cur); cur = []; len = 0; }
      cur.push(`${len === 0 && cur.length === 0 ? `(tệp ${f.fileIndex}: ${f.filename})\n` : ''}${line}`);
      len += line.length + 1;
    }
  }
  if (cur.length) chunks.push(cur);
  return chunks.map((c) => c.join('\n'));
}

async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

export async function runReview({ template, workFiles, meta, onProgress = noop, meter }) {
  const corpus = buildCorpus(workFiles);
  const chars = corpusChars(corpus);
  if (chars > config.maxTotalChars) {
    throw new LlmError('Tổng dung lượng văn bản quá lớn để xử lý trong một lần. Hãy tải lên ít tệp hơn hoặc tách theo từng phần.');
  }
  const useRubric = !template.sections.some((s) => s.max_points > 0);
  const rubric = useRubric ? defaultRubric(meta.docType) : null;
  const index = buildIndex(corpus);

  let digests = null;
  let mode = 'direct';
  if (chars > config.maxDirectChars && !config.mock) {
    mode = 'digest';
    const chunks = chunkCorpus(corpus, config.chunkChars);
    const outline = outlineOf(corpus);
    let done = 0;
    onProgress(10, `Công trình dài: đọc từng phần (0/${chunks.length})…`);
    const notes = await pool(chunks, 3, async (text, i) => {
      const r = await callText({ user: digestPrompt({ i: i + 1, n: chunks.length, text, outline }), meter });
      onProgress(10 + Math.round((++done / chunks.length) * 40), `Đọc từng phần (${done}/${chunks.length})…`);
      return `--- PHẦN ${i + 1}/${chunks.length} ---\n${r}`;
    });
    digests = notes.join('\n\n');
  }

  onProgress(55, 'Soạn nhận xét theo khung mẫu và chấm điểm…');
  const schema = reviewSchema({ withRubric: useRubric });
  let raw;
  if (config.mock) { raw = mockReview({ template, corpus, rubric }); meter?.addEstimate(corpusToText(corpus).length + 12000, JSON.stringify(raw).length * 1.6); }
  else {
    raw = await callJson({
      system: SYSTEM_REVIEWER,
      user: reviewPrompt({
        m: meta, template, rubric,
        corpusText: corpusToText(corpus), digests, outline: outlineOf(corpus),
        sizes: corpus.map((f) => `Tệp ${f.fileIndex}: ${f.filename}`).join('\n'),
      }),
      schema,
      meter,
    });
  }

  onProgress(90, 'Đối chiếu từng đoạn trích với bản gốc và tính điểm…');
  const result = assemble({ raw, template, corpus, meta, rubric, index, mode, workFiles });
  if (meter) result.usage = meter.snapshot();
  return result;
}

export function assemble({ raw, template, corpus, meta, rubric, index, mode, workFiles }) {
  let kept = 0;
  let dropped = 0;
  const ver = (ev) => {
    const r = verifyEvidence(index, ev);
    kept += r.kept.length;
    dropped += r.dropped;
    return r.kept;
  };

  const byId = new Map((raw.sections || []).map((s) => [s.section_id, s]));
  const warnings = [];
  const sections = template.sections.map((ts) => {
    const r = byId.get(ts.id);
    if (!r) {
      warnings.push(`Mục "${ts.title}" chưa được mô hình trả lời; cần người phản biện tự nhận xét.`);
      return { ...ts, missing: true, content: '', strengths: [], weaknesses: [], revisions: [], evidence: [], points: 0, point_rationale: '', insufficient_basis: true };
    }
    return {
      ...ts,
      missing: false,
      content: String(r.content || ''),
      strengths: r.strengths || [],
      weaknesses: r.weaknesses || [],
      revisions: r.revisions || [],
      evidence: ver(r.evidence),
      points: Number(r.points) || 0,
      point_rationale: String(r.point_rationale || ''),
      insufficient_basis: !!r.insufficient_basis,
    };
  });

  let items;
  if (rubric) {
    const by = new Map((raw.rubric_scores || []).map((x) => [x.criterion_id, x]));
    items = [];
    for (const c of rubric) {
      const x = by.get(c.id);
      if (!x) { warnings.push(`Tiêu chí "${c.label}" chưa được chấm; đã loại khỏi tổng điểm.`); continue; }
      items.push({ id: c.id, label: c.label, max: c.max, points: x.points, rationale: String(x.rationale || ''), evidence: ver(x.evidence) });
    }
  } else {
    items = sections.filter((s) => s.max_points > 0 && !s.missing).map((s) => ({ id: s.id, label: `${s.number} ${s.title}`.trim(), max: s.max_points, points: s.points, rationale: s.point_rationale, evidence: [] }));
    for (const s of sections) if (s.max_points > 0 && s.missing) warnings.push(`Mục "${s.title}" có điểm nhưng chưa được chấm; đã loại khỏi tổng điểm.`);
  }
  const sc = computeScore(items);
  if (sc.sumMax === 0) warnings.push('Không tính được điểm tổng do thiếu điểm thành phần.');

  const fatal = (raw.fatal_defects || []).map((d) => ({ severity: d.severity === 'fatal' ? 'fatal' : 'serious', description: String(d.description || ''), evidence: ver(d.evidence) }));
  const integrity = (raw.integrity_notes || []).map((n) => ({ concern: String(n.concern || ''), suggested_check: String(n.suggested_check || ''), evidence: ver(n.evidence) }));
  const decision = sc.sumMax ? decide(sc.score100, fatal) : UNSCORED;
  const modelDecision = raw.overall?.proposed_decision;
  const scoreDecision = decisionFromScore(sc.score100);
  const mismatch = modelDecision && modelDecision !== decision.key ? { model: modelDecision, modelLabel: DECISIONS[modelDecision]?.short, scoreBased: scoreDecision } : null;

  const o = raw.overall || {};
  return {
    generatedAt: new Date().toISOString(),
    model: config.mock ? 'demo' : config.model,
    demo: config.mock,
    meta: { docType: meta.docType, docTypeLabel: DOC_TYPES[meta.docType], role: meta.role, roleLabel: ROLES[meta.role], field: meta.field || '', notes: meta.notes || '' },
    template: { title: template.template_title, language: template.language, purpose: template.purpose, scale_total: template.scale_total, scoring_notes: template.scoring_notes },
    files: workFiles.map((f) => ({ name: f.filename, words: f.words })),
    mode,
    profile: raw.document_profile || {},
    info: (raw.info_values || []).map((x) => ({ label: String(x.label || ''), value: String(x.value || '') })),
    sections,
    score: { scheme: rubric ? 'default' : 'template', rows: sc.rows, sum: sc.sum, sumMax: sc.sumMax, score100: sc.score100 },
    decision: { ...decision, mismatch },
    fatalDefects: fatal,
    integrityNotes: integrity,
    overall: { summary: String(o.summary || ''), mainStrengths: o.main_strengths || [], mainWeaknesses: o.main_weaknesses || [], conclusion: String(o.conclusion_text || '') },
    questions: raw.questions_for_author || [],
    limitations: raw.limitations || [],
    warnings,
    verification: { kept, dropped },
  };
}
