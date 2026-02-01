# Supabase Auth Configuration Requirements

This document outlines Auth-related configuration that must be performed in the Supabase Dashboard (these cannot be configured via SQL migrations).

## Required Configuration Changes

### 1. Auth DB Connection Strategy

**Issue:** Auth server is configured to use a fixed 10 connections instead of percentage-based allocation.

**Fix Required:**
1. Go to Supabase Dashboard → Project Settings → Database
2. Navigate to Connection Pooling settings
3. Change Auth connection strategy from "Fixed (10)" to "Percentage-based"
4. Recommended: Set to 10-20% of available connections
5. Save changes

**Why This Matters:**
- Fixed connection allocation doesn't scale with instance size
- Percentage-based allocation automatically adjusts when you upgrade your instance
- Improves Auth server performance under load

### 2. Leaked Password Protection

**Issue:** Protection against compromised passwords (via HaveIBeenPwned.org) is disabled.

**Fix Required:**
1. Go to Supabase Dashboard → Authentication → Providers
2. Navigate to Email provider settings
3. Enable "Password strength" or "Leaked password protection"
4. This will check passwords against the HaveIBeenPwned database
5. Save changes

**Why This Matters:**
- Prevents users from using passwords that have been exposed in data breaches
- Significantly improves account security
- Industry best practice for password validation

## Already Fixed via SQL Migration

The following issues have been resolved via the `fix_foreign_key_indexes_and_rls` migration:

✅ Added index on `ai_conversations.article_id`
✅ Added index on `comment_likes.user_id`
✅ Added index on `comments.user_id`
✅ Fixed RLS policy on `users` table that had `USING (true)`

## Verification

After completing the dashboard configuration:

1. Verify Auth connections scale properly with instance size
2. Test user registration with compromised passwords (should be rejected)
3. Monitor database performance for improved query times on indexed foreign keys

## Additional Security Recommendations

- Enable 2FA/MFA for admin accounts
- Set up email confirmation for new user registrations (if not already enabled)
- Configure rate limiting on Auth endpoints
- Review and audit all RLS policies regularly
- Enable audit logging for sensitive operations
