# Tối ưu chi phí token

Kết luận ngắn: **không có "thuốc tiên" làm giảm token đọc tài liệu**. Phần lớn token là chính nội dung công trình; chi phí được quyết định bởi (1) số lần phải đọc lại toàn văn, (2) mức suy luận (effort), (3) có dùng bộ nhớ đệm đúng chỗ hay không. Công cụ chuyển đổi định dạng như MarkItDown không giúp được (xem cuối tệp).

## Mô hình chi phí (ngoại tuyến, `node scripts/cost-model.mjs`)

Giả định (sửa ở đầu tệp): Claude Opus 5.5 ($4 vào / $20 ra mỗi triệu token; ghi đệm 1,25 lần, đọc đệm 0,05 lần), 2,6 ký tự/token, 8 mục nhận xét, ~900 token đầu ra mỗi mục, suy luận mỗi lượt gọi: medium 5.000, high 12.000 token. **Số token suy luận là giả định chưa đo**; chạy thật vài lượt rồi hiệu chỉnh bằng `usage-log.jsonl`.

Chi phí một công trình, so với phương án A (100%):

| Phương án | Đề cương ~60k ký tự | Luận văn ~250k | Luận án ~500k |
|---|---|---|---|
| A. Một lượt, effort high (bản máy chủ hiện tại) | 100% ($0,54) | 100% ($0,83) | 100% ($1,21) |
| B. Một lượt, effort medium | 74% | 83% | 88% |
| C. Chia lượt, không đệm, high (như bản artifact) | 224% | 251% | 266% |
| D. Chia lượt + bộ nhớ đệm, high | 196% | 174% | 162% |
| E. Chia lượt + đệm, mục medium, tổng hợp high | 143% | 140% | 139% |
| F. Một lượt + đệm khi không ai đọc lại | 104% | 112% | 116% |

Nếu giả định suy luận không lặp lại ở mỗi lượt (độ nhạy C2/D2 trong tệp chạy), C còn 157% và D còn 128% đối với đề cương; thứ tự giữa các phương án không đổi.

## Phương án khuyến nghị

1. **Bản máy chủ (có khóa API): giữ "một lượt" (A hoặc B), không bật bộ nhớ đệm.** Đây là phương án rẻ nhất; giới hạn đầu ra 128.000 token đủ cho một lượt nên không cần chia nhỏ. Bộ nhớ đệm chỉ có lợi khi toàn văn được đọc lại nhiều lần trong vòng 5 phút; với một lượt duy nhất, tiền ghi đệm (1,25 lần) chỉ làm đắt thêm (phương án F).
2. **Đổi effort từ high sang medium** (`REVIEW_EFFORT=medium`) tiết kiệm khoảng 12–26%. Chỉ làm sau khi so chất lượng nhận xét trên vài công trình quen thuộc: phản biện cần chặt chẽ nên đây là đánh đổi của người dùng, không phải mặc định.
3. **Nơi buộc phải chia lượt** (hàm máy chủ có giới hạn thời gian như Vercel, hoặc câu trả lời của trang bị cắt như bản artifact): dùng **bộ nhớ đệm, đặt toàn văn ở đầu và lời dặn thay đổi ở sau**, và hạ effort của các lượt nhận xét mục xuống medium, giữ high cho lượt tổng hợp (phương án E, rẻ hơn D khoảng 27–29% trong mô hình). Không chia lượt nếu không bắt buộc.
4. **Giữ số lần gọi tối thiểu:** không gửi lại toàn văn cho việc nhỏ; đọc mẫu nhận xét là lượt riêng, ngắn, tính một lần cho cả lô; không thử lại nguyên văn yêu cầu đã bị cắt (tách nhỏ ngay).
5. **Cắt phần vô ích khỏi văn bản gửi đi:** đã bỏ các dòng mục lục có dấu chấm dẫn ("1.1. … ...... 12") và số trang/đầu chân trang lặp lại. Mức tiết kiệm nhỏ (khoảng 1–2% công trình dài) nhưng không rủi ro. Không bỏ tài liệu tham khảo vì cần kiểm tra nhất quán trích dẫn.

## Đo thật

Mỗi phiên ghi vào `usage-log.jsonl` token vào/ra, token ghi đệm và đọc đệm, chi phí. Sau 5–10 công trình, lấy trung bình để thay các giả định trong `scripts/cost-model.mjs` và chọn lại phương án.

## Vì sao không dùng MarkItDown

Công cụ Python (MIT) chuyển nhiều định dạng sang Markdown cho LLM. Mình đã chuyển .docx/.pdf sang văn bản thuần ở trình duyệt/Node, nên không còn gì "nặng" để bỏ; lớp đánh dấu `[¶n]` (cần để ghi số đoạn, số trang và đối chiếu trích dẫn) chỉ chiếm ~3% ký tự; MarkItDown không tạo số đoạn, chạy bằng Python (không dùng được ở trình duyệt/artifact), không OCR PDF sẵn và có thể làm mất tiêu đề/bố cục mà mình tự nhận diện.
