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

**Mô hình Learning Engine hiện tại (v3, chốt ở Phase 3):** 1 từ không chỉ có
"biết hay chưa" — nó có **5 kỹ năng độc lập**: Nghe / Nói / Đọc / Viết / Nhìn,
mỗi kỹ năng tự chạy 1 hệ ngắt quãng riêng (LV0-10 riêng, ngày đến hạn ôn
riêng). Mỗi mini-game khai báo rõ nó luyện ĐÚNG 1 kỹ năng nào và chỉ được
cập nhật LV của kỹ năng đó — không đụng tới 4 kỹ năng còn lại của từ đó.
Mốc thời gian ôn (Anki, giãn gấp đôi dần đều, không chậm lại ở cuối):

| LV | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|--|--|--|--|--|--|--|--|--|--|--|--|
| Ôn lại sau | ngay | 1p | 10p | 1n | 2n | 4n | 7n | 14n | 30n | 60n | 120n |

(Lịch sử: v1 — 1 LV chung/từ, LV0-5, dùng ở bản demo đầu tiên. v2 — thêm
`response_time_ms`, hàng đợi phiên động, chốt ở Phase 1. v3 — tách 5 kỹ năng
độc lập theo yêu cầu, chốt ở Phase 3, xem `js/learning-engine.js`.)

## Trạng thái các Phase

- [x] Phase 0 — Định hướng & Thiết kế nền tảng (Ngày 1–2)
- [x] Phase 1 — Nền móng kỹ thuật (Ngày 3–6)
- [x] Phase 2 — Game lõi: Bắt thú Sở thú (Ngày 7–11)
- [x] Phase 3 — Giao diện & cảm giác AAA (Ngày 12–15) — phạm vi đổi hướng
      giữa chừng theo yêu cầu, xem chi tiết bên dưới
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

**Đổi hướng giữa chừng theo yêu cầu trực tiếp:** thay vì chỉ "làm đẹp" các
màn cũ, toàn bộ kiến trúc thông tin (IA) của app được thiết kế lại thành
**đúng 3 trang, thuần cảm giác trò chơi cho trẻ em** — không hiển thị số
liệu học tập (số từ đã thuộc, %...) ở bất kỳ đâu trẻ nhìn thấy. Việc này kéo
theo nâng cấp Learning Engine lên v3 (5 kỹ năng độc lập, xem trên) vì mỗi
mini-game giờ phải khai báo rõ nó luyện kỹ năng nào.

- [x] Thiết kế hướng hình ảnh trước bằng mockup (Artifact), duyệt hướng
      "thế giới trò chơi minh hoạ" (bầu trời/rừng sống động) trước khi code
      vào app thật — tránh lặp lại bài học "vẽ mù không có vòng lặp nhìn-
      chỉnh" ở Phase 0
- [x] **Trang 1 — Hồ sơ & chọn trò chơi:** nhập tên bé + chọn 1 trong 20
      avatar "ngộ nghĩnh" tự vẽ SVG (`js/avatars.js` — phong cách mascot
      đơn giản, không tả thực, đúng sở trường SVG tự vẽ); màn Home sau đó
      chỉ có lời chào + lưới 8 ô trò chơi (2 cột x 4 dòng, 1 ô chạy được
      "Thế giới động vật", 7 ô còn lại "Sắp ra mắt")
- [x] **Trang 2 — Thế giới động vật** (đổi tên từ "Bắt thú Sở thú", bối
      cảnh đổi từ sở thú sang khu rừng): quản trò đọc câu tiếng Anh động
      "Catch the {tên con vật}!" qua AudioProvider, bắt đúng tổng cộng 10
      lần (đếm dồn) thì thắng — mỗi lần trả lời chỉ cập nhật LV kỹ năng
      **Nghe** của từ đó. Kích thước từng con theo đúng tỉ lệ thật ngoài
      đời (voi to nhất, hươu cao cổ ảnh dọc rất cao, cá sấu ảnh ngang rất
      dẹt, khỉ nhỏ nhất) thay vì dùng chung 1 cỡ.

      Cách chơi + hiển thị đã qua 4 vòng chỉnh theo phản hồi thật, chốt
      lại ở dạng đơn giản/cổ điển nhất:
      1. Thử "chạy tự do 2D" (đường mòn vòng kín bất kỳ) + bụi cây che
         khuất tạo hiệu ứng núp/thò ra.
      2. Đổi sang mỗi con 1 "dải ngang" riêng (không chạm nhau, đo bằng
         bounding box thật, xác nhận 0% chồng lấn ở nhiều kích thước màn
         hình) — nhưng nhìn vẫn rối, không đẹp hơn.
      3. Đổi sang 4 hàng cố định xếp dọc, mỗi hàng 1 con đi ngang qua lại.
      4. **Chốt cuối cùng — kiểu cổ điển:** bỏ hẳn chuyển động đi lại, thay
         bằng **lưới 2x2 ô ảnh tĩnh** (`.optiontile`, CSS `object-fit:contain`
         để ảnh to vừa khít ô mà vẫn giữ đúng tỉ lệ khung hình gốc của từng
         con — không cần tính px riêng theo loài như các bản trước).

      Cơ chế câu hỏi (giữ nguyên từ vòng 3, chỉ đổi phần hiển thị): **4 ô
      cố định xuyên suốt ván chơi** (`state.slots`), không phải rút ngẫu
      nhiên 4 con mới mỗi câu — mỗi câu chỉ hỏi về 1 trong 4 con đang
      hiện, **bấm đúng thì tự động chuyển sang câu khác ngay (không cần
      nút "Tiếp theo")**, **bấm sai thì ô vừa bấm chuyển đỏ, ô đáp án
      đúng chuyển xanh, giữ nguyên 3 giây** cho bé nhìn thấy đáp án rồi
      mới tự chuyển. Dù đúng hay sai, **chỉ đúng 1 ô (con vừa được hỏi)
      bị đổi sang con khác — 3 ô còn lại giữ nguyên** — kiểm chứng bằng
      Playwright: so sánh toàn bộ 4 ô trước/sau mỗi câu ở cả nhánh đúng
      và nhánh sai, xác nhận đúng 3/4 không đổi trong mọi trường hợp.

      Định hướng mở rộng sau này (chưa làm): khi có ảnh động cho từng con
      (quay/tạo video ngắn lặp từ chính ảnh AI đã duyệt, hoặc GIF), chỉ
      cần đổi `<img>` trong `.optiontile` thành `<video autoplay loop muted
      playsinline>` hoặc trỏ `src` sang file `.gif`/`.webp` động — không
      cần đổi lại HTML/CSS layout hay logic chọn đáp án, vì đó là cơ chế
      hoàn toàn tách biệt (hiển thị) khỏi cách chấm điểm.
- [x] **Trang 3 — Trang phụ huynh:** giao diện cố tình KHÁC hẳn 2 trang kia
      (sạch, kiểu báo cáo, không phải thế giới game) — bảng LV theo từng
      kỹ năng (Nghe/Nói/Đọc/Viết/Nhìn) cho mỗi từ bé đã chơi
- [x] Game feel: hiệu ứng nảy khi bắt đúng, hạt confetti (lúc bắt đúng và
      màn tổng kết), sao thu thập hiện dần trong lúc chơi — không SFX riêng
      (dùng giọng đọc AudioProvider làm phản hồi âm thanh chính)
- [x] Mascot cú vẽ lại to hơn, biểu cảm hơn (mắt to có điểm sáng, má hồng,
      vẫy cánh) — chưa làm nhiều biểu cảm khác nhau theo ngữ cảnh (để Phase
      sau nếu cần)
- [x] Không dùng khái niệm game-over/thua — bấm sai chỉ nhắc nhẹ, cho thử
      lại ngay

**Đầu ra:** kiểm chứng bằng Playwright + chụp ảnh màn hình từng bước
(onboarding → chọn trò → chơi thắng → xem báo cáo phụ huynh), bao gồm cả
trường hợp bấm sai liên tục ở mọi câu để đảm bảo không kẹt/crash.

Ghi chú — phạm vi tạm gác lại: trò "Học từ" (thẻ ghi nhớ nghe+chọn chữ) và
cách duyệt theo chủ đề (chip màu sắc/số đếm/trái cây/gia đình) đã bị ẩn khỏi
luồng chơi chính vì không rõ tính vào kỹ năng nào theo luật mới (1 trò = 1
kỹ năng). Code không bị xoá — vẫn còn nguyên trong lịch sử git (nhánh
`claude/phase2-zoo-catch` và các commit trước) để tham khảo/khôi phục khi
thiết kế lại. Dark mode cũng tạm không áp dụng cho 2 trang thế giới game
(cố tình 1 phong cách "ban ngày" duy nhất, giống phần lớn app trẻ em); trang
phụ huynh vẫn dùng nền sáng trung tính, đọc tốt trong mọi điều kiện.

---

## Phase 4 — Hệ thống biên soạn nội dung + Game #2 (Ngày 16–18)

- [ ] Template JSON mẫu + script kiểm tra hợp lệ
- [ ] Tài liệu "Cách thêm 1 từ vựng mới"
- [ ] Mini-game thứ 2 (Nghe & chọn tranh / ghép cặp) để kiểm chứng kiến
      trúc plugin — **phải chốt rõ nó luyện kỹ năng nào trong 5 kỹ năng**
      (Nghe/Nói/Đọc/Viết/Nhìn) trước khi code, theo luật đặt ra ở Phase 3
- [ ] Cân nhắc thêm ô game "Học từ"/"Ghép chủ đề" đã tạm ẩn ở Phase 3, một
      khi đã chốt được nó tính vào kỹ năng nào

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
  / thu âm giọng thật (thương mại, chưa làm ngay). Đã cải thiện trong giới
  hạn Web Speech API miễn phí (`js/audio-provider.js`): tự chọn giọng
  tiếng Anh tốt nhất trong số giọng có sẵn trên máy thay vì để trình duyệt
  tự chọn, chỉnh tốc độ/cao độ tự nhiên hơn. Giới hạn thật: chất lượng
  giọng phụ thuộc thiết bị/trình duyệt của người dùng (ngoài tầm code) —
  nếu vẫn chưa đủ tự nhiên và cần nhất quán trên mọi máy, bước tiếp theo
  là giọng trả phí (ước tính chi phí + chọn nhà cung cấp khi cần)
- Ảnh: AI-ảnh-ngoài (raster PNG) cho nhân vật con vật cần giống thật; SVG
  tự code chỉ cho icon/UI đơn giản (nút bấm, huy hiệu). Quy trình chi tiết
  ở `ANIMAL_ART_PIPELINE.md`
- localStorage dùng theo origin (`halinh812.github.io`), không phụ thuộc
  nội dung code — cập nhật code không làm mất tiến độ đã lưu của bé, miễn
  không đổi `STORE_KEY` hoặc cấu trúc dữ liệu mà không viết migration
- Luật bắt buộc từ Phase 3: **1 mini-game chỉ được luyện đúng 1 trong 5 kỹ
  năng** (Nghe/Nói/Đọc/Viết/Nhìn) và chỉ cập nhật LV của kỹ năng đó. Khi
  thiết kế game mới, chốt kỹ năng trước khi code, không để 1 game trộn
  nhiều kỹ năng (khó tính điểm rõ ràng cho phụ huynh xem)
- Không hiển thị số liệu học tập (số từ đã thuộc, %...) ở màn hình trẻ nhìn
  thấy (Trang 1, Trang 2) — số liệu chỉ nằm ở Trang phụ huynh
- Dữ liệu tiến độ trước Phase 3 (`STORE_KEY` phiên bản v1/v2, hệ 1 LV chung
  mỗi từ) đã bị xoá sạch có chủ đích khi nâng lên v3 (5 kỹ năng) — quyết
  định của người phát triển vì lúc đó chỉ là dữ liệu tự test, chưa có bé
  thật nào chơi. Từ v3 trở đi, mọi thay đổi cấu trúc tiếp theo bắt buộc
  phải viết migration để không lặp lại việc mất dữ liệu.
