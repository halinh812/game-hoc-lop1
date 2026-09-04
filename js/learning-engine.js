// Learning Engine — hệ Leitner (level 0-5 + INTERVALS_MIN) đã có từ bản
// trước, nâng cấp thêm:
//   1. response_time_ms: đúng-nhanh vs đúng-chậm được xử lý khác nhau
//      (đúng-chậm = chưa thật chắc, tăng level dè dặt hơn + ôn thêm 1 lần
//      trong cùng phiên thay vì chỉ chờ đến hạn ôn dài hạn).
//   2. Từ sai quay lại sớm hơn NGAY trong phiên đang chơi (hàng đợi phiên
//      động), không chỉ hạ level cho phiên sau.
//   3. Hàm chọn từ tiếp theo ưu tiên: đến hạn ôn trước, trong số đó ưu tiên
//      tỉ lệ sai cao hơn; trộn thêm từ mới; né lặp liên tiếp khi chèn lại
//      từ sai vào hàng đợi phiên.
//
// Toàn bộ hàm ở đây là pure function (nhận state, trả state mới / giá trị
// mới) để dễ test bằng dữ liệu giả — xem tools/test-learning-engine.mjs.

export const INTERVALS_MIN = [0, 10, 60 * 24, 60 * 24 * 3, 60 * 24 * 7, 60 * 24 * 14];

// Ngưỡng phân loại tốc độ trả lời. Trẻ lớp 1 đọc + bấm chọn: dưới ~2.5s là
// phản xạ khá chắc, 2.5-7s là còn đang nhớ lại/đánh vần, trên 7s coi như
// "chậm" (nhưng vẫn tính đúng, không phạt bằng sai).
export const RESPONSE_FAST_MS = 2500;
export const RESPONSE_SLOW_MS = 7000;

export function classifyAnswer(correct, responseTimeMs) {
  if (!correct) return 'wrong';
  var t = typeof responseTimeMs === 'number' ? responseTimeMs : 0;
  return t <= RESPONSE_FAST_MS ? 'correct-fast' : 'correct-slow';
}

function emptyWordProgress() {
  return { level: 0, next: 0, seen: false, correctCount: 0, wrongCount: 0 };
}

// Áp dụng 1 kết quả trả lời vào progress dài hạn của 1 từ. Trả về bản ghi
// progress mới (đã gán lại vào wordsMap).
export function applyAnswer(wordsMap, wordId, outcome) {
  var p = wordsMap[wordId] || emptyWordProgress();
  p.seen = true;

  if (outcome === 'correct-fast') {
    p.level = Math.min(5, p.level + 1);
    p.correctCount = (p.correctCount || 0) + 1;
  } else if (outcome === 'correct-slow') {
    // Đúng nhưng chậm: vẫn công nhận đúng, nhưng chỉ tăng level nếu còn ở
    // mức thấp (chưa chắc). Ở mức cao (đã gần thuộc), đúng-chậm giữ nguyên
    // level thay vì tăng, để không "khoá" từ đó là đã thuộc quá sớm.
    p.level = p.level < 2 ? Math.min(5, p.level + 1) : p.level;
    p.correctCount = (p.correctCount || 0) + 1;
  } else {
    p.level = Math.max(0, p.level - 1);
    p.wrongCount = (p.wrongCount || 0) + 1;
  }

  p.next = Date.now() + INTERVALS_MIN[p.level] * 60000;
  wordsMap[wordId] = p;
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

// Chọn danh sách từ khởi đầu cho 1 phiên học (trước khi bắt đầu trả lời).
// Ưu tiên: từ đến hạn ôn trước (trong số đó, tỉ lệ sai cao hơn lên trước,
// rồi đến level thấp hơn, rồi đến hạn sớm hơn) → sau đó trộn thêm từ mới
// chưa học để lấp đầy kích thước phiên.
export function buildRound(pool, wordsMap, opts) {
  opts = opts || {};
  var size = Math.min(opts.size || 8, pool.length);
  var now = opts.now || Date.now();
  var rng = opts.rng;

  var due = pool.filter(function (w) {
    var p = wordsMap[w.id];
    return p && p.seen && p.next <= now;
  });
  var brandNew = pool.filter(function (w) {
    var p = wordsMap[w.id];
    return !p || !p.seen;
  });

  due.sort(function (a, b) {
    var pa = wordsMap[a.id], pb = wordsMap[b.id];
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
//
// Khác với buildRound (chỉ chọn danh sách ban đầu), hàng đợi phiên có thể
// được chèn thêm từ trong lúc chơi: trả lời sai → chèn lại sau vài câu;
// đúng nhưng chậm → chèn lại xa hơn 1 chút để ôn thêm 1 lần nhẹ nhàng;
// đúng nhanh → coi như ổn trong phiên này, không chèn lại.
//
// Giới hạn số lần chèn lại tối đa cho 1 từ trong 1 phiên để tránh vòng lặp
// vô hạn nếu trẻ liên tục trả lời sai 1 từ.
export var MAX_REQUEUES_PER_WORD = 2;

export function createSessionQueue(words) {
  return words.slice();
}

// idx: vị trí câu vừa trả lời trong queue. requeueCounts: map wordId -> số
// lần đã chèn lại (để áp MAX_REQUEUES_PER_WORD), được caller giữ xuyên suốt
// phiên và truyền vào mỗi lần gọi.
export function requeueAfterAnswer(queue, idx, word, outcome, requeueCounts, rng) {
  if (outcome === 'correct-fast') return queue;

  var used = requeueCounts[word.id] || 0;
  if (used >= MAX_REQUEUES_PER_WORD) return queue;

  var random = rng || Math.random;
  var remaining = queue.length - (idx + 1);
  if (remaining <= 0) return queue;

  var minGap, spread;
  if (outcome === 'wrong') {
    minGap = 2; spread = 2; // xuất hiện lại sau ít nhất 2 câu khác
  } else {
    minGap = 4; spread = 3; // correct-slow: ôn lại thoải mái hơn, xa hơn 1 chút
  }

  var offset = minGap + Math.floor(random() * (spread + 1));
  var pos = Math.min(queue.length, idx + 1 + offset);
  // Né lặp liên tiếp: đảm bảo không chèn ngay sát vị trí hiện tại/kề bên.
  pos = Math.max(pos, Math.min(queue.length, idx + 1 + minGap));

  var newQueue = queue.slice();
  newQueue.splice(pos, 0, word);
  requeueCounts[word.id] = used + 1;
  return newQueue;
}

// Chọn 3 phương án nhiễu (distractor) cho 1 từ: ưu tiên cùng chủ đề (khó
// phân biệt hơn, đúng độ tuổi), bù thêm từ chủ đề khác nếu chủ đề đó không
// đủ 3 từ.
export function pickOptions(word, allWords, rng) {
  var sameCat = allWords.filter(function (w) { return w.cat === word.cat && w.id !== word.id; });
  var others = allWords.filter(function (w) { return w.cat !== word.cat && w.id !== word.id; });
  var distractors = shuffle(sameCat, rng).slice(0, 3);
  if (distractors.length < 3) {
    distractors = distractors.concat(shuffle(others, rng).slice(0, 3 - distractors.length));
  }
  return shuffle([word].concat(distractors), rng);
}
