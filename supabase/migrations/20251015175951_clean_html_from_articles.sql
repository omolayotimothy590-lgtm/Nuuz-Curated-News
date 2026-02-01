/*
  # Clean HTML from Articles

  1. Purpose
    - Remove HTML tags and entities from existing article titles and summaries
    - Clean up Google News redirect URLs and formatting
    - Ensure all articles display properly in the frontend
  
  2. Changes
    - Strip HTML tags from title and summary fields
    - Decode HTML entities
    - Clean up whitespace
*/

DO $$
DECLARE
  article_record RECORD;
  clean_title TEXT;
  clean_summary TEXT;
BEGIN
  FOR article_record IN 
    SELECT id, title, summary 
    FROM articles 
    WHERE title LIKE '%<a href=%' 
       OR title LIKE '%<font%'
       OR summary LIKE '%<a href=%'
       OR summary LIKE '%<font%'
  LOOP
    clean_title := article_record.title;
    clean_summary := article_record.summary;
    
    -- Remove all HTML tags
    clean_title := regexp_replace(clean_title, '<[^>]*>', '', 'g');
    clean_summary := regexp_replace(clean_summary, '<[^>]*>', '', 'g');
    
    -- Decode HTML entities
    clean_title := replace(clean_title, '&nbsp;', ' ');
    clean_title := replace(clean_title, '&quot;', '"');
    clean_title := replace(clean_title, '&apos;', '''');
    clean_title := replace(clean_title, '&amp;', '&');
    clean_title := replace(clean_title, '&lt;', '<');
    clean_title := replace(clean_title, '&gt;', '>');
    clean_title := replace(clean_title, '&#39;', '''');
    
    clean_summary := replace(clean_summary, '&nbsp;', ' ');
    clean_summary := replace(clean_summary, '&quot;', '"');
    clean_summary := replace(clean_summary, '&apos;', '''');
    clean_summary := replace(clean_summary, '&amp;', '&');
    clean_summary := replace(clean_summary, '&lt;', '<');
    clean_summary := replace(clean_summary, '&gt;', '>');
    clean_summary := replace(clean_summary, '&#39;', '''');
    
    -- Clean up whitespace
    clean_title := regexp_replace(clean_title, '\s+', ' ', 'g');
    clean_title := trim(clean_title);
    clean_summary := regexp_replace(clean_summary, '\s+', ' ', 'g');
    clean_summary := trim(clean_summary);
    
    -- Update the record
    UPDATE articles 
    SET 
      title = clean_title,
      summary = clean_summary
    WHERE id = article_record.id;
  END LOOP;
END $$;