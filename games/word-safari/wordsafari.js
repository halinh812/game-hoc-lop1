// Game "Word Safari" (Đọc Chữ) — luyện kỹ năng "Đọc" (skill=read, kỹ năng
// CHƯA game nào dùng tới trước đây). Bé NHÌN 1 ảnh + NGHE 1 từ tiếng Anh
// (chỉ đúng 1 từ, không phải cả câu như "Help Bill!"), rồi bấm đúng Ô CHỮ
// (không phải ô hình) trong 4 ô đáp án bên dưới — đây là khác biệt cốt lõi
// so với 4 game trước: chọn bằng CHỮ VIẾT, không phải bằng hình/âm thanh.
//
// KHÔNG cần người lớn tự chọn từ vựng cho game này (khác "Ghép Chữ" đang
// tạm hoãn — xem ROADMAP.md): từ vựng được TỰ ĐỘNG đưa vào ngay khi nó đạt
// LV3 trở lên ở BẤT KỲ kỹ năng nào khác (Nghe/Nói/Viết/Nhìn) — tức là bé đã
// nhận mặt chữ đó khá quen qua trò chơi khác rồi mới bắt đầu tập ĐỌC nó
// (xem isWordUnlocked()). Không giới hạn theo 1 bộ từ (category) như các
// game khác — gộp CHUNG cả animal/object/number/color/family/fruit, vì
// "Đọc" không phân biệt chủ đề.
//
// Nếu bé chưa có đủ từ đã mở khoá (MIN_POOL), màn hình hiện thông báo
// "sắp mở khoá" thay vì chơi luôn — tránh trường hợp chỉ có 1 từ khiến câu
// hỏi lặp lại y hệt mãi mãi, không có gì thú vị.
//
// Nhân vật chồn đất (chồn đất thám hiểm) 3 trạng thái cảm xúc + ảnh nền
// savanna — xem Bước 18 trong PROMPT.md. Ảnh mới được xử lý (xoá nền/
// resize) lưu vào assets/characters/meerkat-idle.png/meerkat-happy.png/
// meerkat-sad.png + assets/backgrounds/word-safari-bg.jpg.
//
// Không tự lấy state/store/WORDS từ app.js (tránh import vòng) — xem giải
// thích chi tiết hơn ở đầu games/khu-rung-ky-bi/forest.js.

import { buildRound, applyAnswer, classifyAnswer, pickOptions, getSkillProgress, SKILLS } from '../../engine/learning-engine.js';
import { saveProgress } from '../../engine/progress-store.js';
import { starIcon, CLOSE_SVG, SPEAK_SVG, worldBg, speakThenProceed } from '../../engine/ui-shared.js';

var WORD_SAFARI_WIN_TARGET = 10;

// Cần ít nhất chừng này từ đã mở khoá mới cho chơi — dưới mức này thì
// pickOptions() vẫn chạy được (nó lấy nhiễu từ TOÀN BỘ vốn từ, không chỉ
// rổ đã mở khoá) nhưng buildRound() sẽ phải lặp lại y hệt 1-2 từ mọi câu,
// không có gì để ôn tập luân phiên — trải nghiệm nghèo nàn nên chặn lại,
// khuyến khích bé chơi thêm trò khác trước.
var MIN_POOL = 4;

export function createWordSafariGame(ctx) {
  var root = document.getElementById('root');
  var state = ctx.state;
  // Dữ liệu của CÂU HIỆN TẠI — biến cục bộ (closure), giống hệt cách
  // games/how-many/howmany.js làm (màn này cũng render lại mới hoàn toàn
  // mỗi câu, không cần vá DOM từng phần như forest/farm/bill).
  var round = null;

  function isWordUnlocked(store, w) {
    return SKILLS.some(function (s) {
      var p = getSkillProgress(store.words, w.id, s);
      return !!(p && p.level >= 3);
    });
  }

  function buildPool() {
    var store = ctx.getStore();
    return ctx.getWords().filter(function (w) { return isWordUnlocked(store, w); });
  }

  function startWordSafariGame() {
    state.wordSafariPool = buildPool();
    state.correct = 0;
    state.answered = false;
    state.wordSafariMood = 'idle';
    state.screen = 'wordsafari';
    ctx.render();
  }

  function buildRoundData() {
    var store = ctx.getStore();
    var target = buildRound(state.wordSafariPool, store.words, 'read', { size: 1 })[0];
    var options = pickOptions(target, ctx.getWords());
    var correctIdx = options.reduce(function (found, o, i) { return o.id === target.id ? i : found; }, -1);
    return { target: target, options: options, correctIdx: correctIdx };
  }

  function safariStarsRow() {
    var row = '';
    for (var i = 0; i < WORD_SAFARI_WIN_TARGET; i++) {
      var lit = i < state.correct;
      var starMarkup = starIcon(lit ? '#FFD25A' : 'rgba(255,255,255,.55)', 16, 'rgba(35,58,42,.35)');
      row += starMarkup.replace('<svg ', '<svg class="' + (lit ? 'lit' : '') + '" ');
    }
    return row;
  }

  // Ảnh của từ đang hỏi — 1 tấm to giữa màn, có fallback emoji nếu chưa
  // có ảnh riêng (vd numbers-v1.json chỉ có emoji, không có "image").
  function targetMediaHtml(w) {
    var inner = w.image
      ? '<img src="' + w.image + '" alt="" class="safariimg" onerror="this.hidden=true;this.nextElementSibling.hidden=false;"><span class="safarifallback" hidden>' + (w.emoji || '❓') + '</span>'
      : '<span class="safarifallback">' + (w.emoji || '❓') + '</span>';
    return inner;
  }

  var MEERKAT_MOOD_IMG = { idle: 'meerkat-idle.png', happy: 'meerkat-happy.png', sad: 'meerkat-sad.png' };
  function meerkatMoodImg(mood) {
    var file = MEERKAT_MOOD_IMG[mood] || MEERKAT_MOOD_IMG.idle;
    return '<img src="assets/characters/' + file + '" alt="" id="safariMascotImg" onerror="this.hidden=true;this.nextElementSibling.hidden=false;">' +
      '<span class="safarimascotfallback" id="safariMascotFallback" hidden>🐿️</span>';
  }

  // Chồn đất đứng góc dưới-trái màn hình, thuần trang trí + đổi cảm xúc —
  // giống hệt cách Cú thông thái đứng trong games/how-many/howmany.js.
  function meerkatCornerHtml() {
    return '<div class="safarimascotwrap" id="safariMascotWrap">' + meerkatMoodImg(state.wordSafariMood || 'idle') + '</div>';
  }

  function setMeerkatMood(mood) {
    state.wordSafariMood = mood;
    var wrap = document.getElementById('safariMascotWrap');
    if (!wrap) return;
    wrap.innerHTML = meerkatMoodImg(mood);
  }

  function optionsHtml() {
    return round.options.map(function (o, i) {
      return '<button type="button" class="optionbtn" data-idx="' + i + '">' + o.en + '</button>';
    }).join('');
  }

  // Chỉ bắt đầu tính "thời gian trả lời" của bé từ lúc từ đọc XONG (qua
  // onEnd) — state.cardShownAt đã được đặt tạm ở renderWordSafari làm mốc
  // dự phòng, nhưng mốc đúng luôn là đây (xem giải thích đầy đủ ở
  // speakBillTarget() trong games/bill/bill.js, cùng nguyên lý — Vòng 35
  // trong ROADMAP.md).
  function speakWordSafariTarget() {
    ctx.speak(round.target.en, function () { state.cardShownAt = Date.now(); });
  }

  function renderWordSafariLocked() {
    root.innerHTML = worldBg('wordsafariphoto') +
      '<div class="content" style="align-items:center;justify-content:center;text-align:center;">' +
      '<button class="iconbtn" id="homeBtnLocked" aria-label="Về trang chủ" style="position:absolute;top:16px;left:16px;">' + CLOSE_SVG + '</button>' +
      '<div class="safarilockedmascot">' + meerkatMoodImg('idle') + '</div>' +
      '<h2 style="font-family:\'Baloo 2\',sans-serif;font-weight:800;margin:14px 0 8px;">Sắp mở khoá!</h2>' +
      '<p style="color:var(--ink-soft);font-weight:600;margin:0 0 20px;max-width:280px;">Bé chơi thêm các trò khác để có nhiều từ hơn cho Word Safari nhé!</p>' +
      '<button class="chunkybtn coral" id="backHomeBtn" style="max-width:220px;">Về trang chủ</button>' +
      '</div>';
    document.getElementById('homeBtnLocked').addEventListener('click', function () { state.screen = 'home'; ctx.render(); });
    document.getElementById('backHomeBtn').addEventListener('click', function () { state.screen = 'home'; ctx.render(); });
  }

  function renderWordSafari() {
    if (!state.wordSafariPool || state.wordSafariPool.length < MIN_POOL) {
      renderWordSafariLocked();
      return;
    }

    round = buildRoundData();
    state.answered = false;
    state.wordSafariMood = 'idle';
    state.cardShownAt = Date.now();

    root.innerHTML = worldBg('wordsafariphoto') +
      '<div class="content">' +
      meerkatCornerHtml() +
      '<div class="topbar">' +
      '<button class="iconbtn" id="homeBtn" aria-label="Về trang chủ">' + CLOSE_SVG + '</button>' +
      '<div class="starsrow" id="safariStars" style="margin:0;">' + safariStarsRow() + '</div>' +
      '<span style="width:38px;"></span>' +
      '</div>' +
      '<div class="safaristage">' +
      '<div class="safariimgcard" id="safariImgCard">' + targetMediaHtml(round.target) + '</div>' +
      '<button class="soundbtn" id="speakBtn" aria-label="Nghe lại">' + SPEAK_SVG + '</button>' +
      '</div>' +
      '<div class="optionsgrid" id="optionsGrid">' + optionsHtml() + '</div>' +
      '</div>';

    document.getElementById('homeBtn').addEventListener('click', function () {
      state.screen = 'home'; ctx.render();
    });
    document.getElementById('speakBtn').addEventListener('click', speakWordSafariTarget);
    document.getElementById('optionsGrid').addEventListener('click', function (e) {
      var btn = e.target.closest('.optionbtn');
      if (!btn) return;
      handleWordSafariAnswer(parseInt(btn.getAttribute('data-idx'), 10));
    });

    speakWordSafariTarget();
  }

  // Chuông "ting" khi bấm đúng — y hệt 3 game kia (mỗi game tự giữ 1 bản
  // sao riêng theo đúng quy ước đã có, xem howmany.js/bill.js).
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

  function handleWordSafariAnswer(idx) {
    if (state.answered) return;
    state.answered = true;

    var store = ctx.getStore();
    var optionEls = document.querySelectorAll('#optionsGrid .optionbtn');
    var isCorrect = idx === round.correctIdx;
    var responseTimeMs = Date.now() - state.cardShownAt;

    if (isCorrect) {
      var outcome = classifyAnswer(true, responseTimeMs);
      applyAnswer(store.words, round.target.id, 'read', outcome);
      saveProgress(store);
      state.correct++;
      optionEls[idx].classList.add('correct');
      setMeerkatMood('happy');
      playDing();

      var isDone = state.correct >= WORD_SAFARI_WIN_TARGET;
      setTimeout(function () {
        if (isDone) { state.screen = 'wordsafariSummary'; ctx.render(); }
        else renderWordSafari();
      }, isDone ? 700 : 1400);
    } else {
      applyAnswer(store.words, round.target.id, 'read', 'wrong');
      saveProgress(store);
      optionEls[idx].classList.add('wrong');
      optionEls[round.correctIdx].classList.add('correct');
      setMeerkatMood('sad');
      speakThenProceed(ctx.speak, round.target.en, 3000, function () { renderWordSafari(); });
    }
  }

  function renderWordSafariSummary() {
    root.innerHTML = worldBg() +
      '<div class="content">' +
      '<div class="summary-mid" id="summaryMid">' +
      '<div class="starburst">' + starIcon('#FFD25A', 28) + starIcon('#F4A93B', 36) + starIcon('#FFD25A', 28) + '</div>' +
      ctx.owlMascot(64) +
      '<h2>Giỏi quá!</h2>' +
      '<p>Bé đọc chữ giỏi lắm!</p>' +
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

    document.getElementById('againBtn').addEventListener('click', startWordSafariGame);
    document.getElementById('homeBtn2').addEventListener('click', function () {
      state.screen = 'home'; ctx.render();
    });
  }

  // Markup ô icon của game này trong lưới chọn trò chơi ở Trang chủ —
  // dùng ảnh chồn đất (trạng thái chờ đợi), có fallback emoji nếu ảnh
  // chưa tồn tại.
  function gameTileHtml(title) {
    return '<button type="button" class="gametile wordsafari-tile" data-id="wordsafari">' +
      '<span class="wordsafaritile-face" id="wordsafariTileFace">' +
      '<img src="assets/characters/meerkat-idle.png" alt="" id="wordsafariTileImg" onerror="this.hidden=true;this.nextElementSibling.hidden=false;">' +
      '<span class="wordsafaritile-fallback" id="wordsafariTileFallback" hidden>🐿️</span>' +
      '</span>' +
      '<span class="name">' + title + '</span></button>';
  }

  return {
    startWordSafariGame: startWordSafariGame,
    renderWordSafari: renderWordSafari,
    renderWordSafariSummary: renderWordSafariSummary,
    gameTileHtml: gameTileHtml
  };
}
