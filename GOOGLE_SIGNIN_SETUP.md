# Google Sign-In Setup Guide

Google Sign-In has been successfully integrated into Nuuz! Follow these steps to complete the setup.

## ✅ What's Already Done

1. ✅ Google Sign-In SDK loaded in `index.html`
2. ✅ Google Sign-In button added to `AuthForm.tsx`
3. ✅ `signInWithGoogle()` method in `AuthContext.tsx`
4. ✅ User data stored in localStorage
5. ✅ User data synced to Supabase `user_settings` table
6. ✅ TypeScript definitions for Google API

## 🔧 Setup Required

### 1. Get Google OAuth Client ID

You need to create a Google OAuth Client ID:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth client ID"
5. Select "Web application"
6. Add authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - `https://your-domain.com` (for production)
7. Add authorized redirect URIs (leave empty for now, not needed for Sign-In with Google)
8. Copy your Client ID (looks like: `1234567890-abc123xyz.apps.googleusercontent.com`)

### 2. Add Client ID to Environment

Add your Google Client ID to `.env`:

```env
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
```

**Important:** Replace the placeholder client ID in the code with your actual client ID.

### 3. Update user_settings Table (if needed)

The Google Sign-In stores user data in the `user_settings` table. Make sure your table has these columns:

```sql
-- Check if columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_settings';

-- If needed, add missing columns:
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

## 🎯 How It Works

### Sign-In Flow

```
User clicks "Sign in with Google"
  ↓
Google popup appears
  ↓
User selects account
  ↓
Google returns JWT token
  ↓
App parses JWT (client-side)
  ↓
User data saved to localStorage
  ↓
User data synced to Supabase database
  ↓
User is signed in!
```

### What Gets Stored

**In localStorage:**
```json
{
  "id": "google-user-id-12345",
  "email": "user@gmail.com",
  "fullName": "John Doe",
  "avatar": "https://lh3.googleusercontent.com/..."
}
```

**In Supabase `user_settings` table:**
- `user_id`: Google user ID
- `email`: User's email
- `full_name`: User's name
- `avatar_url`: Profile picture URL
- `updated_at`: Timestamp

## 🔐 Authentication Methods

The app now supports **two authentication methods**:

### 1. Google Sign-In (Recommended)
- No password needed
- User data stored in localStorage + Supabase database
- Works independently of Supabase Auth
- Marked with `nuuz_auth_method: 'google'`

### 2. Email/Password (Supabase Auth)
- Traditional authentication
- Uses Supabase Auth tables
- Marked with `nuuz_auth_method: 'supabase'`

## 📱 User Experience

### Sign-In Page Shows:
```
┌─────────────────────────────────┐
│         Nuuz                    │
│   Your morning news, simplified │
│                                 │
│  ┌───────────────────────────┐ │
│  │ 🔵 Sign in with Google   │ │  ← One-click sign in!
│  └───────────────────────────┘ │
│                                 │
│  ─── Or continue with email ─── │
│                                 │
│  Email: [________________]      │
│  Password: [____________]       │
│  [Sign In]                      │
└─────────────────────────────────┘
```

## 🐛 Troubleshooting

### "Google Sign-In button doesn't appear"
- Check browser console for errors
- Verify Google SDK is loaded: Check for `window.google` in console
- Check CSP headers allow `accounts.google.com`

### "Sign-In fails with error"
- Verify Client ID is correct in `.env`
- Check domain is authorized in Google Cloud Console
- Open browser console to see detailed error logs

### "User data not saving to Supabase"
- Check Supabase connection in browser console
- Verify `user_settings` table exists and has correct columns
- Check RLS policies allow inserting/updating

## 🎉 Testing

1. Start the dev server: `npm run dev`
2. Navigate to sign-in page
3. Click "Sign in with Google"
4. Select your Google account
5. Should redirect and show user avatar in header
6. Check localStorage: `localStorage.getItem('nuuz_user')`
7. Check Supabase dashboard: Look in `user_settings` table

## 📝 Notes

- Google Sign-In works **without** Supabase Auth (OAuth)
- No need to configure Google OAuth in Supabase dashboard
- User data is synced to database but auth is handled client-side
- Works great alongside existing email/password auth
- localStorage serves as backup if Supabase is unavailable

## 🔗 Resources

- [Google Sign-In JavaScript Guide](https://developers.google.com/identity/gsi/web/guides/overview)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Supabase Documentation](https://supabase.com/docs)
