/*
  # Create Custom RSS Sources Table

  Allows users to add their own RSS feed sources
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

CREATE POLICY "Users can read own custom sources" ON custom_sources FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own custom sources" ON custom_sources FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own custom sources" ON custom_sources FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own custom sources" ON custom_sources FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_custom_sources_user_id ON custom_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_sources_category ON custom_sources(category);
CREATE INDEX IF NOT EXISTS idx_custom_sources_enabled ON custom_sources(enabled);
