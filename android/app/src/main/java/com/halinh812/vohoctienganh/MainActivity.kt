package com.halinh812.vohoctienganh

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.Toast
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.io.IOException
import java.util.Locale

/**
 * Vỏ app Android: mở trang game web (nhúng sẵn trong APK) trong 1 WebView
 * toàn màn hình, và đọc tiếng Anh thay cho trang web.
 *
 * Vì sao phải đọc thay: WebView của Android KHÔNG có Web Speech API, mà cả 8
 * game đều đọc tiếng Anh bằng đúng thứ đó. Trang web có sẵn 1 cầu nối
 * (engine/native-tts-bridge.js) gửi lệnh "đọc câu này" sang đây qua đối tượng
 * window.AndroidTTS; ở đây đọc bằng TextToSpeech của máy rồi BÁO NGƯỢC lại
 * lúc đọc xong — tín hiệu "đọc xong" là bắt buộc, vì game chờ đúng tín hiệu
 * đó mới chuyển câu (thiếu nó thì lỗi câu dài bị cắt ngang sẽ quay lại).
 */
class MainActivity : Activity() {

    private lateinit var web: WebView
    private val main = Handler(Looper.getMainLooper())

    private var tts: TextToSpeech? = null
    private var ttsReady = false
    private var ttsFailed = false
    private var warnedNoEnglish = false
    /** Lệnh đọc tới trước khi bộ đọc của máy kịp khởi động xong — giữ lại, đọc sau. */
    private val waitingForTts = ArrayList<SpeakRequest>()

    /** Chờ người dùng chọn xong file sao lưu để trả về cho trang web. */
    private var pendingFilePick: ValueCallback<Array<Uri>>? = null

    private data class SpeakRequest(val id: Int, val text: String, val lang: String, val rate: Float, val pitch: Float)

    @SuppressLint("SetJavaScriptEnabled", "JavascriptInterface")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Bọc WebView trong 1 khung để chừa đúng chỗ cho thanh trạng thái/thanh
        // điều hướng của máy (Android 15 trở lên bắt app vẽ tràn xuống dưới
        // các thanh này — không chừa thì nút "Về trang chủ" bị thanh trạng
        // thái che mất).
        // Ép MỌI đời máy cùng 1 kiểu: app tự chừa chỗ cho thanh trạng thái +
        // bàn phím (Android 15 bắt buộc kiểu này, máy cũ thì không) — để 1
        // đoạn code chạy đúng như nhau trên mọi máy thay vì mỗi đời 1 kiểu.
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val frame = FrameLayout(this)
        frame.setBackgroundColor(PAGE_BG)
        web = WebView(this)
        web.setBackgroundColor(PAGE_BG)
        frame.addView(web, FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)
        setContentView(frame)
        ViewCompat.setOnApplyWindowInsetsListener(frame) { v, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout() or WindowInsetsCompat.Type.ime()
            )
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            WindowInsetsCompat.CONSUMED
        }

        web.settings.apply {
            javaScriptEnabled = true
            // Tiến độ học của bé lưu bằng localStorage -> bắt buộc bật.
            domStorageEnabled = true
            // Tiếng "ting"/"buzz" khi đúng/sai (Web Audio) kêu được ngay, không
            // phải chờ bé chạm màn hình lần đầu.
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            // Bật để trang web đọc được file sao lưu bé/bố mẹ chọn từ máy (file
            // chọn về có dạng content://...). Trang chạy trong app là code của
            // chính mình, không nạp nội dung lạ nào, nên bật không có rủi ro.
            allowContentAccess = true
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            // Giữ cỡ chữ đúng như thiết kế dù máy đang đặt cỡ chữ hệ thống to:
            // trang game tính bố cục theo đúng cỡ chữ gốc, phóng chữ lên là vỡ
            // khung (chữ tràn ra ngoài ô, nút bị đẩy khỏi màn hình).
            textZoom = 100
        }
        web.isVerticalScrollBarEnabled = false
        web.overScrollMode = WebView.OVER_SCROLL_NEVER

        web.addJavascriptInterface(TtsBridge(), "AndroidTTS")
        web.webViewClient = AssetWebViewClient()
        // Có WebChromeClient thì hộp thoại confirm()/alert() của trang web mới
        // hiện ra được (vd hỏi lại trước khi khôi phục tiến độ) — thiếu nó thì
        // confirm() âm thầm trả về "Không".
        web.webChromeClient = FileAwareChromeClient()

        tts = TextToSpeech(this) { status -> onTtsInit(status) }

        web.loadUrl("https://$ASSET_HOST/index.html")
    }

    // ---------------------------------------------------------------- trang web

    /**
     * Phục vụ trang game từ assets của APK dưới 1 địa chỉ https giả
     * (appassets.androidplatform.net — tên miền Google dành riêng cho việc này,
     * không bao giờ đi ra mạng thật). Phải là https chứ không mở thẳng
     * file:///: game dùng ES module (import ... from) và fetch() các file
     * JSON, cả 2 thứ đó đều bị WebView chặn với file:///.
     */
    private inner class AssetWebViewClient : WebViewClient() {
        override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
            val url = request.url
            if (url.host != ASSET_HOST) return null // font Google... cứ ra mạng như thường
            return serveAsset(url.path ?: "/")
        }

        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            if (request.url.host == ASSET_HOST) return false
            // Link ra ngoài (nếu có) mở bằng trình duyệt, không mở đè lên game.
            try {
                startActivity(Intent(Intent.ACTION_VIEW, request.url))
            } catch (e: ActivityNotFoundException) { /* máy không có trình duyệt — bỏ qua */ }
            return true
        }
    }

    private fun serveAsset(rawPath: String): WebResourceResponse {
        val path = rawPath.trimStart('/').ifEmpty { "index.html" }
        if (path.contains("..")) return notFound()
        return try {
            val stream = assets.open("web/$path")
            val mime = mimeOf(path)
            val encoding = if (mime.startsWith("text/") || mime == "application/json" || mime == "image/svg+xml") "utf-8" else null
            WebResourceResponse(mime, encoding, stream).apply {
                // Nội dung nằm sẵn trong máy, không cần cache thêm — và không
                // cache thì cập nhật bản mới là thấy ngay, không dính bản cũ.
                responseHeaders = mapOf("Cache-Control" to "no-cache")
            }
        } catch (e: IOException) {
            // Bình thường: trang game có hỏi /api/... (chỉ có khi chạy server
            // quản trị trên máy tính) và tự bỏ qua khi nhận 404.
            notFound()
        }
    }

    private fun notFound() = WebResourceResponse(
        "text/plain", "utf-8", 404, "Not Found", mapOf("Cache-Control" to "no-cache"),
        ByteArrayInputStream(ByteArray(0))
    )

    /**
     * Tự khai báo kiểu file thay vì để Android đoán: có máy đoán sai/không ra
     * kiểu của file .js, mà trình duyệt TỪ CHỐI chạy ES module nếu kiểu file
     * không phải JavaScript -> trắng màn hình, không vào được game.
     */
    private fun mimeOf(path: String): String = when (path.substringAfterLast('.', "").lowercase(Locale.ROOT)) {
        "html", "htm" -> "text/html"
        "js", "mjs" -> "text/javascript"
        "css" -> "text/css"
        "json" -> "application/json"
        "png" -> "image/png"
        "jpg", "jpeg" -> "image/jpeg"
        "webp" -> "image/webp"
        "gif" -> "image/gif"
        "svg" -> "image/svg+xml"
        "ico" -> "image/x-icon"
        "wav" -> "audio/wav"
        "mp3" -> "audio/mpeg"
        "ogg" -> "audio/ogg"
        "mp4" -> "video/mp4"
        "webm" -> "video/webm"
        "woff" -> "font/woff"
        "woff2" -> "font/woff2"
        "ttf" -> "font/ttf"
        else -> "application/octet-stream"
    }

    // ---------------------------------------------------------------- chọn file

    /**
     * Nút "Khôi phục từ file" trong Trang phụ huynh dùng <input type="file">.
     * WebView của Android KHÔNG tự mở cửa sổ chọn file — không có đoạn này
     * thì bấm nút không có phản ứng gì. Đây chính là đường để chuyển tiến độ
     * của bé từ bản web sang app (tải file sao lưu ở bản web -> khôi phục
     * trong app), nên bắt buộc phải chạy được.
     */
    private inner class FileAwareChromeClient : WebChromeClient() {
        override fun onShowFileChooser(
            view: WebView,
            callback: ValueCallback<Array<Uri>>,
            params: FileChooserParams
        ): Boolean {
            pendingFilePick?.onReceiveValue(null)
            pendingFilePick = callback
            // Không lọc theo kiểu file: file .json gửi qua Zalo/tải về thường bị
            // máy ghi nhận là "tệp không rõ loại", lọc "application/json" thì
            // file sao lưu bị ẩn đi, không chọn được.
            val pick = Intent(Intent.ACTION_GET_CONTENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = "*/*"
            }
            return try {
                @Suppress("DEPRECATION")
                startActivityForResult(Intent.createChooser(pick, "Chọn file sao lưu tiến độ"), REQ_PICK_FILE)
                true
            } catch (e: ActivityNotFoundException) {
                pendingFilePick = null
                false
            }
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == REQ_PICK_FILE) {
            // Kể cả khi bấm Huỷ cũng PHẢI trả lời (null) — không trả lời thì
            // WebView coi như vẫn đang chờ, lần sau bấm nút không mở lại được.
            pendingFilePick?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data))
            pendingFilePick = null
            return
        }
        @Suppress("DEPRECATION")
        super.onActivityResult(requestCode, resultCode, data)
    }

    // ---------------------------------------------------------------- đọc tiếng Anh

    /** Đối tượng window.AndroidTTS mà engine/native-tts-bridge.js gọi tới. */
    private inner class TtsBridge {
        // Hàm này chạy trên 1 luồng phụ của WebView, KHÔNG phải luồng giao diện
        // -> mọi việc thật đều đẩy về luồng chính qua main.post.
        @JavascriptInterface
        fun postMessage(json: String) {
            val msg = try { JSONObject(json) } catch (e: Exception) { return }
            when (msg.optString("type")) {
                "tts-speak" -> {
                    val req = SpeakRequest(
                        id = msg.optInt("id"),
                        text = msg.optString("text"),
                        lang = msg.optString("lang", "en-US").ifEmpty { "en-US" },
                        rate = msg.optDouble("rate", 1.0).toFloat(),
                        pitch = msg.optDouble("pitch", 1.0).toFloat()
                    )
                    main.post { speak(req) }
                }
                "tts-cancel" -> main.post { tts?.stop() }
            }
        }
    }

    private fun onTtsInit(status: Int) {
        val engine = tts
        if (status != TextToSpeech.SUCCESS || engine == null) {
            ttsFailed = true
            toast("Máy chưa có bộ đọc giọng nói. Vào Cài đặt → Văn bản thành giọng nói để cài đặt.")
            waitingForTts.forEach { reportDone(it.id, error = true) }
            waitingForTts.clear()
            return
        }
        engine.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) {}
            override fun onDone(utteranceId: String?) { utteranceId?.toIntOrNull()?.let { reportDone(it, error = false) } }
            @Deprecated("Deprecated in Java")
            override fun onError(utteranceId: String?) { utteranceId?.toIntOrNull()?.let { reportDone(it, error = true) } }
            override fun onError(utteranceId: String?, errorCode: Int) { utteranceId?.toIntOrNull()?.let { reportDone(it, error = true) } }
            // Bị câu mới đè lên giữa chừng: vẫn báo "xong" để không câu nào
            // treo mãi. Trang web tự bỏ qua báo cáo của câu cũ (xem cầu nối).
            override fun onStop(utteranceId: String?, interrupted: Boolean) { utteranceId?.toIntOrNull()?.let { reportDone(it, error = false) } }
        })
        ttsReady = true
        waitingForTts.forEach { speak(it) }
        waitingForTts.clear()
    }

    private fun speak(req: SpeakRequest) {
        if (ttsFailed) { reportDone(req.id, error = true); return }
        val engine = tts
        if (!ttsReady || engine == null) { waitingForTts.add(req); return }
        if (req.text.isBlank()) { reportDone(req.id, error = false); return }

        val langResult = engine.setLanguage(Locale.forLanguageTag(req.lang))
        if (langResult == TextToSpeech.LANG_MISSING_DATA || langResult == TextToSpeech.LANG_NOT_SUPPORTED) {
            if (!warnedNoEnglish) {
                warnedNoEnglish = true
                toast("Máy chưa tải giọng đọc tiếng Anh. Vào Cài đặt → Văn bản thành giọng nói → tải tiếng Anh.")
            }
            engine.setLanguage(Locale.US)
        }
        engine.setSpeechRate(req.rate)
        engine.setPitch(req.pitch)
        // QUEUE_FLUSH: câu mới đè ngay câu đang đọc, đúng như Web Speech cũ.
        val result = engine.speak(req.text, TextToSpeech.QUEUE_FLUSH, null, req.id.toString())
        if (result != TextToSpeech.SUCCESS) reportDone(req.id, error = true)
    }

    private fun reportDone(id: Int, error: Boolean) {
        val fn = if (error) "__nativeTtsError" else "__nativeTtsDone"
        main.post { web.evaluateJavascript("window.$fn && window.$fn($id)", null) }
    }

    private fun toast(text: String) = main.post { Toast.makeText(this, text, Toast.LENGTH_LONG).show() }

    // ---------------------------------------------------------------- vòng đời

    /**
     * Nút Quay lại của máy: trong 1 màn chơi thì bấm hộ nút "Về trang chủ" của
     * game thay vì thoát luôn app (bé bấm nhầm là mất ván đang chơi). Chỉ thoát
     * app khi đang ở Trang chủ (không còn nút nào để quay về).
     */
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        val js = "(function(){var b=document.getElementById('homeBtn')||document.getElementById('homeBtn2')||document.getElementById('backBtn');if(b){b.click();return true;}return false;})()"
        web.evaluateJavascript(js) { result ->
            @Suppress("DEPRECATION")
            if (result != "true") super.onBackPressed()
        }
    }

    override fun onPause() {
        super.onPause()
        // Thoát ra màn hình chính giữa chừng thì ngừng đọc ngay, không để máy
        // tiếp tục nói tiếng Anh khi bé đã chuyển sang app khác.
        tts?.stop()
        web.onPause()
    }

    override fun onResume() {
        super.onResume()
        web.onResume()
    }

    override fun onDestroy() {
        tts?.stop()
        tts?.shutdown()
        tts = null
        web.destroy()
        super.onDestroy()
    }

    private companion object {
        const val ASSET_HOST = "appassets.androidplatform.net"
        const val REQ_PICK_FILE = 4201
        val PAGE_BG = Color.parseColor("#E9E2CD")
    }
}
