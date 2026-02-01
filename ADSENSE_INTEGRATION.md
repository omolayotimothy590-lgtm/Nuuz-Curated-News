# Google AdSense In-Feed Ads Integration

## Overview
Google AdSense has been integrated into the Nuuz web app with **in-feed ad placement**. Ads appear as native cards that blend seamlessly with article posts throughout the feed.

## Implementation Details

### 1. AdSense Script
The AdSense script has been added to the `<head>` section of `index.html`:

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9934433795401149"
     crossorigin="anonymous"></script>
```

### 2. Content Security Policy (CSP)
The CSP has been updated to allow AdSense domains:
- `pagead2.googlesyndication.com` (scripts)
- `adservice.google.com` (scripts)
- `www.googletagservices.com` (scripts)
- `googleads.g.doubleclick.net` (frames)
- `tpc.googlesyndication.com` (frames)

### 3. Premium User Ad Blocking
Nuuz+ premium subscribers will **not see ads**. The system checks:
- User subscription status (`isPremium` field)
- Subscription expiration date
- If expired, ads resume automatically

The logic is in `/src/lib/adUtils.ts`:
```typescript
export function shouldShowAds(user: User | null): boolean {
  if (!user) return true; // Non-authenticated users see ads

  if (user.isPremium) {
    if (user.subscriptionExpiresAt) {
      return new Date(user.subscriptionExpiresAt) <= new Date();
    }
    return false; // Active premium = no ads
  }

  return true; // Non-premium users see ads
}
```

### 4. In-Feed Ad Cards
A custom `GoogleAdCard` component has been created that:
- Matches the styling of article cards
- Shows "Sponsored" label
- Uses Google's fluid ad format
- Appears every 4-5 articles in feeds
- Automatically initializes AdSense ads

**Component location:** `/src/components/GoogleAdCard.tsx`

### 5. Ad Placement Strategy
Ads are inserted into feeds at regular intervals:
- **Discover/Local Feed:** Every 4 articles
- **Search Results:** Every 5 articles
- **Saved Articles:** Every 6 articles

All ads are served by **Google AdSense** using native in-feed format.

### 6. Dynamic Ad Control
- Ads are hidden/shown dynamically when users sign in/out
- Premium status is checked on every page load
- Ad visibility updates instantly when subscription status changes
- No ads appear in feeds for premium users

## How In-Feed Ads Work

### Initial Setup (1-7 days)
After deployment, Google needs to:
1. Crawl your website
2. Analyze content and layout
3. Determine optimal ad placements
4. Start serving ads

**Ads may not appear immediately.** This is normal.

### Ad Placement
In-feed ads are:
- **Manually placed** at regular intervals between articles
- Styled to match article cards with "Sponsored" labels
- Using Google's fluid/native ad format
- Automatically filled with relevant ads by Google

The app controls **where** ads appear (every 4-6 posts), but Google controls **what** ads show based on:
- User interests and browsing history
- Content relevance
- Advertiser bidding
- Geographic location

## Testing

### To Test Ads Are Loading:
1. Open browser DevTools → Network tab
2. Filter by "pagead"
3. Refresh the page
4. Look for requests to `pagead2.googlesyndication.com`

### To Test Premium Ad Blocking:
1. Sign in as a regular user → Ads should show
2. Manually set `is_subscribed = true` in database for that user
3. Refresh page → Ads should be hidden
4. Check browser console for ad hiding logs

### Database Query to Grant Premium:
```sql
UPDATE user_settings
SET is_subscribed = true,
    subscription_expires_at = '2025-12-31'
WHERE user_id = 'USER_ID_HERE';
```

## AdSense Account Management

### View Ad Performance:
Visit [Google AdSense Dashboard](https://adsense.google.com)

### Configure Auto Ads Settings:
1. Go to AdSense → Ads → Overview
2. Click "Auto ads"
3. Adjust settings:
   - Ad load (how many ads)
   - Ad formats (text, display, in-feed)
   - Page exclusions

### Ad Formats Available:
- In-feed ads (blend with news articles)
- Anchor ads (bottom of screen)
- Vignette ads (between page loads)
- Text & display ads

## Troubleshooting

### Ads Not Showing?
1. **Wait 10-30 minutes** after deployment
2. Check AdSense account is approved and active
3. Verify site is added to AdSense account
4. Ensure no browser ad blockers are active
5. Check browser console for CSP errors

### Premium Users Still Seeing Ads?
1. Verify `is_subscribed = true` in database
2. Check `subscription_expires_at` is in the future
3. Clear browser cache and reload
4. Check browser console for ad hiding logs

### CSP Errors?
If you see Content Security Policy errors:
1. Check `index.html` includes all AdSense domains
2. Verify no typos in domain names
3. Clear browser cache

## Revenue

### Payment Schedule:
- Google pays monthly (around 21st of each month)
- Minimum payout: $100
- Payment methods: Direct deposit, wire transfer, checks

### Optimizing Revenue:
1. Enable all ad formats in AdSense settings
2. Use "Optimize" ad load setting
3. Let Google auto-optimize placements
4. Monitor performance in AdSense dashboard

## Notes

- **Do not click your own ads** (violates AdSense policies)
- Ads respect dark/light mode automatically
- Ad revenue scales with traffic
- Premium users see no ads (as designed)
- Google handles all advertiser relationships
