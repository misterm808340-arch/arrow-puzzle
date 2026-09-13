#!/bin/bash
# ============================================================
# Arrow Puzzle - Play Store Build Script
# ============================================================
# This script builds the Next.js app as a static export
# and prepares it for Android packaging with Capacitor.
# ============================================================

set -e

echo "🏗️  Building Arrow Puzzle for Play Store..."
echo ""

# Step 1: Build Next.js static export
echo "📦 Step 1: Building Next.js static export..."
echo "   Run: bun run build"
echo ""

# Step 2: Add Android platform
echo "📱 Step 2: Adding Android platform..."
echo "   Run: npx cap add android"
echo ""

# Step 3: Sync web assets to Android
echo "🔄 Step 3: Syncing web assets..."
echo "   Run: npx cap sync android"
echo ""

# Step 4: Open Android Studio
echo "🛠️  Step 4: Open in Android Studio..."
echo "   Run: npx cap open android"
echo ""

# Step 5: Build APK/AAB in Android Studio
echo "📦 Step 5: Build in Android Studio..."
echo "   Build > Generate Signed Bundle / APK > Android App Bundle"
echo ""

echo "✅ Setup complete!"
echo ""
echo "⚠️  Before uploading to Play Store, make sure you have:"
echo "   1. Google Play Developer Account (\$25)"
echo "   2. Signed keystore file"
echo "   3. Screenshots (phone + tablet)"
echo "   4. Privacy policy URL"
echo "   5. Real AdMob integration"
echo "   6. Content rating questionnaire"
