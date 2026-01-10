# Native Ad System - Testing Guide

## ✅ What Has Been Implemented

### 1. Database Setup
- **✓ `ads` table created** with fields:
  - `id` (UUID)
  - `title` (text)
  - `description` (text, nullable)
  - `image_url` (text)
  - `link_url` (text)
  - `is_active` (boolean, default: true)
  - `priority` (integer, default: 1)
  - `created_at`, `updated_at` (timestamps)

- **✓ `user_settings` table updated** with:
  - `is_subscribed` (boolean, default: false)
  - `subscription_expires_at` (timestamp, nullable)

- **✓ Row Level Security (RLS) enabled**:
  - Authenticated users can view active ads
  - Anonymous users can view active ads
  - Only service role can insert/update/delete ads

### 2. Sample Data
- **✓ 1 test ad created**: FanDuel sports betting promotion
  - Title: "Use FanDuel promo code, get $150 bonus bets..."
  - Image: Stock photo from Pexels
  - Link: https://example.com/fanduel-promo
  - Status: Active
  - Priority: 5

### 3. Frontend Components
- **✓ AdCard component** (`src/components/AdCard.tsx`):
  - Matches ArticleCard styling exactly
  - Shows "Sponsored" badge
  - Clickable image and content
  - "Learn More" button with external link icon
  - Opens links in new tab

### 4. Feed Integration
- **✓ NewsFeed component updated** (`src/components/NewsFeed.tsx`):
  - Fetches active ads from database
  - Checks user subscription status
  - Inserts ads every 3-5 posts for free users
  - Hides ads completely for Nuuz+ subscribers
  - Cycles through available ads

### 5. API Functions
- **✓ newsApi functions added** (`src/lib/newsApi.ts`):
  - `getActiveAds()` - Fetches all active ads
  - `checkUserSubscription(userId)` - Verifies subscription status

---

## 🧪 How to Test

### Test 1: Verify Ad Appears in Feed (Free User)
**Expected behavior**: Ads should appear every 3-5 posts

1. Open your app in browser
2. Go to the Discover feed
3. Scroll through articles
4. **You should see**: FanDuel ad card with:
   - Blue "Sponsored" badge at top
   - Sports betting image
   - Title and description
   - Blue "Learn More" button

### Test 2: Click on Ad
**Expected behavior**: Opens link in new tab

1. Click anywhere on the ad card OR click "Learn More" button
2. **You should see**: New browser tab opens with the ad's destination URL

### Test 3: Verify Ads Hidden for Subscribers
**Expected behavior**: No ads for Nuuz+ users

1. Set a user as subscribed in database:
```sql
UPDATE user_settings
SET is_subscribed = true,
    subscription_expires_at = '2026-12-31'
WHERE email = 'your-email@example.com';
```

2. Sign in with that account
3. Scroll through feed
4. **You should see**: No sponsored content, only regular articles

### Test 4: Add More Ads
**Expected behavior**: Multiple ads rotate through feed

1. Add another ad via Supabase dashboard or SQL:
```sql
INSERT INTO ads (title, description, image_url, link_url, is_active, priority)
VALUES (
  'Your Ad Title Here',
  'Your ad description goes here',
  'https://images.pexels.com/photos/1234567/pexels-photo.jpeg',
  'https://your-landing-page.com',
  true,
  3
);
```

2. Refresh the app
3. Scroll through feed
4. **You should see**: Both ads appearing at different positions

### Test 5: Disable an Ad
**Expected behavior**: Inactive ads don't appear

1. Disable an ad:
```sql
UPDATE ads SET is_active = false WHERE title LIKE '%FanDuel%';
```

2. Refresh the app
3. Scroll through feed
4. **You should see**: That ad no longer appears

---

## 🔍 How to Verify Database Changes

### Check the ads table:
```sql
SELECT * FROM ads;
```

### Check subscription fields in user_settings:
```sql
SELECT user_id, email, is_subscribed, subscription_expires_at
FROM user_settings;
```

### Check RLS policies on ads table:
```sql
SELECT * FROM pg_policies WHERE tablename = 'ads';
```

---

## 📊 Current Status

| Component | Status | Details |
|-----------|--------|---------|
| Database Schema | ✅ Complete | ads table + subscription fields created |
| Sample Ad Data | ✅ Complete | 1 test ad inserted |
| AdCard Component | ✅ Complete | Matches ArticleCard styling |
| Feed Integration | ✅ Complete | Inserts ads every 3-5 posts |
| Subscription Logic | ✅ Complete | Hides ads for subscribers |
| RLS Policies | ✅ Complete | Secure read access only |
| Build | ✅ Complete | No errors, builds successfully |

---

## 🎯 Quick Visual Test

**What you should see in your feed**:

```
📰 Article 1
📰 Article 2
📰 Article 3
💰 [Sponsored] FanDuel Ad ← Should look like regular post but with "Sponsored" badge
📰 Article 4
📰 Article 5
📰 Article 6
📰 Article 7
💰 [Sponsored] FanDuel Ad ← Same ad repeats if only one ad exists
```

---

## 🐛 Troubleshooting

### If ads don't appear:
1. Check browser console for errors (F12)
2. Verify ad exists and is active: `SELECT * FROM ads WHERE is_active = true;`
3. Clear browser cache and hard refresh (Ctrl+Shift+R)
4. Check if you're logged in as a subscriber

### If ads appear for subscribers:
1. Verify subscription status: `SELECT is_subscribed FROM user_settings WHERE user_id = 'your-user-id';`
2. Check subscription hasn't expired
3. Clear localStorage and sign in again

### If clicking ad doesn't work:
1. Check browser console for errors
2. Verify link_url is valid in database
3. Check if popup blocker is preventing new tab

---

## 📝 Managing Ads

### Add a new ad:
```sql
INSERT INTO ads (title, description, image_url, link_url, is_active, priority)
VALUES (
  'New Product Launch',
  'Check out our amazing new product!',
  'https://images.pexels.com/photos/123456/image.jpg',
  'https://yourproduct.com',
  true,
  5
);
```

### Update ad priority (higher = more frequent):
```sql
UPDATE ads SET priority = 10 WHERE title LIKE '%Important Ad%';
```

### Pause an ad campaign:
```sql
UPDATE ads SET is_active = false WHERE id = 'ad-uuid-here';
```

### Delete an ad:
```sql
DELETE FROM ads WHERE id = 'ad-uuid-here';
```

---

## 💡 Tips

- **Priority**: Higher priority ads appear more frequently
- **Free stock photos**: Use Pexels (https://pexels.com) for ad images
- **Ad frequency**: Currently set to 1 ad every 3-5 posts (randomized)
- **Subscription price**: Nuuz+ mentioned as $199 (update this in your UI as needed)
