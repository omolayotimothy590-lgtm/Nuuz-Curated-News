/*
  # Improve Users Table RLS Security

  ## Changes
  This migration improves RLS policies for the users table while maintaining
  compatibility with the custom authentication system.

  ## Security Improvements
  1. INSERT Policy:
     - Requires valid email address
     - Requires either password_hash OR google_id (prevents empty auth records)
     - Enforces email uniqueness (already handled by database constraint)
  
  2. UPDATE Policy:
     - Restricts updates to specific safe fields only
     - Prevents modification of critical auth fields (email, password_hash, google_id)
     - Allows updates to profile fields (full_name, avatar_url, last_sign_in_at)

  ## Notes
  - These policies work with the custom auth system (not Supabase Auth)
  - Application layer still handles authentication validation
  - Additional constraints prevent malicious or accidental data corruption
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public can register users" ON public.users;
DROP POLICY IF EXISTS "Public can view user profiles" ON public.users;
DROP POLICY IF EXISTS "Public can update user profiles" ON public.users;

-- Allow user registration with validation
CREATE POLICY "Allow user registration with valid data"
  ON public.users
  FOR INSERT
  TO public
  WITH CHECK (
    -- Require valid email
    email IS NOT NULL 
    AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    -- Require either password auth OR google auth
    AND (password_hash IS NOT NULL OR google_id IS NOT NULL)
  );

-- Allow viewing user profiles (needed for app functionality)
CREATE POLICY "Anyone can view user profiles"
  ON public.users
  FOR SELECT
  TO public
  USING (true);

-- Allow limited profile updates (for Google Sign-in and profile management)
-- Note: In a custom auth system, we can't verify user identity at RLS level,
-- but we can restrict which fields can be updated
CREATE POLICY "Allow profile updates to safe fields"
  ON public.users
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (
    -- Allow updates to these safe fields only
    -- Email, password_hash, and google_id should not be modified via public UPDATE
    email = (SELECT email FROM public.users WHERE id = users.id)
    AND COALESCE(password_hash, '') = COALESCE((SELECT password_hash FROM public.users WHERE id = users.id), '')
    AND COALESCE(google_id, '') = COALESCE((SELECT google_id FROM public.users WHERE id = users.id), '')
  );
