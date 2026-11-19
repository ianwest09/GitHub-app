# Christmas Lunch recipe & cost app — index

`FINAL-PROMPT.md` is the definitive consolidated prompt and supersedes `BUILD-PROMPT.md`. This folder is the executed result of that prompt.

| Path | What it is |
| --- | --- |
| `FINAL-PROMPT.md` | Definitive prompt + accurate execution status table |
| `BUILD-PROMPT.md` | Earlier, superseded prompt retained for history |
| `VERIFIED-PRICES.md` | Source-linked price research, 19 Nov 2026, with caveats and expiry |
| `ASSUMPTIONS.md` | Explicit assumptions and everything that could not be verified |
| `BUILD.md` | Exact Android build, signing, sideload and MIUI instructions |
| `OPTIONAL-SYNC.md` | JSON contract for the optional, off-by-default LAN sync |
| `app/` | Working no-build offline-first web app; live preview on port 8001 |
| `app/README.md` | Data model, scheduling algorithm, cheaper-route logic, tests |
| `android/` | Native Gradle/Kotlin WebView-wrapper project (source; not compiled here) |
| `sync-service/` | Zero-dependency optional LAN sync server |
| `sync-assets.sh` | Copies `app/` into `android/app/src/main/assets/www/` |

## Quick start

- **Use the app now:** open the live preview for `app/` (port 8001), or run `python3 -m http.server 8001 --bind 0.0.0.0 --directory recipe-apk/app` from the repo root.
- **Build an APK:** follow `BUILD.md` on a machine with Android Studio / JDK 17 / Android SDK 35.
- **Run tests:** `cd app && npm install && npm run test:all`.
- **Optional sync:** `cd sync-service && npm start`, then read `OPTIONAL-SYNC.md`.

No signed APK was produced in this sandbox because the Android toolchain is absent. No price was guessed; no partial total is presented as final. No commit, push, GitHub upload, Play Store listing, account or API key is involved.
