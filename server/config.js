// Cấu hình tập trung. Mọi giá trị có thể ghi đè bằng biến môi trường.
const num = (v, d) => (v !== undefined && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : d);

export const config = {
  port: num(process.env.PORT, 3000),
  model: process.env.REVIEW_MODEL || 'claude-opus-5-5',
  effort: process.env.REVIEW_EFFORT || 'high',
  mock: process.env.MOCK_LLM === '1',
  accessCode: process.env.ACCESS_CODE || '',
  maxFileBytes: num(process.env.MAX_FILE_MB, 30) * 1024 * 1024,
  maxWorkFiles: num(process.env.MAX_WORK_FILES, 10),
  // Văn bản dài hơn ngưỡng này được đọc theo từng phần rồi tổng hợp.
  maxDirectChars: num(process.env.MAX_DIRECT_CHARS, 450_000),
  chunkChars: num(process.env.CHUNK_CHARS, 180_000),
  maxTotalChars: num(process.env.MAX_TOTAL_CHARS, 2_500_000),
  jobTtlMs: num(process.env.JOB_TTL_MIN, 120) * 60_000,
  // Ngưỡng điểm (thang 100) để phân loại khuyến nghị.
  thresholds: { reject: 40, major: 55, pass: 60, good: 75 },
};
