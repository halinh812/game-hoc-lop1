// Game "ABC Vui" — luyện kỹ năng "Nghe" (skill=listen, giống forest/farm/
// bill, chỉ khác VỐN TỪ: 26 chữ cái A-Z thay vì con vật/đồ vật). Dạy bé
// bước nền tảng TRƯỚC "Word Safari" (đọc cả từ) — bé cần nhận mặt chữ cái
// + nghe quen tên gọi từng chữ trước khi ghép chúng thành từ có nghĩa.
//
// Cơ chế y hệt "Help Bill!" (games/bill/bill.js — đã ổn định, tái dùng gần
// như nguyên vẹn): 4 thẻ cố định trên màn, nghe âm thanh đọc tên 1 chữ cái,
// bấm đúng thẻ đó thì thẻ "bay" về nhân vật (gà con), bấm sai thì thẻ đúng
// sáng lên. Khác biệt DUY NHẤT: thẻ hiển thị CHỮ CÁI TO (chữ thuần CSS,
// không cần ảnh AI) thay vì ảnh minh hoạ — nên game này chạy được ngay,
// không cần chờ ảnh. Âm thanh đọc ĐÚNG 1 CHỮ CÁI (vd "A"), không phải cả
// câu như Bill ("I want a book").
//
// Nhân vật gà con 3 trạng thái cảm xúc + ảnh nền riêng — xem Bước 19 trong
// PROMPT.md, người dùng tự tạo bằng AI rồi gửi qua Git (Bước 11) — chưa có
// lúc viết file này nên <img> có fallback emoji/màu nền tạm.
//
// Không tự lấy state/store/WORDS từ app.js (tránh import vòng) — xem giải
// thích chi tiết hơn ở đầu games/khu-rung-ky-bi/forest.js.

import { wordsInCat } from '../../engine/content-loader.js';
import { buildRound, applyAnswer, classifyAnswer, getSkillProgress, wrongRate } from '../../engine/learning-engine.js';
import { saveProgress } from '../../engine/progress-store.js';
import { starIcon, CLOSE_SVG, SPEAK_SVG, worldBg } from '../../engine/ui-shared.js';

var ABC_WIN_TARGET = 10;

// Màu nền riêng cho từng vị trí thẻ (0-3, cố định theo data-idx) — chỉ để
// 4 thẻ chữ cái nhìn rực rỡ/dễ phân biệt vị trí, không mang ý nghĩa gì
// khác (khác màu đúng/sai vốn xử lý riêng bằng box-shadow, xem abcvui.css).
var TILE_COLORS = ['#E4633F', '#2F8F5B', '#4A90D9', '#F4A93B'];

export function createAbcVuiGame(ctx) {
  var root = document.getElementById('root');
  var state = ctx.state;

  // Ảnh gà con có thể CHƯA tồn tại (đang chờ người dùng tự tạo bằng AI,
  // xem đầu file) — bắt sự kiện "error" của <img> để tự chuyển sang
  // fallback emoji, giống hệt cách games/bill/bill.js đã làm.
  window.addEventListener('error', function (e) {
    var t = e.target;
    if (!t || t.tagName !== 'IMG') return;
    if (t.id === 'abcMascotImg' || t.id === 'abcTileImg') {
      t.hidden = true;
      var fbId = t.id === 'abcMascotImg' ? 'abcFallback' : 'abcTileFallback';
      var fb = document.getElementById(fbId);
      if (fb) fb.hidden = false;
    }
  }, true);

  // Y hệt pickTargetIndex() của forest.js/farm.js/bill.js — ưu tiên chữ
  // cái đã đến hạn ôn, trong đó ưu tiên tỉ lệ sai cao hơn.
  function pickTargetIndex(slots) {
    var store = ctx.getStore();
    var now = Date.now();
    var scored = slots.map(function (w, i) {
      var p = getSkillProgress(store.words, w.id, 'listen');
      var due = (p && p.seen && p.next <= now) ? 1 : 0;
      return { i: i, due: due, wr: wrongRate(p), level: p ? p.level : 0, rnd: Math.random() };
    });
    scored.sort(function (a, b) {
      return (b.due - a.due) || (b.wr - a.wr) || (a.level - b.level) || (a.rnd - b.rnd);
    });
    return scored[0].i;
  }

  function pickReplacementWord(replaceIdx) {
    var store = ctx.getStore();
    var exclude = {};
    state.slots.forEach(function (w) { exclude[w.id] = true; });
    var candidates = state.abcPool.filter(function (w) { return !exclude[w.id]; });
    if (!candidates.length) candidates = state.abcPool.filter(function (w) { return w.id !== state.slots[replaceIdx].id; });
    if (!candidates.length) candidates = state.abcPool.slice();
    return buildRound(candidates, store.words, 'listen', { size: 1 })[0];
  }

  function startAbcVuiGame() {
    var store = ctx.getStore();
    state.abcPool = wordsInCat(ctx.getWords(), 'letter');
    state.slots = buildRound(state.abcPool, store.words, 'listen', { size: 4 });
    state.targetIdx = pickTargetIndex(state.slots);
    state.correct = 0;
    state.answered = false;
    state.abcMood = 'idle';
    state.screen = 'abcvui';
    ctx.render();
  }

  // Thẻ chữ cái TO, thuần CSS/font — không cần ảnh AI (khác billTileMedia()
  // vốn cần ảnh đồ vật). Màu nền đổi theo vị trí (data-idx), không đổi
  // theo chữ cái, để 4 thẻ luôn dễ phân biệt vị trí qua màu quen mắt.
  function abcTileMedia(w, idx) {
    var color = TILE_COLORS[idx % TILE_COLORS.length];
    return '<span class="tileswing"><span class="abcletter" style="background:' + color + '">' + w.en + '</span></span>';
  }

  function abcStarsRow() {
    var row = '';
    for (var i = 0; i < ABC_WIN_TARGET; i++) {
      var lit = i < state.correct;
      var starMarkup = starIcon(lit ? '#FFD25A' : 'rgba(255,255,255,.55)', 16, 'rgba(35,58,42,.35)');
      row += starMarkup.replace('<svg ', '<svg class="' + (lit ? 'lit' : '') + '" ');
    }
    return row;
  }

  // Chỉ bắt đầu tính "thời gian trả lời" của bé từ lúc chữ cái đọc XONG
  // (qua onEnd) — cùng nguyên lý với speakBillTarget() trong
  // games/bill/bill.js (Vòng 35 trong ROADMAP.md). Đọc ĐÚNG 1 chữ cái,
  // không phải cả câu.
  function speakAbcTarget() {
    var w = state.slots[state.targetIdx];
    ctx.speak(w.promptAudioText || w.en, function () { state.cardShownAt = Date.now(); });
  }

  // Nhân vật gà con "học trò" — 3 trạng thái cảm xúc (chờ đợi/vui/buồn,
  // xem Bước 19 trong PROMPT.md). Ảnh thật có thể chưa tồn tại nên <img>
  // có thể lỗi tải — bắt lỗi đó để tự chuyển sang emoji tương ứng.
  var ABC_MOOD_IMG = { idle: 'chick-idle.png', happy: 'chick-happy.png', sad: 'chick-sad.png' };
  var ABC_MOOD_FALLBACK = { idle: '🐥', happy: '🐥', sad: '🐥' };
  function abcMascotHtml(mood) {
    var file = ABC_MOOD_IMG[mood] || ABC_MOOD_IMG.idle;
    var fallback = ABC_MOOD_FALLBACK[mood] || ABC_MOOD_FALLBACK.idle;
    return '<img src="assets/characters/' + file + '" alt="Gà con" id="abcMascotImg">' +
      '<span class="abcfallback" id="abcFallback" hidden>' + fallback + '</span>';
  }

  function setAbcMood(mood) {
    state.abcMood = mood;
    var wrap = document.getElementById('abcMascot');
    if (!wrap) return;
    wrap.innerHTML = abcMascotHtml(mood);
  }

  // Chuông "ting" khi bấm đúng — y hệt các game kia (mỗi game tự giữ 1 bản
  // sao riêng theo đúng quy ước đã có).
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

  // Chữ cái vừa bấm đúng "bay" từ vị trí ô của nó về cạnh gà con rồi biến
  // mất, sau đó hiện lại thành 1 chữ nhỏ đứng yên cạnh gà con (abcHeld) —
  // y hệt flyItemToMascot()/showHeldItem() trong games/bill/bill.js, chỉ
  // đổi nội dung bay từ ảnh sang chữ cái.
  function flyLetterToMascot(tileEl, w, done) {
    var stage = document.getElementById('abcStage');
    var mascotWrap = document.getElementById('abcMascotWrap');
    if (!stage || !mascotWrap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      done();
      return;
    }
    var stageRect = stage.getBoundingClientRect();
    var tileRect = tileEl.getBoundingClientRect();
    var mascotRect = mascotWrap.getBoundingClientRect();

    var startX = tileRect.left + tileRect.width / 2 - stageRect.left;
    var startY = tileRect.top + tileRect.height / 2 - stageRect.top;
    var endX = mascotRect.left + mascotRect.width / 2 - stageRect.left;
    var endY = mascotRect.bottom - stageRect.top - 20;

    var fly = document.createElement('div');
    fly.className = 'abcflyletter';
    fly.style.left = startX + 'px';
    fly.style.top = startY + 'px';
    fly.style.setProperty('--dx', (endX - startX) + 'px');
    fly.style.setProperty('--dy', (endY - startY) + 'px');
    fly.textContent = w.en;
    stage.appendChild(fly);
    setTimeout(function () { fly.remove(); done(); }, 620);
  }

  function showHeldLetter(w) {
    var heldEl = document.getElementById('abcHeld');
    if (!heldEl) return;
    heldEl.textContent = w.en;
    heldEl.classList.add('show');
  }

  function clearHeldLetter() {
    var heldEl = document.getElementById('abcHeld');
    if (heldEl) { heldEl.textContent = ''; heldEl.classList.remove('show'); }
  }

  function renderAbcVui() {
    state.cardShownAt = Date.now();

    var tiles = state.slots.map(function (w, i) {
      return '<div class="freetile" data-idx="' + i + '">' + abcTileMedia(w, i) + '</div>';
    }).join('');

    root.innerHTML = worldBg('abcphoto') +
      '<div class="content">' +
      '<div class="topbar">' +
      '<button class="iconbtn" id="homeBtn" aria-label="Về trang chủ">' + CLOSE_SVG + '</button>' +
      '<div class="starsrow" id="abcStars" style="margin:0;">' + abcStarsRow() + '</div>' +
      '<span style="width:38px;"></span>' +
      '</div>' +
      '<div class="abcstage" id="abcStage">' +
      '<div class="abcmascotwrap" id="abcMascotWrap">' +
      '<div class="abcmascot" id="abcMascot">' + abcMascotHtml(state.abcMood || 'idle') + '</div>' +
      '<div class="abcheld" id="abcHeld"></div>' +
      '</div>' +
      '<div class="freeplay" id="abcItemsArea">' + tiles + '</div>' +
      '</div>' +
      '<button class="soundbtn" id="speakBtn" aria-label="Nghe lại">' + SPEAK_SVG + '</button>' +
      '</div>';

    document.getElementById('homeBtn').addEventListener('click', function () {
      state.screen = 'home'; ctx.render();
    });
    document.getElementById('speakBtn').addEventListener('click', speakAbcTarget);
    speakAbcTarget();

    var itemsArea = document.getElementById('abcItemsArea');
    Array.prototype.forEach.call(itemsArea.querySelectorAll('.freetile'), function (tileEl) {
      tileEl.addEventListener('click', function () {
        handleAbcAnswer(parseInt(tileEl.getAttribute('data-idx'), 10));
      });
    });
  }

  function handleAbcAnswer(idx) {
    if (state.answered) return;
    state.answered = true;

    var store = ctx.getStore();
    var tileEls = document.getElementById('abcItemsArea').querySelectorAll('.freetile');
    var targetWord = state.slots[state.targetIdx];
    var isCorrect = idx === state.targetIdx;
    var responseTimeMs = Date.now() - state.cardShownAt;

    if (isCorrect) {
      var outcome = classifyAnswer(true, responseTimeMs);
      applyAnswer(store.words, targetWord.id, 'listen', outcome);
      saveProgress(store);
      state.correct++;
      ctx.speak(targetWord.promptAudioText || targetWord.en);
      tileEls[idx].classList.add('correct');
      playDing();
      setAbcMood('happy');
      flyLetterToMascot(tileEls[idx], targetWord, function () { showHeldLetter(targetWord); });

      var isDone = state.correct >= ABC_WIN_TARGET;
      setTimeout(function () {
        if (isDone) { state.screen = 'abcvuiSummary'; ctx.render(); }
        else advanceAbcRound(state.targetIdx);
      }, isDone ? 700 : 900);
    } else {
      applyAnswer(store.words, targetWord.id, 'listen', 'wrong');
      saveProgress(store);
      tileEls[idx].classList.add('wrong');
      tileEls[state.targetIdx].classList.add('correct');
      ctx.speak(targetWord.promptAudioText || targetWord.en);
      setAbcMood('sad');
      flyLetterToMascot(tileEls[state.targetIdx], targetWord, function () { showHeldLetter(targetWord); });
      setTimeout(function () { advanceAbcRound(state.targetIdx); }, 3000);
    }
  }

  function advanceAbcRound(replaceIdx) {
    state.slots[replaceIdx] = pickReplacementWord(replaceIdx);
    state.targetIdx = pickTargetIndex(state.slots);
    state.answered = false;
    state.cardShownAt = Date.now();

    var tileEls = document.getElementById('abcItemsArea').querySelectorAll('.freetile');
    Array.prototype.forEach.call(tileEls, function (el) { el.classList.remove('wrong', 'correct'); });
    tileEls[replaceIdx].innerHTML = abcTileMedia(state.slots[replaceIdx], replaceIdx);

    document.getElementById('abcStars').innerHTML = abcStarsRow();
    clearHeldLetter();
    setAbcMood('idle');

    speakAbcTarget();
  }

  function renderAbcVuiSummary() {
    root.innerHTML = worldBg() +
      '<div class="content">' +
      '<div class="summary-mid" id="summaryMid">' +
      '<div class="starburst">' + starIcon('#FFD25A', 28) + starIcon('#F4A93B', 36) + starIcon('#FFD25A', 28) + '</div>' +
      ctx.owlMascot(64) +
      '<h2>Giỏi quá!</h2>' +
      '<p>Bé nhớ mặt chữ cái giỏi lắm!</p>' +
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

    document.getElementById('againBtn').addEventListener('click', startAbcVuiGame);
    document.getElementById('homeBtn2').addEventListener('click', function () {
      state.screen = 'home'; ctx.render();
    });
  }

  // Markup ô icon của game này trong lưới chọn trò chơi ở Trang chủ —
  // dùng ảnh gà con (trạng thái chờ đợi), có fallback emoji nếu ảnh chưa
  // tồn tại.
  function gameTileHtml(title) {
    return '<button type="button" class="gametile abc-tile" data-id="abcvui">' +
      '<span class="abctile-face" id="abcTileFace">' +
      '<img src="assets/characters/chick-idle.png" alt="" id="abcTileImg">' +
      '<span class="abctile-fallback" id="abcTileFallback" hidden>🐥</span>' +
      '</span>' +
      '<span class="name">' + title + '</span></button>';
  }

  return {
    startAbcVuiGame: startAbcVuiGame,
    renderAbcVui: renderAbcVui,
    renderAbcVuiSummary: renderAbcVuiSummary,
    gameTileHtml: gameTileHtml
  };
}
