import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req: Request) => {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature header');
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.info(`Processing event: ${event.type}`);

    try {
      await handleStripeEvent(event);
    } catch (error) {
      console.error('Error handling Stripe event:', error);
      return new Response(JSON.stringify({ error: 'Event processing failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function handleStripeEvent(event: Stripe.Event) {
  const { type, data } = event;
  const stripeData = data.object;

  switch (type) {
    case 'checkout.session.completed': {
      const customerId = (stripeData as Stripe.Checkout.Session).customer as string;
      const isSubscription = (stripeData as Stripe.Checkout.Session).mode === 'subscription';

      if (!customerId) {
        console.error('No customer ID in checkout session');
        return;
      }

      const { mode, payment_status } = stripeData as Stripe.Checkout.Session;

      if (isSubscription) {
        console.info(`Starting subscription sync for customer: ${customerId}`);
        await syncCustomerFromStripe(customerId);
      } else if (mode === 'payment' && payment_status === 'paid') {
        try {
          // Extract the necessary information from the session
          const {
            id: checkout_session_id,
            payment_intent,
            amount_subtotal,
            amount_total,
            currency,
          } = stripeData as Stripe.Checkout.Session;

          // Insert the order into the stripe_orders table
          const { error: orderError } = await supabase.from('stripe_orders').insert({
            checkout_session_id,
            payment_intent_id: payment_intent,
            customer_id: customerId,
            amount_subtotal,
            amount_total,
            currency,
            payment_status,
            status: 'completed', // assuming we want to mark it as completed since payment is successful
          });

          if (orderError) {
            console.error('Error inserting order:', orderError);
            return;
          }
          console.info(`Successfully processed one-time payment for session: ${checkout_session_id}`);
        } catch (error) {
          console.error('Error processing one-time payment:', error);
        }
      }
    }
  }
}

// based on the excellent https://github.com/t3dotgg/stripe-recommendations
async function syncCustomerFromStripe(customerId: string) {
  try {
    // fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
    });

    const subscription = subscriptions.data[0];

    if (!subscription) {
      console.warn(`No subscription found for customer: ${customerId}`);
      return;
    }

    console.info(`Found subscription ${subscription.id} for customer ${customerId}, status: ${subscription.status}`);

    // fetch payment method details
    let paymentMethodBrand = null;
    let paymentMethodLast4 = null;

    if (subscription.default_payment_method) {
      const paymentMethodId =
        typeof subscription.default_payment_method === 'string'
          ? subscription.default_payment_method
          : subscription.default_payment_method.id;

      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

      if (paymentMethod.card) {
        paymentMethodBrand = paymentMethod.card.brand;
        paymentMethodLast4 = paymentMethod.card.last4;
      }
    }

    // store subscription state
    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
          ? {
              payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
              payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : {}),
        status: subscription.status,
      },
      {
        onConflict: 'customer_id',
      },
    );

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }

    // Update user_settings with subscription status
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('customer_id', customerId)
      .maybeSingle();

    if (customer?.user_id) {
      // Get user email
      const { data: userData } = await supabase
        .from('users')
        .select('email, full_name, avatar_url')
        .eq('id', customer.user_id)
        .maybeSingle();

      if (userData) {
        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        const subscriptionExpiresAt = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;

        const { error: settingsError } = await supabase
          .from('user_settings')
          .upsert({
            user_id: customer.user_id,
            email: userData.email,
            full_name: userData.full_name,
            avatar_url: userData.avatar_url,
            is_subscribed: isActive,
            subscription_expires_at: subscriptionExpiresAt,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });

        if (settingsError) {
          console.error('Error updating user settings:', settingsError);
        } else {
          console.info(`Updated user_settings for user: ${customer.user_id}, is_subscribed: ${isActive}`);
        }
      }
    }

    console.info(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}