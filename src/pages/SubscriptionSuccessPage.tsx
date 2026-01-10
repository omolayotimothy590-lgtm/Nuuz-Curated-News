import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2, Crown, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function SubscriptionSuccessPage() {
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [showConfetti, setShowConfetti] = useState(false);
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleSuccess = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      // Wait for webhook to process (usually 2-3 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Refresh user data to get updated subscription status
      await refreshUser();

      // Show the success screen with animation
      setLoading(false);
      setShowConfetti(true);

      // Store success flag for showing toast on home page
      localStorage.setItem('subscription_just_activated', 'true');
    };

    handleSuccess();
  }, [user, navigate, refreshUser]);

  // Auto redirect countdown
  useEffect(() => {
    if (!loading && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (!loading && countdown === 0) {
      navigate('/');
    }
  }, [loading, countdown, navigate]);

  const handleContinue = () => {
    navigate('/');
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-nuuz-yellow/10 via-amber-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <Sparkles
              key={i}
              className="absolute animate-ping text-nuuz-yellow"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: '3s'
              }}
            />
          ))}
        </div>
      )}
      <div className="max-w-md w-full relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center border-2 border-nuuz-yellow/20 animate-in zoom-in duration-500">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-nuuz-yellow to-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Nuuz+ Premium!
            </h1>
            <p className="text-gray-600">
              Your subscription has been successfully activated.
            </p>
          </div>

          <div className={`${user?.isPremium ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'} border rounded-xl p-4 mb-6`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              {user?.isPremium ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Premium Active!</h3>
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-900">Processing Payment...</h3>
                </>
              )}
            </div>
            <p className={`text-sm ${user?.isPremium ? 'text-green-700' : 'text-amber-700'}`}>
              {user?.isPremium
                ? 'You now have access to all premium features and an ad-free experience!'
                : 'Your payment is being processed. Premium features will activate shortly.'}
            </p>
          </div>

          <div className="space-y-3 mb-6 text-left">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-sm text-gray-700">Ad-free experience activated</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-sm text-gray-700">Priority loading enabled</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-sm text-gray-700">Exclusive features unlocked</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-sm text-gray-700">Enhanced personalization</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-nuuz-yellow to-amber-400 text-slate-900 font-bold py-4 px-4 rounded-xl hover:from-nuuz-yellow-dark hover:to-amber-500 active:scale-95 transition-all flex items-center justify-center shadow-md"
            >
              Start Reading Ad-Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            <p className="text-sm text-gray-500">
              Redirecting to home in {countdown} seconds...
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Check Settings to view your subscription details
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}