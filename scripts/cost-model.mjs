// Mô hình chi phí ngoại tuyến cho một công trình: so sánh các cách gọi mô hình (không cần khóa API).
// Mọi tham số đều là GIẢ ĐỊNH, sửa ở đầu tệp rồi chạy: node scripts/cost-model.mjs
// Hiệu chỉnh bằng số thật: lấy "token vào/ra" trung bình từ usage-log.jsonl sau vài lượt chạy.

const PRICE = { in: 4, out: 20, cacheWriteX: 1.25, cacheReadX: 0.05 }; // Claude Opus 5.5, USD/triệu token (đọc bộ nhớ đệm = 0,20 USD)
const USD_VND = 25500;
const CHARS_PER_TOKEN = 2.6;                       // tiếng Việt (ước lượng thô)
const THINK = { low: 1500, medium: 5000, high: 12000, xhigh: 25000 }; // token suy luận mỗi lượt gọi — GIẢ ĐỊNH, chưa đo
const OUT_PER_SECTION = 900;                       // token đầu ra mỗi mục nhận xét (JSON, tiếng Việt)
const OUT_OVERALL = 3000;                          // token đầu ra phần tổng hợp
const SECTIONS = 8;

const usd = (inTok, outTok, { write = 0, read = 0 } = {}) =>
  (inTok * PRICE.in + write * PRICE.in * PRICE.cacheWriteX + read * PRICE.in * PRICE.cacheReadX + outTok * PRICE.out) / 1e6;

function strategies(D) {
  const out = SECTIONS * OUT_PER_SECTION + OUT_OVERALL;
  const calls = Math.ceil(SECTIONS / 4) + 1; // 4 mục mỗi lượt + 1 lượt tổng hợp
  const rows = [];
  const add = (name, v, note) => rows.push({ name, usd: v, note });
  add('A. Một lượt, effort high', usd(D, out + THINK.high), 'hiện tại của bản máy chủ');
  add('B. Một lượt, effort medium', usd(D, out + THINK.medium), 'rẻ nhất; chất lượng cần kiểm chứng');
  add('C. Chia lượt (4 mục), KHÔNG đệm, high', usd(D * calls, out + THINK.high * calls), 'như artifact: đọc lại toàn văn mỗi lượt');
  add('D. Chia lượt + bộ nhớ đệm, high', usd(0, out + THINK.high * calls, { write: D, read: D * (calls - 1) }), 'cách của Ami: bền, chịu giới hạn thời gian');
  add('E. Chia lượt + đệm, mục=medium, tổng hợp=high', usd(0, out + THINK.medium * (calls - 1) + THINK.high, { write: D, read: D * (calls - 1) }), 'cân bằng chất lượng/chi phí');
  // Độ nhạy: nếu suy luận chia theo phạm vi lượt (mỗi lượt hẹp hơn nên nghĩ ít hơn) thay vì lặp đủ ở mỗi lượt.
  const thinkSpread = (THINK.high * 1.5) / calls;
  add('C2. Như C nhưng suy luận chia theo lượt', usd(D * calls, out + thinkSpread * calls), 'độ nhạy: giả định suy luận KHÔNG lặp lại');
  add('D2. Như D nhưng suy luận chia theo lượt', usd(0, out + thinkSpread * calls, { write: D, read: D * (calls - 1) }), 'độ nhạy: giả định suy luận KHÔNG lặp lại');
  add('F. Một lượt + đệm (chỉ khi có thể gọi lại)', usd(0, out + THINK.high, { write: D }), 'đắt hơn A nếu không ai đọc lại đệm');
  return rows;
}

const fmt = (x) => `$${x.toFixed(2)} (~${Math.round((x * USD_VND) / 1000) * 1000} đ)`;
for (const [label, chars] of [['Đề cương/bài báo ~60.000 ký tự', 60_000], ['Luận văn ~250.000 ký tự', 250_000], ['Luận án ~500.000 ký tự', 500_000]]) {
  const D = Math.round(chars / CHARS_PER_TOKEN);
  console.log(`\n${label} ≈ ${D.toLocaleString('vi-VN')} token, ${SECTIONS} mục`);
  const rows = strategies(D);
  const base = rows[0].usd;
  for (const r of rows) console.log(`  ${r.name.padEnd(52)} ${fmt(r.usd).padEnd(22)} ${(r.usd / base * 100).toFixed(0).padStart(4)}%  ${r.note}`);
}
