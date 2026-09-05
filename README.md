# game-hoc-lop1
Game học tập cho bé lớp 1 — "Vở học Tiếng Anh của Bòng"

Trang trò chơi là 1 web tĩnh (không cần server) — trẻ chơi trực tiếp bằng
cách mở `index.html`, hoặc qua bản đã deploy trên GitHub Pages.

## Thêm/sửa ảnh & video cho từ vựng — chạy trên máy (không cần nhờ Claude)

Chạy trang trò chơi trên máy bằng server local đi kèm, phần **Trang dành
cho phụ huynh** trong game sẽ tự hiện thêm mục "Thêm/sửa ảnh, video cho từ
vựng" — upload ảnh/video mới cho bất kỳ từ nào (con vật, màu sắc, số
đếm...), không cần sửa code hay nhờ ai. Công cụ tự co nhỏ ảnh, tự nén
video, tự ghi vào đúng file.

**Cài 1 lần đầu tiên** (cần máy đã cài [Node.js](https://nodejs.org), bản 18 trở lên):

```
npm install
```

**Chạy mỗi khi cần thêm/sửa nội dung:**

```
npm start
```

Rồi mở `http://localhost:5173/index.html` trên trình duyệt — chơi/test
bình thường, vào **"Dành cho phụ huynh"** ở trang chủ sẽ thấy thêm mục
tải ảnh/video lên (mục này CHỈ hiện khi mở qua `npm start`, không hiện
trên bản deploy GitHub Pages vì đó là web tĩnh, không có chỗ ghi file).

Sau khi hài lòng, bấm nút **"🚀 Xuất bản lên GitHub"** ngay trong Trang phụ
huynh để đẩy thay đổi lên GitHub — trang web công khai (GitHub Pages) sẽ
cập nhật theo (cần máy đã đăng nhập git từ trước; nếu đây là lần đầu dùng
git trên máy này, nên thử `git push` bằng tay 1 lần trong terminal cho chắc).

Chi tiết kỹ thuật/lịch sử phát triển: xem `ROADMAP.md`.
