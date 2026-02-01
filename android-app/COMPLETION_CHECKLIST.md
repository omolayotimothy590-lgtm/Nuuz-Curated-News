# Complete the Nuuz Android App – Checklist

Use this checklist to fully finish the app and ship it to the Play Store.

---

## 1. AdMob (production ads & revenue)

Right now the app uses **Google test ad units**. To earn money, you need your own AdMob app and ad units.

### 1.1 Create AdMob app & ad units

1. Go to [AdMob](https://admob.google.com/) → **Apps** → **Add app**.
2. Select **Android** → **No** (not on Play yet) → App name: **Nuuz**.
3. Copy your **App ID** (e.g. `ca-app-pub-1594396899801208~XXXXXXXXXX`).
4. Create **3 ad units** for Nuuz:
   - **Banner** → name e.g. `Nuuz Banner` → copy Ad unit ID.
   - **Native** → name e.g. `Nuuz Native In-Feed` → copy Ad unit ID.
   - **Interstitial** → name e.g. `Nuuz Interstitial` → copy Ad unit ID.

### 1.2 Put your IDs in the project

| What | File | What to change |
|------|------|----------------|
| **App ID** | `app/build.gradle` | `manifestPlaceholders` → `admobAppId: "YOUR_FULL_APP_ID"` |
| **Banner** | `app/.../AdManager.kt` | `PROD_BANNER_AD_UNIT = "ca-app-pub-.../YOUR_BANNER_ID"` |
| **Native** | `app/.../AdManager.kt` | `PROD_NATIVE_AD_UNIT = "ca-app-pub-.../YOUR_NATIVE_ID"` |
| **Interstitial** | `app/.../MainActivity.kt` | In `loadInterstitialAd()`, the `else` branch: your interstitial Ad unit ID |

Details: see `CONFIGURATION.md`.

---

## 2. Web app URL (what the app loads)

The app loads: **`https://nuuz-curated-news-ai-lj3c.bolt.host/`**

- If that URL **works** and is your live Nuuz site → no change.
- If you use **Netlify** (or another host) → deploy the web app there, then update the URL in code.

**Update URL:** `app/src/main/java/com/nuuz/app/MainActivity.kt`  
Change `WEB_APP_URL` to your real production URL (including `https://` and trailing `/`).

---

## 3. Release build & signing

You need a **signed** app bundle (AAB) for the Play Store.

### 3.1 Create a keystore (one-time)

**Option A – Android Studio**

1. **Build** → **Generate Signed Bundle / APK** → **Android App Bundle**.
2. **Create new...** keystore.
3. Save path, passwords, alias (e.g. `nuuz-release`). **Back this up safely.**

**Option B – Command line**

```bash
keytool -genkey -v -keystore nuuz-keystore.jks -alias nuuz-release -keyalg RSA -keysize 2048 -validity 10000
```

### 3.2 Configure signing in Gradle

1. Create `android-app/keystore.properties` (add to `.gitignore`):

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=nuuz-release
storeFile=C:/full/path/to/nuuz-keystore.jks
```

2. In `app/build.gradle`, add a `signingConfigs` block and use it in `buildTypes.release` (see `CONFIGURATION.md` for the exact Gradle snippet).

### 3.3 Build release bundle

```bash
cd android-app
./gradlew bundleRelease
```

Output: `app/build/outputs/bundle/release/app-release.aab` → this is what you upload to Play Console.

---

## 4. Google Play Console setup

### 4.1 Create the app

1. [Google Play Console](https://play.google.com/console) → **Create app**.
2. Name: **Nuuz**, default language, **App**, **Free**.

### 4.2 Store listing

- **Short description:** ≤ 80 characters (e.g. “AI-powered news with personalized feeds and summaries”).
- **Full description:** up to 4000 characters (features, Nuuz+, etc.).
- **Category:** News & Magazines.
- **Contact:** support email, optional website.

### 4.3 Graphics

- **App icon:** 512×512 PNG (no transparency).
- **Feature graphic:** 1024×500 PNG/JPG.
- **Screenshots:** at least 2 phone screenshots (e.g. feed, article reader).

### 4.4 Content rating

- **Content rating** → start questionnaire → choose **News** → answer → submit.

### 4.5 Privacy & ads

- **Privacy policy:** required. Host at a public URL and add it in Play Console.
- **Data safety:** declare what you collect (e.g. location for local news, ad-related data).
- **Ads:** declare **Contains ads** (Banner, Interstitial, Native).

### 4.6 Release

1. **Production** (or **Internal testing** first) → **Create new release**.
2. Upload `app-release.aab`.
3. Add release notes (e.g. “Initial release – personalized news, AI summaries, Nuuz+”).
4. Review and **Start rollout**.

---

## 5. Pre-launch checks

Before you submit:

- [ ] **AdMob:** Production App ID + all 3 ad units set in code.
- [ ] **Web app:** Live at the URL used in `MainActivity` and loading correctly in the app.
- [ ] **Signing:** `keystore.properties` correct, `bundleRelease` builds without errors.
- [ ] **Test install:** Install a **release** build (e.g. from AAB via Play Console internal testing) and use the app.
- [ ] **Ads:** In release, verify banners, interstitials, and native ads (or that they’re disabled for premium).
- [ ] **Premium:** Confirm premium users get no ads (e.g. `localStorage.isPremium` / `data-premium`).
- [ ] **Play Console:** Store listing, graphics, content rating, privacy policy, and Data safety completed.

---

## 6. Optional improvements (later)

From the docs, possible next steps:

- Push notifications for breaking news.
- Offline article reading.
- Dark mode sync with web app.
- In-app subscription management (Nuuz+).
- Share article.
- Download articles as PDF.

---

## 7. Quick reference

| Task | Where |
|------|--------|
| AdMob App ID | `app/build.gradle` |
| Banner / Native IDs | `AdManager.kt` |
| Interstitial ID | `MainActivity.kt` |
| Web app URL | `MainActivity.kt` → `WEB_APP_URL` |
| Signing | `keystore.properties` + `app/build.gradle` |
| Release AAB | `./gradlew bundleRelease` |

---

## 8. Docs in this project

- **CONFIGURATION.md** – AdMob, signing, and env setup in detail.
- **README.md** – Overview, build commands, testing.
- **TESTING_GUIDE.md** – How to test ads and premium behavior.

---

**Summary:** Configure production AdMob IDs → set correct web app URL → add release signing → build AAB → complete Play Console listing, rating, and privacy → upload AAB and release.
