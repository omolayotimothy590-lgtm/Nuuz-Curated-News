import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const hours = parseInt(url.searchParams.get("hours") || "24");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const timeAgo = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data: articles, error } = await supabase
      .from("articles")
      .select("category, created_at")
      .gte("created_at", timeAgo);

    if (error) {
      console.error("Error fetching articles:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch category stats" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const categoryCounts: Record<string, number> = {};
    for (const article of articles || []) {
      const category = article.category || 'uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }

    const stats = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const total = articles?.length || 0;

    return new Response(
      JSON.stringify({
        success: true,
        hours,
        total_articles: total,
        categories: stats,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Category stats error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});