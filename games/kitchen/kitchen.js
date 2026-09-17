// Game "Kitchen" — luyện kỹ năng "Nghe" (skill=listen, dùng chung skill
// với forest/farm/bill/abcvui, trên vốn từ khác: 10 đồ vật nhà bếp lấy
// cảm hứng từ ảnh bếp thật của gia đình người dùng).
//
// CƠ CHẾ KHÁC HẲN mọi game trước: không có thẻ/icon rời — cả 10 đồ vật
// đều nằm chung trong 1 ẢNH NỀN BẾP DUY NHẤT (assets/backgrounds/
// kitchen-bg.jpg). Mỗi câu hỏi, 4 trong 10 đồ vật đó SÁNG NHẤP NHÁY ngay
// tại đúng vị trí của nó trong ảnh (viền vàng nhấp nháy — xem HOTSPOTS +
// .kitchenhotspot trong kitchen.css), nghe âm thanh đọc tên 1 món, bé bấm
// THẲNG vào đúng vị trí món đó trong ảnh (không phải bấm vào ô thẻ).
//
// GLOW_ASSETS: mỗi đồ vật có 1 ảnh PNG nền trong suốt riêng
// (assets/kitchen/<id>.png) — CẮT ĐÚNG hình dạng thật của món đó (dùng
// GrabCut xoá nền, không phải hình chữ nhật) từ chính ảnh kitchen-bg.jpg,
// đặt đè CHÍNH XÁC lên đúng vị trí gốc của nó trong ảnh nền (toạ độ %
// left/top/width/height dưới đây = đúng khung đã cắt). Nhờ ảnh trong
// suốt theo đúng hình, hiệu ứng "phát sáng" (filter:drop-shadow trong
// kitchen.css) ôm sát viền thật của đồ vật thay vì 1 khung vuông — xem
// yêu cầu người dùng phản hồi sau bản đầu (chỉ có khung vuông).
//
// Toạ độ đo trực tiếp trên ảnh THẬT sau khi nhận từ người dùng (Bước 20
// trong PROMPT.md) — không thể đoán trước khi chưa có ảnh, khác hẳn các
// game thẻ rời (forest/farm/bill/abcvui) vốn không phụ thuộc bố cục ảnh
// cụ thể. Nếu sau này đổi ảnh nền khác, phải cắt + đo lại từ đầu.
var GLOW_ASSETS = {
  cabinet: { left: 0, top: 2.98, width: 100, height: 22.02 },
  rice_cooker: { left: 0, top: 29.98, width: 26.95, height: 20.02 },
  pot: { left: 37.96, top: 27.98, width: 29.04, height: 15.99 },
  stove: { left: 26.95, top: 35.97, width: 44.99, height: 13.01 },
  sink: { left: 70.96, top: 29, width: 29.04, height: 18.97 },
  bowl: { left: 14.97, top: 42.48, width: 28, height: 13.99 },
  plate: { left: 51.95, top: 43.97, width: 33.98, height: 12.03 },
  fan: { left: 3, top: 56.98, width: 28.97, height: 29 },
  chair: { left: 47.98, top: 63.99, width: 20.96, height: 21.98 },
  table: { left: 64.97, top: 63.99, width: 35.03, height: 19.99 }
};

// Đúng đủ 10 đồ vật trong ảnh (không hơn không kém, theo yêu cầu người
// dùng) nên đích thắng cuộc = đúng kích thước vốn từ, giống "How Many?"
// (10 số).
var KITCHEN_WIN_TARGET = 10;

// Ảnh nền có tỉ lệ khung hình CỐ ĐỊNH 1536×2752 — khác mọi ảnh nền khác
// trong app (vốn chỉ trang trí, phủ kín màn hình theo background-size:
// cover bất kể tỉ lệ màn thật). Ở đây bé phải bấm ĐÚNG TOẠ ĐỘ trong ảnh
// nên KHÔNG được để ảnh bị crop lệch theo màn hình — .kitchenstage khoá
// đúng tỉ lệ khung hình này (xem kitchen.css), đảm bảo % toạ độ luôn khớp
// đúng vị trí thật trên mọi kích thước màn hình.
import { wordsInCat } from '../../engine/content-loader.js';
import { buildRound, applyAnswer, classifyAnswer, getSkillProgress, wrongRate } from '../../engine/learning-engine.js';
import { saveProgress } from '../../engine/progress-store.js';
import { starIcon, CLOSE_SVG, SPEAK_SVG, worldBg, speakThenProceed } from '../../engine/ui-shared.js';

export function createKitchenGame(ctx) {
  var root = document.getElementById('root');
  var state = ctx.state;

  // Ảnh mèo đầu bếp có thể CHƯA tồn tại (đang chờ người dùng tự tạo bằng
  // AI) — bắt sự kiện "error" của <img> để tự chuyển sang fallback emoji,
  // giống hệt cách games/bill/bill.js đã làm.
  window.addEventListener('error', function (e) {
    var t = e.target;
    if (!t || t.tagName !== 'IMG') return;
    if (t.id === 'kitchenMascotImg' || t.id === 'kitchenTileImg') {
      t.hidden = true;
      var fbId = t.id === 'kitchenMascotImg' ? 'kitchenFallback' : 'kitchenTileFallback';
      var fb = document.getElementById(fbId);
      if (fb) fb.hidden = false;
    }
  }, true);

  // Y hệt pickTargetIndex() của forest.js/farm.js/bill.js/abcvui.js — ưu
  // tiên từ đã đến hạn ôn, trong đó ưu tiên tỉ lệ sai cao hơn.
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
    var candidates = state.kitchenPool.filter(function (w) { return !exclude[w.id]; });
    if (!candidates.length) candidates = state.kitchenPool.filter(function (w) { return w.id !== state.slots[replaceIdx].id; });
    if (!candidates.length) candidates = state.kitchenPool.slice();
    return buildRound(candidates, store.words, 'listen', { size: 1 })[0];
  }

  function startKitchenGame() {
    var store = ctx.getStore();
    state.kitchenPool = wordsInCat(ctx.getWords(), 'object', 'kitchen');
    state.slots = buildRound(state.kitchenPool, store.words, 'listen', { size: 4 });
    state.targetIdx = pickTargetIndex(state.slots);
    state.correct = 0;
    state.answered = false;
    state.kitchenMood = 'idle';
    state.screen = 'kitchen';
    ctx.render();
  }

  function kitchenStarsRow() {
    var row = '';
    for (var i = 0; i < KITCHEN_WIN_TARGET; i++) {
      var lit = i < state.correct;
      var starMarkup = starIcon(lit ? '#FFD25A' : 'rgba(255,255,255,.55)', 16, 'rgba(35,58,42,.35)');
      row += starMarkup.replace('<svg ', '<svg class="' + (lit ? 'lit' : '') + '" ');
    }
    return row;
  }

  // 4 nút bấm, mỗi nút chứa ẢNH CẮT ĐÚNG HÌNH DẠNG của đúng đồ vật đang ở
  // slot đó (assets/kitchen/<id>.png), đặt đè CHÍNH XÁC lên vị trí gốc
  // của nó trong ảnh nền (toạ độ % theo GLOW_ASSETS) — khi chưa bấm, ảnh
  // này trông y hệt phần ảnh nền bên dưới (không lộ vết ghép) nhưng có
  // hiệu ứng phát sáng nhấp nháy ÔM SÁT VIỀN THẬT (CSS filter:drop-shadow
  // trên .kitchenglow-img, không phải khung vuông) để báo "1 trong 4 món
  // này". Đổi màu sáng đúng/sai sau khi bé bấm (.correct/.wrong).
  function hotspotsHtml() {
    return state.slots.map(function (w, i) {
      var g = GLOW_ASSETS[w.id];
      if (!g) return '';
      var style = 'left:' + g.left + '%;top:' + g.top + '%;width:' + g.width + '%;height:' + g.height + '%;';
      return '<button type="button" class="kitchenhotspot" data-idx="' + i + '" style="' + style + '" aria-label="' + w.en + '">' +
        '<img class="kitchenglow-img" src="assets/kitchen/' + w.id + '.png" alt="">' +
        '</button>';
    }).join('');
  }

  var KITCHEN_MOOD_IMG = { idle: 'chefcat-idle.png', happy: 'chefcat-happy.png', sad: 'chefcat-sad.png' };
  var KITCHEN_MOOD_FALLBACK = { idle: '🐱', happy: '😻', sad: '😿' };
  function kitchenMascotHtml(mood) {
    var file = KITCHEN_MOOD_IMG[mood] || KITCHEN_MOOD_IMG.idle;
    var fallback = KITCHEN_MOOD_FALLBACK[mood] || KITCHEN_MOOD_FALLBACK.idle;
    return '<img src="assets/characters/' + file + '" alt="Mèo đầu bếp" id="kitchenMascotImg">' +
      '<span class="kitchenfallback" id="kitchenFallback" hidden>' + fallback + '</span>';
  }

  function setKitchenMood(mood) {
    state.kitchenMood = mood;
    var wrap = document.getElementById('kitchenMascotWrap');
    if (!wrap) return;
    wrap.innerHTML = kitchenMascotHtml(mood);
  }

  // Chỉ bắt đầu tính "thời gian trả lời" của bé từ lúc câu đọc XONG (qua
  // onEnd) — cùng nguyên lý với speakBillTarget()/speakAbcTarget() (Vòng
  // 35 trong ROADMAP.md).
  function speakKitchenTarget() {
    var w = state.slots[state.targetIdx];
    ctx.speak(w.promptAudioText || w.en, function () { state.cardShownAt = Date.now(); });
  }

  // Ảnh nền phải giữ ĐÚNG tỉ lệ khung hình gốc (1536:2752) để % toạ độ
  // của HOTSPOTS/GLOW_ASSETS luôn khớp đúng vị trí thật (xem giải thích ở
  // đầu file) — nhưng vẫn cần to HẾT MỨC CÓ THỂ trong khoảng trống thật
  // sự còn lại (giữa topbar và nút loa), để nhìn "full màn hình" giống
  // các game khác thay vì co nhỏ lại thành 1 khung bé. LỖI THẬT đã gặp ở
  // bản trước: dùng công thức CSS cố định
  // "calc((100vh - 210px) * 0.5581)" để đoán trước chiều cao khả dụng —
  // con số "210px" chỉ đúng tình cờ ở 1 vài kích thước màn hình, sai ở đa
  // số máy thật (thường ra kết quả NHỎ HƠN NHIỀU không gian thật đang có
  // trống), khiến khung ảnh trông "bé tí giữa màn hình". Sửa triệt để
  // bằng JS: đo ĐÚNG kích thước thật còn trống của .kitchenstagewrap
  // (getBoundingClientRect(), không đoán trước bằng số cố định nào), rồi
  // tự tính khung to nhất vừa khít (chiều rộng đầy khung nếu chiều cao
  // theo tỉ lệ đó vẫn vừa, ngược lại lấy đầy chiều cao) — luôn chính xác
  // với MỌI kích thước màn hình thật, không cần đoán trước bất kỳ số nào.
  var KITCHEN_IMG_RATIO = 1536 / 2752;
  function fitKitchenStage() {
    var wrap = document.getElementById('kitchenStageWrap');
    var stage = document.getElementById('kitchenStage');
    if (!wrap || !stage) return;
    var rect = wrap.getBoundingClientRect();
    var w = rect.width;
    var h = w / KITCHEN_IMG_RATIO;
    if (h > rect.height) { h = rect.height; w = h * KITCHEN_IMG_RATIO; }
    stage.style.width = Math.round(w) + 'px';
    stage.style.height = Math.round(h) + 'px';
  }
  // Đo lại mỗi khi đổi kích thước/xoay màn hình — chỉ áp dụng khi đang ở
  // đúng màn chơi này (tránh chạy thừa/lỗi khi DOM của màn khác đang hiện).
  window.addEventListener('resize', function () {
    if (state.screen === 'kitchen') fitKitchenStage();
  });

  function renderKitchen() {
    state.cardShownAt = Date.now();

    root.innerHTML = worldBg('kitchenphoto') +
      '<div class="content kitchencontent">' +
      '<div class="topbar">' +
      '<button class="iconbtn" id="homeBtn" aria-label="Về trang chủ">' + CLOSE_SVG + '</button>' +
      '<div class="starsrow" id="kitchenStars" style="margin:0;">' + kitchenStarsRow() + '</div>' +
      '<span style="width:38px;"></span>' +
      '</div>' +
      '<div class="kitchenstagewrap" id="kitchenStageWrap">' +
      '<div class="kitchenstage" id="kitchenStage">' +
      '<img src="assets/backgrounds/kitchen-bg.jpg" alt="" class="kitchenimg">' +
      hotspotsHtml() +
      '<div class="kitchenmascotwrap" id="kitchenMascotWrap">' + kitchenMascotHtml(state.kitchenMood || 'idle') + '</div>' +
      '</div>' +
      '</div>' +
      '<button class="soundbtn" id="speakBtn" aria-label="Nghe lại">' + SPEAK_SVG + '</button>' +
      '</div>';

    document.getElementById('homeBtn').addEventListener('click', function () {
      state.screen = 'home'; ctx.render();
    });
    document.getElementById('speakBtn').addEventListener('click', speakKitchenTarget);
    speakKitchenTarget();
    fitKitchenStage();

    var stage = document.getElementById('kitchenStage');
    Array.prototype.forEach.call(stage.querySelectorAll('.kitchenhotspot'), function (btn) {
      btn.addEventListener('click', function () {
        handleKitchenAnswer(parseInt(btn.getAttribute('data-idx'), 10));
      });
    });
  }

  // Chuông "ting" khi bấm đúng — y hệt các game kia (mỗi game tự giữ 1
  // bản sao riêng theo đúng quy ước đã có).
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

  // Tiếng "buzz" trầm khi bấm sai — bổ sung phản hồi âm thanh cho cả 2
  // chiều đúng/sai (trước đây chỉ có tiếng "ting" lúc đúng, bấm sai hoàn
  // toàn im lặng — theo phản hồi người dùng, chỉ đổi màu xanh/đỏ khó nhận
  // ra, cần thêm âm thanh cho rõ ràng hơn).
  function playBuzz() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
      if (!sharedAudioCtx) sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var ctxAudio = sharedAudioCtx;
      var now = ctxAudio.currentTime;
      var osc = ctxAudio.createOscillator();
      var gain = ctxAudio.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.35);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(gain).connect(ctxAudio.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) { /* Web Audio không khả dụng — bỏ qua, không phá UI */ }
  }

  // Dấu ✓/✗ to, nổi bật giữa đúng vị trí đồ vật vừa bấm — bổ sung thêm 1
  // tín hiệu RÕ RÀNG không phụ thuộc màu sắc (trước đây chỉ đổi màu viền
  // xanh/đỏ, khó nhận ra theo phản hồi người dùng).
  function showBadge(idx, isCorrect) {
    var hotspotEls = document.querySelectorAll('.kitchenhotspot');
    var el = hotspotEls[idx];
    if (!el) return;
    var badge = document.createElement('div');
    badge.className = 'kitchenbadge ' + (isCorrect ? 'good' : 'bad');
    badge.textContent = isCorrect ? '✓' : '✗';
    el.appendChild(badge);
  }

  function handleKitchenAnswer(idx) {
    if (state.answered) return;
    state.answered = true;

    var store = ctx.getStore();
    var hotspotEls = document.querySelectorAll('.kitchenhotspot');
    var targetWord = state.slots[state.targetIdx];
    var isCorrect = idx === state.targetIdx;
    var responseTimeMs = Date.now() - state.cardShownAt;

    if (isCorrect) {
      var outcome = classifyAnswer(true, responseTimeMs);
      applyAnswer(store.words, targetWord.id, 'listen', outcome);
      saveProgress(store);
      state.correct++;
      hotspotEls[idx].classList.add('correct');
      showBadge(idx, true);
      playDing();
      setKitchenMood('happy');

      var isDone = state.correct >= KITCHEN_WIN_TARGET;
      speakThenProceed(ctx.speak, targetWord.promptAudioText || targetWord.en, isDone ? 700 : 1300, function () {
        if (isDone) { state.screen = 'kitchenSummary'; ctx.render(); }
        else advanceKitchenRound(state.targetIdx);
      });
    } else {
      applyAnswer(store.words, targetWord.id, 'listen', 'wrong');
      saveProgress(store);
      hotspotEls[idx].classList.add('wrong');
      hotspotEls[state.targetIdx].classList.add('correct');
      showBadge(idx, false);
      showBadge(state.targetIdx, true);
      playBuzz();
      setKitchenMood('sad');
      speakThenProceed(ctx.speak, targetWord.promptAudioText || targetWord.en, 3200, function () { advanceKitchenRound(state.targetIdx); });
    }
  }

  function advanceKitchenRound(replaceIdx) {
    state.slots[replaceIdx] = pickReplacementWord(replaceIdx);
    state.targetIdx = pickTargetIndex(state.slots);
    state.answered = false;

    var stage = document.getElementById('kitchenStage');
    var mascotWrap = stage.querySelector('.kitchenmascotwrap');
    Array.prototype.forEach.call(stage.querySelectorAll('.kitchenhotspot'), function (el) { el.remove(); });
    stage.insertAdjacentHTML('beforeend', hotspotsHtml());
    // insertAdjacentHTML thêm hotspot mới vào SAU mascot trong DOM — chuyển
    // lại mascot ra sau cùng để luôn nổi trên hotspot (tránh hotspot che
    // mất 1 phần mèo nếu 2 vùng chồng nhau).
    if (mascotWrap) stage.appendChild(mascotWrap);
    Array.prototype.forEach.call(stage.querySelectorAll('.kitchenhotspot'), function (btn) {
      btn.addEventListener('click', function () {
        handleKitchenAnswer(parseInt(btn.getAttribute('data-idx'), 10));
      });
    });

    document.getElementById('kitchenStars').innerHTML = kitchenStarsRow();
    setKitchenMood('idle');
    state.cardShownAt = Date.now();
    speakKitchenTarget();
  }

  function renderKitchenSummary() {
    root.innerHTML = worldBg() +
      '<div class="content">' +
      '<div class="summary-mid" id="summaryMid">' +
      '<div class="starburst">' + starIcon('#FFD25A', 28) + starIcon('#F4A93B', 36) + starIcon('#FFD25A', 28) + '</div>' +
      ctx.owlMascot(64) +
      '<h2>Giỏi quá!</h2>' +
      '<p>Bé nhớ đồ vật nhà bếp giỏi lắm!</p>' +
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

    document.getElementById('againBtn').addEventListener('click', startKitchenGame);
    document.getElementById('homeBtn2').addEventListener('click', function () {
      state.screen = 'home'; ctx.render();
    });
  }

  // Markup ô icon của game này trong lưới chọn trò chơi ở Trang chủ —
  // dùng ảnh mèo đầu bếp (trạng thái chờ đợi), có fallback emoji nếu ảnh
  // chưa tồn tại.
  function gameTileHtml(title) {
    return '<button type="button" class="gametile kitchen-tile" data-id="kitchen">' +
      '<span class="kitchentile-face" id="kitchenTileFace">' +
      '<img src="assets/characters/chefcat-idle.png" alt="" id="kitchenTileImg">' +
      '<span class="kitchentile-fallback" id="kitchenTileFallback" hidden>🐱</span>' +
      '</span>' +
      '<span class="name">' + title + '</span></button>';
  }

  return {
    startKitchenGame: startKitchenGame,
    renderKitchen: renderKitchen,
    renderKitchenSummary: renderKitchenSummary,
    gameTileHtml: gameTileHtml
  };
}
