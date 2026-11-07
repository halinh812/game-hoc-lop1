// Cùng phiên bản Android Gradle Plugin + Kotlin với dự án hoc-tieng-anh — bộ
// đó đã build được APK thật trên GitHub Actions của bạn, nên dùng lại cho
// chắc thay vì chọn phiên bản mới chưa kiểm chứng.
plugins {
    id("com.android.application") version "8.7.3" apply false
    id("org.jetbrains.kotlin.android") version "2.0.21" apply false
}
