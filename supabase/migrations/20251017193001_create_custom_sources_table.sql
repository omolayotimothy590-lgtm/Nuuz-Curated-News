/*
  # Create Custom RSS Sources Table

  1. New Tables
    - `custom_sources`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users) - Links source to specific user
      - `name` (text) - Display name for the source
      - `url` (text) - RSS feed URL
      - `category` (text) - Category assignment
      - `enabled` (boolean) - Whether source is active
      - `created_at` (timestamptz) - When source was added
      - `updated_at` (timestamptz) - Last update time
  
  2. Security
    - Enable RLS on `custom_sources` table
    - Users can only read their own sources
    - Users can only insert sources for themselves
    - Users can only update their own sources
    - Users can only delete their own sources
  
  3. Performance
    - Add index on user_id for fast lookups
    - Add index on category for filtering
    - Add unique constraint on user_id + url to prevent duplicates
*/

CREATE TABLE IF NOT EXISTS custom_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  url text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, url)
);

ALTER TABLE custom_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own custom sources"
  ON custom_sources FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom sources"
  ON custom_sources FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom sources"
  ON custom_sources FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom sources"
  ON custom_sources FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_custom_sources_user_id ON custom_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_sources_category ON custom_sources(category);
CREATE INDEX IF NOT EXISTS idx_custom_sources_enabled ON custom_sources(enabled);
