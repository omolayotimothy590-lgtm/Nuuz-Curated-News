/*
  # Remove Unused Database Indexes

  ## Changes
  This migration removes indexes that are not being used by any queries,
  which helps improve write performance and reduce storage overhead.

  ## Indexes Removed
  1. `idx_ai_conversations_article_id` - Not used in query patterns
  2. `idx_comments_user_id` - Not used in query patterns
  3. `idx_comment_likes_user_id` - Not used in query patterns

  ## Notes
  - These indexes were identified as unused by database monitoring
  - If query patterns change in the future, indexes can be recreated
  - This improves INSERT/UPDATE/DELETE performance on affected tables
*/

-- Drop unused index on ai_conversations
DROP INDEX IF EXISTS public.idx_ai_conversations_article_id;

-- Drop unused index on comments
DROP INDEX IF EXISTS public.idx_comments_user_id;

-- Drop unused index on comment_likes
DROP INDEX IF EXISTS public.idx_comment_likes_user_id;
