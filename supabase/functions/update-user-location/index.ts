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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { user_id, zip_code, city, state, state_code } = await req.json();

    if (!user_id || !zip_code) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id and zip_code are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id,
        zip_code,
        city,
        state,
        state_code,
        location_updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating user location:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Triggering local news scrape for ${city}, ${state}`);

    try {
      const scrapeUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/scrape-local-news`;
      const scrapeResponse = await fetch(scrapeUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ zip_code, city, state }),
      });

      if (!scrapeResponse.ok) {
        console.error('Scrape trigger failed:', await scrapeResponse.text());
      } else {
        const scrapeResult = await scrapeResponse.json();
        console.log('Scrape triggered:', scrapeResult);
      }
    } catch (scrapeError) {
      console.error('Error triggering scrape:', scrapeError);
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in update-user-location:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});