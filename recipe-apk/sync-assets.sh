#!/usr/bin/env bash
# Copy the no-build web app into the Android WebView-wrapper assets.
# Run this after any edit to recipe-apk/app before building the APK.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$ROOT/app"
DST="$ROOT/android/app/src/main/assets/www"

rm -rf "$DST"
mkdir -p "$DST/js" "$DST/img"
cp "$SRC/index.html" "$SRC/styles.css" "$SRC/manifest.json" "$SRC/icon.svg" "$SRC/sw.js" "$DST/"
cp "$SRC"/js/*.js "$DST/js/"
cp "$SRC"/img/*.jpg "$DST/img/" 2>/dev/null || true
echo "Synced web app into $DST"
find "$DST" -type f -printf '%P\n' | sort
