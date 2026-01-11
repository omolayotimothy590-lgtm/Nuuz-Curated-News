import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    const url = new URL(req.url);
    const zipCode = url.searchParams.get('zip_code');
    const city = url.searchParams.get('city');
    const state = url.searchParams.get('state');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!city && !state) {
      return new Response(
        JSON.stringify({ success: false, error: 'city or state is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let query = supabase
      .from('articles')
      .select('*')
      .order('published_at', { ascending: false });

    if (city && state) {
      query = query.or(`city.ilike.%${city}%,state.ilike.%${state}%,title.ilike.%${city}%,summary.ilike.%${city}%`);
    } else if (city) {
      query = query.or(`city.ilike.%${city}%,title.ilike.%${city}%,summary.ilike.%${city}%`);
    } else if (state) {
      query = query.or(`state.ilike.%${state}%,title.ilike.%${state}%,summary.ilike.%${state}%`);
    }

    const { data: localArticles, error: localError } = await query.range(offset, offset + limit - 1);

    if (localError) {
      console.error('Error fetching local articles:', localError);
    }

    let articles = localArticles || [];

    if (articles.length < 10 && offset === 0) {
      const { data: generalArticles } = await supabase
        .from('articles')
        .select('*')
        .order('published_at', { ascending: false })
        .range(0, limit - articles.length - 1);

      if (generalArticles) {
        articles = [...articles, ...generalArticles];
      }
    }

    if (articles.length === 0 && zipCode) {
      console.log(`No articles found, triggering scrape for ${city}, ${state}`);
      
      try {
        const scrapeUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/scrape-local-news`;
        await fetch(scrapeUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ zip_code: zipCode, city, state }),
        });
      } catch (scrapeError) {
        console.error('Error triggering scrape:', scrapeError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        articles: articles || [],
        total: articles?.length || 0,
        location: { zip_code: zipCode, city, state },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in get-local-feed:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});