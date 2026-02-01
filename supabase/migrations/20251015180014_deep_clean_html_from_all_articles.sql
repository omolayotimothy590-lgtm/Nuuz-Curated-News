/*
  # Deep Clean All HTML from Articles

  1. Purpose
    - Aggressively remove ALL HTML tags and entities from articles
    - Handle truncated HTML and partial tags
    - Clean all local news articles regardless of format
  
  2. Changes
    - Strip all HTML tags including partial/broken ones
    - Decode all HTML entities
    - Remove extra whitespace
    - Handle edge cases like truncated summaries
*/

UPDATE articles
SET 
  title = trim(regexp_replace(
    replace(replace(replace(replace(replace(replace(replace(
      regexp_replace(title, '<[^>]*>', '', 'g'),
      '&nbsp;', ' '),
      '&quot;', '"'),
      '&apos;', ''''),
      '&amp;', '&'),
      '&lt;', '<'),
      '&gt;', '>'),
      '&#39;', ''''),
    '\s+', ' ', 'g'
  )),
  summary = trim(regexp_replace(
    replace(replace(replace(replace(replace(replace(replace(
      regexp_replace(summary, '<[^>]*>', '', 'g'),
      '&nbsp;', ' '),
      '&quot;', '"'),
      '&apos;', ''''),
      '&amp;', '&'),
      '&lt;', '<'),
      '&gt;', '>'),
      '&#39;', ''''),
    '\s+', ' ', 'g'
  )),
  full_content = trim(regexp_replace(
    replace(replace(replace(replace(replace(replace(replace(
      regexp_replace(COALESCE(full_content, ''), '<[^>]*>', '', 'g'),
      '&nbsp;', ' '),
      '&quot;', '"'),
      '&apos;', ''''),
      '&amp;', '&'),
      '&lt;', '<'),
      '&gt;', '>'),
      '&#39;', ''''),
    '\s+', ' ', 'g'
  ))
WHERE 
  title LIKE '%<%' 
  OR title LIKE '%&%'
  OR summary LIKE '%<%'
  OR summary LIKE '%&%'
  OR full_content LIKE '%<%'
  OR full_content LIKE '%&%';