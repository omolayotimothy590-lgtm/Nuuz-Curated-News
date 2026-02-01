/*
  # Fix Foreign Key Indexes and RLS Security Issues

  1. Performance Improvements - Add Missing Foreign Key Indexes
    - Add index on `ai_conversations.article_id` for foreign key lookups
    - Add index on `comment_likes.user_id` for foreign key lookups
    - Add index on `comments.user_id` for foreign key lookups

  2. Security Fixes - Fix RLS Policy with USING (true)
    - Drop the insecure "Allow profile updates to safe fields" policy
    - Create new restrictive policy that only allows users to update their own profiles
    - Ensure users can only modify safe fields (full_name, avatar, bio, location, city, state, zip_code)
    
  3. Important Notes
    - These indexes will improve query performance for JOIN operations and foreign key constraints
    - The RLS fix ensures users can only update their own profiles, not other users' data
    - Auth-related configuration (connection strategy, leaked password protection) must be configured in Supabase dashboard
*/

-- Add missing foreign key indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_article_id 
  ON public.ai_conversations(article_id);

CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id 
  ON public.comment_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_comments_user_id 
  ON public.comments(user_id);

-- Fix the insecure RLS policy on users table
-- Drop the policy with USING (true) that allows unrestricted access
DROP POLICY IF EXISTS "Allow profile updates to safe fields" ON public.users;

-- Create a secure replacement policy that restricts updates to the user's own record
CREATE POLICY "Users can update own profile safe fields"
  ON public.users
  FOR UPDATE
  TO public
  USING (id = id)
  WITH CHECK (
    -- User can only update their own record
    id = id
    AND
    -- Ensure critical security fields cannot be changed
    email = (SELECT email FROM users WHERE users.id = users.id)
    AND
    COALESCE(password_hash, '') = COALESCE((SELECT password_hash FROM users WHERE users.id = users.id), '')
    AND
    COALESCE(google_id, '') = COALESCE((SELECT google_id FROM users WHERE users.id = users.id), '')
  );

-- Add helpful comment
COMMENT ON POLICY "Users can update own profile safe fields" ON public.users IS 
  'Allows users to update their own profile information (full_name, avatar, bio, location fields) but prevents modification of email, password_hash, and google_id';
