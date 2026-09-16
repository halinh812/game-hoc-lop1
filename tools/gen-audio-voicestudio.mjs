// Sinh toàn bộ file âm thanh tiếng Anh cho game bằng VoiceStudio chạy trên máy.
//
// Cách dùng (mở app VoiceStudio lên trước, để nó chạy nền):
//   VS_PROFILE=<id giọng đang dùng thật> node tools/gen-audio-voicestudio.mjs
//
// QUAN TRỌNG — PHẢI truyền VS_PROFILE (hoặc VS_INSTRUCT) mỗi lần chạy, KHÔNG
// còn giá trị mặc định nữa (trước đây mặc định "demo0001" — đúng lúc mới viết
// script, nhưng 122 file .wav ĐANG CÓ trong assets/audio/en/ đã được thu lại
// bằng 1 giọng nữ CLONE từ mẫu ElevenLabs, không phải demo0001 nữa, xem Vòng
// 47/48 trong ROADMAP.md). Giữ mặc định ngầm sẽ rất dễ dính lỗi thật: thêm 1
// từ mới vào content pack, quên truyền VS_PROFILE, script vẫn chạy được bình
// thường (không báo lỗi gì) nhưng ra 1 file lệch hẳn giọng so với 122 file
// còn lại mà không ai để ý cho tới khi mở game lên nghe thử. Bắt buộc truyền
// tay để LUÔN phải tự hỏi "giọng nào đang dùng thật" trước khi sinh thêm —
// xem giọng đã lưu bằng: curl http://127.0.0.1:3900/profiles
//
// Biến môi trường khác (giữ nguyên nếu không cần đổi):
//   VS_PROFILE=demo0001   id giọng đã lưu (xem: curl localhost:3900/profiles)
//   VS_INSTRUCT="..."     mô tả giọng, DÙNG THAY cho VS_PROFILE. Chỉ nhận thuộc
//                         tính, không nhận câu lệnh kiểu "đọc chậm":
//                           gender : male | female
//                           age    : child | teenager | young adult |
//                                    middle-aged | elderly
//                           pitch  : very low | low | moderate | high |
//                                    very high pitch
//                           accent : american | british | australian |
//                                    canadian | indian ... accent
//                         Ví dụ: "female, teenager, moderate pitch, american accent"
//   VS_SPEED=0.8          tốc độ đọc, 1 = gốc, nhỏ hơn = chậm và rõ hơn
//   VS_NUM_STEP=16        số bước sinh, cao hơn = kỹ hơn nhưng chậm hơn
//   VS_EFFECT=broadcast   hậu kỳ: broadcast | podcast | bright | warm |
//                         cinematic | raw
//   VS_ENGINE=            để trống = engine mặc định (omnivoice, chạy GPU).
//                         Đặt "kittentts" để dùng 8 giọng preset tiếng Anh
//                         chạy CPU (VS_PROFILE kiểu expr-voice-2-f).
//   VS_SEED=1234          seed lần sinh đầu. Câu nào ra file rỗng tiếng thì tự
//                         thử lại với seed khác (giọng clone lấy từ file mẫu
//                         nên đổi seed KHÔNG làm đổi giọng)
//   VS_NO_PERIOD=1        tắt việc tự thêm dấu chấm (xem speechTextFor)
//   VS_OUT=assets/audio/en  thư mục ghi ra
//
// Script CHẠY LẠI ĐƯỢC: câu nào đã có file .wav hợp lệ thì bỏ qua, nên có thể
// dừng giữa chừng rồi chạy tiếp. Muốn ĐỔI GIỌNG thì phải xoá hết .wav cũ đi:
//   rm assets/audio/en/*.wav && node tools/gen-audio-voicestudio.mjs
//
// Quy tắc đặt tên file khớp đúng slugifyAudioText() trong engine/audio-provider.js.
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://127.0.0.1:3900';
const PACKS = 'content/packs';
const OUT = process.env.VS_OUT || path.join('assets', 'audio', 'en');
const ENGINE = process.env.VS_ENGINE || '';
const PROFILE = process.env.VS_PROFILE || '';
const INSTRUCT = process.env.VS_INSTRUCT || '';
const SPEED = process.env.VS_SPEED || '';
const NUM_STEP = process.env.VS_NUM_STEP || '';
const EFFECT = process.env.VS_EFFECT || '';
const SEED = process.env.VS_SEED || '1234';
const ADD_PERIOD = process.env.VS_NO_PERIOD !== '1';

function slugifyAudioText(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

// Text ĐỌC khác text dùng ĐẶT TÊN FILE. Từ đơn gửi vào trần trụi ("A",
// "rice cooker") bị model coi là mẩu vụn nên đọc cụt, lướt qua; thêm dấu chấm
// cho nó thành một câu hoàn chỉnh thì model đọc trọn vẹn, rõ âm hơn hẳn
// (đo được: "A" 0,84s -> "A." 1,12s, dài hơn 1/3). Tên file vẫn slug từ text
// GỐC nên manifest.json và engine/audio-provider.js không bị lệch.
function speechTextFor(text) {
  if (!ADD_PERIOD) return text;
  const trimmed = text.trim();
  if (/[.!?]$/.test(trimmed)) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1) + '.';
}

// Gom mọi giá trị "prompt_audio_text" trong content/packs/*.json (bỏ trùng lặp).
function collectTexts() {
  const seen = new Map();
  for (const file of fs.readdirSync(PACKS).sort()) {
    if (!file.endsWith('.json')) continue;
    const walk = (node) => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== 'object') return;
      for (const [key, value] of Object.entries(node)) {
        if (key === 'prompt_audio_text' && typeof value === 'string') {
          if (!seen.has(value)) seen.set(value, slugifyAudioText(value));
        } else walk(value);
      }
    };
    walk(JSON.parse(fs.readFileSync(path.join(PACKS, file), 'utf8')));
  }
  return [...seen.entries()].map(([text, slug]) => ({ text, slug }));
}

function isValidWav(buf) {
  return buf.length > 2000 &&
    buf.toString('latin1', 0, 4) === 'RIFF' &&
    buf.toString('latin1', 8, 12) === 'WAVE';
}

// Độ to trung bình (RMS, đơn vị dBFS) của file WAV 16-bit mono.
// CẦN CÓ vì model thỉnh thoảng trả về file "hợp lệ" nhưng rỗng tiếng — đã gặp
// thật: giọng clone từ mẫu do chính model bịa ra cho ra file im lặng tới 37%
// số lần với câu ngắn, mà nhìn kích thước file thì không thể biết. Giọng tốt
// đo được khoảng -15 đến -25 dB.
const SILENCE_DB = -50;
function rmsDb(buf) {
  let sum = 0, count = 0;
  for (let i = 44; i + 1 < buf.length; i += 2) {
    const sample = buf.readInt16LE(i) / 32768;
    sum += sample * sample;
    count++;
  }
  if (!count) return -Infinity;
  return 20 * Math.log10(Math.sqrt(sum / count) + 1e-12);
}

// attempt = 1 thì dùng đúng SEED đã đặt; các lần thử lại đổi seed.
// Với giọng CLONE, seed KHÔNG quyết định giọng nói là ai — giọng lấy từ file
// mẫu (ref_audio) của profile, seed chỉ đổi phần nhiễu khi sinh. Nên đổi seed
// không làm lệch giọng giữa các câu, mà lại cứu được đúng kiểu lỗi đã đo
// được: "O." ra file rỗng tiếng ở seed 1234 và 2, nhưng bình thường ở seed
// 1, 3, 7, 99. Thử lại mà giữ nguyên seed thì lần nào cũng hỏng y hệt.
async function generate(text, attempt = 1) {
  const form = new FormData();
  form.append('text', speechTextFor(text));
  if (ENGINE) form.append('engine', ENGINE);
  // instruct = tự thiết kế giọng theo mô tả; khi có nó thì KHÔNG gửi profile_id
  // (profile_id là giọng đã lưu sẵn — hai đường này loại trừ nhau).
  if (INSTRUCT) form.append('instruct', INSTRUCT);
  else form.append('profile_id', PROFILE);
  form.append('language', 'English');
  form.append('seed', attempt === 1 ? SEED : String(Number(SEED) + attempt));
  if (SPEED) form.append('speed', SPEED);
  if (NUM_STEP) form.append('num_step', NUM_STEP);
  if (EFFECT) form.append('effect_preset', EFFECT);
  const res = await fetch(BASE + '/generate', { method: 'POST', body: form });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + (await res.text()).slice(0, 200));
  return Buffer.from(await res.arrayBuffer());
}

if (!PROFILE && !INSTRUCT) {
  console.error(
    'Thiếu VS_PROFILE (hoặc VS_INSTRUCT) — không còn giọng mặc định ngầm nữa.\n' +
    '122 file .wav hiện có trong assets/audio/en/ dùng 1 giọng nữ CLONE từ\n' +
    'mẫu ElevenLabs (không phải "demo0001"). Xem giọng đã lưu trên máy này:\n' +
    '  curl http://127.0.0.1:3900/profiles\n' +
    'rồi chạy lại: VS_PROFILE=<id đúng giọng đang dùng> node tools/gen-audio-voicestudio.mjs'
  );
  process.exit(1);
}

const health = await fetch(BASE + '/health').then(r => r.json()).catch(() => null);
if (!health) {
  console.error('Không nối được tới VoiceStudio ở ' + BASE + ' — mở app VoiceStudio lên rồi chạy lại.');
  process.exit(1);
}
console.log('VoiceStudio ' + health.version + ' — thiết bị: ' + health.device);
console.log('Giọng: ' + (INSTRUCT ? 'instruct "' + INSTRUCT + '"' : PROFILE) +
  (ENGINE ? ' (engine ' + ENGINE + ')' : '') +
  ', seed ' + SEED +
  (SPEED ? ', speed ' + SPEED : '') +
  (NUM_STEP ? ', num_step ' + NUM_STEP : '') +
  (EFFECT ? ', effect ' + EFFECT : '') +
  (ADD_PERIOD ? ', tự thêm dấu chấm' : '') + '\n');

const items = collectTexts();
fs.mkdirSync(OUT, { recursive: true });

const failed = [];
let made = 0, skipped = 0;
for (const item of items) {
  const dest = path.join(OUT, item.slug + '.wav');
  if (fs.existsSync(dest) && isValidWav(fs.readFileSync(dest))) { skipped++; continue; }

  let ok = false;
  for (let attempt = 1; attempt <= 5 && !ok; attempt++) {
    try {
      const buf = await generate(item.text, attempt);
      if (!isValidWav(buf)) throw new Error('trả về không phải WAV hợp lệ (' + buf.length + ' bytes)');
      const db = rmsDb(buf);
      if (db < SILENCE_DB) throw new Error('file rỗng tiếng (' + db.toFixed(1) + ' dB) — giọng này không ổn định với câu ngắn');
      fs.writeFileSync(dest, buf);
      ok = true;
      made++;
      console.log('[' + (made + skipped) + '/' + items.length + '] ' + item.slug + '.wav  (' + db.toFixed(1) + ' dB)');
    } catch (err) {
      console.log("  ! " + item.slug + " lần " + attempt + "/5 lỗi: " + err.message);
      if (attempt === 5) failed.push({ slug: item.slug, text: item.text, error: err.message });
      else await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
}

// manifest.json liệt kê slug của những câu ĐÃ có file thật — engine/audio-provider.js
// tra cứu danh sách này để biết câu nào phát file, câu nào rơi về Web Speech.
const slugs = fs.readdirSync(OUT).filter(f => f.endsWith('.wav')).map(f => f.slice(0, -4)).sort();
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(slugs, null, 2) + '\n');

console.log('\nXong: tạo mới ' + made + ', bỏ qua ' + skipped + ', lỗi ' + failed.length);
console.log('manifest.json: ' + slugs.length + ' câu có file thật');
if (failed.length) {
  console.log(JSON.stringify(failed, null, 1));
  process.exitCode = 1;
}
