# Optional LAN sync — JSON contract

**This service is optional and off by default.** The app is fully functional in airplane mode. No account, API key, Play Store, Google service or cloud dependency is involved. The app only contacts the sync service after the user types a base URL in **More → Optional LAN sync** and taps one of the three buttons.

The reference server is `sync-service/server.mjs` (Node.js 18+, zero dependencies):

```bash
cd recipe-apk/sync-service
PORT=8787 HOST=0.0.0.0 npm start
```

On the phone, enter the computer's LAN address, for example `http://192.168.1.20:8787`. Cleartext HTTP is enabled in the Android wrapper only to make a home-LAN address work; no automatic request is ever made. If you expose the service beyond your LAN, put it behind HTTPS and authentication. Do **not** put credentials in the URL.

## Endpoints

All responses are JSON with `Cache-Control: no-store`. Errors are `{ "error": "..." }`.

### `GET /v1/health`
```json
{ "ok": true, "service": "christmas-lunch-sync", "version": 1, "pricesStored": 0 }
```

### `GET /v1/backup`
Returns the last stored backup, or `404 { "error": "No backup stored yet" }`.

```json
{
  "version": 1,
  "deviceId": "device-...",
  "updatedAt": "2026-11-19T10:00:00.000Z",
  "receivedAt": "2026-11-19T10:00:01.000Z",
  "state": { "version": 1, "lines": [], "customPrices": [], "timers": [] }
}
```

### `PUT /v1/backup`
Request:
```json
{
  "version": 1,
  "deviceId": "device-...",
  "updatedAt": "2026-11-19T10:00:00.000Z",
  "state": { "version": 1, "lines": [], "customPrices": [], "timers": [] }
}
```
Response: `{ "ok": true, "updatedAt": "...", "receivedAt": "..." }`.

The server validates `state.version === 1` and `Array.isArray(state.lines)`. It does **not** edit, infer or complete a backup. The app uses deterministic last-write-wins on `updatedAt`; a newer remote backup replaces local state, otherwise the local state is pushed.

### `GET /v1/prices`
```json
{ "version": 1, "entries": [] }
```

### `POST /v1/prices`
Request:
```json
{
  "deviceId": "device-...",
  "version": 1,
  "entries": [
    {
      "id": "manual-...",
      "store": "pnp",
      "item": "ox tongue",
      "priceInCents": 0,
      "capturedAt": "2026-11-19",
      "source": "MANUAL",
      "confirmedByUser": true
    }
  ]
}
```
Response: `{ "ok": true, "accepted": 1, "duplicatesSkipped": 0, "total": 1 }`.

Every entry must have an integer non-negative `priceInCents`, a `capturedAt`, a `store` of `pnp`, `woolworths` or `spar`, and a `source` of `CATALOGUE`, `STORE_LISTING`, `MANUAL`, `RECEIPT`, `PHOTO_CONFIRMED` or `API`. Entries are appended, never overwritten, and duplicate `id` values are skipped. **Only prices the user typed from a till slip are pushed.** Seeded catalogue rows are never pushed as if they were fresh observations, and the server never fabricates, averages or refreshes a price.

## What is deliberately not synced

- No recipe, price or shopping lookup is performed by the server.
- No external store API is called by the app.
- No telemetry, analytics or crash reporting.
- No account, login, OAuth or API key.
- No automatic background sync; the user taps a button.
- The Android app declares `INTERNET` solely for this optional user-initiated path. Core features work with it unavailable.

## Source of truth

`app/js/repository.js` is the repository layer and contains the client. `app/js/store.js` is the local persistence source of truth. `app/js/data.js` holds the seeded, source-linked `PriceEntry`-style records. The server is a convenience for moving a local backup between devices; it is not required for any feature.
