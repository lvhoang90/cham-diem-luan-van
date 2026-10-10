process.env.USAGE_LOG = '';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const { UsageMeter, sumSnapshots, appendLedger, readLedger, priceFor } = await import('../server/usage.js');
const { config } = await import('../server/config.js');

test('tính token và tiền theo bảng giá (Opus 5.5: 4 USD vào, 20 USD ra mỗi triệu token)', () => {
  const m = new UsageMeter('claude-opus-5-5');
  m.add({ input_tokens: 100_000, output_tokens: 20_000 });
  m.add({ input_tokens: 50_000, output_tokens: 5_000 });
  const s = m.snapshot();
  assert.equal(s.calls, 2);
  assert.equal(s.inputTokens, 150_000);
  assert.equal(s.outputTokens, 25_000);
  assert.equal(s.totalTokens, 175_000);
  assert.equal(s.costUsd, 1.1); // 0,15×4 + 0,025×20
  assert.equal(s.costVnd, Math.round((1.1 * config.usdVnd) / 100) * 100);
  assert.equal(s.estimated, false);
});

test('mô hình chưa có trong bảng giá: không bịa số tiền', () => {
  const m = new UsageMeter('mo-hinh-la');
  m.add({ input_tokens: 1000, output_tokens: 1000 });
  const s = m.snapshot();
  assert.equal(s.priceKnown, false);
  assert.equal(s.costUsd, null);
  assert.equal(s.totalTokens, 2000);
  assert.equal(sumSnapshots([s, s]).costUsd, null);
});

test('ghi đè giá bằng biến môi trường; cộng gộp nhiều phiên', () => {
  process.env.PRICE_INPUT_PER_MTOK = '1'; process.env.PRICE_OUTPUT_PER_MTOK = '2';
  try { assert.deepEqual(priceFor('claude-opus-5-5'), { in: 1, out: 2, custom: true }); } finally { delete process.env.PRICE_INPUT_PER_MTOK; delete process.env.PRICE_OUTPUT_PER_MTOK; }
  const a = new UsageMeter('claude-opus-5-5'); a.add({ input_tokens: 1e6, output_tokens: 0 });
  const b = new UsageMeter('claude-opus-5-5'); b.add({ input_tokens: 0, output_tokens: 1e6 });
  const t = sumSnapshots([a.snapshot(), b.snapshot()]);
  assert.equal(t.costUsd, 24);
  assert.equal(t.totalTokens, 2e6);
});

test('nhật ký chi phí chỉ có số liệu, tổng theo ngày/toàn bộ, bỏ qua bản demo', () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'usage-')), 'u.jsonl');
  config.usageLog = file;
  try {
    appendLedger({ model: 'x', demo: false, works: 3, totalTokens: 1000, costUsd: 0.5, filename: 'khong-duoc-ghi' });
    appendLedger({ model: 'x', demo: true, works: 9, totalTokens: 999999, costUsd: 99 });
    fs.appendFileSync(file, JSON.stringify({ ts: '2020-01-01T00:00:00Z', works: 2, totalTokens: 500, costUsd: 0.25 }) + '\nrác không phải JSON\n');
    assert.ok(!fs.readFileSync(file, 'utf8').includes('khong-duoc-ghi'), 'nhật ký không chứa tên tệp');
    const l = readLedger();
    assert.deepEqual(l.today, { sessions: 1, works: 3, totalTokens: 1000, costUsd: 0.5 });
    assert.deepEqual(l.all, { sessions: 2, works: 5, totalTokens: 1500, costUsd: 0.75 });
  } finally { config.usageLog = ''; }
  assert.equal(readLedger().enabled, false);
});
