# Supabase Manual Security Configuration

## Required Manual Actions

The following security configurations cannot be set via SQL migrations and must be configured manually in the Supabase Dashboard.

---

## 1. Auth Database Connection Strategy

**Status**: ⚠️ Action Required
**Current Setting**: Fixed 10 connections
**Required Setting**: Percentage-based allocation

### Why This Matters
Your Auth server is currently limited to exactly 10 database connections. When you scale up your database instance, the Auth server won't be able to utilize the additional connection capacity, limiting its performance under load.

### Steps to Fix

1. Navigate to your Supabase project dashboard
2. Go to **Settings** → **Database** (or **Project Settings** → **Database**)
3. Find the **Connection Pooling** section
4. Locate **Auth Server Connection Pool**
5. Change the allocation strategy from **"Fixed"** to **"Percentage"**
6. Set an appropriate percentage (recommended: **10-15%**)
7. Click **Save**

### Impact
- ✅ Auth server automatically scales with database instance size
- ✅ Better performance during traffic spikes
- ✅ More efficient resource utilization

---

## 2. Password Breach Protection

**Status**: ⚠️ Action Required
**Current Setting**: Disabled
**Required Setting**: Enabled

### Why This Matters
When enabled, Supabase checks new passwords against the HaveIBeenPwned database, which contains over 600 million compromised passwords. This prevents users from choosing passwords that have been exposed in data breaches.

### Steps to Fix

1. Navigate to your Supabase project dashboard
2. Go to **Authentication** → **Settings** (or **Auth** → **Policies**)
3. Scroll to find **"Password Breach Protection"** or **"Security Settings"**
4. Enable the option: **"Check passwords against HaveIBeenPwned database"**
5. Click **Save**

### Impact
- ✅ Prevents use of compromised passwords
- ✅ Reduces account takeover risk
- ✅ Improves overall account security
- ℹ️ Only checks passwords during registration/password change (not retroactive)

---

## Index Usage Notes

### "Unused" Indexes Status

The following indexes are flagged as unused but should **NOT** be removed:

- `idx_ai_conversations_article_id` - Supports foreign key: `ai_conversations.article_id → articles.id`
- `idx_comments_user_id` - Supports foreign key: `comments.user_id → auth.users.id`
- `idx_comment_likes_user_id` - Supports foreign key: `comment_likes.user_id → auth.users.id`

### Why These Are Flagged
These indexes were recently created and haven't accumulated usage statistics yet. Postgres marks indexes as "unused" when:
1. They're newly created
2. Statistics haven't been collected
3. No queries have utilized them yet

### Why We Keep Them
These indexes are **essential** for:
- **Foreign Key Performance**: Dramatically speed up JOIN operations and CASCADE deletes
- **RLS Policy Enforcement**: Support `WHERE user_id = auth.uid()` clauses efficiently
- **Query Optimization**: Future queries filtering by these columns will be fast

### Expected Behavior
Once your application runs production queries involving:
- User-specific data filtering (`WHERE user_id = ...`)
- Article conversations (`JOIN ai_conversations ON article_id = ...`)
- Comment lookups by user (`WHERE comments.user_id = ...`)

These indexes will automatically start showing usage statistics and the warnings will disappear.

---

## Verification Checklist

After completing the manual configuration:

- [ ] Auth connection strategy changed to percentage-based
- [ ] Password breach protection enabled
- [ ] Confirmed settings saved successfully
- [ ] No console errors in Supabase Dashboard

---

## Security Posture Summary

### Automated Fixes ✅
- [x] Foreign key indexes created
- [x] Unused indexes cleaned up
- [x] RLS policies optimized with `(select auth.uid())`
- [x] Service role policies secured
- [x] Function search paths fixed

### Manual Configuration ⚠️
- [ ] Auth connection strategy → Percentage-based
- [ ] Password breach protection → Enabled

**Complete these 2 steps to achieve 100% security compliance.**
