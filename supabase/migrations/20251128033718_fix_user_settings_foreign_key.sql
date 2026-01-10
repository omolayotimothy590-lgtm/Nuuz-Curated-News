/*
  # Fix user_settings Foreign Key Constraint

  1. Changes
    - Drop existing foreign key constraint pointing to auth.users
    - Add new foreign key constraint pointing to public.users
    - This allows webhook to properly create user_settings records

  2. Security
    - Maintains referential integrity with correct users table
*/

-- Drop the incorrect foreign key constraint
ALTER TABLE user_settings 
DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;

-- Add correct foreign key constraint to public.users
ALTER TABLE user_settings
ADD CONSTRAINT user_settings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;