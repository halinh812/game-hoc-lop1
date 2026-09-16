// Xử lý ảnh AI tải về: co nhỏ + xoá nền trắng + xuất PNG trong suốt.
//
// Dùng cho ảnh tải thẳng từ công cụ tạo ảnh (Google Flow...) rồi bỏ vào
// assets/_raw_incoming/ — khác với ảnh upload qua Trang phụ huynh (đường đó
// đã tự xử lý sẵn trong tools/admin-server.mjs). Cả hai dùng CHUNG hàm xử lý
// trong tools/image-processing.mjs nên ảnh ra giống hệt nhau.
//
// Cách dùng:
//   node tools/process-incoming-images.mjs <thư-mục-đích>
//   vd: node tools/process-incoming-images.mjs assets/butterflies
//
// Đọc mọi file .png/.jpg/.jpeg/.webp trong assets/_raw_incoming/, giữ nguyên
// tên (chỉ đổi đuôi thành .png) và ghi vào thư mục đích. File gốc KHÔNG bị
// xoá hay sửa — cứ để đó, muốn làm lại lúc nào cũng được.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { processImageBuffer } from './image-processing.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC_DIR = path.join(ROOT, 'assets', '_raw_incoming');
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp']);

const destArg = process.argv[2];
if (!destArg) {
  console.error('Thiếu thư mục đích. Ví dụ: node tools/process-incoming-images.mjs assets/butterflies');
  process.exit(1);
}
const DEST_DIR = path.resolve(ROOT, destArg);

let files;
try {
  files = (await fs.readdir(SRC_DIR)).filter(f => IMAGE_EXT.has(path.extname(f).toLowerCase())).sort();
} catch {
  console.error('Không thấy thư mục ' + SRC_DIR);
  process.exit(1);
}
if (!files.length) {
  console.error('Không có file ảnh nào trong ' + SRC_DIR);
  process.exit(1);
}

await fs.mkdir(DEST_DIR, { recursive: true });
console.log('Nguồn: ' + SRC_DIR);
console.log('Đích:  ' + DEST_DIR + '\n');

let done = 0;
const failed = [];
for (const file of files) {
  const srcPath = path.join(SRC_DIR, file);
  const destPath = path.join(DEST_DIR, path.basename(file, path.extname(file)) + '.png');
  try {
    const buffer = await fs.readFile(srcPath);
    await processImageBuffer(buffer, destPath);
    const { size } = await fs.stat(destPath);
    console.log('  ' + file.padEnd(14) + ' -> ' + path.basename(destPath).padEnd(14) + ' ' + Math.round(size / 1024) + ' KB');
    done++;
  } catch (err) {
    console.log('  ! ' + file + ' lỗi: ' + err.message);
    failed.push(file);
  }
}

console.log('\nXong: ' + done + '/' + files.length + (failed.length ? ', lỗi: ' + failed.join(', ') : ''));
if (failed.length) process.exitCode = 1;
