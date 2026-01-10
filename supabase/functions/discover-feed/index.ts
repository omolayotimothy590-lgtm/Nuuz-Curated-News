import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

interface Article {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  image_url: string;
  published_at: string;
  read_time: number;
  is_trending: boolean;
  engagement_score: number;
}

interface UserPreferences {
  category_scores: Record<string, number>;
  source_scores: Record<string, number>;
}

function scoreArticle(
  article: Article,
  preferences?: UserPreferences
): number {
  let score = 0;
  
  if (preferences) {
    const categoryScore = preferences.category_scores?.[article.category] || 0;
    const sourceScore = preferences.source_scores?.[article.source] || 0;
    
    score += categoryScore * 2;
    score += sourceScore * 1;
  }
  
  if (article.is_trending) {
    score += 0.5;
  }
  
  score += article.engagement_score * 0.1;
  
  const hoursOld = (Date.now() - new Date(article.published_at).getTime()) / (1000 * 60 * 60);
  const recencyScore = Math.max(0, 10 - hoursOld / 24);
  score += recencyScore;
  
  return score;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const category = url.searchParams.get("category");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const fetchLimit = category === 'gaming' ? Math.min(limit * 3, 100) : limit;

    let query = supabase
      .from("articles")
      .select("*")
      .is("city", null)
      .order("published_at", { ascending: false })
      .limit(fetchLimit);

    if (category) {
      query = query.eq("category", category);
    }
    
    const { data: articles, error: articlesError } = await query;
    
    if (articlesError) {
      throw articlesError;
    }
    
    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, articles: [], total: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let filteredArticles = articles;

    if (category === 'gaming') {
      filteredArticles = articles.filter((article: Article) =>
        isValidGamingSource(article.source)
      );
    }

    let userPreferences: UserPreferences | undefined;

    if (userId) {
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("category_scores, source_scores")
        .eq("user_id", userId)
        .maybeSingle();

      if (prefs) {
        userPreferences = prefs;
      }
    }

    const scoredArticles = filteredArticles.map((article: Article) => ({
      ...article,
      score: scoreArticle(article, userPreferences),
    }));
    
    scoredArticles.sort((a, b) => b.score - a.score);
    
    const finalArticles = scoredArticles.slice(0, limit).map(({ score, ...article }) => article);
    
    return new Response(
      JSON.stringify({
        success: true,
        articles: finalArticles,
        total: finalArticles.length,
        personalized: !!userPreferences,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Discover feed error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});