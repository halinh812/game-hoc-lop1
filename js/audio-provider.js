// AudioProvider — lớp trừu tượng phát âm thanh. Hiện tại chỉ có
// WebSpeechProvider (miễn phí, chạy ngay trên trình duyệt). Khi nâng cấp
// lên TTS chất lượng cao (Google Cloud TTS Neural2 / ElevenLabs / giọng thu
// sẵn) sau này, chỉ cần viết thêm 1 provider mới cùng implement speak() và
// đổi chỗ khởi tạo trong app.js — không phải sửa lại UI hay Learning Engine.

export function createWebSpeechProvider() {
  return {
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
        u.rate = opts.rate != null ? opts.rate : 0.82;
        u.pitch = opts.pitch != null ? opts.pitch : 1.05;
        window.speechSynthesis.speak(u);
      } catch (e) {
        // Một số trình duyệt (đặc biệt Safari iOS) yêu cầu tương tác người
        // dùng trước khi phát được âm thanh — bỏ qua lỗi, không phá UI.
      }
    }
  };
}

// Điểm mở rộng cho tương lai: 1 provider trả file audio thu sẵn / TTS đám
// mây, cùng interface { name, isSupported(), speak(text, opts) } để có thể
// hoán đổi mà không đổi code gọi nó.
export function createAudioProvider() {
  return createWebSpeechProvider();
}
