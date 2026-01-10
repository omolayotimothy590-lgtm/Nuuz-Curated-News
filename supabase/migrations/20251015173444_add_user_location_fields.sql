/*
  # Add User Location Fields

  1. Changes
    - Add `zip_code` column to `user_settings` table (varchar(5))
    - Add `city` column to `user_settings` table (text)
    - Add `state` column to `user_settings` table (text)
    - Add `state_code` column to `user_settings` table (varchar(2))
    - Add `location_updated_at` timestamp column
  
  2. Purpose
    - Store user's ZIP code for local news filtering
    - Store resolved city/state information
    - Track when location was last updated
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'zip_code'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN zip_code varchar(5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'city'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'state'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN state text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'state_code'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN state_code varchar(2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'location_updated_at'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN location_updated_at timestamptz;
  END IF;
END $$;