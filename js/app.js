// App — nối Content Loader + Progress Store + Learning Engine + AudioProvider
// + bộ avatar với giao diện. Cấu trúc 3 trang thuần game cho trẻ em:
//   1. Trang chủ: hồ sơ bé (tên + avatar) + lưới chọn trò chơi (2 cột x 4)
//   2. Trò chơi: "Khu rừng kỳ bí" — nghe tên tiếng Anh, bắt đúng con vật
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
  { id: 'forest', title: 'Khu rừng kỳ bí', emoji: '🦁', skill: 'listen', available: true },
  { id: 'g2', title: 'Sắp ra mắt', available: false },
  { id: 'g3', title: 'Sắp ra mắt', available: false },
  { id: 'g4', title: 'Sắp ra mắt', available: false },
  { id: 'g5', title: 'Sắp ra mắt', available: false },
  { id: 'g6', title: 'Sắp ra mắt', available: false },
  { id: 'g7', title: 'Sắp ra mắt', available: false },
  { id: 'g8', title: 'Sắp ra mắt', available: false }
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

// Linh vật "đang ngủ" cho các ô trò chơi "Sắp ra mắt" — trước đây là ổ
// khoá xám xịt chiếm 7/8 ô ở Trang chủ, nhìn như sản phẩm dở dang. Đổi
// sang 1 khuôn mặt tròn pastel đang nhắm mắt + chữ "z" bay lên, có nhịp
// thở nhẹ (CSS .sleepy) để đỡ "chết" mà vẫn rõ ràng là chưa mở khoá.
function sleepyMascot(size) {
  size = size || 40;
  return '<svg class="sleepy" width="' + size + '" height="' + size + '" viewBox="0 0 100 100" aria-hidden="true">' +
    '<circle cx="50" cy="54" r="34" fill="#C9C2E8"/>' +
    '<path d="M32 52 Q38 46 44 52" stroke="#5B5480" stroke-width="4" fill="none" stroke-linecap="round"/>' +
    '<path d="M56 52 Q62 46 68 52" stroke="#5B5480" stroke-width="4" fill="none" stroke-linecap="round"/>' +
    '<path d="M42 66 Q50 71 58 66" stroke="#5B5480" stroke-width="4" fill="none" stroke-linecap="round"/>' +
    '<ellipse cx="30" cy="64" rx="4.5" ry="3" fill="#A79BD1" opacity=".8"/><ellipse cx="70" cy="64" rx="4.5" ry="3" fill="#A79BD1" opacity=".8"/>' +
    '<text x="64" y="28" font-size="15" fill="#C9C2E8" font-family="Baloo 2,sans-serif" font-weight="700">z</text>' +
    '<text x="75" y="17" font-size="11" fill="#C9C2E8" font-family="Baloo 2,sans-serif" font-weight="700">z</text>' +
    '</svg>';
}

// photo=true: dùng ảnh nền tĩnh (assets/backgrounds/forest-bg.jpg) — chỉ
// dùng riêng cho màn chơi "Khu rừng kỳ bí" (renderForest). Mọi màn khác
// vẫn giữ nguyên nền vẽ bằng CSS/SVG (mây/mặt trời/tán cây/mặt đất).
function worldBg(photo) {
  if (photo) return '<div class="world-bg forestphoto" aria-hidden="true"></div>';
  return '<div class="world-bg" aria-hidden="true">' +
    '<div class="sun-glow"></div>' +
    '<div class="cloud c1"></div><div class="cloud c2"></div>' +
    '<div class="canopy-band"><svg viewBox="0 0 400 88" preserveAspectRatio="none">' +
    '<path d="M-10 50 Q40 14 100 46 T220 40 T340 50 T410 28 V-10 H-10 Z" fill="#8FC48A"/>' +
    '<path d="M-10 66 Q50 32 130 62 T280 54 T410 50 V-10 H-10 Z" fill="#4E8F58"/>' +
    // Cụm cây tán tròn rậm (nhiều hình tròn chồng nhau) thay cho 1 hình
    // chữ nhật thân cây trơ trọi trước đây — giống dáng cây bụi tròn trong
    // ảnh mẫu khu rừng minh hoạ.
    '<rect x="40" y="46" width="12" height="30" rx="5" fill="#7A5636"/>' +
    '<circle cx="30" cy="38" r="20" fill="#5FA766"/><circle cx="48" cy="30" r="24" fill="#6FBB74"/><circle cx="64" cy="40" r="18" fill="#5FA766"/>' +
    '<rect x="330" y="42" width="14" height="34" rx="5" fill="#6B4B2E"/>' +
    '<circle cx="318" cy="32" r="22" fill="#5FA766"/><circle cx="340" cy="24" r="26" fill="#6FBB74"/><circle cx="358" cy="36" r="20" fill="#5FA766"/>' +
    '<rect x="196" y="52" width="9" height="20" rx="4" fill="#7A5636"/><circle cx="200" cy="46" r="16" fill="#6FBB74" opacity=".9"/>' +
    '</svg></div>' +
    '<div class="ground-band"><svg viewBox="0 0 400 112" preserveAspectRatio="none">' +
    '<path d="M0 30 Q100 5 200 25 T400 15 V112 H0 Z" fill="#8FC48A" opacity=".4"/>' +
    '<path d="M0 55 Q100 35 200 50 T400 42 V112 H0 Z" fill="#4B8A57"/>' +
    '<path d="M0 78 H400 V112 H0 Z" fill="#356B44"/>' +
    // Đá cuội + hoa nhỏ ven đường — chi tiết trang trí để mặt đất đỡ trống.
    '<ellipse cx="90" cy="86" rx="16" ry="10" fill="#9A9488"/><ellipse cx="90" cy="83" rx="12" ry="6" fill="#B4AEA0"/>' +
    '<ellipse cx="300" cy="90" rx="20" ry="12" fill="#9A9488"/><ellipse cx="300" cy="86" rx="14" ry="7" fill="#B4AEA0"/>' +
    '<g><line x1="140" y1="90" x2="140" y2="78" stroke="#356B44" stroke-width="2"/><circle cx="140" cy="76" r="4" fill="#FFD25A"/></g>' +
    '<g><line x1="250" y1="94" x2="250" y2="80" stroke="#356B44" stroke-width="2"/><circle cx="250" cy="78" r="4" fill="#F4958A"/></g>' +
    '<g><line x1="60" y1="96" x2="60" y2="84" stroke="#356B44" stroke-width="2"/><circle cx="60" cy="82" r="3.5" fill="#FFD25A"/></g>' +
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

// subcategory tuỳ chọn — truyền vào để chỉ lấy đúng 1 "nhóm con" bên
// trong category đó (vd category="animal", subcategory="wild" chỉ lấy
// động vật hoang dã, bỏ qua động vật nuôi dù cùng category).
function wordsInCat(catId, subcategory) {
  return WORDS.filter(function (w) {
    if (w.cat !== catId) return false;
    if (subcategory && w.subcategory !== subcategory) return false;
    return true;
  });
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
      // Riêng ô "Khu rừng kỳ bí": nền là ảnh crop nhỏ của ảnh nền trong
      // game (assets/backgrounds/forest-bg.jpg) + mặt con hổ (crop từ
      // assets/animals/tiger.png, lắc lư nhẹ) thay cho emoji 🦁 phẳng.
      if (g.id === 'forest') {
        return '<button type="button" class="gametile forest-tile" data-id="' + g.id + '">' +
          '<span class="foresttile-face"><img src="assets/animals/tiger.png" alt=""></span>' +
          '<span class="name">' + g.title + '</span></button>';
      }
      return '<button type="button" class="gametile" data-id="' + g.id + '">' +
        '<span class="emoji">' + g.emoji + '</span><span class="name">' + g.title + '</span></button>';
    }
    return '<div class="gametile locked">' + sleepyMascot(40) + '<span class="name">' + g.title + '</span></div>';
  }).join('');

  root.innerHTML = worldBg() +
    '<div class="content">' +
    '<div class="profilebar">' +
    '<button type="button" class="avatarcircle" id="avatarEditBtn" aria-label="Đổi hồ sơ">' + avatarSvg(profile.avatarId, 44) + '</button>' +
    '<div class="greet">Chào ' + profile.name + '! <span>Chọn trò chơi để bắt đầu nhé</span></div>' +
    '</div>' +
    '<div class="gamegrid" id="gameGrid">' + tiles + '</div>' +
    '<div class="homemascot">' + owlMascot(72) + '</div>' +
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

// ---------------- Trò chơi: Khu rừng kỳ bí ----------------

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
  // Chỉ lấy động vật hoang dã — trò "vật nuôi" (chưa làm) sẽ lấy
  // subcategory="pet" cùng category="animal" riêng, không lẫn vào đây.
  state.forestPool = wordsInCat('animal', 'wild');
  state.slots = buildRound(state.forestPool, store.words, 'listen', { size: 4 });
  state.targetIdx = pickTargetIndex(state.slots);
  state.correct = 0;
  state.answered = false;
  state.screen = 'forest';
  render();
}

// Ảnh tĩnh hoặc video lặp (nếu từ có "video") cho 1 ô — object-fit:contain
// (CSS) tự co vừa ô, giữ đúng tỉ lệ khung hình gốc. Bọc trong span
// .tileswing để có hiệu ứng "lắc lư nhẹ nhàng" tại chỗ (CSS, xem
// index.html) — không cho con vật chạy/di chuyển vị trí, chỉ đứng yên và
// đung đưa như đang thở, theo đúng yêu cầu (đã thử "chạy" ở các vòng
// trước và bị chê rối).
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
  speak('Catch the ' + w.en + '!');
}

// Chuông "ting" 2 nốt lên cao khi bấm đúng — tự tổng hợp bằng Web Audio,
// không cần file âm thanh riêng. Trước đây bấm đúng chỉ đổi màu viền +
// 1 dòng chữ nhỏ, gần như không có gì "ăn mừng" thật sự.
var sharedAudioCtx = null;
function playDing() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    if (!sharedAudioCtx) sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var ctx = sharedAudioCtx;
    var now = ctx.currentTime;
    [880, 1318.5].forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      var start = now + i * 0.09;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  } catch (e) { /* Web Audio không khả dụng — bỏ qua, không phá UI */ }
}

// Bắn vài hạt "ăn mừng" nhỏ từ chính ô vừa bấm đúng rồi tự dọn — khác với
// confetti rơi từ trên xuống ở màn thắng cả ván (.fall), đây là phản hồi
// tức thời ngay tại chỗ cho MỖI câu trả lời đúng.
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
  // vị trí ngẫu nhiên đó và lắc lư nhẹ. Chỉ đúng 1 ô (ô vừa được hỏi) bị
  // đổi con + đổi vị trí mới sau mỗi câu, 3 ô kia giữ nguyên DOM (xem
  // advanceForestRound) — quan trọng với ô có <video>: nếu dựng lại toàn
  // bộ innerHTML mỗi câu, video của các ô KHÔNG đổi cũng bị tạo lại từ
  // đầu và chạy lại từ giây 0, giật hình mỗi lượt.
  var tiles = state.slots.map(function (w, i) {
    return '<div class="freetile" data-idx="' + i + '">' + forestTileMedia(w) + '</div>';
  }).join('');

  root.innerHTML = worldBg(true) +
    '<div class="content">' +
    '<div class="topbar">' +
    '<button class="iconbtn" id="homeBtn" aria-label="Về trang chủ">' + CLOSE_SVG + '</button>' +
    '<div class="starsrow" id="forestStars" style="margin:0;">' + forestStarsRow() + '</div>' +
    '<span style="width:38px;"></span>' +
    '</div>' +
    '<div class="freeplay" id="freeplayArea">' + tiles + '</div>' +
    '<div class="glasscard" id="feedbackBubble" style="display:none;"><p id="feedbackText" style="margin:0;font-weight:600;font-size:.9rem;"></p></div>' +
    '<button class="soundbtn" id="speakBtn" aria-label="Nghe lại">' + SPEAK_SVG + '</button>' +
    '</div>';

  document.getElementById('homeBtn').addEventListener('click', function () {
    state.screen = 'home'; render();
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

  var tileEls = document.getElementById('freeplayArea').querySelectorAll('.freetile');
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
    playDing();
    celebrateTile(tileEls[idx]);
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

  var tileEls = document.getElementById('freeplayArea').querySelectorAll('.freetile');
  Array.prototype.forEach.call(tileEls, function (el) { el.classList.remove('wrong', 'correct'); });
  tileEls[replaceIdx].innerHTML = forestTileMedia(state.slots[replaceIdx]);
  forestPositionTile(tileEls[replaceIdx], replaceIdx);

  document.getElementById('feedbackBubble').style.display = 'none';
  document.getElementById('forestStars').innerHTML = forestStarsRow();

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
    '<div class="pheader" id="pHeader">' +
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
  var header = document.getElementById('pHeader');
  if (!container || !header) return;
  cmState.category = packs[0].category;

  var catOptions = packs.map(function (p) {
    return '<option value="' + p.category + '">' + (p.icon || '') + ' ' + p.label + '</option>';
  }).join('');

  header.insertAdjacentHTML('beforeend',
    '<button class="cmFabBtn" id="cmOpenBtn" aria-label="Thêm từ vựng">+</button>'
  );

  container.insertAdjacentHTML('beforeend',
    '<div class="cmOverlay" id="cmOverlay" hidden>' +
    '<div class="cmModal">' +
    '<div class="cmModalHead"><h2>Thêm / sửa từ vựng</h2>' +
    '<button class="cmCloseBtn" id="cmCloseBtn" aria-label="Đóng">✕</button></div>' +
    '<div class="contentmgr" id="cmSection">' +
    '<label for="cmCategory">Bộ từ</label>' +
    '<select id="cmCategory">' + catOptions + '</select>' +
    '<label for="cmSubcategory">Nhóm từ</label>' +
    '<select id="cmSubcategory"></select>' +
    '<div id="cmNewSubcatRow" style="display:none;">' +
    '<label for="cmNewSubcatLabel">Tên nhóm từ mới</label>' +
    '<input type="text" id="cmNewSubcatLabel" placeholder="vd: Động vật nuôi">' +
    '<p class="hint" id="cmNewSubcatIdHint"></p>' +
    '</div>' +
    '<label for="cmItem">Từ <span id="cmItemCount" class="badge"></span></label>' +
    '<select id="cmItem"></select>' +
    '<div id="cmIdRow" style="display:none;">' +
    '<label for="cmId">Mã từ (id)</label>' +
    '<input type="text" id="cmId" placeholder="vd: red_panda">' +
    '</div>' +
    '<div class="row2">' +
    '<div><label for="cmEn">Tiếng Anh</label><input type="text" id="cmEn" placeholder="vd: red panda"></div>' +
    '<div><label for="cmVi">Tiếng Việt</label><input type="text" id="cmVi" placeholder="vd: gấu trúc đỏ"></div>' +
    '</div>' +
    '<label>Ảnh/video hiện có</label>' +
    '<div class="preview" id="cmPreview"></div>' +
    '<div class="row2">' +
    '<div><label for="cmImage">Ảnh mới</label><input type="file" id="cmImage" accept="image/*"></div>' +
    '<div><label for="cmVideo">Video mới</label><input type="file" id="cmVideo" accept="video/*"></div>' +
    '</div>' +
    '<div class="cmBtnRow">' +
    '<button class="savebtn" id="cmSaveBtn">💾 Lưu</button>' +
    '<button class="pubbtn" id="cmPublishBtn">🚀 Xuất bản</button>' +
    '</div>' +
    '<div id="cmSaveMsg"></div>' +
    '<pre class="log" id="cmPublishLog" style="display:none;"></pre>' +
    '</div>' +
    '</div>' +
    '</div>'
  );

  var overlay = document.getElementById('cmOverlay');
  document.getElementById('cmOpenBtn').addEventListener('click', function () { overlay.hidden = false; });
  document.getElementById('cmCloseBtn').addEventListener('click', function () { overlay.hidden = true; });
  overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.hidden = true; });

  document.getElementById('cmCategory').addEventListener('change', function () {
    cmState.category = this.value;
    cmLoadItems();
  });
  document.getElementById('cmSubcategory').addEventListener('change', cmOnSubcategoryChange);
  document.getElementById('cmNewSubcatLabel').addEventListener('input', function () {
    var hint = document.getElementById('cmNewSubcatIdHint');
    hint.textContent = this.value.trim() ? ('Mã nhóm: ' + cmSlugify(this.value)) : '';
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
var CM_NO_SUBCAT = '__none__';
var CM_NEW_SUBCAT = '__newsub__';
var cmItems = [];
var cmSubcatMap = {}; // id -> { id, label, count } — cho từ có sẵn trong bộ từ đang chọn

function cmSlugify(s) {
  // "đ/Đ" không bị NFD tách dấu như các chữ có dấu khác (nó là 1 chữ cái
  // riêng trong Unicode, không phải chữ La-tinh + dấu) — phải tự thay
  // trước, nếu không nó biến mất hẳn khỏi kết quả thay vì thành "d"
  // (vd "Động vật nuôi" ra "ong_vat_nuoi" thay vì "dong_vat_nuoi").
  return (s || '').toLowerCase().trim()
    .replace(/đ/g, 'd')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

async function cmLoadItems() {
  cmItems = await fetch('/api/packs/' + cmState.category + '/items').then(function (r) { return r.json(); });
  cmRebuildSubcategorySelect();
  cmOnSubcategoryChange();
}

// "Nhóm con" là bước lọc/duyệt trước khi chọn Từ — giống hệt cách chọn
// Bộ từ rồi mới chọn Từ, chỉ thêm 1 tầng nữa. Từ chưa gắn nhóm con nào
// (các bộ từ khác ngoài Con vật) gộp vào "— Chưa phân nhóm —" để vẫn
// duyệt/sửa được bình thường.
function cmRebuildSubcategorySelect() {
  var groups = {};
  var noneCount = 0;
  cmItems.forEach(function (it) {
    if (it.subcategory) {
      if (!groups[it.subcategory]) groups[it.subcategory] = { id: it.subcategory, label: it.subcategoryLabel || it.subcategory, count: 0 };
      groups[it.subcategory].count++;
    } else {
      noneCount++;
    }
  });
  cmSubcatMap = groups;
  var list = Object.keys(groups).map(function (k) { return groups[k]; });
  list.sort(function (a, b) { return a.label.localeCompare(b.label, 'vi'); });

  var options = list.map(function (g) {
    return '<option value="' + g.id + '">' + g.label + ' (' + g.count + ')</option>';
  });
  options.push('<option value="' + CM_NO_SUBCAT + '">— Chưa phân nhóm — (' + noneCount + ')</option>');
  options.push('<option value="' + CM_NEW_SUBCAT + '">➕ Thêm nhóm mới</option>');

  var sel = document.getElementById('cmSubcategory');
  sel.innerHTML = options.join('');
  sel.value = list.length ? list[0].id : CM_NO_SUBCAT;
}

function cmOnSubcategoryChange() {
  var sel = document.getElementById('cmSubcategory');
  var newRow = document.getElementById('cmNewSubcatRow');
  var isNewSubcat = sel.value === CM_NEW_SUBCAT;
  newRow.style.display = isNewSubcat ? '' : 'none';
  if (isNewSubcat) document.getElementById('cmNewSubcatLabel').value = '';

  var filtered = isNewSubcat ? []
    : sel.value === CM_NO_SUBCAT ? cmItems.filter(function (it) { return !it.subcategory; })
    : cmItems.filter(function (it) { return it.subcategory === sel.value; });

  document.getElementById('cmItemCount').textContent = filtered.length + ' từ';
  var options = ['<option value="' + CM_NEW_VALUE + '">➕ Thêm từ mới</option>']
    .concat(filtered.map(function (it) { return '<option value="' + it.id + '">' + it.vi + ' (' + it.en + ')</option>'; }));
  document.getElementById('cmItem').innerHTML = options.join('');
  cmApplySelectedItem();
}

function cmApplySelectedItem() {
  var itemSelect = document.getElementById('cmItem');
  var idRow = document.getElementById('cmIdRow');
  var idInput = document.getElementById('cmId');
  var enInput = document.getElementById('cmEn');
  var viInput = document.getElementById('cmVi');

  if (itemSelect.value === CM_NEW_VALUE) {
    idRow.style.display = '';
    idInput.value = '';
    idInput.dataset.touched = '';
    enInput.value = '';
    viInput.value = '';
    cmRenderPreview(null);
    return;
  }
  idRow.style.display = 'none';
  var item = cmItems.find(function (it) { return it.id === itemSelect.value; });
  if (!item) return;
  enInput.value = item.en;
  viInput.value = item.vi;
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

  var subcatSel = document.getElementById('cmSubcategory').value;
  var subcategoryId = '';
  var subcategoryLabel = '';
  if (subcatSel === CM_NEW_SUBCAT) {
    var newLabel = document.getElementById('cmNewSubcatLabel').value.trim();
    if (!newLabel) { cmShowMsg('Cần nhập tên cho nhóm con mới.', 'err'); return; }
    subcategoryId = cmSlugify(newLabel);
    subcategoryLabel = newLabel;
  } else if (subcatSel !== CM_NO_SUBCAT) {
    subcategoryId = subcatSel;
    subcategoryLabel = (cmSubcatMap[subcatSel] && cmSubcatMap[subcatSel].label) || subcatSel;
  } // CM_NO_SUBCAT -> để trống, không gắn nhóm con

  var form = new FormData();
  form.set('category', cmState.category);
  form.set('id', id);
  form.set('text_en', document.getElementById('cmEn').value.trim());
  form.set('text_vi', document.getElementById('cmVi').value.trim());
  // Không còn ô "Độ khó" trên giao diện — độ khó của từ do trò chơi tự
  // quyết định lúc chơi (không phải người nhập), nên không gửi field này:
  // server mặc định 1 khi thêm từ mới, và giữ nguyên giá trị cũ khi sửa từ
  // có sẵn (xem tools/admin-server.mjs).
  if (subcategoryId) {
    form.set('subcategory', subcategoryId);
    form.set('subcategory_label_vi', subcategoryLabel);
  }
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
    // cmLoadItems() dựng lại danh sách nhóm con từ đầu (mặc định chọn
    // nhóm đầu tiên) — chọn lại đúng nhóm vừa lưu vào rồi mới chọn từ,
    // để không bị "nhảy" sang nhóm khác sau khi lưu.
    if (subcategoryId) {
      document.getElementById('cmSubcategory').value = subcategoryId;
    } else {
      document.getElementById('cmSubcategory').value = CM_NO_SUBCAT;
    }
    cmOnSubcategoryChange();
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
