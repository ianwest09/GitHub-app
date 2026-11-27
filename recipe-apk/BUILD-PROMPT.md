# Prompt: build a full-stack recipe/timeline APK for a Redmi Note 10 Pro

Price lookups are now **permitted**, and I did them: see `VERIFIED-PRICES.md` in this folder for real figures with source URLs, shop names, validity dates and caveats. **Nothing is guessed.** The prompt below keeps the no-guessing rule but adds verified imports, auto-expiry and a cheapest-route optimiser.

**Decisions I made for you** (change before pasting if you disagree):
- **Offline-first with an optional sync backend** — a solo cook in Port Alfred cannot depend on a server. The APK must work fully with the backend off.
- **Native Kotlin + Jetpack Compose** — best fit for MIUI-exact alarms, background timers and a real APK. Flutter fallback allowed.
- **ZAR, metric units, dd/mm/yyyy, °C**, and the official spelling **Pick n Pay**.
- **Cheapest route = lowest verified, like-for-like unit price per line**, not "buy everything at one shop". Where data is missing, the app says so instead of estimating.

---

## The prompt

```text
You are building a complete, installable Android app for one specific user. Deliver the full source tree, a signed release APK (arm64-v8a), and BUILD.md with exact build and sideload instructions. Do not publish anything, do not create a Play Store listing, and do not require an account or an API key.

## Device and constraints
- Target device: Xiaomi Redmi Note 10 Pro (MIUI, Android 11-13, Snapdragon 732G, 6 GB RAM, 1080x2400 120 Hz AMOLED).
- minSdk 26, targetSdk 35, 64-bit ARM only (arm64-v8a). Kotlin + Jetpack Compose + Material 3, Room/SQLite, DataStore, WorkManager, Hilt or Koin, coroutines/Flow, Gradle Kotlin DSL. If your toolchain cannot produce native Android, use Flutter + Drift/Isar instead and say so - but the output must still be a real APK, not a web wrapper or PWA.
- "Full stack" here means: UI layer + domain/scheduling engine + local persistence + repository layer + an OPTIONAL thin REST sync service (Node/Express + Postgres or SQLite) with a documented JSON contract. The APK MUST be 100% functional with the backend turned off. Default: offline-first, no account, no login, no ads, no analytics, no telemetry.
- Minimum permissions: POST_NOTIFICATIONS (Android 13+), SCHEDULE_EXACT_ALARM / USE_EXACT_ALARM, VIBRATE, RECEIVE_BOOT_COMPLETED, FOREGROUND_SERVICE. Optional and OFF by default: CAMERA (receipt photos), READ/WRITE_CALENDAR, INTERNET (only when the user enables sync or a price refresh).
- MIUI-specific: timers must survive aggressive battery killing. Use a foreground service for active Cook Mode, exact alarms, an onboarding step that opens "Disable battery optimisation for this app", and reschedule alarms after reboot. Test with the screen off and the app in the background.
- ZAR currency, South African date format dd/mm/yyyy, metric units (g, kg, ml, l), degrees C. Large touch targets, a large-text/high-contrast accessibility mode, dark theme for AMOLED, one-handed bottom navigation, screen-stays-on in Cook Mode. No root, no custom ROM, no Google Play Services dependency.

## PRICE DATA - VERIFIED LOOKUPS ONLY, STILL NO GUESSING
The user has exactly three shops in Port Alfred, Eastern Cape: Pick n Pay, Woolworths and Spar. Use these three names verbatim. No other retailers.

The user has now authorised LOOKING UP prices. That permission is NOT permission to invent them. Every displayed amount must be traceable to one of these:
  (a) a current official store catalogue / product listing, imported with its source URL and validity dates,
  (b) manual user entry,
  (c) a till slip typed or pasted by the user,
  (d) OCR from a receipt PHOTO that the user reviews and confirms line by line - OCR may propose text, never a value the user has not confirmed,
  (e) an official store feed IF one exists AND the user enables it; otherwise show "No live feed - enter prices manually".

ABSOLUTELY FORBIDDEN: invented, estimated, interpolated, "typical", "average", demo, sample, AI-guessed or fallback prices; substituting a different product's price for a like-for-like comparison; silently converting a multi-buy bundle into a plain unit price; auto-adding VAT; currency conversion; treating an expired catalogue price as current. There must be ZERO hardcoded currency literals in the shipped source - all price data lives in the database as records.

Model each price as:
PriceEntry {id, store, branch = "Port Alfred", item, productNameAsListed, packQuantity, packUnit, priceInCents, currency = ZAR, normalisedUnitPriceInCents, capturedAt, validFrom, validTo, source: CATALOGUE | STORE_LISTING | MANUAL | RECEIPT | PHOTO_CONFIRMED | API, sourceUrl, isPromotion, loyaltyRequired, bundleCondition, bundleMinItems, isLikeForLike, note, confirmedByUser}
Keep full history; never overwrite silently. Show "source + captured on + valid until" next to every figure.

Import the verified rows from the accompanying VERIFIED-PRICES.md as the initial dataset. That file contains real prices from the Pick n Pay Eastern Cape catalogue (valid 16-22 Nov 2026), Spar Port Alfred specials (valid 09-22 Nov 2026) and Woolworths online listings (retrieved 19 Nov 2026). Hard-expire every catalogue/listing row when validTo passes, display an "Expired - re-check price" badge, and exclude expired rows from all comparisons and totals. All of those rows expire before Christmas, so the app must prompt for fresh till-slip prices at purchase time.

Empty / incomplete states are features, not errors:
- A line with no price shows "No price yet - add from till slip".
- A basket with missing prices shows exactly which shop/item pairs are missing and an "Incomplete - N prices needed" badge.
- A comparison with fewer than two current, like-for-like, verified prices shows "Insufficient data to compare" and lists what is missing. NEVER estimate the missing shop.
- Only present a final total when every required line has a current verified or user-confirmed price; otherwise show a clearly labelled "partial (x of y items priced)" subtotal and a coverage percentage.
- Where only one shop has a price, show it as "single source" and do NOT claim it is the cheapest.

## FEATURE 1 - Recipe timeline: "run my recipes in order of preparation and cooking time"
This is the core feature. Data model:
Recipe {id, title, servings, tags, dietaryFlags, ingredients[], steps[], notes}
Step {id, order, title, instruction, prepMinutes, cookMinutes, passiveMinutes, dependsOnStepIds[], resource: OVEN | STOVETOP | FRIDGE | FREEZER | COOLER | COUNTER | NONE, temperatureC, canOverlap, handsOn: Boolean, alarmBeforeMinutes}
Ingredient {id, name, quantity, unit, category/aisle, storeHint, pantryStaple, dietaryFlags}
MenuSession {id, name, recipeIds[], guestCount, targetServeTime, bufferMinutes, equipmentLimits}

Engine requirements:
- Given a target serve time (e.g. 13:00 on 25 Dec), run a backward pass to compute the latest start for every step, then a forward pass to produce ONE merged, ordered timeline across ALL selected recipes. Respect step dependencies (topological sort), prep-before-cook, and passive vs hands-on time.
- Detect and warn about resource conflicts (two oven steps at once, one stovetop, one fridge, one cook) and propose a deterministic resolution (shift the later/optional step earlier and show the resulting serve-time impact). Never silently double-book the oven.
- Show hands-on vs unattended blocks, idle gaps, day-before vs day-of separation, and a running "you are free for 18 minutes" indicator.
- Provide BOTH a preparation-order view (grouped by prep, then cook) and the time-ordered view.
- Any step with a missing duration displays "Set time", is excluded from the schedule, and raises a clear warning. Do NOT guess a duration.
- Cook Mode: one step per screen, huge text, tap/swipe to advance, multiple named timers running concurrently with audible + vibration + notification alarms, TextToSpeech read-aloud, a voice "next step" command, screen stays on, works offline and with the screen off.
- Scaling: changing guest count (e.g. 10) rescales ingredient quantities with sane unit conversion. Flag steps where scaling may change cooking time and ASK the user to confirm - never guess.
- Show an assumptions/conflicts panel: "3 steps have no duration", "oven needed 10:15-11:00 by two recipes", etc.

## FEATURE 2 - Shopping lists
- Auto-generate from selected recipes + guest count; merge duplicate ingredients and sum quantities with unit conversion; subtract items marked "already in pantry".
- Group by the three shops (Pick n Pay / Woolworths / Spar) and by aisle; reassign any line to a different shop in one tap; keep a "not tied to a shop" bucket.
- Per line: quantity, tick-off, pantry toggle, price status (unpriced / priced + source + expiry), notes, and a 2-tap "add price" action that remembers the shop and item.
- Exportable as large-print text, PDF, CSV or a share intent; checklist progress persists. Ad-hoc items ("ice packs", "large-print label cards") supported.

## FEATURE 3 - Agenda
- Day/week/month calendar view seeded from the session timeline (e.g. T-7 order the tongue, T-2 check labels and pack kit, day-before make-ahead prep, day-of timed cook schedule from 09:30 to 13:00).
- Reminders via exact alarms + notifications; optional write to the Android system Calendar (permission-gated, off by default); drag or tap to reschedule and recalculate the timeline.
- Each agenda item links back to the step/recipe/shopping list it came from. A "today" home-screen shortcut is a plus.
- STORE HOURS: store opening hours and public-holiday closures per shop, entered by the user or imported from VERIFIED-PRICES.md. Warn when a shopping task falls on a day the shop is closed - Spar Port Alfred is listed as CLOSED CHRISTMAS DAY, so flag any shopping task on 25 December and offer to move it to 24 December or earlier.
- Survive reboot and app kill; no server needed.

## FEATURE 4 - Cost calculator and the CHEAPER ROUTE optimiser
- Show cost per ingredient, per recipe, per guest/serving and per basket, plus budget vs actual - all derived only from current PriceEntry rows. Normalise units (per kg / 100 g / per litre / per item) and show the original listed value alongside any normalised figure.
- CHEAPER ROUTE: for each basket line, compare current, like-for-like, verified prices at Pick n Pay, Woolworths and Spar and select the lowest normalised unit price. Show the running basket total, the saving versus the dearest option, and the resulting shop-by-shop split list.
- The optimiser must respect conditions: a "BUY ANY 4 for R140" bundle is only cheaper if the basket actually contains 4 qualifying items; a "Smart Shopper price" is only used when the user says they have the card; a frozen bone-in product is NOT a like-for-like substitute for a fresh boneless one. Surface every condition as a visible note, never silently.
- Add optional USER-ENTERED travel cost / time per extra shop (never a guessed fuel price) and a "is this saving worth the extra trip?" nudge - e.g. a saving of only a few rand on potatoes is not worth a separate trip.
- Provide three views: (1) Cheapest split basket - each line at its cheapest verified shop, (2) Single-shop basket - everything at one shop, showing which lines have no price there, (3) Compare - a per-line three-column table with "no price" cells where data is missing.
- Display a prominent COVERAGE banner: "4 of 35 lines priced (11%) - 31 prices still needed. No full-basket total available." Never present a partial total as a final cost.
- A one-tap "add price from till slip" flow per unpriced line: pick shop, pick item, type amount, save - under 5 taps, works with no signal.

## FEATURE 5 - Extras that make life easier (build the starred ones first)
- * Dietary guardrails: per-ingredient and per-recipe flags for NO_SUGAR, NO_YEAST, NO_WHEAT, NO_DAIRY, NO_VINEGAR, ALCOHOL_FREE, CHICKEN_ONLY, TONGUE_FOR_THREE, RED_MEAT_OK, SEPARATE_PLATTER, NOT_HOST_A_GUEST_B, RECIPE_PENDING. Warn on conflicts; show "shared / for some" labels; remind about separate boards, knives and tongs for the tongue and smoked gammon platters. Keep smoked gammon off Host A's and Guest B's plates, and hold recipe-pending homemade ice-cream until recipe, labels and dietary clearance are supplied. Flag catalogue items that contain alcohol (brandy pudding, brandy Christmas cake) as EXCLUDED. These are labels, not medical advice.
- * Pantry inventory with quantities and a "use what I have" toggle.
- * Expiry and cooler reminders for hot, humid Port Alfred weather ("cold dishes out of the cooler for more than 60 min").
- * Local backup/export/import of everything as JSON + CSV; printable large-print menu cards and dish label cards.
- * Price freshness dashboard: list every expired or soon-to-expire price with a "re-check" action.
- Recipe import from plain text/Markdown (the user has a MENU.md) plus a manual recipe editor with photo; tags such as Christmas, weekday, batch-cook.
- Leftovers/storage notes, a per-recipe notes field, and a "what can I prep yesterday?" filter.
- Units converter and a "10 people at the table" scaling shortcut.
- No network dependency for ANY core feature; a graceful offline state rather than spinners.

## SEED DATA
Seed recipes, ingredients, step order, dependencies and any durations EXPLICITLY present in christmas-lunch-menu/MENU.md (Christmas Lunch for Ten, Port Alfred, 10 people at the table, alcohol-free, tongue for three, separate smoked gammon platter, recipe-pending homemade ice-cream, 13:00 sitting). Seed PriceEntry rows from VERIFIED-PRICES.md with their source URLs and validFrom/validTo. Do not invent a duration, quantity, product match or price that is not in those documents; mark missing values as "Set time" / "recipe pending" / "unpriced". The ox tongue has NO verified price at any shop - leave it unpriced and flag it as "order from butcher, enter till-slip price". Migrate persisted local state so retired dessert shopping lines and custom prices do not survive a menu update.

## EXPLICITLY DO NOT BUILD
- No invented, estimated, interpolated, demo, sample or AI-guessed prices - ever. Lookups are allowed; guesses are not.
- No treating an expired catalogue price as current, no substituting a non-like-for-like product's price, no hiding bundle or loyalty conditions.
- No "average price" fallbacks, no VAT assumptions, no currency conversion, no other shops, no currency other than ZAR.
- No login, no cloud requirement, no ads, no analytics, no subscription, no Play Store publishing, no push marketing.
- No fabricated nutritional or medical claims.

## DEFINITION OF DONE / ACCEPTANCE TESTS
1. ./gradlew assembleRelease (or documented equivalent) produces an installable arm64-v8a APK; BUILD.md explains sideloading on MIUI (Install unknown apps, MIUI optimisation, adb install -r app-release.apk).
2. A repo-wide search finds ZERO hardcoded currency literals; all figures live in PriceEntry rows imported from VERIFIED-PRICES.md or entered by the user.
3. On 19 Nov 2026 the chicken line shows Pick n Pay fresh skinless breast fillets as the cheapest VERIFIED like-for-like boneless option, with the Spar frozen bone-in option visibly marked "not like-for-like". The saving and unit prices are derived arithmetic, not new prices.
4. On 23 Nov 2026 every imported catalogue row is flagged "Expired - re-check price" and excluded from totals; no expired figure appears in a comparison.
5. A line with a price at only one shop shows "single source / insufficient data to compare" - never "cheapest". A basket with missing prices shows "Incomplete - N prices needed" and a coverage percentage; no partial total is presented as final.
6. The "BUY ANY 4 for R140" potato bundle only applies when 4 qualifying items are in the basket; otherwise the plain Woolworths 2 kg price is used and the condition is shown.
7. A shopping task dated 25 December triggers "Spar Port Alfred is closed on Christmas Day" with an offer to reschedule.
8. Select 3 recipes, set serve time 13:00 -> one merged ordered timeline with prep/cook blocks, dependency arrows, an oven-conflict warning, and "Set time" badges on undated steps.
9. Two named timers run simultaneously, fire with the screen off and the app in the background, and still fire after a reboot.
10. Airplane mode: recipes, shopping lists, agenda, cost calculator and Cook Mode all work. Shopping list merges "lemons" from 3 recipes into one line and keeps tick-off state after app restart. Changing guest count from 10 to 12 rescales quantities and flags steps whose cook time needs confirmation. Export/import round-trip preserves recipes, prices with timestamps, agenda and checklist state.

DELIVER: full source tree, the APK, BUILD.md, a short README describing the data model, scheduling algorithm and cheaper-route logic, and an explicit list of assumptions - especially anything you could not verify about price data for the three shops.
```

---

## Condensed version (for builders with a tight prompt limit)

```text
Build a real, installable offline-first Android APK (Kotlin + Jetpack Compose + Room, minSdk 26, arm64-v8a) for a Xiaomi Redmi Note 10 Pro on MIUI, plus optional thin REST sync that the app does NOT need to function. ZAR, metric, dd/mm/yyyy, large-text mode, exact alarms that survive MIUI battery killing and reboot.

Four features: (1) a scheduling engine that takes a target serve time and produces ONE merged, dependency-aware timeline across all selected recipes, ordered by prep and cook time, with backward/forward passes, oven/stovetop/cook conflict detection, hands-on vs passive blocks, step-by-step Cook Mode with multiple named timers and TTS; (2) auto-generated shopping lists with merged quantities, tick-off, pantry toggle, grouped by shop and aisle, exportable; (3) an agenda calendar with reminders, store hours and public-holiday closures that recalculates the timeline when items move; (4) a cost calculator with a CHEAPER ROUTE optimiser.

PRICES: the only shops are Pick n Pay, Woolworths and Spar in Port Alfred. Looking up prices IS allowed - import the verified, source-linked rows from VERIFIED-PRICES.md with validFrom/validTo and auto-expire them. But NEVER invent, estimate, interpolate, substitute a non-like-for-like product, hide a bundle/loyalty condition, auto-add VAT, or treat an expired catalogue price as current. Zero hardcoded currency literals in the source. All other prices come from user-confirmed till slips or manual entry. Fresh/missing/expired states show "No price yet", "Insufficient data to compare" and a coverage percentage - never a guess. For each line, pick the lowest current like-for-like verified unit price across the three shops, show the split basket and the saving, and nudge when a saving is not worth an extra trip (travel cost is user-entered, never guessed).

Seed recipes from christmas-lunch-menu/MENU.md but never invent a missing duration; the ox tongue has no verified price and stays unpriced. Also add: dietary flags (including excluding alcohol-containing catalogue items), pantry inventory, cooler reminders, local JSON backup, a price-freshness dashboard, a 5-tap "add price from till slip" flow, and printable large-print menu and label cards.

Deliver source, signed APK, BUILD.md with MIUI sideload steps, and list your assumptions.
```

---

## Before you paste it

| If you want... | Change this in the prompt |
| --- | --- |
| A cloud backend as a hard requirement | Move the REST sync service from "optional" to required, and add auth + a hosted DB |
| A different builder's stack (Flutter / React Native / Capacitor) | Replace the stack line — keep the device, price and acceptance-test sections intact |
| Live price refreshes at build time | Keep the official-feed clause, but note the empty state and "no feed available" path must still work |
| Only the Christmas menu, not a general recipe app | Narrow the seed-data section and remove recipe import/tags |
| A single-shop shop (never split the basket) | Make Feature 4 view (2) the default and keep (1) as an optional comparison |
| Your spelling "Pick and Pay" | Replace all occurrences of "Pick n Pay" |

**Important:** the verified prices in `VERIFIED-PRICES.md` expire on **22 November 2026**, more than a month before Christmas. They are real and usable now, but they are not Christmas shopping prices — the app is built to ask for fresh till-slip prices at purchase time rather than quietly reusing stale ones.
