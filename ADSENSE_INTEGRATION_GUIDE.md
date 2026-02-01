# Google AdSense Integration Guide - Nuuz App

## 📋 Table of Contents
1. [Overview](#overview)
2. [Current Status](#current-status)
3. [Test Mode vs Live Mode](#test-mode-vs-live-mode)
4. [Ad Placement Configuration](#ad-placement-configuration)
5. [Premium User Experience](#premium-user-experience)
6. [Analytics & Tracking](#analytics--tracking)
7. [Switching to Live Ads](#switching-to-live-ads)
8. [Testing Checklist](#testing-checklist)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The Nuuz app has been fully integrated with Google AdSense to display native-style in-feed advertisements that blend seamlessly with article content. The system is currently running in **TEST MODE** for safe development and testing.

### Key Features
- ✅ Native in-feed ads styled like regular posts
- ✅ "Sponsored" labels on all ads
- ✅ Configurable ad placement intervals (6-8 items)
- ✅ Premium user ad-free experience
- ✅ Comprehensive error handling
- ✅ Performance analytics tracking
- ✅ Fully responsive design
- ✅ Test mode for development

---

## 📊 Current Status

### Test Mode: ACTIVE ✅

The app is currently configured to display **test ads** only. Test ads are safe for development and won't affect your AdSense account metrics.

**Test Ad Indicator:** When test mode is active, each ad displays an orange "TEST AD" badge in the top-right corner.

### Files Modified

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/adConfig.ts` | Master configuration for all ad settings | ✅ New |
| `src/lib/adAnalytics.ts` | Performance tracking and analytics | ✅ New |
| `src/components/GoogleAdCard.tsx` | Ad display component | ✅ Enhanced |
| `src/components/NewsFeed.tsx` | Main feed ad integration | ✅ Updated |
| `src/components/SearchView.tsx` | Search results ad integration | ✅ Updated |
| `src/components/SavedView.tsx` | Saved articles ad integration | ✅ Updated |
| `index.html` | AdSense script loader | ✅ Existing |

---

## 🔄 Test Mode vs Live Mode

### Test Mode (Current)

**Location:** `src/lib/adConfig.ts` (Line 28)
```typescript
testMode: true,  // Currently in test mode
```

**Characteristics:**
- Shows test advertisements
- Orange "TEST AD" badge visible
- Safe for development
- No impact on AdSense metrics
- Uses `data-ad-test="on"` attribute

### Live Mode (Production)

**Configuration:**
```typescript
testMode: false,  // Switch to live ads
```

**Characteristics:**
- Shows real advertisements
- No test badge visible
- Real AdSense impressions and clicks
- Generates revenue
- Uses `data-ad-test="off"` attribute

---

## ⚙️ Ad Placement Configuration

All ad placement settings are centralized in `src/lib/adConfig.ts`.

### Current Ad Intervals

| View Type | Frequency | Example Positions |
|-----------|-----------|-------------------|
| **Main Feed** | Every 7 articles | After items: 7, 14, 21, 28... |
| **Search Results** | Every 7 results | After items: 7, 14, 21, 28... |
| **Saved Articles** | Every 6 articles | After items: 6, 12, 18, 24... |

### Adjusting Ad Frequency

Edit `src/lib/adConfig.ts` (Lines 62-66):

```typescript
intervals: {
  feed: 7,    // Change this number (e.g., 6, 8, 10)
  search: 7,  // Change this number
  saved: 6,   // Change this number
},
```

**Recommended Range:** 6-10 articles per ad
- Lower = More ads (higher revenue, lower user satisfaction)
- Higher = Fewer ads (better UX, lower revenue)

### Ad Slot Configuration

When switching to live mode, you'll need to configure your actual AdSense ad unit IDs:

Edit `src/lib/adConfig.ts` (Lines 35-57):

```typescript
adSlots: {
  feed: [
    { id: 'YOUR_FEED_SLOT_ID_1', description: 'Feed Ad Slot 1' },
    { id: 'YOUR_FEED_SLOT_ID_2', description: 'Feed Ad Slot 2' },
    { id: 'YOUR_FEED_SLOT_ID_3', description: 'Feed Ad Slot 3' },
    { id: 'YOUR_FEED_SLOT_ID_4', description: 'Feed Ad Slot 4' },
  ],
  search: [
    { id: 'YOUR_SEARCH_SLOT_ID_1', description: 'Search Ad Slot 1' },
    { id: 'YOUR_SEARCH_SLOT_ID_2', description: 'Search Ad Slot 2' },
    { id: 'YOUR_SEARCH_SLOT_ID_3', description: 'Search Ad Slot 3' },
  ],
  saved: [
    { id: 'YOUR_SAVED_SLOT_ID_1', description: 'Saved Ad Slot 1' },
    { id: 'YOUR_SAVED_SLOT_ID_2', description: 'Saved Ad Slot 2' },
    { id: 'YOUR_SAVED_SLOT_ID_3', description: 'Saved Ad Slot 3' },
  ],
},
```

---

## 👑 Premium User Experience

Premium subscribers (Nuuz+) enjoy an **ad-free experience**.

### How It Works

**Logic Location:** `src/lib/adUtils.ts`

```typescript
export function shouldShowAds(user: User | null): boolean {
  // Show ads for logged-out users
  if (!user) return true;

  // Hide ads for premium users
  if (user.isPremium) {
    if (user.subscriptionExpiresAt) {
      return new Date(user.subscriptionExpiresAt) <= new Date();
    }
    return false;
  }

  // Show ads for logged-in non-premium users
  return true;
}
```

### User States

| User State | Ads Shown | Reason |
|------------|-----------|--------|
| Logged out | ✅ Yes | Free tier |
| Logged in (Free) | ✅ Yes | Free tier |
| Logged in (Premium Active) | ❌ No | Premium benefit |
| Logged in (Premium Expired) | ✅ Yes | Subscription lapsed |

---

## 📈 Analytics & Tracking

### Performance Monitoring

**Module:** `src/lib/adAnalytics.ts`

The system automatically tracks:
- **Ad Load Events**: When an ad is requested
- **Render Events**: When an ad successfully displays
- **Viewability Events**: When an ad is 50% visible for 1+ second
- **Error Events**: When an ad fails to load
- **Load Times**: Performance metrics

### View Metrics in Console

Open browser console and type:

```javascript
// View current ad performance
__adAnalytics.logSummary()

// Export metrics as JSON
console.log(__adAnalytics.exportMetrics())

// Get specific metrics
console.log(__adAnalytics.getMetrics())
```

### Sample Output

```
📊 AdSense Performance Summary
Total Ads: 15
Loaded: 15
Rendered: 14
Viewable: 12
Errors: 1
Average Load Time: 342ms
Viewability Rate: 85.7%
```

### Google Analytics Integration

If Google Analytics is installed, ad events are automatically sent:

**Event Format:**
```javascript
{
  event_category: 'AdSense',
  event_label: 'feed_loaded',
  ad_slot: '1234567890',
  position: 0,
  non_interaction: true
}
```

---

## 🚀 Switching to Live Ads

### Prerequisites

Before switching to live ads, ensure you have:

1. ✅ Active Google AdSense account
2. ✅ AdSense account approved
3. ✅ Ad units created in AdSense dashboard
4. ✅ Publisher ID verified
5. ✅ App tested thoroughly with test ads

### Step-by-Step Instructions

#### Step 1: Create Ad Units in AdSense

1. Log in to [Google AdSense](https://www.google.com/adsense)
2. Navigate to **Ads** → **By ad unit** → **In-feed ads**
3. Create at least **10 ad units**:
   - 4 for main feed
   - 3 for search results
   - 3 for saved articles
4. Copy each ad unit ID (format: `1234567890`)

#### Step 2: Update Ad Configuration

Edit `src/lib/adConfig.ts`:

```typescript
export const AD_CONFIG: AdConfig = {
  // Verify your publisher ID
  publisherId: 'ca-pub-9934433795401149', // ← Confirm this is correct

  // SWITCH TO LIVE MODE
  testMode: false, // ← Change from true to false

  // Update with your real ad slot IDs
  adSlots: {
    feed: [
      { id: '1234567890', description: 'Feed Ad Slot 1' }, // ← Replace these
      { id: '2345678901', description: 'Feed Ad Slot 2' },
      { id: '3456789012', description: 'Feed Ad Slot 3' },
      { id: '4567890123', description: 'Feed Ad Slot 4' },
    ],
    search: [
      { id: '5678901234', description: 'Search Ad Slot 1' },
      { id: '6789012345', description: 'Search Ad Slot 2' },
      { id: '7890123456', description: 'Search Ad Slot 3' },
    ],
    saved: [
      { id: '8901234567', description: 'Saved Ad Slot 1' },
      { id: '9012345678', description: 'Saved Ad Slot 2' },
      { id: '0123456789', description: 'Saved Ad Slot 3' },
    ],
  },

  // Rest of configuration remains the same
  intervals: {
    feed: 7,
    search: 7,
    saved: 6,
  },
  responsive: true,
  adFormat: 'fluid',
  layoutKey: '-6t+ed+2i-1n-4w',
};
```

#### Step 3: Verify Publisher ID in HTML

Edit `index.html` (Line 11):

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9934433795401149"
 crossorigin="anonymous"></script>
```

Ensure `ca-pub-9934433795401149` matches your AdSense publisher ID.

#### Step 4: Build and Deploy

```bash
npm run build
```

Deploy to production (Netlify, Vercel, etc.)

#### Step 5: Verify Live Ads

1. Visit your production site
2. Scroll through the feed
3. Confirm ads are displaying (no "TEST AD" badge)
4. Check AdSense dashboard for impressions (may take 24-48 hours)

---

## ✅ Testing Checklist

### Test Mode Verification

- [ ] Test ads display correctly in main feed
- [ ] Test ads display correctly in search results
- [ ] Test ads display correctly in saved articles
- [ ] "TEST AD" badge is visible on all ads
- [ ] Ads appear at correct intervals (every 6-8 items)
- [ ] "Sponsored" label is visible on all ads
- [ ] Ads are responsive on mobile devices
- [ ] Ads are responsive on desktop
- [ ] Premium users don't see any ads
- [ ] Logged-out users see ads
- [ ] Free users see ads

### Feed Interaction Testing

- [ ] Scrolling is smooth with ads
- [ ] Feed loads more items correctly
- [ ] Ad positions remain stable (no layout shift)
- [ ] Clicking articles still works
- [ ] Saving articles still works
- [ ] Sharing articles still works
- [ ] Comments load correctly

### Error Handling

- [ ] App doesn't crash if AdSense script fails to load
- [ ] App doesn't crash if an ad fails to render
- [ ] Console shows appropriate error messages
- [ ] Failed ads are hidden gracefully
- [ ] Test mode shows error placeholder

### Performance

- [ ] Page load time is acceptable
- [ ] Scroll performance is smooth
- [ ] Memory usage is reasonable
- [ ] No console errors
- [ ] Analytics tracking works

### Live Mode Testing (Pre-Production)

- [ ] All ad slot IDs updated correctly
- [ ] Publisher ID verified
- [ ] testMode set to false
- [ ] "TEST AD" badge not visible
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] All tests pass

---

## 🔧 Troubleshooting

### Ads Not Displaying

**Problem:** Ads don't appear in the feed

**Solutions:**
1. Check browser console for errors
2. Verify AdSense script is loaded: `window.adsbygoogle`
3. Verify user is not premium: `user.isPremium === false`
4. Check ad blocker is disabled
5. Verify ad slots are configured correctly

### "TEST AD" Badge Still Showing (Live Mode)

**Problem:** Orange badge still visible after switching to live

**Solutions:**
1. Verify `testMode: false` in `src/lib/adConfig.ts`
2. Clear browser cache
3. Rebuild the application: `npm run build`
4. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Layout Shifting

**Problem:** Content jumps when ads load

**Solutions:**
- This is already handled with `min-height: 250px` in GoogleAdCard
- If issues persist, increase min-height in `src/components/GoogleAdCard.tsx`

### Low Viewability

**Problem:** Analytics show low viewability percentage

**Solutions:**
1. Increase ad interval (fewer ads = higher viewability)
2. Check if ads are placed below the fold
3. Verify users are scrolling through content
4. Monitor analytics: `__adAnalytics.logSummary()`

### Ads Not Matching Content Style

**Problem:** Ads look out of place

**Solutions:**
- Ad styling is automatically matched to article cards
- If customization needed, edit `src/components/GoogleAdCard.tsx`
- AdSense auto-optimizes ad appearance over time

### Premium Users Seeing Ads

**Problem:** Subscribed users still see ads

**Solutions:**
1. Check subscription status: `user.isPremium`
2. Verify subscription hasn't expired: `user.subscriptionExpiresAt`
3. Check logic in `src/lib/adUtils.ts`
4. Force logout and re-login

### Analytics Not Tracking

**Problem:** No data in `__adAnalytics`

**Solutions:**
1. Open browser console
2. Check for JavaScript errors
3. Verify ads are loading: Look for "📥 AdSense loaded" messages
4. Ensure test mode is active for development testing

---

## 📞 Support Resources

### Google AdSense Resources
- [AdSense Help Center](https://support.google.com/adsense)
- [AdSense Policy Center](https://support.google.com/adsense/answer/48182)
- [In-Feed Ads Guide](https://support.google.com/adsense/answer/7000933)

### Development Resources
- Configuration File: `src/lib/adConfig.ts`
- Analytics Module: `src/lib/adAnalytics.ts`
- Ad Component: `src/components/GoogleAdCard.tsx`

### Console Debugging

```javascript
// Check ad configuration
console.log(AD_CONFIG)

// View ad metrics
__adAnalytics.logSummary()

// Check if ads should show for current user
console.log(shouldShowAds(user))

// Export full analytics
console.log(__adAnalytics.exportMetrics())
```

---

## 📝 Change Log

### v1.0.0 - Initial Integration
- ✅ Added AdSense script to index.html
- ✅ Created GoogleAdCard component
- ✅ Integrated ads in NewsFeed, SearchView, SavedView
- ✅ Added premium user detection
- ✅ Created centralized ad configuration system
- ✅ Added comprehensive analytics tracking
- ✅ Implemented test mode for safe development
- ✅ Added error handling and fallbacks
- ✅ Created documentation

---

## 🎯 Quick Reference

### Switch to Live Ads (3 Steps)
1. Edit `src/lib/adConfig.ts` → Set `testMode: false`
2. Replace ad slot IDs with real AdSense unit IDs
3. Run `npm run build` and deploy

### Adjust Ad Frequency
Edit `src/lib/adConfig.ts` → `intervals` section

### Check Ad Performance
Console: `__adAnalytics.logSummary()`

### Verify Publisher ID
- File: `index.html` (Line 11)
- File: `src/lib/adConfig.ts` (Line 26)
- Both must match your AdSense account

---

**Last Updated:** January 2026
**Integration Version:** 1.0.0
**Status:** Production Ready (Test Mode Active)
