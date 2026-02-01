# Google Sign-In Fix Summary

## ✅ What Was Fixed

### 1. **OAuth Callback Handler Added**
   - Added `useEffect` to detect `id_token` in URL hash/query params
   - Automatically processes OAuth callback from Google
   - Cleans URL after processing to prevent re-processing

### 2. **Custom Button for WebView**
   - In WebView: Uses custom button that manually triggers OAuth redirect
   - Uses `prompt=select_account` to force account picker (not manual login form)
   - Uses `response_type=id_token` to get JWT token directly
   - Falls back to manual redirect if SDK prompt doesn't work

### 3. **Browser Compatibility Maintained**
   - In regular browser: Still uses Google SDK's popup mode (works perfectly)
   - No changes to browser experience

## 🔧 How It Works

### WebView Flow (Android App):
1. User clicks "Sign in with Google" button
2. Custom button detects WebView environment
3. Tries SDK `prompt()` method first
4. If that fails, manually redirects to Google OAuth with:
   - `response_type=id_token` (returns JWT token)
   - `prompt=select_account` (forces account picker)
   - `redirect_uri` = current origin + '/'
5. Google redirects back with `id_token` in URL hash
6. OAuth callback handler extracts token and processes sign-in

### Browser Flow (Web App):
1. User clicks "Sign in with Google" button
2. Google SDK popup appears (works perfectly)
3. User selects account
4. SDK returns credential directly
5. Sign-in completes

## ⚠️ CRITICAL: Google Cloud Console Configuration

**You MUST verify these settings in Google Cloud Console:**

1. **OAuth Client ID**: `91768461103-ss664383b8aaoq2l5kjbud3c4m17j7md.apps.googleusercontent.com`

2. **Authorized JavaScript origins** (must include):
   - `https://cool-tartufo-a76644.netlify.app`
   - `http://localhost:5173` (for development)

3. **Authorized redirect URIs** (must include):
   - `https://cool-tartufo-a76644.netlify.app/`
   - `https://cool-tartufo-a76644.netlify.app`
   - `http://localhost:5173/` (for development)

4. **OAuth Consent Screen**:
   - Must be set to **"External"** (not "Internal")
   - This allows users outside your organization to sign in

## 🧪 Testing Checklist

- [ ] Test in regular browser - should show popup (existing behavior)
- [ ] Test in Android WebView - should show account picker (not manual login)
- [ ] Verify redirect URI is registered in Google Cloud Console
- [ ] Verify OAuth consent screen is set to "External"
- [ ] Test with multiple Google accounts - account picker should appear
- [ ] Verify sign-in completes successfully after selecting account

## 📝 Files Modified

- `src/components/AuthModal.tsx`
  - Added OAuth callback handler
  - Added custom button for WebView
  - Maintained browser compatibility

## 🚀 Next Steps

1. **Rebuild web app**: `npm run build`
2. **Deploy to Netlify**: Upload `dist` folder
3. **Rebuild Android APK**: `cd android-app && ./gradlew assembleDebug`
4. **Test on device**: Install APK and test Google Sign-In
5. **Verify Google Cloud Console**: Ensure redirect URIs are configured

## 🔍 Troubleshooting

### If account picker still doesn't appear:
1. Check Google Cloud Console redirect URI configuration
2. Verify OAuth consent screen is "External"
3. Check browser console for errors
4. Verify `prompt=select_account` is in the OAuth URL

### If OAuth callback doesn't work:
1. Check if `id_token` is in URL hash after redirect
2. Verify redirect URI matches exactly in Google Cloud Console
3. Check browser console for errors

### If "redirect_uri_mismatch" error:
1. Go to Google Cloud Console
2. Add exact redirect URI: `https://cool-tartufo-a76644.netlify.app/`
3. Make sure there's no trailing slash mismatch
