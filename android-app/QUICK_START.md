# Nuuz Android App - Quick Start Guide

Get the Nuuz Android app running in under 10 minutes!

## Prerequisites

- **Android Studio Hedgehog** (2023.1.1) or later
- **JDK 17** or later
- **Android device** or emulator (API 24+)

## Step 1: Open Project (1 min)

1. Launch **Android Studio**
2. Click **File** → **Open**
3. Navigate to the `android-app` folder
4. Click **OK**
5. Wait for Gradle sync to complete

## Step 2: First Build - Test Ads (3 min)

No configuration needed! Test ads are pre-configured.

```bash
# Option A: Command line
cd android-app
./gradlew assembleDebug

# Option B: Android Studio
Build → Build Bundle(s) / APK(s) → Build APK(s)
```

**Output:** `app/build/outputs/apk/debug/app-debug.apk`

## Step 3: Install & Test (2 min)

### Connect Device
- Enable **USB Debugging** on your Android device
- Connect via USB
- Or use Android Studio emulator

### Install
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

Or in Android Studio: **Run** → **Run 'app'**

## Step 4: Test Features (3 min)

Launch the app and verify:

1. ✅ Web app loads correctly
2. ✅ Banner ads at top and bottom
3. ✅ Scroll through 6-8 articles
4. ✅ Native ad overlay appears (with "Sponsored" label)
5. ✅ Close ad or wait 10 seconds for auto-dismiss
6. ✅ Close and reopen app 3 times
7. ✅ Interstitial ad shows on 3rd launch

**All ads should show test ad content!**

## Step 5: Test Premium Mode (1 min)

1. Connect device to computer
2. Open Chrome: `chrome://inspect`
3. Click **inspect** under Nuuz WebView
4. In console, run:
   ```javascript
   localStorage.setItem('isPremium', 'true');
   location.reload();
   ```
5. **Result:** All ads disappear

Set back to free:
```javascript
localStorage.setItem('isPremium', 'false');
location.reload();
```

## Next Steps

### For Testing
Continue with comprehensive testing using `TESTING_GUIDE.md`

### For Production
1. Read `CONFIGURATION.md` for AdMob setup
2. Configure your actual ad units
3. Build release bundle: `./gradlew bundleRelease`
4. Submit to Play Store

## Troubleshooting

### Build fails
```bash
./gradlew clean
./gradlew sync
File → Invalidate Caches / Restart
```

### WebView blank
- Check internet connection
- Verify URL: `https://nuuz-curated-news-ai-lj3c.bolt.host/`
- Check LogCat: `adb logcat -s WebView:D`

### Ads not showing
- Test ads can take 10-30 seconds to load
- Check LogCat: `adb logcat -s AdManager:D AdMob:D`
- Verify internet connection

### Device not detected
```bash
adb devices
# If empty, check USB debugging is enabled
```

## Quick Reference

### Build Commands
```bash
# Debug build (test ads)
./gradlew assembleDebug

# Release build (production ads)
./gradlew assembleRelease

# App Bundle for Play Store
./gradlew bundleRelease

# Clean build
./gradlew clean
```

### ADB Commands
```bash
# Install APK
adb install path/to/app.apk

# Uninstall app
adb uninstall com.nuuz.app

# View logs
adb logcat

# View app logs only
adb logcat -s AdManager:D WebAppInterface:D AdMob:D

# Clear app data
adb shell pm clear com.nuuz.app
```

### Debugging
```bash
# Monitor everything
adb logcat

# Filter for errors
adb logcat *:E

# Filter for specific tags
adb logcat -s AdManager:D

# Save logs to file
adb logcat > logs.txt
```

## File Structure Reference

```
android-app/
├── app/
│   ├── src/main/
│   │   ├── java/com/nuuz/app/
│   │   │   ├── MainActivity.kt        ← Main app logic
│   │   │   ├── AdManager.kt           ← Ad management
│   │   │   └── WebAppInterface.kt     ← JavaScript bridge
│   │   ├── res/layout/
│   │   │   └── activity_main.xml      ← UI layout
│   │   └── AndroidManifest.xml        ← App config
│   └── build.gradle                    ← App dependencies
└── build.gradle                        ← Project config
```

## Ad Configuration Quick Reference

**Test Ads (Pre-configured):**
- Banner: `ca-app-pub-3940256099942544/6300978111`
- Native: `ca-app-pub-3940256099942544/2247696110`
- Interstitial: `ca-app-pub-3940256099942544/1033173712`

**Production Ads (You must configure):**
- App ID: `ca-app-pub-1594396899801208~[YOUR_APP_ID]`
- Banner: `ca-app-pub-1594396899801208/[YOUR_BANNER_UNIT]`
- Native: `ca-app-pub-1594396899801208/[YOUR_NATIVE_UNIT]`
- Interstitial: `ca-app-pub-1594396899801208/[YOUR_INTERSTITIAL_UNIT]`

See `CONFIGURATION.md` for detailed setup.

## Success Indicators

✅ **Working correctly if you see:**
- Web app loads and displays news articles
- Test banner ads at top/bottom with "Test Ad" content
- Native ad overlay after scrolling 6-8 articles
- "Sponsored" label on native ads
- Interstitial ad every 3rd app launch
- No ads when premium status set to true
- No crashes or errors in LogCat

❌ **Needs attention if you see:**
- Blank white screen
- "Failed to load ad" errors continuously
- App crashes on launch
- No ads appear after 1 minute
- JavaScript errors in WebView console

## Getting Help

1. **Check LogCat** for error messages
2. **Review documentation:**
   - `README.md` - Overview and features
   - `CONFIGURATION.md` - Setup guide
   - `TESTING_GUIDE.md` - Testing procedures
   - `IMPLEMENTATION_SUMMARY.md` - Technical details
3. **Common issues:** See README.md troubleshooting section
4. **Android docs:** https://developer.android.com
5. **AdMob docs:** https://developers.google.com/admob

## Ready for Production?

Before going live:
- [ ] All test cases pass (see TESTING_GUIDE.md)
- [ ] AdMob account created and configured
- [ ] Production ad units created
- [ ] Ad units configured in code
- [ ] Keystore generated and backed up
- [ ] Release bundle built successfully
- [ ] Privacy policy published
- [ ] Play Console app created
- [ ] Store listing completed

Then follow `CONFIGURATION.md` for Play Store submission!

---

**Questions?** Review the comprehensive documentation in the `android-app` folder.

**Ready to ship?** Follow `CONFIGURATION.md` → Play Store Setup section.
