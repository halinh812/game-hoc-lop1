// Game "Khu rừng kỳ bí" — nghe tên tiếng Anh, bấm đúng con vật (chỉ luyện
// kỹ năng "Nghe" của Learning Engine). Toàn bộ logic/markup RIÊNG của
// game này nằm trong file này — không đụng tới màn nào khác của app.
//
// Không tự lấy state/store/WORDS từ app.js (tránh import vòng — app.js
// cũng cần import ngược lại file này để gắn vào router). Thay vào đó,
// app.js gọi createForestGame(ctx) 1 lần lúc khởi động, truyền vào đúng
// những gì game cần: state dùng chung, cách đọc store/WORDS hiện tại
// (dùng hàm getter vì 2 biến này bị GÁN LẠI lúc tải xong nội dung/lúc
// phụ huynh thêm từ mới — truyền thẳng giá trị lúc tạo sẽ bị cũ), hàm
// speak() và render() dùng chung.

import { wordsInCat } from '../../engine/content-loader.js';
import { buildRound, applyAnswer, classifyAnswer, getSkillProgress, wrongRate } from '../../engine/learning-engine.js';
import { saveProgress } from '../../engine/progress-store.js';
import { starIcon, CLOSE_SVG, SPEAK_SVG, worldBg } from '../../engine/ui-shared.js';

var FOREST_WIN_TARGET = 10;

export function createForestGame(ctx) {
  var root = document.getElementById('root');
  var state = ctx.state;

  // Chọn slot nào (trong 4 slot đang hiển thị) sẽ là câu hỏi tiếp theo —
  // ưu tiên từ đã đến hạn ôn, trong đó ưu tiên tỉ lệ sai cao hơn, LV thấp
  // hơn; có yếu tố ngẫu nhiên để không luôn rơi vào cùng 1 slot khi các
  // từ đang ngang điểm nhau (vd lúc mới bắt đầu, chưa từ nào được học).
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

  // Chọn từ mới thay cho slot vừa được hỏi — loại trừ cả 4 từ đang hiển
  // thị (kể cả từ vừa hỏi) để tránh lặp lại ngay, ưu tiên due/tỉ lệ sai
  // cao trong số từ còn lại của bộ.
  function pickReplacementWord(replaceIdx) {
    var store = ctx.getStore();
    var exclude = {};
    state.slots.forEach(function (w) { exclude[w.id] = true; });
    var candidates = state.forestPool.filter(function (w) { return !exclude[w.id]; });
    if (!candidates.length) candidates = state.forestPool.filter(function (w) { return w.id !== state.slots[replaceIdx].id; });
    if (!candidates.length) candidates = state.forestPool.slice();
    return buildRound(candidates, store.words, 'listen', { size: 1 })[0];
  }

  function startForestGame() {
    var store = ctx.getStore();
    // Chỉ lấy động vật hoang dã — trò "vật nuôi" (chưa làm) sẽ lấy
    // subcategory="pet" cùng category="animal" riêng, không lẫn vào đây.
    state.forestPool = wordsInCat(ctx.getWords(), 'animal', 'wild');
    state.slots = buildRound(state.forestPool, store.words, 'listen', { size: 4 });
    state.targetIdx = pickTargetIndex(state.slots);
    state.correct = 0;
    state.answered = false;
    state.screen = 'forest';
    ctx.render();
  }

  // Ảnh tĩnh hoặc video lặp (nếu từ có "video") cho 1 ô — object-fit:contain
  // (CSS) tự co vừa ô, giữ đúng tỉ lệ khung hình gốc. Bọc trong span
  // .tileswing để có hiệu ứng "lắc lư nhẹ nhàng" tại chỗ (CSS, xem
  // forest.css) — không cho con vật chạy/di chuyển vị trí, chỉ đứng yên
  // và đung đưa như đang thở, theo đúng yêu cầu (đã thử "chạy" ở các
  // vòng trước và bị chê rối).
  function forestTileMedia(w) {
    var media = w.video
      ? '<video src="' + w.video + '" autoplay loop muted playsinline poster="' + w.image + '"></video>'
      : '<img src="' + w.image + '" alt="' + w.en + '">';
    return '<span class="tileswing">' + media + '</span>';
  }

  function forestStarsRow() {
    var row = '';
    for (var i = 0; i < FOREST_WIN_TARGET; i++) {
      var lit = i < state.correct;
      var starMarkup = starIcon(lit ? '#FFD25A' : 'rgba(255,255,255,.55)', 16, 'rgba(35,58,42,.35)');
      row += starMarkup.replace('<svg ', '<svg class="' + (lit ? 'lit' : '') + '" ');
    }
    return row;
  }

  function speakForestTarget() {
    var w = state.slots[state.targetIdx];
    ctx.speak('Catch the ' + w.en + '!');
  }

  // Chuông "ting" 2 nốt lên cao khi bấm đúng — tự tổng hợp bằng Web Audio,
  // không cần file âm thanh riêng. Chuỗi hợp âm đi lên C5-E5-G5-C6 — mỗi
  // nốt có 1 lớp "thân" (triangle, nhiều bội âm hơn sine trơn) + 1 lớp
  // "lấp lánh" nhỏ (sine cao hơn 1 quãng 8) chồng lên, cho tiếng đầy và
  // rõ hơn hẳn, giống hiệu ứng "ăn điểm" quen thuộc trong game.
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

  // Bắn vài hạt "ăn mừng" nhỏ từ chính ô vừa bấm đúng rồi tự dọn — khác
  // với .fall (rơi từ trên xuống, dùng cho màn thắng cả ván), đây bắn ra
  // rồi tan biến nhanh trong lúc vẫn đang chơi tiếp câu khác.
  function celebrateTile(tileEl) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var colors = ['#F4A93B', '#E4633F', '#2F8F5B', '#FFD25A'];
    for (var i = 0; i < 8; i++) {
      var p = document.createElement('span');
      p.className = 'tileburst';
      var angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.4;
      var dist = 26 + Math.random() * 20;
      p.style.setProperty('--dx', (Math.cos(angle) * dist) + 'px');
      p.style.setProperty('--dy', (Math.sin(angle) * dist - 10) + 'px');
      p.style.setProperty('--rot', (Math.random() * 360) + 'deg');
      p.style.background = colors[i % colors.length];
      tileEl.appendChild(p);
      (function (el) { setTimeout(function () { el.remove(); }, 750); })(p);
    }
  }

  // Mỗi ô (0-3) có 1 góc phần tư cố định trong khu chơi suốt cả ván — chỉ
  // vị trí CHÍNH XÁC bên trong góc đó là ngẫu nhiên, tính lại mỗi khi con
  // vật ở ô đó đổi (xem forestPositionTile()). 2 góc phần tư khác nhau
  // không bao giờ chồng lấn nên đảm bảo 2 con không bao giờ đè lên nhau,
  // mà không cần thử-sai (rejection sampling) vốn có thể bị "kẹt".
  function forestPositionTile(tileEl, idx) {
    var container = document.getElementById('freeplayArea');
    if (!container) return;
    var cw = container.clientWidth;
    var ch = container.clientHeight;
    var tw = tileEl.offsetWidth;
    var th = tileEl.offsetHeight;
    var halfW = cw / 2;
    var halfH = ch / 2;
    var qx = idx % 2;
    var qy = idx < 2 ? 0 : 1;
    var maxJitterX = Math.max(halfW - tw, 0);
    var maxJitterY = Math.max(halfH - th, 0);
    tileEl.style.left = (qx * halfW + Math.random() * maxJitterX) + 'px';
    tileEl.style.top = (qy * halfH + Math.random() * maxJitterY) + 'px';
  }

  function forestPositionAllTiles() {
    var tileEls = document.getElementById('freeplayArea').querySelectorAll('.freetile');
    Array.prototype.forEach.call(tileEls, function (tileEl, i) { forestPositionTile(tileEl, i); });
  }

  function renderForest() {
    state.cardShownAt = Date.now();

    // Vị trí ngẫu nhiên trong khu chơi thay vì lưới ô vuông — không đi
    // lại/chạy (đã thử và bị chê rối ở các vòng trước), chỉ đứng yên tại
    // vị trí ngẫu nhiên đó và lắc lư nhẹ. Chỉ đúng 1 ô (ô vừa được hỏi)
    // bị đổi con + đổi vị trí mới sau mỗi câu, 3 ô kia giữ nguyên DOM
    // (xem advanceForestRound) — quan trọng với ô có <video>: nếu dựng
    // lại toàn bộ innerHTML mỗi câu, video của các ô KHÔNG đổi cũng bị
    // tạo lại từ đầu và chạy lại từ giây 0, giật hình mỗi lượt.
    var tiles = state.slots.map(function (w, i) {
      return '<div class="freetile" data-idx="' + i + '">' + forestTileMedia(w) + '</div>';
    }).join('');

    root.innerHTML = worldBg('forestphoto') +
      '<div class="content">' +
      '<div class="topbar">' +
      '<button class="iconbtn" id="homeBtn" aria-label="Về trang chủ">' + CLOSE_SVG + '</button>' +
      '<div class="starsrow" id="forestStars" style="margin:0;">' + forestStarsRow() + '</div>' +
      '<span style="width:38px;"></span>' +
      '</div>' +
      '<div class="freeplay" id="freeplayArea">' + tiles + '</div>' +
      '<button class="soundbtn" id="speakBtn" aria-label="Nghe lại">' + SPEAK_SVG + '</button>' +
      '</div>';

    document.getElementById('homeBtn').addEventListener('click', function () {
      state.screen = 'home'; ctx.render();
    });
    document.getElementById('speakBtn').addEventListener('click', speakForestTarget);
    speakForestTarget();

    var freeplayArea = document.getElementById('freeplayArea');
    Array.prototype.forEach.call(freeplayArea.querySelectorAll('.freetile'), function (tileEl) {
      tileEl.addEventListener('click', function () {
        handleForestAnswer(parseInt(tileEl.getAttribute('data-idx'), 10));
      });
    });
    forestPositionAllTiles();
  }

  function handleForestAnswer(idx) {
    if (state.answered) return;
    state.answered = true;

    var store = ctx.getStore();
    var tileEls = document.getElementById('freeplayArea').querySelectorAll('.freetile');
    var targetWord = state.slots[state.targetIdx];
    var isCorrect = idx === state.targetIdx;
    var responseTimeMs = Date.now() - state.cardShownAt;

    if (isCorrect) {
      var outcome = classifyAnswer(true, responseTimeMs);
      applyAnswer(store.words, targetWord.id, 'listen', outcome);
      saveProgress(store);
      state.correct++;
      ctx.speak(targetWord.en);
      tileEls[idx].classList.add('correct');
      playDing();
      celebrateTile(tileEls[idx]);

      var isDone = state.correct >= FOREST_WIN_TARGET;
      setTimeout(function () {
        if (isDone) { state.screen = 'forestSummary'; ctx.render(); }
        else advanceForestRound(state.targetIdx);
      }, isDone ? 500 : 800);
    } else {
      applyAnswer(store.words, targetWord.id, 'listen', 'wrong');
      saveProgress(store);
      tileEls[idx].classList.add('wrong');
      tileEls[state.targetIdx].classList.add('correct');
      ctx.speak(targetWord.en);
      setTimeout(function () { advanceForestRound(state.targetIdx); }, 3000);
    }
  }

  // Chỉ thay từ ở slot vừa được hỏi (replaceIdx) — 3 slot kia giữ nguyên
  // con đang hiển thị, không đổi. Cập nhật DOM tại chỗ (không gọi
  // ctx.render() dựng lại toàn màn) để 3 ô còn lại — kể cả ô đang phát
  // <video> — không bị tạo lại và chạy lại từ đầu mỗi câu.
  function advanceForestRound(replaceIdx) {
    state.slots[replaceIdx] = pickReplacementWord(replaceIdx);
    state.targetIdx = pickTargetIndex(state.slots);
    state.answered = false;
    state.cardShownAt = Date.now();

    var tileEls = document.getElementById('freeplayArea').querySelectorAll('.freetile');
    Array.prototype.forEach.call(tileEls, function (el) { el.classList.remove('wrong', 'correct'); });
    tileEls[replaceIdx].innerHTML = forestTileMedia(state.slots[replaceIdx]);
    forestPositionTile(tileEls[replaceIdx], replaceIdx);

    document.getElementById('forestStars').innerHTML = forestStarsRow();

    speakForestTarget();
  }

  function renderForestSummary() {
    root.innerHTML = worldBg() +
      '<div class="content">' +
      '<div class="summary-mid" id="summaryMid">' +
      '<div class="starburst">' + starIcon('#FFD25A', 28) + starIcon('#F4A93B', 36) + starIcon('#FFD25A', 28) + '</div>' +
      ctx.owlMascot(64) +
      '<h2>Giỏi quá!</h2>' +
      '<p>Bé bắt được hết các bạn thú rồi!</p>' +
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

    document.getElementById('againBtn').addEventListener('click', startForestGame);
    document.getElementById('homeBtn2').addEventListener('click', function () {
      state.screen = 'home'; ctx.render();
    });
  }

  // Markup ô icon của game này trong lưới chọn trò chơi ở Trang chủ —
  // nền là ảnh crop nhỏ của ảnh nền trong game (assets/backgrounds/
  // forest-bg.jpg) + cả con hổ (assets/animals/tiger.png, lắc lư nhẹ)
  // thay cho emoji phẳng dùng chung cho các ô "Sắp ra mắt".
  function gameTileHtml(title) {
    return '<button type="button" class="gametile forest-tile" data-id="forest">' +
      '<span class="foresttile-face"><img src="assets/animals/tiger.png" alt=""></span>' +
      '<span class="name">' + title + '</span></button>';
  }

  return {
    startForestGame: startForestGame,
    renderForest: renderForest,
    renderForestSummary: renderForestSummary,
    gameTileHtml: gameTileHtml
  };
}
