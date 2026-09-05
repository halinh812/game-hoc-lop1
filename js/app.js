// App — nối Content Loader + Progress Store + Learning Engine + AudioProvider
// + bộ avatar với giao diện. Cấu trúc 3 trang thuần game cho trẻ em:
//   1. Trang chủ: hồ sơ bé (tên + avatar) + lưới chọn trò chơi (2 cột x 4)
//   2. Trò chơi: "Thế giới động vật" — nghe tên tiếng Anh, bắt đúng con vật
//      đang đi trong rừng (chỉ luyện kỹ năng "Nghe" của Learning Engine)
//   3. Trang phụ huynh: xem LV của từng kỹ năng (Nghe/Nói/Đọc/Viết/Nhìn)
//
// Không hiển thị số liệu học tập (số từ đã thuộc...) ở bất kỳ đâu trẻ nhìn
// thấy — chỉ trang phụ huynh mới có số liệu.

import { loadContentPacks } from './content-loader.js';
import { loadProgress, saveProgress, setProfile, getProfile } from './progress-store.js';
import {
  SKILLS,
  SKILL_LABELS,
  MAX_LEVEL,
  buildRound,
  applyAnswer,
  classifyAnswer,
  getSkillProgress,
  wrongRate
} from './learning-engine.js';
import { createAudioProvider } from './audio-provider.js';
import { getAvatars, avatarSvg } from './avatars.js';

var CONTENT_PACKS = [
  'content/packs/colors-v1.json',
  'content/packs/animals-v1.json',
  'content/packs/numbers-v1.json',
  'content/packs/fruits-v1.json',
  'content/packs/family-v1.json'
];

var FOREST_WIN_TARGET = 10;

var GAMES = [
  { id: 'forest', title: 'Thế giới động vật', emoji: '🦁', skill: 'listen', available: true },
  { id: 'g2', title: 'Sắp ra mắt', emoji: '🔒', available: false },
  { id: 'g3', title: 'Sắp ra mắt', emoji: '🔒', available: false },
  { id: 'g4', title: 'Sắp ra mắt', emoji: '🔒', available: false },
  { id: 'g5', title: 'Sắp ra mắt', emoji: '🔒', available: false },
  { id: 'g6', title: 'Sắp ra mắt', emoji: '🔒', available: false },
  { id: 'g7', title: 'Sắp ra mắt', emoji: '🔒', available: false },
  { id: 'g8', title: 'Sắp ra mắt', emoji: '🔒', available: false }
];

function starIcon(fill, size, stroke) {
  return '<svg viewBox="0 0 24 24" width="' + (size || 16) + '" height="' + (size || 16) + '" aria-hidden="true"><path d="M12 2l2.9 6.1 6.7.7-5 4.5 1.4 6.6L12 16.9l-6 3.5 1.4-6.6-5-4.5 6.7-.7z" fill="' + fill + '" stroke="' + (stroke || 'none') + '" stroke-width="1.2"/></svg>';
}
var BACK_SVG = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var CLOSE_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/></svg>';
var SPEAK_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9v6h4l5 5V4L8 9H4z" fill="#E4633F"/><path d="M16.4 8.6a5 5 0 010 6.8" stroke="#E4633F" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>';

function owlMascot(size) {
  size = size || 64;
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100" aria-hidden="true">' +
    '<ellipse cx="50" cy="58" rx="34" ry="37" fill="#F4A93B"/>' +
    '<ellipse cx="50" cy="60" rx="26" ry="29" fill="#FBC46C"/>' +
    '<path class="owl-wing" d="M20 55 Q4 46 8 26 Q22 32 26 52 Z" fill="#E4633F"/>' +
    '<path d="M80 62 Q94 58 92 42 Q80 46 76 58 Z" fill="#E4633F"/>' +
    '<circle class="owl-blink" cx="38" cy="52" r="13" fill="#FFFDF7"/>' +
    '<circle class="owl-blink" cx="62" cy="52" r="13" fill="#FFFDF7"/>' +
    '<circle cx="39" cy="52" r="6" fill="#2A3B2E"/><circle cx="63" cy="52" r="6" fill="#2A3B2E"/>' +
    '<circle cx="41" cy="49" r="1.8" fill="#fff"/><circle cx="65" cy="49" r="1.8" fill="#fff"/>' +
    '<ellipse cx="27" cy="66" rx="5" ry="3.4" fill="#F3958A" opacity=".8"/><ellipse cx="73" cy="66" rx="5" ry="3.4" fill="#F3958A" opacity=".8"/>' +
    '<path d="M46 60 L50 68 L54 60 Z" fill="#E4633F"/>' +
    '<path d="M28 32 L20 12 L36 24 Z" fill="#F4A93B"/><path d="M72 32 L80 12 L64 24 Z" fill="#F4A93B"/>' +
    '</svg>';
}

function worldBg() {
  return '<div class="world-bg" aria-hidden="true">' +
    '<div class="sun-glow"></div>' +
    '<div class="cloud c1"></div><div class="cloud c2"></div>' +
    '<div class="canopy-band"><svg viewBox="0 0 400 88" preserveAspectRatio="none">' +
    '<path d="M-10 50 Q40 14 100 46 T220 40 T340 50 T410 28 V-10 H-10 Z" fill="#8FC48A"/>' +
    '<path d="M-10 66 Q50 32 130 62 T280 54 T410 50 V-10 H-10 Z" fill="#4E8F58"/>' +
    '<rect x="55" y="52" width="14" height="18" rx="6" fill="#7A5636"/>' +
    '<rect x="326" y="48" width="16" height="22" rx="6" fill="#7A5636"/>' +
    '</svg></div>' +
    '<div class="ground-band"><svg viewBox="0 0 400 112" preserveAspectRatio="none">' +
    '<path d="M0 30 Q100 5 200 25 T400 15 V112 H0 Z" fill="#8FC48A" opacity=".4"/>' +
    '<path d="M0 55 Q100 35 200 50 T400 42 V112 H0 Z" fill="#4B8A57"/>' +
    '<path d="M0 78 H400 V112 H0 Z" fill="#356B44"/>' +
    '<g stroke="#356B44" stroke-width="3.4" stroke-linecap="round">' +
    '<path class="blade" d="M20 80 Q15 64 22 52"/><path class="blade" d="M40 80 Q45 62 38 50"/>' +
    '<path class="blade" d="M360 80 Q355 64 362 52"/><path class="blade" d="M380 80 Q385 62 378 50"/>' +
    '<path class="blade" d="M200 80 Q195 64 202 52"/>' +
    '</g></svg></div>' +
    '</div>';
}

var audio = createAudioProvider();
var root = document.getElementById('root');

var WORDS = [];
var store = { version: 3, profile: null, words: {} };

var state = {
  screen: 'loading',
  onboardName: '',
  onboardAvatar: null,
  correct: 0,
  answered: false, // true trong lúc khoá bấm (đang chờ tự chuyển câu)
  cardShownAt: 0,
  forestPool: [],
  slots: [],      // 4 từ đang hiển thị trên 4 hàng, giữ nguyên xuyên suốt
  targetIdx: 0    // slot nào đang là đáp án đúng của câu hỏi hiện tại
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
  return WORDS.filter(function (w) { return w.cat === catId; });
}

function render() {
  if (state.screen === 'loading') renderLoading();
  else if (state.screen === 'error') renderError();
  else if (state.screen === 'onboarding') renderOnboarding();
  else if (state.screen === 'home') renderHome();
  else if (state.screen === 'forest') renderForest();
  else if (state.screen === 'forestSummary') renderForestSummary();
  else if (state.screen === 'parent') renderParent();
}

function renderLoading() {
  root.innerHTML = worldBg() +
    '<div class="content" style="align-items:center;justify-content:center;">' +
    owlMascot(64) + '<p style="font-weight:700;color:var(--ink);margin-top:10px;">Đang tải...</p></div>';
}

function renderError() {
  root.innerHTML = worldBg() +
    '<div class="content" style="align-items:center;justify-content:center;text-align:center;">' +
    owlMascot(64) +
    '<p style="font-weight:700;color:var(--ink);margin:12px 0 16px;">Không tải được trò chơi.<br>Nhờ người lớn kiểm tra mạng nhé!</p>' +
    '<button class="chunkybtn coral" id="retryBtn" style="max-width:200px;">Thử lại</button></div>';
  document.getElementById('retryBtn').addEventListener('click', boot);
}

// ---------------- Onboarding: tên + avatar ----------------

function renderOnboarding() {
  var avatars = getAvatars();
  var existing = getProfile(store);
  if (existing && !state.onboardAvatar) {
    state.onboardName = existing.name;
    state.onboardAvatar = existing.avatarId;
  }

  var avatarTiles = avatars.map(function (a) {
    var pressed = state.onboardAvatar === a.id;
    return '<button type="button" class="avatarbtn" data-id="' + a.id + '" aria-pressed="' + pressed + '" aria-label="' + a.label + '">' + avatarSvg(a.id, 48) + '</button>';
  }).join('');

  root.innerHTML = worldBg() +
    '<div class="content">' +
    '<div style="text-align:center;margin-bottom:6px;">' + owlMascot(60) + '</div>' +
    '<h1 class="onboard-title">Bé tên là gì nhỉ?</h1>' +
    '<p class="onboard-sub">Chọn 1 bạn thú làm đại diện cho mình nhé!</p>' +
    '<input type="text" id="nameInput" class="nameinput" placeholder="Nhập tên của bé" maxlength="20" value="' + (state.onboardName || '') + '">' +
    '<div class="avatargrid" id="avatarGrid" style="max-height:230px;">' + avatarTiles + '</div>' +
    '<button class="chunkybtn coral" id="startPlayBtn" disabled>Bắt đầu chơi! 🎉</button>' +
    '</div>';

  var nameInput = document.getElementById('nameInput');
  var startBtn = document.getElementById('startPlayBtn');
  var grid = document.getElementById('avatarGrid');

  function refreshBtn() {
    var ready = nameInput.value.trim().length > 0 && !!state.onboardAvatar;
    startBtn.disabled = !ready;
  }

  nameInput.addEventListener('input', function () {
    state.onboardName = nameInput.value;
    refreshBtn();
  });

  grid.addEventListener('click', function (e) {
    var btn = e.target.closest('.avatarbtn');
    if (!btn) return;
    state.onboardAvatar = btn.getAttribute('data-id');
    Array.prototype.forEach.call(grid.children, function (c) {
      c.setAttribute('aria-pressed', c === btn ? 'true' : 'false');
    });
    refreshBtn();
  });

  startBtn.addEventListener('click', function () {
    var name = nameInput.value.trim();
    if (!name || !state.onboardAvatar) return;
    setProfile(store, { name: name, avatarId: state.onboardAvatar });
    state.screen = 'home';
    render();
  });

  refreshBtn();
}

// ---------------- Trang chủ: hồ sơ + lưới chọn trò chơi ----------------

function renderHome() {
  var profile = getProfile(store);

  var tiles = GAMES.map(function (g) {
    if (g.available) {
      return '<button type="button" class="gametile" data-id="' + g.id + '">' +
        '<span class="emoji">' + g.emoji + '</span><span class="name">' + g.title + '</span></button>';
    }
    return '<div class="gametile locked"><span class="emoji">' + g.emoji + '</span><span class="name">' + g.title + '</span></div>';
  }).join('');

  root.innerHTML = worldBg() +
    '<div class="content">' +
    '<div class="profilebar">' +
    '<button type="button" class="avatarcircle" id="avatarEditBtn" aria-label="Đổi hồ sơ">' + avatarSvg(profile.avatarId, 44) + '</button>' +
    '<div class="greet">Chào ' + profile.name + '! <span>Chọn trò chơi để bắt đầu nhé</span></div>' +
    '</div>' +
    '<div class="gamegrid" id="gameGrid">' + tiles + '</div>' +
    '<button type="button" class="parentbtn" id="parentLink">👪 Dành cho phụ huynh</button>' +
    '</div>';

  document.getElementById('avatarEditBtn').addEventListener('click', function () {
    state.onboardAvatar = null;
    state.screen = 'onboarding';
    render();
  });
  document.getElementById('parentLink').addEventListener('click', function () {
    state.screen = 'parent';
    render();
  });
  document.getElementById('gameGrid').addEventListener('click', function (e) {
    var tile = e.target.closest('.gametile[data-id]');
    if (!tile) return;
    if (tile.getAttribute('data-id') === 'forest') startForestGame();
  });
}

// ---------------- Trò chơi: Thế giới động vật ----------------

// Chọn slot nào (trong 4 slot đang hiển thị) sẽ là câu hỏi tiếp theo —
// ưu tiên từ đã đến hạn ôn, trong đó ưu tiên tỉ lệ sai cao hơn, LV thấp
// hơn; có yếu tố ngẫu nhiên để không luôn rơi vào cùng 1 slot khi các từ
// đang ngang điểm nhau (vd lúc mới bắt đầu, chưa từ nào được học).
function pickTargetIndex(slots) {
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

// Chọn từ mới thay cho slot vừa được hỏi — loại trừ cả 4 từ đang hiển thị
// (kể cả từ vừa hỏi) để tránh lặp lại ngay, ưu tiên due/tỉ lệ sai cao
// trong số từ còn lại của bộ.
function pickReplacementWord(replaceIdx) {
  var exclude = {};
  state.slots.forEach(function (w) { exclude[w.id] = true; });
  var candidates = state.forestPool.filter(function (w) { return !exclude[w.id]; });
  if (!candidates.length) candidates = state.forestPool.filter(function (w) { return w.id !== state.slots[replaceIdx].id; });
  if (!candidates.length) candidates = state.forestPool.slice();
  return buildRound(candidates, store.words, 'listen', { size: 1 })[0];
}

function startForestGame() {
  state.forestPool = wordsInCat('animal');
  state.slots = buildRound(state.forestPool, store.words, 'listen', { size: 4 });
  state.targetIdx = pickTargetIndex(state.slots);
  state.correct = 0;
  state.answered = false;
  state.screen = 'forest';
  render();
}

// Ảnh tĩnh hoặc video lặp (nếu từ có "video") cho 1 ô — object-fit:contain
// (CSS) tự co vừa ô, giữ đúng tỉ lệ khung hình gốc.
function forestTileMedia(w) {
  return w.video
    ? '<video src="' + w.video + '" autoplay loop muted playsinline poster="' + w.image + '"></video>'
    : '<img src="' + w.image + '" alt="' + w.en + '">';
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
  speak('Catch the ' + w.en + '!');
}

function renderForest() {
  state.cardShownAt = Date.now();

  // Kiểu cổ điển: lưới 2x2 ô ảnh/video, bấm chọn — không đi lại/animation.
  // Chỉ đúng 1 ô (ô vừa được hỏi) bị đổi con sau mỗi câu, 3 ô kia giữ
  // nguyên DOM (xem advanceForestRound) — quan trọng với ô có <video>: nếu
  // dựng lại toàn bộ innerHTML mỗi câu, video của các ô KHÔNG đổi cũng bị
  // tạo lại từ đầu và chạy lại từ giây 0, giật hình mỗi lượt.
  var tiles = state.slots.map(function (w, i) {
    return '<div class="optiontile" data-idx="' + i + '">' + forestTileMedia(w) + '</div>';
  }).join('');

  var targetWord = state.slots[state.targetIdx];

  root.innerHTML = worldBg() +
    '<div class="content">' +
    '<div class="topbar">' +
    '<button class="iconbtn" id="homeBtn" aria-label="Về trang chủ">' + CLOSE_SVG + '</button>' +
    '<div class="starsrow" id="forestStars" style="margin:0;">' + forestStarsRow() + '</div>' +
    '<span style="width:38px;"></span>' +
    '</div>' +
    '<div class="ribbon">🦁 Bắt con: <b id="targetWordEl">' + targetWord.en + '</b></div>' +
    '<button class="soundbtn" id="speakBtn" aria-label="Nghe lại">' + SPEAK_SVG + '</button>' +
    '<div class="optiongrid" id="optionGrid">' + tiles + '</div>' +
    '<div class="glasscard" id="feedbackBubble" style="display:none;"><p id="feedbackText" style="margin:0;font-weight:600;font-size:.9rem;"></p></div>' +
    '</div>';

  document.getElementById('homeBtn').addEventListener('click', function () {
    state.screen = 'home'; render();
  });
  document.getElementById('speakBtn').addEventListener('click', speakForestTarget);
  speakForestTarget();

  var optionGrid = document.getElementById('optionGrid');
  Array.prototype.forEach.call(optionGrid.querySelectorAll('.optiontile'), function (tileEl) {
    tileEl.addEventListener('click', function () {
      handleForestAnswer(parseInt(tileEl.getAttribute('data-idx'), 10));
    });
  });
}

function handleForestAnswer(idx) {
  if (state.answered) return;
  state.answered = true;

  var tileEls = document.getElementById('optionGrid').querySelectorAll('.optiontile');
  var targetWord = state.slots[state.targetIdx];
  var isCorrect = idx === state.targetIdx;
  var responseTimeMs = Date.now() - state.cardShownAt;

  var bubble = document.getElementById('feedbackBubble');
  var text = document.getElementById('feedbackText');
  bubble.style.display = 'block';

  if (isCorrect) {
    var outcome = classifyAnswer(true, responseTimeMs);
    applyAnswer(store.words, targetWord.id, 'listen', outcome);
    saveProgress(store);
    state.correct++;
    speak(targetWord.en);
    tileEls[idx].classList.add('correct');
    text.innerHTML = '<b>Bắt được rồi!</b> 🎉 ' + targetWord.en;

    var isDone = state.correct >= FOREST_WIN_TARGET;
    setTimeout(function () {
      if (isDone) { state.screen = 'forestSummary'; render(); }
      else advanceForestRound(state.targetIdx);
    }, isDone ? 500 : 800);
  } else {
    applyAnswer(store.words, targetWord.id, 'listen', 'wrong');
    saveProgress(store);
    tileEls[idx].classList.add('wrong');
    tileEls[state.targetIdx].classList.add('correct');
    speak(targetWord.en);
    text.innerHTML = 'Chưa đúng. Đây là <b>' + targetWord.en + '</b>';
    setTimeout(function () { advanceForestRound(state.targetIdx); }, 3000);
  }
}

// Chỉ thay từ ở slot vừa được hỏi (replaceIdx) — 3 slot kia giữ nguyên con
// đang hiển thị, không đổi. Cập nhật DOM tại chỗ (không gọi render() dựng
// lại toàn màn) để 3 ô còn lại — kể cả ô đang phát <video> — không bị tạo
// lại và chạy lại từ đầu mỗi câu.
function advanceForestRound(replaceIdx) {
  state.slots[replaceIdx] = pickReplacementWord(replaceIdx);
  state.targetIdx = pickTargetIndex(state.slots);
  state.answered = false;
  state.cardShownAt = Date.now();

  var tileEls = document.getElementById('optionGrid').querySelectorAll('.optiontile');
  Array.prototype.forEach.call(tileEls, function (el) { el.classList.remove('wrong', 'correct'); });
  tileEls[replaceIdx].innerHTML = forestTileMedia(state.slots[replaceIdx]);

  document.getElementById('feedbackBubble').style.display = 'none';
  document.getElementById('forestStars').innerHTML = forestStarsRow();
  document.getElementById('targetWordEl').textContent = state.slots[state.targetIdx].en;

  speakForestTarget();
}

function renderForestSummary() {
  root.innerHTML = worldBg() +
    '<div class="content">' +
    '<div class="summary-mid" id="summaryMid">' +
    '<div class="starburst">' + starIcon('#FFD25A', 28) + starIcon('#F4A93B', 36) + starIcon('#FFD25A', 28) + '</div>' +
    owlMascot(64) +
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
    state.screen = 'home'; render();
  });
}

// ---------------- Trang phụ huynh ----------------

function levelColor(level) {
  if (level === 0) return '#C7C2AE';
  var t = level / MAX_LEVEL;
  var r = Math.round(244 - t * (244 - 47));
  var g = Math.round(169 + t * (143 - 169));
  var b = Math.round(59 + t * (91 - 59));
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function renderParent() {
  var profile = getProfile(store);
  var touchedWords = WORDS.filter(function (w) {
    return store.words[w.id] && store.words[w.id].skills &&
      SKILLS.some(function (s) { return store.words[w.id].skills[s]; });
  });

  var rows = touchedWords.map(function (w) {
    var cells = SKILLS.map(function (s) {
      var p = getSkillProgress(store.words, w.id, s);
      var lv = p ? p.level : 0;
      return '<div class="lvpill" style="background:' + levelColor(lv) + '" title="' + SKILL_LABELS[s] + '">' + lv + '</div>';
    }).join('');
    var thumb = w.image ? '<img src="' + w.image + '" alt="">' : '<span>' + (w.emoji || '❓') + '</span>';
    return '<div class="wordrow"><div class="wname">' + thumb + '<span>' + w.en + '</span></div>' + cells + '</div>';
  }).join('');

  var body = touchedWords.length
    ? '<div class="skillhead"><span>Từ</span><span>Nghe</span><span>Nói</span><span>Đọc</span><span>Viết</span><span>Nhìn</span></div>' + rows
    : '<div class="emptystate">Bé chưa chơi trò nào cả.<br>Số liệu sẽ hiện ra ở đây sau khi bé chơi nhé!</div>';

  root.innerHTML =
    '<div class="parentpage" id="parentPageRoot">' +
    '<div class="pheader">' +
    '<button id="backBtn" aria-label="Về trang bé">' + BACK_SVG + '</button>' +
    '<div><h1>Báo cáo học tập</h1><p class="psub">' + (profile ? profile.name : 'Bé') + ' — LV0 (chưa học) đến LV' + MAX_LEVEL + ' (đã nhớ rất lâu)</p></div>' +
    '</div>' +
    body +
    '</div>';

  document.getElementById('backBtn').addEventListener('click', function () {
    state.screen = 'home'; render();
  });

  tryMountContentManager();
}

// Phần "Thêm/sửa ảnh, video" chỉ tự xuất hiện trong Trang phụ huynh khi
// trang đang chạy qua server quản trị local (npm start — xem
// tools/admin-server.mjs), vì lúc đó mới có API /api/* để ghi file. Trên
// bản deploy tĩnh (GitHub Pages) fetch này luôn lỗi/404 nên không hiện gì
// thêm — không ảnh hưởng gì tới người xem trang công khai.
var cmState = { category: null };

async function tryMountContentManager() {
  var packs;
  try {
    var res = await fetch('/api/packs');
    if (!res.ok) return;
    packs = await res.json();
    if (!packs || !packs.length) return;
  } catch (e) { return; }

  var container = document.getElementById('parentPageRoot');
  if (!container) return;
  cmState.category = packs[0].category;

  var catOptions = packs.map(function (p) {
    return '<option value="' + p.category + '">' + (p.icon || '') + ' ' + p.label + '</option>';
  }).join('');

  container.insertAdjacentHTML('beforeend',
    '<div class="contentmgr" id="cmSection">' +
    '<h2>🛠️ Thêm / sửa ảnh, video cho từ vựng</h2>' +
    '<p class="hint">Chọn 1 từ có sẵn để thay ảnh/video, hoặc "➕ Thêm từ mới". Ảnh sẽ tự co nhỏ, video sẽ tự nén — không cần chỉnh gì trước khi tải lên.</p>' +
    '<label for="cmCategory">Bộ từ</label>' +
    '<select id="cmCategory">' + catOptions + '</select>' +
    '<label for="cmItem">Từ <span id="cmItemCount" class="badge"></span></label>' +
    '<select id="cmItem"></select>' +
    '<div id="cmIdRow" style="display:none;">' +
    '<label for="cmId">Mã từ (id) — chữ thường, không dấu, không khoảng trắng</label>' +
    '<input type="text" id="cmId" placeholder="vd: red_panda">' +
    '</div>' +
    '<div class="row2">' +
    '<div><label for="cmEn">Tiếng Anh</label><input type="text" id="cmEn" placeholder="vd: red panda"></div>' +
    '<div><label for="cmVi">Tiếng Việt</label><input type="text" id="cmVi" placeholder="vd: gấu trúc đỏ"></div>' +
    '</div>' +
    '<label for="cmDifficulty">Độ khó</label>' +
    '<select id="cmDifficulty"><option value="1">1 — Dễ</option><option value="2">2 — Khó hơn</option></select>' +
    '<label>Hiện có</label>' +
    '<div class="preview" id="cmPreview"></div>' +
    '<label for="cmImage">Ảnh mới (tuỳ chọn)</label>' +
    '<input type="file" id="cmImage" accept="image/*">' +
    '<label for="cmVideo">Video mới (tuỳ chọn)</label>' +
    '<input type="file" id="cmVideo" accept="video/*">' +
    '<button class="savebtn" id="cmSaveBtn">💾 Lưu</button>' +
    '<div id="cmSaveMsg"></div>' +
    '<button class="pubbtn" id="cmPublishBtn">🚀 Xuất bản lên GitHub</button>' +
    '<pre class="log" id="cmPublishLog" style="display:none;"></pre>' +
    '</div>'
  );

  document.getElementById('cmCategory').addEventListener('change', function () {
    cmState.category = this.value;
    cmLoadItems();
  });
  document.getElementById('cmItem').addEventListener('change', cmApplySelectedItem);
  document.getElementById('cmEn').addEventListener('input', function () {
    var idInput = document.getElementById('cmId');
    var itemSelect = document.getElementById('cmItem');
    if (itemSelect.value === CM_NEW_VALUE && !idInput.dataset.touched) {
      idInput.value = cmSlugify(this.value);
    }
  });
  document.getElementById('cmId').addEventListener('input', function () { this.dataset.touched = '1'; });
  document.getElementById('cmSaveBtn').addEventListener('click', cmSave);
  document.getElementById('cmPublishBtn').addEventListener('click', cmPublish);

  await cmLoadItems();
}

var CM_NEW_VALUE = '__new__';
var cmItems = [];

function cmSlugify(s) {
  return (s || '').toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

async function cmLoadItems() {
  cmItems = await fetch('/api/packs/' + cmState.category + '/items').then(function (r) { return r.json(); });
  document.getElementById('cmItemCount').textContent = cmItems.length + ' từ';
  var options = ['<option value="' + CM_NEW_VALUE + '">➕ Thêm từ mới</option>']
    .concat(cmItems.map(function (it) { return '<option value="' + it.id + '">' + it.vi + ' (' + it.en + ')</option>'; }));
  document.getElementById('cmItem').innerHTML = options.join('');
  cmApplySelectedItem();
}

function cmApplySelectedItem() {
  var itemSelect = document.getElementById('cmItem');
  var idRow = document.getElementById('cmIdRow');
  var idInput = document.getElementById('cmId');
  var enInput = document.getElementById('cmEn');
  var viInput = document.getElementById('cmVi');
  var difficultySelect = document.getElementById('cmDifficulty');

  if (itemSelect.value === CM_NEW_VALUE) {
    idRow.style.display = '';
    idInput.value = '';
    idInput.dataset.touched = '';
    enInput.value = '';
    viInput.value = '';
    difficultySelect.value = '1';
    cmRenderPreview(null);
    return;
  }
  idRow.style.display = 'none';
  var item = cmItems.find(function (it) { return it.id === itemSelect.value; });
  if (!item) return;
  enInput.value = item.en;
  viInput.value = item.vi;
  difficultySelect.value = String(item.difficulty || 1);
  cmRenderPreview(item);
}

function cmRenderPreview(item) {
  var el = document.getElementById('cmPreview');
  if (!item || (!item.image && !item.video)) {
    el.innerHTML = '<span class="empty">Chưa có ảnh/video</span>';
    return;
  }
  var html = '';
  if (item.image) html += '<img src="/' + item.image + '?t=' + Date.now() + '" alt="">';
  if (item.video) html += '<video src="/' + item.video + '?t=' + Date.now() + '" muted loop autoplay playsinline></video>';
  el.innerHTML = html;
}

function cmShowMsg(text, type) {
  var el = document.getElementById('cmSaveMsg');
  el.textContent = text;
  el.className = 'msg ' + type;
}

async function cmSave() {
  var itemSelect = document.getElementById('cmItem');
  var isNew = itemSelect.value === CM_NEW_VALUE;
  var id = isNew ? document.getElementById('cmId').value.trim() : itemSelect.value;
  if (!id) { cmShowMsg('Cần nhập mã từ (id).', 'err'); return; }

  var form = new FormData();
  form.set('category', cmState.category);
  form.set('id', id);
  form.set('text_en', document.getElementById('cmEn').value.trim());
  form.set('text_vi', document.getElementById('cmVi').value.trim());
  form.set('difficulty', document.getElementById('cmDifficulty').value);
  var imageFile = document.getElementById('cmImage').files[0];
  var videoFile = document.getElementById('cmVideo').files[0];
  if (imageFile) form.set('image', imageFile);
  if (videoFile) form.set('video', videoFile);

  var saveBtn = document.getElementById('cmSaveBtn');
  saveBtn.disabled = true;
  cmShowMsg('Đang xử lý và lưu...', 'info');
  try {
    var res = await fetch('/api/items', { method: 'POST', body: form });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi không rõ');
    var parts = [(isNew ? 'Đã thêm từ mới: ' : 'Đã cập nhật: ') + id];
    if (data.warnings && data.warnings.length) parts = parts.concat(data.warnings);
    cmShowMsg(parts.join('\n'), 'ok');
    document.getElementById('cmImage').value = '';
    document.getElementById('cmVideo').value = '';
    await cmLoadItems();
    document.getElementById('cmItem').value = id;
    cmApplySelectedItem();

    // Nạp lại toàn bộ content pack để bé chơi ngay được từ/ảnh vừa thêm
    // trong cùng phiên, không cần tải lại trang.
    var result = await loadContentPacks(CONTENT_PACKS);
    if (result.words.length) WORDS = result.words;
  } catch (e) {
    cmShowMsg('Lỗi: ' + e.message, 'err');
  } finally {
    saveBtn.disabled = false;
  }
}

async function cmPublish() {
  var btn = document.getElementById('cmPublishBtn');
  var log = document.getElementById('cmPublishLog');
  btn.disabled = true;
  log.style.display = 'block';
  log.textContent = 'Đang xuất bản...';
  try {
    var res = await fetch('/api/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    var data = await res.json();
    log.textContent = data.log || (data.error || 'Xong.');
  } catch (e) {
    log.textContent = 'Lỗi: ' + e.message;
  } finally {
    btn.disabled = false;
  }
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
  state.screen = getProfile(store) ? 'home' : 'onboarding';
  render();
}

boot();
