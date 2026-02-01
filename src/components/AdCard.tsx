import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string;
  is_active: boolean;
  priority: number;
  created_at: string;
}

interface AdCardProps {
  ad: Ad;
}

export const AdCard = ({ ad }: AdCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAdClick = () => {
    window.open(ad.link_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <article className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 pb-4 relative">
      <div
        className="relative bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 active:bg-slate-100 dark:active:bg-slate-800 transition-colors duration-150"
        onClick={handleAdClick}
      >
        {ad.image_url && !imageError && (
          <div className="relative w-full h-[350px] overflow-hidden bg-slate-100 dark:bg-slate-800">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
                <div className="animate-pulse text-slate-400">Loading...</div>
              </div>
            )}
            <img
              src={ad.image_url}
              alt={ad.title}
              onError={() => setImageError(true)}
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
            />
          </div>
        )}

        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 text-sm mb-3">
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
              Sponsored
            </span>
          </div>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug">
            {ad.title}
          </h2>

          {ad.description && (
            <p className="text-slate-600 dark:text-slate-400 mb-3 leading-relaxed text-sm">
              {ad.description}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 mt-3">
        <button
          onClick={handleAdClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg transition active:scale-95 shadow-sm"
        >
          <span className="text-sm">Learn More</span>
          <ExternalLink size={16} strokeWidth={2} />
        </button>
      </div>
    </article>
  );
};
