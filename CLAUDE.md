# Hướng dẫn cho Claude khi làm việc trên repo này

## Bắt buộc hỏi trước khi chỉnh sửa ảnh có sẵn

Trước khi chạy bất kỳ thao tác nào **chỉnh sửa/ghi đè file ảnh đã có sẵn**
trong repo (vd: xoá nền, đổi kích thước, nén lại, đổi định dạng, chạy lại
1 script xử lý ảnh hàng loạt...), **phải hỏi ý kiến người dùng trước và
chờ xác nhận rồi mới thực hiện** — không tự ý làm rồi báo cáo lại sau.

Quy tắc này áp dụng cho ảnh **đã tồn tại** trong repo (vd trong
`assets/`). Không áp dụng cho:
- Ảnh mới do người dùng tải lên qua tính năng upload của Trang phụ huynh
  (`tools/admin-server.mjs`) — xử lý tự động (resize + xoá nền) ở đó là
  tính năng đã được thiết kế và người dùng đồng ý từ trước, không cần hỏi
  lại mỗi lần upload.
- Việc chỉ ĐỌC/xem ảnh để kiểm tra, debug.

Lý do: ảnh là nội dung người dùng tự chọn/tạo ra, chỉnh sửa ngoài ý muốn
(dù với mục đích tốt như "sửa cho đẹp hơn") có thể làm mất hoặc thay đổi
ảnh mà không có sự đồng ý.
