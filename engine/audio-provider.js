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
  // ID của lần gọi speak() gần nhất — dùng để lần gọi CŨ (đang chờ trong
  // setTimeout bên dưới) tự biết mình đã bị 1 lần gọi MỚI hơn ghi đè, để
  // không phát nhầm câu cũ ra sau câu mới nếu 2 lần gọi speak() liền nhau
  // quá nhanh (vd bấm rất nhanh giữa 2 câu).
  var latestSpeakId = 0;

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
    // opts.onEnd (tuỳ chọn) — gọi đúng 1 lần khi câu này đọc XONG (dù đọc
    // trôi chảy hay bị lỗi giữa chừng), để nơi gọi biết chính xác lúc nào
    // bé mới THỰC SỰ nghe hết câu — vd đo "thời gian trả lời" phải tính từ
    // mốc này chứ không phải từ lúc lệnh đọc được gọi (nghe câu vốn đã mất
    // 1-2 giây, tính cả vào thời gian trả lời của bé là oan cho bé). Nếu bị
    // 1 lần gọi speak() MỚI hơn đè lên trước khi câu này kịp đọc xong thì
    // onEnd của câu CŨ sẽ KHÔNG được gọi (coi như huỷ) — chỉ onEnd của câu
    // mới nhất mới có ý nghĩa.
    speak: function (text, opts) {
      opts = opts || {};
      var myId = ++latestSpeakId;
      var doneCalled = false;
      function done() {
        if (doneCalled || myId !== latestSpeakId) return;
        doneCalled = true;
        if (opts.onEnd) opts.onEnd();
      }
      try {
        if (!this.isSupported()) { done(); return; }
        var synth = window.speechSynthesis;

        var u = new SpeechSynthesisUtterance(text);
        u.lang = opts.lang || 'en-US';
        // Tốc độ/cao độ tự nhiên hơn bản trước (0.82/1.05 nghe hơi chậm và
        // "the the" máy móc) — vẫn đủ chậm rãi rõ ràng cho trẻ mới học.
        u.rate = opts.rate != null ? opts.rate : 0.92;
        u.pitch = opts.pitch != null ? opts.pitch : 1.0;
        if (cachedBestVoice) u.voice = cachedBestVoice;
        u.onend = done;
        u.onerror = done;

        if (synth.speaking || synth.pending) synth.cancel();
        // Lỗi trình duyệt đã biết (nhiều nhất trên Chrome Android): gọi
        // speak() ngay sau cancel() có thể bị "nuốt" — máy cứ phát lặp lại
        // câu CŨ thay vì câu vừa gọi (đúng triệu chứng "con nào cũng đọc
        // như nhau" người dùng gặp phải), vì cancel() chưa xử lý xong lúc
        // speak() mới đã gọi tới. Chờ 1 nhịp rất ngắn cho cancel() thật sự
        // hoàn tất rồi mới xếp câu mới vào hàng đợi.
        setTimeout(function () {
          if (myId !== latestSpeakId) return; // đã có lần gọi mới hơn, bỏ qua
          synth.speak(u);
        }, 60);
      } catch (e) {
        // Một số trình duyệt (đặc biệt Safari iOS) yêu cầu tương tác người
        // dùng trước khi phát được âm thanh — bỏ qua lỗi, không phá UI, vẫn
        // gọi onEnd để nơi gọi không bị treo chờ mãi.
        done();
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

// Rút gọn 1 câu tiếng Anh thành tên file an toàn: chữ thường, khoảng
// trắng/dấu câu -> gạch dưới, bỏ gạch dưới thừa ở 2 đầu. "I want a book."
// -> "i_want_a_book", "red" -> "red", "rice cooker" -> "rice_cooker". Khoá
// theo ĐÚNG CÂU đang đọc (không phải theo "id" của từ trong content pack)
// vì đây mới là thứ cần phát ra loa — 1 câu giống hệt nhau ở 2 game khác
// nhau (hiếm khi xảy ra) vẫn dùng chung đúng 1 file, không cần tạo trùng.
function slugifyAudioText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Provider "ưu tiên file thu sẵn, rơi về Web Speech" — đúng điểm mở rộng
// đã ghi chú từ trước. File thật do người dùng tự tạo bằng công cụ TTS
// ngoài (vd VoiceStudio) rồi gửi qua Git, lưu ở assets/audio/en/<slug>.wav
// (đúng định dạng WAV mà VoiceStudio xuất ra sẵn — không cần đổi định
// dạng gì thêm, trình duyệt phát WAV qua thẻ <audio> bình thường)
// (xem Bước 23 trong PROMPT.md). manifest.json liệt kê ĐÚNG những câu đã
// có file thật — tra cứu trong bộ nhớ (Set), KHÔNG dò từng câu qua mạng
// (mỗi lần đọc gọi rất thường xuyên, dò lỗi 404 liên tục sẽ chậm/tốn
// mạng) — câu nào chưa có trong manifest thì đi thẳng qua Web Speech như
// trước giờ, không cần chờ gì thêm. manifest.json CHƯA tồn tại (trước khi
// có file âm thanh đầu tiên) thì coi như rỗng, không báo lỗi gì — game vẫn
// chạy y hệt bản Web Speech thuần hiện tại.
function createFileFirstAudioProvider() {
  var webSpeech = createWebSpeechProvider();
  var manifestSlugs = null; // null = chưa tải xong, Set = đã tải xong (có thể rỗng)
  var latestSpeakId = 0;
  var currentAudioEl = null;

  fetch('assets/audio/en/manifest.json')
    .then(function (res) { return res.ok ? res.json() : []; })
    .then(function (list) { manifestSlugs = new Set(Array.isArray(list) ? list : []); })
    .catch(function () { manifestSlugs = new Set(); });

  function stopCurrentAudio() {
    if (currentAudioEl) {
      currentAudioEl.pause();
      currentAudioEl.onended = null;
      currentAudioEl.onerror = null;
      currentAudioEl = null;
    }
  }

  return {
    name: 'file-first',
    isSupported: function () { return true; },
    speak: function (text, opts) {
      opts = opts || {};
      var myId = ++latestSpeakId;
      stopCurrentAudio();

      var slug = slugifyAudioText(text);
      var hasFile = manifestSlugs && manifestSlugs.has(slug);
      if (!hasFile) { webSpeech.speak(text, opts); return; }

      var doneCalled = false;
      function done() {
        if (doneCalled || myId !== latestSpeakId) return;
        doneCalled = true;
        if (opts.onEnd) opts.onEnd();
      }

      var audioEl = new Audio('assets/audio/en/' + slug + '.wav');
      currentAudioEl = audioEl;
      audioEl.onended = done;
      // File có tên trong manifest nhưng lỗi tải/phát thật (hiếm — file bị
      // hỏng, sai định dạng...) — rơi về Web Speech thay vì im lặng, bé vẫn
      // nghe được gì đó thay vì mất tiếng hoàn toàn.
      audioEl.onerror = function () { webSpeech.speak(text, opts); };
      audioEl.play().catch(function () {
        // 1 số trình duyệt (đặc biệt Safari iOS) chặn autoplay trước khi có
        // tương tác người dùng — cùng giới hạn với Web Speech, xem try/catch
        // trong createWebSpeechProvider() ở trên.
        webSpeech.speak(text, opts);
      });
    }
  };
}

export function createAudioProvider() {
  return createFileFirstAudioProvider();
}
