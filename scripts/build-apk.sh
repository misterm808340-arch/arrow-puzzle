#!/bin/bash
# Build production APK + AAB (Google AdMob since v1.9.1)
set -e

# Use bundled JDK + Android SDK (no system tools available)
export JAVA_HOME=/home/z/my-project/jdk/jdk-21.0.5+11
export ANDROID_HOME=/home/z/my-project/android-sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/build-tools/36.0.0:$ANDROID_HOME/platform-tools:$PATH

cd /home/z/my-project

echo "=== [0/5] Toolchain verification ==="
java -version 2>&1
javac -version 2>&1
echo "ANDROID_HOME=$ANDROID_HOME"

echo ""
echo "=== [1/5] ESLint check ==="
npx eslint src/ 2>&1 | tail -10 || echo "ESLint warnings/errors above (non-blocking)"

echo ""
echo "=== [2/5] Next.js static export ==="
npx next build 2>&1 | tail -25

echo ""
echo "=== [3/5] Capacitor sync (web -> android) ==="
npx cap sync android 2>&1 | tail -15

echo ""
echo "=== [4/5] Gradle assembleRelease + bundleRelease ==="
cd android
./gradlew assembleRelease bundleRelease --rerun-tasks 2>&1 | tail -25

echo ""
echo "=== [5/5] Copy APK + AAB to download/ ==="
cd /home/z/my-project
cp android/app/build/outputs/apk/release/app-release.apk \
   download/arrow-puzzle-v1.9.1.apk
cp android/app/build/outputs/bundle/release/app-release.aab \
   download/arrow-puzzle-v1.9.1.aab
ls -lh download/arrow-puzzle-v1.9.1.apk download/arrow-puzzle-v1.9.1.aab

echo ""
echo "=== Verifying APK ==="
aapt dump badging download/arrow-puzzle-v1.9.1.apk | grep -E "package:|versionCode|versionName|application-label:" | head -5

echo ""
echo "=== Signing verification ==="
apksigner verify --verbose download/arrow-puzzle-v1.9.1.apk 2>&1 | head -8

echo ""
echo "=== Sanity: AdMob + UMP classes present in APK? ==="
unzip -l download/arrow-puzzle-v1.9.1.apk | grep -E "com/google/android/gms/ads|com/google/android/ump" | head -5 || echo "(none found — check Gradle resolution)"

echo ""
echo "=== DONE ==="
echo "APK:  /home/z/my-project/download/arrow-puzzle-v1.9.1.apk"
echo "AAB:  /home/z/my-project/download/arrow-puzzle-v1.9.1.aab"

