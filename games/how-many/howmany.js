// Game "How Many?" — luyện kỹ năng "Nhìn" (skill=see, KHÔNG phải "Nghe"
// như 3 game trước). Khác hẳn về luồng: không có câu nào được đọc SẴN lúc
// vào câu hỏi — bé phải tự NHÌN và ĐẾM số lượng đồ vật hiện trên màn hình,
// rồi bấm vào 1 trong 4 "núm" màu — mỗi núm khi bấm mới đọc lên 1 câu số
// lượng khác nhau (vd "I have three pens."), bấm đúng núm khớp với số
// lượng đang nhìn thấy thì thắng. Vì không có prompt nào đọc trước, màn
// này KHÔNG có nút "Nghe lại" như 3 game kia (không có gì để nghe lại).
//
// Từ vựng được CHẤM ĐIỂM (skill=see) là SỐ ĐẾM (content/packs/
// numbers-v1.json, id "one".."ten") — đúng như yêu cầu "từ mới học là số
// đếm". Đồ vật (content/packs/objects-v1.json) chỉ đóng vai trò ảnh minh
// hoạ để đếm, đổi ngẫu nhiên mỗi câu, KHÔNG được chấm điểm riêng.
//
// Vì mỗi câu không cần giữ lại DOM cũ (không có video/ảnh động cần tránh
// giật hình như forest.js/farm.js), toàn màn được RENDER LẠI MỚI hoàn
// toàn mỗi câu (không có hàm advanceXRound() vá DOM riêng như 3 game kia)
// — đơn giản hơn hẳn vì không cần giữ trạng thái slot cũ.
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

// 4 màu núm bấm khác nhau, rõ ràng, không trùng bất kỳ màu trạng thái nào
// khác đang dùng trong app (đúng/sai/vàng sao...) để không gây hiểu lầm.
var KNOB_COLORS = ['#E4633F', '#2F8F5B', '#F4A93B', '#4F8FE0'];

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
      return { value: v, phrase: phraseFor(v, objWord), color: KNOB_COLORS[i % KNOB_COLORS.length] };
    });
    var correctIdx = options.reduce(function (found, o, i) { return o.value === targetValue ? i : found; }, -1);

    return { targetWord: targetWord, targetValue: targetValue, objWord: objWord, options: options, correctIdx: correctIdx };
  }

  function startHowManyGame() {
    state.correct = 0;
    state.answered = false;
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

  function knobsHtml() {
    return round.options.map(function (o, i) {
      return '<button type="button" class="knobbtn" data-idx="' + i + '" style="--knob:' + o.color + '"></button>';
    }).join('');
  }

  function renderHowMany() {
    round = buildRoundData();
    state.cardShownAt = Date.now();
    state.answered = false;

    root.innerHTML = worldBg() +
      '<div class="content">' +
      '<div class="topbar">' +
      '<button class="iconbtn" id="homeBtn" aria-label="Về trang chủ">' + CLOSE_SVG + '</button>' +
      '<div class="starsrow" id="howManyStars" style="margin:0;">' + howManyStarsRow() + '</div>' +
      '<span style="width:38px;"></span>' +
      '</div>' +
      countAreaHtml() +
      '<div class="knobsgrid" id="knobsGrid">' + knobsHtml() + '</div>' +
      '</div>';

    document.getElementById('homeBtn').addEventListener('click', function () {
      state.screen = 'home'; ctx.render();
    });
    document.getElementById('knobsGrid').addEventListener('click', function (e) {
      var btn = e.target.closest('.knobbtn');
      if (!btn) return;
      handleHowManyAnswer(parseInt(btn.getAttribute('data-idx'), 10));
    });
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

  function handleHowManyAnswer(idx) {
    if (state.answered) return;
    state.answered = true;

    var store = ctx.getStore();
    var knobs = document.querySelectorAll('#knobsGrid .knobbtn');
    var isCorrect = idx === round.correctIdx;
    var responseTimeMs = Date.now() - state.cardShownAt;

    // Bấm núm nào, đọc ĐÚNG câu của núm đó — đây là cơ chế chính (bé phải
    // tự đếm bằng mắt rồi mới bấm thử, không có gợi ý âm thanh trước).
    ctx.speak(round.options[idx].phrase);

    if (isCorrect) {
      applyAnswer(store.words, round.targetWord.id, 'see', classifyAnswer(true, responseTimeMs));
      saveProgress(store);
      state.correct++;
      knobs[idx].classList.add('correct');
      playDing();

      var isDone = state.correct >= HOWMANY_WIN_TARGET;
      setTimeout(function () {
        if (isDone) { state.screen = 'howmanySummary'; ctx.render(); }
        else renderHowMany();
      }, isDone ? 700 : 1400);
    } else {
      applyAnswer(store.words, round.targetWord.id, 'see', 'wrong');
      saveProgress(store);
      knobs[idx].classList.add('wrong');
      knobs[round.correctIdx].classList.add('correct');
      // Đợi câu vừa bấm đọc xong rồi mới đọc tiếp câu đúng, tránh chồng
      // 2 câu lên nhau (đè mất câu trước — đúng lỗi đã sửa ở
      // engine/audio-provider.js, ở đây chủ động giãn cách thêm cho chắc).
      setTimeout(function () { ctx.speak(round.options[round.correctIdx].phrase); }, 1500);
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

  // Markup ô icon của game này trong lưới chọn trò chơi ở Trang chủ — chỉ
  // dùng emoji (không có ảnh nền riêng như 3 game kia, vì game này không
  // có bối cảnh/nhân vật cụ thể — thuần "đếm đồ vật trên khay").
  function gameTileHtml(title) {
    return '<button type="button" class="gametile howmany-tile" data-id="howmany">' +
      '<span class="emoji">🔢</span><span class="name">' + title + '</span></button>';
  }

  return {
    startHowManyGame: startHowManyGame,
    renderHowMany: renderHowMany,
    renderHowManySummary: renderHowManySummary,
    gameTileHtml: gameTileHtml
  };
}
