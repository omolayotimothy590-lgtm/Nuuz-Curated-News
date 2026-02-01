# Supabase Configuration Notes

## Configuration Issues That Require Manual Setup

The following security and performance issues cannot be fixed through SQL migrations and require manual configuration in the Supabase Dashboard.

### 1. Auth DB Connection Strategy (Performance)

**Issue:** Auth server is configured to use a fixed number of connections (10) instead of percentage-based allocation.

**Impact:** Scaling up the database instance won't automatically improve Auth server performance.

**Resolution Required:**
1. Go to Supabase Dashboard
2. Navigate to Project Settings > Database > Connection Pooling
3. Change Auth connection strategy from "Fixed" to "Percentage"
4. Recommended: Set to 10-20% of available connections

**Current Status:** ⚠️ Requires manual configuration

---

### 2. Leaked Password Protection (Security)

**Issue:** Supabase Auth's leaked password protection is disabled.

**Impact:** This feature is not applicable to this project.

**Why This Doesn't Apply:**
This application uses a **custom authentication system** with a custom `users` table and manual password hashing. It does NOT use Supabase's built-in `auth.users` system.

The "Leaked Password Protection" feature only works with Supabase Auth's built-in authentication, which checks passwords against HaveIBeenPwned.org during signup.

**Current Status:** ℹ️ Not applicable (custom auth system in use)

**Note:** If you want leaked password protection, you would need to:
- Migrate to Supabase Auth (`auth.users` table), OR
- Implement your own HaveIBeenPwned API integration in the application layer

---

## Security Issues Fixed via Migrations

### 1. Unused Database Indexes (Performance) ✅
**Fixed in:** `remove_unused_indexes.sql`

Removed three unused indexes:
- `idx_ai_conversations_article_id`
- `idx_comments_user_id`
- `idx_comment_likes_user_id`

**Impact:** Improved write performance and reduced storage overhead.

---

### 2. RLS Policies (Security) ✅
**Fixed in:** `improve_users_table_rls_security.sql`

Improved Row Level Security policies for the `users` table:

**INSERT Policy:**
- Validates email format with regex
- Requires either `password_hash` OR `google_id` (prevents empty auth records)
- Enforces proper authentication method

**UPDATE Policy:**
- Restricts updates to safe profile fields only
- Prevents modification of critical auth fields (`email`, `password_hash`, `google_id`)
- Allows updates to `full_name`, `avatar_url`, `last_sign_in_at`

**SELECT Policy:**
- Allows public viewing of user profiles (required for app functionality)

**Note:** These policies provide reasonable security for a custom auth system, but cannot match the security of Supabase's built-in auth.uid() verification since the app handles authentication at the application layer.

---

## Security Considerations

### Custom Authentication System

This application implements authentication at the application layer rather than using Supabase Auth. This approach has trade-offs:

**Advantages:**
- Full control over auth logic
- Can support multiple auth methods (email/password + Google Sign-in)
- Custom user table structure

**Limitations:**
- RLS policies cannot verify user identity using `auth.uid()`
- Must rely on application-layer validation
- No built-in features like leaked password protection, MFA, etc.

**Recommendations for Enhanced Security:**

1. **Consider Supabase Auth Migration:**
   - Better RLS integration with `auth.uid()`
   - Built-in security features (leaked passwords, MFA, etc.)
   - More secure by default

2. **If Keeping Custom Auth:**
   - Implement rate limiting on auth endpoints
   - Add email verification
   - Consider integrating HaveIBeenPwned API
   - Add audit logging for auth events
   - Implement account lockout after failed attempts

3. **Use Service Role Key Carefully:**
   - Never expose in client code
   - Use only in server-side Edge Functions
   - Implement proper access controls

---

## Action Items

- [ ] Configure Auth DB connection pooling to use percentage strategy
- [ ] Review and validate custom auth implementation
- [ ] Consider migration to Supabase Auth for enhanced security
- [ ] Implement additional security measures (rate limiting, email verification, etc.)
