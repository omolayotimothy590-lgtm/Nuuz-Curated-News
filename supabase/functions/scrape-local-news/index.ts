import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
  source?: { text: string };
}

function parseRSS(xmlText: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];
    
    const titleMatch = /<title><!\[CDATA\[([^\]]+)\]\]><\/title>/.exec(itemContent) || 
                      /<title>([^<]+)<\/title>/.exec(itemContent);
    const linkMatch = /<link>([^<]+)<\/link>/.exec(itemContent);
    const pubDateMatch = /<pubDate>([^<]+)<\/pubDate>/.exec(itemContent);
    const descMatch = /<description><!\[CDATA\[([^\]]+)\]\]><\/description>/.exec(itemContent) ||
                     /<description>([^<]+)<\/description>/.exec(itemContent);
    const sourceMatch = /<source[^>]*><!\[CDATA\[([^\]]+)\]\]><\/source>/.exec(itemContent) ||
                       /<source[^>]*>([^<]+)<\/source>/.exec(itemContent);

    if (titleMatch && linkMatch && pubDateMatch) {
      items.push({
        title: titleMatch[1],
        link: linkMatch[1],
        pubDate: pubDateMatch[1],
        description: descMatch?.[1] || '',
        source: sourceMatch ? { text: sourceMatch[1] } : undefined,
      });
    }
  }

  return items;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&hellip;/g, '...')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractDirectUrl(googleNewsUrl: string): string {
  try {
    const url = new URL(googleNewsUrl);
    if (url.hostname === 'news.google.com' && url.pathname.includes('/rss/articles/')) {
      return googleNewsUrl;
    }
    return googleNewsUrl;
  } catch {
    return googleNewsUrl;
  }
}

function extractSourceFromDescription(description: string): string | null {
  if (!description) return null;

  const fontMatch = /<font[^>]*>([^<]+)<\/font>/i.exec(description);
  if (fontMatch && fontMatch[1]) {
    return fontMatch[1].trim();
  }

  const afterLinkMatch = /<\/a>\s*(.+?)$/i.exec(description);
  if (afterLinkMatch && afterLinkMatch[1]) {
    return stripHtml(afterLinkMatch[1]).trim();
  }

  return null;
}

function extractImageUrl(description: string): string | null {
  const imgMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(description);
  if (imgMatch) {
    return imgMatch[1];
  }
  return null;
}

function estimateReadTime(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { zip_code, city, state } = await req.json();

    if (!city || !state) {
      return new Response(
        JSON.stringify({ success: false, error: 'city and state are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Scraping local news for: ${city}, ${state}`);

    const query = `${city} ${state}`;
    const encodedQuery = encodeURIComponent(query);
    const googleNewsUrl = `https://news.google.com/rss/search?q=${encodedQuery}+when:7d&hl=en-US&gl=US&ceid=US:en`;

    console.log(`Fetching from: ${googleNewsUrl}`);

    const response = await fetch(googleNewsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Google News RSS: ${response.status}`);
    }

    const xmlText = await response.text();
    const items = parseRSS(xmlText);

    console.log(`Found ${items.length} articles`);

    let insertedCount = 0;
    let skippedCount = 0;

    for (const item of items.slice(0, 30)) {
      try {
        const cleanUrl = extractDirectUrl(item.link);

        const { data: existing } = await supabase
          .from('articles')
          .select('id')
          .eq('article_url', cleanUrl)
          .maybeSingle();

        if (existing) {
          skippedCount++;
          continue;
        }

        const rawTitle = item.title;
        const rawDescription = item.description || '';

        let title = stripHtml(rawTitle);
        let source = 'Google News';

        const sourceFromDesc = extractSourceFromDescription(rawDescription);
        if (sourceFromDesc) {
          source = sourceFromDesc;
        } else if (item.source?.text) {
          source = stripHtml(item.source.text);
        } else if (title.includes(' - ')) {
          const parts = title.split(' - ');
          if (parts.length >= 2) {
            source = parts[parts.length - 1].trim();
            title = parts.slice(0, -1).join(' - ').trim();
          }
        }

        const imageUrl = extractImageUrl(rawDescription);
        const description = stripHtml(rawDescription);
        const summary = description.substring(0, 500);
        const readTime = estimateReadTime(description);

        const article = {
          title: title.substring(0, 500),
          summary: summary || title.substring(0, 300),
          full_content: description,
          source,
          category: 'local',
          image_url: imageUrl,
          article_url: cleanUrl,
          published_at: new Date(item.pubDate).toISOString(),
          read_time: readTime,
          is_trending: false,
          engagement_score: 0,
          city,
          state,
          zip_code,
        };

        const { error: insertError } = await supabase
          .from('articles')
          .insert(article);

        if (insertError) {
          console.error('Insert error:', insertError);
          continue;
        }

        insertedCount++;
      } catch (error) {
        console.error('Error processing article:', error);
        continue;
      }
    }

    console.log(`✅ Inserted: ${insertedCount}, Skipped: ${skippedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Scraped local news for ${city}, ${state}`,
        inserted: insertedCount,
        skipped: skippedCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in scrape-local-news:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});