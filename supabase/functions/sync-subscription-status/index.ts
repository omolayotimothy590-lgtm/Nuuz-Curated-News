import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user from custom users table
    const { data: userData } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url')
      .eq('email', user.email)
      .maybeSingle();

    if (!userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get customer ID
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', userData.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!customer) {
      return new Response(
        JSON.stringify({ error: 'No Stripe customer found', isPremium: false }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.customer_id,
      limit: 1,
      status: 'all',
    });

    const subscription = subscriptions.data[0];

    if (!subscription) {
      // No active subscription
      await supabase
        .from('user_settings')
        .upsert({
          user_id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          avatar_url: userData.avatar_url,
          is_subscribed: false,
          subscription_expires_at: null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      return new Response(
        JSON.stringify({ isPremium: false, message: 'No active subscription' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update subscription in database
    await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customer.customer_id,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        status: subscription.status,
      },
      {
        onConflict: 'customer_id',
      }
    );

    // Update user_settings
    const isActive = subscription.status === 'active' || subscription.status === 'trialing';
    const subscriptionExpiresAt = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;

    await supabase
      .from('user_settings')
      .upsert({
        user_id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        avatar_url: userData.avatar_url,
        is_subscribed: isActive,
        subscription_expires_at: subscriptionExpiresAt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    return new Response(
      JSON.stringify({
        isPremium: isActive,
        status: subscription.status,
        expiresAt: subscriptionExpiresAt,
        message: 'Subscription status synced successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});