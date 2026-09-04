# Quy trình tạo ảnh con vật (AI-ảnh-ngoài)

Quyết định Phase 0: nhân vật con vật cần độ giống thật cao sẽ tạo bằng
công cụ AI ảnh bên ngoài (không phải SVG tự code) — xem lý do trong
`ROADMAP.md`. Tài liệu này là quy trình lặp lại cho từng con vật mới.

## Bước 1 — Bạn tạo ảnh

Copy đoạn "Khung phong cách" bên dưới + đoạn prompt riêng của con vật cần
tạo, dán vào **1 công cụ AI ảnh miễn phí** (Google ImageFX, Bing Image
Creator/Microsoft Designer, hoặc Leonardo.ai gói free). Đặt tỉ lệ khung
hình **1:1 (vuông)** nếu công cụ cho chọn.

### Khung phong cách (dán trước, dùng chung cho MỌI con vật)

```
Semi-realistic children's educational app character illustration,
side profile view captured mid-stride while walking, anatomically
accurate body proportions for the species (not cartoon, not chibi,
not big-head mascot style), soft painterly digital shading with a
warm gentle rim light, full body visible from nose/head to tail,
centered on a plain solid white (#FFFFFF) background, no ground
shadow, no scenery, no text, no watermark, no logo, high detail
fur/skin texture, calm friendly expression, square 1:1 composition,
subject fills about 70-80% of the frame.
Avoid: cartoon style, big head mascot proportions, human clothing,
multiple animals in frame, cropped body parts, background scenery,
text or watermark.
```

### Prompt riêng: Hổ (Tiger)

```
A Bengal tiger, walking to the right, front-right leg stepping
forward and back-left leg stepping forward (diagonal walking gait),
tail relaxed and slightly curved upward, ears alert, amber eyes with
a calm expression, vivid orange coat with bold black stripes, white
underbelly and chin/muzzle.
```

Tạo vài phiên bản (thường công cụ cho ra 2–4 ảnh/lượt), chọn ảnh **ưng ý
nhất** — ưu tiên ảnh có nền trắng sạch, dáng đi rõ, không bị cắt cụt chân/
đuôi/tai.

## Bước 2 — Gửi ảnh cho tôi

Tải ảnh về (PNG), gửi trực tiếp vào cuộc trò chuyện này.

## Bước 3 — Tôi xử lý (tự động)

1. Chạy `tools/remove_white_bg.py` (đã có sẵn trong repo) để tách nền
   trắng → nền trong suốt
2. Tối ưu kích thước file cho web/mobile
3. Đặt tên theo đúng chuẩn trong `content-schema.json`
   (`assets/animals/tiger.png`)
4. Ghép vào bản demo "sân chơi" để bạn xem thử cảm giác chuyển động thật
   trong game

## Bước 4 — Chuyển động trong game (đã điều chỉnh cho ảnh raster)

Vì giờ dùng ảnh AI (không phải SVG khớp xương), con vật **di chuyển ngang
qua màn hình** kết hợp **nhấp nhô nhẹ (bob)** bằng CSS — không làm khớp
chân động từng khung hình. Đây là kỹ thuật phổ biến trong game di động
(ảnh tĩnh tư thế đang bước + trượt ngang + nảy nhẹ vẫn đọc được là "đang
đi" rất tốt ở kích thước nhân vật trong game). Ưu điểm: nhất quán 100%,
không phụ thuộc việc AI tạo nhiều khung hình giống hệt nhau (rất khó với
công cụ ảnh AI hiện tại).

## Bước 5 — Nhân rộng cho các con vật khác

Sau khi duyệt xong con Hổ, dùng lại đúng "Khung phong cách" ở trên, chỉ đổi
đoạn prompt riêng (tên con vật, đặc điểm màu lông/hoa văn) cho từng con:
Voi, Sư Tử, Khỉ, Hươu Cao Cổ... để giữ đồng bộ phong cách trên toàn bộ Sở
thú.
