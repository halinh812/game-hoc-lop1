// Progress Store — bọc localStorage, có version dữ liệu để an toàn khi đổi
// cấu trúc sau này mà không mất tiến độ đã lưu của trẻ.
//
// v3 đổi cấu trúc progress mỗi từ từ "1 LV chung" sang "5 kỹ năng độc lập"
// (xem engine/learning-engine.js) — đây là thay đổi không thể quy đổi ngược từ
// dữ liệu v1/v2 một cách có ý nghĩa (LV chung cũ không cho biết nó thuộc
// kỹ năng nào), nên theo quyết định của người phát triển, mọi store ở
// version < 3 bị coi là dữ liệu thử nghiệm cũ và được XOÁ SẠCH khi migrate
// — không giữ lại. Từ v3 trở đi, store còn lưu thêm hồ sơ bé (tên + avatar).

export var STORE_KEY = 'bo-hoc-tienganh-progress-v1';
export var CURRENT_VERSION = 3;

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function freshStore() {
  return { version: CURRENT_VERSION, profile: null, words: {} };
}

function migrate(raw) {
  if (!isPlainObject(raw) || raw.version !== CURRENT_VERSION) {
    return freshStore();
  }
  if (!isPlainObject(raw.words)) raw.words = {};
  if (raw.profile !== null && !isPlainObject(raw.profile)) raw.profile = null;
  return raw;
}

// ---------------- Nhiều người chơi trên cùng 1 máy ----------------
// Mỗi bé có 1 "store" (hồ sơ + tiến độ) RIÊNG, lưu ở 1 khoá localStorage
// riêng. Danh sách người chơi + ai đang chơi nằm ở PLAYERS_KEY.
//
// AN TOÀN CHO TIẾN ĐỘ CŨ: người chơi đầu tiên ('p1') dùng ĐÚNG khoá cũ
// STORE_KEY — tiến độ đã có trên máy (của Bòng) không bị di chuyển, đổi
// tên hay chép đi đâu cả. Máy chưa có danh sách người chơi thì coi như chỉ
// có 1 người là 'p1'. Người chơi thêm sau mới dùng khoá mới STORE_KEY::id.
//
// Mỗi store mang theo playerId của chính nó, và saveProgress() ghi theo
// playerId ĐÓ chứ không theo "ai đang chơi" — nên dù 1 game còn sót lời
// gọi lưu muộn sau khi đã đổi người, tiến độ vẫn không thể bị ghi nhầm
// sang hồ sơ của bé kia.
export var PLAYERS_KEY = 'bo-hoc-tienganh-players-v1';
export var FIRST_PLAYER_ID = 'p1';

export function playerStoreKey(id) {
  return !id || id === FIRST_PLAYER_ID ? STORE_KEY : STORE_KEY + '::' + id;
}

function readRegistry() {
  try {
    var raw = JSON.parse(localStorage.getItem(PLAYERS_KEY));
    if (isPlainObject(raw) && Array.isArray(raw.players) && raw.players.length) {
      var ids = raw.players.filter(function (id) { return typeof id === 'string' && id; });
      if (ids.length) {
        return { activeId: ids.indexOf(raw.activeId) !== -1 ? raw.activeId : ids[0], players: ids };
      }
    }
  } catch (e) { /* hỏng thì dùng mặc định bên dưới */ }
  return { activeId: FIRST_PLAYER_ID, players: [FIRST_PLAYER_ID] };
}

function writeRegistry(reg) {
  try {
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(reg));
  } catch (e) { /* bị chặn thì thôi, như saveProgress */ }
}

function loadPlayerStore(id) {
  var store;
  try {
    var raw = localStorage.getItem(playerStoreKey(id));
    store = migrate(raw ? JSON.parse(raw) : null);
  } catch (e) {
    store = freshStore();
  }
  store.playerId = id;
  return store;
}

// Tải store của người ĐANG chơi.
export function loadProgress() {
  return loadPlayerStore(readRegistry().activeId);
}

export function saveProgress(store) {
  try {
    var id = store.playerId || readRegistry().activeId;
    store.playerId = id;
    localStorage.setItem(playerStoreKey(id), JSON.stringify(store));
  } catch (e) {
    // localStorage có thể bị chặn (ẩn danh, hết dung lượng...) — im lặng
    // bỏ qua, trò chơi vẫn chạy được trong phiên hiện tại.
  }
}

// Danh sách người chơi (kèm store của từng bé để hiện tên/ảnh/số sao).
// Bỏ qua người chưa đặt tên (chưa có hồ sơ).
export function listPlayers() {
  var reg = readRegistry();
  return reg.players.map(function (id) {
    return { id: id, active: id === reg.activeId, store: loadPlayerStore(id) };
  }).filter(function (p) { return !!p.store.profile; });
}

// Đổi sang bé khác — trả về store của bé đó.
export function switchPlayer(id) {
  var reg = readRegistry();
  if (reg.players.indexOf(id) === -1) return loadProgress();
  reg.activeId = id;
  writeRegistry(reg);
  return loadPlayerStore(id);
}

// Thêm 1 bé mới (đã có tên + ảnh) và chuyển sang bé đó luôn.
export function addPlayer(profile) {
  var reg = readRegistry();
  var id = 'p' + Date.now().toString(36);
  while (reg.players.indexOf(id) !== -1) id += 'x';
  reg.players.push(id);
  reg.activeId = id;
  var store = freshStore();
  store.playerId = id;
  store.profile = profile;
  saveProgress(store);
  writeRegistry(reg);
  return store;
}

export function clearProgress() {
  var empty = freshStore();
  empty.playerId = readRegistry().activeId;
  saveProgress(empty);
  return empty;
}

export function getProfile(store) {
  return store.profile;
}

export function setProfile(store, profile) {
  store.profile = profile;
  saveProgress(store);
  return store;
}
