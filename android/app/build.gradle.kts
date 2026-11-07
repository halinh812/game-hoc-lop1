plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Số build tự tăng theo mỗi lần GitHub Actions chạy — Android chỉ cho cài đè
// khi versionCode của bản mới LỚN HƠN bản đang có.
val buildNumber = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()

// Phần game web nằm ở thư mục GỐC của repo (cha của android/). Mỗi lần build
// chép đúng những gì trang game cần vào assets của APK, để app chạy OFFLINE
// mà vẫn luôn là bản game mới nhất trong repo — không phải chép tay, không có
// 2 bản game lệch nhau.
val repoRoot: File = rootProject.projectDir.parentFile
val webAssetsRoot: File = layout.buildDirectory.get().dir("generated/webassets").asFile

val signingPassword: String? = System.getenv("SIGNING_STORE_PASSWORD")?.takeIf { it.isNotBlank() }

// Thiếu mật khẩu chữ ký thì DỪNG HẲN, báo lỗi rõ ràng — tuyệt đối không âm thầm
// build ra 1 bản chữ ký tạm (bản đó lỡ cài vào máy bé thì bản chính thức sau
// không cài đè được, phải gỡ app và mất tiến độ).
val checkSigningPassword = tasks.register("checkSigningPassword") {
    doFirst {
        if (signingPassword == null) {
            throw GradleException(
                "Thiếu mật khẩu chữ ký app (SIGNING_STORE_PASSWORD). Thêm nó vào " +
                    "GitHub: Settings -> Secrets and variables -> Actions -> New repository secret."
            )
        }
    }
}

val copyWebAssets = tasks.register<Sync>("copyWebAssets") {
    from(repoRoot) {
        include("index.html", "app.js")
        include("engine/**", "games/**", "content/**", "assets/**")
        exclude("**/.DS_Store")
    }
    into(File(webAssetsRoot, "web"))
}

android {
    namespace = "com.halinh812.vohoctienganh"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.halinh812.vohoctienganh"
        minSdk = 24
        targetSdk = 35
        versionCode = buildNumber
        versionName = "1.0.$buildNumber"
    }

    // Chữ ký CỐ ĐỊNH cho mọi bản build: Android chỉ cho cài đè bản mới lên bản
    // cũ khi 2 bản cùng chữ ký. Chữ ký khác -> phải gỡ app -> gỡ app là MẤT
    // SẠCH tiến độ học của bé. Nên KHÔNG BAO GIỜ được build bằng chữ ký tạm.
    //
    // File chữ ký (android/keystore/release.jks) nằm trong repo nhưng bị khoá
    // bằng mật khẩu. Mật khẩu KHÔNG nằm trong code mà cất trong GitHub Secrets
    // (tên SIGNING_STORE_PASSWORD) — repo này công khai, ai cũng đọc được code,
    // nhưng không ai đọc được Secrets. Không có mật khẩu thì file chữ ký vô dụng.
    signingConfigs {
        create("release") {
            storeFile = rootProject.file("keystore/release.jks")
            storePassword = signingPassword
            keyAlias = "vohoctienganh"
            keyPassword = signingPassword
        }
    }

    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }

    sourceSets["main"].assets.srcDir(webAssetsRoot)
    androidResources { noCompress += listOf("mp3", "wav", "mp4", "ogg") }
}

tasks.named("preBuild") { dependsOn(checkSigningPassword, copyWebAssets) }

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
}
