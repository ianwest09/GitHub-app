# Christmas Lunch app — offline-first source

This is the no-build web application. Open `index.html` through a local HTTP server (or the live preview); the Android project in `../android` serves the same files from `app/src/main/assets/www`. There is no bundler, CDN, analytics, account or required backend.

```bash
cd recipe-apk/app
python3 -m http.server 8001 --bind 0.0.0.0
# then open http://localhost:8001/
```

Service-worker caching needs a secure origin: `localhost` or HTTPS. The Android wrapper uses `https://appassets.androidplatform.net/assets/www/index.html`, which is also a secure origin.

## Tests

```bash
npm install
npm run check
npm test          # 14 domain-engine tests
npm run test:ui   # simulated-DOM smoke test of every tab
npm run test:all
```

`tests/ui-smoke.mjs` uses `linkedom` only as a dev dependency. It is not shipped in the Android assets.

## Layers

| Layer | File | Responsibility |
| --- | --- | --- |
| Seed data | `js/data.js` | Stores, source URLs, `PRICE_ENTRIES`, 39 shopping lines, dishes, dietary flags, documented run sheet, closures. All money is integer cents in records; no display currency literals. |
| Domain engine | `js/engine.js` | Expiry, like-for-like checks, bundle/loyalty conditions, `lineCost`, `compareLine`, `optimiseBasket`, `mergeLines`, `scaleQty`, dependency/resource-aware `schedule`, `formatZAR`. |
| Persistence | `js/store.js` | `freshState`, `load`, `save`, `reset`, JSON export/import, schema version 1, timer persistence. Source of truth is `localStorage`. |
| Repository | `js/repository.js` | Optional, user-initiated LAN sync client. `normaliseBaseUrl`, health, backup pull/push, price pull/push, last-write-wins helper. Never called unless a URL is entered and a button is tapped. |
| UI controller | `js/app.js` | Six tabs, render functions, modals, timers, native bridge calls, print cards, large-print/high-contrast settings, backup/import, optional sync buttons. |
| Offline cache | `sw.js`, `manifest.json`, `icon.svg` | Local asset cache and installable PWA metadata. No external assets. |
| Presentation | `index.html`, `styles.css` | Semantic shell, responsive layout, AMOLED dark theme, high-contrast mode, large-print `@media print` sheet. |

## Data model (compact)

`PriceEntry`-style record: `id, store, matchKey, product, packQty, packUnit, priceCents, unitCents, validFrom, validTo, source, url, promotion, loyalty, likeForLike, bundle, bundleMinItems, bundleQualifyingKeys, note, excluded, dietary`.

`ShoppingLine`: `id, name, qty, unit, category, matchKey, ticked, pantry`.

`Dish`: `id, title, dietary[], steps[]`; `Step`: `id, title, resource, durationMin, handsOn, deps[], note`. Only durations explicitly present in `MENU.md` are seeded; everything else shows **Set time** and is excluded from the computed timeline until the cook enters a duration.

`MenuSession` state lives in `store.js`: guest count, viewing date, loyalty flag, travel cost, theme, text size, high contrast, custom prices, user durations, agenda overrides, checklist ticks, timers, optional sync URL and sync timestamp.

The ten portions include both hosts; Host A is one of the hosts. `guestCount` is a portion-count field, not a statement that Host A is a visitor. Recipe-pending shopping lines use `qty: null` and display “recipe pending”; optional coconut rice pudding lines use `clearancePending: true` and display “Host A clearance pending”. Both are excluded from price comparisons and price entry until their recipe, quantity, source, labels and required clearance are supplied. `store.js` migrates saved version-1 state so retired dessert lines, their custom prices and their step durations are removed while user settings and other local data are preserved; optional candidates are appended under fresh line IDs.

## Scheduling algorithm

1. Merge persisted user durations over seed durations. Unknown durations become warnings and are excluded from arithmetic; they are never guessed.
2. Flatten dishes into steps and topologically sort `deps` (prep before cook, tongue poach before slicing).
3. Backward pass from the 13:00 target computes latest start times for known-duration steps.
4. Forward pass emits one merged ordered timeline, preserving the documented `09:30 → 13:00` run sheet as an always-available authoritative view.
5. Resource conflicts are detected (one oven, one stovetop, one cook). The two documented oven batches are respected; conflicts are shown as warnings, not silently double-booked.
6. Portion-count scaling uses `scaleQty(baseQty, 10, guestCount)` and flags cook-time confirmation rather than inventing a new time.

Cook Mode adds named timers, native exact alarms on Android, notifications/TTS, wake lock and a foreground service. Timers persist in `state.timers` and survive a page reload; `BootReceiver` restores native alarms after reboot.

## Cheaper-route logic

- `usable(entry, ctx)` rejects expired rows, excluded alcohol rows, missing prices, loyalty-only rows without a card, unmet bundles and non-like-for-like products.
- `lineCost` normalises the line quantity against `packQty` / `unitCents` and returns integer cents plus the original record for display.
- `compareLine` returns `compared`, `single`, `insufficient`, `expired`, `excluded` or `no-price`. A single source is never called “cheapest”.
- `optimiseBasket` chooses the lowest usable normalised unit price per line, returns a shop-by-shop split, a single-shop view, a coverage percentage and a **partial subtotal** when lines are unpriced. It never prints a final basket total.
- Bundle conditions are explicit: the potato bundle applies only with 4 qualifying basket items; frozen bone-in Spar chicken is not substituted for fresh boneless chicken.
- Optional travel cost is user-entered and never guessed.

## Android bridge

When `window.Android` exists, the UI calls native implementations for exact alarms, notification permission, MIUI battery/alarm settings, TextToSpeech, Cook Mode foreground service, screen-on, text zoom, Android PrintManager, document-picker export and document-picker import. Every call is a no-op in a normal browser. See `../android/app/src/main/java/za/co/portalfred/christmaslunch/`.

## Deliberate limits

- No price is guessed, interpolated, averaged, scraped silently or refreshed automatically.
- Seeded catalogue rows hard-expire on 23 November 2026 and are excluded from totals.
- There is no verified ox/beef tongue price, so that line stays unpriced.
- A basket with gaps shows coverage and a partial subtotal only.
- No alcohol-containing catalogue item is ever suggested.
- Optional LAN sync is off by default; see `../OPTIONAL-SYNC.md`.

Assumptions and everything that could not be verified are listed in `../ASSUMPTIONS.md`. Build/install steps are in `../BUILD.md`.
