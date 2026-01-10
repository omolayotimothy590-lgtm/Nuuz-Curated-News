/*
  # Fix Security Issues - Indexes

  ## Changes
  
  1. **Add Missing Index**
     - Add index on `ai_conversations.user_id` (foreign key without covering index)
     - Improves query performance for user-based conversation lookups
  
  2. **Remove Unused Indexes**
     - Drop `idx_ai_conversations_article_id` (unused)
     - Drop `idx_comment_likes_user_id` (unused)
     - Drop `idx_comments_user_id` (unused)
     - Reduces storage overhead and maintenance cost
  
  ## Performance Impact
  - Adding index on user_id improves join performance
  - Removing unused indexes reduces write overhead
  
  ## Note on Password Protection
  Leaked password protection must be enabled in Supabase Dashboard:
  1. Go to Authentication → Settings
  2. Enable "Password breach detection"
  This prevents users from using compromised passwords from HaveIBeenPwned.org
*/

-- Add missing index for foreign key
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);

-- Remove unused indexes
DROP INDEX IF EXISTS public.idx_ai_conversations_article_id;
DROP INDEX IF EXISTS public.idx_comment_likes_user_id;
DROP INDEX IF EXISTS public.idx_comments_user_id;
