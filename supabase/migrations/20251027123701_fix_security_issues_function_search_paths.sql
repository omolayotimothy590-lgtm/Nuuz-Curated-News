/*
  # Fix Security Issues - Part 4: Fix Function Search Paths

  1. Changes
    - Set immutable search_path on all functions to prevent security issues
    - Prevents search_path manipulation attacks
    - Ensures functions always reference the correct schema
    
  2. Functions Updated
    - update_comment_likes_count: Set search_path to empty
    - update_updated_at_column: Set search_path to empty
    - update_article_engagement: Set search_path to empty
    
  3. Security Impact
    - Prevents potential SQL injection via search_path manipulation
    - Ensures functions are called with consistent schema resolution
    - Follows PostgreSQL security best practices
*/

-- Fix update_comment_likes_count function
CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comments
    SET likes = likes + 1
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comments
    SET likes = GREATEST(0, likes - 1)
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix update_article_engagement function
CREATE OR REPLACE FUNCTION public.update_article_engagement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.articles
  SET engagement_score = engagement_score + 1
  WHERE id = NEW.article_id;
  RETURN NEW;
END;
$$;