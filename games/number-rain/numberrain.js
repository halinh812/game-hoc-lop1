// Game "Number Rain" (Mưa số) — luyện kỹ năng "Nghe" (skill=listen) cho bộ
// SỐ ĐẾM one..ten (content/packs/numbers-v1.json).
//
// VÌ SAO: số liệu học của bé (11/2026) cho thấy bộ số đếm mới chỉ được
// luyện "Nhìn" (game How Many?), chưa từng luyện "Nghe": nghe "eight" mà
// nhận ra đúng chữ số 8. Game này lấp đúng chỗ đó.
//
// CÁCH CHƠI (theo đúng ý người dùng: "Các số rơi từ trên trời rơi xuống
// dần như mưa. Bé bắt đúng số đang rơi", thẻ chỉ hiện CHỮ SỐ):
//   - Máy đọc 1 số tiếng Anh ("seven"). Các giọt mưa mang chữ số (7, 3,
//     9...) rơi chầm chậm từ trên trời xuống, bé chạm đúng giọt "7".
//   - Không hiện chữ "seven" ở đâu cả — bé phải NGHE (nếu hiện chữ thì
//     thành trò so hình). Nút loa ở dưới để nghe lại bao nhiêu lần cũng được.
//   - Giọt nào rơi chạm đất thì lại xuất hiện ở trên trời; số cần bắt LUÔN
//     có trên màn hình, không bao giờ bị lỡ mất.
//   - 10 lượt mỗi lần chơi.
//
// SAO = SAO HỌC TẬP THẬT (giống Match It!): chạm đúng ngay lần đầu -> LV
// Nghe của số đó lên (+sao); chạm sai -> LV xuống (-sao), mỗi lượt chỉ trừ
// 1 lần. Đúng sau khi đã sai thì sang lượt mới, không cộng.
//
// SỐ TĂNG DẦN 1-10 (người dùng chọn): ban đầu chỉ mưa số 1-5. Khi mọi số
// đang mở đều đạt LV Nghe >= 2 thì mở thêm 1 số (6, rồi 7...) tới 10.
//
// Không tự lấy state/store/WORDS từ app.js (tránh import vòng) — xem giải
// thích chi tiết hơn ở đầu games/khu-rung-ky-bi/forest.js.
import { wordsInCat } from '../../engine/content-loader.js';
import { applyAnswer, classifyAnswer, getSkillProgress, buildRound, shuffle, totalStars } from '../../engine/learning-engine.js';
import { saveProgress } from '../../engine/progress-store.js';
import { starIcon, CLOSE_SVG, SPEAK_SVG, worldBg, speakThenProceed } from '../../engine/ui-shared.js';

export var NUMBER_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
export var RAIN_TURNS = 10;
export var RAIN_START_MAX = 5;
export var RAIN_UNLOCK_LEVEL = 2;
var LANES = 4;          // số giọt mưa cùng lúc trên màn hình (mỗi giọt 1 làn)
var FALL_SECONDS = 7.5; // thời gian 1 giọt rơi từ trên xuống tới đất

// Số lớn nhất đang được mưa — hàm THUẦN, export để unit test.
export function numberRainMax(wordsMap) {
  var max = RAIN_START_MAX;
  while (max < NUMBER_WORDS.length) {
    var allGood = NUMBER_WORDS.slice(0, max).every(function (id) {
      var p = getSkillProgress(wordsMap, id, 'listen');
      return p && p.level >= RAIN_UNLOCK_LEVEL;
    });
    if (!allGood) break;
    max++;
  }
  return max;
}

// Chọn 10 số cần bắt cho 1 lần chơi — hàm THUẦN, export để unit test. Ưu
// tiên số tới hạn ôn/chưa học (buildRound), lặp vòng cho đủ 10 lượt,
// không bao giờ 2 lượt liền nhau cùng 1 số.
export function pickRainTargets(numberPool, wordsMap, opts) {
  opts = opts || {};
  var turns = opts.turns || RAIN_TURNS;
  var rng = opts.rng || Math.random;
  var order = buildRound(numberPool, wordsMap, 'listen', { size: numberPool.length, rng: rng });
  var out = [];
  var guard = 0;
  while (out.length < turns && guard++ < 200) {
    var batch = out.length ? shuffle(order, rng) : order;
    batch.forEach(function (w) {
      if (out.length >= turns) return;
      if (out.length && out[out.length - 1].id === w.id) return;
      out.push(w);
    });
  }
  return out;
}

export function createNumberRainGame(ctx) {
  var root = document.getElementById('root');
  var state = ctx.state;
  var rafId = 0;

  function numberPool(wordsMap) {
    var max = numberRainMax(wordsMap);
    var all = wordsInCat(ctx.getWords(), 'number');
    return NUMBER_WORDS.slice(0, max).map(function (id) {
      return all.find(function (w) { return w.id === id; });
    }).filter(Boolean);
  }

  function startNumberRainGame() {
    var store = ctx.getStore();
    var pool = numberPool(store.words);
    state.rainPool = pool;
    state.rainTargets = pickRainTargets(pool, store.words);
    state.rainTurn = 0;
    state.rainStarsAtStart = totalStars(store.words);
    state.screen = 'numberrain';
    ctx.render();
  }

  function valueOf(w) { return NUMBER_WORDS.indexOf(w.id) + 1; }
  function target() { return state.rainTargets[state.rainTurn]; }

  function progressDots() {
    var out = '';
    for (var i = 0; i < state.rainTargets.length; i++) {
      out += starIcon(i < state.rainTurn ? '#FFD25A' : '#FFFFFF', 16, i < state.rainTurn ? '#E4952A' : 'none')
        .replace('<svg ', '<svg class="' + (i < state.rainTurn ? 'lit' : '') + '" ');
    }
    return out;
  }

  function renderNumberRain() {
    var store = ctx.getStore();
    root.innerHTML = '<div class="rainsky" aria-hidden="true">' +
      '<div class="raincloud k1"></div><div class="raincloud k2"></div><div class="raincloud k3"></div></div>' +
      '<div class="content raincontent">' +
      '<div class="topbar">' +
      '<button class="iconbtn" id="homeBtn" aria-label="Về trang chủ">' + CLOSE_SVG + '</button>' +
      '<div class="starsrow" id="rainProgress" style="margin:0;">' + progressDots() + '</div>' +
      '<div class="matchstars" id="rainStars">' + starIcon('#FFD25A', 20, '#E4952A') +
      '<span id="rainStarsNum">' + totalStars(store.words) + '</span></div>' +
      '</div>' +
      '<div class="rainfield" id="rainField"></div>' +
      '<div class="raingrass" aria-hidden="true"></div>' +
      '<button class="soundbtn rainsound" id="rainSpeakBtn" aria-label="Nghe lại">' + SPEAK_SVG + '</button>' +
      '</div>';

    document.getElementById('homeBtn').addEventListener('click', function () {
      stopRain();
      state.screen = 'home';
      ctx.render();
    });
    document.getElementById('rainSpeakBtn').addEventListener('click', function () {
      if (state.rainBusy) return;
      ctx.speak(target().en);
    });
    // pointerdown thay vì click: giọt mưa đang rơi, bấm phản hồi ngay lúc
    // ngón tay chạm xuống mới chắc trúng.
    document.getElementById('rainField').addEventListener('pointerdown', function (e) {
      var drop = e.target.closest('.raindrop');
      if (drop) { e.preventDefault(); handleTap(drop); }
    });
    startTurn();
  }

  // ---------- mưa rơi ----------
  // Mỗi giọt: { el, lane, value, y (px từ đỉnh), speed (px/giây) }.
  var drops = [];
  var lastTs = 0;

  function fieldSize() {
    var f = document.getElementById('rainField');
    return f ? { w: f.clientWidth, h: f.clientHeight } : { w: 0, h: 0 };
  }

  function pickValueForLane(excludeValues) {
    var t = valueOf(target());
    // Số cần bắt luôn phải có trên màn hình.
    var hasTarget = drops.some(function (d) { return d.value === t && !d.gone; });
    if (!hasTarget) return t;
    var choices = state.rainPool.map(valueOf).filter(function (v) {
      return v !== t && excludeValues.indexOf(v) === -1;
    });
    if (!choices.length) choices = state.rainPool.map(valueOf).filter(function (v) { return v !== t; });
    return choices[Math.floor(Math.random() * choices.length)];
  }

  function spawn(lane, startY, forcedValue) {
    var field = document.getElementById('rainField');
    if (!field) return;
    var size = fieldSize();
    var onScreen = drops.filter(function (d) { return !d.gone; }).map(function (d) { return d.value; });
    var value = forcedValue || pickValueForLane(onScreen);
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'raindrop c' + (value % 5);
    el.setAttribute('aria-label', String(value));
    el.innerHTML = '<span class="dropbody"><span class="dropnum">' + value + '</span></span>';
    var laneW = size.w / LANES;
    el.style.left = (lane * laneW + laneW / 2) + 'px';
    field.appendChild(el);
    var d = { el: el, lane: lane, value: value, y: startY, speed: size.h / FALL_SECONDS * (0.85 + Math.random() * 0.3), gone: false };
    el.style.transform = 'translate(-50%,' + d.y + 'px)';
    drops.push(d);
  }

  function startRain() {
    stopRain();
    var field = document.getElementById('rainField');
    if (!field) return;
    field.innerHTML = '';
    drops = [];
    var h = fieldSize().h;
    // Các làn bắt đầu so le độ cao, để giọt không rơi thành 1 hàng ngang.
    // Số cần bắt + 3 số khác được XÁO vào các làn/độ cao ngẫu nhiên — nếu
    // không, số cần bắt luôn rơi ở 1 vị trí cố định và bé đoán theo chỗ.
    var t = valueOf(target());
    var others = shuffle(state.rainPool.map(valueOf).filter(function (v) { return v !== t; })).slice(0, LANES - 1);
    var values = shuffle([t].concat(others));
    var lanes = shuffle([0, 1, 2, 3]);
    lanes.forEach(function (lane, i) { spawn(lane, -90 + i * h * 0.22, values[i]); });
    lastTs = 0;
    rafId = requestAnimationFrame(tick);
  }

  function stopRain() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function tick(ts) {
    if (state.screen !== 'numberrain') { stopRain(); return; }
    var dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0;
    lastTs = ts;
    var h = fieldSize().h;
    drops.slice().forEach(function (d) {
      if (d.gone) return;
      d.y += d.speed * dt;
      d.el.style.transform = 'translate(-50%,' + d.y + 'px)';
      if (d.y > h) {
        // Chạm đất: giọt biến mất, 1 giọt mới hiện trên trời cùng làn.
        d.gone = true;
        d.el.remove();
        drops.splice(drops.indexOf(d), 1);
        spawn(d.lane, -90);
      }
    });
    rafId = requestAnimationFrame(tick);
  }

  // ---------- lượt chơi ----------
  function startTurn() {
    state.rainBusy = true;
    state.rainMissed = false;
    var field = document.getElementById('rainField');
    if (field) field.innerHTML = '';
    drops = [];
    stopRain();
    // Đọc số trước, đọc xong mới bắt đầu mưa và bắt đầu tính giờ.
    ctx.speak(target().en, function () {
      if (state.screen !== 'numberrain') return;
      state.rainBusy = false;
      state.rainShownAt = Date.now();
      startRain();
    });
  }

  function showStarDelta(before) {
    var store = ctx.getStore();
    var after = totalStars(store.words);
    var numEl = document.getElementById('rainStarsNum');
    if (numEl) numEl.textContent = after;
    var delta = after - before;
    if (!delta) return;
    var box = document.getElementById('rainStars');
    if (!box) return;
    var pop = document.createElement('span');
    pop.className = 'matchdelta ' + (delta > 0 ? 'up' : 'down');
    pop.textContent = (delta > 0 ? '+' : '−') + Math.abs(delta);
    box.appendChild(pop);
    setTimeout(function () { pop.remove(); }, 1300);
  }

  function handleTap(el) {
    if (state.rainBusy) return;
    var d = drops.find(function (x) { return x.el === el; });
    if (!d || d.gone) return;
    var store = ctx.getStore();
    var t = target();
    var before = totalStars(store.words);

    if (d.value === valueOf(t)) {
      state.rainBusy = true;
      if (!state.rainMissed) {
        applyAnswer(store.words, t.id, 'listen', classifyAnswer(true, Date.now() - state.rainShownAt));
        saveProgress(store);
      }
      showStarDelta(before);
      stopRain();
      d.el.classList.add('caught');
      drops.forEach(function (x) { if (x !== d) x.el.classList.add('fade'); });
      playDing();
      speakThenProceed(ctx.speak, t.en, 1100, function () {
        if (state.screen !== 'numberrain') return;
        state.rainTurn++;
        var prog = document.getElementById('rainProgress');
        if (prog) prog.innerHTML = progressDots();
        if (state.rainTurn >= state.rainTargets.length) {
          state.screen = 'numberrainSummary';
          ctx.render();
        } else {
          startTurn();
        }
      });
      return;
    }

    // Sai: giọt đó lắc đỏ rồi tan, đọc lại số cần bắt cho bé nghe lại.
    if (!state.rainMissed) {
      state.rainMissed = true;
      applyAnswer(store.words, t.id, 'listen', 'wrong');
      saveProgress(store);
    }
    showStarDelta(before);
    playBuzz();
    d.gone = true;
    d.el.classList.add('wrong');
    var lane = d.lane;
    setTimeout(function () {
      if (state.screen !== 'numberrain') return;
      d.el.remove();
      var i = drops.indexOf(d);
      if (i !== -1) drops.splice(i, 1);
      if (rafId) spawn(lane, -90);
    }, 500);
    setTimeout(function () {
      if (state.screen === 'numberrain' && !state.rainBusy) ctx.speak(t.en);
    }, 550);
  }

  // Chuông "ting" khi đúng / tiếng "rè" khi sai — y hệt các game khác.
  var sharedAudioCtx = null;
  function audioCtx() {
    if (!sharedAudioCtx) sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return sharedAudioCtx;
  }
  function playDing() {
    try {
      var ctxAudio = audioCtx();
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
      });
    } catch (e) { /* Web Audio không khả dụng — bỏ qua, không phá UI */ }
  }
  function playBuzz() {
    try {
      var ctxAudio = audioCtx();
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

  function renderNumberRainSummary() {
    stopRain();
    var store = ctx.getStore();
    var gained = totalStars(store.words) - (state.rainStarsAtStart || 0);
    var line = gained > 0 ? 'Bé được thêm ' + gained + ' sao!' : 'Bé nghe số giỏi lắm!';
    root.innerHTML = worldBg() +
      '<div class="content">' +
      '<div class="summary-mid" id="summaryMid">' +
      '<div class="starburst">' + starIcon('#FFD25A', 28) + starIcon('#F4A93B', 36) + starIcon('#FFD25A', 28) + '</div>' +
      ctx.owlMascot(64) +
      '<h2>Giỏi quá!</h2>' +
      '<p>' + line + '</p>' +
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

    document.getElementById('againBtn').addEventListener('click', startNumberRainGame);
    document.getElementById('homeBtn2').addEventListener('click', function () {
      state.screen = 'home';
      ctx.render();
    });
  }

  // Ô ở Trang chủ: trời xanh, mây, 3 giọt mưa mang số.
  function gameTileHtml(title) {
    return '<button type="button" class="gametile rain-tile" data-id="numberrain">' +
      '<span class="raintile-face" aria-hidden="true">' +
      '<span class="raintile-cloud"></span>' +
      '<span class="raintile-drop d1 c3">3</span>' +
      '<span class="raintile-drop d2 c2">7</span>' +
      '<span class="raintile-drop d3 c0">5</span>' +
      '</span>' +
      '<span class="name">' + title + '</span></button>';
  }

  return {
    startNumberRainGame: startNumberRainGame,
    renderNumberRain: renderNumberRain,
    renderNumberRainSummary: renderNumberRainSummary,
    gameTileHtml: gameTileHtml
  };
}
