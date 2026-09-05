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
  createSessionQueue,
  requeueAfterAnswer,
  pickOptions,
  applyAnswer,
  classifyAnswer,
  getSkillProgress,
  shuffle
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

function bushHtml(left, top, size) {
  size = size || 66;
  return '<div class="bush" style="left:' + left + '; top:' + top + ';">' +
    '<svg width="' + size + '" height="' + size + '" viewBox="0 0 64 64" aria-hidden="true">' +
    '<ellipse cx="32" cy="55" rx="23" ry="6" fill="rgba(20,40,25,.2)"/>' +
    '<circle cx="20" cy="38" r="16" fill="#8FC48A"/>' +
    '<circle cx="40" cy="34" r="18" fill="#4E8F58"/>' +
    '<circle cx="30" cy="45" r="15" fill="#356B44"/>' +
    '</svg></div>';
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
  round: [],
  idx: 0,
  correct: 0,
  answered: false,
  currentOptions: null,
  requeueCounts: {},
  cardShownAt: 0,
  forestPool: []
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

function startForestGame() {
  state.forestPool = wordsInCat('animal');
  state.round = createSessionQueue(buildRound(state.forestPool, store.words, 'listen', { size: 10 }));
  state.idx = 0;
  state.correct = 0;
  state.answered = false;
  state.currentOptions = null;
  state.requeueCounts = {};
  state.screen = 'forest';
  render();
}

function renderForest() {
  var word = state.round[state.idx];
  var options = state.currentOptions || (state.currentOptions = pickOptions(word, state.forestPool));
  state.cardShownAt = Date.now();

  var starsRow = '';
  for (var i = 0; i < FOREST_WIN_TARGET; i++) {
    var lit = i < state.correct;
    var starMarkup = starIcon(lit ? '#FFD25A' : 'rgba(255,255,255,.55)', 16, 'rgba(35,58,42,.35)');
    starsRow += starMarkup.replace('<svg ', '<svg class="' + (lit ? 'lit' : '') + '" ');
  }

  // 4 con vật chạy tự do theo 4 "đường mòn" vòng kín khác nhau (không phải
  // làn ngang cố định) — path-a/path-b cố tình đi ngang qua sau 2 bụi cây
  // (z-index bụi cao hơn con vật) để tạo cảm giác núp rồi thò đầu ra.
  var PATH_NAMES = ['path-a', 'path-b', 'path-c', 'path-d'];
  var DURATIONS = [11, 13, 10.5, 12];
  var critters = options.map(function (opt, i) {
    var pathName = PATH_NAMES[i % PATH_NAMES.length];
    var dur = DURATIONS[i % DURATIONS.length];
    var delay = (i * 1.3).toFixed(1);
    return '<div class="critter" data-id="' + opt.id + '" style="animation-name:' + pathName + '; animation-duration:' + dur + 's; animation-delay:-' + delay + 's;">' +
      '<span class="critter-shake"><img src="' + opt.image + '" alt="' + opt.en + '"></span></div>';
  }).join('');
  var bushes = bushHtml('14%', '48%', 66) + bushHtml('58%', '26%', 70);

  root.innerHTML = worldBg() +
    '<div class="content">' +
    '<div class="topbar">' +
    '<button class="iconbtn" id="homeBtn" aria-label="Về trang chủ">' + CLOSE_SVG + '</button>' +
    '<div class="starsrow" style="margin:0;">' + starsRow + '</div>' +
    '<span style="width:38px;"></span>' +
    '</div>' +
    '<div class="ribbon">🦁 Bắt con: <b>' + word.en + '</b></div>' +
    '<button class="soundbtn" id="speakBtn" aria-label="Nghe lại">' + SPEAK_SVG + '</button>' +
    '<div class="forest-scene" id="forestStage">' + bushes + critters + '</div>' +
    '<div class="glasscard" id="feedbackBubble" style="display:none;margin-top:12px;"><p id="feedbackText" style="margin:0;font-weight:600;font-size:.9rem;"></p></div>' +
    '<button class="chunkybtn green" id="nextBtn" style="display:none;margin-top:12px;"></button>' +
    '</div>';

  document.getElementById('homeBtn').addEventListener('click', function () {
    state.screen = 'home'; state.currentOptions = null; render();
  });
  var sayIt = function () { speak('Catch the ' + word.en + '!'); };
  document.getElementById('speakBtn').addEventListener('click', sayIt);
  sayIt();

  var stage = document.getElementById('forestStage');
  Array.prototype.forEach.call(stage.querySelectorAll('.critter'), function (critterEl) {
    critterEl.addEventListener('click', function () {
      var chosen = options.filter(function (o) { return o.id === critterEl.getAttribute('data-id'); })[0];
      handleForestAnswer(chosen, word, critterEl);
    });
  });
}

function handleForestAnswer(chosen, correctWord, critterEl) {
  if (state.answered) return;
  var isCorrect = chosen.id === correctWord.id;

  if (!isCorrect) {
    applyAnswer(store.words, correctWord.id, 'listen', 'wrong');
    saveProgress(store);
    var shakeEl = critterEl.querySelector('.critter-shake');
    shakeEl.classList.remove('nudge');
    void shakeEl.offsetWidth;
    shakeEl.classList.add('nudge');
    var bubble = document.getElementById('feedbackBubble');
    var text = document.getElementById('feedbackText');
    bubble.style.display = 'block';
    text.textContent = 'Chưa đúng, bé thử bắt lại nhé!';
    return;
  }

  state.answered = true;
  state.correct++;
  var responseTimeMs = Date.now() - state.cardShownAt;
  var outcome = classifyAnswer(true, responseTimeMs);
  applyAnswer(store.words, correctWord.id, 'listen', outcome);
  saveProgress(store);
  state.round = requeueAfterAnswer(state.round, state.idx, correctWord, outcome, state.requeueCounts);
  speak(correctWord.en);

  critterEl.classList.add('caught');

  var bubble2 = document.getElementById('feedbackBubble');
  var text2 = document.getElementById('feedbackText');
  bubble2.style.display = 'block';
  text2.innerHTML = '<b>Bắt được rồi!</b> 🎉 ' + correctWord.en;

  var isDone = state.correct >= FOREST_WIN_TARGET;
  var nextBtn = document.getElementById('nextBtn');
  nextBtn.style.display = 'block';
  nextBtn.textContent = isDone ? 'Xem kết quả! 🎉' : 'Con tiếp theo';
  nextBtn.addEventListener('click', function () {
    if (isDone) {
      state.screen = 'forestSummary';
    } else {
      state.idx++;
      if (state.idx >= state.round.length) {
        state.round = state.round.concat(createSessionQueue(shuffle(state.forestPool)));
      }
      state.currentOptions = null;
    }
    state.answered = false;
    render();
  });
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
    '<div class="parentpage">' +
    '<div class="pheader">' +
    '<button id="backBtn" aria-label="Về trang bé">' + BACK_SVG + '</button>' +
    '<div><h1>Báo cáo học tập</h1><p class="psub">' + (profile ? profile.name : 'Bé') + ' — LV0 (chưa học) đến LV' + MAX_LEVEL + ' (đã nhớ rất lâu)</p></div>' +
    '</div>' +
    body +
    '</div>';

  document.getElementById('backBtn').addEventListener('click', function () {
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
  state.screen = getProfile(store) ? 'home' : 'onboarding';
  render();
}

boot();
