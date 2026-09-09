// Game "How Many?" — luyện kỹ năng "Nhìn" (skill=see, KHÔNG phải "Nghe"
// như 3 game trước). Bé tự NHÌN và ĐẾM số lượng đồ vật hiện trên màn,
// sau đó bấm THỬ từng "nút hoa" để NGHE câu số lượng của nút đó (bấm hoa
// KHÔNG chốt đáp án ngay — được đổi ý, bấm hoa khác để nghe lại câu
// khác), rồi bấm vào nút "bảng tính" (bên phải) để XÁC NHẬN đúng hoa vừa
// chọn là câu trả lời cuối cùng. Nhân vật Cú thông thái đứng bên trái,
// đổi cảm xúc chờ đợi/vui/buồn theo đúng lúc XÁC NHẬN (không đổi lúc chỉ
// đang nghe thử). Không có prompt nào đọc SẴN lúc vào câu (khác 3 game
// kia) nên màn này cũng không có nút "Nghe lại" riêng.
//
// Từ vựng được CHẤM ĐIỂM (skill=see) là SỐ ĐẾM (content/packs/
// numbers-v1.json, id "one".."ten") — đồ vật (content/packs/objects-v1.json)
// chỉ đóng vai trò ảnh minh hoạ để đếm, đổi ngẫu nhiên mỗi câu, KHÔNG
// được chấm điểm riêng.
//
// Ảnh riêng của game này (ảnh nền lớp học, cú 3 trạng thái, 4 nút hoa,
// nút bảng tính) CHƯA có lúc viết file này — xem prompt ở Bước 16 trong
// PROMPT.md. Mọi <img> đều có fallback emoji nếu ảnh chưa tồn tại, nên
// game chạy được đầy đủ ngay hôm nay.
//
// Không tự lấy state/store/WORDS từ app.js (tránh import vòng) — xem giải
// thích chi tiết hơn ở đầu games/khu-rung-ky-bi/forest.js.

import { wordsInCat } from '../../engine/content-loader.js';
import { buildRound, applyAnswer, classifyAnswer, shuffle } from '../../engine/learning-engine.js';
import { saveProgress } from '../../engine/progress-store.js';
import { starIcon, CLOSE_SVG, worldBg } from '../../engine/ui-shared.js';

var HOWMANY_WIN_TARGET = 10;

// "one".."ten" theo đúng thứ tự 1-10 — id trong numbers-v1.json CHÍNH LÀ
// từ tiếng Anh này nên dùng thẳng làm bảng tra số trị (value) qua chỉ số
// mảng (index 0 = giá trị 1).
var NUMBER_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

// Chỉ chọn những đồ vật ĐẾM ĐƯỢC một cách tự nhiên bằng tiếng Anh (có dạng
// số nhiều rõ ràng, ảnh 1 món lặp lại nhiều lần không gây hiểu lầm) — cố
// tình BỎ QUA "scissors"/"shoes" (vốn đã là danh từ số nhiều, "one
// scissors" sai ngữ pháp; ảnh "shoes" lại vẽ sẵn 1 ĐÔI nên lặp lại N lần
// sẽ ra 2N chiếc, dễ đếm nhầm) và "chalk" (danh từ không đếm được, không
// có số nhiều "chalks" chuẩn). Không đụng gì tới objects-v1.json — chỉ là
// danh sách lọc cục bộ của riêng game này.
var PLURALS = {
  book: 'books', pencil: 'pencils', ruler: 'rulers', bag: 'bags', pen: 'pens',
  eraser: 'erasers', crayon: 'crayons', notebook: 'notebooks', ball: 'balls',
  hat: 'hats', whiteboard: 'whiteboards', pencil_case: 'pencil cases',
  glue_stick: 'glue sticks', water_bottle: 'water bottles',
  lunch_box: 'lunch boxes', umbrella: 'umbrellas', red_scarf: 'red scarves'
};

// 4 "nút hoa" cố định theo vị trí (không đổi qua từng câu, để bé quen vị
// trí từng loại hoa) — chỉ GIÁ TRỊ/câu gán vào từng vị trí mới xáo trộn
// mỗi câu (xem buildRoundData()). Ảnh hoa CHƯA có (xem Bước 16 trong
// PROMPT.md) nên có fallback đúng emoji hoa tương ứng.
var FLOWERS = [
  { id: 'sunflower', emoji: '🌻' },
  { id: 'daisy', emoji: '🌼' },
  { id: 'rose', emoji: '🌹' },
  { id: 'tulip', emoji: '🌷' }
];

export function createHowManyGame(ctx) {
  var root = document.getElementById('root');
  var state = ctx.state;
  // Dữ liệu của CÂU HIỆN TẠI — giữ ở biến cục bộ (closure) thay vì gắn vào
  // "state" dùng chung, vì màn này render lại mới hoàn toàn mỗi câu (khác
  // forest/farm/bill cần "state.slots" sống xuyên suốt để vá DOM từng
  // phần) nên không cần chia sẻ ra ngoài factory này.
  var round = null;

  function numberValue(id) {
    var idx = NUMBER_WORDS.indexOf(id);
    return idx === -1 ? null : idx + 1;
  }

  function phraseFor(value, objWord) {
    var noun = value === 1 ? objWord.singular : objWord.plural;
    return 'I have ' + NUMBER_WORDS[value - 1] + ' ' + noun + '.';
  }

  function pickObjectWord() {
    var pool = wordsInCat(ctx.getWords(), 'object', 'school').filter(function (w) {
      return !!PLURALS[w.id];
    });
    if (!pool.length) return null;
    var w = pool[Math.floor(Math.random() * pool.length)];
    return { id: w.id, image: w.image, emoji: w.emoji, singular: w.en, plural: PLURALS[w.id] };
  }

  function buildRoundData() {
    var store = ctx.getStore();
    var numberPool = wordsInCat(ctx.getWords(), 'number');
    var targetWord = buildRound(numberPool, store.words, 'see', { size: 1 })[0];
    var targetValue = numberValue(targetWord.id);
    var objWord = pickObjectWord();

    var distractors = [];
    while (distractors.length < 3) {
      var v = 1 + Math.floor(Math.random() * 10);
      if (v !== targetValue && distractors.indexOf(v) === -1) distractors.push(v);
    }
    var values = shuffle([targetValue].concat(distractors));
    var options = values.map(function (v, i) {
      return { value: v, phrase: phraseFor(v, objWord), flower: FLOWERS[i % FLOWERS.length] };
    });
    var correctIdx = options.reduce(function (found, o, i) { return o.value === targetValue ? i : found; }, -1);

    return { targetWord: targetWord, targetValue: targetValue, objWord: objWord, options: options, correctIdx: correctIdx, selectedIdx: null };
  }

  function startHowManyGame() {
    state.correct = 0;
    state.answered = false;
    state.howManyMood = 'idle';
    state.screen = 'howmany';
    ctx.render();
  }

  function howManyStarsRow() {
    var row = '';
    for (var i = 0; i < HOWMANY_WIN_TARGET; i++) {
      var lit = i < state.correct;
      var starMarkup = starIcon(lit ? '#FFD25A' : 'rgba(255,255,255,.55)', 16, 'rgba(35,58,42,.35)');
      row += starMarkup.replace('<svg ', '<svg class="' + (lit ? 'lit' : '') + '" ');
    }
    return row;
  }

  // Cụm ảnh đồ vật lặp lại đúng số lượng cần đếm — đứng yên hoàn toàn
  // (không lắc lư như con vật ở 3 game kia) để không gây rối mắt lúc bé
  // đang cố đếm cho chính xác.
  function countAreaHtml() {
    var media = round.objWord.image
      ? function () { return '<img src="' + round.objWord.image + '" alt="">'; }
      : function () { return '<span class="counticon-emoji">' + (round.objWord.emoji || '❓') + '</span>'; };
    var items = '';
    for (var i = 0; i < round.targetValue; i++) items += '<span class="counticon">' + media() + '</span>';
    return '<div class="countarea">' + items + '</div>';
  }

  function flowersHtml() {
    return round.options.map(function (o, i) {
      var f = o.flower;
      var inner = '<img src="assets/howmany/' + f.id + '.png" alt="" class="flowerimg" onerror="this.hidden=true;this.nextElementSibling.hidden=false;">' +
        '<span class="flowerfallback">' + f.emoji + '</span>';
      return '<button type="button" class="flowerbtn" data-idx="' + i + '">' + inner + '</button>';
    }).join('');
  }

  function owlMoodImg(mood) {
    var file = mood === 'happy' ? 'owl-happy.png' : mood === 'sad' ? 'owl-sad.png' : 'owl-idle.png';
    var fallback = mood === 'happy' ? '🦉' : mood === 'sad' ? '🦉' : '🦉';
    return '<img src="assets/characters/' + file + '" alt="" id="owlImg" onerror="this.hidden=true;this.nextElementSibling.hidden=false;">' +
      '<span class="owlfallback" id="owlFallback" hidden>' + fallback + '</span>';
  }

  function bottomBarHtml() {
    return '<div class="bottombar">' +
      '<div class="owlwrap" id="owlWrap">' + owlMoodImg(state.howManyMood || 'idle') + '</div>' +
      '<button type="button" class="confirmbtn" id="confirmBtn" disabled>' +
      '<img src="assets/howmany/calculator.png" alt="" class="confirmimg" onerror="this.hidden=true;this.nextElementSibling.hidden=false;">' +
      '<span class="confirmfallback">🧮</span>' +
      '</button>' +
      '</div>';
  }

  function renderHowMany() {
    round = buildRoundData();
    state.cardShownAt = Date.now();
    state.answered = false;
    state.howManyMood = 'idle';

    root.innerHTML = worldBg('howmanyphoto') +
      '<div class="content">' +
      '<div class="topbar">' +
      '<button class="iconbtn" id="homeBtn" aria-label="Về trang chủ">' + CLOSE_SVG + '</button>' +
      '<div class="starsrow" id="howManyStars" style="margin:0;">' + howManyStarsRow() + '</div>' +
      '<span style="width:38px;"></span>' +
      '</div>' +
      countAreaHtml() +
      '<div class="flowersrow" id="flowersRow">' + flowersHtml() + '</div>' +
      bottomBarHtml() +
      '</div>';

    document.getElementById('homeBtn').addEventListener('click', function () {
      state.screen = 'home'; ctx.render();
    });
    document.getElementById('flowersRow').addEventListener('click', function (e) {
      var btn = e.target.closest('.flowerbtn');
      if (!btn) return;
      handleFlowerPress(parseInt(btn.getAttribute('data-idx'), 10));
    });
    document.getElementById('confirmBtn').addEventListener('click', handleConfirmPress);
  }

  // Bấm 1 nút hoa: NGHE THỬ câu của hoa đó, đánh dấu đang chọn hoa này
  // (viền nổi bật) — CHƯA chốt đáp án, bé có thể bấm hoa khác để nghe lại
  // câu khác bao nhiêu lần tuỳ ý trước khi bấm nút "bảng tính" xác nhận.
  function handleFlowerPress(idx) {
    if (state.answered) return;
    round.selectedIdx = idx;
    ctx.speak(round.options[idx].phrase);

    var flowerEls = document.querySelectorAll('#flowersRow .flowerbtn');
    Array.prototype.forEach.call(flowerEls, function (el, i) {
      el.classList.toggle('selected', i === idx);
    });
    document.getElementById('confirmBtn').disabled = false;
  }

  // Chuông "ting" khi bấm đúng — y hệt 3 game kia.
  var sharedAudioCtx = null;
  function playDing() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
      if (!sharedAudioCtx) sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var ctxAudio = sharedAudioCtx;
      var now = ctxAudio.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach(function (freq, i) {
        var start = now + i * 0.075;
        var dur = 0.32;

        var body = ctxAudio.createOscillator();
        var bodyGain = ctxAudio.createGain();
        body.type = 'triangle';
        body.frequency.value = freq;
        bodyGain.gain.setValueAtTime(0, start);
        bodyGain.gain.linearRampToValueAtTime(0.22, start + 0.015);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        body.connect(bodyGain).connect(ctxAudio.destination);
        body.start(start);
        body.stop(start + dur);

        var sparkle = ctxAudio.createOscillator();
        var sparkleGain = ctxAudio.createGain();
        sparkle.type = 'sine';
        sparkle.frequency.value = freq * 2;
        sparkleGain.gain.setValueAtTime(0, start);
        sparkleGain.gain.linearRampToValueAtTime(0.08, start + 0.015);
        sparkleGain.gain.exponentialRampToValueAtTime(0.001, start + dur * 0.8);
        sparkle.connect(sparkleGain).connect(ctxAudio.destination);
        sparkle.start(start);
        sparkle.stop(start + dur * 0.8);
      });
    } catch (e) { /* Web Audio không khả dụng — bỏ qua, không phá UI */ }
  }

  function setOwlMood(mood) {
    state.howManyMood = mood;
    var wrap = document.getElementById('owlWrap');
    if (!wrap) return;
    wrap.innerHTML = owlMoodImg(mood);
  }

  // Bấm nút "bảng tính" — XÁC NHẬN hoa đang chọn (round.selectedIdx) là
  // đáp án cuối cùng. Chưa chọn hoa nào thì bấm cũng không có tác dụng gì
  // (nút đã bị disable ở CSS/thuộc tính "disabled" cho tới khi chọn hoa).
  function handleConfirmPress() {
    if (state.answered) return;
    if (round.selectedIdx === null) return;
    state.answered = true;

    var store = ctx.getStore();
    var idx = round.selectedIdx;
    var flowerEls = document.querySelectorAll('#flowersRow .flowerbtn');
    var isCorrect = idx === round.correctIdx;
    var responseTimeMs = Date.now() - state.cardShownAt;

    if (isCorrect) {
      applyAnswer(store.words, round.targetWord.id, 'see', classifyAnswer(true, responseTimeMs));
      saveProgress(store);
      state.correct++;
      flowerEls[idx].classList.add('correct');
      setOwlMood('happy');
      playDing();

      var isDone = state.correct >= HOWMANY_WIN_TARGET;
      setTimeout(function () {
        if (isDone) { state.screen = 'howmanySummary'; ctx.render(); }
        else renderHowMany();
      }, isDone ? 700 : 1400);
    } else {
      applyAnswer(store.words, round.targetWord.id, 'see', 'wrong');
      saveProgress(store);
      flowerEls[idx].classList.add('wrong');
      flowerEls[round.correctIdx].classList.add('correct');
      setOwlMood('sad');
      // Đợi câu vừa nghe (lúc bấm hoa) đọc xong rồi mới đọc tiếp câu đúng,
      // tránh chồng 2 câu lên nhau (đúng lỗi đã sửa ở
      // engine/audio-provider.js, ở đây chủ động giãn cách thêm cho chắc).
      setTimeout(function () { ctx.speak(round.options[round.correctIdx].phrase); }, 1200);
      setTimeout(function () { renderHowMany(); }, 3600);
    }
  }

  function renderHowManySummary() {
    root.innerHTML = worldBg() +
      '<div class="content">' +
      '<div class="summary-mid" id="summaryMid">' +
      '<div class="starburst">' + starIcon('#FFD25A', 28) + starIcon('#F4A93B', 36) + starIcon('#FFD25A', 28) + '</div>' +
      ctx.owlMascot(64) +
      '<h2>Giỏi quá!</h2>' +
      '<p>Bé đếm giỏi lắm!</p>' +
      '<div class="summary-btns">' +
      '<button class="chunkybtn coral" id="againBtn">Chơi lại</button>' +
      '<button class="ghostbtn" id="homeBtn2">Chọn trò khác</button>' +
      '</div></div></div>';

    var mid = document.getElementById('summaryMid');
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var colors = ['#F4A93B', '#E4633F', '#2F8F5B', '#FFD25A'];
      for (var i = 0; i < 14; i++) {
        var f = document.createElement('div');
        f.className = 'fall';
        f.style.left = (10 + Math.random() * 90) + '%';
        f.style.width = '7px'; f.style.height = '11px';
        f.style.background = colors[i % colors.length];
        f.style.animationDuration = (2 + Math.random() * 1.4) + 's';
        f.style.animationDelay = (Math.random() * 2.4) + 's';
        mid.appendChild(f);
      }
    }

    document.getElementById('againBtn').addEventListener('click', startHowManyGame);
    document.getElementById('homeBtn2').addEventListener('click', function () {
      state.screen = 'home'; ctx.render();
    });
  }

  // Markup ô icon của game này trong lưới chọn trò chơi ở Trang chủ —
  // dùng ảnh Cú (trạng thái chờ đợi, xem Bước 16 trong PROMPT.md), có
  // fallback emoji nếu ảnh chưa tồn tại.
  function gameTileHtml(title) {
    return '<button type="button" class="gametile howmany-tile" data-id="howmany">' +
      '<span class="howmanytile-face" id="howmanyTileFace">' +
      '<img src="assets/characters/owl-idle.png" alt="" id="howmanyTileImg" onerror="this.hidden=true;this.nextElementSibling.hidden=false;">' +
      '<span class="howmanytile-fallback" id="howmanyTileFallback" hidden>🦉</span>' +
      '</span>' +
      '<span class="name">' + title + '</span></button>';
  }

  return {
    startHowManyGame: startHowManyGame,
    renderHowMany: renderHowMany,
    renderHowManySummary: renderHowManySummary,
    gameTileHtml: gameTileHtml
  };
}
