import express from 'express';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { readDocx, DocxError } from './docx-read.js';
import { analyzeTemplate, runReview } from './pipeline.js';
import { buildDocx } from './export-docx.js';
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
  app.use(express.json({ limit: '5mb' }));

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
      const file = await readDocx(req.file.buffer, fixName(req.file.originalname));
      const template = await analyzeTemplate(file);
      res.json({ templateId: put('template', template), filename: file.filename, words: file.words, template });
    } catch (e) { next(e); }
  });

  // Bước 2–4: nhận công trình, chạy phân tích nền.
  app.post('/api/review', upload.array('works', config.maxWorkFiles), async (req, res, next) => {
    try {
      const template = get('template', String(req.body.templateId || ''));
      if (!template) throw new DocxError('Mẫu nhận xét đã hết hạn hoặc chưa được tải. Vui lòng quay lại Bước 1.');
      if (!req.files?.length) throw new DocxError('Chưa chọn tệp công trình cần phản biện.');
      const workFiles = [];
      for (const f of req.files) workFiles.push(await readDocx(f.buffer, fixName(f.originalname)));
      const meta = {
        docType: req.body.docType in DOC_TYPES ? req.body.docType : 'other',
        role: req.body.role in ROLES ? req.body.role : 'reviewer',
        field: String(req.body.field || '').slice(0, 200),
        notes: String(req.body.notes || '').slice(0, 2000),
      };
      const job = { status: 'running', progress: 3, message: 'Đang đọc tệp…' };
      const id = put('job', job);
      res.status(202).json({ jobId: id });
      runReview({ template, workFiles, meta, onProgress: (p, m) => { job.progress = p; job.message = m; } })
        .then((result) => { job.status = 'done'; job.progress = 100; job.result = result; })
        .catch((e) => { console.error('review failed:', e.constructor.name); job.status = 'error'; job.error = e instanceof LlmError || e instanceof DocxError ? e.message : 'Có lỗi khi phân tích. Vui lòng thử lại.'; });
    } catch (e) { next(e); }
  });

  app.get('/api/review/:id', (req, res) => {
    const job = get('job', req.params.id);
    if (!job) return res.status(404).json({ error: 'Phiên làm việc đã hết hạn. Vui lòng thực hiện lại.' });
    res.json({ status: job.status, progress: job.progress, message: job.message, error: job.error, result: job.status === 'done' ? job.result : undefined });
  });

  app.post('/api/export', async (req, res, next) => {
    try {
      if (!req.body?.sections) throw new DocxError('Thiếu dữ liệu kết quả.');
      const buf = await buildDocx(req.body);
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': "attachment; filename*=UTF-8''" + encodeURIComponent('Ban-nhan-xet-phan-bien.docx'),
        'Cache-Control': 'no-store',
      });
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
