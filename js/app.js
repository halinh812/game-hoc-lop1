// App — nối Content Loader + Progress Store + Learning Engine + AudioProvider
// với UI. Toàn bộ HTML/CSS trong index.html giữ nguyên; file này chỉ thay
// thế phần <script> nội tuyến trước đây, tổ chức lại thành module nhưng
// KHÔNG đổi cảm giác chơi hiện có (trừ các nâng cấp Learning Engine đã ghi
// trong ROADMAP.md Phase 1: response time, hàng đợi phiên động).

import { loadContentPacks } from './content-loader.js';
import { loadProgress, saveProgress, clearProgress } from './progress-store.js';
import {
  buildRound,
  createSessionQueue,
  requeueAfterAnswer,
  pickOptions,
  applyAnswer,
  classifyAnswer
} from './learning-engine.js';
import { createAudioProvider } from './audio-provider.js';

var CONTENT_PACKS = [
  'content/packs/colors-v1.json',
  'content/packs/animals-v1.json',
  'content/packs/numbers-v1.json',
  'content/packs/fruits-v1.json',
  'content/packs/family-v1.json'
];

var OWL_SVG = '<svg class="owl" viewBox="0 0 64 64" width="40" height="40" aria-hidden="true">' +
  '<ellipse cx="32" cy="36" rx="22" ry="24" fill="var(--gold)"/>' +
  '<path d="M10 40 Q3 28 15 18" stroke="var(--gold)" stroke-width="7" fill="none" stroke-linecap="round"/>' +
  '<path d="M54 40 Q61 28 49 18" stroke="var(--gold)" stroke-width="7" fill="none" stroke-linecap="round"/>' +
  '<circle cx="22" cy="30" r="9" fill="#FFFDF7"/>' +
  '<circle cx="42" cy="30" r="9" fill="#FFFDF7"/>' +
  '<circle cx="22" cy="30" r="4" fill="var(--ink)"/>' +
  '<circle cx="42" cy="30" r="4" fill="var(--ink)"/>' +
  '<path d="M28.5 38 L32 44.5 L35.5 38 Z" fill="var(--margin)"/>' +
  '</svg>';
var STAR_BIG_SVG = '<svg viewBox="0 0 24 24" width="34" height="34"><path d="M12 2.5l2.9 6.1 6.7.7-5 4.5 1.4 6.6L12 16.9l-6 3.5 1.4-6.6-5-4.5 6.7-.7z" fill="currentColor"/></svg>';
var SPEAK_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor"/><path d="M16.4 8.6a5 5 0 010 6.8" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/></svg>';
var CLOSE_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/></svg>';

var audio = createAudioProvider();
var root = document.getElementById('root');

var WORDS = [];
var CATEGORIES = [{ id: 'all', label: 'Tất cả' }];
var store = { words: {} };

var state = {
  screen: 'loading',
  mode: 'flashcard', // 'flashcard' | 'zoocatch' — quyết định màn "chơi lại" và về nhà nào được dùng
  category: 'all',
  round: [],
  idx: 0,
  correct: 0,
  answered: false,
  currentOptions: null,
  requeueCounts: {},
  cardShownAt: 0
};

function el(html) {
  var d = document.createElement('div');
  d.innerHTML = html.trim();
  return d.firstElementChild;
}

function speak(text) {
  audio.speak(text, { lang: 'en-US' });
}

function wordsInCat(catId) {
  return catId === 'all' ? WORDS.slice() : WORDS.filter(function (w) { return w.cat === catId; });
}

function masteredCount(catId) {
  return wordsInCat(catId).filter(function (w) {
    var p = store.words[w.id];
    return p && p.level >= 4;
  }).length;
}

function homeMessage() {
  var total = WORDS.length;
  var mastered = masteredCount('all');
  var anySeen = WORDS.some(function (w) { return store.words[w.id] && store.words[w.id].seen; });
  var anyDue = WORDS.some(function (w) {
    var p = store.words[w.id];
    return p && p.seen && p.next <= Date.now();
  });
  if (!anySeen) return 'Chào bé! Mình là Bo. Cùng học những từ tiếng Anh đầu tiên nhé!';
  if (anyDue) return 'Đến giờ ôn bài rồi đó — ôn lại để nhớ thật lâu nha!';
  if (mastered >= total) return 'Bé đã thuộc hết rồi, giỏi quá! Chơi lại để nhớ thật chắc nhé.';
  return 'Bé giỏi lắm! Cùng học thêm vài từ mới nào.';
}

function cardGlyph(word) {
  if (word.emoji) return word.emoji;
  if (word.image) return '<img src="' + word.image + '" alt="' + word.en + '">';
  return '❓';
}

function render() {
  if (state.screen === 'loading') renderLoading();
  else if (state.screen === 'error') renderError();
  else if (state.screen === 'home') renderHome();
  else if (state.screen === 'quiz') renderQuiz();
  else if (state.screen === 'zoocatch') renderZooCatch();
  else renderSummary();
}

function renderLoading() {
  root.innerHTML =
    '<div class="topbar"><div class="brand">' + OWL_SVG +
    '<div><h1>Vở học Tiếng Anh của Bòng</h1><span class="sub">Đang tải bài học...</span></div></div></div>' +
    '<div class="bubble"><div class="owl">' + OWL_SVG.replace('width="40" height="40"', 'width="30" height="30"') + '</div><p>Chờ mình xíu nhé...</p></div>';
}

function renderError() {
  root.innerHTML =
    '<div class="topbar"><div class="brand">' + OWL_SVG +
    '<div><h1>Vở học Tiếng Anh của Bòng</h1><span class="sub">Có lỗi khi tải bài học</span></div></div></div>' +
    '<div class="bubble"><div class="owl">' + OWL_SVG.replace('width="40" height="40"', 'width="30" height="30"') + '</div><p>Không tải được nội dung bài học. Bé nhờ người lớn kiểm tra kết nối rồi thử lại nhé.</p></div>' +
    '<button class="stampbtn" id="retryBtn">Thử lại</button>';
  document.getElementById('retryBtn').addEventListener('click', function () {
    boot();
  });
}

function renderHome() {
  var total = wordsInCat(state.category).length;
  var mastered = masteredCount(state.category);
  var pct = total ? Math.round(mastered / total * 100) : 0;

  root.innerHTML =
    '<div class="topbar">' +
    '<div class="brand">' + OWL_SVG +
    '<div><h1>Vở học Tiếng Anh của Bòng</h1><span class="sub">Học từ vựng &middot; ôn lại đều để nhớ lâu</span></div>' +
    '</div>' +
    '</div>' +
    '<div class="bubble"><div class="owl">' + OWL_SVG.replace('width="40" height="40"', 'width="30" height="30"') + '</div><p>' + homeMessage() + '</p></div>' +
    '<div class="chiprow" id="chiprow"></div>' +
    '<div class="progresswrap">' +
    '<div class="label"><span>Đã thuộc</span><b>' + mastered + ' / ' + total + ' từ</b></div>' +
    '<div class="bar"><div class="bar__fill" style="width:' + pct + '%"></div></div>' +
    '</div>' +
    '<button class="stampbtn" id="startBtn">Bắt đầu học</button>' +
    '<button class="stampbtn alt" id="zooBtn">🦁 Bắt thú Sở thú (mini-game mới)</button>' +
    '<button class="resetlink" id="resetLink">Xoá tiến trình đã lưu</button>' +
    '<div id="confirmZone"></div>';

  var chiprow = document.getElementById('chiprow');
  CATEGORIES.forEach(function (c) {
    var chip = el('<button class="chip" type="button" aria-pressed="' + (state.category === c.id) + '">' +
      (c.icon ? '<span aria-hidden="true">' + c.icon + '</span>' : '') + '<span>' + c.label + '</span></button>');
    chip.addEventListener('click', function () {
      state.category = c.id;
      render();
    });
    chiprow.appendChild(chip);
  });

  document.getElementById('startBtn').addEventListener('click', function () {
    startSession();
  });
  document.getElementById('zooBtn').addEventListener('click', function () {
    startZooCatch();
  });

  var confirmZone = document.getElementById('confirmZone');
  document.getElementById('resetLink').addEventListener('click', function () {
    confirmZone.innerHTML = '<div class="confirmrow"><span>Xoá hết tiến trình?</span></div>';
    var row = confirmZone.querySelector('.confirmrow');
    var yes = el('<button type="button">Xoá</button>');
    var no = el('<button type="button">Huỷ</button>');
    yes.addEventListener('click', function () {
      store = clearProgress();
      render();
    });
    no.addEventListener('click', function () {
      confirmZone.innerHTML = '';
    });
    row.appendChild(yes);
    row.appendChild(no);
  });
}

function startSession() {
  var pool = wordsInCat(state.category);
  state.round = createSessionQueue(buildRound(pool, store.words, { size: 8 }));
  state.idx = 0;
  state.correct = 0;
  state.answered = false;
  state.currentOptions = null;
  state.requeueCounts = {};
  state.mode = 'flashcard';
  state.screen = 'quiz';
  render();
}

function startZooCatch() {
  var pool = wordsInCat('animal');
  state.round = createSessionQueue(buildRound(pool, store.words, { size: 8 }));
  state.idx = 0;
  state.correct = 0;
  state.answered = false;
  state.currentOptions = null;
  state.requeueCounts = {};
  state.mode = 'zoocatch';
  state.screen = 'zoocatch';
  render();
}

// --- Zoo Catch: bé nghe tên con vật bằng tiếng Anh, bấm đúng con đang đi
// qua màn hình. Bấm nhầm chỉ nhắc nhẹ + cho thử lại ngay (không mất lượt,
// không giới hạn thời gian) — đúng nguyên tắc "không tạo áp lực" trong GDD.
// Mỗi lượt bấm sai vẫn được ghi nhận vào Learning Engine (liên kết yếu đi),
// còn hàng đợi phiên chỉ được chèn lại 1 lần dựa trên kết quả cuối cùng.

var ZOO_LANE_DURATIONS = [5.5, 7, 6.2, 8];

function renderZooCatch() {
  var word = state.round[state.idx];
  var options = state.currentOptions || (state.currentOptions = pickOptions(word, wordsInCat('animal')));
  state.cardShownAt = Date.now();

  var dots = state.round.map(function (w, i) {
    var st = i < state.idx ? 'done' : (i === state.idx ? 'current' : '');
    return '<span class="dot" data-state="' + st + '"></span>';
  }).join('');

  var lanes = options.map(function (opt, i) {
    var dur = ZOO_LANE_DURATIONS[i % ZOO_LANE_DURATIONS.length];
    var delay = (i * 0.6).toFixed(1);
    return '<div class="zoolane" data-id="' + opt.id + '">' +
      '<div class="zoolane__mover" style="animation-duration:' + dur + 's; animation-delay:-' + delay + 's;">' +
      '<img src="' + opt.image + '" alt="' + opt.en + '">' +
      '</div></div>';
  }).join('');

  root.innerHTML =
    '<div class="backrow">' +
    '<button class="iconbtn" id="homeBtn" aria-label="Về trang chủ">' + CLOSE_SVG + '</button>' +
    '<div class="dots">' + dots + '</div>' +
    '</div>' +
    '<p class="zoo-instructions">🦁 Bấm đúng con: <b>' + word.en + '</b></p>' +
    '<div style="display:flex;justify-content:center;margin-bottom:12px;">' +
    '<button class="speakbtn" id="speakBtn">' + SPEAK_SVG + '<span>Nghe lại</span></button>' +
    '</div>' +
    '<div class="zoo-lanes zoo-stage" id="zooStage">' + lanes + '</div>' +
    '<div class="bubble" id="feedbackBubble" style="display:none;"><div class="owl">' + OWL_SVG.replace('width="40" height="40"', 'width="30" height="30"') + '</div><p id="feedbackText"></p></div>' +
    '<button class="nextbtn" id="nextBtn" style="display:none;"></button>';

  document.getElementById('homeBtn').addEventListener('click', function () {
    state.mode = 'flashcard'; state.screen = 'home'; state.currentOptions = null; render();
  });
  document.getElementById('speakBtn').addEventListener('click', function () {
    speak(word.promptAudioText || word.en);
  });

  speak(word.promptAudioText || word.en);

  var stageEl = document.getElementById('zooStage');
  Array.prototype.forEach.call(stageEl.querySelectorAll('.zoolane'), function (laneEl) {
    laneEl.addEventListener('click', function () {
      var chosen = options.filter(function (o) { return o.id === laneEl.getAttribute('data-id'); })[0];
      handleZooCatchAnswer(chosen, word, laneEl, stageEl);
    });
  });
}

function handleZooCatchAnswer(chosen, correctWord, laneEl, stageEl) {
  if (state.answered) return;
  var isCorrect = chosen.id === correctWord.id;

  if (!isCorrect) {
    applyAnswer(store.words, correctWord.id, 'wrong');
    saveProgress(store);
    laneEl.classList.remove('nudge');
    void laneEl.offsetWidth; // buộc trình duyệt tính lại để animation chạy lại được
    laneEl.classList.add('nudge');
    var bubble = document.getElementById('feedbackBubble');
    var text = document.getElementById('feedbackText');
    bubble.style.display = 'flex';
    text.innerHTML = 'Chưa đúng, bé thử bắt lại nhé!';
    return;
  }

  state.answered = true;
  state.correct++;
  var responseTimeMs = Date.now() - state.cardShownAt;
  var outcome = classifyAnswer(true, responseTimeMs);
  applyAnswer(store.words, correctWord.id, outcome);
  saveProgress(store);
  state.round = requeueAfterAnswer(state.round, state.idx, correctWord, outcome, state.requeueCounts);
  speak(correctWord.promptAudioText || correctWord.en);

  stageEl.classList.add('answered');
  laneEl.classList.add('caught');

  var bubble2 = document.getElementById('feedbackBubble');
  var text2 = document.getElementById('feedbackText');
  bubble2.style.display = 'flex';
  text2.innerHTML = '<b>Bắt được rồi!</b> ' + correctWord.en + ' = <span class="vi-reveal">' + correctWord.vi + '</span>';

  var isLast = state.idx >= state.round.length - 1;
  var nextBtn = document.getElementById('nextBtn');
  nextBtn.style.display = 'block';
  nextBtn.textContent = isLast ? 'Xem kết quả' : 'Con tiếp theo';
  nextBtn.addEventListener('click', function () {
    if (isLast) {
      state.screen = 'summary';
    } else {
      state.idx++;
      state.currentOptions = null;
    }
    state.answered = false;
    render();
  });
}

function renderQuiz() {
  var word = state.round[state.idx];
  var options = state.currentOptions || (state.currentOptions = pickOptions(word, WORDS));
  state.cardShownAt = Date.now();

  var dots = state.round.map(function (w, i) {
    var st = i < state.idx ? 'done' : (i === state.idx ? 'current' : '');
    return '<span class="dot" data-state="' + st + '"></span>';
  }).join('');

  root.innerHTML =
    '<div class="backrow">' +
    '<button class="iconbtn" id="homeBtn" aria-label="Về trang chủ">' + CLOSE_SVG + '</button>' +
    '<div class="dots">' + dots + '</div>' +
    '</div>' +
    '<div class="cardwrap">' +
    '<div class="flashcard" id="flashcard">' + cardGlyph(word) + '</div>' +
    '<div class="stamp-pop" id="stampPop">' + STAR_BIG_SVG + '</div>' +
    '</div>' +
    '<div style="display:flex;justify-content:center;margin-bottom:20px;">' +
    '<button class="speakbtn" id="speakBtn">' + SPEAK_SVG + '<span>Nghe từ</span></button>' +
    '</div>' +
    '<div class="options" id="options"></div>' +
    '<div class="bubble" id="feedbackBubble" style="display:none;"><div class="owl">' + OWL_SVG.replace('width="40" height="40"', 'width="30" height="30"') + '</div><p id="feedbackText"></p></div>' +
    '<button class="nextbtn" id="nextBtn" style="display:none;"></button>';

  document.getElementById('homeBtn').addEventListener('click', function () {
    state.screen = 'home'; state.currentOptions = null; render();
  });
  document.getElementById('speakBtn').addEventListener('click', function () {
    speak(word.promptAudioText || word.en);
  });

  var optionsEl = document.getElementById('options');
  options.forEach(function (opt) {
    var btn = el('<button class="opt" type="button">' + opt.en + '</button>');
    btn.addEventListener('click', function () { handleAnswer(opt, word, optionsEl); });
    optionsEl.appendChild(btn);
  });
}

function handleAnswer(chosen, correctWord, optionsEl) {
  if (state.answered) return;
  state.answered = true;
  var isCorrect = chosen.id === correctWord.id;
  var responseTimeMs = Date.now() - state.cardShownAt;

  Array.prototype.forEach.call(optionsEl.children, function (b) { b.disabled = true; });
  Array.prototype.forEach.call(optionsEl.children, function (b, i) {
    var opt = state.currentOptions[i];
    if (opt.id === correctWord.id) b.setAttribute('data-state', 'correct');
    else if (opt.id === chosen.id) b.setAttribute('data-state', 'wrong');
  });

  if (isCorrect) state.correct++;
  var outcome = classifyAnswer(isCorrect, responseTimeMs);
  applyAnswer(store.words, correctWord.id, outcome);
  saveProgress(store);
  state.round = requeueAfterAnswer(state.round, state.idx, correctWord, outcome, state.requeueCounts);
  speak(correctWord.promptAudioText || correctWord.en);

  var flashcard = document.getElementById('flashcard');
  if (isCorrect) {
    var pop = document.getElementById('stampPop');
    pop.classList.add('show');
  } else {
    flashcard.classList.add('shake');
  }

  var bubble = document.getElementById('feedbackBubble');
  var text = document.getElementById('feedbackText');
  bubble.style.display = 'flex';
  if (isCorrect) {
    text.innerHTML = '<b>Đúng rồi!</b> ' + correctWord.en + ' = <span class="vi-reveal">' + correctWord.vi + '</span>';
  } else {
    text.innerHTML = 'Chưa đúng. Từ này là <b>' + correctWord.en + '</b> = <span class="vi-reveal">' + correctWord.vi + '</span>';
  }

  var isLast = state.idx >= state.round.length - 1;
  var nextBtn = document.getElementById('nextBtn');
  nextBtn.style.display = 'block';
  nextBtn.textContent = isLast ? 'Xem kết quả' : 'Câu tiếp theo';
  nextBtn.addEventListener('click', function () {
    if (isLast) {
      state.screen = 'summary';
    } else {
      state.idx++;
      state.currentOptions = null;
    }
    state.answered = false;
    render();
  });
}

function renderSummary() {
  var total = state.round.length;
  var pct = total ? Math.round(state.correct / total * 100) : 0;
  var mastered = masteredCount('all');
  var msg;
  if (pct >= 80) msg = 'Xuất sắc! Bé nhớ từ rất giỏi luôn!';
  else if (pct >= 50) msg = 'Cố lên nào, ôn thêm chút nữa là thuộc hết!';
  else msg = 'Không sao đâu, học lại vài lần nữa bé sẽ nhớ thôi!';

  root.innerHTML =
    '<div class="summary">' +
    '<div class="big">' + OWL_SVG.replace('width="40" height="40"', 'width="56" height="56"') + '</div>' +
    '<h2 style="text-align:center;">Xong một lượt học!</h2>' +
    '<p style="text-align:center;color:var(--ink-soft);font-weight:600;margin:6px 0 0;">' + msg + '</p>' +
    '<div class="statgrid">' +
    '<div class="stat"><b>' + state.correct + '/' + total + '</b><span>Trả lời đúng</span></div>' +
    '<div class="stat"><b>' + mastered + '/' + WORDS.length + '</b><span>Từ đã thuộc</span></div>' +
    '</div>' +
    '<div class="btnrow">' +
    '<button class="stampbtn" id="againBtn">' + (state.mode === 'zoocatch' ? 'Bắt thú tiếp' : 'Học tiếp') + '</button>' +
    '<button class="ghostbtn" id="homeBtn2">Về trang chủ</button>' +
    '</div>' +
    '</div>';

  document.getElementById('againBtn').addEventListener('click', function () {
    if (state.mode === 'zoocatch') startZooCatch();
    else startSession();
  });
  document.getElementById('homeBtn2').addEventListener('click', function () {
    state.mode = 'flashcard';
    state.screen = 'home'; render();
  });
}

async function boot() {
  state.screen = 'loading';
  render();
  store = loadProgress();
  var result = await loadContentPacks(CONTENT_PACKS);
  if (!result.words.length) {
    state.screen = 'error';
    render();
    return;
  }
  WORDS = result.words;
  CATEGORIES = [{ id: 'all', label: 'Tất cả' }].concat(result.categories);
  state.screen = 'home';
  render();
}

boot();
