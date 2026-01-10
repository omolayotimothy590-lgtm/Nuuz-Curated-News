import { useState, useEffect } from 'react';
import { validateZipCode, LocationData } from '../lib/zipCodeUtils';
import { Loader } from 'lucide-react';

interface LocalSetupProps {
  onLocationSet: (location: LocationData) => void;
}

export const LocalSetup = ({ onLocationSet }: LocalSetupProps) => {
  const [zipCode, setZipCode] = useState('');
  const [locationPreview, setLocationPreview] = useState<LocationData | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (zipCode.length === 5) {
      const timeoutId = setTimeout(async () => {
        setIsValidating(true);
        setError('');

        const location = await validateZipCode(zipCode);

        if (location) {
          setLocationPreview(location);
          setError('');
        } else {
          setLocationPreview(null);
          setError('❌ Invalid ZIP code');
        }

        setIsValidating(false);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setLocationPreview(null);
      setError('');
    }
  }, [zipCode]);

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setZipCode(value);
  };

  const handleSubmit = async () => {
    if (!locationPreview) return;

    setIsSubmitting(true);
    try {
      await onLocationSet(locationPreview);
    } catch (error) {
      console.error('Error setting location:', error);
      setError('Failed to set location. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-white dark:bg-slate-900">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="text-6xl mb-6">📍</div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
            Get Local News
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400">
            See what's happening in your area
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={zipCode}
              onChange={handleZipCodeChange}
              placeholder="Enter ZIP Code"
              autoFocus
              className="w-full h-14 px-6 text-xl text-center border-2 border-blue-500 dark:border-blue-600 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition"
            />
            {isValidating && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader className="animate-spin text-blue-600" size={20} />
              </div>
            )}
          </div>

          {locationPreview && !error && (
            <div className="text-center py-2 text-slate-700 dark:text-slate-300 font-medium">
              📍 {locationPreview.city}, {locationPreview.stateCode}
            </div>
          )}

          {error && (
            <div className="text-center py-2 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!locationPreview || isSubmitting}
            className="w-full h-12 bg-blue-600 text-white font-semibold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 active:scale-95 transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader className="animate-spin" size={20} />
                Setting Location...
              </>
            ) : (
              'Set Location'
            )}
          </button>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Or set it later in Settings
        </p>
      </div>
    </div>
  );
};
