# Building the Android App with Cursor AI (No Android Studio Needed!)

## Overview

**Good news:** You can build, test, and deploy the Nuuz Android app using **Cursor AI + Command Line** without ever opening Android Studio!

---

## What You Can Do with Cursor AI

### ✅ Fully Supported (No Android Studio Needed)

1. **View and edit all code**
   - Kotlin files (MainActivity.kt, AdManager.kt, etc.)
   - XML layouts (activity_main.xml, etc.)
   - Gradle build files
   - AndroidManifest.xml

2. **Build APKs and App Bundles**
   ```bash
   # Debug APK (test ads)
   cd android-app
   ./gradlew assembleDebug

   # Release APK (production ads)
   ./gradlew assembleRelease

   # Release Bundle for Play Store
   ./gradlew bundleRelease
   ```

3. **Install on physical devices**
   ```bash
   # Install via USB
   adb install app/build/outputs/apk/debug/app-debug.apk

   # Or drag-and-drop APK to device
   ```

4. **View logs and debug**
   ```bash
   # View all logs
   adb logcat

   # Filter by app
   adb logcat -s AdManager:D MainActivity:D
   ```

5. **Configure AdMob settings**
   - Edit ad unit IDs in code files
   - Update build.gradle configurations
   - Modify any app settings

6. **Deploy to Play Store**
   - Build signed app bundle
   - Upload to Play Console (web interface)

### ⚠️ Limited Without Android Studio

1. **Visual layout editor**
   - You'll edit XML files directly (totally doable!)
   - Cursor AI can help you understand and modify layouts

2. **Emulator**
   - Android Studio has built-in emulator
   - **Alternative:** Use a physical Android device (recommended anyway!)
   - **Alternative:** Use command-line emulator (see below)

3. **Visual debugging with breakpoints**
   - You'll use log statements instead
   - `Log.d("TAG", "message")` in Kotlin
   - View with `adb logcat`

---

## Complete Setup Guide for Cursor AI

### Step 1: Install Required Tools (One-Time)

#### On Windows:

```bash
# 1. Install Java JDK 17
# Download from: https://adoptium.net/temurin/releases/?version=17
# Install and add to PATH

# 2. Install Android SDK Command Line Tools
# Download from: https://developer.android.com/studio#command-tools
# Extract to C:\Android\cmdline-tools

# 3. Set environment variables
setx ANDROID_HOME "C:\Android"
setx PATH "%PATH%;C:\Android\cmdline-tools\latest\bin;C:\Android\platform-tools"

# 4. Install SDK components
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

# 5. Install ADB (if not already installed)
# Download from: https://developer.android.com/studio/releases/platform-tools
```

#### On Mac:

```bash
# 1. Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install Java JDK 17
brew install openjdk@17

# 3. Install Android SDK
brew install --cask android-commandlinetools

# 4. Set environment variables (add to ~/.zshrc or ~/.bash_profile)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin

# 5. Install SDK components
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

#### On Linux:

```bash
# 1. Install Java JDK 17
sudo apt update
sudo apt install openjdk-17-jdk

# 2. Download Android SDK Command Line Tools
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip commandlinetools-linux-9477386_latest.zip -d ~/Android/cmdline-tools
mv ~/Android/cmdline-tools/cmdline-tools ~/Android/cmdline-tools/latest

# 3. Set environment variables (add to ~/.bashrc)
export ANDROID_HOME=$HOME/Android
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# 4. Install SDK components
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

### Step 2: Verify Setup

```bash
# Check Java version (should be 17)
java -version

# Check Gradle works
cd android-app
./gradlew --version

# Check ADB works
adb version

# Check Android SDK
sdkmanager --list_installed
```

---

## Building the App with Cursor AI

### Open Project in Cursor

```bash
# 1. Open Cursor AI
# 2. File → Open Folder
# 3. Select the "android-app" folder
# 4. Cursor will show you the project structure
```

### Project Structure in Cursor

```
android-app/
├── app/
│   ├── build.gradle              ← Edit ad units here
│   ├── src/main/
│   │   ├── AndroidManifest.xml   ← App permissions
│   │   ├── java/com/nuuz/app/
│   │   │   ├── MainActivity.kt   ← Main logic
│   │   │   ├── AdManager.kt      ← Ad configuration
│   │   │   └── WebAppInterface.kt
│   │   └── res/
│   │       ├── layout/           ← UI files (XML)
│   │       ├── values/           ← Strings, colors
│   │       └── drawable/         ← Icons, images
├── build.gradle                  ← Project config
└── gradle.properties             ← Gradle settings
```

### Configure AdMob (Using Cursor)

**1. Open `app/build.gradle` in Cursor:**

```gradle
android {
    defaultConfig {
        manifestPlaceholders = [
            admobAppId: "ca-app-pub-1594396899801208~YOUR_APP_ID"
        ]
    }
}
```

**Replace:** `YOUR_APP_ID` with your actual AdMob App ID

**2. Open `app/src/main/java/com/nuuz/app/AdManager.kt` in Cursor:**

```kotlin
// Line 33-34: Update production ad units
private const val PROD_BANNER_AD_UNIT = "ca-app-pub-1594396899801208/YOUR_BANNER_UNIT"
private const val PROD_NATIVE_AD_UNIT = "ca-app-pub-1594396899801208/YOUR_NATIVE_UNIT"
```

**3. Open `app/src/main/java/com/nuuz/app/MainActivity.kt` in Cursor:**

```kotlin
// Line 228: Update interstitial ad unit
val adUnitId = if (BuildConfig.DEBUG) {
    "ca-app-pub-3940256099942544/1033173712" // Test ad
} else {
    "ca-app-pub-1594396899801208/YOUR_INTERSTITIAL_UNIT" // Your ad unit
}
```

**Cursor AI can help you find and update these values automatically!**

### Build APK Using Terminal in Cursor

```bash
# 1. Open Terminal in Cursor (Ctrl+` or Cmd+`)

# 2. Navigate to android-app folder
cd android-app

# 3. Build debug APK (with test ads)
./gradlew assembleDebug

# Output: app/build/outputs/apk/debug/app-debug.apk

# 4. Build release bundle for Play Store
./gradlew bundleRelease

# Output: app/build/outputs/bundle/release/app-release.aab
```

### Common Build Commands

```bash
# Clean build (fixes most issues)
./gradlew clean

# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Build release bundle (for Play Store)
./gradlew bundleRelease

# List all available tasks
./gradlew tasks

# Check dependencies
./gradlew dependencies

# Run tests
./gradlew test
```

---

## Testing Without Emulator

### Option 1: Physical Device (Recommended)

**Advantages:**
- Faster than emulator
- Real-world performance
- Better for testing ads
- No emulator setup needed

**Setup:**

1. **Enable Developer Options on Android device:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Developer Options appears in Settings

2. **Enable USB Debugging:**
   - Settings → Developer Options
   - Turn on "USB Debugging"

3. **Connect device via USB**

4. **Verify connection:**
   ```bash
   adb devices
   # Should show your device
   ```

5. **Install APK:**
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

### Option 2: Command-Line Emulator

**If you really need an emulator without Android Studio:**

```bash
# 1. Create an emulator
avdmanager create avd -n Pixel6 -k "system-images;android-34;google_apis;x86_64"

# 2. Start emulator
emulator -avd Pixel6

# 3. Install APK to emulator
adb install app/build/outputs/apk/debug/app-debug.apk
```

**Note:** Emulators are slower and use more resources than physical devices.

### Option 3: Wireless Debugging (Android 11+)

**No USB cable needed!**

```bash
# 1. Enable Wireless Debugging on device
# Settings → Developer Options → Wireless Debugging

# 2. Pair device (one time)
adb pair <IP>:<PORT>  # Shows on device screen

# 3. Connect
adb connect <IP>:<PORT>

# 4. Install APK over WiFi
adb install app/build/outputs/apk/debug/app-debug.apk
```

---

## Debugging with Cursor AI

### View Logs

```bash
# View all logs
adb logcat

# Clear previous logs
adb logcat -c

# Filter by priority (V=Verbose, D=Debug, I=Info, W=Warn, E=Error)
adb logcat *:E  # Only errors

# Filter by tag
adb logcat -s AdManager:D MainActivity:D

# Save logs to file
adb logcat > logs.txt

# View logs in real-time with grep
adb logcat | grep "AdManager"
```

### Add Log Statements

**Edit in Cursor, then rebuild:**

```kotlin
// MainActivity.kt
import android.util.Log

class MainActivity : AppCompatActivity() {
    private val TAG = "MainActivity"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.d(TAG, "MainActivity started")

        // Your code here
        Log.d(TAG, "WebView initialized")
    }
}
```

**Then rebuild and view logs:**
```bash
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb logcat -s MainActivity:D
```

---

## Editing UI Layouts in Cursor

### Without Visual Editor

**You can edit XML files directly in Cursor!**

Example: Edit `app/src/main/res/layout/activity_main.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical">

    <!-- Top Banner Ad Container -->
    <FrameLayout
        android:id="@+id/adContainerTop"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:background="#F0F0F0" />

    <!-- WebView (Main Content) -->
    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1" />

    <!-- Bottom Banner Ad Container -->
    <FrameLayout
        android:id="@+id/adContainerBottom"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:background="#F0F0F0" />
</LinearLayout>
```

**Cursor AI can help you understand and modify these layouts!**

### Common XML Attributes

```xml
<!-- Layout dimensions -->
android:layout_width="match_parent"   <!-- Fill parent width -->
android:layout_width="wrap_content"   <!-- Size to content -->
android:layout_width="200dp"          <!-- Fixed size -->

<!-- Margins and padding -->
android:layout_margin="16dp"          <!-- All sides -->
android:padding="8dp"                 <!-- Internal spacing -->

<!-- Colors -->
android:background="#FFFFFF"          <!-- White background -->
android:textColor="#000000"           <!-- Black text -->

<!-- Text -->
android:text="@string/app_name"       <!-- From strings.xml -->
android:textSize="18sp"               <!-- Text size -->

<!-- Visibility -->
android:visibility="visible"          <!-- Show -->
android:visibility="gone"             <!-- Hide completely -->
android:visibility="invisible"        <!-- Hide but take space -->
```

---

## Signing App for Release (Command Line)

### Create Keystore

```bash
# Generate new keystore
keytool -genkey -v -keystore nuuz-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias nuuz-key

# You'll be prompted for:
# - Keystore password (remember this!)
# - Key password (remember this!)
# - Your name and organization details
```

### Create keystore.properties

**In Cursor, create `android-app/keystore.properties`:**

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=nuuz-key
storeFile=../nuuz-release-key.jks
```

**⚠️ IMPORTANT:** Add to `.gitignore` to avoid committing passwords!

### Build Signed Release

```bash
cd android-app

# Build signed bundle
./gradlew bundleRelease

# Output: app/build/outputs/bundle/release/app-release.aab
```

---

## Play Store Submission

### From Command Line + Web

1. **Build signed app bundle:**
   ```bash
   cd android-app
   ./gradlew bundleRelease
   ```

2. **Verify bundle:**
   ```bash
   ls -lh app/build/outputs/bundle/release/
   # Should see app-release.aab
   ```

3. **Go to Play Console:**
   - Visit: https://play.google.com/console
   - Create new app
   - Select "App Bundle" upload

4. **Upload AAB file:**
   - Drag `app-release.aab` to Play Console
   - Or use bundletool (command line):
   ```bash
   bundletool upload --bundle=app-release.aab \
     --package-name=com.nuuz.app
   ```

5. **Complete store listing in web interface:**
   - App name, description
   - Screenshots
   - Privacy policy
   - Content rating

---

## Cursor AI Workflow Summary

### Daily Development Workflow

```bash
# 1. Open Cursor AI
# 2. Open android-app folder
# 3. Ask Cursor to help you make changes

# Example: "Update the AdMob banner ad unit ID to ca-app-pub-123..."
# Cursor will find and update the file for you

# 4. Build in terminal
cd android-app
./gradlew assembleDebug

# 5. Install on device
adb install -r app/build/outputs/apk/debug/app-debug.apk

# 6. View logs
adb logcat -s AdManager:D
```

### What to Ask Cursor AI

✅ **"Find all places where I need to update ad unit IDs"**
✅ **"Show me how to change the app icon"**
✅ **"Update the splash screen duration to 3 seconds"**
✅ **"Add a log statement when premium status is detected"**
✅ **"Change the banner ad height"**
✅ **"Explain what this Kotlin code does"**
✅ **"Help me fix this build error"**

---

## Troubleshooting

### Build fails: "SDK location not found"

```bash
# Create local.properties in android-app folder
echo "sdk.dir=/path/to/Android/sdk" > local.properties

# On Mac:
echo "sdk.dir=$HOME/Library/Android/sdk" > local.properties

# On Linux:
echo "sdk.dir=$HOME/Android/sdk" > local.properties

# On Windows:
echo sdk.dir=C:\\Android\\sdk > local.properties
```

### Gradle version mismatch

```bash
# Use the wrapper (always works)
./gradlew assembleDebug

# Don't use global gradle
# gradle assembleDebug  ← DON'T DO THIS
```

### ADB device not found

```bash
# Check device is connected
adb devices

# If empty, try:
adb kill-server
adb start-server
adb devices

# On Linux, may need udev rules
sudo usermod -aG plugdev $USER
```

### Build is slow

```bash
# Enable parallel builds
# Add to gradle.properties:
org.gradle.parallel=true
org.gradle.daemon=true
org.gradle.caching=true
```

---

## Advantages of Cursor AI Approach

✅ **Lightweight:** No 4GB Android Studio download
✅ **Fast:** No IDE startup time
✅ **Flexible:** Works on any machine
✅ **AI-Powered:** Cursor helps you understand and modify code
✅ **Terminal Control:** Full access to build tools
✅ **Version Control:** Easier to see file changes

---

## When You Might Want Android Studio

- **Visual layout design:** Drag-and-drop UI builder
- **Emulator management:** Built-in device emulator
- **Visual debugging:** Breakpoints and step-through
- **Resource management:** Icon and image tools
- **Performance profiling:** CPU/memory analysis

**But for this WebView wrapper app, Cursor AI + Terminal is totally sufficient!**

---

## Complete Example: First Build with Cursor

```bash
# 1. Install prerequisites (one-time)
# See "Step 1" above for your OS

# 2. Open project in Cursor
# File → Open Folder → Select "android-app"

# 3. Open terminal in Cursor (Ctrl+`)
cd android-app

# 4. Verify setup
./gradlew --version

# 5. Build debug APK
./gradlew assembleDebug

# 6. Connect Android device via USB
# Enable USB Debugging on device first

# 7. Verify device connection
adb devices

# 8. Install APK
adb install app/build/outputs/apk/debug/app-debug.apk

# 9. View logs
adb logcat -s AdManager:D MainActivity:D

# 10. Test the app on your device!
```

---

## Resources

### Documentation
- [Gradle Build Tool](https://gradle.org/guides/)
- [ADB Documentation](https://developer.android.com/studio/command-line/adb)
- [Android SDK Command Line](https://developer.android.com/studio/command-line)

### Tools
- [Android Command Line Tools](https://developer.android.com/studio#command-tools)
- [JDK Downloads](https://adoptium.net/temurin/releases/)
- [Bundletool](https://github.com/google/bundletool)

---

## Summary

**Yes, you can build the entire Android app using Cursor AI!**

**What you need:**
1. JDK 17
2. Android SDK command-line tools
3. ADB (for device connection)
4. Cursor AI (for code editing)
5. Terminal (for building)
6. Physical Android device (for testing)

**What you DON'T need:**
- ❌ Android Studio (4GB download)
- ❌ Android emulator (slow and resource-heavy)
- ❌ Visual layout editor (edit XML directly)

**Start here:**
```bash
# Install Java and Android SDK (see Step 1)
# Then:
cd android-app
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

**Cursor AI will be your development partner for:**
- Understanding the code
- Making changes
- Configuring ad units
- Fixing build errors
- Editing layouts
- Debugging issues

---

**Happy building with Cursor AI! 🚀**
