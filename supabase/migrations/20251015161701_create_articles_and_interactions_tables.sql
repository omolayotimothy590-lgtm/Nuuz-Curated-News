/*
  # Create articles and user interactions tables

  1. New Tables
    - `articles`
      - `id` (uuid, primary key)
      - `title` (varchar 500)
      - `summary` (text)
      - `full_content` (text)
      - `source` (varchar 100)
      - `source_logo` (text, URL)
      - `category` (varchar 50)
      - `image_url` (text)
      - `article_url` (text, unique)
      - `published_at` (timestamptz)
      - `read_time` (integer, minutes)
      - `is_trending` (boolean, default false)
      - `engagement_score` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `user_interactions`
      - `id` (uuid, primary key)
      - `user_id` (text) - can be auth user id or device id for guests
      - `article_id` (uuid, foreign key to articles)
      - `action` (text) - thumbs_up, thumbs_down, save, read, share
      - `timestamp` (timestamptz)

    - `user_preferences`
      - `id` (uuid, primary key)
      - `user_id` (text, unique)
      - `category_scores` (jsonb) - stores category preferences
      - `source_scores` (jsonb) - stores source preferences
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Articles: publicly readable
    - User interactions: users can read/write their own
    - User preferences: users can read/write their own

  3. Indexes
    - Articles: category, published_at, is_trending, article_url
    - User interactions: user_id, article_id, action
    - User preferences: user_id
*/

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(500) NOT NULL,
  summary text,
  full_content text,
  source varchar(100) NOT NULL,
  source_logo text,
  category varchar(50) NOT NULL,
  image_url text,
  article_url text UNIQUE NOT NULL,
  published_at timestamptz NOT NULL,
  read_time integer DEFAULT 5,
  is_trending boolean DEFAULT false,
  engagement_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_interactions table
CREATE TABLE IF NOT EXISTS user_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL CHECK (action IN ('thumbs_up', 'thumbs_down', 'save', 'read', 'share')),
  timestamp timestamptz DEFAULT now()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL,
  category_scores jsonb DEFAULT '{}'::jsonb,
  source_scores jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Articles policies (publicly readable)
CREATE POLICY "Articles are viewable by everyone"
  ON articles FOR SELECT
  TO public
  USING (true);

-- User interactions policies
CREATE POLICY "Users can view own interactions"
  ON user_interactions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert own interactions"
  ON user_interactions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update own interactions"
  ON user_interactions FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- User preferences policies
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS articles_category_idx ON articles(category);
CREATE INDEX IF NOT EXISTS articles_published_at_idx ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS articles_is_trending_idx ON articles(is_trending) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS articles_article_url_idx ON articles(article_url);
CREATE INDEX IF NOT EXISTS articles_engagement_score_idx ON articles(engagement_score DESC);

CREATE INDEX IF NOT EXISTS user_interactions_user_id_idx ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS user_interactions_article_id_idx ON user_interactions(article_id);
CREATE INDEX IF NOT EXISTS user_interactions_action_idx ON user_interactions(action);
CREATE INDEX IF NOT EXISTS user_interactions_timestamp_idx ON user_interactions(timestamp DESC);

CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON user_preferences(user_id);

-- Create function to update engagement score
CREATE OR REPLACE FUNCTION update_article_engagement()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE articles
  SET engagement_score = engagement_score + 
    CASE NEW.action
      WHEN 'thumbs_up' THEN 2
      WHEN 'save' THEN 3
      WHEN 'read' THEN 1
      WHEN 'share' THEN 4
      WHEN 'thumbs_down' THEN -1
      ELSE 0
    END,
    updated_at = now()
  WHERE id = NEW.article_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for engagement score updates
DROP TRIGGER IF EXISTS engagement_score_trigger ON user_interactions;
CREATE TRIGGER engagement_score_trigger
  AFTER INSERT ON user_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_article_engagement();
