// Progress Store — bọc localStorage, có version dữ liệu để an toàn khi đổi
// cấu trúc sau này (thêm field, đổi ý nghĩa field...) mà không mất tiến độ
// đã lưu của trẻ.
//
// Giữ nguyên STORE_KEY cũ để không mất dữ liệu người chơi đã có từ bản
// trước Phase 1 (v1 lưu thẳng {wordId: {level, next, seen}} không có
// version). migrate() nhận diện dạng cũ này và bọc lại thành dạng có
// version mà không đổi giá trị bên trong.

export const STORE_KEY = 'bo-hoc-tienganh-progress-v1';
export const CURRENT_VERSION = 2;

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// Mỗi migration nhận store ở version (n-1) và trả về store ở version n.
const MIGRATIONS = {
  2: function fromV1(raw) {
    // v1: raw chính là map {wordId: {level, next, seen}}, không có "version".
    return { version: 2, words: isPlainObject(raw) ? raw : {} };
  }
};

function migrate(raw) {
  if (!isPlainObject(raw)) {
    return { version: CURRENT_VERSION, words: {} };
  }
  var store = raw;
  if (typeof store.version !== 'number') {
    store = MIGRATIONS[2](store);
  }
  for (var v = store.version + 1; v <= CURRENT_VERSION; v++) {
    if (MIGRATIONS[v]) store = MIGRATIONS[v](store);
  }
  if (!isPlainObject(store.words)) store.words = {};
  return store;
}

export function loadProgress() {
  try {
    var raw = localStorage.getItem(STORE_KEY);
    var parsed = raw ? JSON.parse(raw) : null;
    return migrate(parsed);
  } catch (e) {
    return { version: CURRENT_VERSION, words: {} };
  }
}

export function saveProgress(store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch (e) {
    // localStorage có thể bị chặn (chế độ ẩn danh, hết dung lượng...) —
    // im lặng bỏ qua, trò chơi vẫn chạy được trong phiên hiện tại.
  }
}

export function clearProgress() {
  var empty = { version: CURRENT_VERSION, words: {} };
  saveProgress(empty);
  return empty;
}

export function getWordProgress(store, id) {
  return store.words[id] || null;
}

export function setWordProgress(store, id, patch) {
  store.words[id] = patch;
  return store;
}
