import express from 'express';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { readDocument, DocxError } from './docx-read.js';
import { analyzeTemplate, runReview } from './pipeline.js';
import { UsageMeter, sumSnapshots, appendLedger, readLedger } from './usage.js';
import JSZip from 'jszip';
import { buildDocx, exportFileName, uniqueName } from './export-docx.js';
import { DOC_TYPES, ROLES } from './rubric.js';
import { LlmError } from './llm.js';

const here = path.dirname(fileURLToPath(import.meta.url));

// Tệp tải lên chỉ nằm trong bộ nhớ, không ghi đĩa; kết quả tự xóa sau thời hạn.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.maxFileBytes, files: config.maxWorkFiles + 1 } });
const store = new Map();
const put = (kind, data) => {
  const id = crypto.randomBytes(12).toString('hex');
  store.set(id, { kind, data, exp: Date.now() + config.jobTtlMs });
  return id;
};
const get = (kind, id) => {
  const e = store.get(id);
  return e && e.kind === kind && e.exp > Date.now() ? e.data : null;
};
setInterval(() => { for (const [k, v] of store) if (v.exp <= Date.now()) store.delete(k); }, 60_000).unref();

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '80mb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true, demo: config.mock, accessCodeRequired: !!config.accessCode, thresholds: config.thresholds, docTypes: DOC_TYPES, roles: ROLES, limits: { maxFileMb: config.maxFileBytes / 1048576, maxWorkFiles: config.maxWorkFiles } }));

  app.use('/api', (req, res, next) => {
    if (!config.accessCode || req.path === '/health') return next();
    const given = Buffer.from(String(req.get('x-access-code') || ''));
    const want = Buffer.from(config.accessCode);
    if (given.length === want.length && crypto.timingSafeEqual(given, want)) return next();
    res.status(401).json({ error: 'Mã truy cập không đúng.' });
  });

  // Bước 1: đọc mẫu và nhận diện khung sườn để người dùng xác nhận.
  app.post('/api/template', upload.single('template'), async (req, res, next) => {
    try {
      if (!req.file) throw new DocxError('Chưa chọn tệp mẫu nhận xét.');
      const file = await readDocument(req.file.buffer, fixName(req.file.originalname));
      const meter = new UsageMeter();
      const template = await analyzeTemplate(file, meter);
      const usage = meter.snapshot();
      res.json({ templateId: put('template', { template, usage }), filename: file.filename, words: file.words, template, usage });
    } catch (e) { next(e); }
  });

  // Bước 2–4: mỗi tệp là MỘT công trình của MỘT người; đọc tuần tự, mỗi công trình một lượt phân tích riêng.
  app.post('/api/review', upload.array('works', config.maxWorkFiles), async (req, res, next) => {
    try {
      const tpl = get('template', String(req.body.templateId || ''));
      if (!tpl) throw new DocxError('Mẫu nhận xét đã hết hạn hoặc chưa được tải. Vui lòng quay lại Bước 1.');
      if (!req.files?.length) throw new DocxError('Chưa chọn tệp công trình cần phản biện.');
      const meta = {
        docType: req.body.docType in DOC_TYPES ? req.body.docType : 'other',
        role: req.body.role in ROLES ? req.body.role : 'reviewer',
        field: String(req.body.field || '').slice(0, 200),
        notes: String(req.body.notes || '').slice(0, 2000),
      };
      const buffers = req.files.map((f) => ({ name: fixName(f.originalname), buffer: f.buffer }));
      const job = {
        status: 'running', cancelled: false, templateUsage: tpl.usage,
        items: buffers.map((b, index) => ({ index, filename: b.name, status: 'queued', progress: 0, message: 'Đang chờ đến lượt' })),
      };
      const id = put('job', job);
      res.status(202).json({ jobId: id, count: job.items.length });
      runBatch({ job, buffers, template: tpl.template, meta });
    } catch (e) { next(e); }
  });

  // Trạng thái chung (không kèm nội dung kết quả để nhẹ khi hỏi lại liên tục).
  app.get('/api/review/:id', (req, res) => {
    const job = get('job', req.params.id);
    if (!job) return res.status(404).json({ error: 'Phiên làm việc đã hết hạn. Vui lòng thực hiện lại.' });
    res.json({
      status: job.status,
      usage: jobUsage(job),
      items: job.items.map(({ index, filename, status, progress, message, error, result, meter }) => ({
        index, filename, status, progress, message, error, usage: meter?.snapshot(),
        summary: result ? { score100: result.score.score100, decision: result.decision.short, severity: result.decision.severity, belowPass: result.decision.belowPass, title: result.profile?.title || '', author: result.profile?.author || '' } : undefined,
      })),
    });
  });

  // Tổng số liệu đã ghi nhật ký (chỉ số, không có tên tệp/nội dung).
  app.get('/api/usage', (_req, res) => res.json(readLedger()));

  app.get('/api/review/:id/:index', (req, res) => {
    const job = get('job', req.params.id);
    const item = job?.items[Number(req.params.index)];
    if (!item) return res.status(404).json({ error: 'Không tìm thấy công trình này (phiên có thể đã hết hạn).' });
    if (item.status !== 'done') return res.status(409).json({ error: 'Công trình này chưa có kết quả.' });
    res.json(item.result);
  });

  app.post('/api/review/:id/cancel', (req, res) => {
    const job = get('job', req.params.id);
    if (!job) return res.status(404).json({ error: 'Phiên làm việc đã hết hạn.' });
    job.cancelled = true;
    res.json({ ok: true });
  });

  app.post('/api/export', async (req, res, next) => {
    try {
      if (!req.body?.sections) throw new DocxError('Thiếu dữ liệu kết quả.');
      const buf = await buildDocx(req.body);
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': "attachment; filename*=UTF-8''" + encodeURIComponent(exportFileName(req.body)),
        'Cache-Control': 'no-store',
      });
      res.send(buf);
    } catch (e) { next(e); }
  });

  // Gói mọi bản nhận xét đã hoàn thành: mỗi công trình một tệp .docx riêng.
  app.post('/api/export-zip', async (req, res, next) => {
    try {
      const results = Array.isArray(req.body?.results) ? req.body.results.filter((r) => r?.sections) : [];
      if (!results.length) throw new DocxError('Không có bản nhận xét nào để gói.');
      const zip = new JSZip();
      const used = new Set();
      for (const r of results) zip.file(uniqueName(exportFileName(r), used), await buildDocx(r));
      const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
      res.set({ 'Content-Type': 'application/zip', 'Content-Disposition': "attachment; filename*=UTF-8''" + encodeURIComponent('Cac-ban-nhan-xet.zip'), 'Cache-Control': 'no-store' });
      res.send(buf);
    } catch (e) { next(e); }
  });

  app.use(express.static(path.join(here, '..', 'public')));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? `Tệp quá lớn (tối đa ${config.maxFileBytes / 1048576} MB mỗi tệp).` : err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT' ? `Chỉ được tải tối đa ${config.maxWorkFiles} tệp công trình.` : 'Tải tệp không thành công.';
      return res.status(400).json({ error: msg });
    }
    if (err instanceof DocxError) return res.status(400).json({ error: err.message });
    if (err instanceof LlmError) return res.status(502).json({ error: err.message });
    console.error('server error:', err.constructor.name);
    res.status(500).json({ error: 'Đã xảy ra lỗi. Vui lòng thử lại.' });
  });
  return app;
}

async function runBatch({ job, buffers, template, meta }) {
  const work = async (item) => {
    if (job.cancelled) { item.status = 'cancelled'; item.message = 'Đã dừng'; buffers[item.index] = null; return; }
    item.status = 'running'; item.message = 'Đang đọc tệp…'; item.progress = 3; item.meter = new UsageMeter();
    try {
      const file = await readDocument(buffers[item.index].buffer, item.filename);
      buffers[item.index] = null;
      item.result = await runReview({ template, workFiles: [file], meta, onProgress: (p, m) => { item.progress = p; item.message = m; }, meter: item.meter });
      item.status = 'done'; item.progress = 100; item.message = 'Hoàn thành';
    } catch (e) {
      buffers[item.index] = null;
      console.error('review failed:', e.constructor.name);
      item.status = 'error';
      item.error = e instanceof LlmError || e instanceof DocxError ? e.message : 'Có lỗi khi phân tích công trình này. Vui lòng thử lại.';
    }
  };
  // Hàng đợi: mặc định 1 công trình mỗi lần (tuần tự); một công trình lỗi không làm dừng các công trình còn lại.
  let next = 0;
  await Promise.all(Array.from({ length: Math.max(1, config.batchConcurrency) }, async () => {
    while (next < job.items.length) await work(job.items[next++]);
  }));
  job.status = 'done';
  const u = jobUsage(job);
  console.log(`[usage] ${job.items.filter((i) => i.status === 'done').length}/${job.items.length} công trình · ${u.totalTokens} token · ${u.costUsd == null ? 'chưa rõ giá' : '$' + u.costUsd}${u.estimated ? ' (ước lượng demo)' : ''}`);
  appendLedger({ model: config.model, demo: config.mock, works: job.items.length, ok: job.items.filter((i) => i.status === 'done').length, inputTokens: u.inputTokens, outputTokens: u.outputTokens, totalTokens: u.totalTokens, costUsd: u.costUsd });
}

function jobUsage(job) {
  return sumSnapshots([job.templateUsage, ...job.items.filter((i) => i.meter).map((i) => i.meter.snapshot())].filter(Boolean));
}

// multer đọc tên tệp UTF-8 như latin1; sửa lại để hiển thị đúng tiếng Việt.
function fixName(n) {
  const raw = String(n || '');
  if ([...raw].some((c) => c.charCodeAt(0) > 255)) return raw; // đã là Unicode đúng
  const fixed = Buffer.from(raw, 'latin1').toString('utf8');
  return fixed.includes('\uFFFD') ? raw : fixed;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!config.mock && !process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.warn('Cảnh báo: chưa có ANTHROPIC_API_KEY. Đặt biến môi trường này, hoặc chạy "npm run demo" để thử giao diện.');
  }
  createApp().listen(config.port, () => console.log(`Trợ lý phản biện: http://localhost:${config.port}${config.mock ? '  (CHẾ ĐỘ DEMO)' : ''}`));
}
