# Nuuz Android App

A native Android WebView wrapper for the Nuuz web application with integrated Google AdMob monetization.

## Features

- ✅ WebView wrapper loading the Nuuz web app
- ✅ Google AdMob integration (Banner, Interstitial, Native In-Feed Ads)
- ✅ JavaScript bridge for web-to-native communication
- ✅ Premium user detection (ad-free experience for Nuuz+ subscribers)
- ✅ Scroll-based native ad placement (every 6-8 articles)
- ✅ "Sponsored" label on all ads
- ✅ Test ad support for development
- ✅ Production-ready architecture

## Architecture

### Components

1. **MainActivity.kt** - Main activity hosting the WebView
2. **WebAppInterface.kt** - JavaScript bridge for web ↔ native communication
3. **AdManager.kt** - Centralized ad management (banner, interstitial, native)
4. **SplashActivity.kt** - Splash screen on app launch

### Ad Strategy

#### Banner Ads
- Displayed at top and bottom of screen
- Always visible (non-premium users)
- Uses AdMob AdView component

#### Interstitial Ads
- Shown every 3rd app session
- Full-screen ad experience
- Non-intrusive timing

#### Native In-Feed Ads
- Displayed as overlays every 6-8 articles
- Scroll position detection via JavaScript
- Auto-dismiss after 10 seconds
- Close button for user control
- "Sponsored" label for transparency

### Premium User Detection

The app detects premium status through multiple methods:
- LocalStorage check: `isPremium === 'true'`
- SessionStorage check: `isPremium === 'true'`
- DOM attribute: `data-premium="true"`
- CSS class: `premium-user`

Premium users see **zero ads**.

## Setup Instructions

### Prerequisites

- Android Studio Hedgehog (2023.1.1) or later
- JDK 17 or later
- Android SDK API 34
- Gradle 8.0+

### Installation

1. **Clone or extract the project**
   ```bash
   cd android-app
   ```

2. **Configure AdMob**

   Edit `app/build.gradle` and replace the placeholder:
   ```gradle
   manifestPlaceholders = [
       admobAppId: "ca-app-pub-1594396899801208~[APP_ID_SUFFIX]"
   ]
   ```

   Replace `[APP_ID_SUFFIX]` with your actual AdMob App ID suffix.

3. **Configure Ad Units**

   Edit `app/src/main/java/com/nuuz/app/AdManager.kt`:
   ```kotlin
   // Production ad units (replace with your actual ad units)
   private const val PROD_BANNER_AD_UNIT = "ca-app-pub-1594396899801208/[YOUR_BANNER_AD_UNIT]"
   private const val PROD_NATIVE_AD_UNIT = "ca-app-pub-1594396899801208/[YOUR_NATIVE_AD_UNIT]"
   ```

   Edit `app/src/main/java/com/nuuz/app/MainActivity.kt`:
   ```kotlin
   val adUnitId = if (BuildConfig.DEBUG) {
       "ca-app-pub-3940256099942544/1033173712" // Test ad unit
   } else {
       "ca-app-pub-1594396899801208/[YOUR_INTERSTITIAL_AD_UNIT]"
   }
   ```

4. **Sync Gradle**
   ```bash
   ./gradlew sync
   ```

5. **Build the app**

   **Debug build (with test ads):**
   ```bash
   ./gradlew assembleDebug
   ```
   Output: `app/build/outputs/apk/debug/app-debug.apk`

   **Release build (with production ads):**
   ```bash
   ./gradlew assembleRelease
   ```
   Output: `app/build/outputs/apk/release/app-release.apk`

   **Android App Bundle (for Play Store):**
   ```bash
   ./gradlew bundleRelease
   ```
   Output: `app/build/outputs/bundle/release/app-release.aab`

### Code Signing (Required for Release)

Create `keystore.properties` in the project root:
```properties
storePassword=your_keystore_password
keyPassword=your_key_password
keyAlias=your_key_alias
storeFile=path/to/your/keystore.jks
```

Or sign manually using Android Studio: `Build → Generate Signed Bundle/APK`

## Testing

### Test Ads (Development)

The app uses Google's test ad units when running in debug mode:
- Banner: `ca-app-pub-3940256099942544/6300978111`
- Native: `ca-app-pub-3940256099942544/2247696110`
- Interstitial: `ca-app-pub-3940256099942544/1033173712`

### Testing Premium Status

To test the premium user experience:

1. Open Chrome DevTools on the web app
2. Set premium status:
   ```javascript
   localStorage.setItem('isPremium', 'true');
   ```
3. Reload the app - ads should not appear

### Testing Ad Placement

1. Launch the app in debug mode
2. Scroll through articles - native ad overlays should appear every 6-8 articles
3. Close the app and reopen 3 times - interstitial ad should show
4. Banner ads should be visible at top and bottom

## Switching to Production Ads

1. Update all ad unit IDs in the code (see Configuration section)
2. Build a release APK/AAB
3. Upload to Google Play Console (alpha/beta track recommended first)
4. Test thoroughly before production release

**⚠️ Important:** Test ads will not generate revenue. Switch to production ads only after thorough testing.

## Play Store Submission

### App Bundle Preparation

1. **Build the app bundle**
   ```bash
   ./gradlew bundleRelease
   ```

2. **Required assets for Play Store**
   - App icon (512x512 PNG)
   - Feature graphic (1024x500 PNG)
   - Screenshots (at least 2, up to 8)
   - Short description (80 chars max)
   - Full description (4000 chars max)
   - Privacy policy URL

3. **App metadata**
   - Category: News & Magazines
   - Content rating: Complete the questionnaire
   - Target age: 18+
   - Pricing: Free (with in-app purchases if applicable)

4. **Upload to Play Console**
   - Create a new release in internal/alpha/beta track
   - Upload `app-release.aab`
   - Complete the store listing
   - Submit for review

### Review Checklist

- [ ] All ad units configured correctly
- [ ] Test ads working in debug mode
- [ ] Production ads configured (but test first in alpha/beta)
- [ ] Premium user detection working
- [ ] WebView loads correctly
- [ ] JavaScript bridge functional
- [ ] App signing configured
- [ ] Privacy policy published
- [ ] Store listing completed
- [ ] Screenshots uploaded
- [ ] App tested on multiple devices

## Architecture Details

### JavaScript Bridge Communication

The app injects JavaScript into the WebView to detect:
- Scroll position and article count
- Premium user status
- Page navigation events

Communication flow:
```
Web App → JavaScript → AndroidBridge → MainActivity → AdManager
```

### Ad Display Logic

```kotlin
// Pseudo-code
if (user.isPremium) {
    hideAllAds()
} else {
    showBannerAds()

    if (scrollPosition matches article threshold) {
        showNativeAd()
    }

    if (sessionCount % 3 == 0) {
        showInterstitialAd()
    }
}
```

### Memory Management

- WebView properly destroyed in `onDestroy()`
- Ads cleaned up to prevent leaks
- Coroutines cancelled appropriately
- Native ad objects released

## Troubleshooting

### Ads not showing

1. Check LogCat for AdMob errors
2. Verify ad unit IDs are correct
3. Ensure test device registered (for test ads)
4. Check internet connection
5. Verify AdMob account is active

### WebView blank/white screen

1. Check URL is correct: `https://nuuz-curated-news-ai-lj3c.bolt.host/`
2. Enable USB debugging and check WebView console
3. Verify internet permission in manifest
4. Check network security config

### JavaScript bridge not working

1. Verify JavaScript is enabled in WebView settings
2. Check `@JavascriptInterface` annotations present
3. Test with `window.AndroidBridge` in console
4. Check ProGuard rules not stripping interface

### Build errors

1. Ensure JDK 17 is installed and configured
2. Run `./gradlew clean` and rebuild
3. Sync Gradle files
4. Invalidate caches: `File → Invalidate Caches / Restart`

## Performance Optimization

- WebView caching enabled
- Lazy ad loading
- Scroll event debouncing (100ms)
- Native ad auto-dismiss (10s timeout)
- Memory-efficient bitmap handling

## Security

- HTTPS-only connections
- Network security config restricts cleartext traffic
- ProGuard rules protect sensitive code
- No hardcoded secrets (use environment variables)
- WebView file access disabled

## Analytics & Monitoring

Consider integrating:
- Firebase Analytics for user behavior
- Crashlytics for crash reporting
- AdMob metrics dashboard for revenue tracking

## Future Enhancements

- [ ] Push notifications for breaking news
- [ ] Offline article reading
- [ ] Dark mode synchronization with web app
- [ ] In-app subscription management
- [ ] Share article functionality
- [ ] Download articles as PDF

## Support

For issues or questions:
1. Check LogCat output
2. Review AdMob documentation
3. Test with Google's test ad units first
4. Consult Android WebView documentation

## License

Copyright © 2024 Nuuz. All rights reserved.

## Version History

- **1.0.0** (2024) - Initial release
  - WebView integration
  - AdMob ads (banner, interstitial, native)
  - Premium user detection
  - Production-ready build
