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
    const query = url.searchParams.get("query") || url.searchParams.get("q");
    const category = url.searchParams.get("category");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    
    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: "Search query required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const searchTerm = `%${query.toLowerCase()}%`;
    
    let dbQuery = supabase
      .from("articles")
      .select("*")
      .is("city", null)
      .or(`title.ilike.${searchTerm},summary.ilike.${searchTerm},full_content.ilike.${searchTerm}`)
      .order("published_at", { ascending: false })
      .limit(limit);
    
    if (category) {
      dbQuery = dbQuery.eq("category", category);
    }
    
    const { data: articles, error } = await dbQuery;
    
    if (error) {
      throw error;
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        articles: articles || [],
        total: articles?.length || 0,
        query,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Search error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});