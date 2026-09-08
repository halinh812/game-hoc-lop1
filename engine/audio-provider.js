// AudioProvider — lớp trừu tượng phát âm thanh. Hiện tại chỉ có
// WebSpeechProvider (miễn phí, chạy ngay trên trình duyệt). Khi nâng cấp
// lên TTS chất lượng cao (Google Cloud TTS Neural2 / ElevenLabs / giọng thu
// sẵn) sau này, chỉ cần viết thêm 1 provider mới cùng implement speak() và
// đổi chỗ khởi tạo trong app.js — không phải sửa lại UI hay Learning Engine.
//
// Giới hạn cần biết: Web Speech API không tự phát âm — nó GIAO việc đọc
// cho giọng đọc (voice) mà hệ điều hành/trình duyệt của từng máy cài sẵn.
// Chất lượng vì vậy khác nhau tuỳ máy/trình duyệt, ngoài tầm kiểm soát của
// code. Cái code CÓ THỂ làm: chủ động chọn giọng tiếng Anh tốt nhất trong
// số giọng máy đó CÓ SẴN (thay vì để trình duyệt tự chọn, có thể rơi vào
// giọng dự phòng chất lượng thấp/rô-bốt), và chỉnh tốc độ/cao độ cho tự
// nhiên hơn. Nếu vẫn chưa đủ tự nhiên, bước tiếp theo là giọng trả phí
// (xem ROADMAP.md — "Ghi chú kỹ thuật lâu dài").

// Gợi ý giọng chất lượng cao thường gặp — dùng để CỘNG điểm ưu tiên, không
// phải danh sách bắt buộc, nên vẫn hoạt động tốt trên máy không có giọng
// nào trong danh sách này.
var GOOD_VOICE_HINTS = [
  'google', 'natural', 'neural', 'enhanced', 'premium', 'online',
  'samantha', 'ava', 'allison', 'susan', 'karen', 'daniel', 'serena', 'moira', 'tessa', 'aria'
];
var POOR_VOICE_HINTS = ['compact', 'espeak', 'david', 'zira', 'mark'];

function scoreVoice(voice) {
  var name = (voice.name || '').toLowerCase();
  var lang = (voice.lang || '').toLowerCase();
  var score = 0;
  if (lang === 'en-us') score += 100;
  else if (lang === 'en-gb') score += 90;
  else if (lang.indexOf('en') === 0) score += 40;
  else return -1; // không phải giọng tiếng Anh, loại

  GOOD_VOICE_HINTS.forEach(function (hint) {
    if (name.indexOf(hint) !== -1) score += 30;
  });
  POOR_VOICE_HINTS.forEach(function (hint) {
    if (name.indexOf(hint) !== -1) score -= 40;
  });
  return score;
}

function pickBestVoice(voices) {
  var best = null;
  var bestScore = -1;
  voices.forEach(function (v) {
    var s = scoreVoice(v);
    if (s > bestScore) { bestScore = s; best = v; }
  });
  return best;
}

export function createWebSpeechProvider() {
  var cachedBestVoice = null;

  function refreshVoice() {
    try {
      var voices = window.speechSynthesis.getVoices();
      if (voices && voices.length) cachedBestVoice = pickBestVoice(voices);
    } catch (e) {
      // bỏ qua — speak() vẫn chạy được, chỉ là dùng giọng mặc định của máy
    }
  }

  var provider = {
    name: 'web-speech',
    isSupported: function () {
      return typeof window !== 'undefined' && 'speechSynthesis' in window;
    },
    speak: function (text, opts) {
      opts = opts || {};
      try {
        if (!this.isSupported()) return;
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.lang = opts.lang || 'en-US';
        // Tốc độ/cao độ tự nhiên hơn bản trước (0.82/1.05 nghe hơi chậm và
        // "the the" máy móc) — vẫn đủ chậm rãi rõ ràng cho trẻ mới học.
        u.rate = opts.rate != null ? opts.rate : 0.92;
        u.pitch = opts.pitch != null ? opts.pitch : 1.0;
        if (cachedBestVoice) u.voice = cachedBestVoice;
        window.speechSynthesis.speak(u);
      } catch (e) {
        // Một số trình duyệt (đặc biệt Safari iOS) yêu cầu tương tác người
        // dùng trước khi phát được âm thanh — bỏ qua lỗi, không phá UI.
      }
    }
  };

  if (provider.isSupported()) {
    refreshVoice();
    // getVoices() có thể trả mảng rỗng lúc trang vừa tải (nhất là Chrome
    // desktop) — danh sách giọng tải xong sẽ bắn sự kiện này, lúc đó chọn
    // lại giọng tốt nhất cho các lần đọc SAU (lần đọc đầu tiên có thể vẫn
    // dùng giọng mặc định nếu sự kiện chưa kịp bắn).
    try {
      window.speechSynthesis.addEventListener('voiceschanged', refreshVoice);
    } catch (e) { /* trình duyệt cũ không hỗ trợ, bỏ qua */ }
  }

  return provider;
}

// Điểm mở rộng cho tương lai: 1 provider trả file audio thu sẵn / TTS đám
// mây, cùng interface { name, isSupported(), speak(text, opts) } để có thể
// hoán đổi mà không đổi code gọi nó.
export function createAudioProvider() {
  return createWebSpeechProvider();
}
