// Server chạy LOCAL trên máy (không deploy lên GitHub Pages — Pages là
// static hosting, không có chỗ để ghi file). Phục vụ trang trò chơi
// (index.html, y hệt bản deploy) + API /api/* để Trang phụ huynh trong
// game tự phát hiện và hiện thêm phần "Thêm/sửa ảnh, video cho từ vựng"
// (xem tryMountContentManager() trong js/app.js) — upload ảnh/video cho
// từng từ, tự xử lý rồi ghi thẳng vào content/packs/*.json + assets/,
// không cần sửa code. Mở trang tĩnh thường (không qua server này, ví dụ
// bản deploy GitHub Pages) thì API không có, phần đó tự động không hiện.
//
// Chạy: npm install (1 lần đầu) rồi npm start.

import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import ffmpegPath from 'ffmpeg-static';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PACKS_DIR = path.join(ROOT, 'content', 'packs');
const ASSETS_DIR = path.join(ROOT, 'assets');
const PORT = process.env.PORT || 5173;

// Thư mục lưu ảnh/video theo từng bộ từ (category trong content pack).
// Chỉ "animal" đã có sẵn "assets/animals/" từ trước — các bộ còn lại dùng
// tên tương tự, tạo mới khi cần (xem ensureDir trong saveItem()).
const FOLDER_BY_CATEGORY = {
  animal: 'animals',
  color: 'colors',
  number: 'numbers',
  family: 'family',
  fruit: 'fruits'
};

const SAFE_ID = /^[a-z0-9_-]+$/;
const MAX_IMAGE_DIMENSION = 900; // px — đủ nét cho ô to nhất trong game, không phí dung lượng
const MAX_VIDEO_WIDTH = 640; // px — tile hiển thị chỉ ~150-250px, 640px đã dư nét

function packFileFor(category) {
  // pack_id hiện tại luôn dạng "<category>s-v1.json" hoặc bất quy tắc
  // (family không có "s") — quét thư mục thay vì đoán tên để chắc chắn.
  const files = fsSync.readdirSync(PACKS_DIR).filter(f => f.endsWith('.json'));
  for (const f of files) {
    const full = path.join(PACKS_DIR, f);
    const data = JSON.parse(fsSync.readFileSync(full, 'utf8'));
    if (data.category === category) return full;
  }
  return null;
}

function listPacks() {
  const files = fsSync.readdirSync(PACKS_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => {
    const data = JSON.parse(fsSync.readFileSync(path.join(PACKS_DIR, f), 'utf8'));
    return {
      category: data.category,
      label: data.category_label_vi || data.category,
      icon: data.category_icon || '',
      itemCount: (data.items || []).length
    };
  }).sort((a, b) => a.label.localeCompare(b.label, 'vi'));
}

// In lại đúng kiểu "mỗi từ 1 dòng" như file gốc thay vì để
// JSON.stringify(...,null,2) làm mỗi field xuống 1 dòng — giữ file dễ đọc/
// dễ so sánh git diff như trước giờ.
function serializePack(pack) {
  const head = {
    pack_id: pack.pack_id,
    subject: pack.subject,
    category: pack.category,
    category_label_vi: pack.category_label_vi,
    category_icon: pack.category_icon
  };
  const headLines = Object.entries(head)
    .map(([k, v]) => `  "${k}": ${JSON.stringify(v)}`)
    .join(',\n');
  const itemLines = pack.items.map(item => '    ' + JSON.stringify(item)).join(',\n');
  return `{\n${headLines},\n  "items": [\n${itemLines}\n  ]\n}\n`;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

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

async function removeBackground(pngBuffer) {
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

async function processImageBuffer(buffer, destPath) {
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

// Nén + chuẩn hoá video về H.264/mp4 (tương thích mọi trình duyệt) và co
// nhỏ chiều rộng — video gốc quay bằng điện thoại/AI thường rất nặng so
// với việc chỉ hiển thị trong 1 ô ~150-250px của game.
async function processVideoBuffer(buffer, destPath) {
  const tmpIn = path.join(os.tmpdir(), `admin-upload-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await fs.writeFile(tmpIn, buffer);
  try {
    await execFileAsync(ffmpegPath, [
      '-y', '-i', tmpIn,
      '-vf', `scale='min(${MAX_VIDEO_WIDTH},iw)':-2`,
      '-c:v', 'libx264', '-crf', '28', '-preset', 'veryfast',
      '-an', '-movflags', '+faststart',
      destPath
    ]);
  } finally {
    await fs.unlink(tmpIn).catch(() => {});
  }
}

async function extractFirstFrame(videoPath, destPngPath) {
  await execFileAsync(ffmpegPath, ['-y', '-i', videoPath, '-vframes', '1', '-q:v', '3', destPngPath]);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 80 * 1024 * 1024 } // 80MB/file — dư sức cho video gốc chưa nén
});

const app = express();
app.use(express.static(ROOT, { extensions: ['html'] }));
app.use(express.json());

app.get('/api/packs', (req, res) => {
  try {
    res.json(listPacks());
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.get('/api/packs/:category/items', (req, res) => {
  try {
    const file = packFileFor(req.params.category);
    if (!file) return res.status(404).json({ error: 'Không tìm thấy bộ từ "' + req.params.category + '"' });
    const pack = JSON.parse(fsSync.readFileSync(file, 'utf8'));
    const items = pack.items.map(it => ({
      id: it.id,
      en: it.answer.text_en,
      vi: it.answer.text_vi,
      image: it.answer.image || null,
      video: it.answer.video || null,
      difficulty: it.difficulty || 1,
      subcategory: it.subcategory || null,
      subcategoryLabel: it.subcategory_label_vi || null
    }));
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.post('/api/items', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  const warnings = [];
  try {
    const { category, id, text_en, text_vi, difficulty, subcategory, subcategory_label_vi } = req.body;
    if (!category || !FOLDER_BY_CATEGORY[category]) {
      return res.status(400).json({ error: 'Bộ từ không hợp lệ.' });
    }
    if (!id || !SAFE_ID.test(id)) {
      return res.status(400).json({ error: 'Mã từ (id) chỉ được gồm chữ thường a-z, số, dấu gạch ngang/gạch dưới. Ví dụ: "red_panda".' });
    }
    const file = packFileFor(category);
    if (!file) return res.status(400).json({ error: 'Không tìm thấy file bộ từ cho "' + category + '".' });

    const pack = JSON.parse(fsSync.readFileSync(file, 'utf8'));
    let item = pack.items.find(it => it.id === id);
    const isNew = !item;

    if (isNew) {
      if (!text_en || !text_vi) {
        return res.status(400).json({ error: 'Từ mới cần nhập đủ tiếng Anh và tiếng Việt.' });
      }
      item = {
        id,
        type: 'vocab',
        prompt_audio_text: text_en,
        answer: { text_en, text_vi },
        difficulty: Number(difficulty) || 1
      };
      pack.items.push(item);
    } else {
      if (text_en) { item.answer.text_en = text_en; item.prompt_audio_text = text_en; }
      if (text_vi) item.answer.text_vi = text_vi;
      if (difficulty) item.difficulty = Number(difficulty) || item.difficulty;
    }

    // "Nhóm con" (subcategory) — tuỳ chọn, để 1 trò chơi sau này chỉ lấy
    // đúng 1 nhóm trong category (vd category=animal, subcategory=wild
    // cho "Thế giới động vật", subcategory=pet cho trò vật nuôi sau này).
    // Không gửi subcategory nghĩa là "giữ nguyên, không đổi" (giống cách
    // text_en/text_vi/difficulty đang xử lý ở trên) — không có cách xoá
    // hẳn 1 nhóm con đã gắn qua UI, chỉ có thể gán sang nhóm khác.
    if (subcategory) {
      if (!SAFE_ID.test(subcategory)) {
        return res.status(400).json({ error: 'Mã nhóm con chỉ được gồm chữ thường a-z, số, dấu gạch ngang/gạch dưới.' });
      }
      item.subcategory = subcategory;
      item.subcategory_label_vi = subcategory_label_vi
        || (pack.items.find(it => it.subcategory === subcategory && it.subcategory_label_vi) || {}).subcategory_label_vi
        || subcategory;
    }

    const folder = FOLDER_BY_CATEGORY[category];
    const destDir = path.join(ASSETS_DIR, folder);
    await ensureDir(destDir);

    const imageFile = req.files?.image?.[0];
    const videoFile = req.files?.video?.[0];

    if (imageFile) {
      const destPath = path.join(destDir, id + '.png');
      try {
        await processImageBuffer(imageFile.buffer, destPath);
      } catch (e) {
        return res.status(500).json({ error: 'Xử lý ảnh lỗi: ' + String(e.message || e) });
      }
      item.answer.image = `assets/${folder}/${id}.png`;
      delete item.answer.emoji; // có ảnh thật thì bỏ emoji tạm để UI ưu tiên ảnh
      warnings.push('Đã tự động chuyển sang PNG và xoá nền (phần nối liền 4 góc ảnh).');
    }

    if (videoFile) {
      const destPath = path.join(destDir, id + '.mp4');
      const beforeKB = Math.round(videoFile.buffer.length / 1024);
      try {
        await processVideoBuffer(videoFile.buffer, destPath);
        const afterKB = Math.round((await fs.stat(destPath)).size / 1024);
        warnings.push(`Video: ${beforeKB}KB → ${afterKB}KB sau khi nén.`);
      } catch (e) {
        return res.status(500).json({ error: 'Xử lý video lỗi: ' + String(e.message || e) });
      }
      item.answer.video = `assets/${folder}/${id}.mp4`;

      if (!imageFile && !item.answer.image) {
        const posterPath = path.join(destDir, id + '.png');
        await extractFirstFrame(destPath, posterPath);
        item.answer.image = `assets/${folder}/${id}.png`;
        delete item.answer.emoji;
        warnings.push('Chưa có ảnh riêng — đã tự lấy khung hình đầu của video làm ảnh dự phòng.');
      }
    }

    if (!item.answer.image && !item.answer.video && !item.answer.emoji) {
      return res.status(400).json({ error: 'Từ này chưa có ảnh/video/emoji nào — cần tải lên ít nhất 1 ảnh hoặc video.' });
    }

    await fs.writeFile(file, serializePack(pack), 'utf8');

    res.json({ ok: true, isNew, item, warnings });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.post('/api/publish', async (req, res) => {
  const run = (cmd, args) => execFileAsync(cmd, args, { cwd: ROOT }).catch(e => ({ error: e }));
  const log = [];
  try {
    const add = await execFileAsync('git', ['add', 'content/', 'assets/'], { cwd: ROOT });
    log.push('$ git add content/ assets/', add.stdout, add.stderr);

    const status = await execFileAsync('git', ['status', '--porcelain', '--', 'content/', 'assets/'], { cwd: ROOT });
    if (!status.stdout.trim()) {
      return res.json({ ok: true, log: log.concat('Không có gì thay đổi để xuất bản.').join('\n') });
    }

    const commitMsg = req.body?.message || 'Cập nhật nội dung (ảnh/video) qua trang quản trị';
    const commit = await execFileAsync('git', ['commit', '-m', commitMsg], { cwd: ROOT });
    log.push('$ git commit', commit.stdout, commit.stderr);

    const push = await execFileAsync('git', ['push'], { cwd: ROOT });
    log.push('$ git push', push.stdout, push.stderr);

    res.json({ ok: true, log: log.filter(Boolean).join('\n') });
  } catch (e) {
    log.push('LỖI: ' + String(e.stderr || e.message || e));
    res.status(500).json({ ok: false, log: log.filter(Boolean).join('\n') });
  }
});

app.listen(PORT, () => {
  console.log('');
  console.log('  Trò chơi:    http://localhost:' + PORT + '/index.html');
  console.log('  (Vào "Dành cho phụ huynh" trong trang trên để thêm/sửa ảnh, video)');
  console.log('');
});
