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
- [x] Phase 1 — Nền móng kỹ thuật (Ngày 3–6)
- [x] Phase 2 — Game lõi: Bắt thú Sở thú (Ngày 7–11)
- [ ] Phase 3 — Giao diện & cảm giác AAA (Ngày 12–15)
- [ ] Phase 4 — Hệ thống biên soạn nội dung + Game #2 (Ngày 16–18)
- [ ] Phase 5 — Playtest thật với bé & tinh chỉnh (Ngày 19–21)
- [ ] Phase 6 — PWA hoàn thiện & tối ưu (Ngày 22–23)
- [ ] Phase 7 — QA cuối & chuẩn bị lộ trình App Store (Ngày 24–25)

---

## Phase 0 — Định hướng & Thiết kế nền tảng (Ngày 1–2)

Mục tiêu: chốt mọi quyết định lớn trước khi code để không phải đập đi làm lại.

- [x] Viết Game Design Document (GDD) ngắn: đối tượng chơi, vòng lặp chơi
      chính, thời lượng 1 buổi chơi phù hợp trẻ lớp 1
- [x] Chốt schema nội dung JSON dùng chung cho mọi môn học
- [x] Thử demo con vật bằng SVG tự code (2 vòng: cartoon nặng nét, rồi tả
      thực) — **không đạt độ giống thật cần thiết**, xem quyết định bên dưới
- [x] Danh sách chủ đề khởi động cho Tiếng Anh (màu sắc, con vật, số đếm,
      trái cây, gia đình) — nay là 5 content pack trong `content/packs/`
- [x] Quyết định nguồn hình ảnh: **đổi hướng** — dùng AI-ảnh-ngoài (raster
      PNG) cho nhân vật con vật cần độ giống thật; SVG tự code chỉ dùng cho
      icon/UI đơn giản không cần giống thật (nút bấm, huy hiệu, biểu tượng
      trang trí). Lý do: vẽ SVG bằng cách gõ tọa độ không có vòng lặp
      "nhìn rồi chỉnh" như họa sĩ thật, nên khó đạt độ giống thật cho chủ
      thể phức tạp như động vật — xem `ANIMAL_ART_PIPELINE.md`
- [ ] Con vật đi lại: dùng 1 ảnh tư thế đang bước + di chuyển ngang qua màn
      hình + nhấp nhô nhẹ (bob) bằng CSS — không làm khớp chân động (cần
      nhiều khung hình đồng nhất mà AI ảnh khó giữ nhất quán giữa các lần
      tạo)
- [ ] Quyết định âm thanh: Web Speech API trước, có lớp AudioProvider để
      nâng cấp TTS chất lượng cao sau — đã chốt

**Đầu ra:** `GDD.md`, `content-schema.json` mẫu, 1 SVG demo được duyệt.

---

## Phase 1 — Nền móng kỹ thuật (Ngày 3–6)

Tách `index.html` hiện tại thành các module rõ ràng, không đổi hành vi hiện
có, chỉ tổ chức lại để dễ mở rộng.

- [x] Content Loader: đọc JSON theo schema, validate dữ liệu
      (`js/content-loader.js`, 5 pack trong `content/packs/`)
- [x] Learning Engine: nâng cấp hệ `level`/`INTERVALS_MIN` có sẵn, thêm
      `response_time_ms`, phân loại đúng-nhanh / đúng-chậm / sai, đưa từ sai
      quay lại sớm hơn trong cùng phiên (`js/learning-engine.js`, hàng đợi
      phiên động qua `createSessionQueue`/`requeueAfterAnswer`)
- [x] Hàm chọn từ tiếp theo: ưu tiên từ đến hạn ôn + tỉ lệ sai cao, trộn
      từ mới, tránh lặp liên tiếp (`buildRound`, sắp theo `wrongRate`)
- [x] Progress Store: bọc localStorage với version dữ liệu (an toàn khi
      đổi cấu trúc sau này) (`js/progress-store.js`, giữ nguyên `STORE_KEY`
      cũ + migration v1→v2 tự động, đã kiểm chứng không mất dữ liệu cũ)
- [x] AudioProvider: lớp trừu tượng phát âm thanh (fallback Web Speech API)
      (`js/audio-provider.js`)

**Đầu ra:** engine chạy được, test bằng dữ liệu giả —
`tools/test-learning-engine.mjs` (21/21 test qua), và kiểm chứng bằng
trình duyệt thật (Playwright): tiến độ cũ (định dạng trước Phase 1) migrate
đúng, chơi hết 1 lượt học, từ trả lời sai xuất hiện lại trong cùng phiên,
tiến độ được lưu lại đúng định dạng mới.

---

## Phase 2 — Game lõi: Bắt thú Sở thú (Ngày 7–11)

- [x] Con vật xuất hiện, di chuyển trong màn hình sở thú (4 "làn" đi lại
      bằng CSS translateX + nhấp nhô, dùng ảnh AI thật của 10 con Sở thú
      đã vẽ ở Phase 0 — nội dung mục "Con vật" nay trỏ thẳng vào bộ ảnh này
      thay vì emoji)
- [x] Phát âm gọi tên qua AudioProvider (tự đọc khi vào câu + nút "Nghe lại")
- [x] Ghi nhận đúng/sai + response_time, đẩy vào Learning Engine (dùng lại
      nguyên `applyAnswer`/`classifyAnswer`/`requeueAfterAnswer` từ Phase 1,
      không viết logic học riêng cho mini-game này)
- [x] Con vật trả lời sai xuất hiện lại nhiều hơn (bấm nhầm chỉ nhắc nhẹ,
      cho bắt lại ngay — không mất lượt/không áp lực thời gian, đúng
      GDD mục 4; mỗi lần bấm sai vẫn được ghi nhận vào Learning Engine)
- [x] Độ khó tăng dần theo % đúng gần nhất (kế thừa nguyên `buildRound` ưu
      tiên tỉ lệ sai cao từ Phase 1 — không cần thêm cơ chế riêng)

**Đầu ra:** 1 mini-game chơi được đầu-cuối, kết nối đúng Learning Engine —
kiểm chứng bằng Playwright: bấm sai không mất lượt, bấm đúng ghi tiến độ +
chuyển câu, phiên chơi hoàn tất, màn ôn từ flashcard vẫn hoạt động đúng với
nội dung ảnh mới.

Ghi chú: mục "Con vật" trong màn ôn từ trước đây gồm cat/dog/fish/bird (chỉ
có emoji, không có ảnh) — nay đổi thành đúng 10 con Sở thú đã có ảnh AI, để
dùng chung 1 vốn từ cho cả 2 chế độ chơi (đúng nguyên tắc "kiến thức là lõi,
trò chơi là vỏ" trong GDD). Tiến độ đã lưu cho 4 từ cũ (cat/dog/fish/bird)
không bị xoá nhưng không còn dùng tới.

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
- Ảnh: AI-ảnh-ngoài (raster PNG) cho nhân vật con vật cần giống thật; SVG
  tự code chỉ cho icon/UI đơn giản (nút bấm, huy hiệu). Quy trình chi tiết
  ở `ANIMAL_ART_PIPELINE.md`
- localStorage dùng theo origin (`halinh812.github.io`), không phụ thuộc
  nội dung code — cập nhật code không làm mất tiến độ đã lưu của bé, miễn
  không đổi `STORE_KEY` hoặc cấu trúc dữ liệu mà không viết migration
