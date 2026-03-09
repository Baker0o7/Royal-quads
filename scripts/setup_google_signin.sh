#!/bin/bash
# ────────────────────────────────────────────────────────────────────────────
# Royal Quad Bikes — Google Sign-In Setup Helper
# Run this from the project root to get your SHA-1 and register it.
# ────────────────────────────────────────────────────────────────────────────

set -e
PACKAGE="com.royalquadbikes.app"
CLIENT_ID="979880974098-uvtfo8sokk6bemv38h9dm89gfl84raj7.apps.googleusercontent.com"
GCP_URL="https://console.cloud.google.com/apis/credentials?project=979880974098"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║     Royal Quad Bikes — Google Sign-In Setup              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Get SHA-1 ────────────────────────────────────────────────────────
echo "▶ Step 1: Getting SHA-1 fingerprints..."
echo ""

echo "  [Debug build SHA-1]"
cd android && ./gradlew signingReport 2>/dev/null | grep -A10 "Variant: debug" | grep -E "SHA1:|SHA-256:" | head -2
cd ..

echo ""
echo "  [Device debug keystore SHA-1 — same as above if using default]"
keytool -list -v \
  -keystore ~/.android/debug.keystore \
  -alias androiddebugkey \
  -storepass android -keypass android 2>/dev/null \
  | grep -E "SHA1:|SHA-256:" | head -2

echo ""
echo "────────────────────────────────────────────────────────────"
echo ""

# ── Step 2: Instructions ─────────────────────────────────────────────────────
echo "▶ Step 2: Register the SHA-1 in Google Cloud Console"
echo ""
echo "  1. Open: $GCP_URL"
echo "  2. Click your Android OAuth 2.0 Client ID"
echo "  3. Under 'Package name': $PACKAGE"
echo "  4. Under 'SHA-1 certificate fingerprint': paste the SHA-1 above"
echo "  5. Click Save"
echo ""
echo "  That's it — no Firebase or google-services.json required."
echo ""

# ── Step 3: Open browser ─────────────────────────────────────────────────────
echo "▶ Opening GCP Console in browser..."
if command -v xdg-open &> /dev/null; then
  xdg-open "$GCP_URL" 2>/dev/null &
elif command -v open &> /dev/null; then
  open "$GCP_URL" 2>/dev/null &
else
  echo "  → Open manually: $GCP_URL"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  After saving in GCP, rebuild the APK — Google Sign-In  ║"
echo "║  will work immediately. No code changes needed.          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
