import { useState, useEffect } from 'react';
import { Sparkles, Cpu, Gamepad2, Landmark, Trophy, Film, Briefcase, Heart, Beaker, Globe, Coins, Plane } from 'lucide-react';
import { TrendingTopic } from '../types';
import { useApp } from '../contexts/AppContext';
import { newsApi } from '../lib/newsApi';

const trendingTopics: TrendingTopic[] = [
  {
    id: 'all',
    name: 'For You',
    icon: 'sparkles',
    gradient: 'from-purple-500 via-pink-500 to-red-500'
  },
  {
    id: 'world',
    name: 'World News',
    icon: 'globe',
    gradient: 'from-blue-600 via-indigo-600 to-purple-600'
  },
  {
    id: 'business',
    name: 'Business',
    icon: 'briefcase',
    gradient: 'from-slate-500 via-gray-500 to-zinc-500'
  },
  {
    id: 'crypto',
    name: 'Crypto',
    icon: 'coins',
    gradient: 'from-amber-500 via-orange-500 to-yellow-500'
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: 'film',
    gradient: 'from-pink-500 via-rose-500 to-red-500'
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: 'gamepad',
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500'
  },
  {
    id: 'health',
    name: 'Health',
    icon: 'heart',
    gradient: 'from-red-400 via-pink-400 to-rose-400'
  },
  {
    id: 'politics',
    name: 'Politics',
    icon: 'landmark',
    gradient: 'from-red-500 via-orange-500 to-amber-500'
  },
  {
    id: 'sports',
    name: 'Sports',
    icon: 'trophy',
    gradient: 'from-green-500 via-emerald-500 to-teal-500'
  },
  {
    id: 'tech',
    name: 'Tech',
    icon: 'cpu',
    gradient: 'from-blue-500 via-cyan-500 to-teal-500'
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: 'plane',
    gradient: 'from-cyan-500 via-teal-500 to-blue-500'
  }
];

const getIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    sparkles: Sparkles,
    cpu: Cpu,
    gamepad: Gamepad2,
    landmark: Landmark,
    trophy: Trophy,
    film: Film,
    briefcase: Briefcase,
    heart: Heart,
    beaker: Beaker,
    globe: Globe,
    coins: Coins,
    plane: Plane
  };
  return icons[iconName] || Sparkles;
};

export const TrendingCategories = () => {
  const { selectedTopic, setSelectedTopic } = useApp();
  const [, setCategoryCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCategoryCounts = async () => {
      try {
        const categories = await newsApi.getCategories();
        const counts = categories.reduce((acc, { category, count }) => {
          acc[category] = count;
          return acc;
        }, {} as Record<string, number>);
        setCategoryCounts(counts);
      } catch (error) {
        console.error('Error fetching category counts:', error);
      }
    };

    fetchCategoryCounts();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 py-4 px-4 overflow-x-auto scrollbar-hide">
      <div className="flex gap-4 min-w-min">
        {trendingTopics.map((topic) => {
          const Icon = getIcon(topic.icon);
          const isSelected = selectedTopic === topic.id;

          return (
            <button
              key={topic.id}
              onClick={() => setSelectedTopic(topic.id)}
              className="flex flex-col items-center gap-2 flex-shrink-0 active:scale-95 transition-transform"
            >
              <div className="relative">
                <div
                  className={`w-16 h-16 rounded-full bg-gradient-to-br ${topic.gradient} p-[3px] ${
                    isSelected ? 'ring-2 ring-nuuz-yellow ring-offset-2' : ''
                  }`}
                >
                  <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${topic.gradient} flex items-center justify-center`}>
                      <Icon size={24} className="text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              </div>
              <span
                className={`text-xs font-medium ${
                  isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {topic.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
