# App Android — "Vở học Tiếng Anh của Bòng"

Vỏ app Android bọc quanh phần game web (`../index.html` và thư mục
`../games`, `../engine`, `../assets`). Phần game **không bị sửa gì** —
app chỉ mở nó trong WebView và bổ sung những thứ web không làm được.

## Tiến độ

- [x] **Bước 1** — Khung app + WebView + cầu nối âm thanh *(đang ở đây)*
- [ ] Bước 2 — Đăng nhập / đăng xuất nhiều tài khoản
- [ ] Bước 3 — Đồng bộ tiến độ lên Google Trang tính
- [ ] Bước 4 — Nhúng phần web vào app (chạy offline) + nút kiểm tra bản mới
- [ ] Bước 5 — Build file APK

## Vì sao cần cầu nối âm thanh

WebView của Android **không có** Web Speech API, mà toàn bộ 8 game đọc
tiếng Anh bằng đúng thứ đó. Không làm gì thì app sẽ **câm tiếng hoàn
toàn**.

Cách giải quyết: `../engine/native-tts-bridge.js` dựng một bản giả của
`window.speechSynthesis` với giao diện y hệt bản thật, nhưng chuyển lệnh
đọc sang phần native (`App.js`) để `expo-speech` đọc bằng bộ đọc của máy.
`../engine/audio-provider.js` không phải sửa dòng nào.

File cầu nối nằm trong repo web (không nằm trong `mobile/`) để chỉ có đúng
1 bản, và để sau này cập nhật được mà không phải build lại APK.

## Chạy thử bằng Expo Go

Cần Node.js trên máy tính, và điện thoại cùng mạng Wi-Fi với máy tính.

```bash
cd mobile
npm install
npx expo start
```

Cài **Expo Go** từ Play Store, mở lên quét mã QR hiện trên màn hình máy
tính.

## Thanh gỡ lỗi màu đen ở đáy màn hình

Chỉ có ở bản thử này, bản chính thức sẽ bỏ. Dùng để tách bạch nguyên nhân
khi không nghe thấy tiếng:

| Nút | Tác dụng |
|---|---|
| **Thử đọc** | Đọc thẳng bằng phần native, **không qua game**. Kêu = máy có bộ đọc tiếng Anh. Câm = máy thiếu bộ đọc (xem bên dưới). |
| **Tải lại** | Tải lại trang game. |
| **Ẩn** | Ẩn thanh này đi. |

Dòng chữ bên trên hiện câu đang đọc và số lệnh đọc đã nhận được từ game.

**Nếu nút "Thử đọc" câm:** máy chưa có dữ liệu giọng tiếng Anh. Vào
*Cài đặt → Quản lý chung → Văn bản thành giọng nói* (tên mục có thể khác
tuỳ máy), chọn công cụ Google, tải gói tiếng Anh về.

**Nếu nút "Thử đọc" kêu mà vào game vẫn câm:** lỗi nằm ở cầu nối — báo lại
kèm dòng chữ trên thanh gỡ lỗi.

## Lưu ý ở bước 1

App đang tải game từ GitHub Pages (`GAME_URL` trong `App.js`), nên **phải
có mạng** và phần web trên nhánh `main` phải có sẵn file
`engine/native-tts-bridge.js`. Bước 4 sẽ chuyển sang bản nhúng trong máy
để chơi offline.
