# game-hoc-lop1
Game học tập cho bé lớp 1 — "Vở học Tiếng Anh của Bòng"

Trang trò chơi là 1 web tĩnh (không cần server) — trẻ chơi trực tiếp bằng
cách mở `index.html`, hoặc qua bản đã deploy trên GitHub Pages.

## Thêm/sửa ảnh & video cho từ vựng — chạy trên máy (không cần nhờ Claude)

Có 1 trang quản trị riêng chạy LOCAL trên máy, cho phép tự upload ảnh/video
cho từng từ (con vật, màu sắc, số đếm...) mà không cần sửa code hay nhờ ai
— công cụ tự co nhỏ ảnh, tự nén video, tự ghi vào đúng file.

**Cài 1 lần đầu tiên** (cần máy đã cài [Node.js](https://nodejs.org), bản 18 trở lên):

```
npm install
```

**Chạy mỗi khi cần thêm/sửa nội dung:**

```
npm start
```

Rồi mở 2 trang trên trình duyệt:
- `http://localhost:5173/index.html` — trang trò chơi (test luôn thay đổi)
- `http://localhost:5173/admin.html` — trang quản trị: chọn 1 từ, tải ảnh/
  video mới lên, bấm Lưu — xong ngay, không cần code.

Sau khi hài lòng, bấm nút **"🚀 Xuất bản"** ngay trong trang quản trị để đẩy
thay đổi lên GitHub — trang web công khai (GitHub Pages) sẽ cập nhật theo
(cần máy đã đăng nhập git từ trước; nếu đây là lần đầu dùng git trên máy
này, nên thử `git push` bằng tay 1 lần trong terminal cho chắc).

Chi tiết kỹ thuật/lịch sử phát triển: xem `ROADMAP.md`.
