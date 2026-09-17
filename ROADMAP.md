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

## Vòng 15 — Tái cấu trúc thư mục: tách "engine" dùng chung khỏi "games" riêng từng game

Chuẩn bị cho việc mở rộng lên hàng chục/hàng trăm game: `js/app.js` trước
đó đã lên tới **1096 dòng** dù mới có đúng 1 game, trộn lẫn code dùng
chung (icon, mascot, router, trang phụ huynh, bảng admin) với code CHỈ
riêng "Khu rừng kỳ bí" — càng thêm game mới càng khó tra cứu/sửa đúng
chỗ. Tái cấu trúc lại theo đúng tinh thần đã ghi ở "Kiến trúc tổng thể"
đầu file này (Content Packs → Learning Engine → Mini-game Engine →
Progress Store, mini-game là plugin) nhưng trước giờ code chưa theo kịp.

**Cấu trúc thư mục mới:**
```
app.js                       ← khung/router dùng chung (chuyển ra khỏi js/)
engine/                      ← dùng chung cho MỌI game, không lặp lại
  content-loader.js, learning-engine.js, progress-store.js,
  audio-provider.js, avatars.js, ui-shared.js (icon/mascot/worldBg — mới)
games/
  khu-rung-ky-bi/
    forest.js                ← toàn bộ logic riêng của game này
    forest.css                ← style riêng (tách khỏi <style> khổng lồ)
content/packs/, assets/      ← KHÔNG đổi — tổ chức theo CHỦ ĐỀ (animals,
                                colors...), không theo game, vì 1 bộ từ
                                dùng lại được cho nhiều game khác nhau
```

- **Quy ước đặt tên**: dùng slug ổn định (`khu-rung-ky-bi`), KHÔNG đánh số
  thứ tự vào tên folder (kiểu `001_...`) — thứ tự hiển thị trong lưới chọn
  trò chơi nằm ở 1 chỗ duy nhất trong code (mảng `GAMES` trong `app.js`),
  đổi thứ tự/thêm/xoá game sau này không phải đổi tên folder nào cả.
- **Ranh giới "chung" vs "riêng game"**: quy tắc chọn — cái gì mọi game
  tương lai đều cần lại (icon SVG, mascot, nền "thế giới" mặc định, đọc
  nội dung, tính điểm/LV, lưu tiến độ) thì vào `engine/`; cái gì chỉ nghĩa
  lý khi đúng trong bối cảnh "Khu rừng kỳ bí" (`.freetile`, `.tileswing`,
  màn kết quả bắt đủ 10 con...) thì vào `games/khu-rung-ky-bi/`. Icon ô
  chọn game của Khu rừng kỳ bí (`.gametile.forest-tile`) và markup của nó
  cũng chuyển hẳn vào `forest.js`/`forest.css` — `app.js` chỉ biết "id
  'forest' ứng với module nào", không biết chi tiết icon trông ra sao.
- **Cách app.js gắn 1 game vào router** (tránh import vòng — game không tự
  import ngược lại app.js để lấy state/store): `forest.js` export 1 hàm
  factory `createForestGame(ctx)`, `app.js` gọi đúng 1 lần lúc khởi động,
  truyền vào đúng những gì game cần — `state` dùng chung (cùng 1 object,
  mutate tại chỗ nên không cần getter), `getStore()`/`getWords()` (hàm
  getter, KHÔNG truyền thẳng giá trị, vì `store`/`WORDS` bị **gán lại**
  lúc tải xong nội dung/lúc phụ huynh thêm từ mới qua bảng "+" — truyền
  thẳng lúc tạo sẽ đọc phải giá trị cũ), `speak()`, `render()`,
  `owlMascot`. Factory trả về đúng những hàm app.js cần gọi từ ngoài:
  `startForestGame`, `renderForest`, `renderForestSummary`,
  `gameTileHtml`. Mẫu này lặp lại y hệt cho game tiếp theo.
- **Bẫy cần nhớ khi tách CSS ra file riêng**: `url()` ảnh trong 1 file
  `.css` external tính từ đường dẫn của CHÍNH FILE CSS ĐÓ, không phải từ
  `index.html` — khác hẳn với JS (`fetch()`/`src=""` trong JS luôn tính
  từ URL trang, không phải URL module). Nên `forest.css` (nằm ở
  `games/khu-rung-ky-bi/`) phải viết `url('../../assets/backgrounds/
  forest-bg.jpg')` chứ không phải `url('assets/backgrounds/...')` như
  lúc còn nằm trong `index.html` — nếu quên bước này ảnh nền sẽ vỡ âm
  thầm (không lỗi console, computed style vẫn ra URL nhưng ảnh không
  load), rất dễ bỏ sót nếu không kiểm tra bằng ảnh chụp thật.
- `wordsInCat(words, catId, subcategory)` chuyển từ `app.js` sang
  `engine/content-loader.js`, đổi chữ ký nhận thẳng `words` làm tham số
  (thay vì đọc biến module `WORDS`) — vì đây là hàm lọc nội dung dùng
  chung, không thuộc riêng 1 game, và nếu đọc biến module cũ sẽ tạo phụ
  thuộc ngược vào `app.js`.
- Dọn theo: xoá `el()` (hàm helper không còn nơi nào gọi tới) và
  `.glasscard` (CSS không còn dùng từ khi bỏ bong bóng chữ phản hồi ở
  Vòng 14).
- Đã kiểm thử: 25 unit test pass; kiểm tra trực tiếp `http.get` từng file
  mới (app.js, engine/*, games/khu-rung-ky-bi/*) đều trả 200; Playwright
  full-regression toàn bộ luồng (onboarding → trang chủ + huy hiệu sao →
  vào Khu rừng kỳ bí → trả lời sai (đúng quầng đỏ) → chơi hết ván (đúng
  10 vòng, tới màn thắng) → về trang chủ (huy hiệu sao cập nhật đúng) →
  Trang phụ huynh (đúng danh sách từ đã học, bộ lọc, bảng "+" mở/sửa từ
  hoạt động) — không có lỗi console nào ngoài network-noise vô hại đã
  thấy lặp lại xuyên suốt phiên làm việc; xác nhận riêng ảnh nền
  `forest-bg.jpg` (cả ở icon ô chọn game lẫn trong màn chơi) load đúng
  URL tuyệt đối, không bị vỡ đường dẫn sau khi chuyển CSS ra file riêng.

## Vòng 16 — Game #2 "Nông trại của bé" + tách CSS cơ chế chơi dùng chung

Game thứ 2 sau Khu rừng kỳ bí, cùng cơ chế "nghe tên tiếng Anh, bấm đúng
con vật" y hệt — dùng đúng khuôn `games/<slug>/` đã dựng ở Vòng 15. Vốn
từ là 10 "Động vật nuôi" (`subcategory: "pet"`) **đã có sẵn** trong
`content/packs/animals-v1.json` từ trước (không cần thêm dữ liệu) —
`wordsInCat(WORDS, 'animal', 'pet')`.

- `games/nong-trai-cua-be/farm.js` — bản sao có điều chỉnh của
  `forest.js` (đổi `wild`→`pet`, tiger→dog, `forestphoto`→`farmphoto`,
  `forest-tile`→`farm-tile`...), cùng factory `createFarmGame(ctx)` gọi
  từ `app.js` y hệt cách gắn `forestGame`. `state` dùng chung thêm
  `farmPool` (song song `forestPool`) — các field còn lại (`slots`,
  `targetIdx`, `correct`, `answered`, `cardShownAt`) TÁI SỬ DỤNG đúng
  field cũ vì chỉ 1 game chạy tại 1 thời điểm và mỗi game tự reset đủ
  trước khi bắt đầu ván, không cần tách riêng theo game.
- **Tách CSS cơ chế chơi dùng chung** (`engine/catch-game.css`, file
  mới): tới lúc có 2 game dùng chung y hệt `.freeplay`/`.freetile`/
  `.tileswing`/`.starsrow`/`.soundbtn`/`.tileburst`/màn kết quả
  (`.summary-mid`/`.starburst`/`.fall`...), giữ nguyên trong
  `forest.css` sẽ buộc `farm.css` phải chép lại y hệt (2 bản dễ lệch
  nhau dần) — trích ra 1 file dùng chung, nạp 1 lần trong `index.html`.
  `forest.css`/`farm.css` giờ chỉ còn phần THẬT SỰ riêng của từng game:
  ảnh nền + icon ô chọn game (`.world-bg.xxxphoto`, `.gametile.xxx-tile`,
  `.xxxtile-face`). Phần logic JS (pickTargetIndex/renderXxx/
  handleXxxAnswer...) CHƯA trích chung — để riêng từng file cho dễ đọc,
  chỉ nên trích khi có game thứ 3 dùng đúng cơ chế này (ghi lại thành
  comment trong `farm.js` để nhớ).
- Icon ô "Nông trại của bé" ở Trang chủ: nền crop nhỏ của
  `assets/backgrounds/farm-bg.jpg` (`.gametile.farm-tile`, vị trí crop
  tạm để `50% 56%/240%` giống Khu rừng kỳ bí, sẽ cần tinh chỉnh lại khi
  có ảnh thật) + cả con chó (`assets/animals/dog.png`, có sẵn, không cần
  ảnh mới) lắc lư nhẹ — đúng khuôn mẫu Vòng 9.
- **Ảnh nền `farm-bg.jpg` CHƯA có** lúc code — người dùng sẽ tự tạo bằng
  prompt ở "Bước 9" (`ANIMAL_ART_PIPELINE.md`) rồi thêm vào
  `assets/backgrounds/farm-bg.jpg` sau, báo lại để tinh chỉnh vị trí
  crop. Trong lúc chưa có ảnh: `.world-bg.farmphoto`/`.gametile.farm-tile`
  hiện màu nền be nhạt dự phòng (`#F3ECD4`/`#EDE0BE`), không lỗi console,
  không vỡ trang — đã kiểm chứng bằng Playwright (404 đúng như dự kiến
  khi gọi thẳng `assets/backgrounds/farm-bg.jpg`, trang vẫn chạy đủ 1 ván
  bình thường).
- Đã kiểm thử: 25 unit test pass; Playwright full-regression cả 2 game
  trong cùng 1 phiên (Khu rừng kỳ bí vẫn đúng ảnh nền sau khi tách CSS —
  không bị ảnh hưởng bởi việc thêm game 2; Nông trại của bé hiện đúng 4
  trong 10 con vật nuôi, chơi hết ván 10 câu, tới màn thắng, huy hiệu sao
  cộng dồn đúng; Trang phụ huynh liệt kê đủ 10 con vật nuôi đã học); ảnh
  chụp toàn trang có lúc "thiếu" ảnh do đúng lỗi thời điểm chụp đã gặp ở
  Vòng 9 (không phải lỗi thật — xác nhận lại bằng chụp riêng phần tử +
  đếm số node `<img>`/`<video>` thật trong DOM, cả 2 đều đúng).

## Vòng 17 — Có ảnh farm-bg.jpg thật, chỉnh crop icon cho khớp

Người dùng tạo ảnh nền nông trại bằng Google Flow (prompt Bước 9), tải
về dạng `.jpeg` rồi tự đổi tên thành `.jpg` qua Explorer (không dùng
`git mv` nên Git ban đầu hiểu nhầm thành "xoá file cũ + có file mới lạ"
— gộp lại bằng `git add -A` là xong, không có gì bất thường).

- Xem ảnh thật, thử vài phương án `background-position/-size` cho
  `.gametile.farm-tile` rồi chốt **`55% 58% / 220%`** (đường mòn uốn
  lượn + cây hai bên) — đẹp và rõ nét nhất khi thu nhỏ, đồng bộ cảm giác
  với tile Khu rừng kỳ bí (crop vào đúng đoạn có "điểm nhấn" thay vì mảng
  màu trơn).
- `.world-bg.farmphoto` (nền toàn màn hình lúc chơi) giữ nguyên
  `center/cover` — không cần chỉnh, ảnh phủ đẹp ngay.
- Đã kiểm thử: 25 unit test pass; xác nhận `background-image` của cả
  icon ô chọn game lẫn nền màn chơi đều resolve đúng URL
  `assets/backgrounds/farm-bg.jpg`; chơi hết 1 ván đầy đủ (10 câu, tới
  màn thắng) với ảnh nền thật — không lỗi console nào ngoài network-noise
  vô hại đã thấy lặp lại xuyên suốt phiên; chụp ảnh xác nhận bằng mắt cả
  màn chọn trò chơi lẫn màn chơi đều hiển thị đúng, đẹp, đồng bộ phong
  cách với Khu rừng kỳ bí.

## Vòng 18 — Sửa lỗi "con nào cũng đọc giống nhau" (đua tranh cancel()/speak())

Người dùng báo âm thanh đọc tên con vật không đổi theo từng con — nghi
ngờ đầu tiên là logic chọn từ sai, nhưng kiểm tra lại (nhiều lần capture
`window.__lastSpeech`/`speak()` xuyên suốt phiên làm việc trước đó, và
chơi thắng được cả ván nhờ đúng câu đọc) xác nhận **logic chọn từ hoàn
toàn đúng** — từ được chọn để đọc luôn khớp đúng slot mục tiêu. Vậy lỗi
nằm ở tầng phát âm thanh trình duyệt, không phải game logic.

- **Nguyên nhân nghi nhiều nhất**: lỗi đã biết của Web Speech API (rõ
  nhất trên Chrome Android) — gọi `speechSynthesis.cancel()` rồi gọi
  `speechSynthesis.speak()` ngay lập tức (như code cũ vẫn làm) có thể bị
  máy "nuốt" lệnh speak() mới, khiến engine cứ phát lặp lại câu CŨ thay
  vì câu vừa gọi — đúng khớp triệu chứng "con nào cũng đọc như nhau".
- **Sửa** (`engine/audio-provider.js`): chỉ gọi `cancel()` khi thật sự
  đang có câu phát dở (`synth.speaking || synth.pending`, thay vì gọi vô
  điều kiện mỗi lần), rồi chờ 1 nhịp rất ngắn (60ms, qua `setTimeout`)
  cho `cancel()` xử lý xong hẳn mới xếp câu mới vào hàng đợi thật —
  khắc phục đúng race condition trên. Thêm cơ chế đánh số thứ tự lần gọi
  (`latestSpeakId`) để nếu `speak()` bị gọi liên tiếp rất nhanh (vd bấm
  đúp nút "Nghe lại"), lần gọi CŨ đang chờ trong `setTimeout` tự nhận ra
  đã có lần gọi MỚI hơn và bỏ qua — không phát nhầm câu cũ ra sau câu
  mới, không xếp hàng chồng chéo nhiều utterance.
- Không thể tái hiện/nghe thử âm thanh thật trong môi trường chạy test ở
  đây (Chromium headless không có engine phát âm thanh thật) — đã kiểm
  chứng bằng cách khác: chèn (mock) `window.speechSynthesis.speak` để
  ghi lại chính xác utterance nào THẬT SỰ được gọi và lúc nào, xác nhận:
  (1) sau khi đợi hết 60ms, đúng câu mới nhất được gọi; (2) bấm 2 lần
  liên tiếp cực nhanh thì trình duyệt chỉ thật sự gọi `speak()` đúng 1
  lần với đúng câu mới nhất (không phát trùng/phát nhầm câu cũ); (3)
  chơi hết cả ván ở cả 2 game vẫn đúng như trước, không có gì bị ảnh
  hưởng bởi độ trễ 60ms thêm vào. 25 unit test vẫn pass.
- Nếu người dùng thử lại vẫn còn hiện tượng tương tự, nhiều khả năng là
  do **chính giọng đọc (voice) trên máy/trình duyệt cụ thể của họ** phát
  âm nhiều tên con vật nghe gần giống nhau (chất lượng giọng phụ thuộc
  thiết bị, ngoài tầm kiểm soát của code — xem "Ghi chú kỹ thuật lâu dài"
  bên dưới về giới hạn Web Speech API) — lúc đó bước tiếp theo là thử
  trình duyệt khác trên cùng máy để so sánh trước khi cân nhắc giọng trả
  phí.

## Vòng 19 — Đổi tên 2 game sang tiếng Anh + Game #3 "Help Bill!"

**Đổi tên hiển thị**: "Khu rừng kỳ bí" → **Mystic Jungle**, "Nông trại
của bé" → **My Little Farm** (chỉ đổi `title` trong `GAMES` ở `app.js`
— slug thư mục `games/khu-rung-ky-bi/`/`games/nong-trai-cua-be/` giữ
nguyên, không liên quan tới tên hiển thị).

**Game #3 "Help Bill!"** (`games/bill/`) — cơ chế mới, khác 2 game
trước ở 2 điểm:

- Câu hỏi là **cả câu** ("I want a book") thay vì 1 từ đơn — không cần
  sửa engine, vì schema content pack đã có sẵn field
  `prompt_audio_text` tách biệt với `answer.text_en` (dùng để lưu tiến
  độ/hiển thị) dành riêng cho việc này.
- Giao diện: nhân vật Bill đứng cố định (không lắc lư rải rác như con
  vật), 4 món đồ xếp thành 1 hàng ngay ngắn gần đáy màn hình. Bấm đúng:
  đồ "bay" từ ô của nó về cạnh Bill (tính toạ độ bằng
  `getBoundingClientRect()`, animate qua `--dx/--dy` — cùng kỹ thuật với
  hạt "ăn mừng" `.tileburst` đã có, chỉ khác là bay tới 1 điểm đích cụ
  thể thay vì bay toé ra rồi tan biến tại chỗ) rồi đứng yên cạnh Bill,
  Bill đổi ảnh sang vui. Bấm sai: ô đúng sáng lên, Bill đổi ảnh sang
  buồn.
- Vẫn tái dùng gần như nguyên vẹn phần dùng chung ở
  `engine/catch-game.css` (`.starsrow`/`.soundbtn`/`.freetile`/màn kết
  quả) — chỉ viết CSS/JS riêng cho phần mascot + hiệu ứng bay + xếp 4 ô
  thành 1 hàng thay vì rải theo góc phần tư (`.billstage .freetile` ghi
  đè kích thước, `billPositionTile()` tính vị trí theo cột thay vì góc).
- **Lỗi gặp phải lúc build**: `.freeplay` (định nghĩa ở
  `engine/catch-game.css`) dựa vào `flex:1` của chính nó để lấy chiều
  cao — chỉ có tác dụng khi CHA TRỰC TIẾP là 1 flex container. Ở
  forest.js/farm.js, `.freeplay` là con trực tiếp của `.content` (flex
  column) nên đúng. Ở bill.js, `.freeplay` lại là CHÁU của `.content`
  (qua `.billstage` — chỉ `position:relative`, không phải flex), nên
  `flex:1` vô tác dụng, chiều cao co gần về 0 → hàng đồ vật bị đẩy lên
  sát mép trên đè vào topbar thay vì nằm gần đáy. Phát hiện bằng
  Playwright (chụp ảnh thấy rõ 4 ô đồ vật đè lên nút back), sửa bằng
  cách ghi đè `.billstage .freeplay{ position:absolute; inset:0; }` để
  nó luôn phủ đúng kín `.billstage`, không phụ thuộc flex context của
  cha — bài học cho game sau nếu lại lồng thêm 1 cấp wrapper mới.
- **Vốn từ mới**: `content/packs/objects-v1.json` (category `object`,
  subcategory `school` — 10 đồ dùng: book/pencil/ruler/bag/pen/eraser/
  crayon/notebook/ball/hat, có cả ví dụ "a"/"an"). Ảnh AI (nhân vật Bill
  vui/buồn + 10 đồ vật + ảnh nền sân trường) CHƯA có lúc build — mỗi từ
  đều có sẵn `answer.emoji` làm dự phòng nên game chạy được đầy đủ ngay
  hôm nay, không cần chờ ảnh; `<img>` các nơi đều có bắt sự kiện `error`
  (nghe ở pha capture trên `window`, vì `error` trên `<img>` không nổi
  bọt) để tự rơi về emoji nếu ảnh chưa tồn tại. Prompt tạo ảnh + quy
  trình gửi ảnh mới (qua Git thay vì dán vào chat, đỡ tốn token — áp
  dụng từ nay cho mọi game sau) nằm ở Bước 11-14 trong
  `ANIMAL_ART_PIPELINE.md`.
- Kiểm thử bằng Playwright: chơi hết 1 ván (bấm đúng lẫn sai, xác nhận
  đúng class `correct`/`wrong`, hiệu ứng bay + icon đứng cạnh Bill sau
  khi bay, đổi mood đúng lúc), chơi tới màn thắng cuộc (10 sao), xem
  Trang chủ (ô "Help Bill!" hiện đúng, fallback emoji khi chưa có ảnh),
  xem Trang phụ huynh không lỗi với category mới. 25 unit test vẫn pass.

## Vòng 20 — Hoàn thiện game #3: thêm mood "chờ đợi", đồ đúng bay khi sai, ảnh thật

Vài vòng chỉnh sửa liên tiếp sau khi build xong khung game #3 (Vòng 19),
tới khi có đủ ảnh thật:

- **Thêm mood thứ 3 "idle" (chờ đợi)**: trước đó Bill chỉ có vui/buồn,
  dùng tạm "vui" làm mặc định — không hợp lý lúc chưa trả lời. Thêm
  `bill-idle.png` làm ảnh mặc định lúc vào màn chơi/đầu mỗi câu mới,
  "happy"/"sad" giờ chỉ còn là phản ứng tức thời sau khi trả lời.
- **Sửa cơ chế cho khớp mô tả người dùng**: lúc chọn SAI, đồ vật ĐÚNG
  cũng phải "bay" về cạnh Bill giống hệt lúc chọn đúng (chỉ khác Bill
  buồn thay vì vui) — trước đó chỉ có quầng sáng đánh dấu, chưa bay.
- **Sửa prompt đồ vật bị dính nhân vật Bill**: người dùng báo ảnh bút
  chì tạo ra có cả Bill đứng cạnh dù prompt không hề nhắc tới — nguyên
  nhân là công cụ AI ảnh giữ ngữ cảnh cuộc trò chuyện vừa tạo Bill
  trước đó. Sửa `ANIMAL_ART_PIPELINE.md`: bắt buộc tạo đồ vật ở 1 cuộc
  trò chuyện MỚI, khung phong cách nói rõ "no character/no person/no
  hands" cả trong mô tả chính lẫn Avoid.
- **Đủ ảnh thật, wire vào game**: người dùng gửi 3 ảnh Bill (idle/happy/
  sad) + ảnh nền sân trường qua thư mục tạm `assets/_raw_incoming/`
  (quy trình Git đỡ tốn token ở Bước 11) — xoá nền bằng
  `tools/remove_white_bg.py`, resize về 900×900 (khớp cỡ các asset
  khác), ảnh nền giữ nguyên lưu vào `assets/backgrounds/school-bg.jpg`.
- **2 lỗi CSS thật phát hiện lúc wire ảnh vào** (cả 2 đều "âm thầm" —
  không báo lỗi console, chỉ sai lặng lẽ, phải kiểm bằng Playwright +
  computed style mới thấy):
  1. `.world-bg.billphoto{ background:linear-gradient(...) url(...) ...; }`
     — 2 lớp ảnh nền (gradient + url) viết liền nhau KHÔNG dấu phẩy là
     cú pháp CSS không hợp lệ, khiến browser bỏ qua CẢ khai báo, rơi về
     gradient mặc định của `.world-bg` — ảnh nền thật không bao giờ
     hiện dù đường dẫn đúng. Sửa theo đúng cú pháp forest.css/farm.css
     đã dùng: chỉ 1 màu đặc (không phải gradient) làm nền dự phòng phía
     sau `url()`.
  2. `.billfallback`/`.billtile-fallback` tự đặt `display:flex` nên đè
     lên đúng `display:none` mặc định của thuộc tính `hidden` — icon dự
     phòng LUÔN hiện đè lên ảnh Bill thật dù ảnh đã tải thành công.
     Cùng loại lỗi (và cách sửa) với `.filterddPanel[hidden]`/
     `.cmOverlay[hidden]` đã có sẵn trong `index.html` — bài học: bất
     kỳ phần tử nào dùng thuộc tính `hidden` mà tự đặt `display` riêng
     đều PHẢI có thêm rule `.class[hidden]{ display:none; }` mới ẩn
     đúng, nếu không im lặng sai.
- Đã kiểm thử lại toàn bộ bằng Playwright sau mỗi thay đổi (bay khi
  sai, ảnh nền thật qua computed style, cả 3 mood dùng đúng ảnh thật
  `naturalWidth` > 0, ô chọn game ở Trang chủ). 25 unit test vẫn pass.

## Vòng 21 — Sửa thư mục ảnh "Đồ vật" bị thiếu + đổi tên ANIMAL_ART_PIPELINE.md sang PROMPT.md

- **Sửa lỗi upload ảnh "Đồ vật" qua Trang phụ huynh**: `objects-v1.json`
  (category `object`, thêm ở game #3) chưa được khai báo trong
  `FOLDER_BY_CATEGORY` của `tools/admin-server.mjs` — upload sẽ báo lỗi
  "Bộ từ không hợp lệ." dù dropdown "Bộ từ" vẫn hiện đúng "Đồ vật" (đọc
  trực tiếp từ content pack, không qua danh sách này). Thêm
  `object: 'objects'` — ảnh đồ vật giờ lưu vào thư mục riêng
  `assets/objects/`, tách biệt khỏi `assets/animals/`, đúng quy ước
  "1 category = 1 thư mục" đã có. Kiểm thử bằng 1 lượt upload thật qua
  API (id tạm, dọn sạch sau khi xác nhận).
- **Đổi tên `ANIMAL_ART_PIPELINE.md` → `PROMPT.md`**: phạm vi tài liệu
  đã vượt xa "con vật" từ lâu (nhân vật Bill, đồ vật, ảnh nền theo từng
  game) nên tên cũ không còn khớp. Đổi bằng `git mv` (giữ lịch sử file).
  Thêm **Mục lục** clickable ở đầu file — mỗi mục "Bước N" đều có
  `<a id="buoc-N"></a>` đặt ngay trước heading, Mục lục link tới
  `#buoc-N`. Chọn cách này (thay vì trông chờ auto-slug từ chính văn
  bản tiêu đề) vì tiêu đề có dấu gạch ngang dài "—" và dấu ngoặc kép —
  thuật toán tạo slug tự động của từng công cụ (GitHub/VS Code/Typora)
  xử lý các ký tự này không giống nhau, dễ ra link sai; đặt `id` tay,
  đơn giản, cố định thì chạy đúng ở MỌI nơi hiển thị được HTML thô
  trong markdown (GitHub, VS Code Preview, Typora, Obsidian...).
  **Các đoạn tham chiếu cũ trong `ROADMAP.md` (lịch sử) CỐ TÌNH giữ
  nguyên tên `ANIMAL_ART_PIPELINE.md`** — đúng tên file tại thời điểm
  viết, không sửa lại (xem quy ước ghi ở đầu file). Đã cập nhật tên mới
  ở mọi nơi khác đang tham chiếu (comment trong `bill.js`, `farm.css`,
  `avatars.js`, `remove_white_bg.py`).
- **Thêm Bước 15** vào `PROMPT.md`: 10 đồ vật ở trường đợt 2 (khác hẳn
  10 món ở Bước 13) — bảng con/phấn/hộp bút/kéo/hồ dán/chai nước/hộp
  cơm/ô/khăn quàng đỏ/giày, dùng lại đúng khung phong cách đồ vật (đã
  sửa loại trừ nhân vật) ở Bước 13.

## Vòng 22 — Phóng to Bill + đổi lưới đồ vật sang 2×2

Theo yêu cầu người dùng: Bill quá nhỏ và dán sát mép trên (chưa giống
"đứng giữa sân trường"), 4 ô đồ vật xếp 1 hàng ngang hơi nhỏ.

- **Bill**: `.billmascotwrap` từ 150px → 220px, `top` từ 4% → 12% (thấp
  xuống, đứng trên đoạn đường lát đá trước cổng trường thay vì lửng lơ
  sát mép trên). Các phần tử ăn theo (icon dự phòng, icon đồ giữ cạnh
  Bill) phóng to cùng tỉ lệ.
- **Lưới đồ vật**: đổi từ rải theo hàng ngang (JS tính `left`/`top` thủ
  công trong `billPositionTile()`) sang **CSS Grid 2×2 tĩnh**
  (`display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr`)
  — không cần JS tính vị trí nữa vì bố cục cố định (khác forest.js/
  farm.js phải tính toạ độ vì rải NGẪU NHIÊN tránh chồng lấn). Xoá hẳn
  `billPositionTile()`/`billPositionAllTiles()` trong `bill.js` (dead
  code sau khi đổi sang Grid) — đơn giản hoá code thay vì giữ lại "phòng
  khi cần". Ô đồ vật to hơn hẳn (78px → 132px). `#billItemsArea` chỉ
  chiếm nửa DƯỚI khu chơi (`top:48%`) để dành nửa trên cho Bill đứng,
  không đè lên nhau.
- Kiểm thử bằng Playwright: đọc `getBoundingClientRect()` của cả 4 ô +
  Bill, xác nhận đúng lưới 2×2 không chồng lấn, không đè lên Bill; chơi
  lại toàn bộ luồng đúng/sai/thắng cuộc vẫn hoạt động bình thường (chỉ
  đổi CSS bố cục, không đụng logic JS chấm điểm/chuyển câu). 25 unit
  test vẫn pass.

## Vòng 23 — Thu hẹp lưới đồ vật + sửa câu Bill nói bị đè mất khi upload ảnh

- **Thu hẹp lưới 2×2**: theo yêu cầu người dùng, lưới đồ vật ở Vòng 22
  trải hết chiều ngang màn hình khiến 2 cột dạt sát mép ngoài, đè lên
  bụi cây/hoa trong ảnh nền. Thu hẹp `#billItemsArea` (`left`/`right`
  từ 0 → 16%) + giảm `gap`, 4 ô co cụm lại gần nhau, nằm ngay dưới Bill
  giữa đoạn đường sân trường thay vì trải hết bề ngang.
- **Sửa lỗi Bill chỉ đọc 1 từ thay vì cả câu**: người dùng báo Bill nói
  "quyển sách"/"book" thay vì "I want a book." — nguyên nhân: lúc upload
  ảnh cho 10 từ đã có qua Trang phụ huynh, `tools/admin-server.mjs` (mỗi
  lần sửa 1 từ đã tồn tại) luôn đồng bộ `prompt_audio_text = text_en`,
  không phân biệt được bộ từ "Đồ vật" của game #3 cố tình đặt
  `prompt_audio_text` là CẢ CÂU khác hẳn `text_en` — chỉ tải ảnh lên
  (không đụng gì câu đọc) cũng vô tình xoá mất câu tuỳ chỉnh. Sửa: chỉ
  tự đồng bộ khi 2 giá trị ĐANG GIỐNG NHAU trước đó (nghĩa là chưa từng
  bị tuỳ chỉnh) — giữ nguyên hành vi cũ cho các bộ từ khác (animal/
  color/number/fruit/family). Khôi phục lại đúng `prompt_audio_text`
  cho cả 20 từ trong `objects-v1.json` (10 từ đợt 1 bị đè mất do lỗi
  trên + 10 từ đợt 2 người dùng vừa thêm mới qua Trang phụ huynh, vốn dĩ
  CHƯA BAO GIỜ có câu riêng vì form Trang phụ huynh không có ô nhập câu
  audio tuỳ chỉnh — chỉ có ô "Tiếng Anh"/"Tiếng Việt").
- Đã kiểm thử: mô phỏng đúng thao tác gây lỗi (upload lại ảnh cho
  "book" qua API) xác nhận không còn bị đè; capture
  `SpeechSynthesisUtterance` thật trong trình duyệt qua nhiều vòng chơi
  (31 câu) xác nhận 100% đọc đúng cả câu "I want ..." cho cả 20 từ,
  không còn từ đơn lẻ nào. 25 unit test vẫn pass.

## Vòng 24 — Game #4 "How Many?" (game đầu tiên luyện kỹ năng "Nhìn")

Game đầu tiên KHÔNG thuộc kỹ năng "Nghe" — chuyển sang "Nhìn" (`see`).
Khác hẳn cơ chế 3 game trước (nghe prompt → nhìn tìm đúng ảnh), ở đây
đảo ngược: **nhìn/tự đếm số lượng đồ vật hiện trên màn → bấm 1 trong 4
"núm" màu, mỗi núm khi bấm mới đọc lên 1 câu số lượng khác nhau** (vd
"I have three pens."), bấm đúng núm khớp số lượng đang thấy thì thắng.
Không có prompt nào đọc SẴN lúc vào câu (khác 3 game kia) — nên màn này
cũng không có nút "Nghe lại" (không có gì để nghe lại).

- **Từ vựng được chấm điểm là SỐ ĐẾM** (`content/packs/numbers-v1.json`,
  id "one".."ten", đã có sẵn từ đầu dự án, không cần tạo mới) — đúng
  yêu cầu "từ mới học là số đếm". Đồ vật (`content/packs/objects-v1.json`,
  đã có sẵn từ game #3) chỉ đóng vai trò ảnh minh hoạ để đếm, đổi ngẫu
  nhiên mỗi câu, KHÔNG được chấm điểm riêng — **0 ảnh mới cần tạo**,
  dùng lại 100% asset đã có.
- Chỉ chọn 17/20 đồ vật ĐẾM ĐƯỢC tự nhiên bằng tiếng Anh (có số nhiều
  hợp lý, ảnh lặp lại nhiều lần không gây hiểu lầm) — cố tình loại
  "scissors"/"shoes" (đã là danh từ số nhiều/ảnh vẽ sẵn 1 đôi) và
  "chalk" (không đếm được, không có "chalks" chuẩn). Danh sách lọc này
  chỉ nằm cục bộ trong `games/how-many/howmany.js`, không đụng gì tới
  `objects-v1.json`.
- Vì mỗi câu không cần giữ DOM cũ (không có ảnh động/video như con vật
  ở 2 game trước cần tránh giật hình), toàn màn RENDER LẠI MỚI hoàn
  toàn mỗi câu — không có hàm `advanceXRound()` vá DOM riêng như forest/
  farm/bill, đơn giản hơn hẳn. Dữ liệu câu hiện tại giữ ở biến cục bộ
  (closure) trong factory thay vì gắn vào `state` dùng chung, vì không
  cần chia sẻ ra ngoài (khác `state.slots` của 3 game kia phải sống
  xuyên suốt để vá DOM từng phần).
- 4 núm bấm 4 màu khác nhau (đỏ cam/xanh lá/vàng/xanh dương), không chữ/
  số trên núm (đúng quy định không hiển thị chữ trên màn chơi cho trẻ)
  — bấm núm nào đọc đúng câu của núm đó (dù đúng hay sai), bấm sai thì
  thêm 1 nhịp sau đó mới đọc câu đúng để tránh chồng 2 câu đè nhau.
- Trong lúc kiểm thử phát hiện 1 hiện tượng tưởng là lỗi nhưng thật ra
  ĐÚNG THIẾT KẾ: bấm cùng 1 núm liên tục nhiều câu thấy Trang phụ huynh
  chỉ ghi nhận đúng 1-2 từ số — không phải lỗi hiển thị, mà là do
  **spaced repetition đã hoạt động đúng**: từ vừa trả lời SAI được xếp
  lịch ôn lại gần như ngay lập tức (`buildRound()` ưu tiên từ "đến hạn"
  trước), nên hỏi đi hỏi lại đúng từ đó tới khi trả lời đúng mới chuyển
  từ khác — xác nhận bằng cách đọc thẳng `localStorage` so với bảng
  Trang phụ huynh, khớp nhau 100% ở mọi lúc.
- Đã kiểm thử toàn bộ bằng Playwright: hiện đúng số lượng ảnh theo giá
  trị số cần đếm, không có prompt tự động phát trước (mảng rỗng lúc vào
  câu), bấm đúng/sai đều đọc đúng câu + đúng ngữ pháp số ít/số nhiều
  ("one red scarf" / "nine rulers" / "ten rulers"), core đúng highlight
  xanh/đỏ, chơi hết ván tới màn thắng cuộc, dữ liệu lưu đúng cột "Nhìn"
  trong Trang phụ huynh (đối chiếu trực tiếp với `localStorage`). 25
  unit test vẫn pass.

## Vòng 25 — Làm lại cơ chế "How Many?": nghe thử → xác nhận, thêm Cú thông thái

Theo yêu cầu người dùng, đổi hẳn cách chơi của game #4 (khác cơ chế
"bấm 1 phát là xong" của cả 3 game Nghe lẫn bản đầu của "Nhìn"):

- **4 nút hoa** (sunflower/daisy/rose/tulip, thay hẳn 4 khối vuông màu)
  giờ chỉ đóng vai trò **nghe thử** — bấm hoa nào đọc đúng câu của hoa
  đó (`ctx.speak()`), đánh dấu "đang chọn" (viền vàng nổi bật) nhưng
  KHÔNG chốt đáp án — bé bấm hoa khác để nghe lại câu khác, đổi ý bao
  nhiêu lần tuỳ ý.
- **Nút "bảng tính"** (mới, bên phải màn hình) mới thật sự XÁC NHẬN hoa
  đang chọn là đáp án cuối — bị khoá (`disabled`) cho tới khi đã chọn 1
  hoa, tránh bé bấm xác nhận khi chưa nghe gì. Toàn bộ logic chấm điểm/
  hiệu ứng đúng-sai/chuyển câu (trước đây nằm trong lúc bấm hoa) giờ
  chuyển hết vào lúc bấm nút này.
- **Nhân vật "Cú thông thái"** (mới, bên trái màn hình) — 3 trạng thái
  chờ đợi/vui/buồn giống hệt cơ chế Bill (Bước 12 trong `PROMPT.md`),
  chỉ đổi lúc XÁC NHẬN (không đổi lúc chỉ đang nghe thử qua các hoa).
  Ảnh chờ đợi cũng dùng làm icon ô chọn game ở Trang chủ (giống cách
  Bill dùng `bill-idle.png` làm icon).
- Chưa có ảnh thật nào (nền lớp học/Cú 3 trạng thái/4 hoa/nút bảng
  tính) — đã viết đủ prompt ở Bước 16 trong `PROMPT.md`, mọi `<img>`
  đều có fallback emoji đúng nghĩa (🌻🌼🌹🌷 cho hoa, 🦉 cho Cú, 🧮 cho
  nút xác nhận) nên game chạy đủ chức năng ngay hôm nay.
- Ảnh đồ vật cần đếm cũng phóng to hơn theo yêu cầu (64px → 82px).
- Đã kiểm thử toàn bộ bằng Playwright: xác nhận nút xác nhận bị khoá
  đúng lúc, bấm hoa CHƯA chấm điểm (không có class correct/wrong nào
  xuất hiện), đổi ý sang hoa khác hoạt động đúng (chuyển đúng hoa được
  đánh dấu "đang chọn"), bấm xác nhận mới thật sự chấm điểm + đổi mood
  Cú đúng lúc (happy/sad), hiện đúng ô đúng khi trả lời sai. 25 unit
  test vẫn pass.

## Vòng 26 — Ghép ảnh thật cho "How Many?" (Cú + 4 hoa) + sửa lỗi hiện trùng ảnh/emoji

Người dùng gửi qua Git (`assets/_raw_incoming/`) 7/9 ảnh đã hẹn ở Bước 16
trong `PROMPT.md`: `owl-idle`, `owl-happy`, `owl-sad`, `sunflower`,
`daisy`, `rose`, `tulip` (còn thiếu nền lớp học `howmany-bg.jpg` và nút
xác nhận `calculator.png` — game vẫn chạy tốt nhờ fallback gradient/emoji
🧮 sẵn có, sẽ ghép nốt khi có).

- Xoá nền (`tools/remove_white_bg.py`) + chuẩn hoá về canvas vuông
  900×900 giống quy ước ảnh Bill/đồ vật. Riêng `owl-idle.jpeg` gốc là
  ảnh dọc (768×1376, không vuông) — nếu resize ép về 900×900 sẽ bị kéo
  méo hình Cú, nên phải dán vào khung vuông (pad transparent theo cạnh
  dài hơn) rồi mới resize, thay vì resize thẳng như 6 ảnh còn lại (vốn
  đã vuông 1024×1024 sẵn).
- Chuyển vào `assets/characters/` (3 ảnh Cú) và thư mục mới
  `assets/howmany/` (4 ảnh hoa), xoá ảnh gốc khỏi `assets/_raw_incoming/`.
- **Lỗi thật phát hiện khi kiểm thử bằng Playwright**: 4 nút hoa và nút
  xác nhận hiện ĐÈ CHỒNG (2 tầng) hình ảnh thật lên trên emoji dự phòng
  thay vì chỉ hiện 1 trong 2 — do `<span class="flowerfallback">` và
  `<span class="confirmfallback">` trong `games/how-many/howmany.js`
  thiếu thuộc tính `hidden` mặc định (khác với `owlfallback` và
  `howmanytile-fallback` đã có sẵn `hidden` đúng từ đầu). Lỗi này vô
  hình từ lúc viết ở Vòng 25 vì khi đó ảnh thật chưa tồn tại nên `<img>`
  luôn lỗi (404) → `onerror` luôn ẩn `<img>`/hiện fallback đúng ý, che
  mất việc fallback vốn dĩ hiển thị sẵn không điều kiện. Chỉ lộ ra hôm
  nay khi ảnh hoa/Cú tải thành công thật. Sửa: thêm `hidden` mặc định
  cho cả 2 span, đúng theo mẫu 2 fallback kia — giờ fallback chỉ hiện
  khi `<img>` thật sự lỗi.
- Kiểm thử lại bằng Playwright sau khi sửa: chụp ảnh xác nhận không còn
  cảnh trùng lặp, bấm chọn hoa → viền vàng đúng hoa, bấm xác nhận → Cú
  đổi đúng trạng thái buồn khi chọn sai (kèm hiệu ứng viền đỏ ô đã chọn/
  viền xanh ô đúng), icon Cú ở Trang chủ hiển thị đúng ảnh thật không
  méo hình. 25 unit test vẫn pass.

## Vòng 27 — Ghép nốt 2 ảnh cuối cho "How Many?": nền lớp học + nút xác nhận

Người dùng gửi nốt 2 ảnh còn thiếu ở Bước 16 trong `PROMPT.md`:
`calculator.jpeg` (nút xác nhận, qua `assets/_raw_incoming/`, cần xoá
nền) và `howmany-bg.jpeg` (ảnh nền bảng đen lớp học, full-bleed, không
cần xoá nền). Game #4 "How Many?" giờ dùng đủ 9/9 ảnh thật đã hẹn,
không còn phần nào chạy bằng fallback emoji/gradient nữa.

- `calculator.png`: xoá nền + chuẩn hoá 900×900 (ảnh gốc đã vuông
  1024×1024) → `assets/howmany/calculator.png`.
- `howmany-bg.jpg`: copy thẳng vào `assets/backgrounds/` (không xoá nền,
  giống cách làm với `school-bg.jpg`/`farm-bg.jpg`).
- Cập nhật `.gametile.howmany-tile` trong `games/how-many/howmany.css`:
  đổi nền gradient tạm sang crop nhỏ thật của `howmany-bg.jpg` (canh vào
  giữa bảng đen, nơi có nhiều số trang trí quanh viền), đúng quy ước
  `background:<màu dự phòng> url(...) <vị trí>/<tỉ lệ> no-repeat;` đã
  dùng cho forest-tile/farm-tile/bill-tile.
- Kiểm thử lại toàn bộ bằng Playwright: cả 9 `<img>` của game (4 hoa +
  3 trạng thái Cú + nền + nút xác nhận) đều tải thành công
  (`naturalWidth` > 0, không còn ảnh nào lỗi/dùng fallback), luồng chọn
  hoa → xác nhận vẫn đúng (viền vàng lúc chọn, xanh/đỏ đúng-sai lúc xác
  nhận, Cú đổi đúng trạng thái vui/buồn), icon ô chọn game ở Trang chủ
  hiển thị đúng crop ảnh nền thật. 25 unit test vẫn pass.

## Vòng 30 — "How Many?": đổi cụm N hình đồ vật (đếm) sang 1 ảnh con số (nhìn)

Theo yêu cầu người dùng, đổi hẳn cách hiển thị câu hỏi của game #4:
trước đây hiện N hình đồ vật lặp lại (vd 3 cái bình nước) để bé tự
đếm; giờ hiện THẲNG 1 ảnh con số to (10 ảnh con số dễ thương do người
dùng tạo, prompt ở Bước 17 trong `PROMPT.md`) — bé nhìn mặt số, không
cần đếm nữa. Vẫn giữ đúng skill "Nhìn" (see), chỉ đổi CÁCH hỏi.

- Xử lý 10 ảnh `num-1.jpeg`..`num-10.jpeg` gửi qua
  `assets/_raw_incoming/`: xoá nền, chuẩn hoá 900×900 (ảnh gốc đã vuông
  1024×1024, không cần pad khung) → thư mục mới
  `assets/howmany/numbers/`.
- `countAreaHtml()` trong `games/how-many/howmany.js` đổi từ vòng lặp
  render N `<span class="counticon">` sang render 1
  `<div class="numbercard">` duy nhất, ảnh nguồn
  `assets/howmany/numbers/num-{targetValue}.png`, fallback là chính
  chữ số (vd "7") nếu ảnh lỗi — thay cho fallback emoji đồ vật cũ.
- Đồ vật (`objects-v1.json`) vẫn giữ vai trò góp danh từ cho câu nói
  của 4 nút hoa (vd "three rulers") — chỉ bỏ phần HIỂN THỊ ảnh đồ vật,
  không bỏ đồ vật khỏi luồng chơi. Dọn `pickObjectWord()` theo đó: bỏ
  2 trường `image`/`emoji` không còn ai dùng, chỉ giữ `singular`/`plural`.
  Xoá luôn 2 class CSS `.counticon`/`.counticon-emoji` không còn dùng,
  thay bằng `.numbercard`/`.numberimg`/`.numberfallback`.
- Kiểm thử lại bằng Playwright: ảnh con số tải đúng cho nhiều lượt
  chơi liên tiếp (num-1 .. num-10 đều load được, `naturalWidth` > 0),
  fallback chữ số hiện đúng khi giả lập ảnh lỗi, câu nói 4 nút hoa vẫn
  đúng cú pháp "số + danh từ" (vd "ten bags") không đổi. 25 unit test
  vẫn pass.

## Vòng 31 — "How Many?": thêm lại ảnh đồ vật cạnh số + đẩy cụm này/Cú lên cao

Theo phản hồi người dùng sau Vòng 30 (bỏ hẳn ảnh đồ vật đi hơi quá tay):

- Thêm lại ảnh đồ vật — nhưng CHỈ 1 tấm (không lặp lại N lần như bản
  gốc trước Vòng 30) — đặt CẠNH ảnh con số, không phải thay thế nhau.
  `pickObjectWord()` lấy lại 2 trường `image`/`emoji` đã bỏ ở Vòng 30.
  `countAreaHtml()` giờ render `.numbercard` + `.objectcard` cạnh nhau
  trong cùng `.countarea` (flex hàng ngang, có gap).
- Cú thông thái (to x3 từ Vòng 29) vẫn bị hàng hoa che khá nhiều dù đã
  đứng sau (z-index âm) — hàng hoa "che mất" cảm giác thị giác dù vẫn
  bấm được. Xử lý bằng cách đẩy CẢ 2 cụm lên cao hơn: `.countarea` đổi
  padding trên/dưới bất đối xứng (`1vh 6vw 7vh` — dưới nhiều hơn hẳn
  trên) để cụm số+đồ vật dồn lên cao hơn trong vùng `flex:1`, đồng thời
  `.owlwrap` tăng `bottom` từ 104px lên 172px để Cú cũng nhích lên theo.
  Kết quả: vùng chồng lấn giữa Cú và hàng hoa giảm hẳn (đo bằng
  Playwright: từ ~129px chồng lấn xuống còn ~92px, và phần chồng lấn
  còn lại chủ yếu là phần thân dưới/chân Cú chứ không còn che khuôn mặt).
- Kiểm thử lại bằng Playwright: cả 2 ảnh (số + đồ vật) tải đúng, luồng
  chọn hoa → xác nhận vẫn đúng (viền vàng/xanh/đỏ, Cú đổi đúng trạng
  thái vui/buồn ở vị trí mới). 25 unit test vẫn pass.

## Vòng 32 — Icon Cú ở Trang chủ to lên ngang các icon game khác

Người dùng phản hồi icon "How Many?" ở lưới chọn game nhìn nhỏ hơn hẳn
3 icon kia (hổ/chó/Bill). Đo thử bằng script Python (bounding box theo
kênh alpha): `owl-idle.png` chỉ chiếm ~37%×55% khung ảnh 900×900 gốc,
trong khi `tiger.png`/`dog.png`/`bill-idle.png` chiếm 65-79% — cùng 1
khung CSS 78px thì hình Cú thực tế nhỏ hơn hẳn vì bản thân ảnh có nhiều
khoảng đệm trong suốt quanh hình hơn. Sửa bằng cách nới khung
`.howmanytile-face` từ 78px lên 112px (thuần CSS, không đụng vào file
ảnh) để bù lại, không cần hỏi ý kiến sửa ảnh theo CLAUDE.md vì không
chỉnh sửa/ghi đè ảnh nào. Tác dụng phụ chấp nhận được: cả hàng lưới
chứa "Help Bill!"+"How Many?" cao hơn hàng "Mystic Jungle"+"My Little
Farm" một chút (do CSS Grid tự giãn hàng theo ô cao nhất).

## Vòng 33 — Sửa lỗi màn chơi không đủ 4 ô + không "cày" LV được nữa

Người dùng báo: chơi nhiều thì "Khu rừng kỳ bí" có lúc chỉ hiện 3 con, có
lúc 1 con thay vì đủ 4, và tự đoán nguyên nhân nằm ở logic chọn từ theo LV
— đoán đúng.

**Nguyên nhân** (`engine/learning-engine.js`, `buildRound`): từ trong bộ
được chia đúng 2 rổ — "đến hạn ôn" (`seen && next <= now`) và "chưa học bao
giờ" (`!seen`). Nhóm thứ 3 — **đã học rồi nhưng chưa tới hạn ôn lại** —
không thuộc rổ nào nên không bao giờ được dùng. Khi bé đã học hết cả bộ
(hết từ mới) mà chỉ 1-3 từ đến hạn, `round` chỉ có 1-3 phần tử → màn chơi
render đúng bấy nhiêu ô. Nhánh dự phòng `round.length === 0` chỉ cứu được
trường hợp rỗng hoàn toàn, không cứu trường hợp thiếu một phần. Lỗi này
dùng chung cho **cả 3 game 4 ô** (Khu rừng kỳ bí, Nông trại của bé, Help
Bill!) vì cùng gọi `buildRound(..., { size: 4 })`; "How Many?" (size 1)
không dính vì luôn rơi vào nhánh dự phòng.

**Sửa 1 — luôn đủ số ô:** sau khi lấy due + từ mới, nếu vẫn thiếu thì lấp
nốt bằng từ "đã học nhưng chưa tới hạn" (xáo trộn để đa dạng). Nhánh
`round.length === 0` cũ trở thành thừa (trường hợp rỗng giờ tự rơi đúng vào
nhánh lấp mới) nên xoá hẳn.

**Sửa 2 — chưa tới lượt thì không tăng LV:** theo đúng yêu cầu người dùng,
từ được đưa lên chỉ để lấp ô không được hưởng tiến độ. `applyAnswer` giờ tự
kiểm tra: nếu từ đã học và lịch ôn còn ở tương lai thì trả lời ĐÚNG chỉ ghi
nhận `correctCount`, **giữ nguyên cả LV lẫn lịch ôn**. Trả lời SAI vẫn phạt
như thường (sai là bằng chứng thật sự bé chưa nhớ, không phụ thuộc đã cách
quãng bao lâu). Kiểm tra nằm trong engine chứ không ở từng game, nên cả 4
game (và game sau này) tự động theo đúng luật, không cần nhớ truyền cờ.

Tác dụng phụ tích cực: trước đây bé (hoặc người test) trả lời đúng cùng 1
từ liên tục trong vài giây là LV tăng vù vù dù chưa hề cách quãng — giờ
không "cày" LV kiểu đó được nữa, LV phản ánh đúng trí nhớ dài hạn hơn.

- 2 unit test cũ khẳng định hành vi CŨ (trả lời đúng 2 lần liên tiếp trong
  cùng 1 mili-giây được +2 LV) nên phải sửa lại cho đúng luật mới: giãn mốc
  thời gian giữa 2 lần trả lời bằng tham số `opts.now` mới của `applyAnswer`.
- Thêm 3 test mới khoá luật: đúng-khi-chưa-tới-hạn giữ nguyên LV + lịch ôn;
  sai-khi-chưa-tới-hạn vẫn giảm LV; `buildRound` luôn trả đủ `size`.
- Kiểm thử thêm bằng Playwright trên máy thật với dữ liệu tiến độ giả lập
  "bé đã học hết bộ": 1 con đến hạn / 3 con đến hạn / không con nào đến hạn
  → cả 3 trường hợp đều hiện đủ 4 con. 28 unit test pass.

## Vòng 34 — "How Many?" không lên điểm: bỏ chấm theo thời gian, chấm theo số bông đã nghe

Người dùng báo trò "How Many?" không lên điểm và tự đoán nguyên nhân nằm ở
logic đếm thời gian trả lời, vì màn này BẮT BUỘC phải bấm hoa mới nghe được
— đoán đúng.

**Nguyên nhân:** `handleConfirmPress` chấm bằng
`classifyAnswer(true, responseTimeMs)` với mốc `state.cardShownAt` đặt từ
lúc vào câu. Ngưỡng "đúng-nhanh" của engine là 2.5 giây, trong khi riêng
việc nghe hết 1 câu TTS ("three rulers") đã hơn 1 giây, cộng thao tác bấm
hoa + bấm bảng tính là chắc chắn vượt ngưỡng. Nên mọi câu đúng đều bị chấm
`correct-slow`, mà `correct-slow` chỉ tăng LV khi LV < 2 → **từ nào lên tới
LV2 là đứng yên vĩnh viễn**.

Đo bằng Playwright trên máy thật, cùng 1 thao tác "nghe 1 bông rồi xác nhận
luôn":

| Cách bấm | Thời gian | Kết quả |
| --- | --- | --- |
| Bấm tức thì (máy, không kịp nghe) | 436ms | LV 2 → 3 |
| Có nghỉ nghe câu như bé thật | 3354ms | LV 2 → 2 (kẹt) |

**Sửa (theo đúng hướng người dùng nêu):** bỏ hẳn đo thời gian ở màn này,
đổi sang đếm **số bông hoa bé phải nghe trước khi chốt** — thước đo đúng
với cơ chế chơi của màn:

- Nghe đúng 1 bông rồi xác nhận luôn (nghe ra ngay) → `correct-fast`, LV
  tăng bình thường.
- Phải dò sang bông khác mới ra → `correct-slow` (giữ nguyên LV ở mốc cao).
- Bấm lại CÙNG 1 bông để nghe lần nữa không tính là "dò thêm" — chỉ đếm số
  bông KHÁC NHAU (`round.daNghe`).
- Trả lời sai vẫn `wrong` như cũ.

Dọn theo: bỏ `state.cardShownAt` và import `classifyAnswer` trong
`howmany.js` (không còn ai dùng).

Kiểm thử lại bằng Playwright: nghe 1 bông + nghỉ 3.5s rồi xác nhận → LV
2→3 ✅ (trước đây kẹt ở 2); dò đủ 4 bông mới ra → LV 2→2 ✅ (đúng ý nghĩa
"đúng nhưng chưa chắc"). 28 unit test vẫn pass.

**Còn ngỏ — 3 game kia có thể dính vấn đề tương tự (chưa sửa, chờ ý kiến):**
forest/farm/bill cũng đặt `cardShownAt` TRƯỚC khi đọc câu hỏi, nên thời
gian đọc TTS (~1-1.5 giây) bị tính vào thời gian trả lời của bé, chỉ còn
lại ~1 giây để kịp ngưỡng 2.5 giây. Khác với "How Many?" ở chỗ vẫn có thể
kịp (bé chỉ cần bấm 1 lần, không phải nghe thử rồi xác nhận), nên chưa đổi
gì để tránh tự ý mở rộng phạm vi.

## Vòng 35 — Sửa nốt 3 game kia: chỉ tính giờ trả lời SAU khi đọc xong câu hỏi

Tiếp nối Vòng 34 (đã sửa "How Many?"), người dùng yêu cầu sửa luôn 3 game
còn lại (Khu rừng kỳ bí, Nông trại của bé, Help Bill!) — cùng gốc rễ: mốc
`cardShownAt` được đặt ngay lúc VÀO câu (trước khi đọc), nên thời gian đọc
TTS (~1-2 giây) bị tính oan vào "thời gian trả lời" của bé.

**Sửa tận gốc ở tầng phát âm thanh** (`engine/audio-provider.js`): thêm
tham số `opts.onEnd` cho `speak()` — gọi ĐÚNG 1 lần khi câu đọc xong (bắt cả
2 sự kiện `onend`/`onerror` của `SpeechSynthesisUtterance`, và gọi ngay lập
tức nếu trình duyệt không hỗ trợ đọc hoặc lệnh đọc bị lỗi — không để nơi
gọi treo chờ mãi). Nếu có 1 lần gọi `speak()` MỚI hơn đè lên trước khi câu
cũ kịp đọc xong thì `onEnd` của câu CŨ bị huỷ (không gọi) — chỉ `onEnd` của
câu mới nhất có ý nghĩa. `app.js`'s `speak(text, onEnd)` truyền thẳng tham
số này xuống.

**3 game** (`forest.js`/`farm.js`/`bill.js`) đổi `speakXTarget()` để nhận
callback này: `state.cardShownAt = Date.now()` giờ được đặt LẦN 2 — lần đầu
(giữ nguyên như cũ) làm mốc dự phòng ngay lúc vào câu (đề phòng trình duyệt
không đọc được), lần 2 (mới) ghi đè bằng callback `onEnd` ngay khi câu đọc
xong — đây mới là mốc THẬT SỰ dùng để tính `responseTimeMs`. Bấm "Nghe lại"
(replay thủ công) cũng reset lại mốc này sau khi đọc lại xong — hợp lý vì
bé chủ động nghe lại thì tính thời gian phản xạ từ đó là đúng.

Kiểm thử bằng Playwright: giả lập TTS thật mất 1.6 giây mới đọc xong (thay
vì môi trường không có giọng đọc, `onerror` bắn gần như tức thì), bấm đúng
ngay ~100ms sau khi "đọc xong" → cả 3 game đều lên LV bình thường
(`correct-fast`), đúng như hành vi mong muốn — trước khi sửa, cùng thao
tác này sẽ luôn bị chấm `correct-slow` giống hệt lỗi đã gặp ở "How Many?".
28 unit test vẫn pass (không đổi gì ở engine chấm điểm, chỉ đổi MỐC đo).

## Vòng 36 — "How Many?" vẫn không lên LV: luật chống-farm (Vòng 33) áp nhầm cho kho từ nhỏ

Người dùng báo tiếp: chơi How Many? khá nhanh nhưng vẫn không lên LV. Nghi
lúc đầu là do sửa Vòng 34 (đổi sang chấm theo số bông đã nghe) chưa đúng —
kiểm tra bằng Playwright thì logic Vòng 34 vẫn đúng y nguyên. Đào sâu hơn
bằng cách mô phỏng ĐÚNG hành vi người dùng mô tả — chơi 24 lượt liên tục,
luôn trả lời đúng càng nhanh càng tốt — mới lộ ra thủ phạm thật:

**Nguyên nhân:** luật "chưa tới hạn ôn thì không tăng LV" thêm ở Vòng 33
(chặn Ô LẤP CHỖ TRỐNG trong màn 4 ô của forest/farm/bill) bị `applyAnswer`
áp dụng chung cho MỌI game qua engine dùng chung — kể cả How Many?, dù màn
này không hề có khái niệm "ô lấp chỗ trống" (chỉ hỏi đúng 1 câu/lượt).
Kho số của How Many? chỉ có **10 từ** (numbers-v1.json) — bé chơi bình
thường cũng lặp hết 1 vòng trong khoảng 15-20 giây, NHANH HƠN HẲN mốc hẹn
ôn của LV1 (1 phút). Nên ngay sau lượt đầu tiên đi hết 10 số, mọi lượt
tiếp theo đều rơi vào "đã học rồi nhưng chưa tới hạn" → LV bị đứng yên
vĩnh viễn dù bé trả lời đúng liên tục — y hệt triệu chứng "chơi nhanh mà
không lên LV" người dùng mô tả, nhưng gốc rễ khác hẳn lần trước (Vòng 34 là
sai CÁCH ĐO, lần này là chặn NHẦM ĐỐI TƯỢNG).

Xác nhận bằng Playwright — chơi 24 lượt liên tục toàn đúng: 10 lượt đầu
(mỗi số 1 lần) lên đều LV0→1, nhưng lượt 11 trở đi (bắt đầu lặp lại số cũ)
correctCount vẫn tăng còn LV đứng im hoàn toàn ở tất cả các lượt sau.

**Sửa:** thêm `opts.skipDueGate` cho `applyAnswer` — bỏ qua hẳn luật
"chưa tới hạn" khi bật cờ này. How Many? truyền `{ skipDueGate: true }` vì
cơ chế riêng của màn (phải nghe đúng bông rồi mới xác nhận được, xem Vòng
34) đã tự có chống-farm riêng, không cần thêm lớp chặn theo ngày-giờ vốn
chỉ hợp với kho từ lớn (20-40 từ như 3 game kia). 3 game 4-ô còn lại GIỮ
NGUYÊN luật cũ, không đổi gì.

Thêm 1 unit test khoá hành vi `skipDueGate`. Kiểm thử lại bằng Playwright
với đúng kịch bản 24 lượt liên tục: LV giờ tăng đều đặn theo từng câu đúng
(không còn đứng yên sau lượt 10). 29 unit test pass.

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

## Vòng 28 — "How Many?": Cú chuyển lên góc trên-trái, nút hoa to/cao hơn

Theo yêu cầu người dùng, 2 chỉnh sửa giao diện nhỏ cho game #4:

- **Cú thông thái** rời khỏi `bottombar` (trước đứng cạnh nút xác nhận ở
  dưới cùng), chuyển thành `position:absolute` nổi cố định ở góc trên-
  trái màn chơi (`games/how-many/howmany.css` `.owlwrap`) — đặt trong
  khoảng đệm trên của `.content` (padding-top:100px có sẵn từ
  `index.html`) nên không chồng lên nút home/hàng sao ở `.topbar`. Nút
  xác nhận (bảng tính) ở `bottombar` giờ đứng một mình, canh giữa.
- **4 nút hoa** to hơn và cao hơn chiều rộng — phát hiện ra tăng riêng
  `width`/`max-width` của `.flowerbtn` không đủ vì 4 nút trong 1 hàng
  luôn bị flexbox co lại (`flex-shrink` mặc định) vừa khít khoảng trống
  còn lại của `.flowersrow`, bất kể khai báo to bao nhiêu; phải giảm cả
  `padding`/`gap` của `.flowersrow` để nhường thêm bề ngang thật sự thì
  nút mới to ra được. Kết quả đo bằng Playwright: rộng ~76px → ~83px,
  cao ~78px → ~121px (diện tích chạm tăng khoảng 75%).
- Kiểm thử lại bằng Playwright: Cú không chồng lên nút home, vẫn đổi
  đúng trạng thái vui/buồn ở vị trí mới, nút xác nhận vẫn hoạt động
  đúng. 25 unit test vẫn pass.

## Vòng 29 — "How Many?": Cú to x3 + xuống góc dưới-trái, khối items/hoa lên cao hơn

Tiếp tục yêu cầu người dùng, chỉnh thêm giao diện game #4:

- Cú thông thái đổi từ neo `top` (góc trên-trái, Vòng 28) sang neo
  `bottom` (góc dưới-trái) trong `.owlwrap`, đồng thời phóng to x3
  (84px → 252px) đúng yêu cầu.
- Vì to hơn nhiều, box của Cú giờ CHE cả vùng nút hoa/nút xác nhận bên
  dưới. Xử lý bằng `z-index:-1` (Cú luôn đứng SAU các phần tử khác
  trong `.content` theo đúng thứ tự DOM) + `pointer-events:none` — Cú
  chỉ mang tính trang trí, "ló ra" phía sau/xung quanh các nút hoa chứ
  không che mất hay chặn bấm nút nào. Đã kiểm thử bằng Playwright: bấm
  đúng 2 nút hoa bị Cú che nhiều nhất (hướng dương/cúc) vẫn nhận đúng
  trạng thái "selected" và mở khoá nút xác nhận bình thường.
- Khối ảnh đồ vật cần đếm (`.countarea`) và hàng nút hoa dịch lên cao
  hơn 1 chút (giảm `padding-top` của `.countarea` từ 5vh xuống 2vh) để
  chừa thêm không gian thị giác cho Cú lớn hơn ở phía dưới.
- 25 unit test vẫn pass.

## Vòng 37 — Game #5 "Word Safari" (Đọc Chữ) — game đầu tiên luyện kỹ năng "Đọc"

Xây hoàn chỉnh game thứ 5 theo đúng plan đã thống nhất trước đó: khác hẳn
cơ chế + kỹ năng của 4 game trước.

- **Cơ chế mới**: hiện 1 ảnh + phát âm thanh ĐÚNG 1 từ tiếng Anh (không
  phải cả câu như "Help Bill!"), bé chọn đúng trong 4 Ô CHỮ VIẾT bên dưới
  (4 game trước đều chọn bằng hình/âm thanh — đây là game đầu tiên bé phải
  ĐỌC chữ để trả lời).
- **Kỹ năng mới**: `skill='read'` — kỹ năng "Đọc" trong Learning Engine đã
  định nghĩa sẵn từ lâu (`engine/learning-engine.js`) nhưng chưa game nào
  dùng tới trước Vòng này.
- **Vốn từ tự động mở khoá** (khác hẳn cách chọn thủ công qua Trang phụ
  huynh của các game khác): 1 từ được tự động đưa vào rổ của Word Safari
  ngay khi nó đạt LV3 trở lên ở BẤT KỲ kỹ năng nào khác (`isWordUnlocked()`
  trong `games/word-safari/wordsafari.js`) — không cần phụ huynh can thiệp,
  không giới hạn theo 1 bộ từ (category) như các game kia, gộp CHUNG mọi
  bộ từ (animal/object/number/color/family/fruit) vì "Đọc" không phân biệt
  chủ đề.
- Chưa đủ từ đã mở khoá (`MIN_POOL = 4`) thì hiện màn "Sắp mở khoá!" thay
  vì chơi luôn — tránh trường hợp chỉ có 1-2 từ khiến câu hỏi lặp lại y hệt
  mãi mãi.
- Tái dùng gần như nguyên vẹn hạ tầng Learning Engine có sẵn, không cần sửa
  gì thêm ở `engine/`: `buildRound()` chọn từ theo đúng hạn ôn của riêng
  kỹ năng "read", `pickOptions()` sinh 4 lựa chọn (ưu tiên nhiễu cùng chủ
  đề, đã có sẵn từ trước — chưa game nào dùng tới), `classifyAnswer()`/
  `applyAnswer()` chấm điểm theo thời gian trả lời (không có cơ chế bắt
  buộc nghe nhiều lần như "How Many?" nên dùng lại time-based bình thường,
  không cần `skipDueGate`/đếm số lần nghe).
- Nhân vật chồn đất thám hiểm (3 trạng thái chờ đợi/vui/buồn) + ảnh nền
  savanna — ảnh do người dùng tự tạo bằng prompt ở Bước 18 (PROMPT.md),
  gửi qua Git, đã xử lý xoá nền + resize 900×900 (characters) / đổi đuôi
  .jpeg→.jpg (nền, giữ nguyên 1536×2752 khớp forest-bg/school-bg/
  howmany-bg).
- File mới: `games/word-safari/wordsafari.js` + `wordsafari.css`. Nối vào
  `app.js` (import, thêm vào mảng `GAMES` thay ô "g5" trống, tạo factory,
  thêm nhánh `render()`/`renderHome()`/click handler) + thêm `<link>` CSS
  vào `index.html`.
- Kiểm thử bằng Playwright (script dựng riêng, không phải test có sẵn):
  rổ từ tự động lọc đúng (chỉ từ đã LV3+ ở kỹ năng khác mới xuất hiện làm
  câu hỏi), 4 ô chữ hiện đủ + đúng nội dung, trả lời đúng tăng LV kỹ năng
  "read" (không đụng LV kỹ năng khác của từ đó), trả lời sai đánh dấu
  đúng/sai + đổi cảm xúc chồn đất + tự chuyển câu, màn "Sắp mở khoá" hiện
  đúng khi rổ từ dưới `MIN_POOL`, chơi đủ 10 câu đúng ra màn thắng cuộc.
  Đã chụp ảnh QA (Trang chủ, màn chơi, màn thắng, màn khoá) — giao diện
  khớp phong cách chung, icon Trang chủ cùng cỡ các game khác, chồn đất
  không che nút bấm. 29 unit test hiện có vẫn pass nguyên (không cần sửa
  `engine/` cho game này).

## Vòng 38 — "Sao lưu / Khôi phục tiến độ" trong Trang phụ huynh

Sau khi đổi trò chơi mới, người dùng gặp tình huống 1 điện thoại (điện
thoại cũ bé hay chơi) không tự cập nhật do trình duyệt lưu cache bản
trang cũ — hỏi cách xoá cache thì lo mất tiến độ đã lưu (tiến độ chỉ nằm
trong `localStorage` của ĐÚNG 1 trình duyệt/1 máy, xoá "dữ liệu trang
web" — khác "cache/ảnh đệm" — sẽ mất sạch). Yêu cầu: hướng dẫn sao lưu
tiến độ của bé trước khi xoá.

Thay vì chỉ hướng dẫn bằng console trình duyệt (rất khó thao tác trên
điện thoại, đặc biệt iOS Safari không có console nếu không nối máy Mac),
xây hẳn 1 tính năng ngay trong Trang phụ huynh (`app.js`), luôn hiện ở
mọi bản (kể cả GitHub Pages tĩnh, khác khối "Thêm/sửa từ vựng" chỉ hiện
khi chạy qua server quản trị local):

- **💾 Tải file sao lưu**: xuất toàn bộ `store` (progress-store.js) ra 1
  file `.json` tải về máy (`tien-do-<tên bé>-<ngày>.json`), dùng
  `Blob` + `<a download>` — hoạt động bình thường trên trình duyệt thật
  (khác giới hạn sandbox riêng của Claude Artifacts).
- **📂 Khôi phục từ file**: chọn lại file đã tải, đọc bằng `FileReader`,
  kiểm tra hợp lệ (có `words`, đúng `CURRENT_VERSION` — file phiên bản cũ
  hơn báo lỗi rõ ràng thay vì để `migrate()` âm thầm xoá sạch khi tải lại
  trang), hỏi xác nhận (`window.confirm`, có kèm tên hồ sơ trong file để
  phụ huynh biết đang khôi phục đúng bé nào) vì thao tác này THAY THẾ
  toàn bộ tiến độ hiện tại trên máy, rồi `saveProgress()` + tải lại trang.
- Tên file tự động bỏ dấu tiếng Việt (`profile.name` qua NFD normalize +
  xử lý riêng "đ/Đ" — cùng kỹ thuật `cmSlugify()` đã dùng cho content
  manager) để không lỗi ký tự trên hệ điều hành khác nhau.
- Kiểm thử bằng Playwright: xuất file đúng nội dung + đúng tên, xoá sạch
  `localStorage` mô phỏng máy mới/cache bị xoá, nạp lại file vừa xuất →
  tiến độ khôi phục khớp 100% với bản gốc (kiểm tra tới từng LV/next/
  correctCount của 1 từ cụ thể). 29 unit test hiện có vẫn pass nguyên
  (không đụng gì tới `engine/`).

## Vòng 39 — Các ô chọn game không đều cỡ + `app.js` bị cache cũ trên điện thoại

Sau khi thêm game #5, phát hiện 2 lỗi hiển thị thật khi người dùng tự kiểm
tra trên điện thoại:

- **Các ô chọn game không đều cỡ**: `.gamegrid` (lưới 2 cột) không ép các
  HÀNG cao bằng nhau — mỗi hàng tự co theo đúng icon cao nhất của riêng
  hàng đó. Hàng chứa "How Many?" (icon 112px, xem Vòng 32) bị kéo cao hẳn
  (171px), còn hàng chứa "Word Safari" (đứng cạnh ô "Sắp ra mắt" nhỏ,
  40px) chỉ cao 137px — ô "Word Safari" nhìn nhỏ hơn hẳn dù icon của nó
  cùng cỡ 78px với "Help Bill!". Sửa bằng 1 dòng `grid-auto-rows:1fr` —
  ép MỌI hàng cao bằng hàng cao nhất dù lưới không có chiều cao cố định.
  Đo lại bằng Playwright: mọi ô đều 193×171px.
- **`app.js` bị trình duyệt cache bản cũ**: sau khi đẩy tính năng mới lên
  `main` và GitHub Pages build xong, 1 điện thoại (điện thoại cũ bé hay
  chơi) vẫn không thấy tính năng mới dù các thay đổi CSS (nằm ngay trong
  `<style>` của `index.html`) đã cập nhật bình thường — chỉ riêng
  `app.js` (file rời, không có gì báo hiệu cho trình duyệt biết đã có
  bản mới) bị giữ cache. Sửa bằng cách không dùng `<script src="app.js">`
  tĩnh nữa — thay bằng 1 đoạn JS nhỏ tự tạo thẻ `<script type="module">`
  với `src="app.js?v=<Date.now() lúc tải trang>"`, buộc trình duyệt luôn
  coi đây là URL mới → luôn fetch lại. Áp dụng tương tự cho các `<link
  rel="stylesheet">` của từng game (`engine/catch-game.css`,
  `games/*/*.css`) để phòng hờ y hệt.
  - Đã thử thêm Import Map để remap luôn cả các "import" TĨNH bên trong
    `app.js` (import `engine/*.js`, `games/*/*.js` không có query) sang
    bản có `?v=`, nhưng gặp lỗi thật khiến cả trang trắng ("Failed to
    resolve module specifier ... blocked by a null value") — nguyên nhân:
    2 dạng đường dẫn tương đối khác nhau cùng trỏ 1 file (`app.js` dùng
    `./engine/X.js`, còn `games/<slug>/*.js` dùng `../../engine/X.js`)
    được trình duyệt CHUẨN HOÁ theo URL của TÀI LIỆU (`index.html`) khi
    parse Import Map, khiến 2 khoá khác nhau đụng nhau. Đã BỎ HẲN Import
    Map, chỉ giữ cache-bust cho đúng `app.js` — an toàn, đã kiểm thử kỹ
    bằng Playwright (bắt sự kiện `request` xác nhận đúng URL có `?v=`,
    `pageerror` rỗng, vào được Trang phụ huynh — tức toàn bộ chuỗi import
    `engine/games` vẫn chạy đúng).
  - Kiểm thử lại toàn bộ sau khi đổi cấu trúc nạp CSS/JS: 29 unit test
    pass, luồng chơi Word Safari + xuất/nhập file sao lưu + kích thước ô
    chọn game đều hoạt động đúng như trước.

## Vòng 40 — Game #6 "ABC Vui" (bảng chữ cái) — bước nền tảng trước Word Safari

Người dùng phản hồi "Word Safari" (game #5, đọc cả từ) **quá khó** với
bé lớp 1 mới học — đúng thật: bé chưa biết mặt chữ cái thì không thể
"đọc" được chữ nào cả, bất kể từ đó đã quen thuộc qua tai đến đâu. Cần 1
game NỀN TẢNG dạy bảng chữ cái TRƯỚC.

- **Nội dung mới**: `content/packs/alphabet-v1.json` — 26 chữ cái IN HOA
  A-Z (chưa dạy chữ thường, theo yêu cầu người dùng — giữ đơn giản cho
  bước đầu). Mỗi chữ chỉ cần `text_en`/`text_vi`/`emoji` (chính là chữ
  cái đó) — KHÔNG cần ảnh AI, khác mọi content pack trước.
- **Cơ chế**: tái dùng gần như nguyên vẹn cơ chế đã ổn định của "Help
  Bill!" (`games/bill/bill.js`) — 4 thẻ cố định lưới 2×2, nghe âm thanh
  đọc tên 1 chữ cái (không phải cả câu), bấm đúng thẻ thì chữ "bay" về
  nhân vật + chuông vui, bấm sai thì thẻ đúng sáng lên. Chỉ khác: thẻ
  hiển thị CHỮ CÁI TO bằng CSS/font (không phải ảnh minh hoạ) — nên game
  này chạy được ngay, không cần chờ ảnh nào để bắt đầu chơi.
- **Kỹ năng**: Nghe (skill=listen) — dùng chung skill với forest/farm/
  bill (đã có tiền lệ nhiều game share 1 skill trên các vốn từ khác
  nhau), không cần sửa Learning Engine.
- **Nhân vật**: gà con "học trò" (đeo kính), 3 trạng thái cảm xúc — ảnh
  AI-ảnh-ngoài do người dùng tự tạo (Bước 19 trong PROMPT.md), CHƯA có
  lúc build — game chạy với fallback emoji 🐥 to (giống hệt cách
  bill.js/wordsafari.js đã làm, chỉ cần đổi tên file khi ảnh về sau).
- File mới: `games/abc-vui/abcvui.js` + `abcvui.css`, dựng lại đúng cấu
  trúc HTML/CSS của `games/bill/bill.css` (`.billstage`/`.billmascotwrap`
  /`.billmascot`/`.billflyicon`...) nhưng đổi tên lớp thành `abc*` và
  thay phần hiển thị ảnh bằng `.abcletter` (thẻ chữ to, 4 màu nền cố
  định theo vị trí, không theo chữ cái). Nối vào `app.js` (thêm pack vào
  `CONTENT_PACKS`, import, `GAMES`, factory, `render()`/`renderHome()`/
  click handler) + thêm CSS vào danh sách nạp động trong `index.html`
  (Vòng 39).
- Kiểm thử bằng Playwright: 4 thẻ hiện đúng 4 chữ cái ngẫu nhiên, bắt
  đúng chữ đang được đọc (theo dõi `speechSynthesis.speak` thật) rồi bấm
  đúng thẻ → tăng đúng LV kỹ năng "Nghe" của đúng chữ cái đó; luồng trả
  lời sai (đánh dấu đúng/sai + đổi cảm xúc); chơi đủ 10 câu đúng → màn
  thắng cuộc. Đã chụp ảnh QA Trang chủ (6 ô đều 193×171px, khớp
  `grid-auto-rows:1fr` ở Vòng 39) + màn chơi + màn thắng — giao diện đẹp,
  thẻ chữ cái màu sắc rực rỡ dễ phân biệt. 29 unit test hiện có vẫn pass
  nguyên (không đụng gì tới `engine/`). Tính năng Sao lưu/Khôi phục tiến
  độ (Vòng 38) kiểm thử lại vẫn hoạt động đúng sau khi thêm gói nội dung
  mới.

## Vòng 41 — "ABC Vui": thẻ lật ra ảnh minh hoạ khi bấm đúng chữ cái

Nâng cấp theo yêu cầu người dùng: bấm ĐÚNG 1 chữ cái xong, thẻ đó "lật"
sang mặt sau lộ ra ảnh 1 từ vựng bắt đầu bằng đúng chữ cái đó (vd "T" →
ảnh con hổ "Tiger") rồi đọc tên từ đó — nối liền việc nhận mặt chữ với 1
từ có nghĩa cụ thể, thay vì chỉ dừng ở mức "nghe tên chữ cái" khô khan.

- `pickWordForLetter(letterEn)`: tìm NGẪU NHIÊN 1 từ (từ TOÀN BỘ vốn từ,
  không riêng bộ "letter") có `en` bắt đầu bằng đúng chữ cái đó — chọn
  ngẫu nhiên mỗi lần nên cùng 1 chữ cái sẽ ra từ khác nhau qua các lượt
  chơi (đúng yêu cầu "không nhất thiết T là lật ra Tiger"). Trả về `null`
  nếu chưa có từ nào khớp — nơi gọi tự bỏ qua bước lật, giữ nguyên hành
  vi cũ (đúng yêu cầu "chữ chưa có từ thì không cần lật, có từ mới thì
  lật" — tự động theo vốn từ hiện có, không cần sửa code khi thêm từ).
- Đổi cấu trúc thẻ chữ cái thành "thẻ lật" 2 mặt bằng CSS 3D transform
  (`transform-style:preserve-3d` + `rotateY(180deg)` + `backface-
  visibility:hidden`) — mặt trước là chữ cái màu (như cũ), mặt sau là ảnh
  từ vựng (`flipTileToReveal()`), viền sáng đúng/sai chuyển từ gắn trên
  chữ cái sang gắn trên cả thẻ lật để thấy được dù đang ở mặt nào.
- **Lỗi thật gặp phải lúc build**: `.abcflipcard` là `<span>` (inline mặc
  định) — khai báo `width:100%; height:100%` không có tác dụng gì trên
  phần tử inline, khiến cả thẻ co về đúng 0×0 (phát hiện bằng
  `getBoundingClientRect()` khi debug ảnh lật không hiện gì cả dù đã tải
  đúng). Sửa bằng cách thêm `display:block` cho `.abcflipcard`.
- Trình tự phát âm khi lật: đọc tên chữ cái xong (như cũ) → đợi 1 nhịp →
  lật thẻ → đợi lật xong mới đọc tên từ vựng — tránh chồng audio (đúng
  nguyên lý đã áp dụng từ Vòng 18/35). Thời gian trước khi chuyển câu tiếp
  theo giãn ra (900ms → ~2700ms) CHỈ khi có lật; chữ cái chưa có từ khớp
  vẫn giữ nguyên nhịp độ cũ.
- Kiểm thử bằng Playwright: xác nhận đúng cặp chữ cái → từ được lật + đọc
  (vd K→Koala, N→notebook, D→Donkey), xác nhận chữ chưa có từ khớp (vd
  V/X) KHÔNG lật, luồng trả lời sai + chơi đủ 10 câu thắng cuộc vẫn đúng
  sau khi đổi timing. 29 unit test vẫn pass nguyên (không đụng `engine/`).

## Vòng 42 — Game #7 "Kitchen" — bấm thẳng lên ảnh nền, cơ chế hoàn toàn mới

Xây hoàn chỉnh game thứ 7, theo ảnh bếp thật của gia đình người dùng gửi
làm cảm hứng vẽ nền. **Cơ chế khác hẳn 6 game trước**: không dùng thẻ/
icon rời — cả 10 đồ vật (tủ bếp, bếp, nồi, nồi cơm điện, bồn rửa, bát,
đĩa, quạt, ghế, bàn) đều nằm chung trong 1 ẢNH NỀN BẾP DUY NHẤT
(`assets/backgrounds/kitchen-bg.jpg`). Mỗi câu hỏi, 4 trong 10 đồ vật đó
SÁNG NHẤP NHÁY (viền vàng, animation `kitchenPulse`) ngay tại đúng vị trí
của nó trong ảnh, nghe âm thanh đọc tên 1 món, bé bấm THẲNG vào đúng vị
trí trong ảnh — không phải bấm vào ô thẻ như mọi game trước.

- **Toạ độ (`HOTSPOTS` trong `games/kitchen/kitchen.js`)**: đo trực tiếp
  bằng mắt sau khi nhận ảnh thật từ người dùng — viết 1 script Python vẽ
  khung màu đè lên đúng ảnh thật, xem lại, chỉnh sửa toạ độ, vẽ lại tới
  khi khớp hoàn toàn trước khi đưa vào code (2 lần lặp: lần 1 khớp gần
  hết, chỉ chỉnh lại vùng ghế/bàn bị chồng lấn nhẹ). Quy trình này CHỈ áp
  dụng được SAU khi có ảnh thật — khác các game thẻ rời (forest/farm/
  bill/abcvui) vốn build code được trước khi có ảnh vì không phụ thuộc bố
  cục cụ thể.
- **`.kitchenstage` khoá đúng tỉ lệ khung hình gốc** (1536:2752, qua CSS
  `aspect-ratio` + `object-fit:cover` trên khung đã đúng sẵn tỉ lệ đó) —
  khác `worldBg()` mặc định (chỉ trang trí, cắt ảnh thoải mái theo tỉ lệ
  màn hình thật). Nếu dùng `worldBg()` thông thường, ảnh sẽ bị crop khác
  nhau tuỳ màn hình, làm toạ độ % không còn khớp đúng vị trí thật —
  đây là lý do game này cần 1 kỹ thuật hiển thị ảnh riêng, không tái dùng
  được các game trước.
- Nội dung mới: `content/packs/kitchen-v1.json` — 10 đồ vật, `category:
  "object"` cùng `objects-v1.json` (gộp chung 1 "Bộ từ" ở Trang phụ
  huynh), `subcategory: "kitchen"` riêng để lọc đúng 10 món này
  (`wordsInCat(WORDS,'object','kitchen')`). Không có ảnh riêng từng món
  (đã nằm sẵn trong ảnh nền chung) — chỉ dùng `emoji` làm ảnh đại diện
  cho dòng trong bảng báo cáo Trang phụ huynh.
- Kỹ năng: Nghe (skill=listen) — dùng chung skill với forest/farm/bill/
  abcvui, không cần sửa Learning Engine. Đích thắng cuộc = 10 (đúng bằng
  cỡ vốn từ, giống "How Many?").
- Nhân vật mèo đầu bếp 3 trạng thái — ảnh AI-ảnh-ngoài do người dùng gửi
  (Bước 20 PROMPT.md), đã xử lý xoá nền + resize 900×900 xong ngay khi
  build (khác Word Safari/ABC Vui trước đây phải build trước rồi chờ ảnh
  sau — lần này người dùng gửi ảnh trước khi yêu cầu build).
- Kiểm thử bằng Playwright: 4 vùng bấm hiện đúng vị trí + đúng nhãn, bấm
  đúng/sai đều tính điểm đúng kỹ năng "Nghe", chơi đủ 10 câu ra màn thắng
  cuộc. Đã chụp ảnh QA xác nhận 4 khung vàng nhấp nháy khớp CHÍNH XÁC vị
  trí đồ vật thật trong ảnh (tủ bếp/nồi/bát/bàn). 7 ô Trang chủ vẫn đều
  cỡ (`grid-auto-rows:1fr`, Vòng 39). Tính năng Sao lưu tiến độ (Vòng 38)
  và game "ABC" (Vòng 41) kiểm thử lại vẫn hoạt động đúng. 29 unit test
  hiện có vẫn pass nguyên (không đụng `engine/`).

## Vòng 43 — "Kitchen": sửa 4 phản hồi người dùng sau bản đầu

Người dùng chơi thử bản Vòng 42 và phản hồi 4 điểm cần sửa:

1. **2 ảnh bếp đè lên nhau, lệch nhau ở viền**: `worldBg('kitchenphoto')`
   (phủ kín màn hình theo `background-size:cover`, cắt ảnh theo tỉ lệ
   MÀN HÌNH thật) và `.kitchenstage` (khoá đúng tỉ lệ ẢNH GỐC, xem Vòng
   42) cùng hiện `kitchen-bg.jpg` nhưng crop khác nhau theo 2 tỉ lệ khác
   nhau — tạo cảm giác "2 bản ảnh" lệch mép nhau. Sửa bằng cách bỏ hẳn
   ảnh khỏi lớp nền trang trí, chỉ để 1 màu đặc ấm gần tông ảnh
   (`.world-bg.kitchenphoto{background:#F5DCC3;}`) — chỉ `.kitchenstage`
   mới hiện ảnh thật.
2. **Khung vuông khoanh đồ vật xấu, cần viền phát sáng đúng hình dạng
   thật**: đây là điểm khó nhất — đã thử `tools/remove_white_bg.py` (chỉ
   xoá được nền TRẮNG, không dùng được cho nền màu bếp) rồi chuyển sang
   thuật toán **GrabCut** (OpenCV, cài thêm `opencv-python-headless`):
   cắt riêng 10 vùng ảnh (theo đúng toạ độ đã đo ở Vòng 42, có nới thêm
   biên), chạy GrabCut xoá nền cho từng vùng → 10 ảnh PNG nền trong suốt
   CẮT ĐÚNG HÌNH DẠNG thật của từng đồ vật (`assets/kitchen/<id>.png`),
   đặt đè CHÍNH XÁC lên đúng vị trí gốc trong ảnh nền. Hiệu ứng phát sáng
   đổi từ `box-shadow` (khung chữ nhật) sang `filter:drop-shadow` trên
   chính ảnh trong suốt đó — drop-shadow chạy theo ĐÚNG VIỀN ALPHA của
   ảnh, ôm sát viền thật. Vài đồ vật (quạt/ghế/bàn) segment lần đầu bị
   dính thêm mép tủ bếp phía trên hoặc mất chân bàn/ghế mảnh — chỉnh lại
   toạ độ crop (bớt biên trên) + tham số GrabCut (margin/số vòng lặp) cho
   từng món tới khi sạch, xác nhận bằng cách ghép cả 10 ảnh trở lại đúng
   vị trí trên ảnh gốc — khớp liền mạch, không thấy vết ghép.
3. **Đúng/sai chỉ đổi màu xanh/đỏ, khó nhìn, cần thêm âm thanh**: thêm
   `playBuzz()` (tiếng "bíp" trầm đi xuống, dùng Web Audio) cho câu SAI —
   trước đây chỉ có tiếng "ting" lúc ĐÚNG, sai thì im lặng hoàn toàn.
   Thêm dấu ✓/✗ to, nổi bật (nền tròn xanh/đỏ, viền trắng, hiệu ứng bung
   ra) hiện ngay tại đúng vị trí vừa bấm — tín hiệu không phụ thuộc màu
   sắc, rõ ràng hơn hẳn so với chỉ đổi viền phát sáng.
4. **Mèo đầu bếp quá bé, nên to + ở giữa**: phóng to 26% → 40% chiều
   rộng khung ảnh, chuyển từ góc dưới-phải ra đúng khoảng sàn trống giữa
   quạt và bộ bàn ghế (không đè lên vùng bấm nào), thêm nhịp "nhún nhảy"
   nhẹ tại chỗ liên tục (`kitchenMascotBob`) cho có sức sống — thay cho ý
   tưởng gốc "nhảy lên bàn" (phức tạp hơn nhiều, dễ che mất vùng bấm khi
   di chuyển qua nhiều vị trí, đơn giản hoá thành nhún tại chỗ).

Kiểm thử lại toàn bộ bằng Playwright sau khi sửa: luồng đúng/sai/thắng
cuộc vẫn hoạt động đúng, badge + màu phát sáng đúng vị trí, 7 ô Trang chủ
vẫn đều cỡ, tính năng Sao lưu tiến độ không bị ảnh hưởng. 29 unit test
vẫn pass nguyên.

## Vòng 44 — Thiết kế lại Trang chủ: gọn trong 1 màn hình trình duyệt web

7 game giờ đã vượt quá 1 màn hình khi chơi qua trình duyệt web (khác app
cài đặt) — thanh địa chỉ + thanh điều hướng của trình duyệt di động chiếm
mất 1 phần chiều cao thật nhìn thấy được, bé phải cuộn cả trang mới thấy
hết. Người dùng yêu cầu thiết kế lại theo 3 điểm:

1. **Đẩy "Chào Bòng!" + điểm số lên kịch trên**: `.content` mặc định có
   `padding-top:100px` (dành chỗ cho linh vật nổi ở các MÀN CHƠI khác) —
   quá thừa cho Trang chủ. Thêm class `.content.homepage` riêng, ghi đè
   `padding-top` xuống còn 14px chỉ cho màn này, không ảnh hưởng màn khác
   vẫn dùng `.content` gốc.
2. **Lưới 3×2 (trước 2 cột không giới hạn hàng), cuộn riêng khi nhiều
   hơn 6 game, bỏ hẳn ô "Sắp ra mắt"**: `.gamegrid` đổi
   `grid-template-columns:1fr 1fr` → `repeat(3,1fr)`. Bọc thêm
   `.gamegrid-scroll` (flex:1, `overflow-y:auto`, `min-height:0` — bắt
   buộc phải có `min-height:0` thì flex item mới chịu co nhỏ hơn nội
   dung của nó để cuộn được, thiếu dòng này flex item sẽ tự giãn ra theo
   đúng chiều cao nội dung, đẩy tràn thay vì cuộn) — chỉ khối lưới này
   cuộn riêng, không phải cuộn cả trang. Xoá ô "Sắp ra mắt" cuối cùng
   khỏi mảng `GAMES` trong `app.js` (đủ 7 game thật, không còn placeholder
   nào).
3. **Cú thông thái + nút "Dành cho phụ huynh" gộp thành 1 thanh cố định ở
   dưới cùng**: trước đây Cú chiếm nguyên 1 hàng riêng
   (`flex:1;min-height:56px`) rồi mới tới nút phụ huynh đứng riêng bên
   dưới — 2 khối cộng lại tốn khá nhiều chiều cao. Gộp lại thành 1 hàng
   ngang `.homebottombar` (Cú thu nhỏ 72px→46px + nút phụ huynh nằm cạnh
   nhau, nút giãn `flex:1` lấp hết chỗ còn lại) — luôn hiện cố định
   (`flex:none`, đứng NGOÀI phần `.gamegrid-scroll` nên không bị cuộn
   mất), đúng mục tiêu người dùng "toàn bộ hiển thị gọn trong 1 màn
   hình".
   - Đồng thời thu nhỏ padding/gap/icon/chữ của `.gametile` (16px→10px
     padding, 2.1rem→1.6rem emoji, .86rem→.68rem tên) cho vừa 3 cột thay
     vì 2 — icon riêng từng game (ảnh nền + nhân vật nổi) đa phần đã
     dùng đơn vị % nên tự co giãn theo đúng tỉ lệ mà không cần sửa CSS
     riêng của từng file `games/<slug>/*.css`.

Kiểm thử bằng Playwright ở 2 kích thước viewport khác nhau (bình thường
và "thấp" mô phỏng trình duyệt di động chiếm nhiều chỗ): xác nhận toàn bộ
Trang chủ (thanh hồ sơ + lưới + thanh dưới) vừa đúng 1 màn hình ở viewport
thường; ở viewport thấp, lưới tự cuộn lộ dần hàng 3 trong khi thanh hồ sơ
+ thanh dưới vẫn luôn hiện đúng vị trí. Bấm chọn game/nút phụ huynh vẫn
hoạt động đúng, tính năng Sao lưu tiến độ không bị ảnh hưởng, 29 unit
test vẫn pass nguyên.

## Vòng 45 — Sửa lại Vòng 44 theo đúng phản hồi: 2 cột (không phải 3) + hết lỗi phải cuộn cả trang

Người dùng phản hồi bản Vòng 44 làm SAI 2 điểm quan trọng:

1. **Hiểu nhầm "3x2" thành 3 cột × 2 hàng** — ý người dùng là **3 HÀNG ×
   2 CỘT** (giữ nguyên 2 cột như thiết kế gốc, chỉ giới hạn chiều CAO
   hiển thị còn ~3 hàng). Đổi `.gamegrid` lại `grid-template-columns:1fr
   1fr` (2 cột, không phải `repeat(3,1fr)`), khôi phục lại kích thước ô
   `.gametile` gần với bản gốc (chỉ giảm nhẹ so với bản gốc, không giảm
   mạnh như bản 3 cột).
2. **Trang vẫn phải cuộn cả trang trên điện thoại thật, dù không tái
   hiện được khi kiểm thử bằng Playwright** — nguyên nhân thật: `.stage`/
   `.world` dùng `min-height:100vh` thuần CSS, còn `.content.homepage`
   (Vòng 44) dùng `100dvh`. Trên trình duyệt di động, "100vh" tính theo
   chiều cao TOÀN PHẦN màn hình (coi như đã ẩn hết thanh địa chỉ/thanh
   điều hướng) — LỚN HƠN hẳn phần thực sự đang nhìn thấy khi các thanh đó
   còn hiện. `.stage`/`.world` (lớn hơn) bọc ngoài `.content.homepage`
   (vừa khít phần nhìn thấy) tạo ra khoảng trống thừa phía dưới, buộc
   phải cuộn cả trang mới thấy hết — dù nội dung THẬT bên trong
   `.content.homepage` đã vừa đúng khung hình. Không tái hiện được bằng
   Playwright vì môi trường đó không có thanh trình duyệt che khuất, nên
   "100vh" ở đó vốn đã đúng bằng phần nhìn thấy — chỉ lộ ra trên điện
   thoại thật.
   - Sửa triệt để bằng biến CSS `--app-vh`, tính bằng JS
     (`window.visualViewport.height` ưu tiên hơn `window.innerHeight` vì
     phản ánh đúng vùng nhìn thấy hơn) trong `app.js`, ghi lại mỗi khi
     đổi kích thước/xoay màn hình/thanh trình duyệt ẩn-hiện
     (`resize`/`orientationchange`/`visualViewport resize`). `.stage`/
     `.world`/`.content.homepage` đều dùng `var(--app-vh, 100vh)` —
     không còn lệch nhau giữa 2 đơn vị đo khác nhau nữa. Chắc chắn hơn
     hẳn chỉ dựa vào `100dvh` (dvh tuy hỗ trợ khá rộng nhưng WebView/
     trình duyệt cũ có thể chưa đúng).

Kiểm thử lại bằng Playwright ở viewport mô phỏng "chiều cao thật nhìn
thấy nhỏ hơn" (390×700): xác nhận `--app-vh` đúng bằng viewport,
`document.documentElement.scrollHeight` KHÔNG vượt quá viewport (trang
không cần cuộn), lưới 2 cột × 3 hàng hiện đủ + hàng 4 (Kitchen) tự cuộn
lộ ra khi vuốt lên trong đúng khối `.gamegrid-scroll`. Bấm chọn game/nút
phụ huynh vẫn hoạt động đúng, tính năng Sao lưu tiến độ + kích thước 7 ô
vẫn nhất quán, 29 unit test vẫn pass nguyên.

## Vòng 46 — Sửa lỗi Kitchen: ảnh bếp bị thu bé lại 1 khung, không full trang

Người dùng phản hồi: "Game kitchen, ảnh không full cả trang mà chỉ bé lại
1 khung. Tôi muốn nó phải full cả trang như các game khác".

Nguyên nhân: `.kitchenstage` dùng công thức CSS cố định
`width:min(100%, calc((100vh - 210px) * 0.5581))` để vừa giữ đúng tỉ lệ
khung hình gốc (1536:2752, bắt buộc vì các vùng bấm trong `GLOW_ASSETS`
định vị theo % toạ độ tính trên đúng ảnh gốc) vừa "đoán" chiều cao còn
trống sau khi trừ topbar/nút loa bằng con số "210px" cố định. Con số này
chỉ đúng trên 1 kích thước màn hình cụ thể lúc viết — trên phần lớn thiết
bị thật, khoảng trống thật còn lại khác xa 210px, khiến công thức tính ra
kích thước nhỏ hơn nhiều so với không gian thực sự có, tạo cảm giác ảnh
"bị thu bé lại 1 khung". Ngoài ra `.content` mặc định còn có
`padding-top:100px` (dành chỗ cho linh vật nổi TRÊN topbar ở các game
khác) mà Kitchen không dùng tới, càng lãng phí thêm không gian dọc.

Sửa bằng cách đo THẬT thay vì đoán bằng công thức:

- Thêm `.content.kitchencontent{padding-top:14px; padding-bottom:8px;}`
  ghi đè `padding-top:100px` mặc định, trả lại phần lớn không gian dọc
  lãng phí cho khung ảnh.
- Bọc `.kitchenstage` trong `.kitchenstagewrap` (flex:1, min-height:0) —
  chiếm chính xác hết khoảng trống còn lại giữa topbar và nút loa.
- Thêm hàm `fitKitchenStage()` trong `kitchen.js`: đo kích thước THẬT của
  `.kitchenstagewrap` bằng `getBoundingClientRect()`, tính kích thước lớn
  nhất có thể vừa khít (so sánh vừa theo chiều rộng và theo chiều cao,
  lấy cách nào cho ảnh nhỏ hơn) rồi gán trực tiếp `width`/`height` bằng
  pixel cho `.kitchenstage` — luôn khớp đúng không gian thực tế của thiết
  bị đang chạy, không còn phụ thuộc 1 con số đoán trước. Gọi lại hàm này
  mỗi khi resize màn hình (chỉ khi đang ở màn Kitchen).

Kiểm thử bằng Playwright ở viewport mô phỏng điện thoại (390×780): khung
ảnh tăng từ ~300×538 (khi chỉ sửa riêng phần đo JS, chưa bỏ padding thừa)
lên ~348×624 trên tổng khung chứa 358×624 (~97% bề rộng, gần như kín khung
— đúng như các game khác). Tỉ lệ khung hình vẫn giữ đúng ~0.5577 so với
gốc 0.5581 (vùng bấm không bị lệch vị trí). Resize sang kích thước khác
(430×900) khung ảnh tự tính lại đúng (398×713). Chạy lại toàn bộ luồng
chơi Kitchen (trả lời đúng lẫn sai đủ 10 vòng): thứ tự vùng sáng, nhãn
audio, badge ✓/✗, đổi tâm trạng mèo đầu bếp, màn thắng cuộc — tất cả vẫn
hoạt động đúng như trước. 29 unit test vẫn pass nguyên.

## Vòng 47 — Game #8 "Butterfly Garden" (Màu sắc)

Game mới dạy 6 màu cơ bản tiếng Anh (red/blue/yellow/green/black/white —
vốn từ `content/packs/colors-v1.json` đã có sẵn từ trước nhưng chưa game
nào dùng tới). Người dùng chọn linh vật **bướm**, ban đầu đề xuất cơ chế
"bắt bướm đúng màu đang bay" nhưng sau khi kiểm tra lại code thì phát
hiện app KHÔNG còn cơ chế "bắt vật di chuyển" nào để tái dùng nữa — lịch
sử trước đây (Mystic Jungle/My Little Farm) từng làm animal chạy/bay tự
do nhưng đã bị chủ động bỏ hẳn vì lý do ổn định + độ chính xác chạm trên
điện thoại (xem Vòng 25-29). Trình bày lại rủi ro này cho người dùng,
chốt lại thành bản TĨNH: 6 con bướm đứng yên ở vị trí cố định, có nhịp
"vỗ cánh" nhẹ tại chỗ (xoay + phóng to nhẹ qua lại) để không đứng chết.

**Khác mọi game trước — không cần ảnh AI mới để chơi được ngay:**
- Vốn từ chỉ có đúng 6 màu (nhỏ hơn hẳn 10+ của các game khác) nên hiện
  ĐỦ CẢ 6 con bướm mỗi vòng (không phải 4 trong N từ lớn hơn như forest/
  farm/bill/kitchen) — đúng tinh thần "tìm đúng giữa nhiều lựa chọn cùng
  hiện" mà không cần chuyển động thật.
- 6 con bướm vẽ bằng **SVG nội tuyến** (không phải ảnh PNG) — tô ĐÚNG mã
  màu hex của từng từ (`BUTTERFLY_HEX` trong `butterflygarden.js`), đảm
  bảo "con bướm đỏ" chắc chắn là màu đỏ thật, việc ảnh AI khó cam kết
  tuyệt đối. Vị trí 6 "chỗ đậu" (`BUTTERFLY_SPOTS`) cũng là số liệu cố
  định (dàn vòng quanh linh vật dẫn đường ở giữa), không cần đo trên ảnh
  thật như `GLOW_ASSETS` của Kitchen.
- Màn chơi dùng tạm nền cỏ cây/trời xanh dùng chung ở Trang chủ
  (`worldBg()` không tham số) thay vì ảnh nền riêng — ảnh nền vườn hoa
  riêng đưa sang hạng mục NÂNG CẤP SAU (không bắt buộc), xem Bước 21
  trong PROMPT.md.
- Linh vật dẫn đường (3 trạng thái cảm xúc) CHƯA có ảnh thật, dùng tạm 1
  emoji chung 🦋 cho cả 3 trạng thái (Unicode không có sẵn bộ emoji bướm
  vui/buồn riêng như bộ mèo 🐱/😻/😿 của Kitchen) — người dùng có thể tự
  tạo ảnh theo đúng 3 prompt ở Bước 21 khi rảnh, code đã trỏ sẵn đúng 3
  tên file, ảnh về là tự hiện luôn không cần sửa gì thêm.

Nhờ vậy game đã CHẠY ĐƯỢC ĐẦY ĐỦ ngay hôm nay — không phải chờ thêm 1
vòng tạo ảnh mới có game chơi được, khác hẳn Kitchen (bắt buộc phải có
ảnh nền thật mới đo được toạ độ mới viết được code).

Cơ chế phản hồi đúng/sai tái dùng gần nguyên vẹn kỹ thuật đã kiểm chứng
ở Kitchen (Vòng 43): dấu ✓/✗ to rõ ràng + tiếng "ting"/"buzz" + phát sáng
viền xanh/đỏ — chỉ thêm 1 hiệu ứng riêng cho game này (bật/tắt nhịp vỗ
cánh, phóng to xoay nhẹ lúc đúng, lắc ngang lúc sai). Khác Kitchen/Bill:
KHÔNG cần thay slot/tái tạo DOM khi qua vòng mới (đủ cả 6 màu cố định
suốt lượt chơi) — chỉ cần xoá lớp đúng/sai + dấu ✓/✗ cũ rồi chọn lại từ
mục tiêu trong đúng 6 từ đang có, đơn giản hơn hẳn.

Kiểm thử bằng Playwright (viewport 390×780, giả lập TTS để tự động chơi):
xác nhận đủ 6 con bướm hiện đúng nhãn màu, chơi hết 10 vòng trả lời đúng
tới màn thắng cuộc; riêng luồng trả lời sai xác nhận đúng con bị bấm sai
sáng viền đỏ + dấu ✗, con đúng sáng viền xanh + dấu ✓, linh vật chuyển
tâm trạng buồn, qua vòng mới thì toàn bộ lớp/dấu cũ được dọn sạch đúng
như thiết kế. Trang chủ hiện đúng ô game mới (nền gradient pastel tạm +
mặt bướm lắc lư, rơi về fallback emoji đúng như dự kiến vì ảnh linh vật
chưa tồn tại). 29 unit test vẫn pass nguyên.

## Vòng 48 — Butterfly Garden: ảnh bướm AI thật + chuẩn bị âm thanh thu sẵn (VoiceStudio)

Hai nhánh việc liên tiếp từ phản hồi người dùng:

**1. "Con bướm bạn làm đơn điệu và không đẹp"** — 6 con bướm SVG vẽ tạm
ở Vòng 46 bị chê đơn điệu, người dùng muốn ảnh AI đẹp hơn, có hiệu ứng
lấp lánh (con thích phong cách này). Đã viết prompt tạo ảnh riêng cho
từng màu ở Bước 22 trong PROMPT.md (nhấn mạnh màu cánh chủ đạo phải rõ
ràng, lấp lánh chỉ là phụ — tránh lấn át mục tiêu dạy màu, nhất là con
đen dễ bị lấp lánh biến thành màu khác). Đồng thời sửa trước
`hotspotsHtml()` trong `butterflygarden.js` để ưu tiên hiện ảnh thật
`assets/butterflies/<id>.png`, rơi về SVG cũ nếu ảnh chưa tồn tại —
người dùng gửi ảnh qua Git là tự động lên, không cần báo lại.

Trong lúc sửa, phát hiện + sửa luôn 2 lỗi: (1) animation xoay/phóng to
gắn thẳng lên nút bấm khiến vùng bấm liên tục đổi theo animation, kém ổn
định khi chạm (Playwright báo phần tử "not stable" — dấu hiệu thật của
rủi ro tương tự trên tay bé) — tách animation ra 1 lớp con
`.butterflyvisual` bên trong, giữ nút bấm đứng yên; (2) thiếu CSS
`[hidden]{ display:none }` cho `.butterflyimg` khiến icon "ảnh vỡ" vẫn
hiện dù đã set `hidden=true` trong JS (cùng lỗi/cách sửa đã gặp với
`.billfallback[hidden]`/`.kitchenfallback[hidden]` trước đây).

**2. Muốn dùng VoiceStudio (app TTS chạy máy tính, có MCP) để tạo âm
thanh chất lượng cao thay cho giọng Web Speech API hiện tại** (vốn phụ
thuộc giọng máy, từng gây lỗi đọc lạ như "rice cooker" — xem Vòng 43).
Người dùng ban đầu hiểu nhầm phiên làm việc đang trò chuyện = máy tính/
Claude Desktop thật của họ, muốn nhờ cài VoiceStudio + gắn MCP "thẳng
vào Claude app trên desktop này" — đã giải thích rõ đây là môi trường
đám mây tách biệt, không có quyền truy cập máy/Claude Desktop thật của
người dùng, và người dùng xác nhận chọn hướng tự cài trên máy thật (qua
AskUserQuestion).

Chuẩn bị sẵn phía code trước khi có file âm thanh thật, đúng tinh thần
đã làm với ảnh — viết `createFileFirstAudioProvider()` trong
`engine/audio-provider.js` (đúng điểm mở rộng đã ghi chú sẵn từ trước:
"1 provider trả file audio thu sẵn... cùng interface để có thể hoán đổi
mà không đổi code gọi nó"):
- `slugifyAudioText(text)`: rút gọn CHÍNH CÂU đang đọc (không phải "id"
  của từ) thành tên file an toàn — khoá theo câu vì đó mới là thứ cần
  phát ra loa, nhất quán dù ở game nào.
- `assets/audio/en/manifest.json` (khởi tạo mảng rỗng `[]`): danh sách
  câu đã có file thật — tra trong bộ nhớ (Set), KHÔNG dò từng câu qua
  mạng (speak() gọi rất thường xuyên, dò lỗi 404 liên tục sẽ chậm).
  Manifest rỗng/chưa tồn tại thì game chạy y hệt bản Web Speech thuần
  hiện tại, không lỗi gì.
- Câu có trong manifest: phát `assets/audio/en/<slug>.wav` (đúng định
  dạng VoiceStudio xuất sẵn, không cần đổi định dạng); lỗi phát thật
  (hiếm) hoặc bị chặn autoplay thì rơi về Web Speech, không im lặng.
  Câu chưa có: đi thẳng qua Web Speech như cũ.

Viết hướng dẫn đầy đủ ở Bước 23 trong PROMPT.md: cài VoiceStudio, cấu
hình MCP vào Claude Desktop THẬT trên máy người dùng (ví dụ JSON cấu
hình cụ thể), rồi nhờ CHÍNH Claude Desktop đó đọc `prompt_audio_text`
trong mọi `content/packs/*.json`, chọn CỐ ĐỊNH 1 giọng duy nhất, tạo file
theo đúng quy tắc đặt tên của `slugifyAudioText()`, gửi qua Git — có thể
gửi từng phần (không cần đủ hết ~150 từ mới gửi) vì cơ chế ưu tiên/rơi về
đã xử lý đúng cho cả 2 trạng thái.

Kiểm thử bằng Playwright (giả lập TTS + phát bướm màu qua đủ 10 vòng
đúng/sai, riêng luồng âm thanh xác nhận vẫn phát đúng qua Web Speech khi
manifest rỗng, không lỗi console): tất cả pass. 29 unit test vẫn pass
nguyên.

## Vòng 49 — Nhận bàn giao từ máy người dùng: 122 file âm thanh thật + 6 ảnh bướm AI

Người dùng đã tự làm xong Bước 21-23 trên máy Windows thật (VoiceStudio
+ MCP gắn vào cả Claude Desktop lẫn Claude Code) và push thẳng lên
`main` (không qua tôi) — bao gồm cả việc RÀ SOÁT/SỬA LẠI Bước 23 trong
PROMPT.md cho đúng thực tế cài bằng bản `.msi` trên Windows (khác bản
nháp ban đầu viết theo kiểu cài từ mã nguồn), viết mới
`tools/gen-audio-voicestudio.mjs` (script sinh audio gọi thẳng REST API
của VoiceStudio, không qua MCP vì `generate_speech` qua MCP trả base64
tốn token), và `.mcp.json` (cấu hình MCP dùng chung cho Claude Code khi
mở đúng thư mục repo). Việc của tôi ở vòng này là RÀ SOÁT lại toàn bộ
trước khi báo đã xong, theo đúng yêu cầu "kiểm tra lại và update tiến
trình công việc".

**Đã xác minh:**
- `assets/audio/en/manifest.json` (122 slug) khớp CHÍNH XÁC với 122 file
  `.wav` thật đang có trong `assets/audio/en/` — không thiếu không thừa.
- Đối chiếu với TOÀN BỘ trường `prompt_audio_text` trong mọi
  `content/packs/*.json` (viết script Python so khớp qua `slugifyAudioText`
  y hệt logic trong `engine/audio-provider.js`): phủ đúng 100% — 122/122
  câu trong content pack đều có file, không câu nào bị bỏ sót, cũng
  không có slug thừa (rác từ nội dung cũ đã xoá).
- Kiểm thử bằng Playwright thật (chặn `speechSynthesis` để phát hiện có
  rơi về Web Speech hay không, theo dõi request mạng tới
  `assets/audio/en/`): vào Butterfly Garden phát đúng file
  `white.wav`/`blue.wav`, vào Help Bill! phát đúng file
  `i_want_a_ball.wav` (câu dài, không phải từ đơn) — CẢ HAI đều 0 lần
  rơi về Web Speech. 6 ảnh bướm AI (Bước 22, tạo bằng Google Flow) hiện
  đúng qua `<img>` thật (900×900, không rơi về fallback SVG) — nhìn đẹp
  và lấp lánh rõ rệt hơn hẳn bản SVG cũ. 29 unit test vẫn pass nguyên.
- Chất lượng giọng: người dùng đã tự phát hiện giọng mặc định
  `demo0001` (giọng kể chuyện điện ảnh có sẵn) đọc "lướt", không hợp để
  bé tập nghe từng từ — tự đo đạc kỹ (âm lượng dB, phát hiện file rỗng
  tiếng) rồi chuyển sang giọng nữ clone từ 1 mẫu ElevenLabs 19,7 giây,
  đọc chậm hơn (speed 0.85). Kết quả đo lại: 0/122 file rỗng tiếng, âm
  lượng đều hơn (-23,4..-12,0 dB so với -29,1..-17,5 dB của bộ cũ).

**2 điểm cần lưu ý, đã báo lại người dùng thay vì tự xử lý:**
1. `tools/gen-audio-voicestudio.mjs` vẫn có `PROFILE = ... || 'demo0001'`
   làm mặc định — nếu sau này thêm từ mới vào content pack rồi chạy lại
   script mà QUÊN truyền `VS_PROFILE=<id giọng đã clone>`, từ mới sẽ bị
   đọc bằng giọng demo0001 cũ, lệch giọng với 122 từ hiện có. Tài liệu
   Bước 23 chưa cập nhật lại theo đúng giọng mới đang dùng thật trong
   repo — cần người dùng tự bổ sung ID giọng đã clone vào ghi chú khi
   rảnh (tôi không có quyền truy cập danh sách giọng trên máy họ).
2. `assets/howmany/calculator.jpeg` (ảnh gốc máy tính bấm tay cho nút
   xác nhận "How Many?", Bước 16.4) đã được gửi lên nhưng CHƯA xử lý —
   `games/how-many/howmany.js` vẫn đang trỏ tới `calculator.png` cũ, chưa
   bị ảnh hưởng gì. Xử lý ảnh này (xoá nền + xuất .png, ghi đè lên
   `calculator.png` đã tồn tại sẵn trong repo) thuộc diện phải hỏi xác
   nhận trước theo đúng quy tắc trong CLAUDE.md ("Bắt buộc hỏi trước khi
   chỉnh sửa ảnh có sẵn") — chưa tự ý làm, chờ người dùng xác nhận.

## Vòng 50 — Xử lý 2 việc còn tồn ở Vòng 49

Người dùng xác nhận xử lý cả 2 điểm tồn đọng.

**1. `calculator.png`** — chạy `tools/process-incoming-images.mjs
assets/howmany assets/howmany --yes` để xoá nền `calculator.jpeg` mới
gửi, xuất `calculator.png` (900×900, nền trong suốt, đã kiểm alpha=0 ở
4 góc). Trong lúc chạy phát hiện NGAY 1 lỗi thật: vì nguồn=đích cùng là
`assets/howmany`, script xử lý LUÔN CẢ 4 ẢNH CŨ đã xong từ trước
(daisy/rose/sunflower/tulip) dù người dùng chỉ xác nhận cho đúng 1 ảnh
calculator — cơ chế dedup cũ (thêm ở Vòng 48 trước, xem commit
`d671500`) chỉ loại được trường hợp 2 file cùng stem khác đuôi
(`calculator.jpeg` + `calculator.png` cũ), không loại được 4 file `.png`
ĐƠN LẺ (không có bản gốc `.jpg/.jpeg/.webp` đi kèm) đã qua xử lý từ
trước — các file này vẫn lọt qua bộ lọc và bị xử lý lại vô ích, có nguy
cơ xấu dần do xoá nền/co nhỏ nhiều lần mất chi tiết (đúng rủi ro mà
chính script đã ghi chú ở lần sửa trước). Phát hiện qua `git status`
ngay sau khi chạy (thấy 5 file đổi thay vì đúng 1), khôi phục lại 4 ảnh
không liên quan bằng `git restore` trước khi commit gì cả — không có ảnh
nào bị mất/hỏng thật sự vì đã bắt kịp trước khi push.

Sửa tận gốc: khi nguồn=đích, bỏ hẳn file `.png` ĐƠN LẺ khỏi danh sách xử
lý (không có gì mới để làm với nó) — chỉ giữ lại các trường hợp có bản
gốc non-png thật sự mới cần xử lý. Chạy lại xác nhận đúng 1 file
(calculator) được xử lý. Kiểm bằng Playwright vào "How Many?": nút xác
nhận hiện đúng, không lỗi console.

**2. `VS_PROFILE` mặc định ngầm trong `gen-audio-voicestudio.mjs`** —
bỏ giá trị mặc định `'demo0001'`, thêm kiểm tra bắt buộc ngay đầu script
(trước cả bước gọi mạng tới VoiceStudio): thiếu cả `VS_PROFILE` lẫn
`VS_INSTRUCT` thì thoát ngay với thông báo rõ ràng, nhắc đúng lý do
(giọng thật đang dùng là giọng clone ElevenLabs, không phải demo0001) và
cách tra ID giọng đã lưu (`curl http://127.0.0.1:3900/profiles`). Cập
nhật lại Bước 23.3 trong PROMPT.md cho khớp — không còn ví dụ chạy lệnh
trần trụi không kèm `VS_PROFILE` nữa.

29 unit test vẫn pass nguyên qua cả 2 việc.

## Vòng 51 — Butterfly Garden: bỏ hẳn linh vật dẫn đường giữa màn

Người dùng phản hồi: giữa màn chơi có 1 con bướm KHÔNG bấm được (linh
vật dẫn đường, hiện tạm bằng emoji 🦋 vì chưa có ảnh 3 trạng thái) — dễ
gây hiểu nhầm là 1 lựa chọn thứ 7, không cần thiết. Hỏi luôn "loại bỏ
được không, hay cần ảnh nền mới thay thế" — xác nhận đây thuần là vấn đề
code (linh vật là 1 phần tử UI riêng, không liên quan gì tới ảnh nền),
không cần thêm ảnh gì cả, xử lý gọn bằng cách bỏ hẳn linh vật:

- Xoá `butterflyMascotHtml()`, `setButterflyMood()`, `BUTTERFLY_MOOD_IMG`,
  `.butterflymascotwrap`/`.butterflyfallback` trong `butterflygarden.js`/
  `.css`, cùng mọi lời gọi `setButterflyMood('idle'/'happy'/'sad')` ở
  `startButterflyGardenGame()`/`handleButterflyAnswer()`/
  `advanceButterflyRound()` — phản hồi đúng/sai vẫn đủ rõ ràng qua badge
  ✓/✗ + tiếng ting/buzz, không phụ thuộc mascot đổi tâm trạng.
- Nhân dịp bỏ mascot (trước đây 6 con bướm phải dàn thành 1 vòng NÉ
  vùng giữa dành cho mascot), dàn lại `BUTTERFLY_SPOTS` thành lưới 3
  cột × 2 hàng đều đặn, tận dụng hết không gian trống ở giữa — đồng thời
  tăng kích thước mỗi ô (22vw/92px → 26vw/108px) vì giờ không còn phải
  chừa chỗ cho mascot.
- Giữ nguyên icon linh vật nhỏ (fallback 🦋) ở ô chọn game trên Trang chủ
  (`gameTileHtml()`) — đây là chỗ KHÁC, không phải thứ người dùng phàn
  nàn, dùng chung pattern với mọi game khác nên không đụng vào.

Kiểm thử bằng Playwright: xác nhận `.butterflymascotwrap` không còn tồn
tại trong DOM, đo toạ độ thật của lưới 3×2 (đúng vị trí, không chồng
lấn, nằm gọn trong khung `.butterflystage`), chụp ảnh xác nhận 6 con
bướm AI thật hiện đầy đủ và đẹp mắt (ảnh chụp đầu tiên ở mốc 600ms sau
khi vào màn bị dính lỗi chụp giữa lúc ảnh đang paint — chụp lại ở 2s xác
nhận không phải lỗi thật, chỉ là ảnh chưa kịp vẽ xong lúc chụp). Chơi
thử luồng trả lời sai (viền đỏ+✗ đúng vị trí bấm sai, viền xanh+✓ đúng
vị trí đáp án) và chơi hết trọn 10 vòng trả lời đúng tới màn thắng cuộc
(dùng kỹ thuật chặn `new Audio()` để dò đúng từ đang phát, vì giờ game
phát audio thật thay vì Web Speech nên cách giả lập `speechSynthesis` cũ
không còn bắt được nữa) — tất cả đúng như thiết kế, không lỗi console.
29 unit test vẫn pass nguyên.

## Vòng 52 — Sửa lỗi hệ thống: câu đọc lại bị cắt ngang khi chuyển màn quá nhanh

Người dùng phát hiện lỗi thật ở TẤT CẢ các game: sau khi bé chọn đáp án
(đúng hoặc sai), app đọc lại câu/từ đó — nhưng màn chuyển sang câu tiếp
theo quá nhanh, cắt ngang audio đang đọc dở. Ví dụ cụ thể: "Help Bill!"
đọc "I want a notebook", bé bấm đúng notebook, đọc lại chỉ nghe được "I
want a note" rồi mất tiếng vì đã chuyển câu. Đúng như người dùng đoán —
nguyên nhân là mọi game đều dùng 1 mốc `setTimeout` THỜI GIAN CỐ ĐỊNH
(700-3200ms tuỳ game/tuỳ đúng-sai) để quyết định lúc nào chuyển màn,
hoàn toàn không liên quan gì tới audio ĐANG PHÁT thật sự dài bao lâu —
mốc đó được ước lượng theo câu NGẮN nên câu dài (nhất là các câu đầy đủ
"I want a ___." ở Bill, hoặc bất kỳ audio thật nào đọc lâu hơn ước
lượng) bị cắt ngang.

**Sửa tận gốc, áp dụng cho TẤT CẢ 8 game** (forest/farm/bill/kitchen/
butterflygarden/abcvui/wordsafari/howmany): thêm hàm dùng chung
`speakThenProceed(speakFn, text, minDelayMs, callback)` trong
`engine/ui-shared.js` — chờ ĐỒNG THỜI 2 điều kiện trước khi gọi
callback (chuyển màn): (1) audio đọc THẬT SỰ đọc xong (qua tham số
`onEnd` sẵn có của `speak()`, xem `engine/audio-provider.js`), và (2)
đã trôi qua đủ 1 mốc thời gian TỐI THIỂU (giữ nguyên các giá trị cũ làm
sàn, không phải trần) — để giữ nhịp xem hợp lý cho câu quá ngắn (không
chuyển màn ngay tắp lự chỉ vì audio đọc xong trong tích tắc). Có thêm
lưới an toàn 8 giây phòng trường hợp `onEnd` vì lý do nào đó không được
gọi (chưa gặp thật, nhưng thà cắt ngang muộn còn hơn treo màn mãi mãi).

Thay mọi cặp `ctx.speak(text); ... setTimeout(fn, N);` (fire-and-forget,
đua tranh với timer riêng) bằng `speakThenProceed(ctx.speak, text, N,
fn);` ở đúng cả 2 nhánh đúng/sai của từng game. Riêng 2 trường hợp đặc
biệt:
- **`abcvui.js`** (có 2 lần đọc liên tiếp khi lật thẻ lộ từ mới): tên
  chữ cái vẫn đọc NGAY không cần chờ (câu ngắn, không phải điểm gây lỗi)
  — chỉ gate việc chuyển màn vào audio đọc SAU CÙNG (tên từ lật ra).
- **`howmany.js`** (không có audio xác nhận ở nhánh đúng, chỉ nhánh sai
  đọc lại câu đúng sau 1200ms trễ để tránh chồng câu vừa nghe lúc bấm
  hoa): giữ nguyên độ trễ 1200ms, gate phần chuyển màn còn lại vào
  `speakThenProceed`.

Kiểm thử bằng Playwright — dựng lại ĐÚNG kịch bản lỗi người dùng báo:
giả lập giọng đọc "chậm" (buộc `onEnd` chỉ gọi sau 2000ms, mô phỏng câu
dài đọc lâu hơn mốc cố định cũ), vào Help Bill!, bấm đúng "notebook":
- Ở mốc 900ms (đúng mốc cố định CŨ của nhánh đúng — nếu còn bug thì màn
  đã chuyển rồi) — xác nhận màn CHƯA chuyển, badge còn nguyên.
- Ở mốc 2200ms (sau khi audio giả lập đọc xong) — xác nhận màn ĐÃ
  chuyển đúng lúc, câu vòng mới bắt đầu phát ngay sau, không chồng
  audio.

Chạy thêm smoke test qua cả 7/8 game còn lại (forest/farm/bill/kitchen/
butterflygarden/abcvui/howmany — riêng wordsafari cần đủ tiến độ từ
vựng mới mở khoá nên bỏ qua ở hồ sơ test trống, nhưng dùng chung đúng 1
hàm `speakThenProceed` đã kiểm chứng đúng ở 7 game kia): bấm 1 đáp án,
đợi 4-4.2 giây, xác nhận không game nào bị "treo" ở màn phản hồi (dấu
hiệu callback không bao giờ được gọi) và không lỗi console. Chạy lại
toàn bộ luồng thắng cuộc 10 vòng của Butterfly Garden (dùng audio thật)
— vẫn đúng như trước. 29 unit test vẫn pass nguyên.

## Vòng 53 — "Mystic Jungle": bỏ audio thật cho 20 từ động vật hoang dã, rơi về giọng API

Người dùng phản hồi: game "Mystic Jungle" (Khu rừng kỳ bí) nghe lạ —
câu mở đầu ("Catch the tiger!", luôn dùng Web Speech API vì không có
file thu sẵn cho cả câu) nghe bình thường, nhưng tên con vật đọc lại
sau khi bé chọn (vd "tiger", dùng file `.wav` thu sẵn vì có trong
manifest) nghe không tốt. Xác nhận qua AskUserQuestion: đúng là lần đọc
2 (câu xác nhận) bị, muốn chuyển về giọng API cho toàn bộ game này.

Đã phân tích waveform 20 file `.wav` liên quan (tiger/lion/elephant/
giraffe/zebra/monkey/bear/kangaroo/panda/crocodile/penguin/raccoon/
squirrel/peacock/koala/rhino/hippo/deer/fox/wolf) — không phát hiện bất
thường về âm lượng/rè/vỡ tiếng qua số liệu (RMS, peak, số mẫu bị clip),
nhưng không tự nghe được nên không thể loại trừ hoàn toàn — tin theo
đúng nhận định bằng tai của người dùng.

**Cách sửa**: xoá đúng 20 slug động vật hoang dã đó khỏi
`assets/audio/en/manifest.json` (kiểm tra trước: 20 từ này CHỈ dùng cho
riêng nhóm "wild" trong `animals-v1.json`, không đụng tới game nào
khác) — không cần sửa code gì cả, `createFileFirstAudioProvider()`
(Vòng 47) đã có sẵn cơ chế rơi về Web Speech cho câu không có trong
manifest, đúng ngay cơ chế cần dùng ở đây. File `.wav` vẫn giữ nguyên
trong `assets/audio/en/` (không xoá) phòng khi sau này muốn dùng lại
(vd thu lại bằng giọng khác).

Kiểm thử bằng Playwright (theo dõi request mạng tới
`assets/audio/en/` + số lần gọi Web Speech): vào Mystic Jungle, cả câu
mở đầu LẪN câu xác nhận sau khi chọn đều đi qua Web Speech, không còn
request file `.wav` nào cho từ động vật hoang dã. 29 unit test vẫn pass
nguyên.

## Vòng 54 — Sửa lỗi Butterfly Garden: đáp án bị "kẹt" mãi 1 màu suốt cả ván

Người dùng phản hồi (lần 2, sau khi lần đầu tưởng là lỗi cache trình
duyệt — Vòng 50): "ra 6 con bướm, nhưng đáp án luôn chỉ có 1 con. Cả 10
câu đều chỉ hỏi về 1 con." Ban đầu nghi ảnh 6 con bướm quá nặng
(~4.4MB, có thể nén giảm ~77% bằng palette PNG không đổi chất lượng
nhìn thấy được) gây lỗi tải — nhưng người dùng xác nhận đây KHÔNG phải
vấn đề tải ảnh (6 con vẫn hiện đủ, chỉ có mục tiêu câu hỏi bị kẹt).

**Nguyên nhân thật**: `pickTargetIndex()` (dùng chung cấu trúc với
forest/farm/bill/kitchen/abcvui/wordsafari/howmany) ưu tiên từ "đến hạn
ôn" (`due`) làm tiêu chí xếp hạng CAO NHẤT. Theo thiết kế Learning
Engine, LV0 (chưa thuộc) "luôn đến hạn ngay" — mỗi lần trả lời SAI ở
LV0, `applyAnswer()` giữ nguyên LV0 và đặt `next = now` (đến hạn ngay
lập tức), nên từ đó cứ đứng đầu bảng xếp hạng `due` mãi cho tới khi bé
trả lời ĐÚNG từ đó. Ở forest/farm/bill/kitchen, hiệu ứng này vô hại vì
mỗi vòng chỉ thay 1 trong 4 ô hiển thị (rút từ kho từ lớn hơn) — từ bị
"kẹt due" có lúc bị xoay ra khỏi màn hình. Butterfly Garden thì khác
hẳn: cả vốn từ CHỈ có đúng 6 màu, hiện ĐỦ CẢ 6 cố định suốt ván, KHÔNG
xoay ô nào — nên từ bị kẹt "due" không bao giờ rời khỏi màn và bị hỏi
lại liên tục không nghỉ, y hệt triệu chứng người dùng báo. Dễ gặp nhất
với bé mới chơi lần đầu: đoán ngẫu nhiên dễ trả lời sai màu đầu tiên,
màu đó lập tức bị "khoá" làm câu hỏi duy nhất cho tới khi may mắn bấm
đúng.

**Cách sửa**: không sửa `learning-engine.js` dùng chung (sẽ đổi hành vi
LV0 của cả 7 game khác, rủi ro không cần thiết) — chỉ thêm tham số
`excludeIdx` vào `pickTargetIndex()` của riêng `butterflygarden.js`:
nếu từ xếp hạng cao nhất trùng đúng mục tiêu của vòng TRƯỚC, lấy từ xếp
thứ 2 thay thế. `advanceButterflyRound()` truyền `state.targetIdx` cũ
làm `excludeIdx`. Từ bị "kẹt due" vẫn được ưu tiên hỏi lại sớm (đúng
tinh thần ôn tập ngắt quãng), chỉ không còn hỏi liên tục 2 vòng liền —
đủ để phá vòng lặp "10 câu chỉ 1 màu".

Kiểm thử bằng Playwright: mô phỏng 10 vòng chơi, CHỦ Ý bấm sai mỗi vòng
(để tái hiện đúng lỗi) — trước khi sửa sẽ ra đúng 1 màu suốt cả 10 vòng
(xác nhận qua kịch bản tương tự), sau khi sửa ra kết quả xen kẽ 2 màu
bị kẹt (`blue`/`red`), không vòng nào lặp lại liên tiếp ("Max
consecutive repeats: 1"). Chạy thêm smoke test lại 7/8 game (trừ
wordsafari cần vốn từ mở khoá riêng, không liên quan file vừa sửa) —
không game nào lỗi console, không game nào bị treo màn phản hồi.

## Vòng 55 — Butterfly Garden: sửa TIẾP lỗi kẹt (lần 2, đổi hẳn sang "túi xoay vòng") + bỏ hẳn audio thu sẵn

**1. Bug Vòng 54 chưa hết hẳn.** Người dùng phản hồi: "mặc dù tôi chọn
đúng, nhưng nó lại chỉ quay đi quay lại 2 con thôi, không chạy ra các
con khác". Đúng như lo ngại — bản vá Vòng 54 (`excludeIdx`, chỉ chặn
LẶP LIÊN TIẾP đúng 1 màu vừa hỏi) thu hẹp lỗi nhưng không triệt để: nếu
có ĐÚNG 2 màu cùng bị "kẹt due" (vd bé bấm sai cả 2 màu đó ở đầu ván),
2 màu này luôn xếp hạng `due` cao hơn 4 màu còn lại (due=0, chưa từng
hỏi) — nên dù không lặp liên tiếp, thuật toán vẫn CHỈ xoay vòng giữa
đúng 2 màu đó mãi mãi, 4 màu kia không bao giờ có lượt.

Gốc rễ: kiểu xếp hạng "due luôn thắng tuyệt đối" chỉ hợp với kho từ LỚN
(chỉ hiện 4/N từ — 1-2 từ bị kẹt due không đáng ngại vì còn rất nhiều
từ khác để xoay slot), không hợp với kho từ NHỎ CỐ ĐỊNH hiện đủ 100%
như Butterfly Garden (N=6, 2 màu kẹt due đã chiếm 33% "chỗ", đủ loại
hẳn 4 màu còn lại). Vá thêm kiểu "loại 2 màu gần nhất" chỉ dời ngưỡng
lỗi (hở nếu có 3+ màu kẹt) — đổi hẳn sang mô hình phù hợp hơn: **"túi
xoay vòng"** (round-robin theo lô, kiểu random-bag của Tetris) trong
`pickTargetIndex()` → đổi tên thành `buildTargetQueue(slots,
avoidFirstIdx)`. Mỗi lô là TOÀN BỘ 6 màu xếp theo đúng thứ tự ưu tiên
cũ (due/wrongRate/level — màu khó hơn được hỏi SỚM hơn trong lô), lấy
lần lượt hết lô này mới đóng lô mới — đảm bảo TUYỆT ĐỐI mọi màu đều
được hỏi trong mỗi 6 vòng, không có ngưỡng nào lọt lưới nữa dù bao
nhiêu màu bị kẹt due. `avoidFirstIdx` (màu cuối lô trước) chỉ để tránh
lặp ngay ở ranh giới 2 lô. `state.targetQueue` lưu trong state, đóng
lại ở `startButterflyGardenGame()`, lấy dần ở `advanceButterflyRound()`.

Kiểm thử bằng Playwright: mô phỏng đúng kịch bản lỗi — 2 vòng đầu bấm
SAI cố ý (tạo 2 màu kẹt due), 8 vòng sau bấm ĐÚNG hoàn toàn (đúng như
"tôi chọn đúng" người dùng báo) — xác nhận đủ **6/6 màu** được hỏi
trong 10 vòng (trước đây với bản vá Vòng 54 sẽ mãi kẹt ở 2 màu). 29
unit test vẫn pass nguyên.

**2. Bỏ hẳn audio thu sẵn, quay lại 100% Web Speech.** Người dùng đánh
giá giọng nữ clone ElevenLabs hiện tại (122 file, dùng từ Vòng 48) nghe
không tốt, muốn xoá hẳn để dùng lại giọng máy trong lúc chuẩn bị nguồn
giọng mới (ElevenLabs mẫu giọng trẻ em rõ ràng + clone lại qua
VoiceStudio — đã tư vấn cách setup riêng, chưa thực hiện). Khác lần
yêu cầu tương tự trước đó (đã dừng giữa chừng, khôi phục lại) — lần này
yêu cầu rõ ràng và có lý do nhất quán, thực hiện luôn:

- Xoá toàn bộ 122 file `.wav` trong `assets/audio/en/` (`git rm`).
- Reset `assets/audio/en/manifest.json` về `[]`.
- KHÔNG xoá code hạ tầng `createFileFirstAudioProvider()`/
  `slugifyAudioText()` trong `engine/audio-provider.js` — cơ chế "manifest
  rỗng → mọi câu tự rơi về Web Speech" đã có sẵn từ Vòng 47, đúng ngay
  nhu cầu hiện tại mà không cần sửa code gì thêm; giữ nguyên hạ tầng để
  khi có bộ giọng mới (từ ElevenLabs + VoiceStudio) chỉ cần đưa file
  `.wav` mới + cập nhật manifest là dùng lại được ngay, không cần viết
  lại từ đầu.

Kiểm thử bằng Playwright (theo dõi request mạng tới `assets/audio/en/*.wav`
+ số lần gọi Web Speech): vào cả Butterfly Garden (từ đơn) lẫn Help
Bill! (câu dài "I want a bag.") — cả câu mở đầu lẫn câu xác nhận sau
khi chọn đều đi qua Web Speech, **0 request** `.wav` nào. 29 unit test
vẫn pass nguyên.
