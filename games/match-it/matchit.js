// Game "Match It!" (Nối hình với chữ) — luyện kỹ năng "Đọc" (skill=read).
//
// VÌ SAO CÓ GAME NÀY: số liệu học thật của bé (file sao lưu tiến độ, tháng
// 11/2026) cho thấy bé NGHE rất tốt (95 từ, LV trung bình 4,9) nhưng ĐỌC còn
// yếu (17 từ, LV trung bình 2,4) — có 38 từ bé nghe đã thuộc (LV >= 5) mà
// chưa từng tập đọc chữ. Game này dùng cái bé giỏi (nghe) để kéo cái bé
// yếu (đọc).
//
// CÁCH CHƠI (người dùng tả lại sau bản đầu "lật thẻ úp" — bé chưa nhớ được
// vị trí thẻ úp, nên đổi sang MỌI THẺ NGỬA SẴN):
//   - Bên trái 4 thẻ HÌNH (ảnh thật), bên phải 4 thẻ CHỮ xếp lộn xộn.
//   - Chạm 1 hình rồi chạm 1 chữ (hoặc ngược lại) để NỐI — hiện đường nối.
//   - CHỈ THẺ HÌNH ĐƯỢC ĐỌC TO: chạm hình con gấu nghe "bear", rồi bé phải
//     TỰ ĐỌC để tìm chữ "bear". Thẻ chữ chạm vào không đọc (nếu đọc, bé chạm
//     thử từng chữ rồi nối bằng tai, không cần đọc chữ). Nối đúng thì đọc
//     lại 1 lần nữa.
//   - Nối đúng: cả 2 thẻ biến mất. Nối sai: đường nối đứt, chọn lại.
//   - 3 màn × 4 cặp = 12 từ mỗi lần chơi.
//
// "SAO" Ở ĐÂY LÀ SAO HỌC TẬP THẬT (tổng LV mọi kỹ năng — totalStars(), đúng
// con số ở góc Trang chủ), KHÔNG phải sao trang trí riêng của ván. Theo đúng
// ý người dùng: sao thể hiện bé đã nhớ chữ theo lặp lại ngắt quãng, nên
//   - Nối ĐÚNG NGAY LẦN ĐẦU -> applyAnswer(đúng) -> LV Đọc của từ lên -> +sao.
//   - Nối SAI -> bé chưa nhớ -> applyAnswer(sai) -> LV Đọc xuống -> -sao, và
//     Learning Engine tự cho gặp lại từ đó sớm hơn. Cặp đó nối đúng sau đó
//     chỉ biến mất, KHÔNG được cộng nữa (đúng sau khi đã sai không chứng
//     minh được là nhớ). Mỗi từ chỉ bị trừ 1 lần trong 1 màn, tránh 1 từ
//     khó bị trừ liên tục.
// Bộ đếm sao ở góc trên màn chơi nhảy +1/-1 ngay sau mỗi lần nối để bé thấy.
// Từ nào chưa tới hạn ôn thì nối đúng không lên LV (luật ngắt quãng chung
// của Learning Engine) — nên chọn từ ưu tiên đúng nhóm cần ôn/chưa học.
//
// Không tự lấy state/store/WORDS từ app.js (tránh import vòng) — xem giải
// thích chi tiết hơn ở đầu games/khu-rung-ky-bi/forest.js.
import { applyAnswer, classifyAnswer, getSkillProgress, shuffle, totalStars } from '../../engine/learning-engine.js';
import { saveProgress } from '../../engine/progress-store.js';
import { starIcon, CLOSE_SVG, worldBg, speakThenProceed } from '../../engine/ui-shared.js';

export var MATCH_PAIRS_PER_SCREEN = 4;
export var MATCH_SCREENS = 3;

// Chọn từ cho 1 lần chơi — hàm THUẦN (không đụng DOM), export để unit test.
//
// Ưu tiên: từ bé ĐÃ NGHE THUỘC (listen LV >= 3) mà ĐỌC còn yếu/chưa từng
// đọc/đã tới hạn ôn — đúng chỗ hổng trong số liệu. Trong nhóm đó xếp: chưa
// đọc lần nào trước, rồi LV đọc thấp trước, rồi nghe giỏi hơn trước. Không
// lấy cứng đầu bảng (thế thì lần nào cũng y hệt nhau) mà bốc ngẫu nhiên
// trong 1 "cửa sổ" ưu tiên rộng gấp 3. Tránh lặp lại bộ từ của lần chơi ngay
// trước (lastIds) nếu đủ từ khác. Bé mới chơi chưa có số liệu nghe thì vẫn
// đủ từ: lấy thêm trong toàn bộ từ có ảnh.
export function pickMatchWords(pool, wordsMap, opts) {
  opts = opts || {};
  var count = opts.count || MATCH_PAIRS_PER_SCREEN;
  var rng = opts.rng || Math.random;
  var now = opts.now || Date.now();
  var last = {};
  (opts.lastIds || []).forEach(function (id) { last[id] = true; });

  var withImage = pool.filter(function (w) { return !!w.image; });
  var fresh = withImage.filter(function (w) { return !last[w.id]; });
  var candidates = fresh.length >= count ? fresh : withImage;

  function listenLv(w) { var p = getSkillProgress(wordsMap, w.id, 'listen'); return p ? p.level : 0; }
  function readP(w) { return getSkillProgress(wordsMap, w.id, 'read'); }

  var priority = candidates.filter(function (w) {
    var r = readP(w);
    return listenLv(w) >= 3 && (!r || !r.seen || r.level <= 2 || r.next <= now);
  });
  priority.sort(function (a, b) {
    var ra = readP(a), rb = readP(b);
    var seenA = ra && ra.seen ? 1 : 0, seenB = rb && rb.seen ? 1 : 0;
    if (seenA !== seenB) return seenA - seenB;
    var lvA = ra ? ra.level : 0, lvB = rb ? rb.level : 0;
    if (lvA !== lvB) return lvA - lvB;
    return listenLv(b) - listenLv(a);
  });

  var picked = shuffle(priority.slice(0, count * 3), rng).slice(0, count);
  if (picked.length < count) {
    var have = {};
    picked.forEach(function (w) { have[w.id] = true; });
    var rest = candidates.filter(function (w) { return !have[w.id]; });
    rest.sort(function (a, b) { return listenLv(b) - listenLv(a); });
    picked = picked.concat(shuffle(rest.slice(0, count * 3), rng).slice(0, count - picked.length));
  }
  return picked;
}

export function createMatchItGame(ctx) {
  var root = document.getElementById('root');
  var state = ctx.state;

  function vocabPool() {
    return ctx.getWords().filter(function (w) { return (w.cat === 'animal' || w.cat === 'object') && w.image; });
  }

  function startMatchItGame() {
    var store = ctx.getStore();
    var total = MATCH_PAIRS_PER_SCREEN * MATCH_SCREENS;
    var words = pickMatchWords(vocabPool(), store.words, { count: total, lastIds: state.matchLastIds });
    state.matchLastIds = words.map(function (w) { return w.id; });
    state.matchScreens = [];
    for (var i = 0; i < words.length; i += MATCH_PAIRS_PER_SCREEN) {
      state.matchScreens.push(words.slice(i, i + MATCH_PAIRS_PER_SCREEN));
    }
    state.matchScreenIdx = 0;
    state.matchStarsAtStart = totalStars(store.words);
    state.screen = 'matchit';
    startScreen();
  }

  function startScreen() {
    var words = state.matchScreens[state.matchScreenIdx];
    state.matchPics = shuffle(words);
    state.matchTexts = shuffle(words);
    // Tránh trường hợp xui: chữ nằm ĐÚNG cùng hàng với hình của nó ở cả 4
    // hàng — nối thẳng ngang là xong, không cần đọc gì cả.
    if (state.matchTexts.every(function (w, i) { return w.id === state.matchPics[i].id; })) {
      state.matchTexts.push(state.matchTexts.shift());
    }
    state.matchDone = {};     // wordId -> true khi đã nối đúng
    state.matchMissed = {};   // wordId -> true khi đã nối sai trong màn này
    state.matchSel = null;    // { side: 'pic'|'text', idx } thẻ đang chọn
    state.matchSelAt = 0;
    state.matchBusy = false;
    ctx.render();
  }

  function screenDots() {
    var out = '';
    for (var i = 0; i < state.matchScreens.length; i++) {
      out += '<span class="matchdot' + (i < state.matchScreenIdx ? ' done' : i === state.matchScreenIdx ? ' now' : '') + '"></span>';
    }
    return out;
  }

  function renderMatchIt() {
    var store = ctx.getStore();
    var pics = state.matchPics.map(function (w, i) {
      return '<button type="button" class="matchcard pic" data-side="pic" data-idx="' + i + '" aria-label="Hình">' +
        '<span class="matchface"><img src="' + w.image + '" alt=""></span></button>';
    }).join('');
    // Chữ in thường hết: dữ liệu gốc lúc viết hoa lúc không ("Hippo" cạnh
    // "horse") — chữ hoa đầu vô tình thành "manh mối" không cần đọc, và bé
    // lớp 1 đang tập đọc chữ thường.
    var texts = state.matchTexts.map(function (w, i) {
      return '<button type="button" class="matchcard text" data-side="text" data-idx="' + i + '">' +
        '<span class="matchface"><span class="matchword">' + w.en.toLowerCase() + '</span></span></button>';
    }).join('');

    root.innerHTML = worldBg() +
      '<div class="content matchcontent">' +
      '<div class="topbar">' +
      '<button class="iconbtn" id="homeBtn" aria-label="Về trang chủ">' + CLOSE_SVG + '</button>' +
      '<div class="matchdots" aria-label="Màn ' + (state.matchScreenIdx + 1) + '/' + state.matchScreens.length + '">' + screenDots() + '</div>' +
      '<div class="matchstars" id="matchStars">' + starIcon('#FFD25A', 20, '#E4952A') +
      '<span id="matchStarsNum">' + totalStars(store.words) + '</span></div>' +
      '</div>' +
      '<div class="matchboard" id="matchBoard">' +
      '<svg class="matchlines" id="matchLines" aria-hidden="true"></svg>' +
      '<div class="matchcol pics">' + pics + '</div>' +
      '<div class="matchcol texts">' + texts + '</div>' +
      '</div>' +
      '</div>';

    document.getElementById('homeBtn').addEventListener('click', function () {
      state.screen = 'home';
      ctx.render();
    });
    document.getElementById('matchBoard').addEventListener('click', function (e) {
      var btn = e.target.closest('.matchcard');
      if (btn) handleTap(btn.getAttribute('data-side'), parseInt(btn.getAttribute('data-idx'), 10));
    });
  }

  function cardEl(side, idx) { return document.querySelector('.matchcard[data-side="' + side + '"][data-idx="' + idx + '"]'); }
  function wordAt(side, idx) { return side === 'pic' ? state.matchPics[idx] : state.matchTexts[idx]; }

  function setSelected(sel) {
    Array.prototype.forEach.call(document.querySelectorAll('.matchcard.sel'), function (el) { el.classList.remove('sel'); });
    state.matchSel = sel;
    if (sel) {
      var el = cardEl(sel.side, sel.idx);
      if (el) el.classList.add('sel');
    }
  }

  function handleTap(side, idx) {
    if (state.matchBusy) return;
    var w = wordAt(side, idx);
    if (!w || state.matchDone[w.id]) return;

    // Chỉ thẻ HÌNH được đọc to (xem đầu file).
    if (side === 'pic') ctx.speak(w.en);

    var sel = state.matchSel;
    if (!sel || sel.side === side) {
      // Chưa chọn gì, hoặc chạm thẻ khác cùng bên -> đổi lựa chọn.
      setSelected({ side: side, idx: idx });
      state.matchSelAt = Date.now();
      return;
    }

    var picIdx = side === 'pic' ? idx : sel.idx;
    var textIdx = side === 'text' ? idx : sel.idx;
    tryConnect(picIdx, textIdx);
  }

  // Vẽ đường nối từ mép phải thẻ hình sang mép trái thẻ chữ.
  function drawLine(picIdx, textIdx, kind) {
    var board = document.getElementById('matchBoard');
    var svg = document.getElementById('matchLines');
    var a = cardEl('pic', picIdx), b = cardEl('text', textIdx);
    if (!board || !svg || !a || !b) return;
    var br = board.getBoundingClientRect(), ar = a.getBoundingClientRect(), bb = b.getBoundingClientRect();
    var x1 = ar.right - br.left, y1 = ar.top + ar.height / 2 - br.top;
    var x2 = bb.left - br.left, y2 = bb.top + bb.height / 2 - br.top;
    svg.innerHTML = '<line class="matchline ' + kind + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>' +
      '<circle class="matchdotend ' + kind + '" cx="' + x1 + '" cy="' + y1 + '" r="6"/>' +
      '<circle class="matchdotend ' + kind + '" cx="' + x2 + '" cy="' + y2 + '" r="6"/>';
  }
  function clearLine() {
    var svg = document.getElementById('matchLines');
    if (svg) svg.innerHTML = '';
  }

  // Cập nhật bộ đếm sao thật + chữ "+1"/"-1" bay lên cạnh bộ đếm.
  function showStarDelta(before) {
    var store = ctx.getStore();
    var after = totalStars(store.words);
    var numEl = document.getElementById('matchStarsNum');
    if (numEl) numEl.textContent = after;
    var delta = after - before;
    if (!delta) return;
    var box = document.getElementById('matchStars');
    if (!box) return;
    var pop = document.createElement('span');
    pop.className = 'matchdelta ' + (delta > 0 ? 'up' : 'down');
    pop.textContent = (delta > 0 ? '+' : '−') + Math.abs(delta);
    box.appendChild(pop);
    setTimeout(function () { pop.remove(); }, 1300);
  }

  function tryConnect(picIdx, textIdx) {
    state.matchBusy = true;
    var store = ctx.getStore();
    var picWord = state.matchPics[picIdx];
    var textWord = state.matchTexts[textIdx];
    var picEl = cardEl('pic', picIdx), textEl = cardEl('text', textIdx);
    var before = totalStars(store.words);
    setSelected(null);

    if (picWord.id === textWord.id) {
      drawLine(picIdx, textIdx, 'good');
      state.matchDone[picWord.id] = true;
      // Đúng ngay lần đầu mới được tính (xem đầu file). Câu hỏi thật sự là
      // "chữ nào là từ của hình này", nên chấm cho từ của thẻ hình.
      if (!state.matchMissed[picWord.id]) {
        applyAnswer(store.words, picWord.id, 'read', classifyAnswer(true, Date.now() - state.matchSelAt));
        saveProgress(store);
      }
      showStarDelta(before);
      if (picEl) picEl.classList.add('good');
      if (textEl) textEl.classList.add('good');
      playDing();

      var screenDone = state.matchPics.every(function (w) { return state.matchDone[w.id]; });
      // Biến mất sau 1 nhịp để bé kịp thấy đường nối xanh.
      setTimeout(function () {
        if (state.screen !== 'matchit') return;
        if (picEl) picEl.classList.add('gone');
        if (textEl) textEl.classList.add('gone');
        clearLine();
      }, 650);
      // Đọc lại từ vừa nối đúng; chờ đọc XONG mới cho chạm tiếp / sang màn
      // (không dùng mốc thời gian cố định — bài học "câu bị cắt" Vòng 52).
      speakThenProceed(ctx.speak, picWord.en, screenDone ? 1100 : 700, function () {
        if (state.screen !== 'matchit') return; // bé đã thoát ra giữa chừng
        state.matchBusy = false;
        if (!screenDone) return;
        state.matchScreenIdx++;
        if (state.matchScreenIdx >= state.matchScreens.length) {
          state.screen = 'matchitSummary';
          ctx.render();
        } else {
          startScreen();
        }
      });
      return;
    }

    // Sai: bé chưa nhớ chữ của hình này -> trừ (mỗi từ chỉ 1 lần mỗi màn).
    drawLine(picIdx, textIdx, 'bad');
    if (!state.matchMissed[picWord.id]) {
      state.matchMissed[picWord.id] = true;
      applyAnswer(store.words, picWord.id, 'read', 'wrong');
      saveProgress(store);
    }
    showStarDelta(before);
    if (picEl) picEl.classList.add('bad');
    if (textEl) textEl.classList.add('bad');
    playBuzz();
    setTimeout(function () {
      if (state.screen !== 'matchit') return;
      if (picEl) picEl.classList.remove('bad');
      if (textEl) textEl.classList.remove('bad');
      clearLine();
      state.matchBusy = false;
    }, 900);
  }

  // Chuông "ting" khi đúng / tiếng "rè" khi sai — y hệt các game khác (mỗi
  // game tự giữ 1 bản sao riêng theo đúng quy ước đã có).
  var sharedAudioCtx = null;
  function audioCtx() {
    if (!sharedAudioCtx) sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return sharedAudioCtx;
  }
  function playDing() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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

  function renderMatchItSummary() {
    var store = ctx.getStore();
    var gained = totalStars(store.words) - (state.matchStarsAtStart || 0);
    var line = gained > 0 ? 'Bé được thêm ' + gained + ' sao!' : 'Bé đọc chữ giỏi lắm!';
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

    document.getElementById('againBtn').addEventListener('click', startMatchItGame);
    document.getElementById('homeBtn2').addEventListener('click', function () {
      state.screen = 'home';
      ctx.render();
    });
  }

  // Ô ở Trang chủ: thẻ hình con mèo nối với thẻ chữ "cat" bằng 1 đường kẻ —
  // nhìn là hiểu trò này nối hình với chữ.
  function gameTileHtml(title) {
    return '<button type="button" class="gametile match-tile" data-id="matchit">' +
      '<span class="matchtile-face">' +
      '<span class="matchtile-card pic"><img src="assets/animals/cat.png" alt=""></span>' +
      '<span class="matchtile-line"></span>' +
      '<span class="matchtile-card word">cat</span>' +
      '</span>' +
      '<span class="name">' + title + '</span></button>';
  }

  return {
    startMatchItGame: startMatchItGame,
    renderMatchIt: renderMatchIt,
    renderMatchItSummary: renderMatchItSummary,
    gameTileHtml: gameTileHtml
  };
}
