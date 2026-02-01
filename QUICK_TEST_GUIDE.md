# 🚀 QUICK TEST GUIDE - See Your Native Ads Now!

## Step 1: Open Your App
Just open your Nuuz app in the browser (the preview window)

## Step 2: Look at Your Feed
Scroll down through your article feed. You should see something like this:

```
📰 Regular Article about Tech
📰 Regular Article about Politics
📰 Regular Article about Sports

💰 [THIS IS YOUR AD! 👇]
┌─────────────────────────────────────┐
│ 🔵 Sponsored                        │
│                                     │
│ [Image: Sports/Betting Photo]      │
│                                     │
│ Use FanDuel promo code, get $150   │
│ bonus bets by betting Patriots...  │
│                                     │
│ FanDuel Sportsbook offers $150...  │
│                                     │
│ [Learn More →]                      │
└─────────────────────────────────────┘

📰 Regular Article continues...
📰 Another Regular Article
```

## What Makes It an Ad?
Look for these 3 things:

1. **Blue "Sponsored" badge** at the top-left
2. **Blue "Learn More" button** at the bottom (instead of "Read" and "Ask AI")
3. **Appears every 3-5 regular articles**

## Step 3: Click the Ad
Click anywhere on the ad card. It should:
- Open a new browser tab
- Take you to: https://example.com/fanduel-promo

---

## 🎯 EXACTLY What You Should See

Your ad will look **almost identical** to regular articles, with only these differences:

| Feature | Regular Article | Sponsored Ad |
|---------|----------------|--------------|
| Badge | Source name (e.g., "TechCrunch") | Blue "Sponsored" badge |
| Image | Article photo | Ad photo |
| Title | Article headline | Ad headline |
| Description | Article summary | Ad description |
| Buttons | "Read" + "Ask AI" | "Learn More" |
| Action Buttons | Like, Dislike, Comment, Save, Share | None (just the main button) |

---

## 🔍 Can't See Any Ads? Try This:

### Check 1: Is there an ad in your database?
Open Supabase dashboard → SQL Editor → Run:
```sql
SELECT title, is_active FROM ads;
```

**Should return**: 1 row with the FanDuel ad

### Check 2: Open browser console (F12)
Look for any errors. Should see:
```
✓ No errors about ads
✓ Console might show: fetching ads, loaded X ads
```

### Check 3: Are you subscribed?
If you're logged in, you might be marked as a subscriber (no ads for subscribers!)

Check with:
```sql
SELECT email, is_subscribed FROM user_settings;
```

If `is_subscribed = true`, that's why you don't see ads!

---

## 🎨 Visual Comparison

**REGULAR ARTICLE:**
```
┌─────────────────────────────────────┐
│ TechCrunch · 2 hours ago · 3 min   │
│                                     │
│ [Article Image]                     │
│                                     │
│ New AI Model Breaks Records         │
│                                     │
│ OpenAI releases groundbreaking...   │
│                                     │
│ 👍 👎 💬 🔖 📤                       │
│ [Read] [Ask AI]                     │
└─────────────────────────────────────┘
```

**SPONSORED AD:**
```
┌─────────────────────────────────────┐
│ 🔵 Sponsored                        │
│                                     │
│ [Ad Image]                          │
│                                     │
│ Amazing Product Launch 2024         │
│                                     │
│ Get 50% off your first purchase...  │
│                                     │
│ [Learn More →]                      │
└─────────────────────────────────────┘
```

See the difference?
- ✅ "Sponsored" instead of source name
- ✅ "Learn More" button instead of multiple buttons
- ✅ No interaction icons (likes, saves, etc.)

---

## 📊 Quick Status Check

Run these commands to see what you have:

### 1. Check ads exist:
```sql
SELECT COUNT(*) as total_ads FROM ads WHERE is_active = true;
```
**Expected**: 1

### 2. Check subscription status:
```sql
SELECT COUNT(*) as free_users FROM user_settings WHERE is_subscribed = false OR is_subscribed IS NULL;
```
**Expected**: Your user count (all should be free users by default)

### 3. Verify table structure:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'ads';
```
**Expected**: id, title, description, image_url, link_url, is_active, priority, created_at, updated_at

---

## 🎯 The Simplest Test

1. Open app
2. Scroll down your feed
3. Count 3-5 articles
4. See a card with blue "Sponsored" badge
5. Click it
6. New tab opens

That's it! If you see those 6 things, **IT'S WORKING!** ✅

---

## 💡 Pro Tips

- **Not seeing ads?** Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- **Want more ads?** Add more in Supabase using the SQL from Test 4 in AD_SYSTEM_TESTING.md
- **Want to hide ads?** Mark yourself as subscribed in user_settings table
- **Want different frequency?** Ads appear every 3-5 posts (randomized)

---

## 🆘 Still Not Working?

1. Open browser DevTools (F12)
2. Go to Console tab
3. Take a screenshot
4. Check the Network tab - look for calls to `/ads` or `getActiveAds`

The console will tell you exactly what's happening!
