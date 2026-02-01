/*
  # Create Article Reader Cache Table

  1. New Tables
    - `article_reader_cache`
      - `id` (uuid, primary key)
      - `article_url` (text, unique) - Original article URL
      - `parsed_content` (text) - Cleaned article HTML content
      - `title` (text) - Extracted article title
      - `author` (text) - Article author if available
      - `published_date` (text) - Publication date if available
      - `excerpt` (text) - Article excerpt
      - `word_count` (integer) - Word count for read time
      - `created_at` (timestamptz) - When cached
      - `last_accessed` (timestamptz) - Last time accessed
      - `access_count` (integer) - Number of times accessed
  
  2. Security
    - Enable RLS on `article_reader_cache` table
    - Allow all authenticated and anonymous users to read cached articles
    - Only service role can insert/update cache entries
  
  3. Performance
    - Add unique index on article_url for fast lookups
    - Add index on last_accessed for cleanup queries
*/

CREATE TABLE IF NOT EXISTS article_reader_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_url text UNIQUE NOT NULL,
  parsed_content text NOT NULL,
  title text,
  author text,
  published_date text,
  excerpt text,
  word_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  last_accessed timestamptz DEFAULT now(),
  access_count integer DEFAULT 0
);

ALTER TABLE article_reader_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached articles"
  ON article_reader_cache FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can insert cached articles"
  ON article_reader_cache FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update cached articles"
  ON article_reader_cache FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE UNIQUE INDEX IF NOT EXISTS idx_article_reader_cache_url ON article_reader_cache(article_url);
CREATE INDEX IF NOT EXISTS idx_article_reader_cache_last_accessed ON article_reader_cache(last_accessed);
