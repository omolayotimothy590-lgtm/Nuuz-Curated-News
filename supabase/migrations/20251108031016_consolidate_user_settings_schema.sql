/*
  # Consolidate user_settings table schema

  1. Purpose
    - Create a unified user_settings table that supports both Supabase Auth and Google Sign-In
    - This migration consolidates multiple conflicting schemas into one

  2. New Tables
    - `user_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable - for Supabase Auth users)
      - `email` (text, unique - primary identifier for all users)
      - `full_name` (text)
      - `avatar_url` (text)
      - `settings` (jsonb) - stores user preference settings
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Security
    - Enable RLS on `user_settings` table
    - Authenticated users can read/update their own settings (matched by user_id)
    - Authenticated users can insert settings where they match the user_id and email
    - Properly restrictive policies (no `WITH CHECK (true)`)

  4. Design Notes
    - Supports both Supabase Auth users (user_id based) and Google Sign-In users
    - Email is the unique identifier and required field
    - User_id can be null for non-Supabase auth users (future extensibility)
    - Settings field stores all preference data as JSONB
*/

-- Drop table if exists (this is safe as no production data exists yet)
DROP TABLE IF EXISTS user_settings CASCADE;

-- Create user_settings table with comprehensive schema
CREATE TABLE user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read their own settings
CREATE POLICY "Users can read own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for authenticated users to insert their own settings
CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    auth.jwt()->>'email' = email
  );

-- Policy for authenticated users to update their own settings
CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to delete their own settings
CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX user_settings_user_id_idx ON user_settings(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX user_settings_email_idx ON user_settings(email);
CREATE INDEX user_settings_created_at_idx ON user_settings(created_at);
