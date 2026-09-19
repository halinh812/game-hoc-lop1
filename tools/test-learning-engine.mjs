// Test thủ công cho Learning Engine bằng dữ liệu giả — mọi hàm trong
// learning-engine.js là pure function nên chạy thẳng được bằng Node.
//
// Chạy: node tools/test-learning-engine.mjs

import assert from 'node:assert/strict';
import {
  SKILLS,
  INTERVALS_MIN,
  MAX_LEVEL,
  RESPONSE_FAST_MS,
  RESPONSE_SLOW_MS,
  MAX_REQUEUES_PER_WORD,
  classifyAnswer,
  applyAnswer,
  getSkillProgress,
  wrongRate,
  totalStars,
  buildRound,
  createSessionQueue,
  requeueAfterAnswer,
  pickOptions,
  shuffle
} from '../engine/learning-engine.js';
import { buildBunnyPath, BUNNY_COLS, BUNNY_ROWS, BUNNY_WIN_TARGET } from '../games/bunny-maze/bunnymaze.js';

var tests = [];
function test(name, fn) { tests.push({ name: name, fn: fn }); }

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

// --- applyAnswer: mỗi kỹ năng độc lập ---

test('applyAnswer: correct-fast trên kỹ năng "listen" -> LV tăng lên 1, không đụng kỹ năng khác', function () {
  var words = {};
  var p = applyAnswer(words, 'w1', 'listen', 'correct-fast');
  assert.equal(p.level, 1);
  assert.equal(p.correctCount, 1);
  assert.equal(getSkillProgress(words, 'w1', 'read'), null, 'kỹ năng "read" của từ này chưa hề bị đụng tới');
});

test('applyAnswer: 2 kỹ năng của CÙNG 1 từ tiến độ hoàn toàn tách biệt', function () {
  var words = {};
  var t0 = Date.now();
  applyAnswer(words, 'w1', 'listen', 'correct-fast', { now: t0 });
  // Lần đúng thứ 2 phải cách đủ lâu để từ TỚI HẠN ôn lại (LV1 = 1 phút) thì
  // mới được tính tăng LV — trả lời lại ngay lập tức không tăng (xem
  // applyAnswer / test "chưa tới hạn ôn" bên dưới).
  applyAnswer(words, 'w1', 'listen', 'correct-fast', { now: t0 + 2 * 60000 });
  applyAnswer(words, 'w1', 'read', 'wrong');
  var listenP = getSkillProgress(words, 'w1', 'listen');
  var readP = getSkillProgress(words, 'w1', 'read');
  assert.equal(listenP.level, 2, 'listen đã tăng 2 lần đúng liên tiếp');
  assert.equal(readP.level, 0, 'read chỉ có 1 lần sai, không liên quan gì tới listen');
  assert.equal(readP.wrongCount, 1);
});

test('applyAnswer: wrong từ LV0 -> LV giữ 0 (không âm)', function () {
  var words = {};
  var p = applyAnswer(words, 'w1', 'speak', 'wrong');
  assert.equal(p.level, 0);
  assert.equal(p.wrongCount, 1);
});

test('applyAnswer: wrong từ LV cao hơn -> LV giảm 1', function () {
  var words = { w1: { skills: { speak: { level: 3, next: 0, seen: true, correctCount: 3, wrongCount: 0 } } } };
  var p = applyAnswer(words, 'w1', 'speak', 'wrong');
  assert.equal(p.level, 2);
});

test('applyAnswer: correct-slow ở LV thấp (<2) vẫn tăng LV', function () {
  var words = { w1: { skills: { see: { level: 0, next: 0, seen: true, correctCount: 0, wrongCount: 0 } } } };
  var p = applyAnswer(words, 'w1', 'see', 'correct-slow');
  assert.equal(p.level, 1);
});

test('applyAnswer: correct-slow ở LV cao (>=2) giữ nguyên LV', function () {
  var words = { w1: { skills: { see: { level: 3, next: 0, seen: true, correctCount: 5, wrongCount: 0 } } } };
  var p = applyAnswer(words, 'w1', 'see', 'correct-slow');
  assert.equal(p.level, 3);
});

test('applyAnswer: LV không vượt quá MAX_LEVEL (10) hay xuống dưới 0', function () {
  var words = { w1: { skills: { write: { level: MAX_LEVEL, next: 0, seen: true, correctCount: 10, wrongCount: 0 } } } };
  applyAnswer(words, 'w1', 'write', 'correct-fast');
  assert.equal(words.w1.skills.write.level, MAX_LEVEL);

  var words2 = { w2: { skills: { write: { level: 0, next: 0, seen: true, correctCount: 0, wrongCount: 3 } } } };
  applyAnswer(words2, 'w2', 'write', 'wrong');
  assert.equal(words2.w2.skills.write.level, 0);
});

test('applyAnswer: đúng nhưng từ CHƯA TỚI HẠN ôn -> giữ nguyên LV và lịch ôn', function () {
  // Từ chưa tới hạn chỉ lên màn hình để lấp cho đủ ô (xem buildRound). Nhớ
  // được ngay sau vài giây không chứng minh bé đã nhớ lâu, nên không tăng LV
  // và cũng không được dời lịch ôn đã hẹn.
  var now = Date.now();
  var nextCu = now + 60 * 60000;
  var words = { w1: { skills: { listen: { level: 4, next: nextCu, seen: true, correctCount: 4, wrongCount: 0 } } } };
  var p = applyAnswer(words, 'w1', 'listen', 'correct-fast', { now: now });
  assert.equal(p.level, 4, 'LV giữ nguyên, không tăng');
  assert.equal(p.next, nextCu, 'lịch ôn giữ nguyên, không bị dời');
  assert.equal(p.correctCount, 5, 'vẫn ghi nhận là 1 lần trả lời đúng');
});

test('applyAnswer: opts.skipDueGate -> vẫn tăng LV dù chưa tới hạn (kho từ nhỏ, vd "How Many?")', function () {
  // Game chỉ hỏi 1 câu/lượt với kho từ rất nhỏ (10 số) lặp hết vòng nhanh
  // hơn hẳn mốc hẹn ôn LV1 -> luật "chưa tới hạn" (sinh ra để chặn Ô LẤP
  // CHỖ TRỐNG ở màn 4 ô) không áp dụng, dùng skipDueGate để bỏ qua.
  var now = Date.now();
  var nextCu = now + 60 * 60000; // còn 1 tiếng nữa mới tới hạn theo lịch cũ
  var words = { w1: { skills: { see: { level: 1, next: nextCu, seen: true, correctCount: 1, wrongCount: 0 } } } };
  var p = applyAnswer(words, 'w1', 'see', 'correct-fast', { now: now, skipDueGate: true });
  assert.equal(p.level, 2, 'LV vẫn tăng dù chưa tới hạn');
  assert.equal(p.next, now + INTERVALS_MIN[2] * 60000, 'lịch ôn được TÍNH LẠI theo LV mới (10 phút), không giữ lịch cũ (1 tiếng)');
});

test('applyAnswer: SAI ở từ chưa tới hạn ôn -> vẫn bị giảm LV như thường', function () {
  // Sai là bằng chứng thật sự rằng bé chưa nhớ, bất kể đã cách quãng bao lâu.
  var now = Date.now();
  var nextCu = now + INTERVALS_MIN[4] * 60000; // đúng lịch của LV4: 2 ngày nữa
  var words = { w1: { skills: { listen: { level: 4, next: nextCu, seen: true, correctCount: 4, wrongCount: 0 } } } };
  var p = applyAnswer(words, 'w1', 'listen', 'wrong', { now: now });
  assert.equal(p.level, 3);
  assert.equal(p.wrongCount, 1);
  assert.ok(p.next < nextCu, 'bị hẹn ôn lại sớm hơn lịch cũ');
});

test('applyAnswer: next = now + đúng khoảng INTERVALS_MIN theo LV mới', function () {
  var words = {};
  var before = Date.now();
  var p = applyAnswer(words, 'w1', 'listen', 'correct-fast');
  var expectedMin = before + INTERVALS_MIN[1] * 60000;
  assert.ok(Math.abs(p.next - expectedMin) < 2000);
});

test('INTERVALS_MIN: đúng 11 mốc (LV0-10), tăng gấp đôi đều ở 3 mốc cuối (không chậm lại)', function () {
  assert.equal(INTERVALS_MIN.length, 11);
  assert.equal(MAX_LEVEL, 10);
  var l8 = INTERVALS_MIN[8], l9 = INTERVALS_MIN[9], l10 = INTERVALS_MIN[10];
  assert.equal(l9 / l8, 2, 'LV8->LV9 phải tăng đúng gấp đôi (30->60 ngày)');
  assert.equal(l10 / l9, 2, 'LV9->LV10 phải tăng đúng gấp đôi (60->120 ngày)');
});

test('wrongRate: tính đúng tỉ lệ sai, 0 khi chưa có lượt nào', function () {
  assert.equal(wrongRate(null), 0);
  assert.equal(wrongRate({ correctCount: 0, wrongCount: 0 }), 0);
  assert.equal(wrongRate({ correctCount: 1, wrongCount: 3 }), 0.75);
});

test('totalStars: cộng LV mọi kỹ năng của mọi từ, 0 khi chưa học gì', function () {
  assert.equal(totalStars({}), 0);
  assert.equal(totalStars(null), 0);
  var words = {};
  var t0 = Date.now();
  applyAnswer(words, 'tiger', 'listen', 'correct-fast', { now: t0 }); // listen LV0->1
  applyAnswer(words, 'tiger', 'read', 'correct-fast', { now: t0 });   // read LV0->1
  applyAnswer(words, 'lion', 'listen', 'correct-fast', { now: t0 });
  // Cách 2 phút để "lion" tới hạn ôn (LV1 = 1 phút) thì lần đúng thứ 2 mới
  // được tính tăng LV tiếp.
  applyAnswer(words, 'lion', 'listen', 'correct-fast', { now: t0 + 2 * 60000 }); // LV1->2
  assert.equal(totalStars(words), 4, 'tiger(1+1) + lion(2) = 4 sao');
});

// --- buildRound (theo 1 kỹ năng cụ thể) ---

test('buildRound: chưa học kỹ năng này thì trả về từ mới (đủ size, không trùng)', function () {
  var words = fakeWords();
  var round = buildRound(words, {}, 'listen', { size: 4, rng: seededRng(1) });
  assert.equal(round.length, 4);
  var ids = round.map(function (w) { return w.id; });
  assert.equal(new Set(ids).size, 4);
});

test('buildRound: từ đến hạn ôn (đúng kỹ năng đang xét) được ưu tiên trước từ mới', function () {
  var words = fakeWords();
  var now = Date.now();
  var progress = { w1: { skills: { listen: { level: 2, next: now - 1000, seen: true, correctCount: 2, wrongCount: 0 } } } };
  var round = buildRound(words, progress, 'listen', { size: 1, now: now, rng: seededRng(2) });
  assert.equal(round[0].id, 'w1');
});

test('buildRound: due theo kỹ năng "read" không bị ảnh hưởng bởi tiến độ "listen" của cùng từ', function () {
  var words = fakeWords();
  var now = Date.now();
  var progress = {
    // w1 đã thuộc "listen" rất tốt (chưa đến hạn ôn), nhưng "read" thì
    // chưa từng học -> vẫn phải được coi là "brand new" khi build round
    // cho kỹ năng "read".
    w1: { skills: { listen: { level: 9, next: now + 999999999, seen: true, correctCount: 20, wrongCount: 0 } } }
  };
  var roundRead = buildRound(words, progress, 'read', { size: 6, now: now, rng: seededRng(3) });
  var idsRead = roundRead.map(function (w) { return w.id; });
  assert.ok(idsRead.indexOf('w1') !== -1, 'w1 phải xuất hiện trong round "read" vì kỹ năng read của nó chưa học');
});

test('buildRound: LUÔN đủ size kể cả khi hết từ mới và chỉ vài từ đến hạn', function () {
  // Lỗi thật đã gặp: bé học hết cả bộ (không còn từ mới), chỉ 1 từ đến hạn ->
  // "Khu rừng kỳ bí" chỉ hiện 1 con thay vì đủ 4. Từ đã học nhưng chưa tới
  // hạn phải được dùng để lấp cho đủ ô.
  var words = fakeWords();
  var now = Date.now();
  var progress = {};
  words.forEach(function (w) {
    progress[w.id] = { skills: { listen: { level: 3, next: now + 60 * 60000, seen: true, correctCount: 3, wrongCount: 0 } } };
  });
  progress[words[0].id].skills.listen.next = now - 1000; // đúng 1 từ đến hạn

  var round = buildRound(words, progress, 'listen', { size: 4, now: now, rng: seededRng(9) });
  assert.equal(round.length, 4, 'phải đủ 4 ô');
  assert.equal(new Set(round.map(function (w) { return w.id; })).size, 4, '4 ô phải là 4 từ khác nhau');
  assert.ok(round.some(function (w) { return w.id === words[0].id; }), 'từ đến hạn vẫn phải có mặt');
});

test('buildRound: trong số từ đến hạn, tỉ lệ sai cao hơn được ưu tiên lên trước', function () {
  var words = fakeWords();
  var now = Date.now();
  var progress = {
    w1: { skills: { listen: { level: 2, next: now - 1000, seen: true, correctCount: 4, wrongCount: 0 } } },
    w2: { skills: { listen: { level: 2, next: now - 1000, seen: true, correctCount: 1, wrongCount: 3 } } }
  };
  var round = buildRound(words, progress, 'listen', { size: 2, now: now, rng: seededRng(4) });
  assert.equal(round[0].id, 'w2');
});

// --- session queue / requeue (không phụ thuộc kỹ năng) ---

test('requeueAfterAnswer: correct-fast không chèn lại', function () {
  var words = fakeWords();
  var queue = createSessionQueue(words);
  var counts = {};
  var result = requeueAfterAnswer(queue, 0, words[0], 'correct-fast', counts, seededRng(5));
  assert.equal(result.length, queue.length);
});

test('requeueAfterAnswer: wrong chèn lại cách ít nhất 2 câu', function () {
  var words = fakeWords();
  var queue = createSessionQueue(words);
  var counts = {};
  var result = requeueAfterAnswer(queue, 0, words[0], 'wrong', counts, seededRng(6));
  assert.equal(result.length, queue.length + 1);
  var newPos = result.indexOf(words[0], 1);
  assert.ok(newPos >= 3, 'thấy: ' + newPos);
});

test('requeueAfterAnswer: tôn trọng MAX_REQUEUES_PER_WORD', function () {
  var words = fakeWords();
  var queue = createSessionQueue(words);
  var startLen = queue.length;
  var counts = {};
  var rng = seededRng(7);
  for (var i = 0; i < MAX_REQUEUES_PER_WORD + 5; i++) {
    queue = requeueAfterAnswer(queue, 0, words[0], 'wrong', counts, rng);
  }
  assert.equal(counts.w1, MAX_REQUEUES_PER_WORD);
  assert.equal(queue.length, startLen + MAX_REQUEUES_PER_WORD);
});

// --- pickOptions ---

test('pickOptions: luôn có đúng 4 lựa chọn, gồm cả đáp án đúng, không trùng', function () {
  var words = fakeWords();
  var opts = pickOptions(words[0], words, seededRng(8));
  assert.equal(opts.length, 4);
  assert.ok(opts.some(function (o) { return o.id === words[0].id; }));
  var ids = opts.map(function (o) { return o.id; });
  assert.equal(new Set(ids).size, 4);
});

test('pickOptions: ưu tiên nhiễu cùng chủ đề khi đủ số lượng', function () {
  var words = fakeWords();
  var opts = pickOptions(words[0], words, seededRng(9));
  var sameCat = opts.filter(function (o) { return o.cat === 'number'; });
  assert.equal(sameCat.length, 3);
});

// --- shuffle (sanity) ---

test('shuffle: giữ nguyên tập phần tử, chỉ đổi thứ tự', function () {
  var arr = [1, 2, 3, 4, 5];
  var out = shuffle(arr, seededRng(10));
  assert.equal(out.length, arr.length);
  assert.deepEqual(out.slice().sort(), arr.slice().sort());
});

test('SKILLS: đúng 5 kỹ năng theo thiết kế', function () {
  assert.deepEqual(SKILLS, ['listen', 'speak', 'read', 'write', 'see']);
});

// --- Mê cung của game "Bunny Run Home" (games/bunny-maze/bunnymaze.js) ---
// buildBunnyPath() là hàm THUẦN (không đụng DOM) nên chạy thẳng được ở đây.
// Chạy lặp nhiều lần vì thuật toán có yếu tố ngẫu nhiên — 1 lần chạy đúng
// không chứng minh được gì, phải đúng ở MỌI lần sinh.

function bunnyStepOf(a, b) {
  return { dc: b.c - a.c, dr: b.r - a.r };
}

test('buildBunnyPath: đúng 10 bước, 11 ô, mọi ô nằm trong lưới', function () {
  for (var n = 0; n < 200; n++) {
    var path = buildBunnyPath();
    assert.equal(path.moves.length, BUNNY_WIN_TARGET);
    assert.equal(path.cells.length, BUNNY_WIN_TARGET + 1);
    path.cells.forEach(function (cell) {
      assert.ok(cell.c >= 0 && cell.c < BUNNY_COLS, 'cột ngoài lưới: ' + cell.c);
      assert.ok(cell.r >= 0 && cell.r < BUNNY_ROWS, 'hàng ngoài lưới: ' + cell.r);
    });
  }
});

test('buildBunnyPath: đường đi KHÔNG tự cắt (không ô nào đi qua 2 lần)', function () {
  for (var n = 0; n < 200; n++) {
    var path = buildBunnyPath();
    var seen = {};
    path.cells.forEach(function (cell) {
      var k = cell.c + ',' + cell.r;
      assert.ok(!seen[k], 'ô bị đi qua 2 lần: ' + k);
      seen[k] = true;
    });
  }
});

test('buildBunnyPath: mỗi bước đi đúng 1 ô kề, khớp đúng tên hướng', function () {
  var expected = { up: { dc: 0, dr: -1 }, down: { dc: 0, dr: 1 }, left: { dc: -1, dr: 0 }, right: { dc: 1, dr: 0 } };
  for (var n = 0; n < 200; n++) {
    var path = buildBunnyPath();
    path.moves.forEach(function (moveId, i) {
      assert.deepEqual(bunnyStepOf(path.cells[i], path.cells[i + 1]), expected[moveId],
        'bước "' + moveId + '" không khớp toạ độ');
    });
  }
});

test('buildBunnyPath: LUÔN dùng đủ cả 4 hướng (không bỏ sót từ nào)', function () {
  for (var n = 0; n < 200; n++) {
    var path = buildBunnyPath();
    var used = {};
    path.moves.forEach(function (m) { used[m] = true; });
    assert.deepEqual(Object.keys(used).sort(), ['down', 'left', 'right', 'up'],
      'thiếu hướng, chỉ có: ' + Object.keys(used).join(','));
  }
});

test('buildBunnyPath: không quá 2 bước cùng hướng liên tiếp', function () {
  for (var n = 0; n < 200; n++) {
    var path = buildBunnyPath();
    var run = 1;
    for (var i = 1; i < path.moves.length; i++) {
      run = path.moves[i] === path.moves[i - 1] ? run + 1 : 1;
      assert.ok(run <= 2, 'có ' + run + ' bước "' + path.moves[i] + '" liên tiếp');
    }
  }
});

test('buildBunnyPath: trọng số ưu tiên làm hướng "yếu" xuất hiện nhiều hơn', function () {
  var countWeighted = 0, countPlain = 0;
  for (var n = 0; n < 120; n++) {
    countWeighted += buildBunnyPath({ weights: { up: 1, down: 1, left: 1, right: 6 } })
      .moves.filter(function (m) { return m === 'right'; }).length;
    countPlain += buildBunnyPath()
      .moves.filter(function (m) { return m === 'right'; }).length;
  }
  assert.ok(countWeighted > countPlain,
    'trọng số không có tác dụng (có trọng số: ' + countWeighted + ', không: ' + countPlain + ')');
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
