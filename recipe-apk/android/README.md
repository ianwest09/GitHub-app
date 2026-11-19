# Android WebView wrapper

Gradle + Kotlin project that packages `../app` into a real installable APK for a Redmi Note 10 Pro. It is the native half of the fallback required by `../FINAL-PROMPT.md`; it was not compiled in this sandbox because Android SDK/JDK/Gradle are absent here. The no-secrets GitHub Actions workflow at `../../.github/workflows/build-android.yml` now compiles it into a debug APK artifact on a hosted runner.

- `minSdk 26`, `targetSdk 35`, `compileSdk 35`, `arm64-v8a`.
- `WebViewAssetLoader` serves local files from `https://appassets.androidplatform.net/assets/www/`; no `file://` URLs, no CDN, no automatic network call.
- `sw.js` assets are copied by `../sync-assets.sh`.
- Exact alarms, `BootReceiver` restore, Cook Mode `specialUse` foreground service, notification channel, MIUI battery/alarm settings, TTS, print and document-picker export/import are implemented in Kotlin.
- `INTERNET` is declared only for the optional, user-initiated LAN sync. Core features work in airplane mode.
- `../../.github/workflows/build-android.yml` runs the web tests, builds `assembleDebug`, and uploads `app-debug.apk` plus its SHA-256.

Build and install instructions: `../BUILD.md`. Web app architecture: `../app/README.md`. Assumptions: `../ASSUMPTIONS.md`.

Do not commit `keystore.properties`, `release.keystore`, `local.properties`, `.gradle/`, `.gradle-dist/` or `app/build/`; the repo `.gitignore` excludes them.
