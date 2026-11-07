// Cầu nối âm thanh giữa trang web (chạy trong WebView của app Android) và
// phần native của app.
//
// VÌ SAO CẦN: WebView của Android KHÔNG có Web Speech API
// (window.speechSynthesis). Mà sau Vòng 55 thì toàn bộ app đọc tiếng Anh
// 100% bằng Web Speech (xem engine/audio-provider.js) — nghĩa là nếu chỉ
// bọc trang web này vào app mà không làm gì thêm thì CẢ 8 GAME SẼ CÂM
// TIẾNG, hỏng hoàn toàn.
//
// CÁCH LÀM: file này dựng 1 bản "giả" của window.speechSynthesis +
// SpeechSynthesisUtterance, giao diện y hệt bản thật, nhưng ruột bên trong
// không tự đọc mà CHUYỂN LỆNH sang phần native của app (mobile/App.js),
// nơi dùng expo-speech để đọc bằng bộ đọc của chính máy Android.
// engine/audio-provider.js KHÔNG phải sửa 1 dòng nào — nó vẫn tưởng đang
// nói chuyện với Web Speech API bình thường.
//
// CHẠY TRÊN WEB THƯỜNG THÌ SAO: không làm gì cả. Cả file nằm trong 1 câu
// lệnh if kiểm tra window.ReactNativeWebView (biến chỉ tồn tại bên trong
// WebView của app). Mở bằng trình duyệt như xưa nay thì file này thoát ra
// ngay lập tức, Web Speech thật vẫn chạy y như cũ.
//
// VÌ SAO NẰM Ở ĐÂY MÀ KHÔNG PHẢI TRONG app: để chỉ có ĐÚNG 1 BẢN, và để
// sửa được qua cơ chế cập nhật (bạn push code là máy bé có bản mới), không
// phải build lại APK.
//
// ĐIỂM SỐNG CÒN — phải báo ngược lại lúc đọc XONG: cơ chế speakThenProceed
// (engine/ui-shared.js, sửa ở Vòng 52) chờ đúng tín hiệu "đọc xong" rồi mới
// chuyển câu. Nếu cầu nối chỉ bắn lệnh đi rồi kệ, lỗi cũ sẽ quay lại y
// nguyên: câu dài bị cắt ngang ("I want a note" mất chữ "book"). Vì vậy
// phần native BẮT BUỘC phải gọi ngược window.__nativeTtsDone(id) khi đọc
// xong, và file này mới gọi onend của đúng câu đó.
(function () {
  if (typeof window === 'undefined') return;
  // Không ở trong app -> không làm gì, để Web Speech thật của trình duyệt chạy.
  if (!window.ReactNativeWebView) return;
  if (window.__nativeTtsBridgeInstalled) return;
  window.__nativeTtsBridgeInstalled = true;

  var nextId = 1;
  var pending = {}; // id -> utterance đang chờ đọc xong

  function post(msg) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    } catch (e) { /* không gửi được thì thôi, đừng phá UI */ }
  }

  function Utterance(text) {
    this.text = text == null ? '' : String(text);
    this.lang = 'en-US';
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
    this.voice = null;
    this.onstart = null;
    this.onend = null;
    this.onerror = null;
  }

  function pendingCount() {
    var n = 0;
    for (var k in pending) { if (Object.prototype.hasOwnProperty.call(pending, k)) n++; }
    return n;
  }

  // Gọi khi phần native báo câu id đã đọc xong (hoặc lỗi/bị cắt).
  function finish(id, kind) {
    var u = pending[id];
    if (!u) return;
    delete pending[id];
    if (!pendingCount()) {
      synth.speaking = false;
      synth.pending = false;
    }
    // onerror không có thì dùng tạm onend — audio-provider.js gán cả 2 vào
    // cùng 1 hàm done() nên không lệch gì.
    var cb = (kind === 'error') ? (u.onerror || u.onend) : u.onend;
    if (typeof cb === 'function') {
      try { cb({ type: kind, utterance: u }); } catch (e) { /* lỗi trong callback của game, bỏ qua */ }
    }
  }

  var synth = {
    speaking: false,
    pending: false,
    paused: false,

    speak: function (u) {
      if (!u) return;
      var id = nextId++;
      pending[id] = u;
      synth.speaking = true;
      if (typeof u.onstart === 'function') {
        try { u.onstart({ type: 'start', utterance: u }); } catch (e) { /* bỏ qua */ }
      }
      post({
        type: 'tts-speak',
        id: id,
        text: u.text,
        lang: u.lang || 'en-US',
        rate: typeof u.rate === 'number' ? u.rate : 1,
        pitch: typeof u.pitch === 'number' ? u.pitch : 1
      });
    },

    cancel: function () {
      var ids = [];
      for (var k in pending) { if (Object.prototype.hasOwnProperty.call(pending, k)) ids.push(k); }
      post({ type: 'tts-cancel' });
      // Đóng sổ các câu đang chờ để không có câu nào treo mãi không báo
      // xong. Câu cũ bị huỷ mà gọi onend cũng vô hại: audio-provider.js có
      // sẵn chốt chặn latestSpeakId, câu không còn mới nhất sẽ tự bỏ qua.
      ids.forEach(function (id) { finish(id, 'end'); });
    },

    pause: function () {},
    resume: function () {},

    // Trả về danh sách rỗng là CỐ Ý: giọng đọc do phần native chọn và ấn
    // định (giống nhau trên mọi máy), không để từng trình duyệt tự chọn như
    // trước. pickBestVoice() trong audio-provider.js nhận mảng rỗng sẽ để
    // nguyên voice = null, đúng điều ta muốn.
    getVoices: function () { return []; },
    addEventListener: function () {},
    removeEventListener: function () {},
    dispatchEvent: function () { return false; },
    onvoiceschanged: null
  };

  // Phần native gọi ngược vào 2 hàm này (xem mobile/App.js).
  window.__nativeTtsDone = function (id) { finish(id, 'end'); };
  window.__nativeTtsError = function (id) { finish(id, 'error'); };

  // window.speechSynthesis trong trình duyệt thật là thuộc tính chỉ-đọc nên
  // gán thẳng có thể trượt không báo lỗi — dùng defineProperty trước, gán
  // thẳng chỉ là phương án dự phòng.
  function install(name, value) {
    try {
      Object.defineProperty(window, name, { value: value, configurable: true, writable: true });
    } catch (e) {
      window[name] = value;
    }
  }
  install('speechSynthesis', synth);
  install('SpeechSynthesisUtterance', Utterance);
})();
