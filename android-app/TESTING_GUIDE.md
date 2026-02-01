# Nuuz Android App - Testing Guide

Complete testing guide for the Nuuz Android application.

## Prerequisites

- Android Studio installed
- Android device or emulator (API 24+)
- Internet connection
- LogCat access for debugging

## 1. Testing Test Ads (Development Phase)

### Setup

1. **Build Debug APK**
   ```bash
   ./gradlew assembleDebug
   ```

2. **Install on device**
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

### Test Cases

#### TC-001: Banner Ad Display (Top)
- **Steps:**
  1. Launch app
  2. Wait for web app to load
  3. Observe top banner area

- **Expected:** Top banner ad loads and displays
- **LogCat Filter:** `AdManager`
- **Success Message:** "Top banner ad loaded"

#### TC-002: Banner Ad Display (Bottom)
- **Steps:**
  1. Launch app
  2. Scroll to bottom of feed
  3. Observe bottom banner area

- **Expected:** Bottom banner ad visible
- **LogCat Filter:** `AdManager`
- **Success Message:** "Bottom banner ad loaded"

#### TC-003: Native In-Feed Ad (Scroll-based)
- **Steps:**
  1. Launch app
  2. Scroll through articles slowly
  3. Count articles (aim for 6-8 articles scrolled)
  4. Observe for overlay ad

- **Expected:**
  - Native ad overlay appears after 6-8 articles
  - "Sponsored" label visible
  - Close button functional
  - Auto-dismisses after 10 seconds

- **LogCat Filter:** `AdManager`
- **Success Message:** "Native ad loaded successfully"

#### TC-004: Interstitial Ad (Session-based)
- **Steps:**
  1. Launch app (1st session)
  2. Close app completely
  3. Launch app (2nd session)
  4. Close app completely
  5. Launch app (3rd session)

- **Expected:** Full-screen interstitial ad displays on 3rd session
- **LogCat Filter:** `AdMob`
- **Success Message:** "Interstitial ad shown"

#### TC-005: Ad Click Functionality
- **Steps:**
  1. Wait for any ad to load
  2. Click on the ad

- **Expected:**
  - Ad opens in browser or in-app browser
  - App remains stable after returning
  - No crashes

- **LogCat Filter:** `AdManager`
- **Success Message:** Ad click registered

## 2. Testing Premium User Experience

### Setup Premium Status

**Method 1: Via Chrome DevTools**
1. Connect device to computer
2. Open Chrome: `chrome://inspect`
3. Select Nuuz WebView
4. In console, run:
   ```javascript
   localStorage.setItem('isPremium', 'true');
   location.reload();
   ```

**Method 2: Via Web App (if logged in)**
1. Subscribe to Nuuz+ on web app
2. Launch Android app
3. Should auto-detect premium status

### Test Cases

#### TC-006: Premium User - No Ads
- **Steps:**
  1. Set premium status (see above)
  2. Launch app
  3. Scroll through entire feed
  4. Count app sessions (1-5 times)

- **Expected:**
  - No banner ads visible
  - No native ad overlays appear
  - No interstitial ads shown
  - Smooth ad-free experience

- **LogCat Filter:** `WebAppInterface`
- **Success Message:** "Premium status: true"

#### TC-007: Premium Status Detection
- **Steps:**
  1. Set premium status
  2. Watch LogCat during app launch

- **Expected:** "Premium status: true" message in logs
- **LogCat Command:**
  ```bash
  adb logcat -s WebAppInterface:D
  ```

#### TC-008: Premium → Free Transition
- **Steps:**
  1. Set premium status to true
  2. Launch app (verify no ads)
  3. Set premium status to false:
     ```javascript
     localStorage.setItem('isPremium', 'false');
     location.reload();
     ```
  4. Observe ad behavior

- **Expected:** Ads should reappear immediately

## 3. Testing JavaScript Bridge

### Test Cases

#### TC-009: Scroll Detection
- **Steps:**
  1. Open LogCat
  2. Filter for `WebAppInterface`
  3. Launch app and scroll
  4. Observe logs

- **Expected:** Scroll events logged with percentage and article count
- **LogCat Command:**
  ```bash
  adb logcat -s WebAppInterface:D
  ```

#### TC-010: Premium Status Communication
- **Steps:**
  1. Set premium status
  2. Launch app
  3. Check logs for `setPremiumStatus` call

- **Expected:** "Premium status: [true/false]" logged

#### TC-011: Article Count Tracking
- **Steps:**
  1. Launch app
  2. Scroll through articles
  3. Monitor LogCat for article counts

- **Expected:** Article count increases as you scroll
- **Verify:** Native ad triggers at correct count threshold

## 4. WebView Functionality Testing

### Test Cases

#### TC-012: Web App Loads Correctly
- **Steps:**
  1. Launch app
  2. Observe loading screen
  3. Verify content appears

- **Expected:**
  - Progress bar shows loading
  - Web app fully loads
  - No blank/white screen
  - All images load

#### TC-013: Navigation Within App
- **Steps:**
  1. Launch app
  2. Click various articles
  3. Use back button
  4. Navigate between sections

- **Expected:**
  - Navigation smooth
  - Back button works
  - No external browser opens for internal links

#### TC-014: External Link Handling
- **Steps:**
  1. Find an external link (if any)
  2. Click the link

- **Expected:** External links open in default browser

#### TC-015: WebView Console Errors
- **Steps:**
  1. Enable USB debugging
  2. Open `chrome://inspect`
  3. Monitor console for errors

- **Expected:** No JavaScript errors or warnings

## 5. Performance Testing

### Test Cases

#### TC-016: Memory Usage
- **Steps:**
  1. Open Android Studio Profiler
  2. Launch app
  3. Scroll for 5 minutes
  4. Monitor memory usage

- **Expected:**
  - Memory stable (no continuous increase)
  - No memory leaks
  - Heap size reasonable (<200MB)

#### TC-017: Scroll Performance
- **Steps:**
  1. Launch app
  2. Scroll rapidly up and down
  3. Observe smoothness

- **Expected:**
  - Smooth 60fps scrolling
  - No janky frames
  - Ads don't block UI

#### TC-018: Ad Loading Impact
- **Steps:**
  1. Disable internet
  2. Launch app
  3. Re-enable internet
  4. Wait for ads to load

- **Expected:**
  - App remains responsive during ad load
  - Failed ad loads don't crash app
  - Graceful fallback

## 6. Error Handling Testing

### Test Cases

#### TC-019: No Internet Connection
- **Steps:**
  1. Disable Wi-Fi and cellular data
  2. Launch app

- **Expected:**
  - Error message or blank state
  - No crash
  - App recovers when internet restored

#### TC-020: Ad Load Failure
- **Steps:**
  1. Use invalid ad unit ID
  2. Launch app
  3. Check LogCat for errors

- **Expected:**
  - Error logged but app doesn't crash
  - UI remains functional
  - Ad spaces hidden gracefully

#### TC-021: WebView Load Failure
- **Steps:**
  1. Modify URL to invalid domain
  2. Launch app

- **Expected:**
  - Error displayed
  - No infinite loading
  - User can retry or exit

## 7. Device Compatibility Testing

Test on multiple devices/configurations:

### Device Matrix

| Device Type | API Level | Screen Size | Test Priority |
|-------------|-----------|-------------|---------------|
| Phone       | API 24    | Small       | High          |
| Phone       | API 29    | Medium      | High          |
| Phone       | API 34    | Large       | High          |
| Tablet      | API 29    | Large       | Medium        |
| Emulator    | API 34    | Any         | High          |

### TC-022: Screen Orientation
- **Steps:**
  1. Launch app in portrait
  2. Rotate to landscape
  3. Rotate back to portrait

- **Expected:**
  - WebView maintains state
  - Ads reload appropriately
  - No crashes or blank screens

### TC-023: Different Screen Sizes
- **Steps:**
  1. Test on small phone (5" screen)
  2. Test on large phone (6.5" screen)
  3. Test on tablet (10" screen)

- **Expected:**
  - Ads scale appropriately
  - WebView content responsive
  - No layout issues

## 8. Production Ads Testing (Pre-Release)

**⚠️ Only after thorough testing with test ads**

### Setup

1. Replace ad unit IDs with production units
2. Build release APK
3. Use alpha/beta track on Play Store

### Test Cases

#### TC-024: Production Banner Ads
- **Steps:**
  1. Launch production build
  2. Verify real ads load (not test ads)
  3. Monitor fill rate

- **Expected:** Real advertiser ads display

#### TC-025: Ad Revenue Tracking
- **Steps:**
  1. Use app normally for 24 hours
  2. Check AdMob dashboard
  3. Verify impressions recorded

- **Expected:** Metrics appear in AdMob

#### TC-026: Ad Refresh Rate
- **Steps:**
  1. Keep app open for 5 minutes
  2. Observe banner ads
  3. Check if ads refresh

- **Expected:** Ads refresh according to AdMob settings

## 9. Automated Testing Commands

### Quick Test Suite

```bash
# Install debug APK
./gradlew installDebug

# Run instrumented tests
./gradlew connectedAndroidTest

# Check for memory leaks
adb shell am dumpheap com.nuuz.app /data/local/tmp/heap.hprof
adb pull /data/local/tmp/heap.hprof

# Monitor LogCat during testing
adb logcat -s AdManager:D WebAppInterface:D AdMob:D
```

### Performance Profiling

```bash
# CPU profiling
adb shell simpleperf record -p $(adb shell pidof -s com.nuuz.app) -o /data/local/tmp/perf.data
adb pull /data/local/tmp/perf.data

# Memory profiling
adb shell am profile start com.nuuz.app /data/local/tmp/profile.trace
# Use app for a while
adb shell am profile stop com.nuuz.app
adb pull /data/local/tmp/profile.trace
```

## 10. Test Results Documentation

### Test Report Template

```
Test Date: [DATE]
Tester: [NAME]
Build Version: [VERSION]
Device: [DEVICE MODEL]
OS Version: [ANDROID VERSION]

Test Case Results:
- TC-001: ✅ PASS
- TC-002: ✅ PASS
- TC-003: ❌ FAIL - [describe issue]
- ...

Issues Found:
1. [Issue description]
   - Severity: High/Medium/Low
   - Steps to reproduce
   - Screenshots/LogCat

Overall Assessment: PASS / FAIL / PARTIAL
```

## 11. Known Issues & Workarounds

### Issue: Ads not showing immediately
- **Cause:** AdMob initialization delay
- **Workaround:** Wait 2-3 seconds after app launch
- **Fix Status:** Expected behavior

### Issue: Native ad appears too frequently
- **Cause:** Article count detection inaccurate
- **Workaround:** Adjust `articlesBetweenAds` in AdManager
- **Fix Status:** Tunable parameter

## 12. Pre-Release Checklist

Before submitting to Play Store:

- [ ] All test cases pass
- [ ] Test ads work correctly
- [ ] Production ad units configured (but not tested publicly yet)
- [ ] Premium user detection verified
- [ ] Memory leaks checked
- [ ] Performance acceptable (60fps)
- [ ] No crashes in 1-hour stress test
- [ ] Works on API 24-34
- [ ] Works on 3+ different devices
- [ ] WebView loads correctly
- [ ] JavaScript bridge functional
- [ ] Back button works
- [ ] Screen rotation handled
- [ ] Ads labeled as "Sponsored"
- [ ] Privacy policy compliance verified

## Contact

For testing issues or questions, review LogCat output and consult the main README.md troubleshooting section.
