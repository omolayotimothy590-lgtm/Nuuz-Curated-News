import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Article {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  category: string;
  imageUrl?: string;
}

function parseRSSFeed(xmlText: string, sourceName: string, category: string, feedUrl: string): Article[] {
  const articles: Article[] = [];

  const isAtom = xmlText.includes('<feed') && xmlText.includes('xmlns="http://www.w3.org/2005/Atom"');

  if (isAtom) {
    const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
    const entries = xmlText.match(entryRegex) || [];

    for (const entry of entries) {
      const title = entry.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || 'No title';
      const linkMatch = entry.match(/<link[^>]*href=["']([^"']+)["']/i);
      const url = linkMatch?.[1] || '';

      const summary = entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1] ||
                     entry.match(/<content[^>]*>([\s\S]*?)<\/content>/i)?.[1] || '';
      const description = summary.replace(/<[^>]+>/g, '').trim().substring(0, 300);

      const published = entry.match(/<published[^>]*>([^<]+)<\/published>/i)?.[1] ||
                       entry.match(/<updated[^>]*>([^<]+)<\/updated>/i)?.[1] ||
                       new Date().toISOString();

      const imageMatch = entry.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i) ||
                        entry.match(/<media:content[^>]*url=["']([^"']+)["']/i) ||
                        summary.match(/<img[^>]+src=["']([^"']+)["']/i);
      const imageUrl = imageMatch?.[1] || undefined;

      if (url) {
        articles.push({
          title: title.trim(),
          description,
          url,
          publishedAt: published,
          source: sourceName,
          category,
          imageUrl
        });
      }
    }
  } else {
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    const items = xmlText.match(itemRegex) || [];

    for (const item of items) {
      const title = item.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/is)?.[1] || 'No title';
      const linkMatch = item.match(/<link[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/is);
      const url = linkMatch?.[1]?.trim() || '';

      const descMatch = item.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
      const contentMatch = item.match(/<content:encoded[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/i);
      const desc = contentMatch?.[1] || descMatch?.[1] || '';
      const description = desc.replace(/<[^>]+>/g, '').trim().substring(0, 300);

      const pubDate = item.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/i)?.[1] ||
                     item.match(/<dc:date[^>]*>([^<]+)<\/dc:date>/i)?.[1] ||
                     new Date().toISOString();

      const imageMatch = item.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i) ||
                        item.match(/<media:content[^>]*url=["']([^"']+)["']/i) ||
                        item.match(/<enclosure[^>]*type=["']image[^"']*["'][^>]*url=["']([^"']+)["']/i) ||
                        desc.match(/<img[^>]+src=["']([^"']+)["']/i);
      const imageUrl = imageMatch?.[1] || undefined;

      if (url) {
        articles.push({
          title: title.trim(),
          description,
          url,
          publishedAt: pubDate,
          source: sourceName,
          category,
          imageUrl
        });
      }
    }
  }

  return articles;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { url, name, category } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NuunzBot/1.0)",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to fetch feed: HTTP ${response.status}`
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();

    const isValidFeed = (text.includes("<rss") || text.includes("<feed")) &&
                       (text.includes("<item") || text.includes("<entry"));

    if (!isValidFeed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Not a valid RSS or Atom feed"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const feedCategory = category || "tech";
    const articles = parseRSSFeed(text, name || "Custom Source", feedCategory, url);

    console.log(`✅ Parsed ${articles.length} articles for category: ${feedCategory}`);
    console.log(`📂 First article category:`, articles[0]?.category);

    if (articles.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No articles found in this feed"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const titleMatch = text.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/is);
    const feedTitle = titleMatch?.[1]?.trim() || name || "Custom Source";

    return new Response(
      JSON.stringify({
        success: true,
        feedTitle,
        articleCount: articles.length,
        articles: articles.slice(0, 50),
        message: `Successfully validated! Found ${articles.length} articles.`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("RSS validation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to validate RSS feed"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
