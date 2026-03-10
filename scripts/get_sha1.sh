#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
#  Royal Quad Bikes — Print ALL SHA-1 fingerprints for GCP setup
# ─────────────────────────────────────────────────────────────────
set -e

APP_ID="com.royalquadbikes.app"
GCP_URL="https://console.cloud.google.com/apis/credentials"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     ROYAL QUAD BIKES — Google Sign-In SHA-1 Finder          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ── 1. Local debug keystore (what you use when running locally) ──
echo "▶  LOCAL debug keystore  (~/.android/debug.keystore)"
echo "   (This is the SHA-1 you need for local flutter run / USB testing)"
echo ""

LOCAL_KS="$HOME/.android/debug.keystore"

if [ -f "$LOCAL_KS" ]; then
  keytool -list -v \
    -keystore "$LOCAL_KS" \
    -alias androiddebugkey \
    -storepass android \
    -keypass android 2>/dev/null \
    | grep -E "SHA1:|SHA-256:" \
    | awk '{print "   "$0}'
else
  echo "   ⚠️  Not found at $LOCAL_KS"
  echo "   Run: flutter doctor  (it creates the keystore on first use)"
fi

echo ""

# ── 2. Gradle signingReport (also shows debug + release) ─────────
echo "▶  Gradle signingReport (from this project)"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANDROID_DIR="$SCRIPT_DIR/../android"

if [ -f "$ANDROID_DIR/gradlew" ]; then
  cd "$ANDROID_DIR"
  chmod +x gradlew
  ./gradlew signingReport 2>/dev/null \
    | grep -E "Variant:|SHA1:|SHA-256:" \
    | awk '{print "   "$0}'
else
  echo "   ⚠️  gradlew not found at $ANDROID_DIR"
fi

echo ""

# ── 3. CI SHA-1 (from GitHub Actions) ────────────────────────────
echo "▶  GitHub Actions CI SHA-1 (already known)"
echo "   69:D6:F3:16:72:D5:55:FE:0D:22:DF:04:6B:F3:F9:18:64:EA:A1:97"
echo "   (The CI runner's default debug keystore — register this too)"
echo ""

# ── 4. Instructions ───────────────────────────────────────────────
echo "══════════════════════════════════════════════════════════════"
echo "  NEXT STEPS — Register BOTH SHA-1s in Google Cloud Console"
echo "══════════════════════════════════════════════════════════════"
echo ""
echo "  1.  Open: $GCP_URL"
echo "  2.  Find your Android OAuth 2.0 Client for $APP_ID"
echo "      (or create one if missing)"
echo "  3.  Add the LOCAL SHA-1 from above  ← most important"
echo "  4.  Add the CI SHA-1 too            ← for APK downloads"
echo "  5.  Package name: $APP_ID"
echo "  6.  Click Save"
echo "  7.  Rebuild APK and test"
echo ""
echo "  You can have MULTIPLE SHA-1s on one Android client — add all of them."
echo ""

# Try to open browser
if command -v open &>/dev/null; then
  read -p "  Open GCP Console in browser? [y/N] " -n 1 -r; echo
  [[ $REPLY =~ ^[Yy]$ ]] && open "$GCP_URL"
elif command -v xdg-open &>/dev/null; then
  read -p "  Open GCP Console in browser? [y/N] " -n 1 -r; echo
  [[ $REPLY =~ ^[Yy]$ ]] && xdg-open "$GCP_URL"
fi
