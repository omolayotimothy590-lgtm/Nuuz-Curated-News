/*
  # Fix Security Issues - Part 1: Foreign Key Indexes

  1. Changes
    - Add missing indexes for foreign keys to improve query performance:
      - `ai_conversations.article_id`
      - `comment_likes.user_id`
      - `comments.user_id`

  2. Performance Impact
    - Dramatically improves JOIN performance on foreign key columns
    - Reduces query execution time for lookups involving these relationships
    - Essential for maintaining performance as data grows
*/

-- Add index for ai_conversations.article_id foreign key
CREATE INDEX IF NOT EXISTS idx_ai_conversations_article_id 
ON ai_conversations(article_id);

-- Add index for comment_likes.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id 
ON comment_likes(user_id);

-- Add index for comments.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_comments_user_id 
ON comments(user_id);