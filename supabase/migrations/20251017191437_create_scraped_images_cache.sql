/*
  # Create Scraped Images Cache Table

  1. New Tables
    - `scraped_images`
      - `id` (uuid, primary key)
      - `article_url` (text, unique) - The article URL
      - `image_url` (text) - The scraped image URL
      - `created_at` (timestamptz) - When the image was scraped
      - `updated_at` (timestamptz) - Last update time
  
  2. Security
    - Enable RLS on `scraped_images` table
    - Add policy for public read access (since anyone can view images)
    - Only service role can write (handled by edge function)
  
  3. Performance
    - Add unique index on article_url for fast lookups
    - Add index on created_at for cache cleanup queries
*/

CREATE TABLE IF NOT EXISTS scraped_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_url text UNIQUE NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE scraped_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read scraped images"
  ON scraped_images FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can insert scraped images"
  ON scraped_images FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update scraped images"
  ON scraped_images FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_scraped_images_article_url ON scraped_images(article_url);
CREATE INDEX IF NOT EXISTS idx_scraped_images_created_at ON scraped_images(created_at);
