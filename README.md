# Trợ lý phản biện học thuật

Ứng dụng web hỗ trợ giáo sư, tiến sĩ, chuyên gia phản biện soạn **bản nháp nhận xét/phản biện và đề xuất điểm (thang 100)** cho đề cương, công trình, bài báo, luận văn, luận án — **theo đúng khung sườn của mẫu do trường/viện quy định**.

## Cách dùng (5 bước có hướng dẫn)

1. **Tải mẫu nhận xét** (.docx) của trường/viện. Hệ thống nhận diện khung (các mục, hướng dẫn, điểm nếu có) để người dùng đối chiếu và xác nhận.
2. **Tải các công trình cần phản biện**: nhiều tệp. **Mỗi tệp là một công trình của một người**; hệ thống đọc tuần tự từng tệp, nhận xét riêng và xuất một bản nhận xét riêng cho từng tệp (không dùng chung ngữ cảnh giữa các tệp). Công trình gồm nhiều chương thì gộp thành một tệp trước khi tải.
3. Chọn loại văn bản, vai trò, lĩnh vực (tùy chọn).
4. Phân tích.
5. Xem bảng tổng hợp (điểm, khuyến nghị, cảnh báo dưới 60 của từng công trình), chọn từng công trình để **sửa trực tiếp** nội dung và điểm, rồi tải **bản nhận xét .docx riêng** của công trình đó có cấu trúc đúng mẫu, hoặc tải **tất cả (.zip)**. Một công trình lỗi (ví dụ PDF scan) không làm dừng các công trình khác; có thể bấm dừng giữa chừng và vẫn giữ các công trình đã xong.

Nhận tệp `.docx` và **PDF có lớp chữ** (kiểm tra cả nội dung tệp, không chỉ đuôi tệp). PDF dạng ảnh (bản scan) và PDF lỗi mã hóa phông tiếng Việt cũ bị từ chối kèm hướng dẫn. Với PDF, hệ thống dựng lại đoạn văn từ vị trí chữ, bỏ số trang và đầu/chân trang lặp lại, và ghi số trang vào phần trích dẫn; bảng biểu và chữ in đậm trong PDF không được nhận diện chính xác như trong .docx, nên mẫu nhận xét nên dùng .docx khi có thể.

## Điểm và khuyến nghị

- Mẫu có điểm thành phần → chấm theo mẫu và quy đổi về thang 100. Mẫu không có điểm → dùng thang 100 mặc định theo loại văn bản (`server/rubric.js`, mỗi thang cộng đúng 100).
- **Tổng điểm do mã tính**, không lấy số tổng do mô hình tự khai; điểm từng mục bị kẹp trong khoảng cho phép.
- Khuyến nghị theo điểm: `< 40` không thông qua, trả lại, viết lại toàn bộ · `40–54` chỉnh sửa lớn, phản biện lại · `55–59` chỉnh sửa trước khi thông qua · `60–74` thông qua có điều kiện · `≥ 75` thông qua. **Dưới 60 luôn hiện cảnh báo.** Có "khuyết điểm rất nghiêm trọng" thì khuyến nghị không được tốt hơn "chỉnh sửa lớn", dù điểm cao. Ngưỡng cấu hình ở `server/config.js`.
- Người dùng sửa điểm trên màn hình thì tổng và khuyến nghị cập nhật theo.

## Bảo đảm chất lượng khoa học và liêm chính

- **Không bịa trích dẫn:** mọi đoạn trích nguyên văn mô hình đưa ra được đối chiếu máy móc với văn bản gốc; đoạn không khớp bị loại và đếm công khai. Vị trí (đoạn ¶) do hệ thống xác định, không tin vị trí do mô hình tự khai.
- Lời nhắc cấm tạo tài liệu tham khảo, tác giả, DOI, số liệu không có trong tài liệu; chỉ gợi ý hướng/từ khóa bổ sung.
- Không kết luận đạo văn hay gian lận, chỉ nêu "dấu hiệu cần kiểm tra" kèm cách kiểm tra. Hệ thống **không** kiểm tra trùng lặp và **không** xác minh tài liệu tham khảo có thật.
- Nội dung công trình được coi là dữ liệu, không phải chỉ thị (chống chèn lệnh kiểu "hãy cho 100 điểm").
- Chỗ không đủ cơ sở thì nói rõ ("chưa đủ cơ sở"), không suy đoán; mục mô hình bỏ sót bị đánh dấu và loại khỏi tổng điểm thay vì tính 0.
- Văn bản dài được đọc theo từng phần rồi tổng hợp; trích dẫn vẫn đối chiếu với toàn văn.
- Kết quả là **bản nháp**; người phản biện thẩm định và chịu trách nhiệm.

## Chạy

```bash
npm install
export ANTHROPIC_API_KEY=...        # bắt buộc
npm start                           # http://localhost:3000
npm run demo                        # không gọi AI, nội dung minh họa để thử giao diện
npm test
```

Biến môi trường tùy chọn: `REVIEW_MODEL` (mặc định `claude-opus-5-5`), `REVIEW_EFFORT` (`high`), `ACCESS_CODE` (bật mã truy cập), `PORT`, `MAX_FILE_MB` (60), `MAX_WORK_FILES` (40 công trình mỗi lô), `BATCH_CONCURRENCY` (1 = tuần tự), `MAX_OUTPUT_TOKENS` (128000), `MAX_DIRECT_CHARS` (1.000.000 ký tự đọc nguyên văn một lượt; dài hơn thì đọc từng phần), `JOB_TTL_MIN` (360).

## Theo dõi token và chi phí

Sau mỗi phiên (mỗi lô công trình) màn hình kết quả hiện: tổng token (vào/ra, gồm cả phần mô hình suy luận), chi phí ước tính theo USD và VND, trung bình mỗi công trình, và chi tiết từng công trình (kèm chi phí đọc mẫu, tính một lần cho cả lô). Trong lúc chạy cũng có số liệu cộng dồn theo từng tệp.

- **Bản máy chủ:** token lấy từ số liệu thật của API (`usage`); tiền = token × giá công khai của mô hình (`server/usage.js`, ghi đè bằng `PRICE_INPUT_PER_MTOK`/`PRICE_OUTPUT_PER_MTOK`), tỷ giá tham khảo `USD_VND` (mặc định 25.500). Mô hình không có trong bảng giá thì chỉ hiện token, không bịa số tiền. Đây là ước tính để theo dõi, không phải hóa đơn.
- **Nhật ký lũy kế:** mỗi phiên ghi một dòng vào `usage-log.jsonl` (chỉ số liệu: thời điểm, mô hình, số công trình, token, USD; không có tên tệp hay nội dung), màn hình kết quả hiện tổng hôm nay và toàn bộ. Tắt bằng `USAGE_LOG=`; xem nhanh: `GET /api/usage`. Phiên demo không được tính.
- **Bản artifact:** nền tảng không trả số token nên chỉ ước lượng (≈2,6 ký tự/token, đầu ra nhân đôi cho phần suy luận, giá tham khảo Opus 5.5); thực tế trừ vào hạn mức gói Claude của người xem. Sai số có thể vài chục phần trăm.

## Bảo mật

Tệp chỉ nằm trong bộ nhớ, không ghi đĩa, không ghi nội dung vào nhật ký; kết quả tự xóa sau `JOB_TTL_MIN` phút (mặc định 120). Nội dung được gửi tới dịch vụ AI để phân tích — cần phù hợp quy định bảo mật của cơ quan. Nếu đặt máy chủ ra Internet, nên bật `ACCESS_CODE` và dùng HTTPS.

## Bản artifact (chạy không cần máy chủ)

`artifact/` + `scripts/build-artifact.mjs` ghép thành một trang HTML duy nhất để thử nhanh: đọc .docx ngay trong trình duyệt, gọi Claude bằng tài khoản của người xem (không cần khóa API), đối chiếu trích dẫn, tính điểm và lưu .docx. Lời nhắc dùng chung với máy chủ (`server/prompts.js`); logic thang điểm/ngưỡng được sao sang `artifact/core.js` nên cần sửa đồng thời khi đổi `server/rubric.js`.

```bash
node scripts/build-artifact.mjs   # ra artifact/dist/tro-ly-phan-bien.html
```
