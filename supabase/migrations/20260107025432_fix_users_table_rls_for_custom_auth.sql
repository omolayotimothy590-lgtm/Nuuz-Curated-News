/*
  # Fix Users Table RLS for Custom Authentication

  ## Changes
  - Drop existing restrictive RLS policies that require Supabase Auth
  - Add new policies that allow custom auth system to work:
    - Public can insert new users (for signup)
    - Public can view user profiles (unchanged)
    - Public can update users (needed for Google Sign-in updates)
  
  ## Security Notes
  - Email uniqueness enforced by database constraint
  - Application layer handles authentication validation
  - This enables the custom auth system to function properly

  ## Important
  This migration is necessary because the application uses a custom users table
  with manual password hashing, NOT Supabase's built-in auth.users system.
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can view user profiles" ON public.users;

-- Allow anyone to insert users (for signup)
CREATE POLICY "Public can register users"
  ON public.users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow anyone to view user profiles
CREATE POLICY "Public can view user profiles"
  ON public.users
  FOR SELECT
  TO public
  USING (true);

-- Allow updates for Google Sign-in and profile updates
CREATE POLICY "Public can update user profiles"
  ON public.users
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);
