import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function decodeHTMLEntities(text: string): string {
  if (!text) return text;

  const entities: Record<string, string> = {
    '&#8217;': "'",
    '&#8216;': "'",
    '&#8220;': '"',
    '&#8221;': '"',
    '&#8211;': '–',
    '&#8212;': '—',
    '&#038;': '&',
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&apos;': "'",
  };

  let decoded = text;
  for (const [entity, replacement] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), replacement);
  }

  decoded = decoded.replace(/&#(\d+);/g, (_, dec) => {
    try {
      return String.fromCharCode(parseInt(dec));
    } catch {
      return _;
    }
  });

  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16));
    } catch {
      return _;
    }
  });

  return decoded;
}

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

    const url = new URL(req.url);
    const article_id = url.searchParams.get("article_id");

    if (!article_id) {
      return new Response(
        JSON.stringify({ success: false, error: "article_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, token);

    const { data: conversations, error } = await supabase
      .from("ai_conversations")
      .select("id, question, answer, created_at")
      .eq("article_id", article_id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching conversations:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch conversations" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanedConversations = (conversations || []).map((conv: any) => ({
      id: conv.id,
      question: decodeHTMLEntities(conv.question),
      answer: decodeHTMLEntities(conv.answer),
      created_at: conv.created_at,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        conversations: cleanedConversations,
        count: cleanedConversations.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Get conversation history error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});