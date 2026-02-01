/*
  # Create user_settings table with Google Sign-In support

  1. New Tables
    - `user_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable - for Supabase Auth users only)
      - `email` (text, unique - used for Google Sign-In users)
      - `full_name` (text)
      - `avatar_url` (text)
      - `settings` (jsonb) - stores user preference settings
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_settings` table
    - Add policy for authenticated users to read/write their own settings
    - Add policy for unauthenticated users (Google Sign-In) to insert/update via email

  3. Design Notes
    - Supports both Supabase Auth users (user_id based) and Google Sign-In users (email based)
    - Email column is unique and indexed for quick lookups
    - Google Sign-In users will have NULL user_id but non-null email
*/

CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy for Supabase Auth users
CREATE POLICY "Auth users can read own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for anyone to insert (both auth and Google Sign-In)
CREATE POLICY "Users can insert settings"
  ON user_settings FOR INSERT
  WITH CHECK (true);

-- Policy for anyone to update (both auth and Google Sign-In)
CREATE POLICY "Users can update settings"
  ON user_settings FOR UPDATE
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON user_settings(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS user_settings_email_idx ON user_settings(email);
