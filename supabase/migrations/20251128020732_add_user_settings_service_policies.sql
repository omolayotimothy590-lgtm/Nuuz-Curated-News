/*
  # Add Service Role Policies for user_settings Table

  1. Changes
    - Add INSERT policy for service role to create user settings records
    - Add UPDATE policy for service role to update subscription status
    - These policies enable the stripe-webhook edge function to manage user settings

  2. Security
    - Policies allow service role operations (webhook updates)
    - Existing user policies remain unchanged
*/

-- Drop existing service policies if they exist
DROP POLICY IF EXISTS "Service can insert user settings" ON user_settings;
DROP POLICY IF EXISTS "Service can update user settings" ON user_settings;

-- Allow service role to insert user settings
CREATE POLICY "Service can insert user settings"
  ON user_settings
  FOR INSERT
  WITH CHECK (true);

-- Allow service role to update user settings
CREATE POLICY "Service can update user settings"
  ON user_settings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);