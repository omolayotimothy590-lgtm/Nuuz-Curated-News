import { Cpu, Gamepad2, Landmark, Trophy, Film, Briefcase, Heart, Beaker, Globe, Coins, Plane } from 'lucide-react';

export const getCategoryGradient = (category: string): string => {
  const gradients: Record<string, string> = {
    tech: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
    technology: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
    gaming: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    politics: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    sports: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    business: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
    health: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    entertainment: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    science: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    world: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    crypto: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    travel: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    general: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
  };

  return gradients[category.toLowerCase()] || gradients.tech;
};

export const getCategoryIcon = (category: string) => {
  const icons: Record<string, any> = {
    tech: Cpu,
    technology: Cpu,
    gaming: Gamepad2,
    politics: Landmark,
    sports: Trophy,
    entertainment: Film,
    business: Briefcase,
    health: Heart,
    science: Beaker,
    world: Globe,
    crypto: Coins,
    travel: Plane,
    general: Globe,
  };

  return icons[category.toLowerCase()] || Cpu;
};
