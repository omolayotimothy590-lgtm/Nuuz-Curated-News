import { useState } from 'react';
import { Crown, Check, Loader2 } from 'lucide-react';
import { StripeProduct } from '../../stripe-config';
import { createCheckoutSession } from '../../lib/stripe';

interface SubscriptionCardProps {
  product: StripeProduct;
  isCurrentPlan?: boolean;
}

export function SubscriptionCard({ product, isCurrentPlan }: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { url } = await createCheckoutSession({
        priceId: product.priceId,
        mode: product.mode,
        successUrl: `${window.location.origin}/subscription/success`,
        cancelUrl: window.location.href,
      });

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 border-2 ${
      isCurrentPlan ? 'border-green-500' : 'border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Crown className="w-6 h-6 text-yellow-500 mr-2" />
          <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
        </div>
        {isCurrentPlan && (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            Current Plan
          </span>
        )}
      </div>

      <div className="mb-4">
        <span className="text-3xl font-bold text-gray-900">
          {product.currencySymbol}{product.price}
        </span>
        <span className="text-gray-600 ml-1">
          /{product.mode === 'subscription' ? 'month' : 'one-time'}
        </span>
      </div>

      <p className="text-gray-600 mb-6">{product.description}</p>

      <div className="space-y-3 mb-6">
        <div className="flex items-center">
          <Check className="w-5 h-5 text-green-500 mr-2" />
          <span className="text-sm text-gray-700">Ad-free experience</span>
        </div>
        <div className="flex items-center">
          <Check className="w-5 h-5 text-green-500 mr-2" />
          <span className="text-sm text-gray-700">Priority loading</span>
        </div>
        <div className="flex items-center">
          <Check className="w-5 h-5 text-green-500 mr-2" />
          <span className="text-sm text-gray-700">Exclusive features</span>
        </div>
        <div className="flex items-center">
          <Check className="w-5 h-5 text-green-500 mr-2" />
          <span className="text-sm text-gray-700">Personalized experience</span>
        </div>
      </div>

      <button
        onClick={isCurrentPlan ? undefined : handleSubscribe}
        disabled={loading || isCurrentPlan}
        className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
          isCurrentPlan
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Processing...
          </div>
        ) : isCurrentPlan ? (
          'Current Plan'
        ) : (
          `Subscribe to ${product.name}`
        )}
      </button>
    </div>
  );
}