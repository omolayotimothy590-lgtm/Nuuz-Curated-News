import { X, Star, Check, CreditCard, AlertCircle, Crown, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { stripeProducts } from '../stripe-config';

interface PremiumModalProps {
  onClose: () => void;
}

export const PremiumModal = ({ onClose }: PremiumModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const premiumProduct = stripeProducts[0];

  // Check if user is already premium
  const isPremium = user?.isPremium || false;

  const handleUpgrade = async () => {
    console.log('🚀 Premium upgrade initiated');
    console.log('👤 Current user:', user);

    if (!user) {
      console.error('❌ No user found - cannot process subscription');
      setError('Please sign in to subscribe');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('💳 Creating Stripe checkout session...');
      console.log('🔗 Supabase URL:', supabaseUrl);
      console.log('🔑 Anon Key length:', supabaseAnonKey?.length);

      const functionUrl = `${supabaseUrl}/functions/v1/stripe-checkout`;
      console.log('📡 Calling edge function:', functionUrl);

      const premiumProduct = stripeProducts[0];
      const currentUrl = window.location.origin;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          price_id: premiumProduct.priceId,
          mode: premiumProduct.mode,
          success_url: `${currentUrl}/subscription/success`,
          cancel_url: currentUrl,
          user_id: user.id,
        }),
      });

      console.log('📨 Response status:', response.status);
      console.log('📨 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Checkout failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Checkout session created:', data);

      if (!data.url) {
        console.error('❌ No checkout URL in response:', data);
        throw new Error('No checkout URL received');
      }

      console.log('🔄 Redirecting to Stripe checkout:', data.url);
      window.location.href = data.url;

    } catch (err) {
      console.error('❌ Stripe checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setIsProcessing(false);
    }
  };

  // If user is already premium, show different modal
  if (isPremium) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className="relative">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition z-10"
            >
              <X size={20} className="text-slate-600 dark:text-slate-400" />
            </button>

            <div className="bg-gradient-to-br from-nuuz-yellow via-amber-400 to-amber-500 p-8 rounded-t-2xl">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Crown size={32} className="text-nuuz-yellow fill-nuuz-yellow" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 text-center mb-2">
                You're Premium!
              </h2>
              <p className="text-slate-800 text-center">
                Thank you for supporting quality journalism
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-green-900 dark:text-green-100">
                    Active Subscription
                  </span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your premium benefits are active and you're enjoying an ad-free experience.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-white">Your Benefits:</h3>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-slate-700 dark:text-slate-300">No advertisements</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-slate-700 dark:text-slate-300">Priority support</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-slate-700 dark:text-slate-300">Early feature access</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 bg-gradient-to-r from-nuuz-yellow to-amber-400 text-slate-900 font-bold rounded-xl hover:from-nuuz-yellow-dark hover:to-amber-500 active:scale-95 transition"
              >
                Continue Enjoying Premium
              </button>

              <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                Manage your subscription in Settings
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition z-10"
          >
            <X size={20} className="text-slate-600 dark:text-slate-400" />
          </button>

          <div className="bg-gradient-to-br from-nuuz-yellow via-amber-400 to-amber-500 p-8 rounded-t-2xl">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Star size={32} className="text-nuuz-yellow fill-nuuz-yellow" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 text-center mb-2">
              Go Premium
            </h2>
            <p className="text-slate-800 text-center">
              Support quality journalism and enjoy an ad-free experience
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-nuuz-yellow/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={16} className="text-nuuz-yellow" />
                </div>
                <span className="text-slate-700 dark:text-slate-300">No advertisements or sponsored content</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-nuuz-yellow/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={16} className="text-nuuz-yellow" />
                </div>
                <span className="text-slate-700 dark:text-slate-300">Support independent journalism</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-nuuz-yellow/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={16} className="text-nuuz-yellow" />
                </div>
                <span className="text-slate-700 dark:text-slate-300">Early access to new features</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-nuuz-yellow/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={16} className="text-nuuz-yellow" />
                </div>
                <span className="text-slate-700 dark:text-slate-300">Priority customer support</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border-2 border-nuuz-yellow/30">
              <div className="flex items-baseline justify-center gap-2 mb-1">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">
                  {premiumProduct.currencySymbol}{premiumProduct.price.toFixed(2)}
                </span>
                <span className="text-slate-600 dark:text-slate-400">/month</span>
              </div>
              <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                Cancel anytime
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleUpgrade}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-nuuz-yellow to-amber-400 text-slate-900 font-bold rounded-xl hover:from-nuuz-yellow-dark hover:to-amber-500 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCard size={20} />
                {isProcessing ? 'Processing...' : 'Subscribe Now'}
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white transition"
              >
                Maybe Later
              </button>
            </div>

            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
              By subscribing, you agree to our Terms of Service and Privacy Policy.
              Subscription auto-renews monthly until cancelled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
