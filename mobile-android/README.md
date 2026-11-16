# Biashara Yangu — Android app (Folder 1)

Capacitor wrapper that packages the web app (`../src`) as a native Android app.
Nothing is duplicated: the web app is built from the repo root in `native` mode into `www/`.

App id: `tz.co.biasharayangu.app` · Min SDK 22 · Payments: mobile money (Snippe) enabled.

## Requirements
Node 20+, JDK 17, Android Studio (SDK Platform 34 + build-tools).

## Build & run
```bash
cd mobile-android
npm install
npm run sync          # builds web (native mode) + copies into android/
npm run open          # open in Android Studio, press Run
# or from the CLI with a device/emulator attached:
npm run run:device
npm run apk:debug     # android/app/build/outputs/apk/debug/app-debug.apk
```

## Release (Google Play)
1. Create a keystore (`keytool -genkey -v -keystore release.jks -alias biashara -keyalg RSA -keysize 2048 -validity 10000`) and keep it **out of git** (already ignored).
2. Configure signing in Android Studio (Build → Generate Signed Bundle) or `signingConfigs` in `android/app/build.gradle`.
3. `npm run aab:release` → upload `android/app/build/outputs/bundle/release/app-release.aab`.
4. Google Play currently requires **target SDK 35**. Capacitor 6 ships with 34: in Android Studio update `compileSdkVersion`/`targetSdkVersion` in `android/variables.gradle` (and the Android Gradle Plugin if prompted) before uploading.

## What's native
Status bar, splash screen, keyboard resize, hardware back button, safe-area padding, and
PDF/Excel/Word/HTML exports through the system share sheet (WebViews can't download blobs).
`allowBackup` is disabled so auth tokens are not copied into device backups.

## Regenerate icons
Replace `resources/icon-only.png` (1024×1024) then `npm run assets`.
