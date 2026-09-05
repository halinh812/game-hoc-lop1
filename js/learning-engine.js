// Learning Engine — hệ Leitner/Anki mở rộng cho học ngôn ngữ trẻ em.
//
// Thiết kế cốt lõi: 1 từ không chỉ có "biết hay chưa" — nó có 5 KỸ NĂNG độc
// lập (Nghe/Nói/Đọc/Viết/Nhìn), mỗi kỹ năng tự chạy hệ ngắt quãng riêng
// (LV + ngày đến hạn ôn riêng). Một trò chơi CHỈ được luyện đúng 1 kỹ năng
// (ví dụ "Thế giới động vật" = nghe âm thanh tiếng Anh → chọn đúng hình =
// liên kết Âm thanh→Hình ảnh = kỹ năng Nghe) và chỉ được cập nhật LV của
// kỹ năng đó — không được đụng vào 4 kỹ năng còn lại của từ đó.
//
// response_time_ms vẫn được dùng để phân loại đúng-nhanh / đúng-chậm / sai
// như trước — ảnh hưởng tới việc LV tăng bao nhiêu, không đổi.

export var SKILLS = ['listen', 'speak', 'read', 'write', 'see'];
export var SKILL_LABELS = { listen: 'Nghe', speak: 'Nói', read: 'Đọc', write: 'Viết', see: 'Nhìn' };

// LV0 = chưa học (luôn đến hạn ngay). LV1-10 = mốc ôn tập kiểu Anki, giãn
// gấp đôi dần đều (kể cả 3 mốc cuối — SRS cần đà tăng KHÔNG chậm lại khi
// trẻ đã nhớ chắc, nếu không hệ thống sẽ bắt ôn "nhớ chắc" y như "mới nhớ").
export var INTERVALS_MIN = [
  0,             // LV0
  1,             // LV1  - 1 phút
  10,            // LV2  - 10 phút
  60 * 24,       // LV3  - 1 ngày
  60 * 24 * 2,   // LV4  - 2 ngày
  60 * 24 * 4,   // LV5  - 4 ngày
  60 * 24 * 7,   // LV6  - 7 ngày
  60 * 24 * 14,  // LV7  - 14 ngày
  60 * 24 * 30,  // LV8  - 30 ngày
  60 * 24 * 60,  // LV9  - 60 ngày
  60 * 24 * 120  // LV10 - 120 ngày (~1 học kỳ)
];
export var MAX_LEVEL = INTERVALS_MIN.length - 1;

export var RESPONSE_FAST_MS = 2500;
export var RESPONSE_SLOW_MS = 7000;

export function classifyAnswer(correct, responseTimeMs) {
  if (!correct) return 'wrong';
  var t = typeof responseTimeMs === 'number' ? responseTimeMs : 0;
  return t <= RESPONSE_FAST_MS ? 'correct-fast' : 'correct-slow';
}

function emptySkillProgress() {
  return { level: 0, next: 0, seen: false, correctCount: 0, wrongCount: 0 };
}

function ensureSkillProgress(wordsMap, wordId, skill) {
  var w = wordsMap[wordId];
  if (!w) { w = { skills: {} }; wordsMap[wordId] = w; }
  if (!w.skills) w.skills = {};
  if (!w.skills[skill]) w.skills[skill] = emptySkillProgress();
  return w.skills[skill];
}

export function getSkillProgress(wordsMap, wordId, skill) {
  var w = wordsMap[wordId];
  return (w && w.skills && w.skills[skill]) || null;
}

// Áp dụng 1 kết quả trả lời vào ĐÚNG 1 kỹ năng của 1 từ. Trả về bản ghi
// progress mới của riêng kỹ năng đó (4 kỹ năng còn lại của từ không đổi).
export function applyAnswer(wordsMap, wordId, skill, outcome) {
  var p = ensureSkillProgress(wordsMap, wordId, skill);
  p.seen = true;

  if (outcome === 'correct-fast') {
    p.level = Math.min(MAX_LEVEL, p.level + 1);
    p.correctCount = (p.correctCount || 0) + 1;
  } else if (outcome === 'correct-slow') {
    // Đúng nhưng chậm: công nhận đúng, nhưng chỉ tăng LV nếu còn thấp
    // (chưa chắc). Ở LV cao, đúng-chậm giữ nguyên thay vì công nhận thuộc
    // quá sớm.
    p.level = p.level < 2 ? Math.min(MAX_LEVEL, p.level + 1) : p.level;
    p.correctCount = (p.correctCount || 0) + 1;
  } else {
    p.level = Math.max(0, p.level - 1);
    p.wrongCount = (p.wrongCount || 0) + 1;
  }

  p.next = Date.now() + INTERVALS_MIN[p.level] * 60000;
  return p;
}

export function wrongRate(p) {
  if (!p) return 0;
  var total = (p.correctCount || 0) + (p.wrongCount || 0);
  return total ? (p.wrongCount || 0) / total : 0;
}

export function shuffle(arr, rng) {
  var random = rng || Math.random;
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// Chọn danh sách từ khởi đầu cho 1 phiên chơi, XÉT THEO 1 KỸ NĂNG cụ thể
// (vd 1 từ có thể đã "Nghe" tốt nhưng chưa từng luyện "Đọc" — 2 kỹ năng độc
// lập hoàn toàn). Ưu tiên: đến hạn ôn trước (trong đó ưu tiên tỉ lệ sai cao
// hơn), rồi trộn thêm từ chưa từng luyện kỹ năng này để lấp đầy phiên.
export function buildRound(pool, wordsMap, skill, opts) {
  opts = opts || {};
  var size = Math.min(opts.size || 8, pool.length);
  var now = opts.now || Date.now();
  var rng = opts.rng;

  var due = pool.filter(function (w) {
    var p = getSkillProgress(wordsMap, w.id, skill);
    return p && p.seen && p.next <= now;
  });
  var brandNew = pool.filter(function (w) {
    var p = getSkillProgress(wordsMap, w.id, skill);
    return !p || !p.seen;
  });

  due.sort(function (a, b) {
    var pa = getSkillProgress(wordsMap, a.id, skill);
    var pb = getSkillProgress(wordsMap, b.id, skill);
    return (wrongRate(pb) - wrongRate(pa)) || (pa.level - pb.level) || (pa.next - pb.next);
  });

  var round = due.slice(0, size);
  if (round.length < size) {
    round = round.concat(shuffle(brandNew, rng).slice(0, size - round.length));
  }
  if (round.length === 0) {
    round = shuffle(pool.slice(), rng).slice(0, size);
  }
  return shuffle(round, rng);
}

// --- Hàng đợi động trong phiên (session queue) ---
// Không phụ thuộc kỹ năng — chỉ xáo/chèn lại các đối tượng từ trong 1 phiên.
export var MAX_REQUEUES_PER_WORD = 2;

export function createSessionQueue(words) {
  return words.slice();
}

export function requeueAfterAnswer(queue, idx, word, outcome, requeueCounts, rng) {
  if (outcome === 'correct-fast') return queue;

  var used = requeueCounts[word.id] || 0;
  if (used >= MAX_REQUEUES_PER_WORD) return queue;

  var random = rng || Math.random;
  var remaining = queue.length - (idx + 1);
  if (remaining <= 0) return queue;

  var minGap, spread;
  if (outcome === 'wrong') {
    minGap = 2; spread = 2;
  } else {
    minGap = 4; spread = 3;
  }

  var offset = minGap + Math.floor(random() * (spread + 1));
  var pos = Math.min(queue.length, idx + 1 + offset);
  pos = Math.max(pos, Math.min(queue.length, idx + 1 + minGap));

  var newQueue = queue.slice();
  newQueue.splice(pos, 0, word);
  requeueCounts[word.id] = used + 1;
  return newQueue;
}

// Chọn 3 phương án nhiễu cho 1 từ: ưu tiên cùng chủ đề, bù thêm từ chủ đề
// khác nếu không đủ 3.
export function pickOptions(word, allWords, rng) {
  var sameCat = allWords.filter(function (w) { return w.cat === word.cat && w.id !== word.id; });
  var others = allWords.filter(function (w) { return w.cat !== word.cat && w.id !== word.id; });
  var distractors = shuffle(sameCat, rng).slice(0, 3);
  if (distractors.length < 3) {
    distractors = distractors.concat(shuffle(others, rng).slice(0, 3 - distractors.length));
  }
  return shuffle([word].concat(distractors), rng);
}
