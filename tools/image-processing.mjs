// Xử lý ảnh dùng chung: co nhỏ + xoá nền thành trong suốt.
//
// Tách riêng khỏi tools/admin-server.mjs để cả 2 nơi dùng CHUNG 1 bản:
// - admin-server.mjs — ảnh người dùng upload qua Trang phụ huynh.
// - process-incoming-images.mjs — ảnh AI tải về bỏ vào assets/_raw_incoming/.
// Chép thành 2 bản rất dễ hỏng vì đoạn xử lý alpha bên dưới có 1 cái bẫy
// của sharp (xem ghi chú trong removeBackground) — sửa 1 bên quên bên kia
// thì ảnh ra bị sọc ngang mà nhìn code không thấy sai.

import sharp from 'sharp';
import fs from 'node:fs/promises';

export const MAX_IMAGE_DIMENSION = 900; // px — đủ nét cho ô to nhất trong game, không phí dung lượng

// Ngưỡng giống hệt tools/remove_white_bg.py (bản Python cũ, vẫn giữ lại
// làm công cụ chạy tay riêng) — tô loang (flood fill) từ 4 góc ảnh thay
// vì lọc theo 1 ngưỡng màu toàn cục, để không đục lỗ vào lông trắng/màu
// nhạt NẰM BÊN TRONG con vật (chỉ xoá phần nối liền với góc ảnh).
const WHITE_BG_THRESHOLD = 26;

// Tô loang nền (mọi màu nền đồng nhất nối với 1 trong 4 góc, không chỉ
// riêng màu trắng) thành trong suốt. Nhận buffer ảnh đã ở dạng thô RGBA
// cùng kích thước, trả về buffer RGBA đã sửa alpha (chưa mã hoá PNG).
function floodFillBackgroundAlpha(data, width, height, channels) {
  const size = width * height;
  const visited = new Uint8Array(size);
  const queue = new Int32Array(size);
  let qTail = 0;

  function colorAt(idx) {
    const o = idx * channels;
    return [data[o], data[o + 1], data[o + 2]];
  }
  function colorDist(a, b) {
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
  }

  function seedFloodFill(x, y) {
    const startIdx = y * width + x;
    if (visited[startIdx]) return;
    const seedColor = colorAt(startIdx);
    visited[startIdx] = 1;
    queue[qTail++] = startIdx;
    let qHead = qTail - 1;
    while (qHead < qTail) {
      const idx = queue[qHead++];
      const px = idx % width;
      const py = (idx / width) | 0;
      const neighbors = [[px - 1, py], [px + 1, py], [px, py - 1], [px, py + 1]];
      for (const [nx, ny] of neighbors) {
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const nIdx = ny * width + nx;
        if (visited[nIdx]) continue;
        if (colorDist(colorAt(nIdx), seedColor) <= WHITE_BG_THRESHOLD) {
          visited[nIdx] = 1;
          queue[qTail++] = nIdx;
        }
      }
    }
  }

  seedFloodFill(0, 0);
  seedFloodFill(width - 1, 0);
  seedFloodFill(0, height - 1);
  seedFloodFill(width - 1, height - 1);

  for (let i = 0; i < size; i++) {
    if (visited[i]) data[i * channels + 3] = 0;
  }
  return visited;
}

export async function removeBackground(pngBuffer) {
  const { data, info } = await sharp(pngBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  floodFillBackgroundAlpha(data, width, height, channels);

  // Làm mềm viền: chỉ làm mờ riêng kênh alpha (không mờ màu RGB, tránh
  // viền nhoè trắng quanh con vật) — tách alpha ra ảnh xám 1 kênh, blur,
  // rồi ghép ngược lại.
  const size = width * height;
  const alphaOnly = Buffer.alloc(size);
  for (let i = 0; i < size; i++) alphaOnly[i] = data[i * channels + 3];
  // .toColourspace('b-w') bắt buộc — không có nó, sharp âm thầm nâng ảnh
  // xám 1 kênh lên sRGB 3 kênh ngay khi qua .blur(), khiến buffer trả về
  // dài gấp 3 dự kiến và toàn bộ phép ghép alpha ngược lại bị lệch hàng
  // (ảnh ra bị sọc ngang) — lỗi này chỉ lộ ra khi so kích thước buffer,
  // nhìn code không thấy sai.
  const blurredAlpha = await sharp(alphaOnly, { raw: { width, height, channels: 1 } })
    .blur(1.2)
    .toColourspace('b-w')
    .raw()
    .toBuffer();
  for (let i = 0; i < size; i++) data[i * channels + 3] = blurredAlpha[i];

  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

export async function processImageBuffer(buffer, destPath) {
  const resized = await sharp(buffer)
    .resize({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true
    })
    .png()
    .toBuffer();
  const transparent = await removeBackground(resized);
  await fs.writeFile(destPath, transparent);
}
