// Game "Flip & Match" (Lật thẻ ghép cặp) — luyện kỹ năng "Đọc" (skill=read).
//
// VÌ SAO CÓ GAME NÀY: số liệu học thật của bé (file sao lưu tiến độ, tháng
// 11/2026) cho thấy bé NGHE rất tốt (95 từ, LV trung bình 4,9) nhưng ĐỌC còn
// yếu (17 từ, LV trung bình 2,4) — có 38 từ bé nghe đã thuộc (LV >= 5) mà
// chưa từng tập đọc chữ của từ đó. Game này dùng cái bé giỏi (nghe) để kéo
// cái bé yếu (đọc).
//
// CÁCH CHƠI: 8 thẻ úp (người dùng chọn 8 thẻ = 4 cặp, dễ hơn 12 thẻ cho
// ván đầu). Mỗi cặp = 1 thẻ HÌNH (ảnh thật, đúng ảnh trong các game bé đang
// chơi) + 1 thẻ CHỮ (từ tiếng Anh viết to). LẬT THẺ NÀO APP ĐỌC TỪ ĐÓ — nên
// lúc đầu bé ghép được bằng tai (lật hình hà mã nghe "hippo", lật chữ cũng
// nghe "hippo"), ghép nhiều lần thì tự quen mặt chữ.
//   - Trúng cặp: 2 thẻ sáng xanh + tiếng "ting", nằm ngửa luôn.
//   - Trật: chờ đọc xong rồi úp lại, KHÔNG PHẠT — lật trật là do chưa nhớ
//     vị trí, không phải không biết chữ.
//   - Ghép hết 4 cặp là thắng.
//
// Khác 8 game trước (đều là "nghe/nhìn rồi bấm 1 trong N ô"): đây là trò
// trí nhớ lật thẻ. Dùng ảnh thật có sẵn, mặt sau thẻ dùng hình cú mèo linh
// vật — không vẽ hình tạm.
//
// Không tự lấy state/store/WORDS từ app.js (tránh import vòng) — xem giải
// thích chi tiết hơn ở đầu games/khu-rung-ky-bi/forest.js.
import { applyAnswer, getSkillProgress, shuffle } from '../../engine/learning-engine.js';
import { saveProgress } from '../../engine/progress-store.js';
import { starIcon, CLOSE_SVG, worldBg, speakThenProceed } from '../../engine/ui-shared.js';

export var FLIP_PAIRS = 4;

// Chọn từ cho 1 ván — hàm THUẦN (không đụng DOM), export để unit test.
//
// Ưu tiên: từ bé ĐÃ NGHE THUỘC (listen LV >= 3) mà ĐỌC còn yếu/chưa từng
// đọc — đúng chỗ hổng trong số liệu. Trong nhóm đó xếp: chưa đọc lần nào
// trước, rồi LV đọc thấp trước, rồi nghe giỏi hơn trước. Không lấy cứng 4 từ
// đầu bảng (thế thì ván nào cũng y hệt nhau) mà bốc ngẫu nhiên trong 1 "cửa
// sổ" ưu tiên rộng gấp 3 — vẫn đúng nhóm cần luyện, nhưng ván sau khác ván
// trước. Tránh lặp lại bộ từ của ván ngay trước (lastIds) nếu đủ từ khác.
// Bé mới chơi chưa có số liệu nghe thì vẫn có đủ từ: lấy thêm ngẫu nhiên
// trong toàn bộ từ có ảnh.
export function pickFlipWords(pool, wordsMap, opts) {
  opts = opts || {};
  var count = opts.count || FLIP_PAIRS;
  var rng = opts.rng || Math.random;
  var last = {};
  (opts.lastIds || []).forEach(function (id) { last[id] = true; });

  var withImage = pool.filter(function (w) { return !!w.image; });
  var fresh = withImage.filter(function (w) { return !last[w.id]; });
  // Không đủ từ mới cho 1 ván thì đành cho lặp lại.
  var candidates = fresh.length >= count ? fresh : withImage;

  function listenLv(w) { var p = getSkillProgress(wordsMap, w.id, 'listen'); return p ? p.level : 0; }
  function readP(w) { return getSkillProgress(wordsMap, w.id, 'read'); }

  var priority = candidates.filter(function (w) {
    var r = readP(w);
    return listenLv(w) >= 3 && (!r || !r.seen || r.level <= 2);
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

export function createFlipMatchGame(ctx) {
  var root = document.getElementById('root');
  var state = ctx.state;

  function vocabPool() {
    return ctx.getWords().filter(function (w) { return (w.cat === 'animal' || w.cat === 'object') && w.image; });
  }

  function startFlipMatchGame() {
    var store = ctx.getStore();
    var words = pickFlipWords(vocabPool(), store.words, { lastIds: state.flipLastIds });
    state.flipLastIds = words.map(function (w) { return w.id; });
    var cards = [];
    words.forEach(function (w) {
      cards.push({ wordId: w.id, kind: 'pic', word: w });
      cards.push({ wordId: w.id, kind: 'text', word: w });
    });
    state.flipCards = shuffle(cards);
    state.flipUp = [];          // chỉ số các thẻ đang ngửa nhưng chưa ghép xong (tối đa 2)
    state.flipMatched = {};     // wordId -> true khi đã ghép
    state.flipBusy = false;
    state.correct = 0;
    state.screen = 'flipmatch';
    ctx.render();
  }

  function flipStarsRow() {
    var row = '';
    for (var i = 0; i < FLIP_PAIRS; i++) {
      var lit = i < state.correct;
      var starMarkup = starIcon(lit ? '#FFD25A' : 'rgba(255,255,255,.55)', 18, 'rgba(35,58,42,.35)');
      row += starMarkup.replace('<svg ', '<svg class="' + (lit ? 'lit' : '') + '" ');
    }
    return row;
  }

  function cardHtml(card, i) {
    var face = card.kind === 'pic'
      ? '<img src="' + card.word.image + '" alt="">'
      : '<span class="flipword">' + card.word.en + '</span>';
    return '<button type="button" class="flipcard" data-idx="' + i + '" aria-label="Thẻ số ' + (i + 1) + '">' +
      '<span class="flipinner">' +
      '<span class="flipface flipback"><img src="assets/characters/owl-idle.png" alt=""></span>' +
      '<span class="flipface flipfront' + (card.kind === 'text' ? ' isword' : '') + '">' + face + '</span>' +
      '</span></button>';
  }

  function renderFlipMatch() {
    root.innerHTML = worldBg() +
      '<div class="content flipcontent">' +
      '<div class="topbar">' +
      '<button class="iconbtn" id="homeBtn" aria-label="Về trang chủ">' + CLOSE_SVG + '</button>' +
      '<div class="starsrow" id="flipStars" style="margin:0;">' + flipStarsRow() + '</div>' +
      '<span style="width:38px;"></span>' +
      '</div>' +
      '<div class="flipgrid" id="flipGrid">' + state.flipCards.map(cardHtml).join('') + '</div>' +
      '</div>';

    document.getElementById('homeBtn').addEventListener('click', function () {
      state.screen = 'home';
      ctx.render();
    });
    document.getElementById('flipGrid').addEventListener('click', function (e) {
      var btn = e.target.closest('.flipcard');
      if (btn) handleFlip(parseInt(btn.getAttribute('data-idx'), 10));
    });
  }

  function cardEl(i) { return document.querySelector('.flipcard[data-idx="' + i + '"]'); }

  // Chuông "ting" khi ghép đúng — y hệt các game khác (mỗi game tự giữ 1
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
      });
    } catch (e) { /* Web Audio không khả dụng — bỏ qua, không phá UI */ }
  }

  function handleFlip(i) {
    if (state.flipBusy) return;
    var card = state.flipCards[i];
    if (!card || state.flipMatched[card.wordId] || state.flipUp.indexOf(i) !== -1) return;

    state.flipUp.push(i);
    var el = cardEl(i);
    if (el) el.classList.add('up');

    if (state.flipUp.length < 2) {
      // Thẻ thứ nhất: chỉ đọc, chờ bé lật thẻ thứ hai.
      ctx.speak(card.word.en);
      return;
    }

    // Thẻ thứ hai: khoá bấm cho tới khi xử lý xong cặp này.
    state.flipBusy = true;
    var a = state.flipCards[state.flipUp[0]];
    var b = card;
    var isMatch = a.wordId === b.wordId;
    var upNow = state.flipUp.slice();

    if (isMatch) {
      state.flipMatched[a.wordId] = true;
      state.correct++;
      upNow.forEach(function (idx) { var e2 = cardEl(idx); if (e2) e2.classList.add('matched'); });
      document.getElementById('flipStars').innerHTML = flipStarsRow();
      playDing();
      // Chấm điểm NHẸ TAY cho kỹ năng Đọc: luôn tính "đúng nhưng chậm" (chỉ
      // tăng LV khi còn thấp, xem applyAnswer). Lật thẻ trộn lẫn trí nhớ với
      // đọc chữ, không đo được bé đọc nhanh hay đoán mò — đo chặt hơn là
      // việc của Word Safari. Lật trật thì KHÔNG trừ gì (xem đầu file).
      var store = ctx.getStore();
      applyAnswer(store.words, a.wordId, 'read', 'correct-slow');
      saveProgress(store);
    } else {
      upNow.forEach(function (idx) { var e2 = cardEl(idx); if (e2) e2.classList.add('miss'); });
    }

    // Chờ đọc XONG từ của thẻ thứ hai rồi mới úp lại / sang màn thắng —
    // không dùng mốc thời gian cố định, đúng bài học "câu bị cắt ngang" ở
    // Vòng 52. Trật thì giữ ngửa tối thiểu 1,2 giây để bé kịp nhìn cả 2 thẻ.
    var isDone = state.correct >= FLIP_PAIRS;
    speakThenProceed(ctx.speak, b.word.en, isMatch ? 700 : 1200, function () {
      if (state.screen !== 'flipmatch') return; // bé đã thoát ra giữa chừng
      if (isDone) {
        state.screen = 'flipmatchSummary';
        ctx.render();
        return;
      }
      if (!isMatch) {
        upNow.forEach(function (idx) { var e2 = cardEl(idx); if (e2) e2.classList.remove('up', 'miss'); });
      }
      state.flipUp = [];
      state.flipBusy = false;
    });
  }

  function renderFlipMatchSummary() {
    root.innerHTML = worldBg() +
      '<div class="content">' +
      '<div class="summary-mid" id="summaryMid">' +
      '<div class="starburst">' + starIcon('#FFD25A', 28) + starIcon('#F4A93B', 36) + starIcon('#FFD25A', 28) + '</div>' +
      ctx.owlMascot(64) +
      '<h2>Giỏi quá!</h2>' +
      '<p>Bé ghép đúng hết rồi!</p>' +
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

    document.getElementById('againBtn').addEventListener('click', startFlipMatchGame);
    document.getElementById('homeBtn2').addEventListener('click', function () {
      state.screen = 'home';
      ctx.render();
    });
  }

  // Ô ở Trang chủ: 2 tấm thẻ nhỏ chồng lên nhau — 1 tấm hình con mèo, 1 tấm
  // chữ "cat" — nhìn là hiểu trò này ghép hình với chữ.
  function gameTileHtml(title) {
    return '<button type="button" class="gametile flip-tile" data-id="flipmatch">' +
      '<span class="fliptile-face">' +
      '<span class="fliptile-card pic"><img src="assets/animals/cat.png" alt=""></span>' +
      '<span class="fliptile-card word">cat</span>' +
      '</span>' +
      '<span class="name">' + title + '</span></button>';
  }

  return {
    startFlipMatchGame: startFlipMatchGame,
    renderFlipMatch: renderFlipMatch,
    renderFlipMatchSummary: renderFlipMatchSummary,
    gameTileHtml: gameTileHtml
  };
}
