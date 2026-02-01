/*
  # Add Password Hash Column to Users Table

  1. Changes
    - Add `password_hash` column to `users` table for email/password authentication
    - Make `google_id` nullable (since email users won't have it)
    
  2. Notes
    - This allows the users table to support both Google Sign-In and email/password auth
    - Passwords will be hashed client-side before storage
*/

-- Add password_hash column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users ADD COLUMN password_hash TEXT;
  END IF;
END $$;

-- Make google_id nullable
ALTER TABLE users ALTER COLUMN google_id DROP NOT NULL;
