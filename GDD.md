# Game Design Document — Vở học Tiếng Anh của Bòng

## 1. Đối tượng chơi

- Trẻ lớp 1 (6–7 tuổi), đã biết đọc tiếng Việt cơ bản, mới bắt đầu tiếp
  xúc tiếng Anh
- Tự chơi trên điện thoại/máy tính bảng của phụ huynh, có thể cần người
  lớn hỗ trợ ở lượt chơi đầu tiên

## 2. Nguyên lý học qua chơi

Kiến thức (từ vựng, sau này là ngữ pháp) là **lõi**, trò chơi là **vỏ bọc**
để trẻ tiếp thu kiến thức đó qua hành động chơi (nghe → phản xạ → chọn),
không phải học thuộc lòng nhìn chữ.

Mỗi lượt chơi, hệ thống theo dõi:

- **Độ chính xác**: đúng / sai
- **Tốc độ phản hồi**: phản xạ nhanh (đã thuộc) hay chậm/lưỡng lự (mới nhớ
  mang máng, cần ôn lại sớm hơn)

Từ 2 chỉ số này, hệ thống áp dụng **học ngắt quãng (spaced repetition)**
kiểu Anki, điều chỉnh cho trẻ em:

- Đúng nhanh → liên kết Âm thanh → Hình ảnh được coi là mạnh, giãn cách xa
  lần ôn tiếp theo
- Đúng nhưng chậm → liên kết chưa chắc, không giãn cách xa
- Sai → liên kết yếu, từ đó **xuất hiện lại nhiều hơn**, sớm hơn (có thể
  ngay trong cùng phiên chơi), điểm liên kết bị trừ

## 3. Vòng lặp chơi (Game Loop)

1. Mở game → linh vật cú (Bo/Bòng) chào, gợi ý chủ đề đang ôn
2. Chọn 1 mini-game (ban đầu: "Bắt thú Sở thú")
3. Trong 1 phiên chơi (~5–8 phút, phù hợp sức tập trung trẻ lớp 1):
   - ~70% từ đang cần ôn tập (ưu tiên từ sai/level thấp)
   - ~30% từ mới giới thiệu
4. Mỗi câu: quản trò đọc tên bằng tiếng Anh → trẻ chọn/bắt đúng đối tượng
   → phản hồi tức thì (khen ngợi hoặc động viên nhẹ nhàng, không tạo áp lực)
5. Kết thúc phiên: tổng kết sao/điểm, không có khái niệm "thua/game over"

## 4. Nguyên tắc thiết kế cảm xúc cho trẻ nhỏ

- Không trừng phạt nặng khi sai — luôn động viên, khuyến khích thử lại
- Không giới hạn mạng/lượt chơi gây căng thẳng
- Phản hồi tích cực rõ ràng, ngắn gọn, vui nhộn khi đúng
- Độ khó tăng dần theo phong độ thật của trẻ, không cố định cứng

## 5. Phạm vi MVP (Phase 0–2)

- 1 môn học: Tiếng Anh
- 1 loại kiến thức: từ vựng
- 1 mini-game: Bắt thú Sở thú
- 1 chủ đề khởi động: Con vật (Animals)

## 6. Mở rộng tương lai (ngoài phạm vi 25 ngày)

- Thêm môn học: Toán, Tiếng Việt...
- Thêm loại kiến thức: ngữ pháp, câu đơn giản
- Thêm mini-game: Nghe & chọn tranh, Ghép cặp, Đánh vần
- Hồ sơ nhiều bé, đồng bộ cloud
- Đóng gói app Android/iOS qua Capacitor
