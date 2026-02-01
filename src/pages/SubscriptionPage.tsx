import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SubscriptionCard } from '../components/subscription/SubscriptionCard';
import { stripeProducts } from '../stripe-config';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

interface UserSubscription {
  subscription_status: string;
  price_id: string | null;
}

export function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const timeoutId = setTimeout(() => {
        console.warn('⏰ Subscription page loading timeout (10s)');
        setLoading(false);
      }, 10000);

      try {
        console.log('🔐 Checking auth for subscription page...');

        // Get session with timeout
        const sessionPromise = supabase.auth.getSession();
        const sessionTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), 3000)
        );

        let session = null;
        try {
          const { data } = await Promise.race([sessionPromise, sessionTimeout]) as any;
          session = data?.session;
          console.log('👤 Session:', session?.user ? 'Found' : 'None');
        } catch (sessionError) {
          console.warn('⚠️ Session check timeout');
          navigate('/login');
          return;
        }

        if (!session) {
          navigate('/login');
          return;
        }

        // Fetch user's current subscription with timeout
        console.log('💳 Fetching subscription data...');
        try {
          const subscriptionPromise = supabase
            .from('stripe_user_subscriptions')
            .select('subscription_status, price_id')
            .maybeSingle();

          const subscriptionTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Subscription fetch timeout')), 5000)
          );

          const result = await Promise.race([subscriptionPromise, subscriptionTimeout]) as any;

          if (!result.error && result.data) {
            console.log('✅ Subscription data loaded:', result.data);
            setUserSubscription(result.data);
          } else {
            console.log('ℹ️ No subscription found');
          }
        } catch (subError) {
          console.warn('⚠️ Subscription fetch timeout or error:', subError);
        }
      } catch (error) {
        console.error('❌ Error in subscription page:', error);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading subscription details...</span>
        </div>
      </div>
    );
  }

  const isActiveSubscription = userSubscription?.subscription_status === 'active';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Your Nuuz Experience
          </h1>
          <p className="text-lg text-gray-600">
            Upgrade to Nuuz+ Premium for an enhanced news reading experience
          </p>
        </div>

        <div className="grid md:grid-cols-1 gap-8 max-w-md mx-auto">
          {stripeProducts.map((product) => (
            <SubscriptionCard
              key={product.priceId}
              product={product}
              isCurrentPlan={isActiveSubscription && userSubscription?.price_id === product.priceId}
            />
          ))}
        </div>

        {userSubscription && (
          <div className="mt-8 text-center">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Current Status</h3>
              <p className="text-gray-600">
                Subscription Status: <span className="font-medium capitalize">
                  {userSubscription.subscription_status.replace('_', ' ')}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}