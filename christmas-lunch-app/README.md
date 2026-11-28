# 🎄 Christmas Lunch App

A mobile app for managing the Christmas grazing lunch for 10 people in Port Alfred.

## Features
- **Menu** — All 18 dishes with photos, ingredients and notes
- **Shopping List** — 34+ items with prices, checkable, editable
- **Recipes** — Full method and ingredients for each dish
- **Costs** — Per-head breakdown (~R160/head)
- **Schedule** — Day-by-day cooking timeline
- **Dietary** — Host A notes, allergens, alcohol-free confirmation

## Run as PWA (works immediately on phone)

1. Host the `www/` folder on any web server
2. Open on your phone's browser
3. "Add to Home Screen" — it installs as a full-screen app
4. Works fully offline after first load (service worker caches everything)

## Build APK (GitHub Actions — recommended)

The GitHub Actions workflow (`.github/workflows/build-apk.yml`) automatically builds a debug APK whenever you push changes to `christmas-lunch-app/`. 

1. Push changes to GitHub
2. Go to Actions tab → "Build Christmas Lunch APK"
3. Download the APK artifact
4. Sideload onto your Android phone (enable "Install from unknown sources")

## Build APK locally (requires Java + Android SDK)

```bash
npm install
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
# APK at: android/app/build/outputs/apk/debug/app-debug.apk
```

## Tech Stack
- Vanilla HTML/CSS/JS — no framework, tiny footprint
- Capacitor 6 — wraps web app as native Android APK
- Service Worker — full offline support
- localStorage — shopping list state persists on device

## Data Sources
- Menu: `christmas-lunch-menu/MENU.md`
- Prices: `christmas-lunch-menu/COST-BREAKDOWN.md` (verified 28 Nov 2026)
- Dish images: `christmas-lunch-menu/presentation-images/v2-dish-*.jpg`
