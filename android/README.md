# App Android — "Vở học Tiếng Anh"

Vỏ app Android (Kotlin) bọc quanh phần game web của repo này. Phần game
(`index.html`, `app.js`, `engine/`, `games/`, `content/`, `assets/`) được
**chép nguyên vào trong APK** mỗi lần build, nên app chơi được offline và
luôn là bản game mới nhất. Không viết lại game nào.

Cách làm học theo dự án `hoc-tieng-anh`: **GitHub Actions tự build APK** mỗi
khi có code mới, rồi đăng lên mục **Releases** của repo. Không cần máy tính.

## Cài app

Mở mục **Releases** của repo trên điện thoại Android → bản mới nhất → bấm file
`.apk` ở phần **Assets** → cho phép cài từ nguồn này nếu máy hỏi → Cài đặt.

Bản mới cài đè lên bản cũ được, không mất tiến độ.

## Chuyển tiến độ từ bản web sang app

App và bản web lưu tiến độ ở 2 nơi riêng, app mới cài là trống.

1. Bản web: **Dành cho phụ huynh → 💾 Tải file sao lưu**.
2. Trong app: **Dành cho phụ huynh → 📂 Khôi phục từ file** → chọn file đó.
3. Đối chiếu số sao ở Trang chủ của 2 bên.

## Đọc tiếng Anh

WebView của Android không có Web Speech API, mà cả 8 game đều đọc tiếng Anh
bằng thứ đó. `engine/native-tts-bridge.js` dựng bản giả `speechSynthesis`, gửi
lệnh đọc qua `window.AndroidTTS` sang `MainActivity.kt`, nơi đọc bằng
TextToSpeech của máy rồi báo ngược lại lúc đọc xong. Trên web thường file cầu
nối tự thoát, không ảnh hưởng gì.

Không nghe thấy tiếng: vào Cài đặt của máy → Văn bản thành giọng nói → tải
giọng tiếng Anh.

## Chữ ký app

`keystore/release.jks` khoá bằng mật khẩu **do chủ repo tự đặt** trong GitHub
Secrets (`SIGNING_STORE_PASSWORD`), **không nằm trong code**. File chữ ký do
GitHub Actions tự tạo bằng mật khẩu đó ở lần build đầu tiên rồi lưu vào repo. Thiếu secret thì build
dừng hẳn, không bao giờ ra bản chữ ký tạm — vì bản chữ ký khác không cài đè
được, phải gỡ app, và gỡ app là mất tiến độ.

**Giữ mật khẩu này cẩn thận.** Mất mật khẩu thì phải tạo chữ ký mới, và lần
cài bản chữ ký mới đó bắt buộc gỡ app cũ (nhớ sao lưu tiến độ trước).

## Chưa làm

- Đăng nhập / đăng xuất nhiều tài khoản
- Đồng bộ tiến độ lên Google Trang tính
- Nút kiểm tra bản mới trong app
- "Tải file sao lưu" bên trong app (hiện chỉ khôi phục được, tải ra thì dùng bản web)
