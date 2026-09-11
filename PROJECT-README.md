# Arrow Puzzle — v1.9.1 (Google AdMob)

## Contents

```
arrow-puzzle/
├── src/                         # Next.js + React game source (TypeScript)
├── android/                     # Native Android project (Capacitor + AdMob plugin)
│   ├── app/
│   │   ├── src/main/java/com/arrowpuzzlegame/arrowpuzzlefree/
│   │   │   ├── MainActivity.java        # Registers AdMobPlugin + ConsentPlugin
│   │   │   ├── AdMobPlugin.java         # Google Mobile Ads SDK 23.x wrapper (Banner/Inter/Rewarded)
│   │   │   └── ConsentPlugin.java       # Google UMP SDK wrapper (IAB TCF v2.2)
│   │   ├── build.gradle                  # versionCode=25, versionName=1.8.0
│   │   ├── proguard-rules.pro            # AdMob + UMP keep rules
│   │   └── src/main/AndroidManifest.xml  # AdMob APPLICATION_ID meta-data
│   ├── build.gradle                      # Maven Central + Google repos
│   └── variables.gradle
├── scripts/                     # Build + bootstrap scripts
│   ├── bootstrap-toolchain.sh   # Re-download JDK 21 + Android SDK if missing
│   ├── build-apk.sh             # Build APK + AAB
│   └── create-source-zip.sh     # This packaging script
├── public/                      # Static web assets
├── prisma/                      # Database schema
├── download/                    # Build artifacts
│   ├── arrow-puzzle-v1.9.1.apk           # Direct install
│   ├── arrow-puzzle-v1.9.1.aab           # Play Store upload
│   ├── arrow-puzzle-keystore.jks          # Signing keystore (KEEP SECRET!)
│   ├── KEYSTORE-DETAILS.txt               # Keystore credentials
│   └── *.png                              # App icons
├── package.json                 # Dependencies
├── capacitor.config.ts          # Capacitor config (appId: com.arrowpuzzlegame.arrowpuzzlefree)
├── next.config.ts               # Next.js static export config
├── worklog.md                   # Full multi-agent work log
└── PROJECT-README.md            # This file
```

## Google AdMob Configuration

- **App ID**: `ca-app-pub-4359575771288892~3747572265` (declared in AndroidManifest.xml as APPLICATION_ID meta-data)
- **Ad units** (declared as constants in `AdMobPlugin.java`):
  - Banner: `ca-app-pub-4359575771288892/3918850621`
  - Interstitial: `ca-app-pub-4359575771288892/5070833545`
  - Rewarded: `ca-app-pub-4359575771288892/3075225597`
- **SDK**: `com.google.android.gms:play-services-ads:23.6.0`
- **UMP SDK**: `com.google.android.ump:user-messaging-platform:3.0.0`

## Ad visibility rules (preserved from v1.5.0)

- **Banner** appears after Level 20 is completed (`BANNER_UNLOCK_LEVEL = 20`)
- **Interstitial** shows every 5 levels starting from level 20 (`INTERSTITIAL_START_LEVEL = 20`, `INTERSTITIAL_INTERVAL = 5`)
- **Rewarded** is shown on demand when the player runs out of lives (the "Watch Ad for +1 Life" button)
- All ads respect the `settings.removeAds` flag — when true, no ad is shown or requested

## Install APK directly

```bash
adb install download/arrow-puzzle-v1.9.1.apk
```

## Rebuild from source

```bash
# 1. Install Node deps
npm install

# 2. Build Next.js static export
npm run build

# 3. Sync to native
npx cap sync android

# 4. Build APK + AAB
cd android && ./gradlew assembleRelease bundleRelease
```

## Play Store upload

Upload `download/arrow-puzzle-v1.9.1.aab` to Play Console. The Data Safety
form must disclose that the app uses advertising — declare the AdMob SDK's
advertising ID, crash analytics, and (if applicable) performance data
collection.


