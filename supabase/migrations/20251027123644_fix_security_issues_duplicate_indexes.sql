/*
  # Fix Security Issues - Part 3: Remove Duplicate Indexes

  1. Changes
    - Remove duplicate indexes that waste storage and slow down writes
    - Keep the most descriptive index name in each case
    
  2. Duplicates Removed
    - article_reader_cache: Drop idx_article_reader_cache_url (duplicate of constraint-backed index)
    - articles: Drop articles_published_at_idx, keep idx_articles_published_at
    
  3. Performance Impact
    - Reduces storage overhead
    - Improves INSERT/UPDATE/DELETE performance
    - Maintains all query optimization benefits
    
  4. Notes
    - article_reader_cache_article_url_key is a UNIQUE constraint, so we keep it
    - Only drop the redundant idx_article_reader_cache_url index
*/

-- Remove duplicate index on article_reader_cache.article_url
-- Keep article_reader_cache_article_url_key as it's a unique constraint
DROP INDEX IF EXISTS idx_article_reader_cache_url;

-- Remove duplicate index on articles.published_at
-- Keep idx_articles_published_at as it's more descriptive
DROP INDEX IF EXISTS articles_published_at_idx;