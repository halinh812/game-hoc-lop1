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

1. Chạy `tools/remove_white_bg.py` (đã có sẵn trong repo, dùng kỹ thuật
   tô loang từ viền ảnh — không đục lỗ vào lông trắng bên trong con vật)
   để tách nền trắng → nền trong suốt
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

## Bước 5 — Danh sách 10 con vật MVP (Sở thú)

Chọn theo 3 tiêu chí: quen thuộc với trẻ lớp 1, dáng vẻ khác biệt rõ (để
bé nhận ra nhanh khi chơi), và đi/di chuyển được rõ ràng bằng ảnh tĩnh.
10 con là đủ đa dạng cho vòng học ngắt quãng mà không quá tải công sức
tạo ảnh (mỗi con cần tạo + duyệt thủ công).

- [x] Hổ (Tiger)
- [ ] Sư Tử (Lion)
- [ ] Voi (Elephant)
- [ ] Hươu Cao Cổ (Giraffe)
- [ ] Ngựa Vằn (Zebra)
- [ ] Khỉ (Monkey)
- [ ] Gấu (Bear)
- [ ] Chuột Túi (Kangaroo)
- [ ] Gấu Trúc (Panda)
- [ ] Cá Sấu (Crocodile)

### Prompt riêng cho từng con

```
Sư Tử (Lion):
A male African lion, walking to the right, front-right leg stepping
forward and back-left leg stepping forward (diagonal walking gait),
thick golden-brown mane framing the face, tail relaxed with a dark
tuft at the tip, calm confident expression, tawny golden coat, lighter
cream underbelly.

Voi (Elephant):
An Asian elephant, walking to the right, front-right leg stepping
forward and back-left leg stepping forward (walking gait), large
flapping ears, trunk gently curled forward, small tusks, gentle calm
expression, grey wrinkled skin, rounded body.

Hươu Cao Cổ (Giraffe):
A giraffe, walking to the right, front-right leg stepping forward and
back-left leg stepping forward (walking gait), very long neck held
upright, short horn-like ossicones on top of the head, long thin legs,
calm gentle expression, tan coat with brown patchwork spots, lighter
cream underbelly and legs.

Ngựa Vằn (Zebra):
A zebra, walking to the right, front-right leg stepping forward and
back-left leg stepping forward (walking gait), short upright mane,
tail with a dark tuft at the tip, alert friendly expression, white
coat with bold black stripes covering the whole body including the
legs and mane.

Khỉ (Monkey):
A brown capuchin monkey, walking to the right on all four limbs,
front-right hand stepping forward and back-left foot stepping forward
(walking gait), long curved tail raised slightly, curious playful
expression, light brown fur with a paler face and chest.

Gấu (Bear):
A brown bear, walking to the right, front-right leg stepping forward
and back-left leg stepping forward (walking gait), round ears, short
tail, sturdy heavy build, calm gentle expression, thick brown fur
coat.

Chuột Túi (Kangaroo):
A kangaroo, captured mid-hop moving to the right, both powerful hind
legs pushing off the ground together, small front paws held close to
the chest, thick tail extended back for balance, alert friendly
expression, sandy brown fur, lighter cream underbelly and a visible
front pouch.

Gấu Trúc (Panda):
A giant panda, walking to the right, front-right leg stepping forward
and back-left leg stepping forward (walking gait), round body, black
ears and black patches around the eyes, gentle calm expression, white
coat with bold black patches on the ears, eyes, legs, and shoulders.

Cá Sấu (Crocodile):
A crocodile, walking to the right on all four short legs (low
sprawling walking gait, body close to the ground), long snout with
visible teeth, textured bumpy skin, tail extended straight back, alert
expression, olive-green scaly skin with a lighter cream underside.
```

Sau 10 con này, thêm con mới chỉ cần lặp lại đúng công thức: Khung phong
cách (không đổi) + 1 đoạn mô tả riêng theo mẫu trên.
