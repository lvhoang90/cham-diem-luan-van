# Hướng dẫn tích hợp vào dự án khác

Dành cho người/agent muốn dùng "Trợ lý phản biện học thuật" trong dự án riêng. Có hai cách: chạy như một dịch vụ độc lập (đơn giản nhất), hoặc nhúng các mô-đun lõi.

## 1. Lấy mã

Kho: `lvhoang90/cham-diem-luan-van`. Nhánh phát triển: `claude/kind-cannon-fd2obp` (PR #1 vào `main`). Cần được cấp quyền vào kho (agent Claude khác dùng `add_repo`).

```bash
git clone https://github.com/lvhoang90/cham-diem-luan-van.git
cd cham-diem-luan-van && git checkout claude/kind-cannon-fd2obp   # hoặc main sau khi PR được gộp
npm install
npm test                      # 24 kiểm thử, không cần khóa API
```

Yêu cầu: Node 20 trở lên. Kho **không chứa khóa API**; phải tự đặt `ANTHROPIC_API_KEY`.

## 2. Cách A: chạy như dịch vụ

```bash
export ANTHROPIC_API_KEY=...
npm start                     # http://localhost:3000 (PORT để đổi cổng)
npm run demo                  # không gọi AI, nội dung minh họa, để thử giao diện/luồng
```

Biến môi trường chính (mặc định trong ngoặc): `REVIEW_MODEL` (`claude-opus-5-5`), `REVIEW_EFFORT` (`high`), `ACCESS_CODE` (tắt; đặt thì mọi `/api/*` trừ `/api/health` cần header `x-access-code`), `MAX_FILE_MB` (60), `MAX_WORK_FILES` (40), `BATCH_CONCURRENCY` (1), `MAX_OUTPUT_TOKENS` (128000), `MAX_DIRECT_CHARS` (1.000.000), `JOB_TTL_MIN` (360), `USD_VND` (25500), `USAGE_LOG` (`usage-log.jsonl`, đặt rỗng để tắt), `PRICE_INPUT_PER_MTOK`/`PRICE_OUTPUT_PER_MTOK` (ghi đè giá).

### API HTTP

| Phương thức, đường dẫn | Việc làm |
|---|---|
| `GET /api/health` | Tình trạng, chế độ demo, ngưỡng điểm, giới hạn |
| `POST /api/template` (multipart: `template` = .docx/PDF) | Đọc mẫu nhận xét, trả `templateId`, khung `template` (các mục, hướng dẫn, điểm) và `usage` |
| `POST /api/review` (multipart: `templateId`, `works` = nhiều tệp, `docType` = `proposal`/`article`/`thesis`/`dissertation`/`other`, `role`, `field`, `notes`) | Tạo lô, trả `202 {jobId, count}`. **Mỗi tệp là một công trình của một người**, xử lý tuần tự, độc lập |
| `GET /api/review/:jobId` | Trạng thái lô: từng tệp (`queued`/`running`/`done`/`error`/`cancelled`), tiến độ, tóm tắt điểm, `usage` |
| `GET /api/review/:jobId/:index` | Kết quả đầy đủ của công trình thứ `index` (409 nếu chưa xong) |
| `POST /api/review/:jobId/cancel` | Dừng sau công trình hiện tại; các công trình đã xong được giữ |
| `POST /api/export` (JSON = một kết quả, có thể đã chỉnh sửa) | Trả .docx đúng khung mẫu |
| `POST /api/export-zip` (`{results:[...]}`) | Mỗi công trình một .docx riêng, gói .zip |
| `GET /api/usage` | Tổng token/USD lũy kế theo nhật ký |

Luồng gọi: `template` → `review` → thăm dò `GET /api/review/:jobId` mỗi 2 giây → lấy từng kết quả → `export`.

Kết quả một công trình gồm: `sections` (đúng thứ tự và tên mục của mẫu, mỗi mục có `content`, `strengths`, `weaknesses`, `revisions`, `evidence` đã đối chiếu, `points`), `score` (`score100`, `rows`), `decision` (khuyến nghị, `belowPass` khi dưới 60), `fatalDefects`, `integrityNotes`, `questions`, `limitations`, `warnings`, `verification` (số trích dẫn khớp/bị loại), `usage`.

## 3. Cách B: nhúng mô-đun (ESM)

| Mô-đun | Dùng để |
|---|---|
| `server/docx-read.js` | `readDocument(buffer, filename)` đọc .docx hoặc PDF có chữ thành các khối văn bản (từ chối PDF scan, PDF lỗi phông) |
| `server/pipeline.js` | `analyzeTemplate(file, meter)`; `runReview({template, workFiles:[file], meta, onProgress, meter})` trả kết quả một công trình; `assemble` ghép/chấm điểm từ dữ liệu thô của mô hình |
| `server/verify.js` | `buildIndex`, `verifyQuote`, `verifyEvidence`: đối chiếu trích dẫn với bản gốc (không cần AI) |
| `server/rubric.js` | Thang điểm mặc định, ngưỡng, `decide`, `computeScore` |
| `server/export-docx.js` | `buildDocx(result)`, `exportFileName` |
| `server/usage.js` | `UsageMeter` cộng token thật từ API, quy ra USD/VND |
| `server/prompts.js`, `server/schemas.js` | Lời nhắc hệ thống và schema đầu ra |

Quy tắc khi nhúng:
- Mỗi lần `runReview` chỉ truyền **một** công trình (`workFiles` một phần tử) để không lẫn nội dung giữa các tác giả.
- Giữ bước đối chiếu trích dẫn (`assemble` đã làm sẵn): đây là lớp chống bịa dẫn chứng.
- Tổng điểm do mã tính từ điểm thành phần; đừng lấy số tổng do mô hình tự khai.
- Không chép lời nhắc cho nhiều tác giả vào một lượt gọi.

## 4. Bản chạy trong trình duyệt (artifact)

`node scripts/build-artifact.mjs` ghép `artifact/` thành một trang HTML chạy độc lập, gọi Claude bằng tài khoản người xem. Dùng để thử nhanh, không phải cách tích hợp chính. Logic thang điểm/ngưỡng được sao ở `artifact/core.js`; đổi `server/rubric.js` thì sửa cả hai nơi.

## 5. Điều cần biết

- Chưa kiểm chứng bằng mô hình thật trong môi trường phát triển (không có khóa); nên chạy thử một mẫu và một công trình quen thuộc rồi so với nhận xét của chuyên gia.
- Hệ thống không kiểm tra đạo văn và không xác minh tài liệu tham khảo có thật; kết quả là bản nháp để người phản biện thẩm định.
- Nội dung tệp chỉ giữ trong bộ nhớ, tự xóa sau `JOB_TTL_MIN`; nội dung được gửi tới dịch vụ AI, cần phù hợp quy định bảo mật của đơn vị.
- Thư viện đọc PDF là pdfjs-dist 3.11 (đã tắt thực thi mã từ phông bằng `isEvalSupported:false`); nên nâng bản nếu triển khai cho nhiều người dùng.
