import { supabase, supabaseUrl } from './supabase';

interface CreateCheckoutSessionParams {
  priceId: string;
  mode: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
}

interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export async function createCheckoutSession({
  priceId,
  mode,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams): Promise<CheckoutSessionResponse> {
  console.log('🛒 Starting checkout session creation...');
  console.log('🔗 Supabase URL:', supabaseUrl);

  // Validate Supabase URL
  if (!supabaseUrl || supabaseUrl === 'undefined' || !supabaseUrl.startsWith('http')) {
    console.error('❌ Invalid Supabase URL:', supabaseUrl);
    throw new Error(`Configuration error: Invalid Supabase URL (${supabaseUrl}). Please refresh the page and try again.`);
  }

  // Get session with timeout
  const sessionPromise = supabase.auth.getSession();
  const sessionTimeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Session check timeout')), 3000)
  );

  let session;
  try {
    const { data } = await Promise.race([sessionPromise, sessionTimeout]) as any;
    session = data?.session;
  } catch (error) {
    console.error('❌ Session check failed:', error);
    throw new Error('Authentication timeout. Please refresh the page and try again.');
  }

  if (!session) {
    throw new Error('You must be logged in to subscribe. Please sign in and try again.');
  }

  console.log('✅ User authenticated, creating checkout session...');

  const apiUrl = `${supabaseUrl}/functions/v1/stripe-checkout`;
  console.log('📍 API URL:', apiUrl);

  // Double-check the URL is valid
  if (!apiUrl.startsWith('https://')) {
    console.error('❌ Malformed API URL:', apiUrl);
    throw new Error(`Configuration error: Invalid API URL. Please refresh the page.`);
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        price_id: priceId,
        mode,
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = 'Failed to create checkout session';

      if (contentType && contentType.includes('application/json')) {
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
          console.error('❌ API error:', error);
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
      } else {
        const text = await response.text();
        console.error('❌ Non-JSON response:', text.substring(0, 200));
        errorMessage = 'Server returned an unexpected response. Please try again.';
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ Checkout session created successfully');
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('❌ Network error:', error);
      throw new Error('Network error. Please check your connection and try again.');
    }
    throw error;
  }
}

export async function getUserSubscription() {
  try {
    const promise = supabase
      .from('stripe_user_subscriptions')
      .select('*')
      .maybeSingle();

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Subscription query timeout')), 3000)
    );

    const result = await Promise.race([promise, timeout]) as any;

    if (result.error) {
      console.error('Error fetching subscription:', result.error);
      return null;
    }

    return result.data;
  } catch (error) {
    console.warn('Subscription query timed out or failed:', error);
    return null;
  }
}
