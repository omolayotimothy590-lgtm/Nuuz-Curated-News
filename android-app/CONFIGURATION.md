# Nuuz Android App - Configuration Guide

Complete configuration guide for setting up AdMob and preparing for Play Store deployment.

## 1. AdMob Configuration

### Step 1: Create AdMob Account

1. Go to [AdMob Console](https://admob.google.com/)
2. Sign in with Google account
3. Accept terms and conditions
4. Complete account setup

### Step 2: Register Your App

1. In AdMob Console, click **Apps** → **Add App**
2. Select **Android** platform
3. Choose **No** (app not published on Google Play yet)
4. Enter app name: **Nuuz**
5. Click **Add**

You'll receive an **App ID** like: `ca-app-pub-1594396899801208~XXXXXXXXXX`

### Step 3: Create Ad Units

Create three ad units for the app:

#### Banner Ad Unit
1. Go to **Apps** → Select **Nuuz** → **Ad units** → **Add ad unit**
2. Select **Banner**
3. Ad unit name: `Nuuz Banner`
4. Click **Create ad unit**
5. Copy the **Ad unit ID**: `ca-app-pub-1594396899801208/XXXXXXXXXX`

#### Native Ad Unit
1. Click **Add ad unit** again
2. Select **Native**
3. Ad unit name: `Nuuz Native In-Feed`
4. Click **Create ad unit**
5. Copy the **Ad unit ID**: `ca-app-pub-1594396899801208/YYYYYYYYYY`

#### Interstitial Ad Unit
1. Click **Add ad unit** again
2. Select **Interstitial**
3. Ad unit name: `Nuuz Interstitial`
4. Click **Create ad unit**
5. Copy the **Ad unit ID**: `ca-app-pub-1594396899801208/ZZZZZZZZZZ`

### Step 4: Configure App Code

#### 4.1 Update App ID

Edit `android-app/app/build.gradle`:

```gradle
android {
    defaultConfig {
        // ... other config

        manifestPlaceholders = [
            admobAppId: "ca-app-pub-1594396899801208~XXXXXXXXXX"  // ← Replace with your App ID
        ]
    }
}
```

#### 4.2 Update Banner Ad Unit

Edit `android-app/app/src/main/java/com/nuuz/app/AdManager.kt`:

```kotlin
companion object {
    // ...
    private const val PROD_BANNER_AD_UNIT = "ca-app-pub-1594396899801208/XXXXXXXXXX"  // ← Your banner ad unit
    private const val PROD_NATIVE_AD_UNIT = "ca-app-pub-1594396899801208/YYYYYYYYYY"   // ← Your native ad unit
}
```

#### 4.3 Update Interstitial Ad Unit

Edit `android-app/app/src/main/java/com/nuuz/app/MainActivity.kt`:

```kotlin
private fun loadInterstitialAd() {
    // ...
    val adUnitId = if (BuildConfig.DEBUG) {
        "ca-app-pub-3940256099942544/1033173712" // Test ad unit
    } else {
        "ca-app-pub-1594396899801208/ZZZZZZZZZZ" // ← Your interstitial ad unit
    }
    // ...
}
```

## 2. Code Signing Configuration

### Step 1: Generate Keystore

Using Android Studio:
1. **Build** → **Generate Signed Bundle / APK**
2. Select **Android App Bundle**
3. Click **Create new...** under Key store path
4. Fill in the form:
   - **Key store path:** Choose location (e.g., `~/nuuz-keystore.jks`)
   - **Password:** Choose a strong password
   - **Key alias:** `nuuz-release`
   - **Key password:** Choose a strong password
   - **Validity:** 25 years (minimum)
   - **Certificate:** Fill in your details
5. Click **OK**

Or using command line:
```bash
keytool -genkey -v -keystore nuuz-keystore.jks -alias nuuz-release \
  -keyalg RSA -keysize 2048 -validity 10000
```

**⚠️ CRITICAL: Back up this keystore file securely! Loss = permanent loss of update capability**

### Step 2: Configure Gradle Signing

#### Option A: Using keystore.properties (Recommended)

Create `android-app/keystore.properties`:
```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=nuuz-release
storeFile=/absolute/path/to/nuuz-keystore.jks
```

**⚠️ Add this file to .gitignore to avoid committing secrets**

Update `android-app/app/build.gradle`:
```gradle
// Load keystore properties
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ...

    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### Option B: Using Environment Variables

Set environment variables:
```bash
export NUUZ_KEYSTORE_PASSWORD="your_password"
export NUUZ_KEY_PASSWORD="your_key_password"
export NUUZ_KEY_ALIAS="nuuz-release"
export NUUZ_KEYSTORE_FILE="/path/to/keystore.jks"
```

Update `android-app/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            keyAlias System.getenv("NUUZ_KEY_ALIAS")
            keyPassword System.getenv("NUUZ_KEY_PASSWORD")
            storeFile file(System.getenv("NUUZ_KEYSTORE_FILE"))
            storePassword System.getenv("NUUZ_KEYSTORE_PASSWORD")
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            // ...
        }
    }
}
```

## 3. Build Configuration

### Debug Build (Test Ads)

```bash
cd android-app
./gradlew assembleDebug
```

Output: `app/build/outputs/apk/debug/app-debug.apk`

**Characteristics:**
- Uses test ad units
- Debuggable
- Not optimized
- Cannot be uploaded to Play Store

### Release Build (Production Ads)

```bash
./gradlew assembleRelease
```

Output: `app/build/outputs/apk/release/app-release.apk`

**Characteristics:**
- Uses production ad units
- Code obfuscated with ProGuard
- Optimized and minified
- Signed with release key
- Can be installed directly

### App Bundle (Google Play)

```bash
./gradlew bundleRelease
```

Output: `app/build/outputs/bundle/release/app-release.aab`

**Characteristics:**
- Smaller download size
- Dynamic feature modules support
- Required for Play Store submission
- Cannot be installed directly (Play Store distributes APKs)

## 4. Google Play Console Setup

### Step 1: Create App

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **Create app**
3. Fill in details:
   - **App name:** Nuuz
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free
4. Accept declarations
5. Click **Create app**

### Step 2: Store Listing

Complete the store listing with required information:

#### App Details
- **App name:** Nuuz
- **Short description:** (80 chars max)
  ```
  AI-powered news aggregator with personalized feeds and intelligent summaries
  ```
- **Full description:** (4000 chars max)
  ```
  Nuuz is your AI-powered news companion that delivers curated news from trusted sources.

  Features:
  • Personalized news feed based on your interests
  • AI-powered article summaries
  • Multiple categories: Technology, Business, Sports, Entertainment, and more
  • Local news based on your location
  • Dark mode support
  • Ad-free experience with Nuuz+ subscription

  Stay informed with intelligent news curation powered by AI. Download Nuuz today!
  ```

#### Graphics
- **App icon:** 512x512 PNG (32-bit, no transparency)
- **Feature graphic:** 1024x500 JPG/PNG
- **Phone screenshots:** At least 2, up to 8 (16:9 or 9:16)
- **Tablet screenshots:** (optional) 7" and 10" tablets

#### Categorization
- **App category:** News & Magazines
- **Tags:** news, ai, personalization, aggregator

#### Contact Details
- **Email address:** Your support email
- **Phone number:** (optional)
- **Website:** https://nuuz-curated-news-ai-lj3c.bolt.host/
- **Privacy policy:** (required - must be publicly accessible URL)

### Step 3: Content Rating

1. Go to **Content rating**
2. Click **Start questionnaire**
3. Select category: **News**
4. Answer all questions honestly
5. Submit for rating

### Step 4: Target Audience

1. **Target age groups:** 18+
2. **Store presence:** All available countries (or select specific ones)
3. **Content labels:** Complete as required

### Step 5: App Content

#### Privacy Policy
Required! Host your privacy policy and provide the URL.

Sample privacy policy sections to include:
- Data collection (if any)
- How ads work (AdMob)
- Third-party services (Google AdMob, Analytics)
- User rights
- Contact information

#### Data Safety
Declare what data you collect:
- **Location:** Approximate location (for local news)
- **App interactions:** (for analytics)
- **Advertising data:** Required for AdMob

#### Ads Declaration
- **Contains ads:** Yes
- **Ad format:** Banner, Interstitial, Native

### Step 6: Release

1. Go to **Production** (or start with **Internal testing**/Alpha/Beta)
2. Click **Create new release**
3. Upload `app-release.aab`
4. Add release notes:
   ```
   Initial release of Nuuz Android app

   Features:
   - Personalized news feed
   - AI-powered summaries
   - Multiple news categories
   - Local news support
   - Dark mode
   - Premium ad-free experience
   ```
5. Review and rollout

## 5. Version Management

### Updating Version

Edit `android-app/app/build.gradle`:

```gradle
android {
    defaultConfig {
        versionCode 2           // Increment for each release
        versionName "1.0.1"     // Update user-facing version
    }
}
```

**Version code rules:**
- Must be greater than previous
- Integer only
- Used internally by Play Store

**Version name:**
- Can be any string
- Displayed to users
- Recommended: Semantic versioning (1.0.0, 1.0.1, 1.1.0, etc.)

### Release Process

1. Update version code and version name
2. Update release notes
3. Test thoroughly
4. Build release bundle: `./gradlew bundleRelease`
5. Upload to Play Console
6. Submit for review

## 6. Environment-Specific Configuration

### Development Environment
- Test ad units
- Debug logging enabled
- Source maps preserved
- No code obfuscation

### Staging Environment (Optional)
Create a `staging` build type:

```gradle
buildTypes {
    staging {
        initWith debug
        applicationIdSuffix ".staging"
        versionNameSuffix "-staging"
        // Use test ads but release-like configuration
    }
}
```

### Production Environment
- Production ad units
- Minimal logging
- Code obfuscation
- Optimized and minified

## 7. Testing Configuration

### Test Devices

Register test devices in AdMob to see test ads without breaking policies:

1. Get device advertising ID:
   ```bash
   adb shell content query --uri content://gms/ads/identifier
   ```
2. In AdMob Console: **Settings** → **Test devices** → **Add test device**
3. Enter advertising ID

### Testing Premium Status

For testing ad-free experience, set premium status via JavaScript:

```javascript
// In Chrome DevTools (chrome://inspect → WebView)
localStorage.setItem('isPremium', 'true');
location.reload();
```

## 8. Monitoring & Analytics

### AdMob Metrics

Monitor in AdMob Console:
- Impressions
- Click-through rate (CTR)
- Estimated earnings
- Fill rate
- eCPM

### Play Console Metrics

Track in Play Console:
- Installs
- Uninstalls
- Ratings
- Crashes (via Play Console crash reporting)

### Optional: Firebase Analytics

For advanced analytics, integrate Firebase:

1. Add `google-services.json` to `app/`
2. Add Firebase dependencies
3. Track custom events

## 9. Security Best Practices

### Secrets Management
- Never commit keystores to version control
- Use environment variables or secure storage
- Rotate API keys periodically

### ProGuard Configuration
Already configured in `proguard-rules.pro`:
- Keeps AdMob classes
- Protects JavaScript interfaces
- Maintains crash stack traces

### Network Security
Already configured in `network_security_config.xml`:
- HTTPS-only connections
- Certificate pinning (optional, add if needed)

## 10. Troubleshooting Configuration Issues

### Issue: "Invalid AdMob App ID"
**Solution:** Verify App ID format: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`

### Issue: Ads not showing in production
**Possible causes:**
1. Ad units not configured correctly
2. App not approved by AdMob (takes 24-48 hours)
3. App not published on Play Store yet

### Issue: Build fails with signing error
**Solution:**
1. Verify keystore path is correct
2. Check passwords are correct
3. Ensure keystore file exists

### Issue: Play Console rejects bundle
**Possible causes:**
1. Missing content rating
2. Missing privacy policy
3. Incomplete store listing
4. Version code not incremented

## Support Resources

- **AdMob Help:** https://support.google.com/admob
- **Play Console Help:** https://support.google.com/googleplay/android-developer
- **Android Documentation:** https://developer.android.com

## Configuration Checklist

Before building for production:

- [ ] AdMob App ID configured
- [ ] All three ad units created and configured
- [ ] Keystore generated and backed up
- [ ] Signing configuration added to Gradle
- [ ] Version code and version name set
- [ ] Privacy policy URL ready
- [ ] Store listing completed
- [ ] Content rating obtained
- [ ] Test ads verified in debug build
- [ ] Production ads configured (but not tested publicly)
- [ ] Build release bundle successfully
- [ ] Play Console app created

After Play Store launch:

- [ ] Monitor AdMob metrics
- [ ] Respond to user reviews
- [ ] Track crash reports
- [ ] Plan updates and improvements
