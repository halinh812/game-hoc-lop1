// Game "Butterfly Garden" — luyện kỹ năng "Nghe" (skill=listen, dùng chung
// skill với forest/farm/bill/abcvui/kitchen), trên vốn từ MÀU SẮC (6 màu:
// red/blue/yellow/green/black/white, xem content/packs/colors-v1.json).
//
// CƠ CHẾ: khác mọi game trước — không chọn 4 trong N từ (N > 4) như
// forest/farm/bill/kitchen, mà hiện ĐỦ CẢ 6 màu cùng lúc (vốn từ nhỏ, để
// hết ra cho bé "tìm đúng con bướm màu đó giữa nhiều con khác" mới đúng
// tinh thần "vườn bướm" người dùng chọn) — mỗi màu là 1 con bướm đứng yên
// ở 1 vị trí cố định (KHÔNG bay/di chuyển: dự định ban đầu là bướm bay tự
// do, nhưng cơ chế "bắt vật di chuyển" đã bị bỏ khỏi app từ lâu vì lý do
// ổn định/độ chính xác chạm trên điện thoại — xem lịch sử forest.js/
// farm.js đã đổi hẳn sang mô hình tĩnh — nên chọn lại phương án tĩnh để
// không lặp lại rủi ro đó). Nghe âm thanh đọc tên 1 màu, bé bấm đúng con
// bướm màu đó.
//
// 6 con bướm vẽ bằng SVG nội tuyến (KHÔNG phải ảnh PNG như objects ở
// game khác) — màu tô CHÍNH XÁC theo đúng mã màu của từng từ (đỏ phải
// THẬT SỰ là màu đỏ), không phụ thuộc ảnh AI tạo ra (màu ảnh AI khó chắc
// chắn đúng tuyệt đối như code). Nhờ vậy game chạy được ĐẦY ĐỦ ngay hôm
// nay, không cần chờ người dùng tạo ảnh — khác hẳn kitchen.js (bắt buộc
// phải có ảnh thật mới đo được toạ độ). Vị trí 6 con bướm trên màn cũng
// không cần khớp ảnh nền cụ thể nào (không như GLOW_ASSETS của kitchen.js
// phải đo trên đúng ảnh bếp thật) — chỉ cần dàn đều, tránh đè lên linh vật
// dẫn đường ở giữa, nên có thể chốt trước bằng số liệu cố định.
//
// Nền dùng NỀN CHUNG (worldBg() không tham số — cùng khung cảnh cỏ cây/
// trời xanh ở Trang chủ) thay vì ảnh nền vườn hoa riêng — vườn hoa riêng
// là hạng mục NÂNG CẤP THÊM sau này (không bắt buộc để chơi được).
//
// KHÔNG có linh vật dẫn đường đứng giữa màn chơi (khác forest/farm/bill/
// kitchen) — bản đầu có thử 1 con bướm mascot đứng giữa (dùng emoji 🦋
// tạm vì chưa có ảnh 3 trạng thái), nhưng người dùng phản hồi: giữa màn
// có 1 con bướm không bấm được (không phải đáp án, chỉ là linh vật) gây
// hiểu nhầm dễ tưởng là 1 lựa chọn thứ 7 — không cần thiết, đã bỏ hẳn.
// Phản hồi đúng/sai vẫn đủ rõ ràng qua badge ✓/✗ + tiếng ting/buzz (không
// phụ thuộc vào mascot đổi tâm trạng để báo hiệu).
import { wordsInCat } from '../../engine/content-loader.js';
import { buildRound, applyAnswer, classifyAnswer, getSkillProgress, wrongRate, shuffle } from '../../engine/learning-engine.js';
import { saveProgress } from '../../engine/progress-store.js';
import { starIcon, CLOSE_SVG, SPEAK_SVG, worldBg } from '../../engine/ui-shared.js';

var BUTTERFLY_WIN_TARGET = 10;

// Mã màu THẬT của từng từ trong colors-v1.json — id trong content pack là
// khoá duy nhất đáng tin cậy (không dùng answer.emoji để suy ra màu, vì
// mục đích là tô đúng màu chuẩn, không phải màu xấp xỉ theo hình emoji).
var BUTTERFLY_HEX = {
  red: '#E5383B',
  blue: '#1E88E5',
  yellow: '#FDD835',
  green: '#43A047',
  black: '#2E2A26',
  white: '#FFFFFF'
};

// Toạ độ % cố định của 6 "chỗ đậu" — lưới 3 cột × 2 hàng đều đặn, chiếm
// trọn khu chơi (trước đây dàn thành vòng né khu giữa dành cho linh vật
// dẫn đường — nay đã bỏ mascot đó nên đổi sang lưới đều cho đẹp và tận
// dụng hết không gian). Không chồng lên nhau, không phụ thuộc ảnh nền cụ
// thể nào (xem giải thích ở đầu file).
var BUTTERFLY_SPOTS = [
  { left: 4, top: 10 }, { left: 37, top: 10 }, { left: 70, top: 10 },
  { left: 4, top: 50 }, { left: 37, top: 50 }, { left: 70, top: 50 }
];

export function createButterflyGardenGame(ctx) {
  var root = document.getElementById('root');
  var state = ctx.state;

  // 6 ảnh con bướm màu + ảnh linh vật nhỏ ở ô Trang chủ có thể CHƯA tồn
  // tại (đang chờ người dùng tự tạo bằng AI theo Bước 21/22 trong
  // PROMPT.md) — bắt sự kiện "error" của <img> để tự chuyển sang fallback
  // (SVG vẽ tay cho con bướm — xem butterflySvg(), emoji cho ô Trang chủ),
  // y hệt bill.js/kitchen.js. 6 ảnh con bướm dùng chung 1 class (không
  // phải id riêng) vì có 6 cái cùng lúc trên màn — tìm fallback bằng
  // nextElementSibling thay vì getElementById theo id cố định.
  window.addEventListener('error', function (e) {
    var t = e.target;
    if (!t || t.tagName !== 'IMG') return;
    if (t.classList.contains('butterflyimg')) {
      t.hidden = true;
      var svgFallback = t.nextElementSibling;
      if (svgFallback && svgFallback.classList.contains('butterflysvgfallback')) svgFallback.hidden = false;
      return;
    }
    if (t.id === 'butterflyTileImg') {
      t.hidden = true;
      var fb = document.getElementById('butterflyTileFallback');
      if (fb) fb.hidden = false;
    }
  }, true);

  // Y hệt pickTargetIndex() của forest.js/farm.js/bill.js/abcvui.js/
  // kitchen.js — ưu tiên từ đã đến hạn ôn, trong đó ưu tiên tỉ lệ sai cao
  // hơn, LV thấp hơn, có yếu tố ngẫu nhiên khi ngang điểm.
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

  // Khác forest/bill/kitchen: vốn từ CHỈ có đúng 6 màu, hiện ĐỦ CẢ 6 mỗi
  // vòng (không phải 4 trong N từ lớn hơn) nên KHÔNG cần
  // pickReplacementWord()/advance thay slot — hết vòng chỉ cần chọn lại
  // targetIdx trong đúng 6 từ đang có sẵn.
  function startButterflyGardenGame() {
    var store = ctx.getStore();
    var pool = wordsInCat(ctx.getWords(), 'color');
    state.slots = shuffle(pool.slice());
    state.targetIdx = pickTargetIndex(state.slots);
    state.correct = 0;
    state.answered = false;
    state.screen = 'butterflygarden';
    ctx.render();
  }

  function butterflyStarsRow() {
    var row = '';
    for (var i = 0; i < BUTTERFLY_WIN_TARGET; i++) {
      var lit = i < state.correct;
      var starMarkup = starIcon(lit ? '#FFD25A' : 'rgba(255,255,255,.55)', 16, 'rgba(35,58,42,.35)');
      row += starMarkup.replace('<svg ', '<svg class="' + (lit ? 'lit' : '') + '" ');
    }
    return row;
  }

  // 1 con bướm = 1 SVG nội tuyến tô đúng mã màu của từ đó (BUTTERFLY_HEX)
  // — 4 cánh (2 cánh trên to, 2 cánh dưới nhỏ) + thân + 2 râu, viền đậm
  // quanh cánh để con bướm màu trắng vẫn nhìn rõ trên nền sáng. Đây là
  // ảnh FALLBACK — mặc định hotspotsHtml() vẫn ưu tiên hiện ảnh AI thật
  // (assets/butterflies/<id>.png, xem Bước 22 trong PROMPT.md) nếu đã có,
  // svg này chỉ hiện khi ảnh đó chưa tồn tại (lỗi tải, bắt ở window
  // 'error' phía trên).
  function butterflySvg(hex) {
    return '<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">' +
      '<g stroke="#33261C" stroke-width="3" stroke-linejoin="round">' +
      '<path d="M50 42 C40 14 6 10 6 34 C6 54 30 58 50 50 Z" fill="' + hex + '"/>' +
      '<path d="M50 42 C60 14 94 10 94 34 C94 54 70 58 50 50 Z" fill="' + hex + '"/>' +
      '<path d="M50 50 C42 60 18 64 14 78 C12 90 34 92 50 68 Z" fill="' + hex + '"/>' +
      '<path d="M50 50 C58 60 82 64 86 78 C88 90 66 92 50 68 Z" fill="' + hex + '"/>' +
      '</g>' +
      '<ellipse cx="50" cy="54" rx="4.5" ry="24" fill="#33261C"/>' +
      '<path d="M50 34 L42 16" stroke="#33261C" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M50 34 L58 16" stroke="#33261C" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<circle cx="42" cy="16" r="3" fill="#33261C"/><circle cx="58" cy="16" r="3" fill="#33261C"/>' +
      '</svg>';
  }

  function hotspotsHtml() {
    return state.slots.map(function (w, i) {
      var spot = BUTTERFLY_SPOTS[i] || BUTTERFLY_SPOTS[0];
      var hex = BUTTERFLY_HEX[w.id] || '#8A8A8A';
      var style = 'left:' + spot.left + '%;top:' + spot.top + '%;';
      return '<button type="button" class="butterflyhotspot" data-idx="' + i + '" style="' + style + '" aria-label="' + w.en + '">' +
        '<span class="butterflyvisual">' +
        '<img class="butterflyimg" src="assets/butterflies/' + w.id + '.png" alt="">' +
        '<span class="butterflysvgfallback" hidden>' + butterflySvg(hex) + '</span>' +
        '</span>' +
        '</button>';
    }).join('');
  }

  // Chỉ bắt đầu tính "thời gian trả lời" của bé từ lúc câu đọc XONG (qua
  // onEnd) — cùng nguyên lý với speakBillTarget()/speakKitchenTarget().
  function speakButterflyTarget() {
    var w = state.slots[state.targetIdx];
    ctx.speak(w.promptAudioText || w.en, function () { state.cardShownAt = Date.now(); });
  }

  function renderButterflyGarden() {
    state.cardShownAt = Date.now();

    root.innerHTML = worldBg() +
      '<div class="content">' +
      '<div class="topbar">' +
      '<button class="iconbtn" id="homeBtn" aria-label="Về trang chủ">' + CLOSE_SVG + '</button>' +
      '<div class="starsrow" id="butterflyStars" style="margin:0;">' + butterflyStarsRow() + '</div>' +
      '<span style="width:38px;"></span>' +
      '</div>' +
      '<div class="butterflystage" id="butterflyStage">' +
      '<div class="butterflyfield" id="butterflyField">' + hotspotsHtml() + '</div>' +
      '</div>' +
      '<button class="soundbtn" id="speakBtn" aria-label="Nghe lại">' + SPEAK_SVG + '</button>' +
      '</div>';

    document.getElementById('homeBtn').addEventListener('click', function () {
      state.screen = 'home'; ctx.render();
    });
    document.getElementById('speakBtn').addEventListener('click', speakButterflyTarget);
    speakButterflyTarget();

    var field = document.getElementById('butterflyField');
    Array.prototype.forEach.call(field.querySelectorAll('.butterflyhotspot'), function (btn) {
      btn.addEventListener('click', function () {
        handleButterflyAnswer(parseInt(btn.getAttribute('data-idx'), 10));
      });
    });
  }

  // Chuông "ting" khi bấm đúng — y hệt forest.js/bill.js/kitchen.js (mỗi
  // game tự giữ 1 bản sao riêng theo đúng quy ước đã có).
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

  // Tiếng "buzz" trầm khi bấm sai — y hệt kitchen.js.
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

  // Dấu ✓/✗ to, nổi bật giữa đúng con bướm vừa bấm — y hệt kitchen.js.
  function showBadge(idx, isCorrect) {
    var hotspotEls = document.querySelectorAll('#butterflyField .butterflyhotspot');
    var el = hotspotEls[idx];
    if (!el) return;
    var badge = document.createElement('div');
    badge.className = 'butterflybadge ' + (isCorrect ? 'good' : 'bad');
    badge.textContent = isCorrect ? '✓' : '✗';
    el.appendChild(badge);
  }

  function handleButterflyAnswer(idx) {
    if (state.answered) return;
    state.answered = true;

    var store = ctx.getStore();
    var hotspotEls = document.querySelectorAll('#butterflyField .butterflyhotspot');
    var targetWord = state.slots[state.targetIdx];
    var isCorrect = idx === state.targetIdx;
    var responseTimeMs = Date.now() - state.cardShownAt;

    if (isCorrect) {
      var outcome = classifyAnswer(true, responseTimeMs);
      applyAnswer(store.words, targetWord.id, 'listen', outcome);
      saveProgress(store);
      state.correct++;
      ctx.speak(targetWord.promptAudioText || targetWord.en);
      hotspotEls[idx].classList.add('correct');
      showBadge(idx, true);
      playDing();

      var isDone = state.correct >= BUTTERFLY_WIN_TARGET;
      setTimeout(function () {
        if (isDone) { state.screen = 'butterflygardenSummary'; ctx.render(); }
        else advanceButterflyRound();
      }, isDone ? 700 : 1200);
    } else {
      applyAnswer(store.words, targetWord.id, 'listen', 'wrong');
      saveProgress(store);
      hotspotEls[idx].classList.add('wrong');
      hotspotEls[state.targetIdx].classList.add('correct');
      showBadge(idx, false);
      showBadge(state.targetIdx, true);
      playBuzz();
      ctx.speak(targetWord.promptAudioText || targetWord.en);
      setTimeout(function () { advanceButterflyRound(); }, 3000);
    }
  }

  // Khác kitchen.js/bill.js: KHÔNG thay slot nào cả (đủ cả 6 màu hiện sẵn
  // suốt cả lượt chơi) — chỉ cần xoá lớp đúng/sai + dấu ✓/✗ cũ, chọn lại
  // targetIdx trong đúng 6 từ đang có, đọc lại câu mới.
  function advanceButterflyRound() {
    state.targetIdx = pickTargetIndex(state.slots);
    state.answered = false;

    var hotspotEls = document.querySelectorAll('#butterflyField .butterflyhotspot');
    Array.prototype.forEach.call(hotspotEls, function (el) {
      el.classList.remove('correct', 'wrong');
      var badge = el.querySelector('.butterflybadge');
      if (badge) badge.remove();
    });

    document.getElementById('butterflyStars').innerHTML = butterflyStarsRow();
    state.cardShownAt = Date.now();
    speakButterflyTarget();
  }

  function renderButterflyGardenSummary() {
    root.innerHTML = worldBg() +
      '<div class="content">' +
      '<div class="summary-mid" id="summaryMid">' +
      '<div class="starburst">' + starIcon('#FFD25A', 28) + starIcon('#F4A93B', 36) + starIcon('#FFD25A', 28) + '</div>' +
      ctx.owlMascot(64) +
      '<h2>Giỏi quá!</h2>' +
      '<p>Bé nhớ hết màu sắc rồi!</p>' +
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

    document.getElementById('againBtn').addEventListener('click', startButterflyGardenGame);
    document.getElementById('homeBtn2').addEventListener('click', function () {
      state.screen = 'home'; ctx.render();
    });
  }

  // Markup ô icon của game này trong lưới chọn trò chơi ở Trang chủ — nền
  // gradient pastel tạm (chưa có ảnh vườn hoa riêng) + mặt linh vật (lắc
  // lư nhẹ), có fallback emoji nếu ảnh chưa tồn tại.
  function gameTileHtml(title) {
    return '<button type="button" class="gametile butterfly-tile" data-id="butterflygarden">' +
      '<span class="butterflytile-face" id="butterflyTileFace">' +
      '<img src="assets/characters/butterfly-idle.png" alt="" id="butterflyTileImg">' +
      '<span class="butterflytile-fallback" id="butterflyTileFallback" hidden>🦋</span>' +
      '</span>' +
      '<span class="name">' + title + '</span></button>';
  }

  return {
    startButterflyGardenGame: startButterflyGardenGame,
    renderButterflyGarden: renderButterflyGarden,
    renderButterflyGardenSummary: renderButterflyGardenSummary,
    gameTileHtml: gameTileHtml
  };
}
