import { useEffect, useRef, useState } from 'react';
import { AD_CONFIG } from '../lib/adConfig';
import { trackAdEvent } from '../lib/adAnalytics';

interface GoogleAdCardProps {
  adSlot: string;
  viewType?: 'feed' | 'search' | 'saved';
  position?: number;
}

export const GoogleAdCard = ({ adSlot, viewType = 'feed', position = 0 }: GoogleAdCardProps) => {
  const adRef = useRef<HTMLModElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const loadAttempted = useRef(false);

  useEffect(() => {
    if (loadAttempted.current) return;
    loadAttempted.current = true;

    const loadAd = async () => {
      try {
        if (!window.adsbygoogle) {
          console.warn('AdSense script not loaded yet');
          setAdError(true);
          trackAdEvent('error', 'script_not_loaded', adSlot);
          return;
        }

        if (!adRef.current) {
          console.warn('Ad element not ready');
          setAdError(true);
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 100));

        (window.adsbygoogle as any[]).push({});

        setAdLoaded(true);
        trackAdEvent('loaded', viewType, adSlot, position);

        setTimeout(() => {
          if (adRef.current) {
            const iframe = adRef.current.querySelector('iframe');
            if (iframe) {
              trackAdEvent('rendered', viewType, adSlot, position);
            } else {
              console.warn('Ad may not have rendered');
            }
          }
        }, 1000);

      } catch (error) {
        console.error('AdSense error:', error);
        setAdError(true);
        trackAdEvent('error', 'load_failed', adSlot);
      }
    };

    loadAd();
  }, [adSlot, viewType, position]);

  useEffect(() => {
    if (!adRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && adLoaded) {
            trackAdEvent('viewable', viewType, adSlot, position);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(adRef.current);

    return () => observer.disconnect();
  }, [adLoaded, adSlot, viewType, position]);

  if (adError && !AD_CONFIG.testMode) {
    return null;
  }

  return (
    <article className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 pb-4 relative">
      <div className="relative">
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              Sponsored
            </span>
            {AD_CONFIG.testMode && (
              <span className="text-xs font-mono text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded">
                TEST AD
              </span>
            )}
          </div>

          <div className="min-h-[250px] w-full relative">
            <ins
              ref={adRef}
              className="adsbygoogle"
              style={{
                display: 'block',
                minHeight: '250px',
                width: '100%'
              }}
              data-ad-format={AD_CONFIG.adFormat}
              data-ad-layout-key={AD_CONFIG.layoutKey}
              data-ad-client={AD_CONFIG.publisherId}
              data-ad-slot={adSlot}
              data-full-width-responsive={AD_CONFIG.responsive ? 'true' : 'false'}
              data-ad-test={AD_CONFIG.testMode ? 'on' : 'off'}
            />

            {adError && AD_CONFIG.testMode && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded">
                <div className="text-center p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Ad Loading Error (Test Mode)
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    Slot: {adSlot}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}
