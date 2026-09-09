// App — khung/router dùng chung: nối Content Loader + Progress Store +
// Learning Engine + AudioProvider + bộ avatar với giao diện, rồi gắn từng
// GAME (games/<slug>/) vào router theo id. Cấu trúc 3 trang thuần game
// cho trẻ em:
//   1. Trang chủ: hồ sơ bé (tên + avatar) + lưới chọn trò chơi (2 cột x 4)
//   2. Từng trò chơi: xem games/<slug>/ — mỗi game tự quản lý màn/logic
//      riêng của nó, chỉ luyện ĐÚNG 1 kỹ năng của Learning Engine
//   3. Trang phụ huynh: xem LV của từng kỹ năng (Nghe/Nói/Đọc/Viết/Nhìn)
//
// Không hiển thị số liệu học tập (số từ đã thuộc...) ở bất kỳ đâu trẻ nhìn
// thấy — chỉ trang phụ huynh mới có số liệu.

import { loadContentPacks } from './engine/content-loader.js';
import { loadProgress, saveProgress, setProfile, getProfile } from './engine/progress-store.js';
import {
  SKILLS,
  SKILL_LABELS,
  MAX_LEVEL,
  getSkillProgress,
  totalStars
} from './engine/learning-engine.js';
import { createAudioProvider } from './engine/audio-provider.js';
import { getAvatars, avatarSvg } from './engine/avatars.js';
import { starIcon, BACK_SVG, owlMascot, sleepyMascot, worldBg } from './engine/ui-shared.js';
import { createForestGame } from './games/khu-rung-ky-bi/forest.js';
import { createFarmGame } from './games/nong-trai-cua-be/farm.js';
import { createBillGame } from './games/bill/bill.js';

var CONTENT_PACKS = [
  'content/packs/colors-v1.json',
  'content/packs/animals-v1.json',
  'content/packs/numbers-v1.json',
  'content/packs/fruits-v1.json',
  'content/packs/family-v1.json',
  'content/packs/objects-v1.json'
];

var GAMES = [
  { id: 'forest', title: 'Mystic Jungle', emoji: '🦁', skill: 'listen', available: true },
  { id: 'farm', title: 'My Little Farm', emoji: '🐶', skill: 'listen', available: true },
  { id: 'bill', title: 'Help Bill!', emoji: '🎒', skill: 'listen', available: true },
  { id: 'g4', title: 'Sắp ra mắt', available: false },
  { id: 'g5', title: 'Sắp ra mắt', available: false },
  { id: 'g6', title: 'Sắp ra mắt', available: false },
  { id: 'g7', title: 'Sắp ra mắt', available: false },
  { id: 'g8', title: 'Sắp ra mắt', available: false }
];

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
  farmPool: [],
  billPool: [],
  billMood: 'happy',
  slots: [],      // 4 từ đang hiển thị trên 4 hàng, giữ nguyên xuyên suốt
  targetIdx: 0    // slot nào đang là đáp án đúng của câu hỏi hiện tại
};

function speak(text) {
  audio.speak(text, { lang: 'en-US' });
}

// Gắn 1 lần lúc khởi động — mỗi game chỉ nhận đúng những gì nó cần thay
// vì tự ý import ngược lại app.js (tránh import vòng). store/WORDS dùng
// getter vì 2 biến này bị GÁN LẠI lúc tải xong nội dung/lúc phụ huynh
// thêm từ mới qua Trang phụ huynh — truyền thẳng giá trị lúc tạo sẽ cũ.
var forestGame = createForestGame({
  state: state,
  getStore: function () { return store; },
  getWords: function () { return WORDS; },
  speak: speak,
  render: render,
  owlMascot: owlMascot
});
var farmGame = createFarmGame({
  state: state,
  getStore: function () { return store; },
  getWords: function () { return WORDS; },
  speak: speak,
  render: render,
  owlMascot: owlMascot
});
var billGame = createBillGame({
  state: state,
  getStore: function () { return store; },
  getWords: function () { return WORDS; },
  speak: speak,
  render: render,
  owlMascot: owlMascot
});

function render() {
  if (state.screen === 'loading') renderLoading();
  else if (state.screen === 'error') renderError();
  else if (state.screen === 'onboarding') renderOnboarding();
  else if (state.screen === 'home') renderHome();
  else if (state.screen === 'forest') forestGame.renderForest();
  else if (state.screen === 'forestSummary') forestGame.renderForestSummary();
  else if (state.screen === 'farm') farmGame.renderFarm();
  else if (state.screen === 'farmSummary') farmGame.renderFarmSummary();
  else if (state.screen === 'bill') billGame.renderBill();
  else if (state.screen === 'billSummary') billGame.renderBillSummary();
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
      // Mỗi game tự quyết định icon riêng của nó (vd Khu rừng kỳ bí có
      // ảnh nền + con hổ lắc lư) — app.js chỉ biết game nào ứng với id
      // nào, không biết chi tiết markup từng game.
      if (g.id === 'forest') return forestGame.gameTileHtml(g.title);
      if (g.id === 'farm') return farmGame.gameTileHtml(g.title);
      if (g.id === 'bill') return billGame.gameTileHtml(g.title);
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
    '<div class="starsbadge" title="Tổng số sao đã đạt được">' + starIcon('#FFD25A', 20, '#E4952A') + '<span>' + totalStars(store.words) + '</span></div>' +
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
    var id = tile.getAttribute('data-id');
    if (id === 'forest') forestGame.startForestGame();
    else if (id === 'farm') farmGame.startFarmGame();
    else if (id === 'bill') billGame.startBillGame();
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

// Bộ lọc "Bộ từ"/"Nhóm từ" trên bảng báo cáo — chọn kiểu tick vào ô vuông,
// chọn nhiều cùng lúc trong 1 nhóm (multi-select). id -> true/false theo
// từng bộ từ (cats) / nhóm từ (subcats). Sống suốt phiên (không reset khi
// rời rồi quay lại Trang phụ huynh) — object rỗng ở 1 nhóm nghĩa là KHÔNG
// lọc theo nhóm đó (hiện hết).
var parentFilter = { cats: {}, subcats: {} };

function parentTouchedWords() {
  return WORDS.filter(function (w) {
    return store.words[w.id] && store.words[w.id].skills &&
      SKILLS.some(function (s) { return store.words[w.id].skills[s]; });
  });
}

function parentApplyFilter(touchedWords) {
  var catKeys = Object.keys(parentFilter.cats).filter(function (k) { return parentFilter.cats[k]; });
  var subKeys = Object.keys(parentFilter.subcats).filter(function (k) { return parentFilter.subcats[k]; });
  if (!catKeys.length && !subKeys.length) return touchedWords;
  return touchedWords.filter(function (w) {
    if (catKeys.length && catKeys.indexOf(w.cat) === -1) return false;
    if (subKeys.length && subKeys.indexOf(w.subcategory) === -1) return false;
    return true;
  });
}

function parentRenderTable() {
  var touchedWords = parentTouchedWords();
  var filtered = parentApplyFilter(touchedWords);

  var rows = filtered.map(function (w) {
    var cells = SKILLS.map(function (s) {
      var p = getSkillProgress(store.words, w.id, s);
      var lv = p ? p.level : 0;
      return '<div class="lvpill" style="background:' + levelColor(lv) + '" title="' + SKILL_LABELS[s] + '">' + lv + '</div>';
    }).join('');
    var thumb = w.image ? '<img src="' + w.image + '" alt="">' : '<span>' + (w.emoji || '❓') + '</span>';
    return '<div class="wordrow"><div class="wname">' + thumb + '<span>' + w.en + '</span></div>' + cells + '</div>';
  }).join('');

  var body;
  if (filtered.length) {
    body = '<div class="skillhead"><span>Từ</span><span>Nghe</span><span>Nói</span><span>Đọc</span><span>Viết</span><span>Nhìn</span></div>' + rows;
  } else if (touchedWords.length) {
    body = '<div class="emptystate">Không có từ nào khớp bộ lọc đang chọn.</div>';
  } else {
    body = '<div class="emptystate">Bé chưa chơi trò nào cả.<br>Số liệu sẽ hiện ra ở đây sau khi bé chơi nhé!</div>';
  }
  document.getElementById('reportBody').innerHTML = body;
}

function parentFilterChip(group, item) {
  var isChecked = !!parentFilter[group][item.id];
  return '<label class="filterchip' + (isChecked ? ' checked' : '') + '">' +
    '<input type="checkbox" data-group="' + group + '" value="' + item.id + '"' + (isChecked ? ' checked' : '') + '>' +
    '<span class="fbox"></span><span class="ftext">' + (item.icon ? item.icon + ' ' : '') + item.label + ' (' + item.count + ')</span>' +
    '</label>';
}

function parentSelectedCount(group) {
  return Object.keys(parentFilter[group]).filter(function (k) { return parentFilter[group][k]; }).length;
}

// Dropdown: nút "Bộ từ ▾" / "Nhóm từ ▾" — bấm vào mới hiện danh sách ô
// vuông tick bên trong (không chiếm chỗ cố định trên trang như trước).
function parentFilterDropdown(group, title, list) {
  if (!list.length) return '';
  var count = parentSelectedCount(group);
  var rows = list.map(function (item) { return parentFilterChip(group, item); }).join('');
  return '<div class="filterdd">' +
    '<button type="button" class="filterddBtn" data-group="' + group + '">' +
    '<span class="fddLabel">' + title + '</span>' +
    (count ? '<span class="fddBadge">' + count + '</span>' : '') +
    '<span class="fddCaret">▾</span>' +
    '</button>' +
    '<div class="filterddPanel" hidden>' + rows + '</div>' +
    '</div>';
}

function parentUpdateFilterBadge(group) {
  var btn = document.querySelector('.filterddBtn[data-group="' + group + '"]');
  if (!btn) return;
  var count = parentSelectedCount(group);
  var badge = btn.querySelector('.fddBadge');
  if (count) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'fddBadge';
      btn.insertBefore(badge, btn.querySelector('.fddCaret'));
    }
    badge.textContent = String(count);
  } else if (badge) {
    badge.remove();
  }
}

// 1 handler dùng chung để đóng dropdown khi bấm ra ngoài — gỡ ra rồi gắn
// lại mỗi lần renderParent() để không cộng dồn qua nhiều lần vào/ra Trang
// phụ huynh trong 1 phiên (root.innerHTML bị thay mới mỗi lần nhưng
// listener gắn trên document thì không tự mất theo).
var parentFilterDocClickHandler = null;

function renderParent() {
  if (parentFilterDocClickHandler) {
    document.removeEventListener('click', parentFilterDocClickHandler);
    parentFilterDocClickHandler = null;
  }

  var touchedWords = parentTouchedWords();

  var catGroups = {}, subGroups = {};
  touchedWords.forEach(function (w) {
    if (!catGroups[w.cat]) catGroups[w.cat] = { id: w.cat, label: w.catLabel || w.cat, icon: w.catIcon, count: 0 };
    catGroups[w.cat].count++;
    if (w.subcategory) {
      if (!subGroups[w.subcategory]) subGroups[w.subcategory] = { id: w.subcategory, label: w.subcategoryLabel || w.subcategory, count: 0 };
      subGroups[w.subcategory].count++;
    }
  });
  var byLabel = function (a, b) { return a.label.localeCompare(b.label, 'vi'); };
  var catList = Object.keys(catGroups).map(function (k) { return catGroups[k]; }).sort(byLabel);
  var subList = Object.keys(subGroups).map(function (k) { return subGroups[k]; }).sort(byLabel);

  var filtersHtml = parentFilterDropdown('cats', 'Bộ từ', catList) + parentFilterDropdown('subcats', 'Nhóm từ', subList);

  root.innerHTML =
    '<div class="parentpage" id="parentPageRoot">' +
    '<div class="pheader" id="pHeader">' +
    '<button id="backBtn" aria-label="Về trang bé">' + BACK_SVG + '</button>' +
    '<h1>Báo cáo học tập</h1>' +
    '</div>' +
    (filtersHtml ? '<div class="reportfilters">' + filtersHtml + '</div>' : '') +
    '<div id="reportBody"></div>' +
    '</div>';

  document.getElementById('backBtn').addEventListener('click', function () {
    state.screen = 'home'; render();
  });

  Array.prototype.forEach.call(document.querySelectorAll('.filterddBtn'), function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var wrap = this.closest('.filterdd');
      var panel = wrap.querySelector('.filterddPanel');
      var wasHidden = panel.hidden;
      Array.prototype.forEach.call(document.querySelectorAll('.filterdd'), function (w) {
        w.classList.remove('ddopen');
        w.querySelector('.filterddPanel').hidden = true;
      });
      if (wasHidden) { panel.hidden = false; wrap.classList.add('ddopen'); }
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('.filterddPanel input[type=checkbox]'), function (cb) {
    cb.addEventListener('change', function () {
      var grp = this.dataset.group;
      parentFilter[grp][this.value] = this.checked;
      this.closest('label').classList.toggle('checked', this.checked);
      parentUpdateFilterBadge(grp);
      parentRenderTable();
    });
  });

  if (filtersHtml) {
    parentFilterDocClickHandler = function (e) {
      if (e.target.closest('.filterdd')) return;
      Array.prototype.forEach.call(document.querySelectorAll('.filterdd'), function (w) {
        w.classList.remove('ddopen');
        w.querySelector('.filterddPanel').hidden = true;
      });
    };
    document.addEventListener('click', parentFilterDocClickHandler);
  }

  parentRenderTable();
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
