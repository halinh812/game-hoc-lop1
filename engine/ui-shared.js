// UI dùng chung cho mọi màn/mọi game — icon SVG, linh vật, nền "thế giới
// game". Không thuộc riêng game nào (khác với games/<slug>/*.css, *.js
// vốn chỉ chứa thứ riêng của 1 game).

export function starIcon(fill, size, stroke) {
  return '<svg viewBox="0 0 24 24" width="' + (size || 16) + '" height="' + (size || 16) + '" aria-hidden="true"><path d="M12 2l2.9 6.1 6.7.7-5 4.5 1.4 6.6L12 16.9l-6 3.5 1.4-6.6-5-4.5 6.7-.7z" fill="' + fill + '" stroke="' + (stroke || 'none') + '" stroke-width="1.2"/></svg>';
}

export var BACK_SVG = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export var CLOSE_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/></svg>';
export var SPEAK_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9v6h4l5 5V4L8 9H4z" fill="#E4633F"/><path d="M16.4 8.6a5 5 0 010 6.8" stroke="#E4633F" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>';

export function owlMascot(size) {
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
export function sleepyMascot(size) {
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

// photoClass: truyền tên class riêng của 1 game (vd "forestphoto" cho Khu
// rừng kỳ bí) để dùng ảnh nền tĩnh của chính game đó thay vì nền vẽ bằng
// CSS/SVG mặc định — class + ảnh nền tương ứng do CSS của TỪNG GAME tự
// định nghĩa (xem games/khu-rung-ky-bi/forest.css), hàm dùng chung này
// không biết/không cần biết game nào dùng ảnh gì. Không truyền gì (mọi
// màn khác) thì vẫn giữ nguyên nền vẽ bằng CSS/SVG (mây/mặt trời/tán
// cây/mặt đất) dùng chung.
export function worldBg(photoClass) {
  if (photoClass) return '<div class="world-bg ' + photoClass + '" aria-hidden="true"></div>';
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
