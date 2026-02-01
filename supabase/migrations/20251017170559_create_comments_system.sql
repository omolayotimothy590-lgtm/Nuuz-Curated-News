/*
  # Create Comments System

  ## Overview
  This migration creates a comprehensive comments system for articles in Nuunz.
  Users can post comments on articles, like comments, and view comment threads.

  ## New Tables
  
  ### `comments`
  - `id` (uuid, primary key) - Unique comment identifier
  - `article_url` (text, indexed) - URL of the article being commented on
  - `user_id` (uuid, nullable) - User who posted (null for anonymous)
  - `username` (text) - Display name (defaults to 'Anonymous')
  - `comment_text` (text) - The comment content
  - `likes` (integer, default 0) - Number of likes
  - `created_at` (timestamptz) - When comment was posted
  - `updated_at` (timestamptz) - Last update time

  ### `comment_likes`
  - `id` (uuid, primary key) - Unique like identifier
  - `comment_id` (uuid) - Comment being liked
  - `user_id` (uuid) - User who liked (null for anonymous sessions)
  - `session_id` (text) - Anonymous session identifier
  - `created_at` (timestamptz) - When like was created

  ## Security
  - Enable RLS on both tables
  - Allow anyone to read comments
  - Allow authenticated and anonymous users to post comments
  - Allow users to like comments once per comment
  - Prevent duplicate likes from same user/session

  ## Indexes
  - Index on article_url for fast comment retrieval
  - Index on comment_id for likes lookup
  - Unique constraint on comment_id + user_id/session_id for like uniqueness
*/

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_url text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  username text NOT NULL DEFAULT 'Anonymous',
  comment_text text NOT NULL CHECK (length(comment_text) > 0 AND length(comment_text) <= 500),
  likes integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create comment_likes table for tracking who liked what
CREATE TABLE IF NOT EXISTS comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id),
  UNIQUE(comment_id, session_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_article_url ON comments(article_url);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);

-- Enable Row Level Security
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Comments policies: Anyone can read
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO public
  USING (true);

-- Anyone can post comments (authenticated or anonymous)
CREATE POLICY "Anyone can post comments"
  ON comments FOR INSERT
  TO public
  WITH CHECK (true);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comment likes policies: Anyone can view likes
CREATE POLICY "Anyone can view comment likes"
  ON comment_likes FOR SELECT
  TO public
  USING (true);

-- Anyone can like comments (one like per user/session per comment)
CREATE POLICY "Anyone can like comments"
  ON comment_likes FOR INSERT
  TO public
  WITH CHECK (true);

-- Users can unlike (delete their own likes)
CREATE POLICY "Users can remove their likes"
  ON comment_likes FOR DELETE
  TO public
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    (session_id IS NOT NULL)
  );

-- Function to update comment like count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET likes = likes + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET likes = likes - 1 WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update like counts
DROP TRIGGER IF EXISTS trigger_update_comment_likes ON comment_likes;
CREATE TRIGGER trigger_update_comment_likes
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on comment updates
DROP TRIGGER IF EXISTS trigger_update_comments_updated_at ON comments;
CREATE TRIGGER trigger_update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();