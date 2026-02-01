import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    const url = new URL(req.url);
    const articleUrl = url.searchParams.get("url");

    if (!articleUrl) {
      return new Response(
        JSON.stringify({ error: "URL parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: cached, error: cacheError } = await supabase
      .from('scraped_images')
      .select('image_url, created_at')
      .eq('article_url', articleUrl)
      .maybeSingle();

    if (cached && !cacheError) {
      const cacheAge = Date.now() - new Date(cached.created_at).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      if (cached.image_url !== null || cacheAge < sevenDays) {
        return new Response(
          JSON.stringify({ image: cached.image_url, success: true, cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const response = await fetch(articleUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NuunzBot/1.0; +https://nuunz.app)",
      },
    });

    if (!response.ok) {
      await supabase
        .from('scraped_images')
        .upsert({
          article_url: articleUrl,
          image_url: null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'article_url'
        });

      return new Response(
        JSON.stringify({ image: null, success: true, cached: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();

    let imageUrl = null;

    const ogImagePatterns = [
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
      /<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i,
      /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
      /<meta\s+content=["']([^"']+)["']\s+name=["']twitter:image["']/i,
    ];

    const isGenericLogo = (url: string): boolean => {
      const lowerUrl = url.toLowerCase();
      return (
        lowerUrl.includes('default_logo') ||
        lowerUrl.includes('yahoo_default_logo') ||
        lowerUrl.includes('/logo.') ||
        lowerUrl.includes('icon.') ||
        lowerUrl.includes('avatar') ||
        lowerUrl.includes('yahoo.com/assets/logo') ||
        lowerUrl.includes('badge') ||
        lowerUrl.includes('default-image') ||
        lowerUrl.includes('placeholder')
      );
    };

    for (const pattern of ogImagePatterns) {
      const match = html.match(pattern);
      if (match && match[1] && !isGenericLogo(match[1])) {
        imageUrl = match[1];
        break;
      }
    }

    if (!imageUrl) {
      const imgPatterns = [
        /<img[^>]+class=["'][^"']*featured[^"']*["'][^>]+src=["']([^"']+)["']/i,
        /<img[^>]+src=["']([^"']+)["'][^>]+class=["'][^"']*featured[^"']*["']/i,
        /<figure[^>]*>\s*<img[^>]+src=["']([^"']+)["']/i,
        /<img[^>]+src=["']([^"']+)["'][^>]*width=["'](\d+)["']/i,
      ];

      for (const pattern of imgPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const potentialUrl = match[1];
          if (
            potentialUrl.match(/\.(jpg|jpeg|png|webp)($|\?)/i) &&
            !isGenericLogo(potentialUrl)
          ) {
            imageUrl = potentialUrl;
            break;
          }
        }
      }
    }

    if (imageUrl && !imageUrl.startsWith('http')) {
      const baseUrl = new URL(articleUrl);
      if (imageUrl.startsWith('//')) {
        imageUrl = `${baseUrl.protocol}${imageUrl}`;
      } else if (imageUrl.startsWith('/')) {
        imageUrl = `${baseUrl.protocol}//${baseUrl.host}${imageUrl}`;
      } else {
        imageUrl = `${baseUrl.protocol}//${baseUrl.host}/${imageUrl}`;
      }
    }

    await supabase
      .from('scraped_images')
      .upsert({
        article_url: articleUrl,
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'article_url'
      });

    return new Response(
      JSON.stringify({ image: imageUrl, success: true, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Scraping error:", error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});