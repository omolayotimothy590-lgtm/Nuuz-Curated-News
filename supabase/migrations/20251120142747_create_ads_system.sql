/*
  # Create Native Ads System

  1. New Tables
    - `ads`
      - `id` (uuid, primary key)
      - `title` (text) - Ad headline
      - `description` (text) - Optional ad description
      - `image_url` (text) - Ad image
      - `link_url` (text) - Click destination
      - `is_active` (boolean) - Whether ad should be shown
      - `priority` (integer) - Display priority (higher = more frequent)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Update user_settings
    - Add `is_subscribed` (boolean) - Nuuz+ subscription status
    - Add `subscription_expires_at` (timestamptz) - Subscription expiry date

  3. Security
    - Enable RLS on `ads` table
    - Allow all authenticated users to read active ads
    - Only allow admin operations (insert/update/delete) via service role
*/

-- Create ads table
CREATE TABLE IF NOT EXISTS ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  link_url text NOT NULL,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on ads table
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read active ads
CREATE POLICY "Authenticated users can view active ads"
  ON ads
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Allow anonymous users to view active ads (for public feed)
CREATE POLICY "Anonymous users can view active ads"
  ON ads
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Add subscription fields to user_settings if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'is_subscribed'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN is_subscribed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN subscription_expires_at timestamptz;
  END IF;
END $$;

-- Create index for better ad query performance
CREATE INDEX IF NOT EXISTS idx_ads_active_priority ON ads(is_active, priority DESC) WHERE is_active = true;

-- Create updated_at trigger for ads
CREATE OR REPLACE FUNCTION update_ads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ads_updated_at_trigger
  BEFORE UPDATE ON ads
  FOR EACH ROW
  EXECUTE FUNCTION update_ads_updated_at();
