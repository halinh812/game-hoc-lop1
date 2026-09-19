// Game "Bunny Run Home" (Đưa thỏ con về tổ) — luyện kỹ năng "Nghe"
// (skill=listen) trên vốn từ HƯỚNG ĐI (4 từ: up/down/left/right, xem
// content/packs/directions-v1.json — bộ từ MỚI tạo riêng cho game này,
// chưa game nào khác dùng).
//
// CƠ CHẾ — khác hẳn 8 game trước (đều là "nghe/nhìn 1 từ rồi bấm đúng 1
// trong N ô đang hiện"): đây là game ĐIỀU KHIỂN NHÂN VẬT trong mê cung.
// Thỏ con đứng trên 1 lưới ô vuông, phải đi đúng đường mòn về tổ. Mỗi
// vòng app đọc 1 hiệu lệnh tiếng Anh ("Go left."), bé bấm 1 trong 4 nút
// mũi tên (lên/xuống/trái/phải):
//   - ĐÚNG  -> thỏ nhảy sang ô tiếp theo, reo lên 1 câu tiếng Anh vui
//              ("Yay!", "Good job!"...), sáng thêm 1 ngôi sao.
//   - SAI   -> con cáo nhảy ra hù (rung + tiếng "buzz"), rồi TỰ ẨN ĐI;
//              thỏ đứng yên, hiệu lệnh cũ được đọc lại và nút ĐÚNG phát
//              sáng gợi ý để bé không bị kẹt mãi ở 1 bước.
// Đủ 10 bước đúng = về tới tổ = thắng.
//
// VÌ SAO HƯỚNG TUYỆT ĐỐI (lên/xuống/trái/phải theo màn hình) chứ không
// phải hướng TƯƠNG ĐỐI (rẽ trái/phải theo hướng thỏ đang quay): hướng
// tương đối bắt bé phải xoay hình trong đầu theo hướng nhân vật — việc
// này khó thật sự với trẻ 6-7 tuổi và sẽ biến game dạy TỪ VỰNG thành bài
// tập xoay hình. 4 nút mũi tên khớp 1-1 với 4 hướng trên màn hình, đúng
// yêu cầu "ấn 4 nút lên xuống trái phải theo hiệu lệnh", nên thứ bé phải
// nghĩ chỉ còn đúng 1 thứ cần học: từ tiếng Anh vừa nghe nghĩa là hướng
// nào. Thỏ vẫn QUAY MẶT theo hướng vừa đi (lật ngang) cho sinh động, còn
// hướng đi thì luôn tuyệt đối.
//
// TOÀN BỘ hình vẽ (thỏ, cáo, tổ, đường mòn, bụi cỏ) là SVG nội tuyến —
// KHÔNG cần chờ ảnh AI nào cả, game chạy đầy đủ ngay (giống cách
// butterflygarden.js làm ở Vòng 47, khác kitchen.js vốn bắt buộc phải có
// ảnh nền thật mới đo được toạ độ vùng bấm).
//
// Không tự lấy state/store/WORDS từ app.js (tránh import vòng) — xem giải
// thích chi tiết hơn ở đầu games/khu-rung-ky-bi/forest.js.
import { wordsInCat } from '../../engine/content-loader.js';
import { applyAnswer, classifyAnswer, getSkillProgress, wrongRate, shuffle } from '../../engine/learning-engine.js';
import { saveProgress } from '../../engine/progress-store.js';
import { starIcon, CLOSE_SVG, SPEAK_SVG, worldBg, speakThenProceed } from '../../engine/ui-shared.js';

// Lưới 5 cột × 6 hàng: cao hơn rộng để vừa khít màn hình dọc của điện
// thoại, và đủ 30 ô để luôn tìm được đường đi 10 bước không tự cắt vào
// chính nó (xem buildBunnyPath).
export var BUNNY_COLS = 5;
export var BUNNY_ROWS = 6;
// 10 bước = 10 câu hỏi = 10 ngôi sao, thống nhất với mọi game khác.
export var BUNNY_WIN_TARGET = 10;
// Không cho quá 2 bước LIÊN TIẾP cùng 1 hướng: 3 lần "Go up" liền nhau
// vừa chán vừa dễ bị hiểu nhầm là game bị lỗi lặp (đúng loại phản hồi
// người dùng đã gặp ở Butterfly Garden — xem Vòng 54/55 trong ROADMAP.md).
var BUNNY_MAX_SAME_RUN = 2;

export var BUNNY_DIRS = [
  { id: 'up', dc: 0, dr: -1 },
  { id: 'down', dc: 0, dr: 1 },
  { id: 'left', dc: -1, dr: 0 },
  { id: 'right', dc: 1, dr: 0 }
];

// Đường đi dự phòng CỐ ĐỊNH — chỉ dùng nếu tìm đường ngẫu nhiên thất bại
// hoàn toàn (trên lưới 5×6 thì không xảy ra, nhưng thà có đường xấu còn
// hơn màn chơi trắng). Đã kiểm tay: 11 ô đều khác nhau, nằm trong lưới,
// đủ cả 4 hướng, không quá 2 bước cùng hướng liên tiếp.
var BUNNY_FALLBACK_START = { c: 0, r: 5 };
var BUNNY_FALLBACK_MOVES = ['up', 'up', 'right', 'right', 'down', 'right', 'right', 'up', 'up', 'left'];

function dirById(id) {
  for (var i = 0; i < BUNNY_DIRS.length; i++) {
    if (BUNNY_DIRS[i].id === id) return BUNNY_DIRS[i];
  }
  return null;
}

function cellKey(cell) { return cell.c + ',' + cell.r; }

function countDistinct(moves) {
  var seen = {};
  moves.forEach(function (m) { seen[m] = true; });
  return Object.keys(seen).length;
}

// Có đúng "run" bước cuối cùng đều là hướng dirId hay không — dùng để chặn
// chuỗi cùng hướng dài quá BUNNY_MAX_SAME_RUN.
function tailIsAll(moves, dirId, run) {
  if (moves.length < run) return false;
  for (var i = moves.length - run; i < moves.length; i++) {
    if (moves[i] !== dirId) return false;
  }
  return true;
}

// Thứ tự THỬ 4 hướng ở mỗi bước. Trộn ngẫu nhiên, nhưng cộng điểm ưu tiên
// cho: (1) hướng CHƯA xuất hiện lần nào trong đường đi đang dựng — để cả 4
// từ đều được hỏi thay vì đường đi chỉ toàn 2 hướng (bài học xương máu từ
// Butterfly Garden: kho từ nhỏ mà thuật toán chọn thiên lệch thì bé không
// bao giờ gặp các từ còn lại — xem Vòng 55); (2) từ bé đang YẾU (tỉ lệ sai
// cao / đã tới hạn ôn), đúng tinh thần ôn tập ngắt quãng của Learning
// Engine. Điểm ngẫu nhiên vẫn được cộng vào để 2 ván không bao giờ giống
// hệt nhau.
// (3) TRỪ điểm ô nào nằm sát cạnh 1 ô đã đi qua trước đó (không tính ô
// đang đứng): đường đi tự ép sát vào chính mình tuy vẫn hợp lệ nhưng vẽ
// ra nhìn thành 1 MẢNG đất to bè, không còn ra hình "con đường mòn" cho bé
// dõi theo. Đây chỉ là ƯU TIÊN mềm (trừ điểm), không phải điều cấm — nếu
// hết lựa chọn đẹp thì vẫn đi được, nên quay lui vẫn luôn tìm ra đường.
function orderedDirs(rng, weights, movesSoFar, cells, visited) {
  var used = {};
  movesSoFar.forEach(function (m) { used[m] = true; });
  var cur = cells[cells.length - 1];
  return BUNNY_DIRS.map(function (d) {
    var score = (weights && weights[d.id] ? weights[d.id] : 1) + rng();
    if (!used[d.id]) score += 2.5;

    var next = { c: cur.c + d.dc, r: cur.r + d.dr };
    var touching = 0;
    BUNNY_DIRS.forEach(function (n) {
      var side = { c: next.c + n.dc, r: next.r + n.dr };
      if (side.c === cur.c && side.r === cur.r) return;
      if (visited[cellKey(side)]) touching++;
    });
    score -= touching * 1.2;

    return { dir: d, score: score };
  }).sort(function (a, b) {
    return b.score - a.score;
  }).map(function (s) { return s.dir; });
}

// Tìm 1 đường đi KHÔNG TỰ CẮT dài đúng "steps" bước, xuất phát từ 1 ô cho
// trước, bằng quay lui (DFS + backtracking). Quay lui là điểm mấu chốt:
// đi tham lam ngẫu nhiên có thể tự dồn mình vào góc cụt rồi phải bỏ cuộc,
// còn quay lui thì CHẮC CHẮN tìm ra đường nếu đường đó tồn tại — không
// cần vòng lặp "thử lại tới khi may mắn" (dễ treo, khó kiểm chứng).
function searchBunnyPath(start, cols, rows, steps, rng, weights) {
  var visited = {};
  var cells = [start];
  var moves = [];
  visited[cellKey(start)] = true;

  function walk() {
    if (moves.length === steps) return true;
    var options = orderedDirs(rng, weights, moves, cells, visited);
    for (var i = 0; i < options.length; i++) {
      var d = options[i];
      if (tailIsAll(moves, d.id, BUNNY_MAX_SAME_RUN)) continue;
      var cur = cells[cells.length - 1];
      var next = { c: cur.c + d.dc, r: cur.r + d.dr };
      if (next.c < 0 || next.c >= cols || next.r < 0 || next.r >= rows) continue;
      var k = cellKey(next);
      if (visited[k]) continue;

      visited[k] = true;
      cells.push(next);
      moves.push(d.id);
      if (walk()) return true;
      visited[k] = false;
      cells.pop();
      moves.pop();
    }
    return false;
  }

  return walk() ? { cells: cells, moves: moves } : null;
}

// Dựng mê cung cho 1 ván: trả về { cells, moves } với cells.length =
// moves.length + 1 (ô xuất phát + 1 ô cho mỗi bước), ô cuối cùng là TỔ.
// Tách hẳn thành hàm THUẦN (không đụng DOM, không đụng ctx) và export ra
// ngoài để unit test chạy được bằng Node — xem tools/test-learning-engine.mjs.
export function buildBunnyPath(opts) {
  opts = opts || {};
  var cols = opts.cols || BUNNY_COLS;
  var rows = opts.rows || BUNNY_ROWS;
  var steps = opts.steps || BUNNY_WIN_TARGET;
  var rng = opts.rng || Math.random;
  var weights = opts.weights || null;

  // Thử nhiều lần với ô xuất phát khác nhau, NHẬN NGAY đường đầu tiên dùng
  // đủ cả 4 hướng; nếu hết lượt thử thì lấy đường nhiều hướng nhất đã tìm
  // được (vẫn là đường hợp lệ, chỉ kém đa dạng hơn).
  var best = null;
  for (var attempt = 0; attempt < 14; attempt++) {
    var start = {
      c: Math.floor(rng() * cols),
      r: Math.floor(rng() * rows)
    };
    var found = searchBunnyPath(start, cols, rows, steps, rng, weights);
    if (!found) continue;
    if (countDistinct(found.moves) === 4) return found;
    if (!best || countDistinct(found.moves) > countDistinct(best.moves)) best = found;
  }
  if (best) return best;

  var cells = [BUNNY_FALLBACK_START];
  BUNNY_FALLBACK_MOVES.forEach(function (id) {
    var d = dirById(id);
    var cur = cells[cells.length - 1];
    cells.push({ c: cur.c + d.dc, r: cur.r + d.dr });
  });
  return { cells: cells, moves: BUNNY_FALLBACK_MOVES.slice() };
}

export function createBunnyMazeGame(ctx) {
  var root = document.getElementById('root');
  var state = ctx.state;

  // Câu reo vui của thỏ khi bé bấm ĐÚNG. Cố ý NGẮN: mỗi vòng đã có 1 câu
  // hiệu lệnh phải đọc rồi, câu khen dài nữa sẽ làm nhịp chơi ì ạch (và
  // phải chờ đọc xong mới chuyển vòng — xem speakThenProceed). Đều là câu
  // khen tiếng Anh thật, nghe nhiều thành quen.
  var BUNNY_PRAISES = ['Yay!', 'Good job!', 'Well done!', 'Nice!', 'Hooray!'];

  // Rút câu khen theo kiểu "túi xoay vòng": hết 5 câu mới trộn túi mới, nên
  // không bao giờ khen trùng câu 2 vòng liền nhau (cùng cách đã dùng để sửa
  // lỗi lặp của Butterfly Garden ở Vòng 55).
  function nextPraise() {
    if (!state.bunnyPraiseBag || !state.bunnyPraiseBag.length) {
      state.bunnyPraiseBag = shuffle(BUNNY_PRAISES);
    }
    return state.bunnyPraiseBag.shift();
  }

  // Điểm ưu tiên của từng hướng khi dựng đường đi: từ hay sai / đã tới hạn
  // ôn thì được đi qua nhiều hơn.
  function directionWeights() {
    var store = ctx.getStore();
    var now = Date.now();
    var weights = {};
    BUNNY_DIRS.forEach(function (d) {
      var p = getSkillProgress(store.words, d.id, 'listen');
      var due = (p && p.seen && p.next <= now) ? 0.8 : 0;
      weights[d.id] = 1 + wrongRate(p) * 2 + due;
    });
    return weights;
  }

  // Bộ từ hướng đi, tra theo id. Nếu vì lý do nào đó content pack chưa nạp
  // được (chỉ pack này lỗi, các pack khác vẫn chạy nên app không vào màn
  // báo lỗi), dựng tạm 1 từ tối thiểu để game vẫn đọc/chấm điểm được thay
  // vì vỡ màn hình.
  function buildWordMap() {
    var map = {};
    wordsInCat(ctx.getWords(), 'direction').forEach(function (w) { map[w.id] = w; });
    BUNNY_DIRS.forEach(function (d) {
      if (!map[d.id]) map[d.id] = { id: d.id, en: d.id, promptAudioText: 'Go ' + d.id + '.' };
    });
    return map;
  }

  function currentMoveId() {
    return state.bunnyPath.moves[state.bunnyStep];
  }

  function startBunnyMazeGame() {
    state.bunnyWords = buildWordMap();
    state.bunnyPath = buildBunnyPath({ weights: directionWeights() });
    state.bunnyStep = 0;
    state.bunnyFacing = 'right';
    state.bunnyBusy = false;
    state.bunnyPraiseBag = null;
    state.correct = 0;
    state.answered = false;
    state.screen = 'bunnymaze';
    ctx.render();
  }

  function bunnyStarsRow() {
    var row = '';
    for (var i = 0; i < BUNNY_WIN_TARGET; i++) {
      var lit = i < state.correct;
      var starMarkup = starIcon(lit ? '#FFD25A' : 'rgba(255,255,255,.55)', 16, 'rgba(35,58,42,.35)');
      row += starMarkup.replace('<svg ', '<svg class="' + (lit ? 'lit' : '') + '" ');
    }
    return row;
  }

  // ---------- hình vẽ (SVG nội tuyến, không dùng ảnh ngoài) ----------

  function bunnySvg() {
    return '<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">' +
      '<ellipse cx="50" cy="92" rx="26" ry="5" fill="rgba(20,40,25,.22)"/>' +
      '<path d="M36 46 C30 30 30 12 38 10 C46 8 46 28 44 46 Z" fill="#FFFDF7" stroke="#8A7A6B" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M39 40 C35 28 35 16 39 15 C43 14 42 28 42 40 Z" fill="#F7B7C6"/>' +
      '<path d="M62 46 C70 31 72 14 64 11 C56 8 54 28 54 46 Z" fill="#FFFDF7" stroke="#8A7A6B" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M61 41 C65 29 66 17 62 16 C58 15 58 29 58 41 Z" fill="#F7B7C6"/>' +
      '<circle cx="76" cy="66" r="9" fill="#FFFDF7" stroke="#8A7A6B" stroke-width="2.2"/>' +
      '<ellipse cx="50" cy="66" rx="27" ry="25" fill="#FFFDF7" stroke="#8A7A6B" stroke-width="2.6"/>' +
      '<ellipse cx="50" cy="74" rx="17" ry="15" fill="#FFF3E4"/>' +
      '<circle cx="40" cy="60" r="4.2" fill="#3B2F28"/>' +
      '<circle cx="41.4" cy="58.4" r="1.5" fill="#fff"/>' +
      '<circle cx="60" cy="60" r="4.2" fill="#3B2F28"/>' +
      '<circle cx="61.4" cy="58.4" r="1.5" fill="#fff"/>' +
      '<ellipse cx="50" cy="68" rx="4" ry="3" fill="#F0899F"/>' +
      '<path d="M50 71 L50 75 M50 75 Q45 79 41 76 M50 75 Q55 79 59 76" stroke="#8A7A6B" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="31" cy="66" rx="5" ry="3.4" fill="#F7B7C6" opacity=".75"/>' +
      '<ellipse cx="69" cy="66" rx="5" ry="3.4" fill="#F7B7C6" opacity=".75"/>' +
      '</svg>';
  }

  function foxSvg() {
    return '<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">' +
      '<path d="M18 40 L14 12 L38 26 Z" fill="#E4713F" stroke="#A9431F" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M22 34 L20 20 L32 28 Z" fill="#3B2F28"/>' +
      '<path d="M82 40 L86 12 L62 26 Z" fill="#E4713F" stroke="#A9431F" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M78 34 L80 20 L68 28 Z" fill="#3B2F28"/>' +
      '<path d="M50 24 C74 24 86 42 86 58 C86 78 70 92 50 92 C30 92 14 78 14 58 C14 42 26 24 50 24 Z" fill="#EE7F45" stroke="#A9431F" stroke-width="2.6"/>' +
      '<path d="M50 56 C62 56 72 66 72 78 C72 86 62 92 50 92 C38 92 28 86 28 78 C28 66 38 56 50 56 Z" fill="#FFF6EC"/>' +
      '<path d="M30 52 Q38 46 46 52" stroke="#3B2F28" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<path d="M54 52 Q62 46 70 52" stroke="#3B2F28" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<circle cx="38" cy="60" r="4.6" fill="#3B2F28"/><circle cx="62" cy="60" r="4.6" fill="#3B2F28"/>' +
      '<ellipse cx="50" cy="72" rx="6" ry="4.6" fill="#3B2F28"/>' +
      '<path d="M40 82 Q50 88 60 82" stroke="#3B2F28" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '</svg>';
  }

  // Tổ thỏ = cái hang tròn ấm cúng trong gò cỏ, có củ cà rốt bên cạnh cho
  // bé nhận ra ngay "đây là đích cần tới".
  function nestSvg() {
    return '<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">' +
      '<ellipse cx="50" cy="72" rx="44" ry="26" fill="#6BAE6B"/>' +
      '<ellipse cx="50" cy="68" rx="36" ry="21" fill="#84C47F"/>' +
      '<path d="M22 74 A28 28 0 0 1 78 74 Z" fill="#6B4A31"/>' +
      '<path d="M29 74 A21 21 0 0 1 71 74 Z" fill="#3A2A1D"/>' +
      '<path d="M62 60 L70 44 L76 47 L68 62 Z" fill="#E88A2E"/>' +
      '<path d="M70 44 Q72 36 79 34 Q76 41 74 45 Z" fill="#4E9A54"/>' +
      '<circle cx="38" cy="50" r="4" fill="#FFD25A"/><circle cx="26" cy="58" r="3" fill="#F4958A"/>' +
      '</svg>';
  }

  var ARROW_PATHS = {
    up: 'M12 5 L20 15 H15 V20 H9 V15 H4 Z',
    down: 'M12 20 L4 10 H9 V5 H15 V10 H20 Z',
    left: 'M5 12 L15 4 V9 H20 V15 H15 V20 Z',
    right: 'M20 12 L10 20 V15 H5 V9 H10 V4 Z'
  };

  function arrowSvg(dirId) {
    return '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">' +
      '<path d="' + ARROW_PATHS[dirId] + '" fill="currentColor"/></svg>';
  }

  var DIR_LABEL_VI = { up: 'lên trên', down: 'xuống dưới', left: 'sang trái', right: 'sang phải' };

  // ---------- dựng màn chơi ----------

  function cellStyle(cell) {
    return 'left:' + (cell.c * 100 / BUNNY_COLS) + '%;' +
      'top:' + (cell.r * 100 / BUNNY_ROWS) + '%;' +
      'width:' + (100 / BUNNY_COLS) + '%;' +
      'height:' + (100 / BUNNY_ROWS) + '%;';
  }

  // Toạ độ TÂM ô — thỏ/cáo/bong bóng thoại đều neo theo tâm ô rồi tự lùi
  // lại 1 nửa kích thước của chính nó (translate(-50%,-50%) trong CSS), nên
  // luôn đứng giữa ô dù ô to nhỏ thế nào.
  function centerStyle(cell) {
    return 'left:' + ((cell.c + 0.5) * 100 / BUNNY_COLS) + '%;' +
      'top:' + ((cell.r + 0.5) * 100 / BUNNY_ROWS) + '%;';
  }

  // Đường mòn vẽ thành 1 CON ĐƯỜNG LIỀN MẠCH chứ không phải các ô vuông
  // rời: mỗi ô trên đường là 1 miếng bo tròn ở giữa ô, cộng thêm 1 thanh
  // NỐI giữa 2 ô liên tiếp. Lý do: đường đi có lúc chạy sát cạnh chính nó,
  // nếu tô cả ô vuông thì các ô dính liền thành 1 MẢNG đất to bè, nhìn
  // không ra đường để dõi theo (đã dựng thử và thấy đúng như vậy trên ảnh
  // chụp màn hình). Vẽ kiểu nút + thanh nối thì luôn ra hình con đường
  // ngoằn ngoèo rõ ràng, kể cả khi 2 nhánh đường nằm cạnh nhau.
  var TRAIL_THICK = 0.66; // bề ngang con đường, theo tỉ lệ cạnh ô

  function trailHtml(path) {
    var cw = 100 / BUNNY_COLS;
    var ch = 100 / BUNNY_ROWS;
    var out = '';

    path.cells.forEach(function (cell, i) {
      var isNest = i === path.cells.length - 1;
      out += '<div class="bunnytrail' + (isNest ? ' isnest' : '') + '" style="' +
        'left:' + ((cell.c + 0.5) * cw) + '%;top:' + ((cell.r + 0.5) * ch) + '%;' +
        'width:' + (cw * TRAIL_THICK) + '%;height:' + (ch * TRAIL_THICK) + '%;"></div>';
    });

    // Thanh nối: nằm giữa TÂM 2 ô liên tiếp, dày bằng bề ngang con đường.
    for (var i = 0; i < path.cells.length - 1; i++) {
      var a = path.cells[i];
      var b = path.cells[i + 1];
      var horizontal = a.r === b.r;
      var minC = Math.min(a.c, b.c);
      var minR = Math.min(a.r, b.r);
      var style = horizontal
        ? 'left:' + ((minC + 0.5) * cw) + '%;top:' + ((minR + 0.5) * ch) + '%;' +
          'width:' + cw + '%;height:' + (ch * TRAIL_THICK) + '%;transform:translateY(-50%);'
        : 'left:' + ((minC + 0.5) * cw) + '%;top:' + ((minR + 0.5) * ch) + '%;' +
          'width:' + (cw * TRAIL_THICK) + '%;height:' + ch + '%;transform:translateX(-50%);';
      out += '<div class="bunnylink" style="' + style + '"></div>';
    }
    return out;
  }

  function boardHtml() {
    var path = state.bunnyPath;
    var onPath = {};
    path.cells.forEach(function (cell, i) { onPath[cellKey(cell)] = i; });

    // Ô ngoài đường đi: bụi cỏ trang trí, KHÔNG bấm được, chỉ để đường mòn
    // nổi bật lên giữa đám cỏ.
    var tiles = '';
    for (var r = 0; r < BUNNY_ROWS; r++) {
      for (var c = 0; c < BUNNY_COLS; c++) {
        var cell = { c: c, r: r };
        if (onPath[cellKey(cell)] !== undefined) continue;
        tiles += '<div class="bunnycell bunnygrass" style="' + cellStyle(cell) + '">' +
          '<span class="bunnybush"></span></div>';
      }
    }

    var nestCell = path.cells[path.cells.length - 1];
    var startCell = path.cells[0];

    return '<div class="bunnyboard" id="bunnyBoard">' +
      trailHtml(path) +
      tiles +
      '<div class="bunnynest" style="' + centerStyle(nestCell) + '">' + nestSvg() + '</div>' +
      '<div class="bunnyactor" id="bunnyActor" style="' + centerStyle(startCell) + '">' +
      '<span class="bunnyhop" id="bunnyHop">' + bunnySvg() + '</span>' +
      '<span class="bunnybubble" id="bunnyBubble" hidden></span>' +
      '</div>' +
      '<div class="bunnyfox" id="bunnyFox" style="' + centerStyle(startCell) + '" hidden>' + foxSvg() + '</div>' +
      '</div>';
  }

  // Bàn phím hướng hình chữ thập. Nút "nghe lại" đặt ngay GIỮA chữ thập
  // (thay vì nút loa tròn riêng ở cuối màn như các game khác) vì màn này
  // đã tốn nhiều chiều dọc cho mê cung — đặt vào ô giữa vốn đang trống thì
  // vừa tiết kiệm chỗ vừa đúng tầm ngón tay cái.
  function dpadHtml() {
    function key(dirId) {
      return '<button type="button" class="bunnykey bunnykey-' + dirId + '" data-dir="' + dirId + '" aria-label="Đi ' + DIR_LABEL_VI[dirId] + '">' +
        '<span class="bunnykeyface">' + arrowSvg(dirId) + '</span></button>';
    }
    return '<div class="bunnydpad" id="bunnyDpad">' +
      key('up') + key('left') +
      '<button type="button" class="bunnykey bunnykey-listen" id="bunnyListenBtn" aria-label="Nghe lại">' +
      '<span class="bunnykeyface">' + SPEAK_SVG + '</span></button>' +
      key('right') + key('down') +
      '</div>';
  }

  // Bàn cờ phải giữ ĐÚNG tỉ lệ 5:6 (ô vuông thì thỏ nhảy mới đều, không bị
  // dẹt), đồng thời to hết mức có thể trong khoảng trống thật còn lại giữa
  // topbar và bàn phím hướng. Đo THẬT bằng getBoundingClientRect thay vì
  // đoán bằng công thức CSS — đúng cách đã kiểm chứng ở fitKitchenStage()
  // (Vòng 46). Cách thuần CSS (aspect-ratio + height:100%) đã thử và HỎNG
  // thật: trong flex column, chiều cao % không quy chiếu được nên bàn cờ ra
  // 0×0 (đo được bằng Playwright), màn chơi trắng trơn.
  var BUNNY_BOARD_RATIO = BUNNY_COLS / BUNNY_ROWS;
  function fitBunnyBoard() {
    var wrap = document.querySelector('.bunnystagewrap');
    var board = document.getElementById('bunnyBoard');
    if (!wrap || !board) return;
    var rect = wrap.getBoundingClientRect();
    var w = rect.width;
    var h = w / BUNNY_BOARD_RATIO;
    if (h > rect.height) { h = rect.height; w = h * BUNNY_BOARD_RATIO; }
    board.style.width = Math.round(w) + 'px';
    board.style.height = Math.round(h) + 'px';
  }
  // Đo lại khi đổi kích thước/xoay màn hình — chỉ khi đang ở đúng màn này.
  window.addEventListener('resize', function () {
    if (state.screen === 'bunnymaze') fitBunnyBoard();
  });

  function renderBunnyMaze() {
    state.cardShownAt = Date.now();

    root.innerHTML = worldBg() +
      '<div class="content bunnycontent">' +
      '<div class="topbar">' +
      '<button class="iconbtn" id="homeBtn" aria-label="Về trang chủ">' + CLOSE_SVG + '</button>' +
      '<div class="starsrow" id="bunnyStars" style="margin:0;">' + bunnyStarsRow() + '</div>' +
      '<span style="width:38px;"></span>' +
      '</div>' +
      '<div class="bunnystagewrap">' + boardHtml() + '</div>' +
      dpadHtml() +
      '</div>';

    fitBunnyBoard();

    document.getElementById('homeBtn').addEventListener('click', function () {
      state.screen = 'home';
      ctx.render();
    });
    document.getElementById('bunnyListenBtn').addEventListener('click', replayBunnyCommand);
    document.getElementById('bunnyDpad').addEventListener('click', function (e) {
      var btn = e.target.closest('.bunnykey[data-dir]');
      if (!btn) return;
      handleBunnyPress(btn.getAttribute('data-dir'));
    });

    speakBunnyCommand();
  }

  // Chỉ bắt đầu tính "thời gian trả lời" từ lúc hiệu lệnh đọc XONG (qua
  // onEnd) — cùng nguyên lý với speakBillTarget()/speakKitchenTarget().
  //
  // Chốt chặn: đi hết đường rồi thì KHÔNG còn hiệu lệnh nào để đọc nữa.
  // Lỗi thật đã tái hiện được: sau bước đúng CUỐI CÙNG, màn chơi còn nằm
  // đó khoảng 1 giây (chờ đọc xong câu reo mừng rồi mới sang màn thắng) —
  // bé bấm nút "Nghe lại" đúng lúc đó thì bunnyStep đã vượt quá đường đi,
  // tra ra từ undefined và vỡ JS ("Cannot read properties of undefined").
  function speakBunnyCommand() {
    var moveId = currentMoveId();
    if (!moveId) return;
    var w = state.bunnyWords[moveId];
    if (!w) return;
    ctx.speak(w.promptAudioText || w.en, function () { state.cardShownAt = Date.now(); });
  }

  // Nút "Nghe lại" chỉ có tác dụng khi game ĐANG chờ bé bấm hướng — bấm
  // trong lúc đang chạy hiệu ứng (thỏ nhảy / cáo hù) sẽ đọc chen vào giữa,
  // thậm chí đọc trước cả hiệu lệnh của vòng sau.
  function replayBunnyCommand() {
    if (state.bunnyBusy) return;
    speakBunnyCommand();
  }

  // ---------- âm thanh phản hồi ----------

  var sharedAudioCtx = null;
  function audioContext() {
    if (!sharedAudioCtx) sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return sharedAudioCtx;
  }

  // Chuông "ting" khi bấm đúng — y hệt forest.js/kitchen.js/butterflygarden.js
  // (mỗi game tự giữ 1 bản sao riêng theo đúng quy ước đã có).
  function playDing() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
      var ctxAudio = audioContext();
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

        var sparkle = ctxAudio.createOscillator();
        var sparkleGain = ctxAudio.createGain();
        sparkle.type = 'sine';
        sparkle.frequency.value = freq * 2;
        sparkleGain.gain.setValueAtTime(0, start);
        sparkleGain.gain.linearRampToValueAtTime(0.08, start + 0.015);
        sparkleGain.gain.exponentialRampToValueAtTime(0.001, start + dur * 0.8);
        sparkle.connect(sparkleGain).connect(ctxAudio.destination);
        sparkle.start(start);
        sparkle.stop(start + dur * 0.8);
      });
    } catch (e) { /* Web Audio không khả dụng — bỏ qua, không phá UI */ }
  }

  // Tiếng cáo nhảy ra hù: 1 tiếng gầm gừ trầm trượt xuống. Cố ý KHÔNG làm
  // to/gắt — mục tiêu là bất ngờ buồn cười, không phải doạ bé thật sự sợ.
  function playFoxGrowl() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
      var ctxAudio = audioContext();
      var now = ctxAudio.currentTime;
      var osc = ctxAudio.createOscillator();
      var gain = ctxAudio.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.45);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain).connect(ctxAudio.destination);
      osc.start(now);
      osc.stop(now + 0.52);
    } catch (e) { /* Web Audio không khả dụng — bỏ qua, không phá UI */ }
  }

  // ---------- xử lý lượt chơi ----------

  function showBubble(text) {
    var bubble = document.getElementById('bunnyBubble');
    if (!bubble) return;
    bubble.textContent = text;
    bubble.hidden = false;
    bubble.classList.remove('pop');
    // Ép trình duyệt tính lại layout để animation chạy lại từ đầu ở những
    // vòng sau (nếu không, gỡ rồi gắn lại class ngay trong cùng 1 nhịp thì
    // trình duyệt gộp làm một và animation không chạy lần nữa).
    void bubble.offsetWidth;
    bubble.classList.add('pop');
  }

  function hideBubble() {
    var bubble = document.getElementById('bunnyBubble');
    if (!bubble) return;
    bubble.hidden = true;
    bubble.classList.remove('pop');
  }

  function moveBunnyTo(cell, dirId) {
    var actor = document.getElementById('bunnyActor');
    var hop = document.getElementById('bunnyHop');
    if (!actor) return;
    if (dirId === 'left' || dirId === 'right') state.bunnyFacing = dirId;
    actor.classList.toggle('faceleft', state.bunnyFacing === 'left');
    actor.style.left = ((cell.c + 0.5) * 100 / BUNNY_COLS) + '%';
    actor.style.top = ((cell.r + 0.5) * 100 / BUNNY_ROWS) + '%';
    if (hop) {
      hop.classList.remove('hopping');
      void hop.offsetWidth;
      hop.classList.add('hopping');
    }
  }

  function flashKey(dirId, cls) {
    var btn = document.querySelector('.bunnykey[data-dir="' + dirId + '"]');
    if (!btn) return;
    btn.classList.add(cls);
    setTimeout(function () { btn.classList.remove(cls); }, 600);
  }

  // Sau khi cáo ẩn đi, nút ĐÚNG phát sáng nhấp nháy để bé không kẹt mãi ở 1
  // bước (cùng tinh thần "bấm sai thì hiện đáp án đúng" của forest/bill/
  // kitchen). Gỡ gợi ý ngay khi bé bấm tiếp.
  function hintCorrectKey() {
    var btn = document.querySelector('.bunnykey[data-dir="' + currentMoveId() + '"]');
    if (btn) btn.classList.add('hint');
  }

  function clearHints() {
    Array.prototype.forEach.call(document.querySelectorAll('.bunnykey.hint'), function (btn) {
      btn.classList.remove('hint');
    });
  }

  function handleBunnyPress(dirId) {
    if (state.bunnyBusy) return;
    state.bunnyBusy = true;
    clearHints();
    hideBubble();

    var store = ctx.getStore();
    var expected = currentMoveId();
    var word = state.bunnyWords[expected];
    var responseTimeMs = Date.now() - state.cardShownAt;

    if (dirId !== expected) {
      // skipDueGate: true — kho từ của game này chỉ có ĐÚNG 4 hướng, còn
      // nhỏ hơn cả "How Many?" (10 số), nên luật "chưa tới hạn ôn thì không
      // tính" sẽ chặn oan tiến độ hợp lệ y như lỗi thật đã gặp ở Vòng 36.
      applyAnswer(store.words, word.id, 'listen', 'wrong', { skipDueGate: true });
      saveProgress(store);
      flashKey(dirId, 'wrong');
      scareWithFox();
      return;
    }

    var outcome = classifyAnswer(true, responseTimeMs);
    applyAnswer(store.words, word.id, 'listen', outcome, { skipDueGate: true });
    saveProgress(store);

    state.bunnyStep++;
    state.correct++;
    flashKey(dirId, 'good');
    moveBunnyTo(state.bunnyPath.cells[state.bunnyStep], dirId);
    playDing();
    document.getElementById('bunnyStars').innerHTML = bunnyStarsRow();

    var isDone = state.bunnyStep >= state.bunnyPath.moves.length;
    var praise = isDone ? 'Home!' : nextPraise();
    showBubble(praise);
    // Chờ ĐỌC XONG câu reo rồi mới sang vòng tiếp (mốc tối thiểu 1100ms để
    // bé kịp nhìn thỏ nhảy) — không dùng setTimeout cố định đua với audio,
    // đúng bài học "câu đọc lại bị cắt ngang" ở Vòng 52.
    speakThenProceed(ctx.speak, praise, isDone ? 900 : 1100, function () {
      // Bé có thể đã bấm nút về Trang chủ trong lúc chờ — lỗi thật đã tái
      // hiện được: không kiểm tra thì hiệu lệnh vòng sau vẫn được đọc vọng
      // sang Trang chủ (hoặc tệ hơn: màn thắng cuộc tự đè lên Trang chủ).
      // Cùng chốt chặn đã dùng ở scareWithFox().
      if (state.screen !== 'bunnymaze') return;
      if (isDone) {
        state.screen = 'bunnymazeSummary';
        ctx.render();
        return;
      }
      hideBubble();
      state.bunnyBusy = false;
      speakBunnyCommand();
    });
  }

  // Ô để cáo nhảy ra: 1 ô KỀ BÊN ô thỏ đang đứng (ưu tiên bên phải, rồi
  // trái, rồi dưới, rồi trên — lấy ô đầu tiên còn nằm trong lưới). KHÔNG
  // cho cáo đứng đè lên đúng ô của thỏ: dựng thử kiểu đó thì cáo che kín
  // mất con thỏ (thấy rõ trên ảnh chụp màn hình), vừa mất dấu thỏ đang ở
  // đâu vừa dễ làm bé sợ thật thay vì buồn cười. Cáo luôn ở trong lưới nên
  // cũng không bao giờ bị mép bàn cờ cắt mất (overflow:hidden).
  function foxSpot(cell) {
    var prefer = ['right', 'left', 'down', 'up'];
    for (var i = 0; i < prefer.length; i++) {
      var d = dirById(prefer[i]);
      var spot = { c: cell.c + d.dc, r: cell.r + d.dr };
      if (spot.c >= 0 && spot.c < BUNNY_COLS && spot.r >= 0 && spot.r < BUNNY_ROWS) return spot;
    }
    return cell;
  }

  // Cáo nhảy ra ngay cạnh thỏ, rung 1 cái rồi TỰ ẨN — không chặn đường,
  // không trừ sao, chỉ là phản hồi "sai rồi" cho vui. Sau khi cáo biến mất
  // thì đọc lại hiệu lệnh cũ để bé thử lại đúng bước đó.
  function scareWithFox() {
    var fox = document.getElementById('bunnyFox');
    var board = document.getElementById('bunnyBoard');
    var cell = state.bunnyPath.cells[state.bunnyStep];
    if (fox) {
      var spot = foxSpot(cell);
      fox.style.left = ((spot.c + 0.5) * 100 / BUNNY_COLS) + '%';
      fox.style.top = ((spot.r + 0.5) * 100 / BUNNY_ROWS) + '%';
      fox.hidden = false;
      fox.classList.remove('pop');
      void fox.offsetWidth;
      fox.classList.add('pop');
    }
    if (board) {
      board.classList.remove('shake');
      void board.offsetWidth;
      board.classList.add('shake');
    }
    playFoxGrowl();

    setTimeout(function () {
      if (fox) {
        fox.hidden = true;
        fox.classList.remove('pop');
      }
      if (board) board.classList.remove('shake');
      // Màn có thể đã bị rời khỏi trong lúc chờ (bé bấm nút về Trang chủ) —
      // kiểm tra trước khi đọc tiếp/mở khoá bàn phím, tránh đọc vọng sang
      // màn khác.
      if (state.screen !== 'bunnymaze') return;
      state.bunnyBusy = false;
      hintCorrectKey();
      speakBunnyCommand();
    }, 1500);
  }

  function renderBunnyMazeSummary() {
    root.innerHTML = worldBg() +
      '<div class="content">' +
      '<div class="summary-mid" id="summaryMid">' +
      '<div class="starburst">' + starIcon('#FFD25A', 28) + starIcon('#F4A93B', 36) + starIcon('#FFD25A', 28) + '</div>' +
      '<div class="bunnywin">' + bunnySvg() + '</div>' +
      '<h2>Về tới tổ rồi!</h2>' +
      '<p>Bé nghe hiệu lệnh giỏi lắm!</p>' +
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

    document.getElementById('againBtn').addEventListener('click', startBunnyMazeGame);
    document.getElementById('homeBtn2').addEventListener('click', function () {
      state.screen = 'home';
      ctx.render();
    });
  }

  // Markup ô icon của game này trong lưới chọn trò chơi ở Trang chủ — nền
  // gradient cỏ + mặt thỏ (nhún nhẹ). Toàn SVG nên không có ảnh để hỏng.
  function gameTileHtml(title) {
    return '<button type="button" class="gametile bunny-tile" data-id="bunnymaze">' +
      '<span class="bunnytile-face">' + bunnySvg() + '</span>' +
      '<span class="name">' + title + '</span></button>';
  }

  return {
    startBunnyMazeGame: startBunnyMazeGame,
    renderBunnyMaze: renderBunnyMaze,
    renderBunnyMazeSummary: renderBunnyMazeSummary,
    gameTileHtml: gameTileHtml
  };
}
