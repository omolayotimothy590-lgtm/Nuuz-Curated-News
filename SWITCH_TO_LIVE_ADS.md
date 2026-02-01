# Quick Guide: Switch to Live AdSense Ads

## ⚡ 3-Minute Setup

### Step 1: Get Your AdSense Ad Unit IDs

1. Log in to [Google AdSense](https://www.google.com/adsense)
2. Go to **Ads** → **By ad unit** → **In-feed ads**
3. Create at least 10 ad units
4. Copy each ad unit ID (looks like `1234567890`)

---

### Step 2: Update Configuration

**File:** `src/lib/adConfig.ts`

**Line 28:** Change test mode
```typescript
testMode: false,  // ← Change from true to false
```

**Lines 35-57:** Update ad slot IDs
```typescript
adSlots: {
  feed: [
    { id: '1234567890', description: 'Feed Ad Slot 1' },  // ← Your real IDs
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
```

---

### Step 3: Verify Publisher ID

**File:** `index.html` (Line 11)

Confirm this matches your AdSense account:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9934433795401149"
 crossorigin="anonymous"></script>
```

Replace `ca-pub-9934433795401149` with your publisher ID if different.

---

### Step 4: Build and Deploy

```bash
# Build the app
npm run build

# Verify build success
# ✓ Should show "built in X.XXs"

# Deploy to your hosting platform
# (Netlify, Vercel, etc.)
```

---

### Step 5: Verify Live Ads

1. Visit your production site
2. Scroll through feed
3. **Check:**
   - ✅ Ads are displaying
   - ✅ No "TEST AD" badge visible
   - ✅ "Sponsored" label present
   - ✅ Ads look natural

4. **Monitor AdSense:**
   - Wait 24-48 hours for data
   - Check impressions in dashboard
   - Verify clicks are tracked

---

## 🔙 Switch Back to Test Mode

**File:** `src/lib/adConfig.ts`

**Line 28:** Change back
```typescript
testMode: true,  // ← Change from false to true
```

Rebuild and deploy. "TEST AD" badges will reappear.

---

## 📊 Check Performance

```javascript
// Open browser console (F12)
__adAnalytics.logSummary()
```

**Look for:**
- Viewability Rate: Should be > 50%
- Errors: Should be 0
- Rendered Ads: Should match loaded ads

---

## ❓ Troubleshooting

### Ads Not Showing
- Clear browser cache (Ctrl+Shift+R)
- Disable ad blocker
- Check console for errors
- Verify `testMode: false`

### "TEST AD" Still Showing
- Confirm `testMode: false` in code
- Rebuild: `npm run build`
- Clear cache and hard refresh

### Wrong Ads Showing
- Verify ad slot IDs in `adConfig.ts`
- Check AdSense dashboard for ad unit status
- Ensure ad units are active

---

## 📝 Checklist

**Before Going Live:**
- [ ] Created 10+ ad units in AdSense
- [ ] Copied all ad unit IDs
- [ ] Updated `testMode: false`
- [ ] Updated all ad slot IDs
- [ ] Verified publisher ID
- [ ] Ran `npm run build` successfully
- [ ] Deployed to production

**After Going Live:**
- [ ] Visited production site
- [ ] Confirmed ads displaying
- [ ] No "TEST AD" badge visible
- [ ] Checked AdSense dashboard
- [ ] Monitored for 24-48 hours

---

## 🔗 Resources

- **Full Documentation:** `ADSENSE_INTEGRATION_GUIDE.md`
- **Implementation Details:** `ADSENSE_IMPLEMENTATION_SUMMARY.md`
- **AdSense Dashboard:** https://www.google.com/adsense
- **AdSense Help:** https://support.google.com/adsense

---

**Current Status:** Test Mode Active 🧪

**Ready to Switch?** Follow steps above! ⬆️
