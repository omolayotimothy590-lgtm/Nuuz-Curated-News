/*
  # Add Auto-Cleanup for Image Cache

  1. Purpose
    - Automatically retry scraping for articles with NULL images after 7 days
    - This handles cases where images are added to articles later
    - Prevents permanent NULL caching for articles that may get images

  2. Implementation
    - Creates a function to delete old NULL image cache entries
    - Schedules automatic cleanup (can be triggered manually or via cron)

  3. Notes
    - Only removes NULL entries older than 7 days
    - Keeps successful image scrapes indefinitely
    - Next scrape attempt will try to find images again
*/

CREATE OR REPLACE FUNCTION cleanup_old_null_image_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM scraped_images
  WHERE image_url IS NULL
  AND created_at < NOW() - INTERVAL '7 days';
END;
$$;

COMMENT ON FUNCTION cleanup_old_null_image_cache() IS 'Removes NULL image cache entries older than 7 days to allow retry';