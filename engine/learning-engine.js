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
export function applyAnswer(wordsMap, wordId, skill, outcome, opts) {
  opts = opts || {};
  var now = opts.now || Date.now();
  var p = ensureSkillProgress(wordsMap, wordId, skill);

  // "Chưa tới lượt ôn" = từ này đã học rồi và lịch ôn vẫn còn ở tương lai.
  // Nó chỉ được đưa lên màn hình để lấp cho đủ số ô (xem buildRound), chứ
  // không phải vì đến hạn. Trả lời ĐÚNG một từ như vậy không được tính là
  // "nhớ thêm 1 mốc" — bản chất ngắt quãng là phải cách đủ lâu mới biết bé
  // còn nhớ hay không, nhớ ngay sau 1 phút không chứng minh được gì — nên
  // giữ nguyên cả LV lẫn lịch ôn cũ. Ngược lại, trả lời SAI thì vẫn phạt
  // như thường: sai là bằng chứng thật sự rằng bé chưa nhớ, bất kể đã cách
  // quãng bao lâu.
  var notDueYet = p.seen && p.next > now;
  p.seen = true;

  if (outcome === 'correct-fast' || outcome === 'correct-slow') {
    p.correctCount = (p.correctCount || 0) + 1;
    if (notDueYet) return p;
    // Đúng nhưng chậm: công nhận đúng, nhưng chỉ tăng LV nếu còn thấp
    // (chưa chắc). Ở LV cao, đúng-chậm giữ nguyên thay vì công nhận thuộc
    // quá sớm.
    var duocTangLevel = outcome === 'correct-fast' || p.level < 2;
    if (duocTangLevel) p.level = Math.min(MAX_LEVEL, p.level + 1);
  } else {
    p.level = Math.max(0, p.level - 1);
    p.wrongCount = (p.wrongCount || 0) + 1;
  }

  p.next = now + INTERVALS_MIN[p.level] * 60000;
  return p;
}

export function wrongRate(p) {
  if (!p) return 0;
  var total = (p.correctCount || 0) + (p.wrongCount || 0);
  return total ? (p.wrongCount || 0) / total : 0;
}

// "Sao" học tập của bé = tổng LV của TẤT CẢ kỹ năng của TẤT CẢ từ đã học
// (vd từ "tiger" có LV Nghe=1 + LV Đọc=1 → góp 2 sao). Cộng dồn tất cả 5
// kỹ năng của mọi từ, không chỉ 1 kỹ năng — khác với buildRound()/
// wrongRate() vốn luôn xét theo đúng 1 kỹ năng của 1 trò chơi.
export function totalStars(wordsMap) {
  var total = 0;
  if (!wordsMap) return total;
  Object.keys(wordsMap).forEach(function (wordId) {
    var skills = wordsMap[wordId] && wordsMap[wordId].skills;
    if (!skills) return;
    SKILLS.forEach(function (s) {
      if (skills[s] && typeof skills[s].level === 'number') total += skills[s].level;
    });
  });
  return total;
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
  // Lấp nốt cho ĐỦ "size" bằng những từ ĐÃ HỌC NHƯNG CHƯA TỚI HẠN ôn — nhóm
  // này trước đây không thuộc rổ "due" lẫn rổ "brandNew" nên bị bỏ quên hẳn:
  // khi bé đã học hết cả bộ (không còn từ mới) mà chỉ 1-3 từ đến hạn, màn
  // chơi chỉ hiện được 1-3 ô thay vì đủ 4 (lỗi thật đã gặp ở "Khu rừng kỳ
  // bí"). Chúng chỉ đóng vai trò lấp ô cho đủ — trả lời đúng một từ chưa tới
  // hạn KHÔNG được tăng LV (xem applyAnswer).
  if (round.length < size) {
    var picked = {};
    round.forEach(function (w) { picked[w.id] = true; });
    var filler = pool.filter(function (w) { return !picked[w.id]; });
    round = round.concat(shuffle(filler, rng).slice(0, size - round.length));
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
