// Bộ 20 avatar "ngộ nghĩnh" cho bé chọn ở màn hồ sơ.
//
// Cố tình KHÔNG dùng phong cách tả thực như bộ ảnh AI Sở thú (xem
// ANIMAL_ART_PIPELINE.md) — vẽ SVG bằng tay chỉ thất bại ở việc tả thực
// (đã thử và bỏ ở Phase 0). Icon mascot đơn giản, khối tròn, mắt to là
// đúng sở trường của SVG tự vẽ, nên dùng ở đây thay vì tốn công tạo ảnh AI
// chỉ cho mục đích chọn đại diện.
//
// Mỗi avatar dựng từ vài khối hình dùng chung (tai/mắt/mõm) + 1-2 chi tiết
// riêng (bờm, vòi, mai, đốm...) để vừa nhất quán phong cách vừa nhận ra
// ngay là loài gì.

function eyes(cx1, cx2, cy) {
  cy = cy || 50;
  return (
    '<circle cx="' + cx1 + '" cy="' + cy + '" r="9" fill="#FFFDF7"/>' +
    '<circle cx="' + cx2 + '" cy="' + cy + '" r="9" fill="#FFFDF7"/>' +
    '<circle cx="' + (cx1 + 1.6) + '" cy="' + cy + '" r="4.6" fill="#2A3B2E"/>' +
    '<circle cx="' + (cx2 + 1.6) + '" cy="' + cy + '" r="4.6" fill="#2A3B2E"/>' +
    '<circle cx="' + (cx1 + 3) + '" cy="' + (cy - 2) + '" r="1.4" fill="#fff"/>' +
    '<circle cx="' + (cx2 + 3) + '" cy="' + (cy - 2) + '" r="1.4" fill="#fff"/>'
  );
}

function earsRound(color) {
  return '<circle cx="26" cy="28" r="12" fill="' + color + '"/><circle cx="74" cy="28" r="12" fill="' + color + '"/>';
}
function earsPointy(color) {
  return '<path d="M18 30 L26 8 L36 28 Z" fill="' + color + '"/><path d="M82 30 L74 8 L64 28 Z" fill="' + color + '"/>';
}
function earsFloppy(color) {
  return '<ellipse cx="17" cy="52" rx="9" ry="18" fill="' + color + '"/><ellipse cx="83" cy="52" rx="9" ry="18" fill="' + color + '"/>';
}
function earsTuft(color) {
  return '<path d="M30 20 L24 4 L38 16 Z" fill="' + color + '"/><path d="M70 20 L76 4 L62 16 Z" fill="' + color + '"/>';
}
function muzzle(color, cy) {
  cy = cy || 66;
  return '<ellipse cx="50" cy="' + cy + '" rx="13" ry="9" fill="' + color + '"/>';
}
function nose(color) {
  return '<ellipse cx="50" cy="60" rx="5" ry="3.6" fill="' + color + '"/>';
}
function blush() {
  return '<ellipse cx="26" cy="64" rx="5" ry="3.2" fill="#F3958A" opacity=".75"/><ellipse cx="74" cy="64" rx="5" ry="3.2" fill="#F3958A" opacity=".75"/>';
}

function body(color, r) {
  return '<circle cx="50" cy="56" r="' + (r || 34) + '" fill="' + color + '"/>';
}

var AVATARS = [
  { id: 'cat', label: 'Mèo', color: '#F0A05C',
    markup: body('#F0A05C') + earsPointy('#F0A05C') + eyes(38, 62) + blush() + nose('#C96B3C') +
      '<path d="M20 62 L4 58 M20 66 L4 68" stroke="#C96B3C" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M80 62 L96 58 M80 66 L96 68" stroke="#C96B3C" stroke-width="1.6" stroke-linecap="round"/>' },

  { id: 'dog', label: 'Chó', color: '#D9A066',
    markup: body('#D9A066') + earsFloppy('#8C5A2E') + eyes(38, 62) + blush() + muzzle('#FFF6E6') + nose('#5C3A1E') },

  { id: 'bear', label: 'Gấu', color: '#8C5A3C',
    markup: body('#8C5A3C') + earsRound('#6E4429') + eyes(38, 62) + blush() + muzzle('#E8CBA8') + nose('#3B2416') },

  { id: 'panda', label: 'Gấu trúc', color: '#FFFDF7',
    markup: body('#FFFDF7') + earsRound('#2A3B2E') +
      '<ellipse cx="36" cy="50" rx="11" ry="13" fill="#2A3B2E"/><ellipse cx="64" cy="50" rx="11" ry="13" fill="#2A3B2E"/>' +
      eyes(36, 64) + '<ellipse cx="50" cy="62" rx="8" ry="6" fill="#FFFDF7"/>' + nose('#2A3B2E') },

  { id: 'rabbit', label: 'Thỏ', color: '#FFFDF7',
    markup: '<ellipse cx="30" cy="16" rx="7" ry="24" fill="#FFFDF7" stroke="#EBD9D9" stroke-width="1"/>' +
      '<ellipse cx="70" cy="16" rx="7" ry="24" fill="#FFFDF7" stroke="#EBD9D9" stroke-width="1"/>' +
      '<ellipse cx="30" cy="16" rx="3.4" ry="18" fill="#F3B7C4"/><ellipse cx="70" cy="16" rx="3.4" ry="18" fill="#F3B7C4"/>' +
      body('#FFFDF7') + eyes(38, 62) + blush() + nose('#E8899A') },

  { id: 'fox', label: 'Cáo', color: '#E06B32',
    markup: body('#E06B32') + earsPointy('#E06B32') +
      '<path d="M20 30 L26 12 L34 27 Z" fill="#2A3B2E"/><path d="M80 30 L74 12 L66 27 Z" fill="#2A3B2E"/>' +
      '<path d="M28 26 L26 12 L34 24 Z" fill="#2A3B2E"/><path d="M72 26 L74 12 L66 24 Z" fill="#2A3B2E"/>' +
      eyes(38, 62) + '<path d="M50 58 L38 72 Q50 78 62 72 Z" fill="#FFFDF7"/>' + nose('#3B2416') },

  { id: 'tiger', label: 'Hổ', color: '#F0913D',
    markup: body('#F0913D') + earsRound('#F0913D') + eyes(38, 62) + blush() + muzzle('#FFF6E6') + nose('#3B2416') +
      '<path d="M20 34 Q28 30 34 36 M66 36 Q72 30 80 34 M18 46 Q28 44 34 48 M66 48 Q72 44 82 46" stroke="#2A3B2E" stroke-width="3" fill="none" stroke-linecap="round"/>' },

  { id: 'lion', label: 'Sư tử', color: '#F0A93B',
    markup: '<circle cx="50" cy="54" r="42" fill="#C9781F"/>' + body('#F0C05A') + eyes(38, 62) + blush() + muzzle('#FFF6E6') + nose('#5C3A1E') },

  { id: 'elephant', label: 'Voi', color: '#B7C2C4',
    markup: earsRound('#9AA8AB') + body('#B7C2C4', 32) + eyes(38, 60) +
      '<path d="M50 64 Q44 82 52 92 Q58 95 57 88" stroke="#7C8A8D" stroke-width="10" fill="none" stroke-linecap="round"/>' },

  { id: 'monkey', label: 'Khỉ', color: '#A9764A',
    markup: body('#A9764A') + earsRound('#A9764A') + '<circle cx="50" cy="58" r="21" fill="#F3D9B3"/>' + eyes(38, 62) + muzzle('#F3D9B3', 66) + nose('#6E4429') },

  { id: 'koala', label: 'Koala', color: '#A9AFAF',
    markup: '<ellipse cx="16" cy="40" rx="15" ry="18" fill="#C4C9C9"/><ellipse cx="84" cy="40" rx="15" ry="18" fill="#C4C9C9"/>' +
      body('#A9AFAF') + eyes(38, 62) + blush() + '<ellipse cx="50" cy="64" rx="8" ry="6" fill="#5C6060"/>' },

  { id: 'owl', label: 'Cú', color: '#E4A857',
    markup: body('#E4A857') + earsTuft('#E4A857') + '<circle cx="37" cy="50" r="13" fill="#FFFDF7"/><circle cx="63" cy="50" r="13" fill="#FFFDF7"/>' +
      '<circle cx="37" cy="50" r="6.4" fill="#2A3B2E"/><circle cx="63" cy="50" r="6.4" fill="#2A3B2E"/>' +
      '<path d="M46 60 L50 68 L54 60 Z" fill="#E4633F"/>' },

  { id: 'frog', label: 'Ếch', color: '#6FB35C',
    markup: body('#6FB35C') + '<circle cx="34" cy="30" r="10" fill="#6FB35C"/><circle cx="66" cy="30" r="10" fill="#6FB35C"/>' +
      eyes(34, 66, 30) + '<path d="M28 70 Q50 82 72 70" stroke="#2A3B2E" stroke-width="3" fill="none" stroke-linecap="round"/>' },

  { id: 'pig', label: 'Lợn', color: '#F3AFC2',
    markup: body('#F3AFC2') + earsRound('#EE8FA9') + eyes(38, 62) + blush() +
      '<ellipse cx="50" cy="64" rx="12" ry="9" fill="#EE8FA9"/><circle cx="45" cy="64" r="2" fill="#B85C77"/><circle cx="55" cy="64" r="2" fill="#B85C77"/>' },

  { id: 'sheep', label: 'Cừu', color: '#FBF6E8',
    markup: '<circle cx="24" cy="34" r="11" fill="#FBF6E8"/><circle cx="34" cy="22" r="11" fill="#FBF6E8"/><circle cx="50" cy="18" r="12" fill="#FBF6E8"/><circle cx="66" cy="22" r="11" fill="#FBF6E8"/><circle cx="76" cy="34" r="11" fill="#FBF6E8"/>' +
      body('#FBF6E8') + earsRound('#5C4A3C') + eyes(38, 62) + blush() + muzzle('#5C4A3C', 66) },

  { id: 'giraffe', label: 'Hươu cao cổ', color: '#F0C97A',
    markup: '<rect x="45" y="6" width="4" height="18" rx="2" fill="#F0C97A"/><rect x="51" y="6" width="4" height="18" rx="2" fill="#F0C97A"/>' +
      '<circle cx="47" cy="6" r="4" fill="#C9781F"/><circle cx="53" cy="6" r="4" fill="#C9781F"/>' +
      body('#F0C97A') + eyes(38, 62) + muzzle('#FFF6E6') + nose('#8C5A2E') +
      '<circle cx="30" cy="42" r="5" fill="#C9781F" opacity=".8"/><circle cx="68" cy="40" r="4" fill="#C9781F" opacity=".8"/><circle cx="50" cy="76" r="4" fill="#C9781F" opacity=".8"/>' },

  { id: 'zebra', label: 'Ngựa vằn', color: '#EDEFEF',
    markup: earsRound('#2A3B2E') + '<circle cx="50" cy="56" r="34" fill="#EDEFEF" stroke="#D4D8D8" stroke-width="2"/>' + eyes(38, 62) + muzzle('#2A3B2E') +
      '<path d="M20 36 Q28 32 34 38 M66 38 Q72 32 80 36 M18 48 Q28 46 36 50 M64 50 Q72 46 82 48" stroke="#2A3B2E" stroke-width="3.4" fill="none" stroke-linecap="round"/>' },

  { id: 'chick', label: 'Gà con', color: '#F7D24A',
    markup: body('#F7D24A') + '<path d="M42 18 Q50 6 58 18 Z" fill="#F7D24A"/>' + eyes(38, 62) + blush() +
      '<path d="M44 60 L56 60 L50 70 Z" fill="#E4863F"/>' },

  { id: 'penguin', label: 'Chim cánh cụt', color: '#2A3B2E',
    markup: body('#2A3B2E') + '<ellipse cx="50" cy="66" rx="19" ry="24" fill="#FFFDF7"/>' + eyes(38, 62) +
      '<path d="M44 64 L56 64 L50 74 Z" fill="#E4863F"/>' },

  { id: 'turtle', label: 'Rùa', color: '#6FA86B',
    markup: body('#6FA86B') + '<path d="M20 50 Q50 20 80 50 Q50 44 20 50 Z" fill="#3E7A4B"/>' +
      '<circle cx="34" cy="42" r="4" fill="#295933"/><circle cx="50" cy="36" r="4" fill="#295933"/><circle cx="66" cy="42" r="4" fill="#295933"/>' +
      eyes(38, 62, 58) + muzzle('#8FCB7A', 70) }
];

export function getAvatars() { return AVATARS; }

export function getAvatarById(id) {
  return AVATARS.filter(function (a) { return a.id === id; })[0] || null;
}

export function avatarSvg(id, size) {
  var a = getAvatarById(id);
  if (!a) return '';
  size = size || 48;
  return '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '" aria-hidden="true">' + a.markup + '</svg>';
}
