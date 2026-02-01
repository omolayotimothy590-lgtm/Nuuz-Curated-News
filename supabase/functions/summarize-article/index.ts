import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SummarizeRequest {
  article_id?: string;
  text?: string;
}

async function summarizeWithOpenAI(text: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful news summarizer. Summarize articles in 2-3 clear, concise sentences for quick reading on mobile. Focus on the key facts and main points.",
        },
        {
          role: "user",
          content: `Summarize this article:\n\n${text.substring(0, 4000)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "Summary unavailable";
}

async function summarizeWithGemini(text: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Summarize this news article in 2-3 clear, concise sentences for quick reading on mobile:\n\n${text.substring(0, 4000)}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 150,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Summary unavailable";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { article_id, text }: SummarizeRequest = await req.json();
    
    let contentToSummarize = text;
    let articleData = null;
    
    if (article_id && !text) {
      const { data, error } = await supabase
        .from("articles")
        .select("title, full_content")
        .eq("id", article_id)
        .single();
      
      if (error || !data) {
        return new Response(
          JSON.stringify({ success: false, error: "Article not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      articleData = data;
      contentToSummarize = `${data.title}\n\n${data.full_content}`;
    }
    
    if (!contentToSummarize) {
      return new Response(
        JSON.stringify({ success: false, error: "No content to summarize" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    let summary;
    
    if (openaiKey) {
      summary = await summarizeWithOpenAI(contentToSummarize, openaiKey);
    } else if (geminiKey) {
      summary = await summarizeWithGemini(contentToSummarize, geminiKey);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "No AI API key configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (article_id && summary) {
      await supabase
        .from("articles")
        .update({ summary, updated_at: new Date().toISOString() })
        .eq("id", article_id);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        summary,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Summarization error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});