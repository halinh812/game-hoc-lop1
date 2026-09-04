# Roadmap — Vở học Tiếng Anh của Bòng

Game học tiếng Anh cho trẻ lớp 1 qua hình thức chơi, dùng cơ chế học ngắt quãng
(spaced repetition) thích nghi theo độ chính xác và tốc độ phản hồi của trẻ.
Chạy trên web tĩnh (GitHub Pages), lưu tiến độ local trên trình duyệt. Kiến
trúc chuẩn bị sẵn để mở rộng nhiều môn học và đóng gói thành app (Capacitor)
trong tương lai.

Thời gian dự kiến: ~25 ngày, chia 8 phase (0–7).

## Kiến trúc tổng thể

```
Content Packs (JSON, tự biên soạn)
        |
Learning Engine (SRS thích nghi trẻ em)
        |
Mini-game Engine (plugin: Zoo Catch, Matching, Listen&Choose...)
        |
Progress Store (localStorage, versioned)
```

Nguyên tắc: mini-game không tự quyết định từ nào xuất hiện — nó hỏi Learning
Engine, Learning Engine trả lời dựa trên thuật toán ưu tiên. Thêm game mới
hay thêm môn mới không phải sửa lại logic học.

Nền tảng SRS đã có sẵn trong `index.html` hiện tại (hệ `level` 0–5 và
`INTERVALS_MIN = [0, 10, 1440, 4320, 10080, 20160]` phút) — Phase 1 sẽ nâng
cấp thêm yếu tố tốc độ phản hồi, không viết lại từ đầu.

## Trạng thái các Phase

- [x] Phase 0 — Định hướng & Thiết kế nền tảng (Ngày 1–2)
- [ ] Phase 1 — Nền móng kỹ thuật (Ngày 3–6)
- [ ] Phase 2 — Game lõi: Bắt thú Sở thú (Ngày 7–11)
- [ ] Phase 3 — Giao diện & cảm giác AAA (Ngày 12–15)
- [ ] Phase 4 — Hệ thống biên soạn nội dung + Game #2 (Ngày 16–18)
- [ ] Phase 5 — Playtest thật với bé & tinh chỉnh (Ngày 19–21)
- [ ] Phase 6 — PWA hoàn thiện & tối ưu (Ngày 22–23)
- [ ] Phase 7 — QA cuối & chuẩn bị lộ trình App Store (Ngày 24–25)

---

## Phase 0 — Định hướng & Thiết kế nền tảng (Ngày 1–2)

Mục tiêu: chốt mọi quyết định lớn trước khi code để không phải đập đi làm lại.

- [ ] Viết Game Design Document (GDD) ngắn: đối tượng chơi, vòng lặp chơi
      chính, thời lượng 1 buổi chơi phù hợp trẻ lớp 1
- [ ] Chốt schema nội dung JSON dùng chung cho mọi môn học
- [ ] Demo 1 con vật mẫu bằng SVG để duyệt phong cách mỹ thuật
- [ ] Danh sách chủ đề khởi động cho Tiếng Anh (màu sắc, con vật, số đếm,
      trái cây, gia đình)
- [ ] Quyết định nguồn hình ảnh: SVG vector tự code (nhân vật/icon) +
      AI-ảnh-ngoài (bối cảnh nền) — đã chốt hybrid
- [ ] Quyết định âm thanh: Web Speech API trước, có lớp AudioProvider để
      nâng cấp TTS chất lượng cao sau — đã chốt

**Đầu ra:** `GDD.md`, `content-schema.json` mẫu, 1 SVG demo được duyệt.

---

## Phase 1 — Nền móng kỹ thuật (Ngày 3–6)

Tách `index.html` hiện tại thành các module rõ ràng, không đổi hành vi hiện
có, chỉ tổ chức lại để dễ mở rộng.

- [ ] Content Loader: đọc JSON theo schema, validate dữ liệu
- [ ] Learning Engine: nâng cấp hệ `level`/`INTERVALS_MIN` có sẵn, thêm
      `response_time_ms`, phân loại đúng-nhanh / đúng-chậm / sai, đưa từ sai
      quay lại sớm hơn trong cùng phiên
- [ ] Hàm chọn từ tiếp theo: ưu tiên từ đến hạn ôn + tỉ lệ sai cao, trộn
      từ mới, tránh lặp liên tiếp
- [ ] Progress Store: bọc localStorage với version dữ liệu (an toàn khi
      đổi cấu trúc sau này)
- [ ] AudioProvider: lớp trừu tượng phát âm thanh (fallback Web Speech API)

**Đầu ra:** engine chạy được, test bằng dữ liệu giả.

---

## Phase 2 — Game lõi: Bắt thú Sở thú (Ngày 7–11)

- [ ] Con vật xuất hiện, di chuyển trong màn hình sở thú
- [ ] Phát âm gọi tên qua AudioProvider
- [ ] Ghi nhận đúng/sai + response_time, đẩy vào Learning Engine
- [ ] Con vật trả lời sai xuất hiện lại nhiều hơn
- [ ] Độ khó tăng dần theo % đúng gần nhất

**Đầu ra:** 1 mini-game chơi được đầu-cuối, kết nối đúng Learning Engine.

---

## Phase 3 — Giao diện & cảm giác AAA (Ngày 12–15)

- [ ] Bộ SVG nhân vật/vật thể đồng bộ phong cách
- [ ] Bối cảnh nền chất lượng cao (AI-ảnh-ngoài)
- [ ] Game feel: hiệu ứng nảy, hạt confetti, rung nhẹ, SFX
- [ ] Mở rộng vai trò linh vật cú: cấp độ, lời khen theo ngữ cảnh
- [ ] Hệ thống sao/điểm thưởng, không dùng game-over gây áp lực

**Đầu ra:** bản demo cho bé chơi thử thật.

---

## Phase 4 — Hệ thống biên soạn nội dung + Game #2 (Ngày 16–18)

- [ ] Template JSON mẫu + script kiểm tra hợp lệ
- [ ] Tài liệu "Cách thêm 1 từ vựng mới"
- [ ] Mini-game thứ 2 (Nghe & chọn tranh / ghép cặp) để kiểm chứng kiến
      trúc plugin

**Đầu ra:** tự thêm được từ vựng mới không cần code.

---

## Phase 5 — Playtest thật với bé & tinh chỉnh (Ngày 19–21)

- [ ] Quan sát bé chơi thật, ghi nhận điểm rối/khó
- [ ] Tinh chỉnh ngưỡng thời gian phản hồi theo dữ liệu thật
- [ ] Sửa lỗi, kiểm tra ổn định trên điện thoại thật

---

## Phase 6 — PWA hoàn thiện & tối ưu (Ngày 22–23)

- [ ] `manifest.json` + icon + splash screen
- [ ] Service Worker cho phép chơi offline
- [ ] Tối ưu hiệu năng trên điện thoại đời thấp

---

## Phase 7 — QA cuối & chuẩn bị lộ trình App Store (Ngày 24–25)

- [ ] QA đa trình duyệt/thiết bị (chú ý Safari iOS + âm thanh tự phát)
- [ ] Tài liệu "Cách thêm môn học mới"
- [ ] Kế hoạch đóng gói app bằng Capacitor (Android/iOS), lưu ý chính sách
      app trẻ em (Designed for Families / Kids Category) — lưu local hiện
      tại là lợi thế cho việc xin duyệt sau này

---

## Ghi chú kỹ thuật lâu dài

- Âm thanh: Web Speech API (hiện tại) → Google Cloud TTS Neural2 / ElevenLabs
  / thu âm giọng thật (thương mại, chưa làm ngay)
- Ảnh: SVG vector tự code cho nhân vật/icon (rẻ, nhẹ, dễ animate) + AI-ảnh
  ngoài cho bối cảnh nền phức tạp
- localStorage dùng theo origin (`halinh812.github.io`), không phụ thuộc
  nội dung code — cập nhật code không làm mất tiến độ đã lưu của bé, miễn
  không đổi `STORE_KEY` hoặc cấu trúc dữ liệu mà không viết migration
