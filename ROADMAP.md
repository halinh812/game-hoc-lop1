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

      **Ảnh động (video lặp) — bắt đầu với con hổ:** thêm trường tuỳ chọn
      `answer.video` trong content pack (giữ `answer.image` làm ảnh
      "poster" hiển thị khi video chưa tải xong/không phát được); content
      loader gắn thêm `video` vào từ vựng; `.optiontile` hiển thị
      `<video autoplay loop muted playsinline poster="...">` thay cho
      `<img>` khi từ đó có `video`; con nào chưa có video vẫn dùng `<img>`
      như cũ (2 kiểu trộn lẫn tự nhiên trong cùng 1 lưới, không cần đổi gì
      thêm). Đã kiểm thử: `canPlayType('video/mp4; codecs="avc1..."')` rỗng
      trên Chromium headless của môi trường test (bản Chromium mã nguồn mở
      không có codec H.264 — hạn chế MÔI TRƯỜNG TEST, không phải lỗi trang
      web, vì mọi trình duyệt thật — Chrome/Safari/Edge/Firefox — đều hỗ
      trợ H.264 sẵn) nên không tự phát được trong Playwright ở đây; đã xác
      nhận thay vào đó: HTML render đúng thuộc tính, không có lỗi JS khi
      video không phát được, và ảnh "poster" (tiger.png) hiện đẹp thay thế
      — coi như suy giảm nhẹ nhàng (graceful degradation) nếu gặp trình
      duyệt hiếm không hỗ trợ.

      **Sửa kèm 1 lỗi phát sinh khi thêm video:** trước đó mỗi câu hỏi gọi
      lại `render()` dựng lại toàn bộ `innerHTML` của màn chơi — với `<img>`
      việc này vô hại (trình duyệt dùng cache tức thì), nhưng với `<video
      autoplay loop>` thì bị HUỶ và TẠO LẠI từ đầu mỗi câu, khiến video
      chạy lại từ giây 0 dù con đó không phải con vừa được hỏi. Đã sửa:
      `advanceForestRound()` giờ chỉ cập nhật DOM tại chỗ (đổi `innerHTML`
      của đúng 1 ô vừa trả lời, đổi chữ trong ribbon, đổi hàng sao, ẩn
      bong bóng phản hồi) thay vì gọi `render()` toàn màn — 3 ô còn lại
      (kể cả ô đang có `<video>`) giữ nguyên DOM, không bị chạy lại. Kiểm
      chứng bằng Playwright: đánh dấu node video bằng `data-testMarker`,
      chơi qua nhiều câu không liên quan đến ô đó, xác nhận node DOM và số
      lần tải file `.mp4` không đổi (đều = 1) trong suốt quá trình.

      Định hướng mở rộng tiếp (chưa làm): làm video cho 9 con còn lại theo
      đúng cách trên, ưu tiên "ảnh → video" (AI video từ chính ảnh tĩnh đã
      duyệt để giữ phong cách vẽ) hơn là tự vẽ sprite sheet nhiều khung hình
      (ANIMAL_ART_PIPELINE.md đã ghi nhận AI khó giữ nhất quán nhân vật qua
      nhiều khung liên tiếp).
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

## Công cụ quản trị nội dung — chạy LOCAL trên máy

Lý do: mỗi lần đổi ảnh/video cho 1 từ trước đây đều phải nhờ Claude sửa
code + git commit/push — tốn token cho việc lặp đi lặp lại, không tương
xứng với việc chỉ đơn giản là "đổi ảnh 1 con vật". Chuyển việc này thành
1 công cụ tự phục vụ (self-service) chạy trên máy người dùng, tách khỏi
2 trang của trẻ (Trang trò chơi) và không đụng vào code mỗi lần cần đổi
nội dung nữa.

- `package.json` (mới — trước đó dự án không cần Node vì là web tĩnh
  thuần) + `tools/admin-server.mjs`: server Express chạy local
  (`npm install` rồi `npm start`), phục vụ `/index.html` (trò chơi, y hệt
  bản deploy) kèm API `/api/*` để ghi file. Không deploy server này lên
  GitHub Pages vì Pages là static hosting, không có chỗ chạy backend.
- **Vị trí UI** (bản đầu tách hẳn 1 trang `/admin.html` riêng — đã bỏ):
  người dùng phản hồi không rõ vào đâu để dùng và muốn thao tác ngay
  trong Trang phụ huynh sẵn có thay vì nhớ thêm 1 địa chỉ riêng. Đã gộp
  hẳn vào `renderParent()` trong `js/app.js`: mở "Dành cho phụ huynh" từ
  màn hình chính, cuối trang tự thêm mục "🛠️ Thêm/sửa ảnh, video cho từ
  vựng" — chọn 1 trong 5 bộ từ → chọn 1 từ có sẵn để thay ảnh/video, hoặc
  "➕ Thêm từ mới" (tự gợi ý id từ chữ tiếng Anh, có thể sửa tay) → xem
  ảnh/video hiện có → tải ảnh/video mới lên → bấm Lưu. Không cần biết
  code/JSON, không cần nhớ URL riêng nào.
  Mục này **tự phát hiện** bằng cách gọi thử `/api/packs` khi vào Trang
  phụ huynh (`tryMountContentManager()`): gọi được (đang chạy qua
  `npm start`) thì mới hiện ra; gọi lỗi/404 (mở file tĩnh, hoặc bản deploy
  GitHub Pages công khai) thì im lặng bỏ qua, Trang phụ huynh hiện y hệt
  như trước giờ, không lỗi gì hiển thị cho người xem công khai — đã kiểm
  chứng bằng Playwright chạy qua server tĩnh thường (không có `/api/*`):
  mục quản trị không xuất hiện, không có `pageerror` nào.
  Sau khi lưu thành công, nạp lại content pack ngay (`loadContentPacks`)
  để nếu quay lại chơi trong CÙNG phiên, từ/ảnh/video vừa thêm đã có thể
  chơi được luôn — không cần tải lại trang (đã kiểm chứng: thêm video cho
  "zebra" qua Trang phụ huynh, quay lại "Thế giới động vật" ngay, thấy
  ô zebra hiện `<video>` mà không F5 lại trang).
- Xử lý tự động khi lưu (API `POST /api/items`):
  - Ảnh: `sharp` co vừa tối đa 900px chiều dài nhất (giữ tỉ lệ, không
    phóng to ảnh nhỏ), xuất PNG, lưu vào `assets/<bộ từ>/<id>.png`.
  - Video: `ffmpeg-static` (kèm sẵn binary ffmpeg, không cần cài riêng)
    nén về H.264/mp4 chuẩn (mọi trình duyệt đọc được), co chiều rộng tối
    đa 640px, bỏ audio (video trong game luôn `muted`) — thực tế giảm
    ~87% dung lượng (video mẫu con hổ: 3.97MB → 500KB) mà độ nét vẫn dư
    so với ô hiển thị chỉ ~150-250px trong game.
  - Nếu chỉ tải video mà chưa có ảnh riêng: tự trích khung hình đầu video
    (`ffmpeg -vframes 1`) làm ảnh "poster"/dự phòng — khỏi phải chuẩn bị
    2 file cho 1 từ.
  - Tự ghi thẳng vào đúng `content/packs/<bộ từ>-v1.json` (dò theo
    `category` bên trong file, không đoán tên file) — thêm mới nếu là từ
    mới, cập nhật đúng field nếu là từ có sẵn (giữ nguyên các field không
    đổi, ví dụ chỉ đổi video thì ảnh cũ không bị mất). Tự bỏ `emoji` khi
    từ đã có ảnh/video thật (game ưu tiên ảnh hơn emoji).
- Nút "🚀 Xuất bản" (API `POST /api/publish`): `git add` CHỈ trong phạm vi
  `content/` và `assets/` (không bao giờ `git add -A`, tránh cuốn theo
  thay đổi code dở dang khác) rồi `commit` + `push` — đẩy thẳng nội dung
  mới lên GitHub Pages công khai, không cần mở terminal/nhờ ai.
- Đã kiểm thử qua Playwright thao tác thật trong Trang phụ huynh (không
  chỉ gọi thẳng API): chọn từ có sẵn tự điền đúng dữ liệu, tải video qua ô
  chọn file thật rồi lưu thành công + xem trước video cập nhật ngay,
  thêm từ mới tự gợi ý id + lưu thành công + tự chọn lại đúng từ vừa
  thêm trong danh sách; cũng kiểm thử qua `curl` các trường hợp lỗi (id
  sai định dạng, thiếu bộ từ, từ chưa có ảnh/video/emoji nào) đều báo lỗi
  rõ ràng bằng tiếng Việt và KHÔNG ghi đè file khi có lỗi. Game
  (`index.html`) chạy qua server mới này vẫn hoạt động y hệt trước (đã
  chạy lại bộ kiểm thử luồng chơi 2x2 grid, kết quả không đổi).

## Đợt sửa "hình ảnh/giao diện chưa đẹp, chưa sinh động"

Phản hồi sau khi test bản đầy đủ: người dùng thấy game "rất dở". Tự vào
chơi và chụp lại từng màn hình mới xác định được đúng 4 chỗ cụ thể (không
chỉ "chưa đẹp" chung chung): (1) 7/8 ô ở Trang chủ là ổ khoá xám xịt
"Sắp ra mắt", nhìn như sản phẩm dở dang; (2) bấm đúng gần như không có gì
ăn mừng — chỉ viền xanh + 1 dòng chữ nhỏ; (3) phong cách hình ảnh không
đồng nhất — avatar hoạt hình dễ thương nhưng ảnh con vật trong game lại
là ảnh chụp thật, 2 phong cách chọi nhau; (4) nhiều khoảng trống chết
không trang trí gì ở cả Trang chủ lẫn "Thế giới động vật". Người dùng gửi
1 ảnh mẫu phong cách rừng cây/hồ nước hoạt hình dễ thương (con vật chibi
mắt to) muốn game theo đúng phong cách đó.

- **Đổi hẳn phong cách ảnh AI sang chibi** (`ANIMAL_ART_PIPELINE.md`):
  khung phong cách cũ "semi-realistic, dáng đi" đổi sang "chibi/hoạt hình
  dễ thương, mắt to long lanh, tô màu vector mềm" — khớp avatar SVG sẵn
  có. Viết lại prompt riêng cho cả 10 con Sở thú theo dáng đứng/ngồi đơn
  giản (không cần dáng đi nữa, vì xem mục tiếp theo). Đây là phần người
  dùng tự chạy qua công cụ AI ảnh bên ngoài rồi tải lên qua Trang phụ
  huynh — tôi không tự tạo được ảnh AI trong môi trường này.
- **Con vật không di chuyển, chỉ "lắc lư nhẹ nhàng" tại chỗ**: sau đúng 4
  vòng thử chuyển động (chạy tự do + núp bụi cây → dải ngang không chồng
  lấn → 4 hàng đi ngang → tĩnh hoàn toàn), người dùng xác nhận hướng cuối:
  đứng yên nhưng có 1 hiệu ứng nhẹ cho đỡ "chết" — implement bằng CSS xoay
  ±2.5° liên tục (`@keyframes tileSway`) trên `span.tileswing` bọc quanh
  ảnh/video (KHÔNG đặt animation thẳng lên ảnh/video, vì trạng thái
  `.correct` cần tự phóng to ảnh — 2 animation transform trên cùng 1 phần
  tử sẽ đè lên nhau; tách ra cha/con để cả 2 chạy độc lập, không xung
  đột), lệch delay 0/.4/.8/1.2s giữa 4 ô để không đồng bộ tăm tắp.
- **Ô "Sắp ra mắt" đổi từ ổ khoá xám sang linh vật đang ngủ** (hàm
  `sleepyMascot()`) — mặt tròn pastel nhắm mắt + chữ "z" bay lên, có nhịp
  thở nhẹ (`sleepyBreathe`), đỡ "chết"/dở dang hơn hẳn 7 ổ khoá xám xịt.
- **Hiệu ứng ăn mừng thật cho MỖI câu trả lời đúng** (trước chỉ có ở màn
  thắng cả ván): nảy bật ô (`tileCorrectBounce`), bắn 8 hạt màu từ chính
  ô vừa bấm rồi tự dọn sau 750ms (`celebrateTile()`, khác với confetti rơi
  từ trên ở màn thắng), kèm 1 tiếng chuông "ting" 2 nốt tự tổng hợp bằng
  Web Audio (`playDing()`, không cần file âm thanh). Chỉ áp dụng cho nhánh
  bấm ĐÚNG, không áp dụng khi bấm sai rồi hiện đáp án đúng (tránh gây hiểu
  lầm là được thưởng dù trả lời sai).
- **Làm giàu bối cảnh nền** (`worldBg()`): tán cây đổi từ 1 hình chữ nhật
  thân cây trơ trọi sang cụm tròn rậm rạp (nhiều hình tròn chồng nhau,
  giống ảnh mẫu khu rừng); thêm đá cuội + hoa nhỏ ven đường ở dải mặt đất.
  Vẫn giữ nguyên cấu trúc 2 dải cố định trên/dưới (`canopy-band`/
  `ground-band`, `overflow:hidden`) — bài học từ lỗi cũ (nền SVG tràn vào
  đè lên nội dung) vẫn áp dụng, không thêm chi tiết trang trí vào vùng
  giữa màn hình nơi chữ/nút hiển thị.
- **Cú mèo linh vật lấp khoảng trống** ở Trang chủ, phía dưới lưới trò
  chơi — trước là 1 mảng nền trống hoàn toàn, giờ có cú mèo bay nhẹ lên
  xuống (`mascotFloat`).
- Tất cả animation mới đều tôn trọng `prefers-reduced-motion: reduce`
  (tắt hết, khớp quy ước đã có từ trước).
- Đã kiểm thử bằng Playwright: xác nhận từng animation THỰC SỰ đang chạy
  (không chỉ khai báo CSS) bằng cách đọc `getComputedStyle(...).transform`
  2 lần cách nhau 700ms và so sánh khác nhau; xác nhận 8 hạt ăn mừng sinh
  ra rồi tự dọn sạch; chạy lại toàn bộ bộ kiểm thử luồng chơi 2x2 grid cũ
  (auto-advance, hiện đáp án 3 giây, chỉ đúng 1 ô đổi mỗi câu, thắng ở câu
  thứ 10) — không có gì bị hỏng bởi các thay đổi giao diện.

## Tự động xoá nền trắng khi upload ảnh qua Trang phụ huynh

Người dùng tự tạo lại bộ 10 con vật theo phong cách chibi mới (đúng bộ
prompt ở `ANIMAL_ART_PIPELINE.md`) và tải lên qua Trang phụ huynh — nhưng
phát hiện ảnh tuy đã là `.png` nhưng nền trắng chưa được xoá (trang quản
trị trước đó chỉ đổi định dạng + co nhỏ kích thước, chưa tách nền).

- `tools/admin-server.mjs`: `processImageBuffer()` giờ luôn chạy thêm
  bước tách nền sau khi resize — port thuật toán y hệt
  `tools/remove_white_bg.py` (vẫn giữ file Python đó làm công cụ chạy tay
  riêng) sang JavaScript/`sharp`: tô loang (flood fill BFS 4 hướng) từ
  đúng 4 góc ảnh, so màu với NGƯỠNG 26 so với màu gốc của chính góc đó
  (không phải ngưỡng cố định so với trắng tuyệt đối) — nên vẫn xoá đúng
  nền dù không phải trắng 100% (có nhiễu nén ảnh/AI), mà KHÔNG đục lỗ vào
  vùng trắng/nhạt NẰM BÊN TRONG con vật (bụng gấu trúc, mắt...) vì vùng đó
  không nối liền với góc ảnh. Làm mềm viền bằng cách blur riêng kênh
  alpha (không đụng màu RGB, tránh viền nhoè trắng quanh con vật).
- **Lỗi gặp phải khi viết (đáng lưu ý cho lần sau):** bước blur alpha ban
  đầu làm ảnh ra bị sọc ngang loang lổ — nguyên nhân là `sharp` âm thầm
  nâng ảnh xám 1 kênh lên sRGB 3 kênh ngay khi gọi `.blur()`, khiến buffer
  trả về dài gấp 3 dự kiến, làm lệch toàn bộ phép ghép ngược lại theo
  hàng. Nhìn code không thấy sai — chỉ phát hiện được bằng cách so sánh
  độ dài buffer trước/sau thực tế. Khắc phục: gọi thêm
  `.toColourspace('b-w')` trước `.raw()` để ép sharp giữ đúng 1 kênh.
- Đã kiểm thử: (1) ảnh dựng tay có 1 lỗ trắng nhỏ NẰM TRONG hình (mô
  phỏng đốm lông trắng) — xác nhận lỗ đó KHÔNG bị xoá còn nền 4 góc + mép
  giữa cạnh (không chỉ đúng góc) đều bị xoá sạch; (2) chạy lại đúng thuật
  toán này trên 3 ảnh chibi thật người dùng đã tải lên (gấu trúc, hươu
  cao cổ, cá sấu) — ghép thử lên nền xanh dương để mắt thường thấy rõ
  vùng trong suốt, xác nhận nền trắng mất hẳn, mắt/đốm sáng/bụng trắng
  bên trong con vật vẫn nguyên vẹn; (3) gọi thẳng API `/api/items` với 1
  ảnh test upload thật, đọc lại file `.png` ghi ra đĩa bằng PIL xác nhận
  kênh alpha ở góc = 0, ở giữa = 255.

## "Nhóm con" (subcategory) — để 1 trò chơi chỉ lấy đúng 1 phần của 1 bộ từ

Lý do: bộ từ "Con vật" giờ chỉ có 10 con hoang dã, nhưng người dùng sẽ
làm tiếp 10 con vật nuôi (dog/cat/hen/duck/pig/cow/buffalo/horse/goat/
rabbit — đã có ảnh cũ phong cách semi-realistic từ Phase 0, chưa đưa vào
content pack). "Thế giới động vật" (khu rừng) chỉ nên có động vật hoang
dã; trò sau (chưa làm) mới đến vật nuôi — cần cách tách 2 nhóm này ra
dù cùng nằm trong 1 category "animal", để không bị lẫn.

- **Schema** (`content-schema.json`, `content/packs/animals-v1.json`):
  thêm 2 field tuỳ chọn ở cấp item (ngang hàng `difficulty`, không phải
  bên trong `answer`): `subcategory` (mã, vd `wild`) và
  `subcategory_label_vi` (tên hiển thị, vd "Động vật hoang dã"). Tuỳ
  chọn — từ không gắn nhóm con vẫn hợp lệ như trước giờ (colors/numbers/
  family/fruits chưa dùng field này). Đã gắn `subcategory: "wild"` cho cả
  10 con hoang dã hiện có.
- **`js/content-loader.js`**: gắn thêm `subcategory`/`subcategoryLabel`
  vào từ đã "làm phẳng" (flatten).
- **`js/app.js`**: `wordsInCat(catId, subcategory)` nhận thêm tham số
  tuỳ chọn để lọc theo nhóm con; `startForestGame()` giờ gọi
  `wordsInCat('animal', 'wild')` thay vì `wordsInCat('animal')` — khi nào
  có trò vật nuôi, trò đó gọi `wordsInCat('animal', 'pet')` (hoặc mã nhóm
  con thật sự được tạo qua Trang phụ huynh) là xong, không đụng gì đến
  trò rừng.
- **Trang phụ huynh — UI 2 tầng chọn (Bộ từ → Nhóm con → Từ)**: thêm hẳn
  1 dropdown "Nhóm con" giữa "Bộ từ" và "Từ", hoạt động y hệt cách chọn
  Bộ từ/Từ đã quen thuộc — chọn 1 nhóm con có sẵn (kèm số lượng từ trong
  ngoặc, vd "Động vật hoang dã (10)"), chọn "— Chưa phân nhóm —" (cho từ
  chưa gắn nhóm con nào), hoặc "➕ Thêm nhóm mới" (gõ tên tiếng Việt, tự
  sinh mã nhóm hiển thị làm gợi ý, dùng đúng hàm `cmSlugify` sẵn có). Danh
  sách "Từ" bên dưới LUÔN chỉ hiện từ thuộc đúng nhóm con đang chọn — chủ
  đích thiết kế để tránh việc vừa lọc theo nhóm vừa cho sửa item tự do
  gây rối logic (đổi nhóm 1 từ có sẵn = vào đúng nhóm cũ của nó trước,
  sửa xong muốn chuyển nhóm khác thì chọn nhóm mới rồi lưu lại).
  Sau khi lưu, tự quay lại đúng nhóm con vừa lưu vào (không bị "nhảy" về
  nhóm mặc định).
- **`tools/admin-server.mjs`**: `GET /api/packs/:category/items` trả
  thêm `subcategory`/`subcategoryLabel`; `POST /api/items` nhận thêm
  `subcategory`/`subcategory_label_vi` — bỏ trống nghĩa là "giữ nguyên"
  (giống cách `text_en`/`text_vi`/`difficulty` đang xử lý, nhất quán với
  quy ước sẵn có) chứ không phải "xoá nhóm con đã gắn". Nếu chỉ gửi
  `subcategory` (id) mà không gửi label, tự dò trong các từ khác cùng
  bộ đang dùng đúng mã đó để lấy lại label, phòng khi client thiếu.
- **Sửa kèm 1 lỗi phát hiện trong lúc làm:** `cmSlugify()` (dùng để tự
  sinh mã từ tên tiếng Việt) làm mất hẳn chữ "đ/Đ" thay vì đổi thành "d"
  — do "đ" là 1 chữ cái riêng trong Unicode chứ không phải chữ La-tinh +
  dấu nên `.normalize('NFD')` không tách được (vd "Động vật nuôi" từng ra
  "ong_vat_nuoi" thay vì "dong_vat_nuoi"). Thêm bước thay "đ"→"d" thủ công
  trước khi chuẩn hoá dấu.
- **Sửa kèm 1 lỗi dữ liệu phát hiện trong lúc làm:** `tiger` trong
  `animals-v1.json` vẫn còn field `answer.video` trỏ tới
  `assets/animals/tiger.mp4` dù file đó đã bị xoá thủ công (không qua
  Trang phụ huynh) ở một thời điểm trước — tham chiếu chết, tự sửa bằng
  cách bỏ field `video` (game vẫn hoạt động bình thường lúc đó nhờ ảnh
  `poster` dự phòng của thẻ `<video>`, nhưng dữ liệu vẫn sai nên sửa lại
  cho đúng thực tế).
- Đã kiểm thử qua Playwright thao tác thật trong Trang phụ huynh: chọn
  "Con vật" tự hiện đúng "Động vật hoang dã (10)"; tạo nhóm con mới
  "Động vật nuôi", thêm 1 từ test vào đó, xác nhận nhóm mới xuất hiện
  đúng số lượng (1), quay lại nhóm "Động vật hoang dã" xác nhận từ mới
  KHÔNG lẫn vào (vẫn đúng 10); chơi thử "Thế giới động vật" tới lúc thắng
  (10 câu đúng) xác nhận từ test không bao giờ xuất hiện trong trò chơi.
  Dữ liệu test được dọn sạch trước khi merge — bản chính thức chỉ có lại
  đúng 10 con hoang dã như trước.

## Thêm 10 "Động vật nuôi" — ngộ nhận về ảnh có sẵn trong thư mục

Sau khi có tính năng nhóm con, người dùng thấy trong thư mục
`assets/animals/` trên GitHub có 20 file ảnh và tưởng rằng đã có sẵn 10
từ "Động vật nuôi" (dog/cat/hen/duck/pig/cow/buffalo/horse/goat/rabbit)
song song 10 con hoang dã. Thực tế: 10 file ảnh đó là **ảnh raster còn sót
lại từ Phase 0** (`ANIMAL_ART_PIPELINE.md` Bước 6 — nhóm "Thú nuôi gần
gũi" từng lên kế hoạch nhưng chưa từng làm) — có file ảnh trong thư mục
KHÔNG đồng nghĩa với có từ vựng; `content/packs/animals-v1.json` lúc đó
vẫn chỉ có đúng 10 mục (toàn bộ "wild"). Xác nhận trực tiếp bằng cách đọc
file JSON thật, không đoán.

Người dùng chọn phương án: nối tạm 10 ảnh cũ đó thành nhóm "Động vật
nuôi" ngay (ảnh phong cách tả thực cũ, không khớp phong cách chibi mới —
sẽ tự thay ảnh sau qua Trang phụ huynh khi có bản chibi, không cần đổi
id/tên).

- Thêm 10 mục vào `animals-v1.json`: dog/cat/hen/duck/pig/cow/buffalo/
  horse/goat/rabbit, mỗi mục trỏ đúng ảnh đã có sẵn
  (`assets/animals/<id>.png` — xác nhận cả 10 ảnh này đã có alpha trong
  suốt sẵn từ trước, không cần chạy lại bước xoá nền), gắn
  `subcategory: "pet"`, `subcategory_label_vi: "Động vật nuôi"`.
- Không đổi code — tính năng nhóm con ở đợt trước đã xử lý đúng ngay khi
  có đủ 2 nhóm thật trong dữ liệu.
- Đã kiểm thử: gọi API xác nhận đúng 20 mục (10 wild + 10 pet); Playwright
  thao tác thật trong Trang phụ huynh xác nhận dropdown "Nhóm con" hiện
  đúng "Động vật hoang dã (10)" mặc định + "Động vật nuôi (10)", đúng tên
  tiếng Việt cho cả 10 con nuôi; chơi thử "Thế giới động vật" toàn bộ 1
  ván (tới lúc thắng) xác nhận không con vật nuôi nào từng xuất hiện —
  trò rừng vẫn chỉ lấy đúng "wild" như thiết kế.

## Vòng 5 — Bỏ hẳn lưới ô vuông, hiện vị trí ngẫu nhiên không đè nhau

Yêu cầu mới: (1) bỏ lưới 2x2 ô vuông cố định, con vật hiện ở vị trí ngẫu
nhiên trên màn hình; (2) 2 con không bao giờ đè lên nhau; (3) bỏ hẳn dòng
chữ "🦁 Bắt con: X" — bé chỉ nghe âm thanh, không đọc chữ; (4) chỉ giữ
nút loa, chuyển xuống dưới cùng màn hình.

- **Không đè nhau bằng góc phần tư cố định, không phải thử-sai**: chia
  khu chơi (`#freeplayArea`) thành 4 góc phần tư cố định theo `data-idx`
  (0=trên-trái, 1=trên-phải, 2=dưới-trái, 3=dưới-phải) — 2 góc khác nhau
  không thể chồng lấn nên đảm bảo an toàn 100% mà không cần vòng lặp
  thử lại vị trí (rejection sampling, có nguy cơ bị "kẹt" nếu ô quá to).
  `forestPositionTile(tileEl, idx)` (js/app.js) đo kích thước thật của
  khu chơi + ô bằng `clientWidth`/`offsetWidth` (không tính bằng % cố
  định, để luôn đúng với màn hình thật), rồi random 1 vị trí TRONG đúng
  góc phần tư được gán — góc gán cho mỗi ô giữ NGUYÊN suốt ván, chỉ toạ
  độ cụ thể bên trong góc đổi mỗi khi ô đó đổi con, để con không "nhảy"
  sang góc khác gây khó theo dõi.
  Đổi `.optiongrid`/`.optiontile` (CSS grid) thành `.freeplay`/`.freetile`
  (`position:absolute`, toạ độ ghi thẳng bằng JS vào `style.left/top`).
  Giữ nguyên hiệu ứng lắc lư nhẹ (`.tileswing`), ăn mừng khi đúng
  (`.tileburst`, `tileCorrectBounce`) — chỉ đổi cách ĐỊNH VỊ ô, không đổi
  các hiệu ứng đã có.
- **Bỏ hẳn `<div class="ribbon">`** (dòng "Bắt con: X") — bé giờ hoàn
  toàn dựa vào âm thanh (`speakForestTarget()` đọc "Catch the X!"), không
  còn chữ nào gợi ý trước khi bấm. Bong bóng phản hồi SAU khi bấm
  (`feedbackBubble` — "Bắt được rồi! X" / "Chưa đúng. Đây là X") vẫn giữ
  nguyên vì đó là phản hồi sau khi trả lời, không phải gợi ý trước.
- **Nút loa chuyển xuống cuối `.content`** (dưới cả khu chơi lẫn bong
  bóng phản hồi) — trước đó nằm ngay dưới thanh trên cùng.
- Đã kiểm thử bằng Playwright: đo `getBoundingClientRect()` của cả 4 ô,
  xác nhận 0% chồng lấn giữa mọi cặp và cả 4 ô nằm trọn trong khu chơi;
  xác nhận không còn phần tử `.ribbon` và không còn chữ "Bắt con" ở đâu
  trên trang; xác nhận thứ tự phần tử trong `.content` đặt nút loa cuối
  cùng (dưới đáy màn hình); chơi thử toàn bộ 1 ván tới thắng (10 câu
  đúng) bằng cách "nghe" — chặn `SpeechSynthesisUtterance` để lấy đúng
  chữ đang được đọc làm căn cứ bấm, giống hệt cách bé thật sẽ chơi (không
  đọc chữ, chỉ dựa vào âm thanh) — xác nhận đến được màn "Giỏi quá!"; thử
  thêm nhánh bấm sai xác nhận ô bấm sai chuyển đỏ + ô đúng chuyển xanh,
  giữ nguyên 3 giây, sau đó chỉ đúng 1 ô đổi vị trí+con vật, 3 ô còn lại
  giữ nguyên như thiết kế xuyên suốt dự án.

## Vòng 6 — Bỏ khung ô vuông quanh con vật, nút loa to hơn

- **Bỏ hẳn khung ô vuông** (`background`/`border`/`box-shadow` của
  `.freetile`) — giờ chỉ còn đúng hình con vật, bấm thẳng vào ảnh (vùng
  bấm vẫn giữ nguyên kích thước ô cũ dù không còn thấy viền, nên vẫn dễ
  trúng hơn bấm đúng y hệt từng pixel không trong suốt của ảnh). Đúng/sai
  giờ báo bằng **quầng sáng màu ôm theo đúng viền trong suốt của ảnh**
  (`filter:drop-shadow(...)` 2 lớp thay vì `background-color`/
  `border-color` của 1 hình vuông) — tự nhiên hơn nhiều vì ảnh chibi nền
  trong suốt, quầng sáng sẽ ôm sát hình con vật chứ không tạo ra 1 khối
  chữ nhật giả xung quanh.
- **Nút loa to hơn** (46px → 68px, icon bên trong 18px → 26px) để bé dễ
  bấm hơn.
- Đã kiểm thử lại toàn bộ bộ Playwright của vòng trước (0% chồng lấn,
  không còn ribbon, thứ tự phần tử, chơi hết 1 ván tới thắng chỉ bằng
  "nghe", nhánh bấm sai giữ đúng 3 giây) — không có gì bị hỏng bởi thay
  đổi giao diện lần này; chụp ảnh xác nhận bằng mắt quầng sáng xanh/đỏ ôm
  đúng hình con vật, không còn khung vuông nào.

## Vòng 7 — Nền "khu rừng" bằng ảnh AI thay cho nền vẽ CSS/SVG

Người dùng dùng prompt tạo ảnh đã thống nhất trước (xem "Bước 7" trong
`ANIMAL_ART_PIPELINE.md`) để tự tạo 1 ảnh nền khu rừng bằng AI (mây,
mặt trời, núi, sông, cây cối, khoảng đất trống ở giữa dưới cho nhân vật
đứng lên trên) rồi gửi trực tiếp — thay hẳn cho nền trước đây vẽ bằng
CSS/SVG nhiều lớp chồng nhau (`.sun-glow` + `.cloud` + `.canopy-band` +
`.ground-band`, sinh ra trong hàm `worldBg()` của `js/app.js`).

- Ảnh lưu tại `assets/backgrounds/forest-bg.jpg` (768×1376, tỉ lệ dọc
  gần 9:16, khớp màn hình điện thoại), dùng chung cho **toàn bộ app**
  (mọi màn dùng `worldBg()`: onboarding, chọn trò chơi, Thế giới động
  vật, màn kết quả...) — không riêng cho 1 trò chơi, vì `.world-bg` vốn
  là nền chia sẻ của cả app, không phải nền riêng của Thế giới động vật.
  Trang phụ huynh (`.parentpage`) có nền riêng, không đụng tới.
- `.world-bg` (CSS) đổi từ `background:linear-gradient(...)` sang
  `background:#EFF3E3 url('assets/backgrounds/forest-bg.jpg')
  center/cover no-repeat` (màu nền `#EFF3E3` chỉ là dự phòng trong lúc
  ảnh đang tải).
- `worldBg()` (`js/app.js`) rút gọn chỉ còn trả về
  `<div class="world-bg" aria-hidden="true"></div>` — xoá hết phần sinh
  SVG mây/mặt trời/tán cây/mặt đất/cỏ lay động trước đây (đã "vẽ sẵn"
  trong ảnh, không cần code nữa). Dọn theo các CSS rule/keyframe không
  còn dùng tới (`.sun-glow`, `.cloud`, `.canopy-band`, `.ground-band`,
  `.blade`, `@keyframes sunpulse/driftx1/driftx2/sway`) và bỏ chúng khỏi
  danh sách `prefers-reduced-motion`.
- Ảnh nền này **không phải chỉnh sửa 1 ảnh có sẵn trong repo** (không
  đụng tới rule "hỏi trước khi sửa ảnh" trong `CLAUDE.md`) — là ảnh mới
  hoàn toàn do người dùng tự tạo và gửi để thêm vào.
- Đã kiểm thử: chạy lại 24 unit test (đều pass), khởi động server cục bộ
  và chụp ảnh 3 màn hình chính (onboarding, chọn trò chơi, Thế giới động
  vật) xác nhận ảnh nền hiển thị đúng full màn hình ở mọi nơi; chạy lại 2
  test Playwright của vòng trước (đúng/sai + chơi hết 1 ván) — vẫn pass,
  không có gì bị ảnh hưởng bởi việc đổi nền.

## Vòng 8 — Giới hạn lại ảnh nền chỉ trong màn chơi + đổi icon "Khu rừng kỳ bí"

Sau khi thử, người dùng phản hồi: chỉ muốn ảnh nền AI (Vòng 7) áp dụng
cho MÀN CHƠI thôi, còn màn chọn trò chơi (và các màn khác) giữ nguyên nền
vẽ bằng CSS/SVG cũ. Đồng thời đổi luôn icon của ô trò chơi này.

- **Thu hẹp phạm vi ảnh nền**: `worldBg()` (`js/app.js`) khôi phục lại
  toàn bộ phần vẽ SVG mây/mặt trời/tán cây/mặt đất như trước Vòng 7, giờ
  nhận thêm tham số `photo` — gọi `worldBg(true)` chỉ tại `renderForest()`
  (màn chơi) để dùng class `.world-bg.forestphoto` (nền ảnh), mọi màn khác
  (`loading`, `error`, onboarding, chọn trò chơi, màn kết quả) vẫn gọi
  `worldBg()` như cũ, dùng lại đúng nền gradient + SVG gốc. Khôi phục lại
  các CSS rule/keyframe đã xoá ở Vòng 7 (`.sun-glow`, `.cloud`,
  `.canopy-band`, `.ground-band`, `.blade`...) và danh sách
  `prefers-reduced-motion`.
- **Đổi tên trò chơi**: "Thế giới động vật" → **"Khu rừng kỳ bí"**
  (`GAMES` trong `js/app.js`).
- **Nền ô icon**: thay vì màu `--glass` phẳng, ô `.gametile.forest-tile`
  giờ dùng chính `assets/backgrounds/forest-bg.jpg` làm nền, nhưng
  **crop/zoom nhỏ lại** (`background-position:50% 56%; background-size:
  240%`) để chỉ thấy đúng đoạn sông uốn lượn + đồng cỏ + núi mờ phía xa ở
  giữa ảnh — không lấy nguyên khung ảnh gốc (sẽ làm chữ + icon rối/khó
  đọc trên diện tích nhỏ). Thêm 1 lớp phủ gradient tối dần ở đáy
  (`::before`) để chữ "Khu rừng kỳ bí" màu trắng luôn đọc rõ dù nền ảnh
  sáng/tối chỗ nào.
- **Icon mặt hổ thay cho emoji 🦁**: dùng lại đúng ảnh có sẵn
  `assets/animals/tiger.png` (KHÔNG tạo ảnh mới, KHÔNG sửa/ghi đè file
  ảnh này) — chỉ crop bằng CSS thuần (không chạy script xử lý ảnh nào,
  không đụng tới rule "hỏi trước khi sửa ảnh" trong `CLAUDE.md` vì ảnh
  gốc trên đĩa không hề bị động tới): 1 khung tròn 68px `overflow:hidden`
  (`.foresttile-face`), bên trong `<img>` được phóng to + dịch chuyển
  bằng % (`width/height:145.16%; left:-22.58%; top:-11.29%`) sao cho chỉ
  vùng đầu/mặt (đo được bằng bounding-box pixel thật của kênh alpha, quy
  đổi % để không phụ thuộc kích thước hiển thị) lấp đầy khung tròn, ẩn hết
  phần thân/đuôi. Áp dụng lại đúng animation `tileSway` (xoay ±2.5°, 2.6s)
  đã dùng cho con vật trong màn chơi để icon "lắc lư nhẹ" y hệt cảm giác
  quen thuộc.
- Đã kiểm thử: 24 unit test pass; chụp ảnh xác nhận màn onboarding + màn
  chọn trò chơi đã quay lại đúng nền cũ (không còn ảnh nền); icon ô "Khu
  rừng kỳ bí" hiện đúng nền sông/núi crop nhỏ + mặt hổ tròn rõ nét, đúng
  tâm (kiểm tra riêng bằng screenshot phần tử `.foresttile-face` khi tắt
  animation để soi crop tĩnh); màn chơi vẫn giữ nguyên ảnh nền full màn
  hình; chạy lại 2 test Playwright cũ (đúng/sai, chơi hết 1 ván) — vẫn
  pass, không ảnh hưởng gì.

## Vòng 9 — Bỏ khung tròn quanh icon con hổ, hiện cả con trong khung chữ nhật

Phản hồi sau Vòng 8: icon crop tròn zoom vào mặt hổ trông "khung ảnh đại
diện" hơn là 1 nhân vật thật; đổi sang hiện **nguyên cả con hổ** (đúng ảnh
gốc, không crop) trong khung hình chữ nhật, không còn viền tròn/nền
trắng/bóng đổ khung.

- `.foresttile-face` (`index.html`): bỏ hết `border-radius:50%`,
  `overflow:hidden`, `background:#fff`, `border`, `box-shadow` — chỉ còn
  1 khung `84×84px` chứa `<img>` `object-fit:contain` (giữ nguyên tỉ lệ
  ảnh gốc, không méo), có `filter:drop-shadow(...)` nhẹ đúng kiểu con vật
  trong màn chơi (không còn khung/hộp bao quanh, chỉ có ảnh + bóng đổ).
  Vẫn giữ animation `tileSway` (xoay ±2.5°) để lắc lư nhẹ như cũ.
- Bỏ toàn bộ phần crop-zoom-vào-mặt bằng % (`width:145.16%`,
  `left:-22.58%`, `top:-11.29%`...) của Vòng 8 — không còn cần thiết vì
  hiện nguyên cả ảnh chứ không crop 1 phần.
- Không đụng tới file ảnh `assets/animals/tiger.png` (đúng ảnh có sẵn,
  chỉ đổi cách hiển thị bằng CSS) — không vi phạm rule "hỏi trước khi sửa
  ảnh" trong `CLAUDE.md`.
- Đã kiểm thử: 24 unit test pass; chụp ảnh xác nhận icon giờ hiện nguyên
  con hổ (kể cả đuôi) trong khung chữ nhật của ô, không còn khung tròn;
  chạy lại test chơi hết 1 ván ở màn chơi — vẫn pass, không ảnh hưởng gì.

## Vòng 10 — Gói "Thêm/sửa từ vựng" vào bảng (modal) mở từ nút +

Trang phụ huynh trước đây hiện thẳng cả mục "Thêm/sửa ảnh, video cho từ
vựng" ở cuối trang, khiến trang dài và rối mắt (nhất là khi báo cáo học
tập có nhiều dòng). Đổi sang: mục này giờ ẩn sau 1 nút tròn "+" và chỉ mở
ra khi cần.

- **Nút +**: `header.insertAdjacentHTML(...)` chèn `<button class="cmFabBtn"
  id="cmOpenBtn">+</button>` vào `#pHeader` (thêm `id` này cho `.pheader`
  trong `renderParent()`) — chỉ hiện khi trang đang chạy qua server quản
  trị local (đúng cơ chế feature-detect cũ qua `tryMountContentManager()`,
  không đổi).
- **Bảng (modal)**: toàn bộ form giờ nằm trong `#cmOverlay` (lớp phủ mờ
  toàn màn hình, `position:fixed`) chứa `.cmModal` trượt lên từ đáy màn
  hình — bấm nút + để mở (`overlay.hidden = false`), bấm ✕ hoặc bấm ra
  ngoài vùng modal để đóng (`overlay.hidden = true`).
- **Bớt chú thích**: bỏ hẳn đoạn giải thích dài ở đầu form (về tự xoá nền
  trắng/tự nén video...) và rút ngắn tiêu đề còn "Thêm / sửa từ vựng".
- **Đổi tên nhãn**: "Nhóm con" → **"Nhóm từ"** (đúng yêu cầu, tránh nhầm
  với khái niệm khác) — chỉ đổi chữ hiển thị, id/logic phía sau
  (`cmSubcategory`, `cmRebuildSubcategorySelect()`...) giữ nguyên.
- **Bỏ hẳn "Độ khó"**: xoá `<select id="cmDifficulty">` khỏi giao diện —
  độ khó của từ giờ để trò chơi tự quyết định lúc chơi, người nhập không
  cần chọn. `cmSave()` không còn gửi field `difficulty` lên nữa; phía
  server (`tools/admin-server.mjs`) đã sẵn có fallback đúng ý: từ MỚI mặc
  định `difficulty=1`, từ đã có thì giữ nguyên giá trị cũ nếu không gửi gì
  — không cần sửa gì bên server.
- **Nút gọn/đẹp hơn**: "Lưu" + "Xuất bản" giờ xếp ngang hàng nhau
  (`.cmBtnRow{ display:flex; gap:10px; }`, mỗi nút `flex:1`), bo góc to
  hơn (12px), nút "Xuất bản" có thêm viền nhẹ để phân biệt rõ với nút
  "Lưu" (nút chính, nền xanh lá).
- Đã kiểm thử bằng Playwright: nút + hiện đúng, mở/đóng modal hoạt động
  (bấm nút hoặc bấm ra ngoài), không còn `#cmDifficulty` trong DOM, nhãn
  "Nhóm từ" hiển thị đúng, luồng "sửa từ có sẵn" (chọn "hổ" → tự điền
  Tiếng Anh/Việt + hiện đúng ảnh preview, ẩn ô Mã từ) hoạt động đúng như
  trước; chạy lại 24 unit test + test chơi hết 1 ván — đều pass, không có
  gì bị ảnh hưởng.

## Vòng 11 — Rút gọn tiêu đề + thêm bộ lọc "Bộ từ"/"Nhóm từ" cho bảng báo cáo

Trang báo cáo dài dần khi bé chơi nhiều từ. Bỏ dòng phụ đề không cần
thiết và thêm bộ lọc multi-select kiểu tick ô vuông để phụ huynh thu hẹp
bảng theo đúng bộ từ/nhóm từ muốn xem.

- Xoá dòng `"Bòng — LV0 (chưa học) đến LV10 (đã nhớ rất lâu)"` (`.psub`)
  khỏi header Trang phụ huynh — chỉ còn tiêu đề "Báo cáo học tập".
- **Bộ lọc mới** ngay dưới header: 2 nhóm chip dạng ô vuông tick —
  "Bộ từ" (theo `w.cat`/`w.catLabel`) và "Nhóm từ" (theo
  `w.subcategory`/`w.subcategoryLabel`, chỉ hiện nếu có ít nhất 1 từ đã
  gắn nhóm) — đếm số từ ngay trên chip. Bấm tick chọn/bỏ chọn nhiều ô
  cùng lúc trong 1 nhóm (`parentFilter.cats`/`parentFilter.subcats`, sống
  suốt phiên). Logic lọc (`parentApplyFilter()`): trong 1 nhóm là OR
  (chọn nhiều bộ/nhóm thì hiện từ thuộc BẤT KỲ bộ/nhóm nào đã tick), giữa
  2 nhóm là AND; không tick gì ở 1 nhóm = không lọc theo nhóm đó (mặc
  định hiện hết, không phải hiện rỗng).
- Tách bảng kết quả ra 1 hàm riêng `parentRenderTable()` chỉ cập nhật
  `#reportBody` — bấm tick chỉ vẽ lại đúng phần bảng, không dựng lại toàn
  bộ trang (không ảnh hưởng tới bảng "Thêm/sửa từ vựng" nếu đang mở).
- Đã kiểm thử bằng Playwright (gán sẵn tiến độ giả cho cả nhóm "Động vật
  hoang dã" và "Động vật nuôi" qua localStorage rồi tải lại trang để mô
  phỏng bé đã chơi nhiều từ): chip hiện đúng số đếm, tick "Động vật nuôi"
  lọc đúng còn 3 từ (dog/cat/hen), bỏ tick quay lại đủ 6 từ, không còn
  dòng phụ đề cũ; chạy lại 24 unit test + test chơi hết 1 ván + test sửa
  từ có sẵn trong bảng "+" — đều pass, không ảnh hưởng gì.

## Vòng 12 — Đổi bộ lọc báo cáo sang dạng dropdown (bấm mới hiện ô tick)

Vòng 11 hiện sẵn 2 hàng chip lúc nào cũng chiếm chỗ trên trang. Đổi sang
đúng kiểu dropdown: 2 nút "Bộ từ ▾" / "Nhóm từ ▾" gọn 1 dòng, bấm vào mới
xổ ra danh sách ô vuông tick bên trong.

- `parentFilterDropdown(group, title, list)` (`js/app.js`) dựng 1 nút
  `.filterddBtn` (nhãn + số lượng đang chọn dạng badge tròn nếu >0 + mũi
  tên ▾) và 1 `.filterddPanel` ẩn sẵn (`hidden`) chứa các ô `.filterchip`
  (đúng ô vuông tick đã có từ Vòng 11, chỉ đổi layout từ chip rời rạc
  sang từng dòng trong panel).
- Bấm nút → đóng hết panel khác đang mở rồi mở đúng panel này (chỉ 1
  dropdown mở tại 1 thời điểm); bấm ra ngoài `.filterdd` (bảng, tiêu đề,
  nút khác...) → tự đóng hết, xử lý qua 1 listener duy nhất gắn trên
  `document`, được gỡ ra rồi gắn lại mỗi lần `renderParent()` chạy để
  không cộng dồn listener qua nhiều lượt vào/ra Trang phụ huynh.
- Tick 1 ô **không đóng panel** (đúng hành vi dropdown multi-select quen
  thuộc — tick được nhiều ô liên tiếp mới đóng), đồng thời cập nhật ngay
  badge số lượng trên nút (`parentUpdateFilterBadge()`) mà không cần vẽ
  lại cả trang.
- Đã kiểm thử bằng Playwright: panel ẩn mặc định, bấm đúng nút "Nhóm từ"
  chỉ mở đúng panel đó, tick "Động vật nuôi" lọc đúng còn dog/cat/hen +
  badge hiện "1" + panel vẫn mở sau khi tick, bấm ra ngoài đóng hết panel,
  mở lại panel thấy đúng trạng thái tick cũ được giữ nguyên; chạy lại 24
  unit test + test chơi hết 1 ván + test sửa từ có sẵn trong bảng "+" —
  đều pass, không ảnh hưởng gì.

## Vòng 13 — "Sao" học tập trên màn chọn trò chơi

Thêm chỉ số động viên bé nhìn thấy ngay: tổng số "sao" đã đạt được, hiện
đối diện tên bé (góc phải) trên màn chọn trò chơi.

- **Công thức**: tổng LV của TẤT CẢ kỹ năng (Nghe/Nói/Đọc/Viết/Nhìn) của
  TẤT CẢ từ đã học — vd từ "tiger" có LV Nghe=1 + LV Đọc=1 → góp 2 sao.
  Cài đặt thành `totalStars(wordsMap)` trong `js/learning-engine.js`
  (cùng nhóm với `wrongRate()` — hàm thuần tuý tính trên dữ liệu
  progress, có unit test riêng trong `tools/test-learning-engine.mjs`).
  Khác với `buildRound()`/`wrongRate()` vốn luôn xét đúng 1 kỹ năng của 1
  trò chơi, `totalStars()` cộng dồn cả 5 kỹ năng của mọi từ — đúng ý
  "tổng LV" người dùng mô tả, không giới hạn theo trò chơi nào.
- **Giao diện**: `renderHome()` (`js/app.js`) thêm `.starsbadge` (icon
  ngôi sao 5 cánh vàng — dùng lại `starIcon('#FFD25A', ...)` đã có sẵn từ
  màn "Khu rừng kỳ bí"/màn kết quả, không tạo icon mới + số) vào
  `.profilebar`, đẩy sang phải bằng `margin-left:auto` trong hàng flex
  (đối diện tên bé, không cần thêm cấu trúc mới).
- Đã kiểm thử: unit test `totalStars` (tiger LV Nghe=1+Đọc=1, lion LV
  Nghe=2 → đúng 4 sao; rỗng/null → 0) trong bộ 25 unit test (đều pass);
  chụp ảnh Playwright xác nhận huy hiệu hiện đúng số 0 lúc chưa học gì và
  đúng số 4 sau khi gán tiến độ giả qua localStorage rồi tải lại trang;
  chạy lại test chơi hết 1 ván ở "Khu rừng kỳ bí" — vẫn pass.

## Vòng 14 — Bỏ hẳn chữ phản hồi đúng/sai, âm thanh ăn mừng rõ/hay hơn

Mục tiêu: bé chỉ tập trung vào tai nghe (kỹ năng "Nghe" đúng như thiết kế
gốc của "Khu rừng kỳ bí"), không còn chữ tiếng Anh nào hiện lên màn hình
sau mỗi lượt trả lời để "gà bài".

- **Bỏ hẳn bong bóng chữ phản hồi**: xoá `#feedbackBubble`/`#feedbackText`
  khỏi `renderForest()` — trước đây hiện `"Bắt được rồi! 🎉 tiger"` (đúng)
  hoặc `"Chưa đúng. Đây là tiger"` (sai), để lộ chữ tiếng Anh ngay trên
  màn hình. Dọn theo các chỗ set nội dung/ẩn hiện bong bóng này trong
  `handleForestAnswer()` và `advanceForestRound()`. Phản hồi đúng/sai giờ
  chỉ còn quầng sáng xanh/đỏ quanh con vật (đã có từ Vòng 6) + giọng đọc
  audio tên con vật (`speak()` — đây là ÂM THANH, không phải chữ hiện
  trên màn, vẫn giữ nguyên vì đúng là kênh "Nghe" bài học muốn luyện).
- **Âm thanh ăn mừng rõ/hay hơn**: `playDing()` (`js/app.js`) đổi từ 2 nốt
  sine đơn điệu (880Hz→1318.5Hz) sang **chuỗi hợp âm đi lên C5-E5-G5-C6**
  — mỗi nốt có 2 lớp: 1 dao động "thân" (triangle, nhiều bội âm hơn sine
  trơn nên nghe đầy/rõ hơn) + 1 dao động "lấp lánh" nhỏ (sine cao hơn 1
  quãng 8, âm lượng thấp) chồng lên, tạo hiệu ứng "ăn điểm" sáng và vui
  tai hơn hẳn 2 tiếng "tút" phẳng trước đây. Tổng thời lượng vẫn ngắn
  gọn (~0.55s), không làm chậm nhịp chơi.
- Đã kiểm thử bằng Playwright: xác nhận `#feedbackBubble` không còn tồn
  tại trong DOM ở cả nhánh đúng và sai, chụp ảnh xác nhận màn hình sạch
  chữ (chỉ còn quầng sáng), dựng thử đúng sơ đồ node Web Audio mới của
  `playDing()` không lỗi; chạy lại 25 unit test + test chơi hết 1 ván —
  đều pass, không ảnh hưởng gì tới phần còn lại.

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
