/*
  # Add Composite Index for Fast Category Queries

  1. Performance
    - Add composite index on (category, published_at DESC) for faster filtered queries
    - This will significantly speed up queries that filter by category and order by published_at
*/

CREATE INDEX IF NOT EXISTS idx_articles_category_published 
ON articles (category, published_at DESC);
