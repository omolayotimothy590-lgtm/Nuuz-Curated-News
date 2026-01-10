import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AskAIRequest {
  article_id: string;
  question: string;
  user_id?: string;
}

const rateLimiter = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string, maxRequests = 20, windowMs = 3600000): boolean {
  const now = Date.now();
  const userLimit = rateLimiter.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimiter.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

function removeDisclaimers(answer: string): string {
  const disclaimers = [
    /the article does not provide/gi,
    /the article doesn't provide/gi,
    /i don't have information/gi,
    /i cannot provide/gi,
    /the article does not mention/gi,
    /the article doesn't mention/gi,
    /not mentioned in the article/gi,
    /the article does not contain/gi,
    /based on my knowledge cutoff/gi,
    /i don't have access/gi,
    /the text doesn't specify/gi,
  ];

  let cleaned = answer;
  for (const pattern of disclaimers) {
    if (pattern.test(cleaned)) {
      return '';
    }
  }

  return cleaned;
}

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

async function askOpenAI(question: string, context: string, articleTitle: string, apiKey: string, retryCount = 0): Promise<string> {
  const systemPrompt = retryCount === 0
    ? `You are a knowledgeable news analyst and expert assistant. Your job is to help users understand news articles and related topics.

CRITICAL INSTRUCTIONS:
1. First, try to answer the question based on information in the article provided
2. If the article doesn't contain the specific information requested, use your general knowledge to provide a helpful, accurate answer
3. NEVER say "The article does not provide information about..." or similar phrases
4. NEVER refuse to answer - always provide useful information
5. If answering from your knowledge, you can briefly mention "While this specific detail isn't in the article..." but then immediately provide the answer
6. Be conversational, clear, and helpful
7. Keep answers concise (2-4 paragraphs max)
8. Provide context and explanations that help users understand
9. IMPORTANT: Use plain text only - use regular apostrophes ('), quotes ("), and dashes (-). DO NOT use HTML entities like &#8217; or &nbsp;

Answer the user's question helpfully, drawing from the article when possible, and using your knowledge when needed.`
    : `You are an expert news analyst answering a question about this news topic: ${articleTitle}

Provide a knowledgeable, helpful answer using your understanding of current events and general knowledge. Be direct, confident, and informative. Answer as if you're an expert explaining to a friend. Keep it conversational and 2-3 paragraphs.

IMPORTANT: Use plain text only - use regular apostrophes ('), quotes ("), and dashes (-). DO NOT use HTML entities.`;

  const userContent = retryCount === 0
    ? `Article Title: ${articleTitle}\n\nArticle Content: ${context}\n\nUser Question: ${question}\n\nProvide a comprehensive answer to this question. Use the article information when relevant, and supplement with your knowledge to give a complete response.`
    : question;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      temperature: retryCount === 0 ? 0.7 : 0.8,
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || response.status}`);
  }

  const data = await response.json();
  let answer = data.choices[0]?.message?.content || "I couldn't generate an answer.";

  answer = decodeHTMLEntities(answer);

  const cleaned = removeDisclaimers(answer);
  if (!cleaned && retryCount === 0) {
    return askOpenAI(question, context, articleTitle, apiKey, 1);
  }

  return decodeHTMLEntities(cleaned || answer);
}

async function askGemini(question: string, context: string, articleTitle: string, apiKey: string, retryCount = 0): Promise<string> {
  const prompt = retryCount === 0
    ? `You are an intelligent news analyst helping users understand articles and related topics.

KEY RULES:
- Answer every question helpfully and informatively
- Use information from the article when available
- If the article lacks specific details, provide answers using your general knowledge
- NEVER say phrases like "the article doesn't mention" or "I don't have that information"
- Always give a substantive, useful answer
- Be conversational and engaging
- Provide context to help understanding
- IMPORTANT: Use plain text only - use regular apostrophes ('), quotes ("), and dashes (-). DO NOT use HTML entities like &#8217; or &nbsp;

Article: ${articleTitle}\n${context}\n\nUser Question: ${question}\n\nProvide a helpful, comprehensive answer.`
    : `You are answering a question about: ${articleTitle}\n\nQuestion: ${question}\n\nProvide a knowledgeable answer using your understanding of current events. Be direct and helpful. 2-3 paragraphs.

IMPORTANT: Use plain text only - use regular apostrophes ('), quotes ("), and dashes (-). DO NOT use HTML entities.`;

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
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: retryCount === 0 ? 0.7 : 0.8,
          maxOutputTokens: 600,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  let answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate an answer.";

  answer = decodeHTMLEntities(answer);

  const cleaned = removeDisclaimers(answer);
  if (!cleaned && retryCount === 0) {
    return askGemini(question, context, articleTitle, apiKey, 1);
  }

  return decodeHTMLEntities(cleaned || answer);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    const { article_id, question, user_id }: AskAIRequest = await req.json();

    if (!article_id || !question) {
      return new Response(
        JSON.stringify({ success: false, error: "article_id and question are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user_id || "anonymous";

    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Rate limit exceeded. Maximum 20 questions per hour.",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("title, summary, full_content")
      .eq("id", article_id)
      .single();

    if (articleError || !article) {
      return new Response(
        JSON.stringify({ success: false, error: "Article not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const context = `${article.summary}\n\n${(article.full_content || '').substring(0, 3000)}`;

    let answer;

    if (openaiKey) {
      answer = await askOpenAI(question, context, article.title, openaiKey);
    } else if (geminiKey) {
      answer = await askGemini(question, context, article.title, geminiKey);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "No AI API key configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (token && user_id) {
      const userSupabase = createClient(supabaseUrl, token);

      await userSupabase.from("ai_conversations").insert({
        user_id,
        article_id,
        question,
        answer,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        answer,
        article_title: article.title,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Ask AI error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});