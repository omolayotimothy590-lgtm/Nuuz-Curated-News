/*
  # Fix Security Issues - Part 2: Optimize RLS Policies

  1. Changes
    - Replace all `auth.uid()` calls with `(select auth.uid())` in RLS policies
    - This prevents re-evaluation of auth.uid() for each row
    - Dramatically improves query performance at scale
    
  2. Tables Updated
    - user_settings: 3 policies optimized
    - ai_conversations: 3 policies optimized
    - comments: 2 policies optimized
    - comment_likes: 1 policy optimized
    - custom_sources: 4 policies optimized
    
  3. Performance Impact
    - Auth function is called once per query instead of once per row
    - Reduces CPU usage and query execution time
    - Essential for performance with large datasets
*/

-- user_settings policies
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ai_conversations policies
DROP POLICY IF EXISTS "Users can read own conversations" ON ai_conversations;
CREATE POLICY "Users can read own conversations"
  ON ai_conversations FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own conversations" ON ai_conversations;
CREATE POLICY "Users can create own conversations"
  ON ai_conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own conversations" ON ai_conversations;
CREATE POLICY "Users can delete own conversations"
  ON ai_conversations FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- comments policies
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- comment_likes policies
DROP POLICY IF EXISTS "Users can remove their likes" ON comment_likes;
CREATE POLICY "Users can remove their likes"
  ON comment_likes FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- custom_sources policies
DROP POLICY IF EXISTS "Users can read own custom sources" ON custom_sources;
CREATE POLICY "Users can read own custom sources"
  ON custom_sources FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own custom sources" ON custom_sources;
CREATE POLICY "Users can insert own custom sources"
  ON custom_sources FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own custom sources" ON custom_sources;
CREATE POLICY "Users can update own custom sources"
  ON custom_sources FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own custom sources" ON custom_sources;
CREATE POLICY "Users can delete own custom sources"
  ON custom_sources FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));