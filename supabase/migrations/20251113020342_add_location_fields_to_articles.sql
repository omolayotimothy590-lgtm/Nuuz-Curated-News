/*
  # Add Location Fields to Articles Table

  1. Changes
    - Add `city` column (text, nullable)
    - Add `state` column (text, nullable)
    - Add `state_code` column (varchar(2), nullable)
    - Add `zip_code` column (varchar(10), nullable)
    - Add index on city and state for faster queries
  
  2. Purpose
    - Store location data for local news articles
    - Enable efficient filtering by city/state
    - Support ZIP code-based article retrieval
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'city'
  ) THEN
    ALTER TABLE articles ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'state'
  ) THEN
    ALTER TABLE articles ADD COLUMN state text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'state_code'
  ) THEN
    ALTER TABLE articles ADD COLUMN state_code varchar(2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'zip_code'
  ) THEN
    ALTER TABLE articles ADD COLUMN zip_code varchar(10);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_articles_city ON articles(city);
CREATE INDEX IF NOT EXISTS idx_articles_state ON articles(state);
CREATE INDEX IF NOT EXISTS idx_articles_zip_code ON articles(zip_code);
