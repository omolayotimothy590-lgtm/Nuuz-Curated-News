import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type DefaultFeed = 'discover' | 'local' | 'for-you';

export interface UserSettings {
  themeMode: ThemeMode;
  enableNotifications: boolean;
  morningBriefingTime: string;
  breakingNewsAlerts: boolean;
  categoryUpdates: boolean;
  hideReadArticles: boolean;
  showTrendingIndicators: boolean;
  defaultFeed: DefaultFeed;
}

interface SettingsContextType {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => Promise<void>;
  isLoading: boolean;
}

const defaultSettings: UserSettings = {
  themeMode: 'auto',
  enableNotifications: true,
  morningBriefingTime: '08:00',
  breakingNewsAlerts: true,
  categoryUpdates: false,
  hideReadArticles: false,
  showTrendingIndicators: true,
  defaultFeed: 'discover',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('userSettings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserSettings();
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);

  const loadUserSettings = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.settings) {
        setSettings({ ...defaultSettings, ...data.settings });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    if (user) {
      try {
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            email: user.email,
            full_name: user.fullName,
            avatar_url: user.avatar,
            settings: newSettings,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'email'
          });

        if (error) throw error;
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
};
