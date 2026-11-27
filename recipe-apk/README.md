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
| `android/` | Native Gradle/Kotlin WebView-wrapper project; compiled into a debug APK by the CI workflow |
| `sync-service/` | Zero-dependency optional LAN sync server |
| `sync-assets.sh` | Copies `app/` into `android/app/src/main/assets/www/` |
| `../.github/workflows/build-android.yml` | Verified no-secrets GitHub Actions workflow: web tests + debug APK artifact ([run 44481659196](https://github.com/ianwest09/GitHub-app/actions/runs/44481659196)) |

## Quick start

- **Use the app now:** open the live preview for `app/` (port 8001), or run `python3 -m http.server 8001 --bind 0.0.0.0 --directory recipe-apk/app` from the repo root.
- **Build an APK:** let GitHub Actions build a debug APK after each relevant push, or follow `BUILD.md` locally with Android Studio / JDK 17 / Android SDK 35.
- **Run tests:** `cd app && npm install && npm run test:all`.
- **Optional sync:** `cd sync-service && npm start`, then read `OPTIONAL-SYNC.md`.

No signed release APK was produced in this sandbox because the Android toolchain is absent; `.github/workflows/build-android.yml` has successfully built a debug APK artifact on GitHub ([run 44481659196](https://github.com/ianwest09/GitHub-app/actions/runs/44481659196)). No price was guessed; no partial total is presented as final. No Play Store listing, account, API key or runtime cloud dependency is involved. The branch was committed and pushed at the user's explicit request; no PR or merge has been opened.
