# Testing Google AdSense In-Feed Ads

## Quick Test Checklist

### ✅ Visual Check
1. Open the app in a browser
2. Scroll through the Discover feed
3. Look for ad cards that say **"Sponsored"** at the top
4. Ads should appear every 4-5 articles

### ✅ Ad Card Appearance
In-feed ads should look like this:
- "Sponsored" label in small gray text at top
- Similar height/width to article cards
- White background with border
- Minimum 250px height
- Blends naturally with feed

### ✅ Ad Frequency
- **Discover Feed:** 1 ad per 4 articles
- **Search Results:** 1 ad per 5 articles
- **Saved Articles:** 1 ad per 6 articles

### ✅ Premium User Check
1. Sign in as regular user → Should see ads
2. Update database to make user premium:
   ```sql
   UPDATE user_settings
   SET is_subscribed = true,
       subscription_expires_at = '2025-12-31'
   WHERE user_id = 'USER_ID_HERE';
   ```
3. Refresh page → Ads should disappear
4. Set `is_subscribed = false` → Ads reappear

### ✅ Browser Console Check
Open DevTools → Console tab, look for:
- ✅ No CSP errors
- ✅ No AdSense loading errors
- ✅ `adsbygoogle.push()` calls executing

### ✅ Network Check
Open DevTools → Network tab:
1. Filter by "pagead"
2. Refresh page
3. Should see requests to:
   - `pagead2.googlesyndication.com/pagead/js/adsbygoogle.js`
   - `googleads.g.doubleclick.net`

## Expected Behavior

### Immediately After Deployment
- Ad containers appear with "Sponsored" label
- May show blank/gray boxes for 10-30 minutes
- This is **normal** - Google needs time to crawl and serve ads

### After 1-24 Hours
- Real ads start appearing in feed
- Ads blend naturally with content
- Click tracking works

### After 1-7 Days
- Full ad optimization active
- Better ad targeting
- Higher fill rate (fewer blank ad slots)

## Troubleshooting

### Problem: No Ad Containers Appear
**Cause:** Component not rendering

**Fix:**
1. Check browser console for React errors
2. Verify `GoogleAdCard` imported in feeds
3. Check `shouldShowAds(user)` returns `true`

### Problem: Ad Containers Show But Stay Blank
**Cause:** Normal behavior or CSP issue

**Fix:**
1. Wait 30 minutes (Google needs time)
2. Check CSP allows all required domains
3. Verify AdSense account is approved
4. Check ad slot IDs are unique

### Problem: Ads Show for Premium Users
**Cause:** Subscription check failing

**Fix:**
1. Verify `user.isPremium` is `true`
2. Check `subscription_expires_at` is in future
3. Clear browser cache
4. Check auth context loading subscription data

### Problem: CSP Errors in Console
**Error:** "Refused to load script..."

**Fix:**
Add to `index.html` CSP:
```html
script-src ... https://pagead2.googlesyndication.com https://adservice.google.com https://www.googletagservices.com;
frame-src ... https://googleads.g.doubleclick.net https://tpc.googlesyndication.com;
```

## How It Works (Technical)

### 1. Initial Page Load
```
App loads → User context loads → Check isPremium
                                       ↓
                               shouldShowAds(user)
                                       ↓
                         Yes: Insert GoogleAdCard components
                         No: Skip ad components
```

### 2. Feed Rendering
```
NewsFeed.tsx → feedWithAds (useMemo)
                    ↓
    Every 4 articles → Insert GoogleAdCard
                    ↓
    GoogleAdCard renders → <ins class="adsbygoogle">
                    ↓
    useEffect → (window.adsbygoogle || []).push({})
                    ↓
    Google fills ad slot with relevant ad
```

### 3. Premium Toggle
```
User upgrades to premium → isPremium = true
                    ↓
    shouldShowAds(user) returns false
                    ↓
    feedWithAds filters out all ad entries
                    ↓
    Feed re-renders without ads
```

## Files Modified

### New Files
- `/src/components/GoogleAdCard.tsx` - In-feed ad component
- `/src/lib/adUtils.ts` - Ad visibility logic (updated)

### Modified Files
- `/index.html` - Added AdSense script + CSP
- `/src/types.ts` - Added `isPremium` to User
- `/src/lib/auth.ts` - Fetch subscription status
- `/src/App.tsx` - Monitor user for ad visibility
- `/src/components/NewsFeed.tsx` - Insert ads in discover/local feeds
- `/src/components/SearchView.tsx` - Insert ads in search results
- `/src/components/SavedView.tsx` - Insert ads in saved articles

## Performance Impact

### Bundle Size
- **Before:** 403.71 kB
- **After:** 405.50 kB
- **Increase:** ~1.8 kB (negligible)

### Runtime
- AdSense script loads async (non-blocking)
- Ad initialization per card: ~5ms
- Total impact: < 50ms on feed render

## Revenue Expectations

### Traffic-Based Estimates
- **1,000 daily users:** $2-10/day
- **10,000 daily users:** $20-100/day
- **100,000 daily users:** $200-1,000/day

**Factors affecting revenue:**
- Click-through rate (CTR)
- Cost-per-click (CPC)
- Geographic location
- Content category
- Ad placement quality

### Optimization Tips
1. Let Google optimize for 2-4 weeks
2. Don't click your own ads (ban risk)
3. Monitor AdSense reports weekly
4. Adjust ad frequency based on metrics
5. Test different ad placements

## Contact

For questions about:
- **AdSense Setup:** Check `ADSENSE_INTEGRATION.md`
- **Database/Auth:** Check `SECURITY_SETUP.md`
- **Deployment:** Check `DEPLOYMENT.md`
- **Native Ads:** Check `AD_SYSTEM_TESTING.md`
