// Test thủ công cho Learning Engine bằng dữ liệu giả (không phụ thuộc
// trình duyệt/localStorage — mọi hàm trong learning-engine.js là pure
// function nên chạy thẳng được bằng Node).
//
// Chạy: node tools/test-learning-engine.mjs

import assert from 'node:assert/strict';
import {
  INTERVALS_MIN,
  RESPONSE_FAST_MS,
  RESPONSE_SLOW_MS,
  MAX_REQUEUES_PER_WORD,
  classifyAnswer,
  applyAnswer,
  wrongRate,
  buildRound,
  createSessionQueue,
  requeueAfterAnswer,
  pickOptions,
  shuffle
} from '../js/learning-engine.js';

var tests = [];
function test(name, fn) { tests.push({ name: name, fn: fn }); }

// Bộ từ giả: 6 từ, 2 chủ đề, đủ để test lọc theo cat + phân biệt distractor.
function fakeWords() {
  return [
    { id: 'w1', en: 'one', vi: 'một', cat: 'number' },
    { id: 'w2', en: 'two', vi: 'hai', cat: 'number' },
    { id: 'w3', en: 'three', vi: 'ba', cat: 'number' },
    { id: 'w4', en: 'red', vi: 'đỏ', cat: 'color' },
    { id: 'w5', en: 'blue', vi: 'xanh', cat: 'color' },
    { id: 'w6', en: 'green', vi: 'lục', cat: 'color' }
  ];
}

function seededRng(seed) {
  var s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    var t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- classifyAnswer ---

test('classifyAnswer: sai luôn là "wrong" bất kể thời gian', function () {
  assert.equal(classifyAnswer(false, 100), 'wrong');
  assert.equal(classifyAnswer(false, 99999), 'wrong');
});

test('classifyAnswer: đúng + nhanh (<= ngưỡng) là "correct-fast"', function () {
  assert.equal(classifyAnswer(true, 0), 'correct-fast');
  assert.equal(classifyAnswer(true, RESPONSE_FAST_MS), 'correct-fast');
});

test('classifyAnswer: đúng + chậm (> ngưỡng nhanh) là "correct-slow"', function () {
  assert.equal(classifyAnswer(true, RESPONSE_FAST_MS + 1), 'correct-slow');
  assert.equal(classifyAnswer(true, RESPONSE_SLOW_MS + 5000), 'correct-slow');
});

// --- applyAnswer ---

test('applyAnswer: correct-fast từ từ mới -> level tăng lên 1, correctCount=1', function () {
  var words = {};
  var p = applyAnswer(words, 'w1', 'correct-fast');
  assert.equal(p.level, 1);
  assert.equal(p.correctCount, 1);
  assert.equal(p.wrongCount, 0);
  assert.ok(p.seen);
  assert.ok(p.next > Date.now() - 1);
});

test('applyAnswer: wrong từ level 0 -> level giữ 0 (không âm), wrongCount=1', function () {
  var words = {};
  var p = applyAnswer(words, 'w1', 'wrong');
  assert.equal(p.level, 0);
  assert.equal(p.wrongCount, 1);
});

test('applyAnswer: wrong từ level cao hơn -> level giảm 1', function () {
  var words = { w1: { level: 3, next: 0, seen: true, correctCount: 3, wrongCount: 0 } };
  var p = applyAnswer(words, 'w1', 'wrong');
  assert.equal(p.level, 2);
});

test('applyAnswer: correct-slow ở level thấp (<2) vẫn tăng level (chưa chắc, cần củng cố)', function () {
  var words = { w1: { level: 0, next: 0, seen: true, correctCount: 0, wrongCount: 0 } };
  var p = applyAnswer(words, 'w1', 'correct-slow');
  assert.equal(p.level, 1);
});

test('applyAnswer: correct-slow ở level cao (>=2) giữ nguyên level (không công nhận thuộc quá sớm)', function () {
  var words = { w1: { level: 3, next: 0, seen: true, correctCount: 5, wrongCount: 0 } };
  var p = applyAnswer(words, 'w1', 'correct-slow');
  assert.equal(p.level, 3);
});

test('applyAnswer: level không vượt quá 5 hay xuống dưới 0', function () {
  var words = { w1: { level: 5, next: 0, seen: true, correctCount: 10, wrongCount: 0 } };
  applyAnswer(words, 'w1', 'correct-fast');
  assert.equal(words.w1.level, 5);

  var words2 = { w2: { level: 0, next: 0, seen: true, correctCount: 0, wrongCount: 3 } };
  applyAnswer(words2, 'w2', 'wrong');
  assert.equal(words2.w2.level, 0);
});

test('applyAnswer: next = now + đúng khoảng INTERVALS_MIN theo level mới', function () {
  var words = {};
  var before = Date.now();
  var p = applyAnswer(words, 'w1', 'correct-fast');
  var expectedMin = before + INTERVALS_MIN[1] * 60000;
  assert.ok(Math.abs(p.next - expectedMin) < 2000, 'next phải xấp xỉ now + interval[level]');
});

test('wrongRate: tính đúng tỉ lệ sai, 0 khi chưa có lượt nào', function () {
  assert.equal(wrongRate(null), 0);
  assert.equal(wrongRate({ correctCount: 0, wrongCount: 0 }), 0);
  assert.equal(wrongRate({ correctCount: 1, wrongCount: 3 }), 0.75);
});

// --- buildRound ---

test('buildRound: chưa học gì thì trả về từ mới (đủ size, không trùng)', function () {
  var words = fakeWords();
  var round = buildRound(words, {}, { size: 4, rng: seededRng(1) });
  assert.equal(round.length, 4);
  var ids = round.map(function (w) { return w.id; });
  assert.equal(new Set(ids).size, 4, 'không được trùng từ trong 1 round');
});

test('buildRound: từ đến hạn ôn được ưu tiên trước từ mới', function () {
  var words = fakeWords();
  var now = Date.now();
  var progress = {
    w1: { level: 2, next: now - 1000, seen: true, correctCount: 2, wrongCount: 0 } // đã đến hạn
  };
  var round = buildRound(words, progress, { size: 1, now: now, rng: seededRng(2) });
  assert.equal(round[0].id, 'w1');
});

test('buildRound: trong số từ đến hạn, tỉ lệ sai cao hơn được ưu tiên lên trước', function () {
  var words = fakeWords();
  var now = Date.now();
  var progress = {
    w1: { level: 2, next: now - 1000, seen: true, correctCount: 4, wrongCount: 0 }, // sai 0%
    w2: { level: 2, next: now - 1000, seen: true, correctCount: 1, wrongCount: 3 }  // sai 75%
  };
  var round = buildRound(words, progress, { size: 2, now: now, rng: seededRng(3) });
  assert.equal(round[0].id, 'w2', 'từ sai nhiều hơn phải được xếp ưu tiên ôn trước');
});

// --- session queue / requeue ---

test('requeueAfterAnswer: correct-fast không chèn lại (đã ổn trong phiên này)', function () {
  var words = fakeWords();
  var queue = createSessionQueue(words);
  var counts = {};
  var result = requeueAfterAnswer(queue, 0, words[0], 'correct-fast', counts, seededRng(4));
  assert.equal(result.length, queue.length);
});

test('requeueAfterAnswer: wrong chèn lại từ đó cách ít nhất 2 câu (né lặp liên tiếp)', function () {
  var words = fakeWords();
  var queue = createSessionQueue(words);
  var counts = {};
  var result = requeueAfterAnswer(queue, 0, words[0], 'wrong', counts, seededRng(5));
  assert.equal(result.length, queue.length + 1, 'phải có thêm 1 câu trong hàng đợi');
  var newPos = result.indexOf(words[0], 1); // tìm bản chèn lại, bỏ qua vị trí gốc idx 0
  assert.ok(newPos >= 3, 'vị trí chèn lại phải cách xa vị trí vừa trả lời (idx 0) ít nhất 2 câu khác, thấy: ' + newPos);
});

test('requeueAfterAnswer: correct-slow cũng được chèn lại (ôn thêm 1 lần nhẹ)', function () {
  var words = fakeWords();
  var queue = createSessionQueue(words);
  var counts = {};
  var result = requeueAfterAnswer(queue, 0, words[0], 'correct-slow', counts, seededRng(6));
  assert.equal(result.length, queue.length + 1);
});

test('requeueAfterAnswer: tôn trọng MAX_REQUEUES_PER_WORD, không lặp vô hạn dù trả lời sai liên tục', function () {
  // Dùng đủ nhiều từ khác để luôn còn "chỗ trống" phía sau idx 0 mà chèn
  // vào (giống 1 phiên học thật, không chỉ có 1 từ duy nhất).
  var words = fakeWords();
  var queue = createSessionQueue(words);
  var startLen = queue.length;
  var counts = {};
  var rng = seededRng(7);
  for (var i = 0; i < MAX_REQUEUES_PER_WORD + 5; i++) {
    queue = requeueAfterAnswer(queue, 0, words[0], 'wrong', counts, rng);
  }
  assert.equal(counts.w1, MAX_REQUEUES_PER_WORD, 'không được chèn lại quá MAX_REQUEUES_PER_WORD lần');
  assert.equal(queue.length, startLen + MAX_REQUEUES_PER_WORD);
});

// --- pickOptions ---

test('pickOptions: luôn có đúng 4 lựa chọn, gồm cả đáp án đúng', function () {
  var words = fakeWords();
  var opts = pickOptions(words[0], words, seededRng(8));
  assert.equal(opts.length, 4);
  assert.ok(opts.some(function (o) { return o.id === words[0].id; }));
  var ids = opts.map(function (o) { return o.id; });
  assert.equal(new Set(ids).size, 4, 'không được có lựa chọn trùng nhau');
});

test('pickOptions: ưu tiên nhiễu cùng chủ đề khi đủ số lượng', function () {
  var words = fakeWords(); // 3 từ "number", 3 từ "color"
  var opts = pickOptions(words[0], words, seededRng(9)); // words[0] là "number"
  var sameCat = opts.filter(function (o) { return o.cat === 'number'; });
  assert.equal(sameCat.length, 3, 'cả 3 từ number còn lại nên được dùng làm nhiễu vì đủ số lượng');
});

// --- shuffle (sanity) ---

test('shuffle: giữ nguyên tập phần tử, chỉ đổi thứ tự', function () {
  var arr = [1, 2, 3, 4, 5];
  var out = shuffle(arr, seededRng(10));
  assert.equal(out.length, arr.length);
  assert.deepEqual(out.slice().sort(), arr.slice().sort());
});

// --- runner ---

var pass = 0, fail = 0;
tests.forEach(function (t) {
  try {
    t.fn();
    pass++;
    console.log('  ok - ' + t.name);
  } catch (e) {
    fail++;
    console.log('  FAIL - ' + t.name);
    console.log('    ' + (e && e.message ? e.message : e));
  }
});

console.log('\n' + pass + ' passed, ' + fail + ' failed (tổng ' + tests.length + ')');
process.exit(fail ? 1 : 0);
