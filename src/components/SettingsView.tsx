import { useState, useEffect } from 'react';
import {
  X, Moon, Sun, Monitor, Bell, Clock, Eye, TrendingUp,
  Compass, Users, LogOut, Info, FileText, Star,
  MessageCircle, Shield, ChevronRight, MapPin, Loader, RefreshCw
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useApp } from '../contexts/AppContext';
import { Toast } from './Toast';
import { newsApi } from '../lib/newsApi';
import { ManageSourcesModal } from './ManageSourcesModal';
import { PremiumModal } from './PremiumModal';
import { validateZipCode } from '../lib/zipCodeUtils';
import { supabase } from '../lib/supabase';
import type { ThemeMode, DefaultFeed } from '../contexts/SettingsContext';

interface SettingsViewProps {
  onClose: () => void;
}

export const SettingsView = ({ onClose }: SettingsViewProps) => {
  const { themeMode, setThemeMode } = useTheme();
  const { user, signOut, refreshUser } = useAuth();
  const { settings, updateSetting } = useSettings();
  const { setShowAuthModal, userLocation, handleLocationSet, userZipCode } = useApp();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [zipCodeInput, setZipCodeInput] = useState(userZipCode || '');
  const [locationPreview, setLocationPreview] = useState<string>('');
  const [isValidatingZip, setIsValidatingZip] = useState(false);
  const [zipError, setZipError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (userLocation) {
      setLocationPreview(userLocation);
    }
  }, [userLocation]);

  useEffect(() => {
    if (zipCodeInput.length === 5) {
      const timeoutId = setTimeout(async () => {
        setIsValidatingZip(true);
        setZipError('');

        const location = await validateZipCode(zipCodeInput);

        if (location) {
          setLocationPreview(`${location.city}, ${location.stateCode}`);
          setZipError('');
        } else {
          setLocationPreview('');
          setZipError('Invalid ZIP code');
        }

        setIsValidatingZip(false);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setLocationPreview(userLocation || '');
      setZipError('');
    }
  }, [zipCodeInput, userLocation]);

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setZipCodeInput(value);
  };

  const handleUpdateLocation = async () => {
    if (zipCodeInput.length !== 5) {
      showToast('Please enter a valid 5-digit ZIP code', 'error');
      return;
    }

    const location = await validateZipCode(zipCodeInput);
    if (!location) {
      showToast('Invalid ZIP code', 'error');
      return;
    }

    try {
      await handleLocationSet(location);
      showToast(`Location updated to ${location.city}, ${location.stateCode}`);
    } catch (error) {
      showToast('Failed to update location', 'error');
    }
  };

  const handleThemeChange = async (mode: ThemeMode) => {
    setThemeMode(mode);
    await updateSetting('themeMode', mode);
    showToast('Theme updated');
  };

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    await updateSetting(key, value);
    showToast('Settings saved');
  };

  const handleTimeChange = async (time: string) => {
    await updateSetting('morningBriefingTime', time);
    showToast('Time updated');
  };

  const handleDefaultFeedChange = async (feed: DefaultFeed) => {
    await updateSetting('defaultFeed', feed);
    showToast('Default feed updated');
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const handleSignIn = () => {
    setShowAuthModal(true);
    onClose();
  };

  const handleRefreshNews = async () => {
    setIsRefreshing(true);
    try {
      const result = await newsApi.scrapeNews();
      if (result.success) {
        showToast(`Refreshed: ${result.inserted} new articles added`);
      } else {
        showToast('Failed to refresh news', 'error');
      }
    } catch (error) {
      showToast('Failed to refresh news', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSyncSubscription = async () => {
    if (!user) return;

    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast('Please sign in to sync subscription', 'error');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-subscription-status`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync subscription');
      }

      await refreshUser();

      if (result.isPremium) {
        showToast('🎉 Premium status activated!', 'success');
      } else {
        showToast('Subscription status synced', 'success');
      }
    } catch (error) {
      console.error('Sync error:', error);
      showToast('Failed to sync subscription status', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-white dark:bg-slate-900 z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 z-10">
          <div className="flex items-center justify-between px-4 h-14">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Settings</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
            >
              <X size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>

        <div className="px-4 py-6 pb-24 space-y-8">
          {user && (
            <div className="pb-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-nuuz-yellow to-nuuz-yellow-dark rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-slate-900">
                    {user.email?.[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {user.email?.split('@')[0]}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{user.email}</div>
                </div>
              </div>
            </div>
          )}

          <section>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Appearance
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => handleThemeChange('light')}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition ${
                  themeMode === 'light'
                    ? 'bg-nuuz-yellow/10 border-2 border-nuuz-yellow'
                    : 'bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sun size={20} className={themeMode === 'light' ? 'text-nuuz-yellow' : 'text-slate-600 dark:text-slate-400'} />
                  <span className="font-medium text-slate-900 dark:text-white">Light Mode</span>
                </div>
                {themeMode === 'light' && (
                  <div className="w-5 h-5 rounded-full bg-nuuz-yellow flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-900"></div>
                  </div>
                )}
              </button>

              <button
                onClick={() => handleThemeChange('dark')}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition ${
                  themeMode === 'dark'
                    ? 'bg-nuuz-yellow/10 border-2 border-nuuz-yellow'
                    : 'bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Moon size={20} className={themeMode === 'dark' ? 'text-nuuz-yellow' : 'text-slate-600 dark:text-slate-400'} />
                  <span className="font-medium text-slate-900 dark:text-white">Dark Mode</span>
                </div>
                {themeMode === 'dark' && (
                  <div className="w-5 h-5 rounded-full bg-nuuz-yellow flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-900"></div>
                  </div>
                )}
              </button>

              <button
                onClick={() => handleThemeChange('auto')}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition ${
                  themeMode === 'auto'
                    ? 'bg-nuuz-yellow/10 border-2 border-nuuz-yellow'
                    : 'bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Monitor size={20} className={themeMode === 'auto' ? 'text-nuuz-yellow' : 'text-slate-600 dark:text-slate-400'} />
                  <span className="font-medium text-slate-900 dark:text-white">Auto (System)</span>
                </div>
                {themeMode === 'auto' && (
                  <div className="w-5 h-5 rounded-full bg-nuuz-yellow flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-900"></div>
                  </div>
                )}
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Notifications
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell size={20} className="text-slate-600 dark:text-slate-400" />
                  <span className="font-medium text-slate-900 dark:text-white">
                    Enable Notifications
                  </span>
                </div>
                <button
                  onClick={() => handleToggle('enableNotifications', !settings.enableNotifications)}
                  className={`w-12 h-6 rounded-full relative transition ${
                    settings.enableNotifications ? 'bg-nuuz-yellow' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.enableNotifications ? 'right-0.5' : 'left-0.5'
                    }`}
                  ></div>
                </button>
              </div>

              {settings.enableNotifications && (
                <>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock size={20} className="text-slate-600 dark:text-slate-400" />
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          Morning Briefing
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          Daily news summary
                        </div>
                      </div>
                    </div>
                    <input
                      type="time"
                      value={settings.morningBriefingTime}
                      onChange={(e) => handleTimeChange(e.target.value)}
                      className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bell size={20} className="text-slate-600 dark:text-slate-400" />
                      <span className="font-medium text-slate-900 dark:text-white">
                        Breaking News Alerts
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggle('breakingNewsAlerts', !settings.breakingNewsAlerts)}
                      className={`w-12 h-6 rounded-full relative transition ${
                        settings.breakingNewsAlerts ? 'bg-nuuz-yellow' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          settings.breakingNewsAlerts ? 'right-0.5' : 'left-0.5'
                        }`}
                      ></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bell size={20} className="text-slate-600 dark:text-slate-400" />
                      <span className="font-medium text-slate-900 dark:text-white">
                        Category Updates
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggle('categoryUpdates', !settings.categoryUpdates)}
                      className={`w-12 h-6 rounded-full relative transition ${
                        settings.categoryUpdates ? 'bg-nuuz-yellow' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          settings.categoryUpdates ? 'right-0.5' : 'left-0.5'
                        }`}
                      ></div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>

          <section id="location-section">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Location
            </h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <MapPin size={20} className="text-slate-600 dark:text-slate-400" />
                <span className="font-medium text-slate-900 dark:text-white">
                  Local News ZIP Code
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={zipCodeInput}
                  onChange={handleZipCodeChange}
                  placeholder="Enter ZIP Code"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {isValidatingZip && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader className="animate-spin text-blue-600" size={16} />
                  </div>
                )}
              </div>
              {locationPreview && !zipError && (
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <span>📍</span>
                  <span>{locationPreview}</span>
                </div>
              )}
              {zipError && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {zipError}
                </div>
              )}
              <button
                onClick={handleUpdateLocation}
                disabled={zipCodeInput.length !== 5 || !!zipError || isValidatingZip}
                className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 active:scale-95 transition"
              >
                Update Location
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing news for your area
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Content
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Eye size={20} className="text-slate-600 dark:text-slate-400" />
                  <span className="font-medium text-slate-900 dark:text-white">
                    Hide Read Articles
                  </span>
                </div>
                <button
                  onClick={() => handleToggle('hideReadArticles', !settings.hideReadArticles)}
                  className={`w-12 h-6 rounded-full relative transition ${
                    settings.hideReadArticles ? 'bg-nuuz-yellow' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.hideReadArticles ? 'right-0.5' : 'left-0.5'
                    }`}
                  ></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp size={20} className="text-slate-600 dark:text-slate-400" />
                  <span className="font-medium text-slate-900 dark:text-white">
                    Show Trending Indicators
                  </span>
                </div>
                <button
                  onClick={() => handleToggle('showTrendingIndicators', !settings.showTrendingIndicators)}
                  className={`w-12 h-6 rounded-full relative transition ${
                    settings.showTrendingIndicators ? 'bg-nuuz-yellow' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.showTrendingIndicators ? 'right-0.5' : 'left-0.5'
                    }`}
                  ></div>
                </button>
              </div>

              <button
                onClick={handleRefreshNews}
                disabled={isRefreshing}
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <RefreshCw size={20} className={`text-slate-600 dark:text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <div className="text-left">
                    <div className="font-medium text-slate-900 dark:text-white">
                      Refresh News
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Fetch latest articles from all sources
                    </div>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
              </button>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <label className="block mb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <Compass size={20} className="text-slate-600 dark:text-slate-400" />
                    <span className="font-medium text-slate-900 dark:text-white">
                      Default Feed
                    </span>
                  </div>
                  <select
                    value={settings.defaultFeed}
                    onChange={(e) => handleDefaultFeedChange(e.target.value as DefaultFeed)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="discover">Discover</option>
                    <option value="local">Local</option>
                    <option value="for-you">For You</option>
                  </select>
                </label>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Following
            </h3>
            <button
              onClick={() => setShowSourcesModal(true)}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <div className="flex items-center gap-3">
                <Users size={20} className="text-slate-600 dark:text-slate-400" />
                <div className="text-left">
                  <div className="font-medium text-slate-900 dark:text-white">
                    Manage My Sources
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Add custom RSS feeds
                  </div>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-400" />
            </button>
          </section>

          {user ? (
            <>
              <section>
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Premium
                </h3>
                {user.isPremium ? (
                  <div className="p-4 bg-gradient-to-br from-nuuz-yellow/20 to-amber-100 dark:from-nuuz-yellow/10 dark:to-amber-900/20 rounded-lg border-2 border-nuuz-yellow/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-nuuz-yellow rounded-full flex items-center justify-center">
                        <Star size={20} className="text-slate-900 fill-slate-900" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">Premium Member</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Ad-free experience active</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {user.subscriptionExpiresAt && (
                        <div className="text-sm text-slate-700 dark:text-slate-300">
                          Renews on {new Date(user.subscriptionExpiresAt).toLocaleDateString()}
                        </div>
                      )}
                      <div className="pt-2 border-t border-nuuz-yellow/30">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Thank you for supporting quality journalism!
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-nuuz-yellow/20 rounded-full flex items-center justify-center">
                        <Star size={20} className="text-nuuz-yellow" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">Upgrade to Premium</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Enjoy an ad-free experience</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowPremiumModal(true)}
                        className="w-full py-3 bg-gradient-to-r from-nuuz-yellow to-amber-400 text-slate-900 font-bold rounded-lg hover:from-nuuz-yellow-dark hover:to-amber-500 active:scale-95 transition"
                      >
                        Upgrade Now
                      </button>
                      <button
                        onClick={handleSyncSubscription}
                        disabled={isSyncing}
                        className="w-full py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-50"
                      >
                        {isSyncing ? 'Syncing...' : 'Sync Subscription Status'}
                      </button>
                    </div>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-nuuz-yellow rounded-full"></div>
                        No advertisements
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-nuuz-yellow rounded-full"></div>
                        Support independent journalism
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-nuuz-yellow rounded-full"></div>
                        Premium features coming soon
                      </li>
                    </ul>
                  </div>
                )}
              </section>

              <section>
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Account
                </h3>

                <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    {user.avatar && (
                      <img
                        src={user.avatar}
                        alt={user.fullName || user.email}
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                        {user.fullName || 'User'}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition font-medium"
                >
                  <LogOut size={20} />
                  <span>Sign Out</span>
                </button>
              </section>
            </>
          ) : (
            <section>
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Account
              </h3>
              <button
                onClick={handleSignIn}
                className="w-full flex items-center justify-center gap-2 p-4 bg-nuuz-yellow text-slate-900 rounded-lg hover:bg-nuuz-yellow-dark transition font-medium"
              >
                Sign in to sync your preferences
              </button>
            </section>
          )}

          <section>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              About
            </h3>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <div className="flex items-center gap-3">
                  <Shield size={20} className="text-slate-600 dark:text-slate-400" />
                  <span className="font-medium text-slate-900 dark:text-white">Privacy Policy</span>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
              </button>

              <button className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-slate-600 dark:text-slate-400" />
                  <span className="font-medium text-slate-900 dark:text-white">Terms of Service</span>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
              </button>

              <button className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <div className="flex items-center gap-3">
                  <MessageCircle size={20} className="text-slate-600 dark:text-slate-400" />
                  <span className="font-medium text-slate-900 dark:text-white">Send Feedback</span>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
              </button>

              <button className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <div className="flex items-center gap-3">
                  <Star size={20} className="text-slate-600 dark:text-slate-400" />
                  <span className="font-medium text-slate-900 dark:text-white">Rate the App</span>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
              </button>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Info size={20} className="text-slate-600 dark:text-slate-400" />
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">Nuuz</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Version 1.0.0</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {showSourcesModal && (
        <ManageSourcesModal
          onClose={() => setShowSourcesModal(false)}
          onSourceAdded={(source, articles) => {
            showToast(
              `${source.name} added successfully! Found ${articles.length} articles in ${source.category}.`,
              'success'
            );
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }}
        />
      )}

      {showPremiumModal && (
        <PremiumModal
          onClose={() => setShowPremiumModal(false)}
        />
      )}
    </>
  );
};
