/*
  # Fix Remaining Security Issues

  ## 1. Missing Foreign Key Indexes
  Adds covering indexes for foreign keys:
  - ai_conversations.article_id
  - comment_likes.user_id  
  - comments.user_id

  ## 2. Unused Index Cleanup
  Removes 12 unused indexes

  ## 3. Function Security Fixes
  Fixes search_path in trigger functions

  ## 4. Service Policy Role Fixes
  Changes service policies from 'public' role to 'service_role':
  - stripe_customers service policies
  - stripe_subscriptions service policies
  - user_settings service policies

  ## Notes
  Most RLS policies already optimized with (select auth.uid()) pattern.
  Manual actions still required for Auth settings (see migration notes).
*/

-- ============================================================================
-- SECTION 1: ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ai_conversations_article_id 
ON ai_conversations(article_id);

CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id 
ON comment_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_comments_user_id 
ON comments(user_id);

-- ============================================================================
-- SECTION 2: DROP UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_ai_conversations_created_at;
DROP INDEX IF EXISTS user_interactions_timestamp_idx;
DROP INDEX IF EXISTS user_interactions_user_id_idx;
DROP INDEX IF EXISTS idx_comments_created_at;
DROP INDEX IF EXISTS idx_comment_likes_comment_id;
DROP INDEX IF EXISTS user_settings_created_at_idx;
DROP INDEX IF EXISTS idx_custom_sources_category;
DROP INDEX IF EXISTS idx_custom_sources_enabled;
DROP INDEX IF EXISTS idx_articles_state;
DROP INDEX IF EXISTS idx_articles_zip_code;
DROP INDEX IF EXISTS articles_is_trending_idx;
DROP INDEX IF EXISTS articles_article_url_idx;

-- ============================================================================
-- SECTION 3: FIX FUNCTION SEARCH PATHS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_ads_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- SECTION 4: FIX SERVICE POLICIES - STRIPE_CUSTOMERS
-- ============================================================================

-- Drop existing service policy with wrong role
DROP POLICY IF EXISTS "Service can insert customer records" ON stripe_customers;

-- Recreate for service_role instead of public
CREATE POLICY "Service can insert customer records"
ON stripe_customers FOR INSERT
TO service_role
WITH CHECK (true);

-- ============================================================================
-- SECTION 5: FIX SERVICE POLICIES - STRIPE_SUBSCRIPTIONS
-- ============================================================================

DROP POLICY IF EXISTS "Service can insert subscription records" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Service can update subscription records" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Service can delete subscription records" ON stripe_subscriptions;

-- Recreate for service_role instead of public
CREATE POLICY "Service can insert subscription records"
ON stripe_subscriptions FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service can update subscription records"
ON stripe_subscriptions FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service can delete subscription records"
ON stripe_subscriptions FOR DELETE
TO service_role
USING (true);

-- ============================================================================
-- SECTION 6: FIX SERVICE POLICIES - USER_SETTINGS
-- ============================================================================

DROP POLICY IF EXISTS "Service can insert user settings" ON user_settings;
DROP POLICY IF EXISTS "Service can update user settings" ON user_settings;

-- Recreate for service_role instead of public
CREATE POLICY "Service can insert user settings"
ON user_settings FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service can update user settings"
ON user_settings FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);
