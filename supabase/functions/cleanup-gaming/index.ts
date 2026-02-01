import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ALLOWED_GAMING_SOURCES = [
  'kotaku', 'nintendo life', 'polygon', 'rock paper shotgun',
  'vg247', 'gamespot', 'ign', 'pc gamer', 'eurogamer',
  'destructoid', 'gamesradar', 'game informer', 'gamerant',
  'xbox news', 'reddit gaming'
];

const BLOCKED_SOURCES_FROM_GAMING = [
  'ny times', 'new york times', 'yahoo sports', 'espn', 'cbs sports',
  'fox sports', 'nbc sports', 'sports illustrated', 'bleacher report',
  'bbc sport', 'sky sports', 'the athletic', 'reuters', 'bloomberg',
  'cnbc', 'forbes', 'wall street journal', 'washington post', 'cnn',
  'bbc news', 'deadline', 'variety', 'hollywood reporter'
];

function isValidGamingSource(source: string): boolean {
  const lowerSource = source.toLowerCase();

  if (BLOCKED_SOURCES_FROM_GAMING.some(blocked => lowerSource.includes(blocked))) {
    return false;
  }

  return ALLOWED_GAMING_SOURCES.some(allowed => lowerSource.includes(allowed));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: gamingArticles, error: fetchError } = await supabase
      .from("articles")
      .select("id, source, title")
      .eq("category", "gaming");

    if (fetchError) {
      throw fetchError;
    }

    if (!gamingArticles || gamingArticles.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No gaming articles found",
          deleted: 0,
          kept: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const toDelete: string[] = [];
    const toKeep: string[] = [];
    const deletedSources: Record<string, number> = {};

    for (const article of gamingArticles) {
      if (isValidGamingSource(article.source)) {
        toKeep.push(article.id);
      } else {
        toDelete.push(article.id);
        deletedSources[article.source] = (deletedSources[article.source] || 0) + 1;
      }
    }

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("articles")
        .delete()
        .in("id", toDelete);

      if (deleteError) {
        throw deleteError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleanup complete`,
        deleted: toDelete.length,
        kept: toKeep.length,
        deletedSources,
        total: gamingArticles.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cleanup error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
