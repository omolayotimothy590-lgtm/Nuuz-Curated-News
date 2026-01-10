/*
  # Add Performance Indexes for Articles Query Optimization

  1. Indexes Added
    - Index on published_at (descending) for faster time-based ordering
    - Composite index on (category, published_at) for category filtering
    - Composite index on (city, published_at) for local news queries

  2. Performance Benefits
    - Faster discover feed queries
    - Faster category-specific feeds
    - Faster local news retrieval
    - Improved sorting performance
*/

-- Add index on published_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_articles_published_at 
ON articles(published_at DESC);

-- Add composite index for category + published_at queries
CREATE INDEX IF NOT EXISTS idx_articles_category_published 
ON articles(category, published_at DESC);

-- Add composite index for city + published_at queries (local news)
CREATE INDEX IF NOT EXISTS idx_articles_city_published 
ON articles(city, published_at DESC) 
WHERE city IS NOT NULL;