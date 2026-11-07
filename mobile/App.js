// App "Vở học Tiếng Anh của Bòng" — vỏ Android bọc quanh phần game web.
//
// BƯỚC 1 (bản đang chạy): mới chỉ có WebView + cầu nối âm thanh. Mục tiêu
// của bước này là trả lời ĐÚNG MỘT CÂU HỎI trước khi xây gì thêm: tiếng
// đọc tiếng Anh có ra loa trong app không? Vì WebView của Android không có
// Web Speech API, mà toàn bộ 8 game đều phải đọc tiếng Anh mới chơi được —
// nếu chỗ này không chạy thì mọi thứ phía sau (đăng nhập, đồng bộ Google
// Trang tính, cập nhật) đều vô nghĩa.
//
// CHƯA CÓ ở bước này (làm ở các bước sau): đăng nhập/đăng xuất, đồng bộ
// tiến độ lên Google Trang tính, nhúng phần web vào trong app để chạy
// offline, cơ chế kiểm tra/tải bản mới.
//
// Thanh gỡ lỗi ở dưới đáy màn hình là CỐ Ý cho bản thử này: người viết code
// không cầm được máy Android thật để nhìn, nên cần bạn đọc hộ dòng trạng
// thái đó khi có trục trặc. Bản chính thức sẽ bỏ đi.
import { useCallback, useRef, useState } from 'react';
import { Platform, Pressable, SafeAreaView, StatusBar as RNStatusBar, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Speech from 'expo-speech';

// Nguồn phần game. Bước 1 lấy thẳng từ GitHub Pages đang chạy sẵn cho
// nhanh; bước sau sẽ đổi sang bản nhúng trong máy để chơi được offline.
const GAME_URL = 'https://halinh812.github.io/game-hoc-lop1/';

export default function App() {
  const webRef = useRef(null);
  const [status, setStatus] = useState('Đang mở trang game...');
  const [speakCount, setSpeakCount] = useState(0);
  const [showDebug, setShowDebug] = useState(true);

  // Chạy 1 đoạn JS ngược vào trong trang web. Dấu "true;" ở cuối là yêu cầu
  // của react-native-webview (tránh cảnh báo trên iOS).
  const runInPage = useCallback((js) => {
    if (webRef.current) webRef.current.injectJavaScript(js + '; true;');
  }, []);

  const handleMessage = useCallback((event) => {
    let msg;
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch (e) {
      return; // không phải tin của cầu nối, bỏ qua
    }

    if (msg.type === 'tts-speak') {
      setSpeakCount((n) => n + 1);
      setStatus('Đang đọc: "' + msg.text + '"');

      // Báo ngược "đọc xong" về trang web là BẮT BUỘC — speakThenProceed
      // trong engine/ui-shared.js chờ đúng tín hiệu này mới chuyển câu.
      // Thiếu nó thì lỗi cắt câu của Vòng 52 quay lại nguyên vẹn.
      const done = () => runInPage(`window.__nativeTtsDone(${msg.id})`);
      const failed = (err) => {
        setStatus('LỖI đọc: ' + (err && err.message ? err.message : 'không rõ'));
        runInPage(`window.__nativeTtsError(${msg.id})`);
      };

      Speech.speak(msg.text, {
        language: msg.lang || 'en-US',
        rate: typeof msg.rate === 'number' ? msg.rate : 1,
        pitch: typeof msg.pitch === 'number' ? msg.pitch : 1,
        onDone: done,
        // Bị cắt giữa chừng (do câu mới đè lên) cũng coi như xong, để không
        // có câu nào treo mãi không báo lại.
        onStopped: done,
        onError: failed,
      });
      return;
    }

    if (msg.type === 'tts-cancel') {
      Speech.stop();
    }
  }, [runInPage]);

  // Nút thử đọc TRỰC TIẾP bằng phần native, không đi qua trang web. Dùng để
  // tách bạch nguyên nhân khi không nghe thấy gì: nút này kêu mà game câm
  // thì lỗi ở cầu nối; nút này cũng câm thì máy chưa có bộ đọc tiếng Anh.
  const testSpeakDirect = useCallback(() => {
    setStatus('Thử đọc trực tiếp (không qua game)...');
    Speech.speak('Hello. Red, blue, yellow.', {
      language: 'en-US',
      rate: 0.92,
      onDone: () => setStatus('Đọc trực tiếp XONG — máy có bộ đọc tiếng Anh.'),
      onError: (e) => setStatus('Đọc trực tiếp LỖI: ' + (e && e.message ? e.message : 'không rõ')),
    });
  }, []);

  const reload = useCallback(() => {
    setStatus('Đang tải lại...');
    if (webRef.current) webRef.current.reload();
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <WebView
        ref={webRef}
        source={{ uri: GAME_URL }}
        style={styles.web}
        onMessage={handleMessage}
        onLoadEnd={() => setStatus('Đã mở xong trang game.')}
        onError={(e) => setStatus('Lỗi tải trang: ' + e.nativeEvent.description)}
        onHttpError={(e) => setStatus('Lỗi HTTP: ' + e.nativeEvent.statusCode)}
        // Game lưu tiến độ bằng localStorage -> bắt buộc bật.
        domStorageEnabled
        javaScriptEnabled
        // Web Audio (tiếng ting/buzz khi đúng/sai) trên Android mặc định bị
        // chặn cho tới khi người dùng chạm màn hình; tắt yêu cầu đó đi để
        // tiếng phản hồi kêu ngay từ lần đầu.
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        // Bé chạm nhiều, không cần phóng to thu nhỏ hay kéo quá đà.
        scalesPageToFit={false}
        overScrollMode="never"
        bounces={false}
      />

      {showDebug ? (
        <View style={styles.debugBar}>
          <Text style={styles.debugText} numberOfLines={2}>
            {status}
            {speakCount > 0 ? `  (đã nhận ${speakCount} lệnh đọc)` : ''}
          </Text>
          <View style={styles.debugBtns}>
            <Pressable style={styles.btn} onPress={testSpeakDirect}>
              <Text style={styles.btnText}>Thử đọc</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={reload}>
              <Text style={styles.btnText}>Tải lại</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setShowDebug(false)}>
              <Text style={styles.btnText}>Ẩn</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E9E2CD',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0,
  },
  web: { flex: 1, backgroundColor: '#E9E2CD' },
  debugBar: {
    backgroundColor: '#233A2A',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  debugText: { color: '#F4F1E6', fontSize: 11 },
  debugBtns: { flexDirection: 'row', gap: 8 },
  btn: {
    backgroundColor: '#E4633F',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  btnGhost: { backgroundColor: '#4A5A4E' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
