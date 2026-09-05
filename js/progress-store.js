// Progress Store — bọc localStorage, có version dữ liệu để an toàn khi đổi
// cấu trúc sau này mà không mất tiến độ đã lưu của trẻ.
//
// v3 đổi cấu trúc progress mỗi từ từ "1 LV chung" sang "5 kỹ năng độc lập"
// (xem js/learning-engine.js) — đây là thay đổi không thể quy đổi ngược từ
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

export function loadProgress() {
  try {
    var raw = localStorage.getItem(STORE_KEY);
    var parsed = raw ? JSON.parse(raw) : null;
    return migrate(parsed);
  } catch (e) {
    return freshStore();
  }
}

export function saveProgress(store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch (e) {
    // localStorage có thể bị chặn (ẩn danh, hết dung lượng...) — im lặng
    // bỏ qua, trò chơi vẫn chạy được trong phiên hiện tại.
  }
}

export function clearProgress() {
  var empty = freshStore();
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
