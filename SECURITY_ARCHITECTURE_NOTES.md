# Security Architecture Notes

## Critical Security Issue: Custom Auth with RLS Limitations

### Current Architecture

The application uses a **custom authentication system** that stores user credentials in `public.users` instead of using Supabase's built-in `auth.users` table. This creates fundamental security limitations with Row-Level Security (RLS).

**How it works:**
- All database requests use the anon key from the client
- Password hashing happens client-side (SHA-256)
- Authentication logic is entirely in the application layer
- No server-side session management

### The RLS Security Problem

**Issue:** The security audit flagged the `users` table UPDATE policy with `USING (true)`.

**Why this is flagged:**
- `USING (true)` means any client can attempt to UPDATE any user record
- RLS cannot distinguish between users because all requests use the same anon key
- There's no way for RLS to enforce "users can only update their own records"

**Current mitigation:**
- The `WITH CHECK` clause prevents changing critical fields (email, password_hash, google_id)
- Only profile fields (full_name, avatar_url) can be modified
- Application layer is responsible for authorization

**Why this is still a concern:**
- A malicious client could still attempt to update other users' profile fields
- The database has no way to verify the authenticated user's identity
- Security relies entirely on client-side code (which can be bypassed)

### Recommended Solutions

#### Option 1: Switch to Supabase Auth (Recommended)

**Benefits:**
- Proper server-side session management
- RLS can use `auth.uid()` to verify user identity
- Industry-standard security practices
- Built-in features (password reset, email verification, MFA)

**Changes required:**
- Replace custom `users` table with `auth.users`
- Update all authentication code to use Supabase Auth SDK
- Modify RLS policies to use `auth.uid()`
- Store additional profile data in a separate `profiles` table

**Example RLS with Supabase Auth:**
```sql
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

#### Option 2: Backend API with Service Role

**Benefits:**
- Complete control over authorization logic
- Can implement complex business rules
- RLS bypassed by service role key (no RLS limitations)

**Changes required:**
- Create backend API (Edge Functions or external server)
- Move all auth logic to backend
- Use service role key on backend
- Validate requests with session tokens

#### Option 3: JWT-based Custom Claims

**Benefits:**
- Keep custom auth but add proper identity verification
- RLS can use JWT claims to identify users
- More flexible than Supabase Auth

**Changes required:**
- Generate JWT tokens on login with user ID in claims
- Configure Supabase to accept custom JWT tokens
- Update RLS to read from JWT: `(current_setting('request.jwt.claims', true)::json->>'user_id')::uuid = id`

### Current Security Status

✅ **Fixed:**
- Added foreign key indexes for performance
- WITH CHECK prevents modification of critical auth fields
- Email validation on INSERT

⚠️ **Partially Mitigated:**
- RLS policy with `USING (true)` still allows cross-user UPDATE attempts
- Application layer enforces authorization (not database)
- Client-side authentication can be bypassed

❌ **Remaining Risks:**
- Password hashing uses SHA-256 (should use bcrypt/argon2)
- No rate limiting on login attempts
- No session management or token expiration
- Profile fields can potentially be modified by malicious clients

### Immediate Next Steps

1. **For Production:** Strongly consider migrating to Supabase Auth (Option 1)
2. **Short-term:** Move sensitive operations to Edge Functions with service role
3. **Password Security:** Replace SHA-256 with proper password hashing
4. **Rate Limiting:** Implement rate limiting on auth endpoints
5. **Audit Logging:** Add logging for all authentication events

### Auth Configuration (Dashboard)

See `SUPABASE_AUTH_CONFIGURATION.md` for required dashboard configuration:
- Switch to percentage-based connection pooling
- Enable leaked password protection
- Configure rate limiting
- Enable audit logging

---

**Last Updated:** 2026-01-07
**Status:** Security audit issues addressed at database level, but fundamental architectural limitations remain
