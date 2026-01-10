/*
  # Add Unique Constraint to user_settings

  1. Changes
    - Add unique constraint on user_id column
    - This allows proper upsert operations in webhook
    - Ensures one settings record per user

  2. Notes
    - Required for ON CONFLICT (user_id) DO UPDATE to work
*/

-- Add unique constraint on user_id
ALTER TABLE user_settings
ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);