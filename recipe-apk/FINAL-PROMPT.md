# FINAL PROMPT — Christmas Lunch recipe & cost app

*Consolidated and definitive. Supersedes `BUILD-PROMPT.md`. All clarifications from the conversation are folded in: alcohol-free table, Port Alfred, hosts in their 80s (Host A is one of them), one cook, red meat at the table is fine, verified prices from the three local shops, cheaper route, and the original no-GitHub-upload preference. That preference was later explicitly superseded when the user asked to push the branch.*

---

```text
Build a complete, installable, offline-first application for one user who is cooking Christmas lunch for ten in Port Alfred, Eastern Cape, South Africa. Deliver the full source tree, a runnable build, and BUILD.md with exact build and install instructions. Do not publish anything, do not create a Play Store listing, do not push to any remote, and do not require an account, API key or server.

## Target device
Xiaomi Redmi Note 10 Pro (MIUI, Android 11-13, Snapdragon 732G, 6 GB RAM, 1080x2400 120 Hz AMOLED). Preferred deliverable: a signed arm64-v8a APK, minSdk 26, targetSdk 35, Kotlin + Jetpack Compose + Material 3 + Room + DataStore + WorkManager + coroutines/Flow, Gradle Kotlin DSL. If the toolchain cannot produce native Android, produce a fully working offline-first web app (no build step, no CDN, no network calls) AND a complete native Android WebView-wrapper project (Gradle + Kotlin + assets) that can be assembled into an APK on a machine with Android Studio. State clearly which of the two you actually produced and why. Never deliver a PWA-only result with no Android project.

"Full stack" = UI layer + domain/scheduling engine + local persistence + repository layer + an OPTIONAL thin REST sync service with a documented JSON contract. The app MUST be 100% functional with the backend off. No login, no ads, no analytics, no telemetry, no cloud dependency.

Permissions on Android: POST_NOTIFICATIONS, SCHEDULE_EXACT_ALARM / USE_EXACT_ALARM, VIBRATE, RECEIVE_BOOT_COMPLETED, FOREGROUND_SERVICE. Optional and OFF by default: CAMERA, READ/WRITE_CALENDAR, INTERNET. MIUI-specific: timers must survive aggressive battery killing — foreground service for Cook Mode, exact alarms, a "disable battery optimisation" onboarding step, and alarm rescheduling after BOOT_COMPLETED. On the web build use the Wake Lock API, the Notifications API and SpeechSynthesis; persist everything locally (localStorage/IndexedDB) and cache all assets with a service worker.

Localisation: ZAR, dd/mm/yyyy, metric units (g, kg, ml, l), degrees C. Large touch targets, large-text/high-contrast accessibility mode, dark theme for AMOLED, one-handed bottom navigation, screen stays on in Cook Mode.

## The meal being planned (seed data)
Ten people at the table, Christmas lunch, 13:00 sitting, Port Alfred. One of the hosts, Host A (stage 4 breast cancer), eats NO sugar, yeast, wheat, dairy, vinegar, or "foods causing cancer" — read that as no processed/cured meat, alcohol, charred meat, added sugar or ultra-processed ingredients on the shared table. One guest eats chicken and no other meat. Three guests asked for tongue. One guest is a recovering alcoholic, so the ENTIRE table is alcohol-free (no wine, beer, brandy custard, vanilla extract, alcohol in cooking, or alcohol-free look-alikes). Red meat at the table is perfectly fine — the tongue is served on its own labelled platter simply because only three people eat it. Both hosts, including Host A, are in their 80s: boneless chicken, finely chopped nuts, paper-thin tongue, tender vegetables, light seasoning, large-print labels, shorter service. One person is cooking, so almost everything is make-ahead and the oven runs in two batches.

Smoked gammon is a separate labelled platter for guests without dietary conflicts, not for Host A or Guest B; homemade ice-cream replaces the former rice-based dessert but remains recipe-pending. No ingredients, quantities, durations, prices or dietary claims are invented for those two items until the recipe/preparation details and labels are supplied. Show both as explicit placeholders across the run sheet, shopping list, cook-mode guardrails, printable labels and Android assets; migrate persisted local state so retired dessert lines, custom prices and step durations do not survive.

Seed recipes, ingredients, step order, dependencies, shopping quantities, the 09:30-13:00 run sheet and every documented clock time from christmas-lunch-menu/MENU.md. NEVER invent a duration, quantity or price that is not explicitly in that document — mark missing durations "Set time" and missing prices "unpriced". The ox tongue has no verified price at any shop: leave it unpriced and flag "order from butcher, enter till-slip price".

## PRICE DATA — VERIFIED LOOKUPS ONLY, NO GUESSING
The only shops are Pick n Pay, Woolworths and Spar in Port Alfred. Looking up prices IS permitted; inventing them is NOT. Seed PriceEntry rows from recipe-apk/VERIFIED-PRICES.md (real figures with source URLs, pack sizes and validity dates). Every displayed amount must trace to one of: a current official catalogue/product listing, manual user entry, a typed/pasted till slip, user-confirmed receipt OCR, or an explicitly enabled official store feed.

FORBIDDEN: invented, estimated, interpolated, "average", "typical", demo, sample or AI-guessed prices; substituting a different product's price as like-for-like; silently converting a multi-buy bundle into a plain unit price; auto-adding VAT; currency conversion; treating an expired catalogue price as current; presenting a partial total as final. ZERO hardcoded currency literals in shipped source — all figures live in database records.

PriceEntry = {id, store, branch, item, productNameAsListed, packQuantity, packUnit, priceInCents, currency: ZAR, normalisedUnitPriceInCents, capturedAt, validFrom, validTo, source: CATALOGUE|STORE_LISTING|MANUAL|RECEIPT|PHOTO_CONFIRMED|API, sourceUrl, isPromotion, loyaltyRequired, bundleCondition, bundleMinItems, isLikeForLike, note, confirmedByUser}. Keep full history, never overwrite silently, show source + captured on + valid until beside every figure.

Hard-expire every catalogue/listing row when validTo passes: badge "Expired — re-check price" and exclude from all comparisons and totals. All seeded rows expire 22 November 2026, over a month before Christmas, so prompt for fresh till-slip prices at purchase time. Unpriced line → "No price yet — add from till slip". Basket with gaps → "Incomplete — N prices needed" + coverage percentage + partial subtotal labelled partial. A comparison with fewer than two current, like-for-like, verified prices → "Insufficient data to compare". A line priced at only one shop → "single source", never "cheapest".

## FEATURE 1 — Recipe timeline ("run my recipes in order of preparation and cooking time")
Data model: Recipe{id,title,servings,tags,dietaryFlags,ingredients[],steps[],notes}; Step{id,order,title,instruction,prepMinutes,cookMinutes,passiveMinutes,dependsOnStepIds[],resource: OVEN|STOVETOP|FRIDGE|FREEZER|COOLER|COUNTER|NONE,temperatureC,canOverlap,handsOn,alarmBeforeMinutes}; Ingredient{id,name,quantity,unit,category,storeHint,pantryStaple,dietaryFlags}; MenuSession{id,recipeIds[],guestCount,targetServeTime,bufferMinutes,equipmentLimits}.

Engine: given a target serve time, backward pass for latest start of every step, forward pass for ONE merged ordered timeline across all recipes. Topological sort of dependencies, prep-before-cook, hands-on vs passive. Detect and warn about resource conflicts (two oven steps, one stovetop, one fridge, one cook), propose a deterministic resolution and show the serve-time impact; never silently double-book the oven. Show idle gaps, day-before vs day-of, and a "you are free for N minutes" indicator. Provide BOTH a preparation-order view and a time-ordered view. Steps with no duration show "Set time", are excluded, and raise a warning. Also ship the documented 09:30–13:00 run sheet as an always-available timeline that needs no invented durations. Cook Mode: one step per screen, huge text, tap/swipe to advance, multiple named concurrent timers with audible + vibration + notification alarms, text-to-speech read-aloud, voice "next step", screen stays on. Scaling by guest count with unit conversion; flag steps whose cook time needs user confirmation, never guess.

## FEATURE 2 — Shopping lists
Auto-generate from selected recipes + guest count; merge duplicates and sum quantities with unit conversion; subtract pantry items. Group by the three shops and by aisle; one-tap reassignment; "no shop" bucket. Per line: quantity, tick-off, pantry toggle, price status (unpriced / priced + source + expiry), notes, 2-tap "add price". Export large-print text, CSV, PDF (print) or share intent. Ad-hoc items supported. Persist progress.

## FEATURE 3 — Agenda
Day/week/month view seeded from the run sheet (T-7 order tongue, T-2 check labels, day-before make-ahead, 09:30 preheat → 13:00 serve). Reminders via exact alarms/notifications; optional system-calendar write (permission-gated, off by default); rescheduling recalculates the timeline. Store hours and public-holiday closures per shop: Spar Port Alfred is CLOSED CHRISTMAS DAY, so flag any shopping task on 25 December and offer to move it to 24 December or earlier. Survive reboot and app kill.

## FEATURE 4 — Cost calculator and CHEAPER ROUTE optimiser
Cost per ingredient, recipe, guest/serving and basket; budget vs actual; all derived only from current PriceEntry rows. Normalise units and show the original listed value alongside. For each line, compare current like-for-like verified prices at Pick n Pay, Woolworths and Spar and select the lowest normalised unit price; show the running total, saving vs the dearest option, and the shop-by-shop split list. Respect conditions visibly: a "BUY ANY 4 for R140" bundle applies only if 4 qualifying items are in the basket; a Smart Shopper price only if the user has the card; frozen bone-in chicken is NOT like-for-like with fresh boneless. Optional USER-ENTERED travel cost/time per extra shop (never a guessed fuel price) and a "is this saving worth the trip?" nudge. Three views: cheapest split basket, single-shop basket (showing lines with no price there), and a per-line three-column compare table. Prominent COVERAGE banner, e.g. "4 of 35 lines priced (11%) — 31 prices still needed. No full-basket total available." One-tap "add price from till slip" per unpriced line, under 5 taps, offline.

## FEATURE 5 — Extras
Dietary guardrails with flags NO_SUGAR, NO_YEAST, NO_WHEAT, NO_DAIRY, NO_VINEGAR, ALCOHOL_FREE, CHICKEN_ONLY, TONGUE_FOR_THREE, RED_MEAT_OK; warn on conflicts, show "shared / for some" labels, flag alcohol-containing catalogue items (brandy pudding, brandy Christmas cake) as EXCLUDED. Pantry inventory with "use what I have". Expiry and cooler reminders for hot humid Port Alfred weather. Local JSON/CSV backup, export and import. Price-freshness dashboard listing expired/soon-to-expire prices with a re-check action. Recipe import from Markdown. Leftovers/storage notes, "what can I prep yesterday?" filter, units converter, "10 people at the table" scaling shortcut, printable large-print menu and dish-label cards. No network dependency for any core feature.

## ACCEPTANCE TESTS
1. A repo-wide search finds ZERO hardcoded currency literals; all figures are PriceEntry records.
2. Seeded chicken line: Pick n Pay fresh skinless breast fillets (R79.99/kg) is the cheapest VERIFIED like-for-like boneless option; Spar frozen bone-in is visibly "not like-for-like"; Woolworths is dearer. Savings are derived arithmetic, not new prices.
3. On 23 Nov 2026 every imported catalogue row is "Expired — re-check price" and excluded from totals.
4. Single-source lines say "insufficient data", never "cheapest"; baskets with gaps show coverage % and a partial subtotal, never a final total.
5. The "BUY ANY 4 for R140" potato bundle applies only with 4 qualifying items; otherwise the plain Woolworths 2 kg price is used and the condition is shown.
6. A 25 December shopping task triggers "Spar Port Alfred is closed on Christmas Day" with a reschedule offer.
7. Set serve time 13:00 → one merged ordered timeline with prep/cook blocks, dependency arrows, oven-conflict warning and "Set time" badges.
8. Two named timers run concurrently, fire with the screen off/background, and survive a reboot (Android) or a page reload (web).
9. Airplane mode: all features work. "Lemons" from 3 recipes merge into one line; tick-off state survives restart. Guest count 10 → 12 rescales quantities and flags steps needing confirmation. Export/import round-trip preserves recipes, prices, agenda and checklist state.
10. No alcohol-containing item appears anywhere as a suggested purchase; no guessed price appears anywhere in the UI.

DELIVER: full source tree, a runnable build (APK if possible), BUILD.md with MIUI sideload steps, a README describing the data model, scheduling algorithm and cheaper-route logic, and an explicit list of assumptions and anything you could not verify.
```

---

## Execution status (this sandbox)

| Item | Status |
| --- | --- |
| Definitive prompt | This file — supersedes `BUILD-PROMPT.md` |
| Working offline-first web app, seeded with the real menu + verified price records | `app/` — running in the live preview on port 8001. No build step, no CDN, no network call for core features. |
| Domain tests + simulated-browser UI smoke test | `npm test` 14/14 pass; `npm run test:ui` passes all six tabs, price entry, expiry, Christmas closure, timers, settings and persistence. |
| Verified price research with sources and expiry dates | `VERIFIED-PRICES.md` |
| Native Android WebView-wrapper project (Gradle + Kotlin + assets) | `android/` — complete source tree, copied web assets, exact-alarm timers, reboot restore, Cook Mode foreground service, MIUI settings, print/export/import/TTS bridge. Compiled successfully in GitHub Actions run 44481659196; still not compiled locally. |
| Optional thin REST sync service + documented JSON contract | `sync-service/server.mjs` (tested locally) + `OPTIONAL-SYNC.md`; off by default, user-initiated only. |
| Build, install and MIUI instructions | `BUILD.md` |
| Data model, scheduling algorithm, cheaper-route logic and run instructions | `app/README.md` |
| Explicit assumptions and unverifiable items | `ASSUMPTIONS.md` |
| GitHub Actions APK workflow | `.github/workflows/build-android.yml` — no-secrets, Node 24 CI that runs the web tests, builds a debug APK from `android/`, and uploads `app-debug.apk` + SHA-256 as an artifact. Verified successful run: [44481659196](https://github.com/ianwest09/GitHub-app/actions/runs/44481659196), artifact `christmas-lunch-debug-apk-184d829596a8fe00abcf8df79f3bebc329df1fcf` (2,194,843 bytes). |
| Signed arm64-v8a APK | **Not produced in the sandbox** — the sandbox has no Java/JDK, Android SDK, Gradle/Kotlin compiler or Android build tools. A **debug** APK is now produced by CI; a signed release still requires your own keystore and is intentionally not built by the workflow. `BUILD.md` gives the exact commands to produce a signed release on a machine with Android Studio / JDK 17 / SDK 35. |

The executed fallback is therefore **both** deliverables required by the fallback clause: a fully working offline-first web app **and** a complete native Android WebView-wrapper project. No PWA-only result, no guessed prices, no partial total presented as final. The branch was committed and pushed only after the user explicitly asked for a GitHub push; no PR or merge was opened. The workflow row above records the verified CI build.
