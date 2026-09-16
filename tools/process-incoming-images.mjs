// Xử lý ảnh AI tải về: co nhỏ + xoá nền trắng + xuất PNG trong suốt.
//
// Dùng cho ảnh tải thẳng từ công cụ tạo ảnh (Google Flow...) rồi bỏ vào
// assets/_raw_incoming/ — khác với ảnh upload qua Trang phụ huynh (đường đó
// đã tự xử lý sẵn trong tools/admin-server.mjs). Cả hai dùng CHUNG hàm xử lý
// trong tools/image-processing.mjs nên ảnh ra giống hệt nhau.
//
// Cách dùng:
//   node tools/process-incoming-images.mjs <thư-mục-đích> [thư-mục-nguồn]
//   vd: node tools/process-incoming-images.mjs assets/butterflies
//       node tools/process-incoming-images.mjs assets/howmany assets/howmany
//
// Đọc mọi file .png/.jpg/.jpeg/.webp trong thư mục nguồn (mặc định
// assets/_raw_incoming/), giữ nguyên tên (chỉ đổi đuôi thành .png) và ghi vào
// thư mục đích. File gốc KHÔNG bị xoá hay sửa — cứ để đó, muốn làm lại lúc
// nào cũng được.
//
// Script LUÔN IN DANH SÁCH FILE SẼ XỬ LÝ VÀ HỎI XÁC NHẬN trước khi ghi. Lý do:
// ngày 16/09/2026 đã có lần gõ đích là assets/howmany nhưng quên rằng nguồn bị
// cố định cứng ở _raw_incoming, kết quả là 6 con bướm bị đổ nhầm vào thư mục
// howmany. Chạy trong script tự động (CI...) thì thêm cờ --yes để bỏ qua hỏi.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { processImageBuffer } from './image-processing.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp']);

const args = process.argv.slice(2).filter(a => a !== '--yes');
const autoYes = process.argv.includes('--yes');
const [destArg, srcArg] = args;
if (!destArg) {
  console.error('Thiếu thư mục đích. Ví dụ: node tools/process-incoming-images.mjs assets/butterflies');
  process.exit(1);
}
const DEST_DIR = path.resolve(ROOT, destArg);
const SRC_DIR = path.resolve(ROOT, srcArg || path.join('assets', '_raw_incoming'));

let files;
try {
  files = (await fs.readdir(SRC_DIR)).filter(f => IMAGE_EXT.has(path.extname(f).toLowerCase())).sort();
  // Nguồn trùng đích thì cùng 1 tên có thể có 2 đuôi (calculator.jpeg +
  // calculator.png) — cùng ghi ra 1 file .png. Giữ lại bản KHÔNG phải .png để
  // không xử lý lại chính ảnh đã xoá nền (chạy lại sẽ làm ảnh xấu dần đi).
  const byStem = new Map();
  for (const f of files) {
    const stem = path.basename(f, path.extname(f));
    const cur = byStem.get(stem);
    if (!cur || path.extname(cur).toLowerCase() === '.png') byStem.set(stem, f);
  }
  files = [...byStem.values()].sort();
} catch {
  console.error('Không thấy thư mục ' + SRC_DIR);
  process.exit(1);
}
if (!files.length) {
  console.error('Không có file ảnh nào trong ' + SRC_DIR);
  process.exit(1);
}

console.log('Nguồn: ' + SRC_DIR);
console.log('Đích:  ' + DEST_DIR);
console.log('Sẽ ghi đè/tạo ' + files.length + ' file: ' +
  files.map(f => path.basename(f, path.extname(f)) + '.png').join(', ') + '\n');

if (!autoYes) {
  const answer = await new Promise(resolve => {
    process.stdout.write('Đúng ý bạn chứ? [y/N] ');
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', d => resolve(d.trim().toLowerCase()));
  });
  if (answer !== 'y' && answer !== 'yes') {
    console.log('Đã huỷ, không ghi file nào.');
    process.exit(0);
  }
}

await fs.mkdir(DEST_DIR, { recursive: true });

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
