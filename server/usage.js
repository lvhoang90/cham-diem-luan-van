import fs from 'node:fs';
import { config } from './config.js';

// Giá API công khai (USD cho 1 triệu token). Có thể ghi đè bằng PRICE_INPUT_PER_MTOK / PRICE_OUTPUT_PER_MTOK.
// readX: hệ số giá đọc bộ nhớ đệm so với giá nhập (Opus 5.5: 0,20/4 = 0,05; mặc định 0,1). Ghi bộ nhớ đệm 5 phút tính 1,25 lần giá nhập.
export const CACHE_WRITE_X = 1.25;
export const PRICES = {
  'claude-opus-5-5': { in: 4, out: 20, readX: 0.05 },
  'claude-opus-5': { in: 5, out: 25 },
  'claude-opus-4-8': { in: 5, out: 25 },
  'claude-sonnet-5-5': { in: 2, out: 10, readX: 0.1 },
  'claude-sonnet-5': { in: 2, out: 10 },
  'claude-fable-5-1': { in: 10, out: 50 },
  'claude-fable-5': { in: 10, out: 50 },
  'claude-haiku-4-5': { in: 1, out: 5 },
};

export function priceFor(model) {
  const i = process.env.PRICE_INPUT_PER_MTOK, o = process.env.PRICE_OUTPUT_PER_MTOK;
  if (i && o && Number(i) >= 0 && Number(o) >= 0) return { in: Number(i), out: Number(o), custom: true };
  return PRICES[model] || null;
}

const r2 = (x) => Math.round(x * 100) / 100;

/** Cộng dồn token của các lần gọi; token suy luận (thinking) đã nằm trong output_tokens và được tính như đầu ra. */
export class UsageMeter {
  constructor(model = config.model) {
    this.model = model;
    this.calls = 0; this.input = 0; this.output = 0; this.cacheRead = 0; this.cacheWrite = 0; this.estimated = false;
  }

  add(u) {
    if (!u) return;
    this.calls++;
    this.input += u.input_tokens || 0;
    this.cacheWrite += u.cache_creation_input_tokens || 0;
    this.cacheRead += u.cache_read_input_tokens || 0;
    this.output += u.output_tokens || 0;
  }

  /** Chế độ demo (không gọi AI): ước lượng thô theo số ký tự để thử giao diện. */
  addEstimate(inChars, outChars) {
    this.estimated = true; this.calls++;
    this.input += Math.round(inChars / 2.6); this.output += Math.round(outChars / 2.6);
  }

  merge(other) {
    this.calls += other.calls; this.input += other.input; this.output += other.output; this.cacheRead += other.cacheRead; this.cacheWrite += other.cacheWrite;
    this.estimated ||= other.estimated;
    return this;
  }

  snapshot() {
    const p = priceFor(this.model);
    const costUsd = p ? (this.input * p.in + this.cacheWrite * p.in * CACHE_WRITE_X + this.cacheRead * p.in * (p.readX ?? 0.1) + this.output * p.out) / 1e6 : null;
    const inputAll = this.input + this.cacheWrite + this.cacheRead;
    return {
      model: this.model, calls: this.calls, inputTokens: inputAll, outputTokens: this.output,
      cacheWriteTokens: this.cacheWrite, cacheReadTokens: this.cacheRead,
      totalTokens: inputAll + this.output,
      costUsd: costUsd == null ? null : r2(costUsd),
      costVnd: costUsd == null ? null : Math.round((costUsd * config.usdVnd) / 100) * 100,
      usdVnd: config.usdVnd, priceKnown: !!p, estimated: this.estimated,
    };
  }
}

export const sumSnapshots = (list) => {
  const out = { calls: 0, inputTokens: 0, outputTokens: 0, cacheWriteTokens: 0, cacheReadTokens: 0, totalTokens: 0, costUsd: 0, costVnd: 0, priceKnown: true, estimated: false, model: list[0]?.model, usdVnd: config.usdVnd };
  for (const s of list) {
    out.calls += s.calls; out.inputTokens += s.inputTokens; out.outputTokens += s.outputTokens; out.totalTokens += s.totalTokens;
    out.cacheWriteTokens += s.cacheWriteTokens || 0; out.cacheReadTokens += s.cacheReadTokens || 0;
    out.priceKnown &&= s.priceKnown; out.estimated ||= s.estimated;
    out.costUsd += s.costUsd || 0; out.costVnd += s.costVnd || 0;
  }
  out.costUsd = r2(out.costUsd);
  if (!out.priceKnown) { out.costUsd = null; out.costVnd = null; }
  return out;
};

/* ---- Nhật ký chi phí: chỉ ghi số liệu, không ghi tên tệp hay nội dung ---- */
export function appendLedger(entry) {
  if (!config.usageLog) return;
  const keep = ['model', 'demo', 'works', 'ok', 'inputTokens', 'outputTokens', 'cacheWriteTokens', 'cacheReadTokens', 'totalTokens', 'costUsd']; // danh sách trắng: không bao giờ ghi tên tệp hay nội dung
  const row = Object.fromEntries(keep.filter((k) => k in entry).map((k) => [k, entry[k]]));
  try { fs.appendFileSync(config.usageLog, JSON.stringify({ ts: new Date().toISOString(), ...row }) + '\n'); } catch { /* nhật ký là tùy chọn */ }
}

export function readLedger() {
  const empty = () => ({ sessions: 0, works: 0, totalTokens: 0, costUsd: 0 });
  const today = empty(), all = empty();
  if (!config.usageLog || !fs.existsSync(config.usageLog)) return { today, all, enabled: !!config.usageLog, demoExcluded: true };
  const day = new Date().toISOString().slice(0, 10);
  for (const line of fs.readFileSync(config.usageLog, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let e; try { e = JSON.parse(line); } catch { continue; }
    if (e.demo) continue;
    for (const t of e.ts?.startsWith(day) ? [today, all] : [all]) { t.sessions++; t.works += e.works || 0; t.totalTokens += e.totalTokens || 0; t.costUsd += e.costUsd || 0; }
  }
  today.costUsd = r2(today.costUsd); all.costUsd = r2(all.costUsd);
  return { today, all, enabled: true, demoExcluded: true };
}
