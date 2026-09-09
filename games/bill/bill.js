// Game "Help Bill!" — nghe CẢ CÂU tiếng Anh ("I want a book"), bấm đúng
// đồ vật (chỉ luyện kỹ năng "Nghe" của Learning Engine). Khác 2 game
// trước (Khu rừng kỳ bí/Nông trại — bấm đúng CON VẬT đang lắc lư rải rác
// trong khu chơi): ở đây có nhân vật Bill đứng cố định, 4 món đồ xếp
// thành 1 hàng ngay ngắn bên dưới — chọn đúng thì đồ "bay" về cạnh Bill
// (Bill vui), chọn sai thì đồ đúng sáng lên còn Bill buồn. Vẫn tái dùng
// gần như nguyên vẹn cơ chế chấm điểm/chọn câu hỏi tiếp theo từ Learning
// Engine và phần CSS dùng chung ở engine/catch-game.css (thanh sao, nút
// nghe lại, màn thắng cuộc) — chỉ viết riêng phần mascot + hiệu ứng bay.
//
// Ảnh nhân vật (assets/characters/bill-idle.png/bill-happy.png/
// bill-sad.png) và ảnh đồ vật (assets/objects/*.png) CHƯA có lúc viết
// file này — người dùng tự tạo bằng các prompt ở Bước 12-14 trong
// ANIMAL_ART_PIPELINE.md rồi gửi qua Git (xem Bước 11) — không cần sửa
// gì thêm ở đây khi ảnh về: <img> tự động dùng ảnh thật, nếu ảnh chưa
// tồn tại thì tự rơi về icon/emoji cảm xúc tạm (xem
// billMascotHtml()/billTileMedia()).
//
// Không tự lấy state/store/WORDS từ app.js (tránh import vòng) — xem
// giải thích chi tiết hơn ở đầu games/khu-rung-ky-bi/forest.js.

import { wordsInCat } from '../../engine/content-loader.js';
import { buildRound, applyAnswer, classifyAnswer, getSkillProgress, wrongRate } from '../../engine/learning-engine.js';
import { saveProgress } from '../../engine/progress-store.js';
import { starIcon, CLOSE_SVG, SPEAK_SVG, worldBg } from '../../engine/ui-shared.js';

var BILL_WIN_TARGET = 10;

export function createBillGame(ctx) {
  var root = document.getElementById('root');
  var state = ctx.state;

  // Ảnh Bill/đồ vật có thể CHƯA tồn tại (đang chờ người dùng tự tạo bằng
  // AI, xem đầu file) — bắt sự kiện "error" của <img> để tự chuyển sang
  // fallback emoji thay vì hiện ảnh vỡ. Sự kiện "error" trên <img> KHÔNG
  // nổi bọt (bubble) nên phải nghe ở pha "capture" (tham số true) trên
  // window mới bắt được dù ảnh nằm sâu trong DOM vừa render — đăng ký 1
  // lần duy nhất lúc tạo game, không cần gắn lại mỗi lần render.
  window.addEventListener('error', function (e) {
    var t = e.target;
    if (!t || t.tagName !== 'IMG') return;
    if (t.id === 'billMascotImg' || t.id === 'billTileImg') {
      t.hidden = true;
      var fbId = t.id === 'billMascotImg' ? 'billFallback' : 'billTileFallback';
      var fb = document.getElementById(fbId);
      if (fb) fb.hidden = false;
    }
  }, true);

  // Y hệt pickTargetIndex() của forest.js/farm.js — ưu tiên từ đã đến
  // hạn ôn, trong đó ưu tiên tỉ lệ sai cao hơn, LV thấp hơn, có yếu tố
  // ngẫu nhiên khi ngang điểm.
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
    var candidates = state.billPool.filter(function (w) { return !exclude[w.id]; });
    if (!candidates.length) candidates = state.billPool.filter(function (w) { return w.id !== state.slots[replaceIdx].id; });
    if (!candidates.length) candidates = state.billPool.slice();
    return buildRound(candidates, store.words, 'listen', { size: 1 })[0];
  }

  function startBillGame() {
    var store = ctx.getStore();
    state.billPool = wordsInCat(ctx.getWords(), 'object', 'school');
    state.slots = buildRound(state.billPool, store.words, 'listen', { size: 4 });
    state.targetIdx = pickTargetIndex(state.slots);
    state.correct = 0;
    state.answered = false;
    state.billMood = 'idle';
    state.screen = 'bill';
    ctx.render();
  }

  // Ảnh tĩnh của 1 món đồ, có nền dự phòng bằng emoji nếu chưa có ảnh AI
  // riêng (xem content/packs/objects-v1.json — mỗi từ đều có "emoji" nên
  // trò chơi chạy được ngay hôm nay, chưa cần chờ ảnh thật).
  function billTileMedia(w) {
    var inner = w.image
      ? '<img src="' + w.image + '" alt="' + w.en + '">'
      : '<span class="tileemoji">' + (w.emoji || '❓') + '</span>';
    return '<span class="tileswing">' + inner + '</span>';
  }

  function billStarsRow() {
    var row = '';
    for (var i = 0; i < BILL_WIN_TARGET; i++) {
      var lit = i < state.correct;
      var starMarkup = starIcon(lit ? '#FFD25A' : 'rgba(255,255,255,.55)', 16, 'rgba(35,58,42,.35)');
      row += starMarkup.replace('<svg ', '<svg class="' + (lit ? 'lit' : '') + '" ');
    }
    return row;
  }

  function speakBillTarget() {
    var w = state.slots[state.targetIdx];
    ctx.speak(w.promptAudioText || ('I want a ' + w.en + '.'));
  }

  // Nhân vật Bill — 3 trạng thái cảm xúc (chờ đợi/vui/buồn, xem Bước 12
  // trong ANIMAL_ART_PIPELINE.md): "idle" là ảnh mặc định lúc chưa bấm
  // gì (vừa nghe xong câu hỏi), "happy" lúc chọn đúng, "sad" lúc chọn
  // sai. Ảnh thật có thể chưa tồn tại nên <img> có thể lỗi tải — bắt lỗi
  // đó để tự chuyển sang emoji tương ứng thay vì hiện ảnh vỡ.
  var BILL_MOOD_IMG = { idle: 'bill-idle.png', happy: 'bill-happy.png', sad: 'bill-sad.png' };
  var BILL_MOOD_FALLBACK = { idle: '🙂', happy: '😊', sad: '😢' };
  function billMascotHtml(mood) {
    var file = BILL_MOOD_IMG[mood] || BILL_MOOD_IMG.idle;
    var fallback = BILL_MOOD_FALLBACK[mood] || BILL_MOOD_FALLBACK.idle;
    return '<img src="assets/characters/' + file + '" alt="Bill" id="billMascotImg">' +
      '<span class="billfallback" id="billFallback" hidden>' + fallback + '</span>';
  }

  function setBillMood(mood) {
    state.billMood = mood;
    var wrap = document.getElementById('billMascot');
    if (!wrap) return;
    wrap.innerHTML = billMascotHtml(mood);
  }

  // Chuông "ting" khi bấm đúng — y hệt Khu rừng kỳ bí: chuỗi hợp âm đi
  // lên C5-E5-G5-C6, 2 lớp (thân + lấp lánh) mỗi nốt cho tiếng đầy hơn.
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

  // Món đồ vừa bấm đúng "bay" từ vị trí ô của nó về cạnh Bill rồi biến
  // mất, sau đó hiện lại thành 1 icon nhỏ đứng yên cạnh Bill (billHeld).
  // Tính toạ độ tương đối so với billStage (cha chung của cả ô đồ vật lẫn
  // Bill) bằng getBoundingClientRect() — cùng kỹ thuật với hạt "ăn mừng"
  // (tileburst) đã dùng ở forest.js, chỉ khác là bay hẳn tới 1 điểm đích
  // cụ thể (cạnh Bill) thay vì bay toé ra ngẫu nhiên rồi tan biến.
  function flyItemToMascot(tileEl, w, done) {
    var stage = document.getElementById('billStage');
    var mascotWrap = document.getElementById('billMascotWrap');
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
    fly.className = 'billflyicon';
    fly.style.left = startX + 'px';
    fly.style.top = startY + 'px';
    fly.style.setProperty('--dx', (endX - startX) + 'px');
    fly.style.setProperty('--dy', (endY - startY) + 'px');
    fly.innerHTML = w.image ? '<img src="' + w.image + '" alt="">' : '<span>' + (w.emoji || '') + '</span>';
    stage.appendChild(fly);
    setTimeout(function () { fly.remove(); done(); }, 620);
  }

  function showHeldItem(w) {
    var heldEl = document.getElementById('billHeld');
    if (!heldEl) return;
    heldEl.innerHTML = w.image ? '<img src="' + w.image + '" alt="">' : '<span>' + (w.emoji || '') + '</span>';
    heldEl.classList.add('show');
  }

  function clearHeldItem() {
    var heldEl = document.getElementById('billHeld');
    if (heldEl) { heldEl.innerHTML = ''; heldEl.classList.remove('show'); }
  }

  // 4 ô đồ vật xếp thành 1 hàng ngay ngắn gần đáy khu chơi (khác cách
  // rải ngẫu nhiên theo góc phần tư của forest.js/farm.js — ở đây đồ vật
  // không phải "đi tìm", chỉ cần bày gọn gàng để bé dễ so sánh/chọn).
  function billPositionTile(tileEl, idx) {
    var container = document.getElementById('billItemsArea');
    if (!container) return;
    var cw = container.clientWidth;
    var ch = container.clientHeight;
    var slotW = cw / 4;
    var tw = tileEl.offsetWidth;
    var th = tileEl.offsetHeight;
    var cx = slotW * idx + slotW / 2;
    tileEl.style.left = (cx - tw / 2) + 'px';
    tileEl.style.top = (ch - th - 10) + 'px';
  }

  function billPositionAllTiles() {
    var tileEls = document.getElementById('billItemsArea').querySelectorAll('.freetile');
    Array.prototype.forEach.call(tileEls, function (tileEl, i) { billPositionTile(tileEl, i); });
  }

  function renderBill() {
    state.cardShownAt = Date.now();

    var tiles = state.slots.map(function (w, i) {
      return '<div class="freetile" data-idx="' + i + '">' + billTileMedia(w) + '</div>';
    }).join('');

    root.innerHTML = worldBg('billphoto') +
      '<div class="content">' +
      '<div class="topbar">' +
      '<button class="iconbtn" id="homeBtn" aria-label="Về trang chủ">' + CLOSE_SVG + '</button>' +
      '<div class="starsrow" id="billStars" style="margin:0;">' + billStarsRow() + '</div>' +
      '<span style="width:38px;"></span>' +
      '</div>' +
      '<div class="billstage" id="billStage">' +
      '<div class="billmascotwrap" id="billMascotWrap">' +
      '<div class="billmascot" id="billMascot">' + billMascotHtml(state.billMood || 'idle') + '</div>' +
      '<div class="billheld" id="billHeld"></div>' +
      '</div>' +
      '<div class="freeplay" id="billItemsArea">' + tiles + '</div>' +
      '</div>' +
      '<button class="soundbtn" id="speakBtn" aria-label="Nghe lại">' + SPEAK_SVG + '</button>' +
      '</div>';

    document.getElementById('homeBtn').addEventListener('click', function () {
      state.screen = 'home'; ctx.render();
    });
    document.getElementById('speakBtn').addEventListener('click', speakBillTarget);
    speakBillTarget();

    var itemsArea = document.getElementById('billItemsArea');
    Array.prototype.forEach.call(itemsArea.querySelectorAll('.freetile'), function (tileEl) {
      tileEl.addEventListener('click', function () {
        handleBillAnswer(parseInt(tileEl.getAttribute('data-idx'), 10));
      });
    });
    billPositionAllTiles();
  }

  function handleBillAnswer(idx) {
    if (state.answered) return;
    state.answered = true;

    var store = ctx.getStore();
    var tileEls = document.getElementById('billItemsArea').querySelectorAll('.freetile');
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
      setBillMood('happy');
      flyItemToMascot(tileEls[idx], targetWord, function () { showHeldItem(targetWord); });

      var isDone = state.correct >= BILL_WIN_TARGET;
      setTimeout(function () {
        if (isDone) { state.screen = 'billSummary'; ctx.render(); }
        else advanceBillRound(state.targetIdx);
      }, isDone ? 700 : 900);
    } else {
      applyAnswer(store.words, targetWord.id, 'listen', 'wrong');
      saveProgress(store);
      tileEls[idx].classList.add('wrong');
      tileEls[state.targetIdx].classList.add('correct');
      ctx.speak(targetWord.promptAudioText || targetWord.en);
      setBillMood('sad');
      // Đồ ĐÚNG vẫn bay về cạnh Bill dù bé chọn sai (Bill buồn nhưng bé
      // vẫn thấy rõ đáp án đúng là ô nào) — khác ô bé vừa bấm (đang có
      // quầng đỏ "wrong"), bay từ đúng vị trí ô target trong 4 ô.
      flyItemToMascot(tileEls[state.targetIdx], targetWord, function () { showHeldItem(targetWord); });
      setTimeout(function () { advanceBillRound(state.targetIdx); }, 3000);
    }
  }

  function advanceBillRound(replaceIdx) {
    state.slots[replaceIdx] = pickReplacementWord(replaceIdx);
    state.targetIdx = pickTargetIndex(state.slots);
    state.answered = false;
    state.cardShownAt = Date.now();

    var tileEls = document.getElementById('billItemsArea').querySelectorAll('.freetile');
    Array.prototype.forEach.call(tileEls, function (el) { el.classList.remove('wrong', 'correct'); });
    tileEls[replaceIdx].innerHTML = billTileMedia(state.slots[replaceIdx]);
    billPositionTile(tileEls[replaceIdx], replaceIdx);

    document.getElementById('billStars').innerHTML = billStarsRow();
    clearHeldItem();
    setBillMood('idle');

    speakBillTarget();
  }

  function renderBillSummary() {
    root.innerHTML = worldBg() +
      '<div class="content">' +
      '<div class="summary-mid" id="summaryMid">' +
      '<div class="starburst">' + starIcon('#FFD25A', 28) + starIcon('#F4A93B', 36) + starIcon('#FFD25A', 28) + '</div>' +
      ctx.owlMascot(64) +
      '<h2>Giỏi quá!</h2>' +
      '<p>Bé đã giúp Bill lấy đủ đồ rồi!</p>' +
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

    document.getElementById('againBtn').addEventListener('click', startBillGame);
    document.getElementById('homeBtn2').addEventListener('click', function () {
      state.screen = 'home'; ctx.render();
    });
  }

  // Markup ô icon của game này trong lưới chọn trò chơi ở Trang chủ —
  // nền tạm bằng gradient (chưa có assets/backgrounds/school-bg.jpg, xem
  // Bước 14 trong ANIMAL_ART_PIPELINE.md) + mặt Bill (lắc lư nhẹ), có
  // fallback emoji nếu ảnh Bill chưa tồn tại.
  function gameTileHtml(title) {
    return '<button type="button" class="gametile bill-tile" data-id="bill">' +
      '<span class="billtile-face" id="billTileFace">' +
      '<img src="assets/characters/bill-idle.png" alt="" id="billTileImg">' +
      '<span class="billtile-fallback" id="billTileFallback" hidden>🧒</span>' +
      '</span>' +
      '<span class="name">' + title + '</span></button>';
  }

  return {
    startBillGame: startBillGame,
    renderBill: renderBill,
    renderBillSummary: renderBillSummary,
    gameTileHtml: gameTileHtml
  };
}
