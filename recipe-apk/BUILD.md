# Build & install — Christmas Lunch app

## What was and was not produced here

| Deliverable | Here |
| --- | --- |
| Offline-first web app | ✅ `app/`, live preview on port 8001 |
| Native Android WebView-wrapper source | ✅ `android/` |
| Optional LAN sync service | ✅ `sync-service/` + `OPTIONAL-SYNC.md` |
| Signed `arm64-v8a` APK | ❌ **not produced in this sandbox** |

The sandbox has no Java/JDK, Android SDK, Gradle/Kotlin compiler, `sdkmanager`, `adb`, `aapt`, `d8`, `zipalign`, `apksigner`, `keytool`, Flutter or Dart, and no `ANDROID_HOME`. The Android project is complete source. The branch was committed and pushed at the user's explicit request, and the GitHub Actions workflow in section 2b can now build a debug APK without a local Android Studio install.

## Prerequisites on your computer

- Android Studio (Ladybug or newer) **or** JDK 17 + Android SDK Platform 35 + SDK Build-Tools.
- A Redmi Note 10 Pro with USB debugging enabled, or an emulator.
- Optional: `adb` on your PATH for command-line install.
- Optional: Node.js 18+ only if you want the LAN sync service.

`android/gradlew` is a small shell bootstrap: it downloads Gradle 8.9 into `android/.gradle-dist` (gitignored) and runs it. No `gradle-wrapper.jar` binary is checked in. If you already have Gradle 8.9 installed, it is used directly. On Windows, open the `android` folder in Android Studio, or run the commands below from WSL/Git Bash.

## 1. Sync the web assets

After any edit to `app/`, copy the current files into the Android project:

```bash
cd recipe-apk
./sync-assets.sh
```

This populates `android/app/src/main/assets/www/` with `index.html`, `styles.css`, `manifest.json`, `icon.svg`, `sw.js` and `js/*.js`. It deliberately excludes `node_modules/`, `tests/` and `package.json`.

## 2. Build a debug APK (installable, debug-signed)

```bash
cd recipe-apk/android
./gradlew assembleDebug
```

Output:

```text
app/build/outputs/apk/debug/app-debug.apk
```

Debug builds use the automatic Android debug key and get application id `za.co.portalfred.christmaslunch.debug`. They are fine for sideloading to your own phone.

## 2b. Or build it on GitHub Actions (no local Android Studio needed)

`.github/workflows/build-android.yml` runs on pushes to `arena/2b1e7304-github-app`, on PRs targeting `main`, and manually via **Run workflow**. It:

1. runs `npm run test:all` for the web app;
2. sets up JDK 17, Android SDK 35 and Gradle 8.9;
3. syncs web assets and runs `./gradlew assembleDebug`;
4. uploads `christmas-lunch-debug-apk-<sha>` containing `app-debug.apk` and `apk.sha256`.

No secrets are needed because this is a debug build. Watch or download it with:

```bash
gh run list --workflow build-android.yml --branch arena/2b1e7304-github-app
gh run watch <run-id> --exit-status
gh run download <run-id> -n christmas-lunch-debug-apk-<sha>
```

A signed release APK still needs your keystore; do not commit it. If you later want CI to sign a release, add the keystore and passwords as GitHub Actions secrets and never paste them into chat.

## 3. Build a signed release APK

Generate your own keystore **once** and keep it private:

```bash
cd recipe-apk/android
keytool -genkeypair -v \
  -keystore release.keystore \
  -alias christmas-lunch \
  -keyalg RSA -keysize 2048 -validity 10000
```

Create `keystore.properties` from the example and fill in your passwords:

```bash
cp keystore.properties.example keystore.properties
# edit: storeFile, storePassword, keyAlias, keyPassword
```

Then:

```bash
./gradlew assembleRelease
```

Output:

```text
app/build/outputs/apk/release/app-release.apk
```

`release.keystore` and `keystore.properties` are gitignored. If `keystore.properties` is missing, the release build still produces an installable APK signed with the debug key — treat that as a local test build, not a production release. `BUILD.md` does not publish anything or create a Play Store listing.

## 4. Install on the Redmi Note 10 Pro

### With Android Studio
Open `recipe-apk/android`, select your device, press **Run**. Android Studio installs the debug APK automatically.

### With adb

```bash
cd recipe-apk
adb devices
adb install -r android/app/build/outputs/apk/release/app-release.apk
# or: adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

On MIUI you may also need:

- Settings → Additional settings → Developer options → **USB debugging** and **Install via USB**.
- **USB debugging (Security settings)** for command-line installs.
- Approve the “Allow USB debugging?” prompt on the phone.
- If `adb devices` shows `unauthorized`, revoke USB debugging authorisations and reconnect.

## 5. First-run MIUI setup (important for timers)

Open **Xmas Lunch** and go to **More → MIUI reliability**:

1. **Battery optimisation** → set this app to **No restrictions**. Also enable **Autostart** in MIUI if present.
2. **Exact alarms** → allow **Alarms & reminders** (Android 12/13) / exact alarms (Android 14+). Without this, timers fall back to a windowed alarm and the UI says “timer started” rather than “exact-alarm timer started”.
3. **Notifications** → allow the notification permission and the **Cook timers** channel.

Cook Mode also starts a foreground service and keeps the screen on. Timers use `AlarmManager.setExactAndAllowWhileIdle`; `BootReceiver` re-arms them after a reboot.

## 6. Optional LAN sync (off by default)

Core features work in airplane mode. Only if you want to move a backup between devices:

```bash
cd recipe-apk/sync-service
PORT=8787 HOST=0.0.0.0 npm start
```

Find your computer's LAN IP and enter it in the app under **More → Optional LAN sync**, e.g. `http://192.168.1.20:8787`. Tap **Test connection**, **Sync backup** or **Push manual prices**. Full JSON contract: `OPTIONAL-SYNC.md`. No account, API key, cloud or automatic background sync.

## 7. Web preview / tests

The web app is already running in the live preview on port 8001. To run it locally:

```bash
cd recipe-apk/app
python3 -m http.server 8001 --bind 0.0.0.0
```

Tests:

```bash
cd recipe-apk/app
npm install
npm run test:all
```

`npm test` covers the pricing/scheduling engine; `npm run test:ui` drives every tab in a simulated DOM. Neither test needs an Android SDK.

## Troubleshooting

- **`local.properties` / SDK not found:** opening `android/` in Android Studio generates `local.properties` with `sdk.dir`. For CLI builds, set `ANDROID_HOME`/`ANDROID_SDK_ROOT` to your SDK path.
- **Gradle download fails:** install Gradle 8.9 manually, or open the project in Android Studio and use its bundled Gradle. The project also ships `gradle/wrapper/gradle-wrapper.properties` for Android Studio's wrapper generator.
- **Blank WebView:** confirm System WebView / Chrome is up to date, then rerun `./sync-assets.sh` and rebuild. The wrapper loads `https://appassets.androidplatform.net/assets/www/index.html`.
- **Service worker not caching on the web:** use `localhost` or HTTPS, not `file://`; service workers need a secure origin.
- **Print/export/import does nothing:** these use native Android PrintManager / document picker on the wrapper. In a desktop browser they use `window.print()` and Blob downloads.
- **Two notifications for one timer:** should not happen; the in-page countdown suppresses its own notification when a native exact alarm is armed. If you disabled exact alarms, only the in-page notification fires while the app is open.

## Verification checklist after build

1. Airplane mode: all six tabs, checklist ticks, timers, cost view and backup/import still work.
2. Viewing date 23 Nov 2026: seeded catalogue rows show **Expired — re-check price** and are excluded.
3. Viewing date 25 Dec 2026: **Spar Port Alfred is closed on Christmas Day** appears.
4. Cost tab: coverage banner and partial subtotal only; no final basket total.
5. Add a till-slip price: it appears with source/captured/valid-until metadata and persists after restart.
6. Start two named timers: both fire, survive app backgrounding, and are restored after reboot.
7. Guest count 10 → 12: shopping quantities scale; unknown cook times still say **Set time**.
8. No alcohol-containing item is suggested; no guessed price appears.
