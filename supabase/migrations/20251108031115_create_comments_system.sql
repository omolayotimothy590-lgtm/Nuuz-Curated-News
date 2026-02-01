/*
  # Create Comments System

  Creates comprehensive comments system with likes for articles
*/

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

CREATE TABLE IF NOT EXISTS comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id),
  UNIQUE(comment_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_comments_article_url ON comments(article_url);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON comments FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can post comments" ON comments FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view comment likes" ON comment_likes FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can like comments" ON comment_likes FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users can remove their likes" ON comment_likes FOR DELETE TO public USING ((auth.uid() IS NOT NULL AND auth.uid() = user_id) OR (session_id IS NOT NULL));

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_comment_likes ON comment_likes;
CREATE TRIGGER trigger_update_comment_likes AFTER INSERT OR DELETE ON comment_likes FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_comments_updated_at ON comments;
CREATE TRIGGER trigger_update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
