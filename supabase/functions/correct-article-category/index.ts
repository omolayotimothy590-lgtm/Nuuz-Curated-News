import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const VALID_CATEGORIES = [
  'tech',
  'business',
  'sports',
  'entertainment',
  'health',
  'gaming',
  'crypto',
  'travel',
  'politics',
  'world',
  'general'
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { article_id, correct_category } = await req.json();

    if (!article_id || !correct_category) {
      return new Response(
        JSON.stringify({ success: false, error: "article_id and correct_category are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!VALID_CATEGORIES.includes(correct_category)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, token);

    const { data: article, error: fetchError } = await supabase
      .from("articles")
      .select("id, title, category")
      .eq("id", article_id)
      .single();

    if (fetchError || !article) {
      return new Response(
        JSON.stringify({ success: false, error: "Article not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const oldCategory = article.category;

    const { error: updateError } = await supabase
      .from("articles")
      .update({ category: correct_category })
      .eq("id", article_id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to update article category" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Category corrected: "${article.title.substring(0, 50)}..." | ${oldCategory} → ${correct_category}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Article recategorized from ${oldCategory} to ${correct_category}`,
        old_category: oldCategory,
        new_category: correct_category,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Category correction error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});