import { User } from '../types';

export function shouldShowAds(user: User | null): boolean {
  // Show ads for logged-out users
  if (!user) return true;

  // Hide ads only for premium users with active subscription
  if (user.isPremium) {
    if (user.subscriptionExpiresAt) {
      return new Date(user.subscriptionExpiresAt) <= new Date();
    }
    return false;
  }

  // Show ads for logged-in non-premium users
  return true;
}

export function hideGoogleAds() {
  if (typeof window === 'undefined') return;

  const style = document.createElement('style');
  style.id = 'hide-adsense';
  style.textContent = `
    ins.adsbygoogle {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

export function showGoogleAds() {
  if (typeof window === 'undefined') return;

  const style = document.getElementById('hide-adsense');
  if (style) {
    style.remove();
  }
}
