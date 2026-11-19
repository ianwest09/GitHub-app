# Assumptions and limits

These are the explicit assumptions behind `FINAL-PROMPT.md` and the executed build. Nothing here is a guessed price.

## Meal and dietary assumptions

1. The meal is Christmas lunch for exactly ten people in Port Alfred, Eastern Cape, South Africa, with a 13:00 sitting. The user is the only cook; both hosts are in their 80s.
2. The whole table is alcohol-free because one guest is a recovering alcoholic: no wine, beer, brandy pudding/cake, vanilla extract, alcohol in cooking, or alcohol-free look-alikes. There is no “special” glass.
3. Guest A (stage 4 breast cancer) avoids sugar, yeast, wheat, dairy, vinegar and “food causing cancer”. That last phrase is undefined, so the shared table is interpreted conservatively: no processed/cured meat, alcohol, charred meat, added/refined sugar or ultra-processed ingredients. **This is a planning interpretation, not medical advice; confirm final labels with Guest A and her oncology dietitian.**
4. Guest B eats chicken and no other meat, so chicken is the only meat in shared dishes.
5. Three guests requested tongue. **Red meat at the table is perfectly fine.** The tongue is on its own labelled platter with its own board, knife and tongs only because three people eat it, not because red meat is excluded.
6. Hosts in their 80s drive boneless chicken, finely chopped nuts/seeds, paper-thin tongue, tender vegetables, lighter seasoning and large-print labels.
7. Port Alfred summer drives cooler/ice-pack/shade reminders; no braai char on shared dishes; order the tongue about a week ahead.
8. The one-cook make-ahead schedule and the 09:30–13:00 clock times come from `christmas-lunch-menu/MENU.md`. Only the tongue’s roughly four-hour poach has an explicit duration. Every other step shows **Set time** until the cook enters a duration; the app does not invent one.

## Shop and price assumptions

9. The only permitted shops are **Pick n Pay**, **Woolworths** and **Spar** in Port Alfred. Official spelling “Pick n Pay” is used.
10. Looking up prices is permitted; guessing is not. Every seeded amount traces to a current official catalogue/listing in `VERIFIED-PRICES.md`, with source URL, pack size and validity dates. All figures are stored as integer cents in `app/js/data.js`; the UI formats them. No hardcoded currency amount is used for calculation or display.
11. Research date is **19 November 2026**. Current catalogues expire **22 November 2026**, over a month before Christmas, so the app hard-expires them on **23 November 2026** and prompts for fresh till-slip prices. They are planning references, not Christmas shopping prices.
12. Woolworths online listings may differ from in-store prices; one potato snippet conflicted and the dedicated listing was used with a caveat. Pick n Pay’s PDF text extraction garbled cents, so the `.99` readings need visual catalogue confirmation before purchase. These caveats are recorded in `VERIFIED-PRICES.md`.
13. Cheaper-route comparisons are made **only** where two or more current, like-for-like, verified prices exist. Spar frozen bone-in mixed chicken is not like-for-like with fresh boneless chicken for hosts in their 80s. Pick n Pay’s potato multi-buy applies only when four qualifying items are in the basket. A single-source line says “single source / insufficient data”, never “cheapest”.
14. There is **no verified ox/beef tongue price** at any of the three shops. That line stays unpriced with “order from butcher, enter till-slip price”. Most basket lines have no verified price; therefore there is **no defensible full-basket total**. The UI shows a coverage percentage and a clearly labelled partial subtotal only.
15. Spar Port Alfred is **closed on Christmas Day**. Shopping tasks on 25 December trigger a warning and a “move to 24 December or earlier” action. Pick n Pay hours came from a local directory; Woolworths Port Alfred local hours were not verified.
16. Alcohol-containing catalogue items (brandy pudding, brandy Christmas fruit cake) are seeded only as EXCLUDED and are never suggested as purchases.
17. No price is invented, estimated, interpolated, averaged, demo-filled, scraped silently, auto-VAT-adjusted, currency-converted, or refreshed automatically. Manual prices are user-entered and source-linked.

## Technical assumptions

18. Preferred target is a Xiaomi Redmi Note 10 Pro (arm64-v8a, MIUI, Android 11–13). The wrapper sets `minSdk 26`, `targetSdk 35`, `compileSdk 35` and an `arm64-v8a` ABI filter.
19. The sandbox has **no Java/JDK, Android SDK, Gradle/Kotlin compiler, `sdkmanager`, `adb`, `aapt`, `d8`, `zipalign`, `apksigner`, `keytool`, Flutter or Dart**, and no `ANDROID_HOME`. Therefore a signed APK **was not produced in this session**. `BUILD.md` contains exact commands for a machine with Android Studio/JDK 17/SDK 35. A no-secrets GitHub Actions workflow was later added to build a **debug** APK artifact on a hosted runner; it does not sign a release.
20. The executed fallback is a working offline-first web app plus a complete native Android WebView-wrapper project — not a PWA-only result. The Android project uses `WebViewAssetLoader`, a service worker, exact alarms, `BootReceiver`, a Cook Mode `specialUse` foreground service, MIUI settings shortcuts, notification permission, TTS, print, and document-picker import/export.
21. MIUI reliability requires user action: allow **Alarms & reminders / exact alarms**, set battery optimisation to **No restrictions**, allow notifications/autostart, and (on some builds) enable USB-install/security settings. The app surfaces one-tap settings shortcuts; it cannot grant these permissions itself.
22. The app is 100% functional in airplane mode. `INTERNET` is declared only for an optional, user-initiated LAN sync. Core features never call the network. Cleartext is enabled only so a home-LAN `http://192.168.x.x` sync service works; use HTTPS/auth if you ever expose it beyond a trusted LAN.
23. The optional sync service has no account, API key, database or cloud dependency. It stores a local JSON backup and append-only user-entered price records. Only a manually typed till-slip price is pushed; seeded catalogue rows are never presented as fresh observations. Contract: `OPTIONAL-SYNC.md`.
24. Browser service workers require a secure origin. Use `localhost` or HTTPS for the web build; the Android build uses the secure `appassets.androidplatform.net` origin.
25. Timers survive page reload via `localStorage`; native exact alarms survive app kill and reboot via `SharedPreferences` + `BootReceiver`. The in-page countdown and the native alarm are deliberately de-duplicated so you do not get two notifications.
26. Text-to-speech, print, wake lock, exact alarms, document picker and foreground service are native-bridge features on Android. In an ordinary browser the app falls back to Web Speech, `window.print`, Wake Lock API, Notifications API and Blob downloads, or degrades gracefully when a browser API is unavailable.
27. No publishing/Play Store listing, account, API key, telemetry, analytics or cloud runtime dependency. The earlier no-commit/no-push preference was explicitly superseded by the user: the branch has been committed and pushed to the current branch only. No PR or merge has been opened.
28. No separate CSV/JSON price seed file was created; the figures live in `app/js/data.js` records. A short 1–2 page table menu card was not requested and was not made. Connected apps were not used.
