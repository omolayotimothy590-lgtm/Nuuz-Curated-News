/*
  # Fix Security Issues - Part 5: Remove Unused Indexes

  1. Changes
    - Remove indexes that are not being used by queries
    - Reduces storage overhead and improves write performance
    
  2. Indexes Removed
    - idx_comments_created_at
    - idx_comment_likes_comment_id
    - articles_is_trending_idx
    - articles_engagement_score_idx
    - user_interactions_timestamp_idx
    - idx_articles_state
    - idx_articles_zip_code
    - idx_scraped_images_created_at
    - idx_ai_conversations_user_article
    - idx_ai_conversations_created_at
    - idx_custom_sources_category
    - idx_custom_sources_enabled
    - idx_articles_city_published
    - idx_article_reader_cache_last_accessed
    
  3. Performance Impact
    - Reduces storage usage
    - Improves INSERT/UPDATE/DELETE speed
    - Can be recreated later if query patterns change
    
  4. Notes
    - These indexes were identified as unused by Supabase analysis
    - If queries start using these columns, indexes can be added back
*/

-- Remove unused indexes
DROP INDEX IF EXISTS idx_comments_created_at;
DROP INDEX IF EXISTS idx_comment_likes_comment_id;
DROP INDEX IF EXISTS articles_is_trending_idx;
DROP INDEX IF EXISTS articles_engagement_score_idx;
DROP INDEX IF EXISTS user_interactions_timestamp_idx;
DROP INDEX IF EXISTS idx_articles_state;
DROP INDEX IF EXISTS idx_articles_zip_code;
DROP INDEX IF EXISTS idx_scraped_images_created_at;
DROP INDEX IF EXISTS idx_ai_conversations_user_article;
DROP INDEX IF EXISTS idx_ai_conversations_created_at;
DROP INDEX IF EXISTS idx_custom_sources_category;
DROP INDEX IF EXISTS idx_custom_sources_enabled;
DROP INDEX IF EXISTS idx_articles_city_published;
DROP INDEX IF EXISTS idx_article_reader_cache_last_accessed;