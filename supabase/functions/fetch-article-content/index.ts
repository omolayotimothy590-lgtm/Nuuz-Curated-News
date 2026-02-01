import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log('📥 Received request:', req.method);

    let body;
    try {
      body = await req.json();
      console.log('📦 Request body:', body);
    } catch (jsonError) {
      console.error('❌ JSON parse error:', jsonError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = body?.url;
    console.log('🔗 Article URL:', url);

    if (!url) {
      console.error('❌ No URL provided in request');
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.status}`);
    }

    const html = await response.text();
    const parsed = parseArticle(html);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          title: parsed.title,
          content: parsed.content,
          author: parsed.author,
          publishedDate: parsed.publishedDate,
          excerpt: parsed.excerpt,
          wordCount: parsed.wordCount
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error fetching article:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to fetch article content"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function parseArticle(html: string) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;

  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  const excerpt = metaDescMatch?.[1] || ogDescMatch?.[1] || null;

  const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);
  const ogAuthorMatch = html.match(/<meta[^>]*property=["']article:author["'][^>]*content=["']([^"']+)["']/i);
  const author = authorMatch?.[1] || ogAuthorMatch?.[1] || null;

  const dateMatch = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i);
  const publishedDate = dateMatch?.[1] || null;

  let content = html;

  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  content = content.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  content = content.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
  content = content.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  content = content.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');

  const articleMatches = [
    content.match(/<article[^>]*>([\s\S]*?)<\/article>/i),
    content.match(/<div[^>]*class=["'][^"']*article[^"']*["'][^>]*>([\s\S]*?)<\/div>/i),
    content.match(/<div[^>]*class=["'][^"']*post-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i),
    content.match(/<div[^>]*class=["'][^"']*entry-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i),
    content.match(/<main[^>]*>([\s\S]*?)<\/main>/i),
  ];

  let articleContent = '';
  for (const match of articleMatches) {
    if (match && match[1]) {
      articleContent = match[1];
      break;
    }
  }

  if (!articleContent) {
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    articleContent = bodyMatch?.[1] || content;
  }

  articleContent = articleContent.replace(/<[^>]+>/g, ' ');
  articleContent = articleContent.replace(/\s+/g, ' ');
  articleContent = articleContent.replace(/&nbsp;/g, ' ');
  articleContent = articleContent.replace(/&amp;/g, '&');
  articleContent = articleContent.replace(/&lt;/g, '<');
  articleContent = articleContent.replace(/&gt;/g, '>');
  articleContent = articleContent.replace(/&quot;/g, '"');
  articleContent = articleContent.replace(/&#39;/g, "'");
  articleContent = articleContent.trim();

  const paragraphs = articleContent.split(/\.\s+/).filter(p => p.length > 50);
  const cleanedContent = paragraphs.slice(0, 30).join('. ') + (paragraphs.length > 30 ? '.' : '');

  const wordCount = cleanedContent.split(/\s+/).filter(w => w.length > 0).length;

  return {
    title,
    content: cleanedContent || excerpt || 'Content could not be extracted',
    author,
    publishedDate,
    excerpt,
    wordCount
  };
}