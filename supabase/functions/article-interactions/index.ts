import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InteractionRequest {
  user_id: string;
  article_id: string;
  action: "thumbs_up" | "thumbs_down" | "save" | "read" | "share";
}

const ACTION_WEIGHTS: Record<string, number> = {
  thumbs_up: 1.0,
  save: 0.8,
  read: 0.5,
  share: 0.7,
  thumbs_down: -1.0,
};

async function updateUserPreferences(
  supabase: any,
  userId: string,
  articleId: string,
  action: string
) {
  const { data: article } = await supabase
    .from("articles")
    .select("category, source")
    .eq("id", articleId)
    .single();
  
  if (!article) return;
  
  const { data: existingPrefs } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  
  const weight = ACTION_WEIGHTS[action] || 0;
  
  let categoryScores = existingPrefs?.category_scores || {};
  let sourceScores = existingPrefs?.source_scores || {};
  
  categoryScores[article.category] = (categoryScores[article.category] || 0) + weight;
  sourceScores[article.source] = (sourceScores[article.source] || 0) + weight;
  
  if (existingPrefs) {
    await supabase
      .from("user_preferences")
      .update({
        category_scores: categoryScores,
        source_scores: sourceScores,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
  } else {
    await supabase
      .from("user_preferences")
      .insert({
        user_id: userId,
        category_scores: categoryScores,
        source_scores: sourceScores,
      });
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (req.method === "POST") {
      const { user_id, article_id, action }: InteractionRequest = await req.json();
      
      if (!user_id || !article_id || !action) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const { error: interactionError } = await supabase
        .from("user_interactions")
        .insert({
          user_id,
          article_id,
          action,
          timestamp: new Date().toISOString(),
        });
      
      if (interactionError) {
        throw interactionError;
      }
      
      await updateUserPreferences(supabase, user_id, article_id, action);
      
      return new Response(
        JSON.stringify({ success: true, message: "Interaction recorded" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (req.method === "GET") {
      const url = new URL(req.url);
      const userId = url.searchParams.get("user_id");
      const action = url.searchParams.get("action");
      
      if (!userId) {
        return new Response(
          JSON.stringify({ success: false, error: "user_id required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      let query = supabase
        .from("user_interactions")
        .select(`
          *,
          articles (*)
        `)
        .eq("user_id", userId)
        .order("timestamp", { ascending: false })
        .limit(100);
      
      if (action) {
        query = query.eq("action", action);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return new Response(
        JSON.stringify({
          success: true,
          interactions: data || [],
          total: data?.length || 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Interaction error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});