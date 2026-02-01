import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';
type AppliedTheme = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  appliedTheme: AppliedTheme;
  theme: AppliedTheme;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

const getSystemTheme = (): AppliedTheme => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('themeMode') as ThemeMode;
    return saved || 'auto';
  });

  const [appliedTheme, setAppliedTheme] = useState<AppliedTheme>(() => {
    if (themeMode === 'auto') {
      return getSystemTheme();
    }
    return themeMode as AppliedTheme;
  });

  useEffect(() => {
    if (themeMode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setAppliedTheme(e.matches ? 'dark' : 'light');
      };

      setAppliedTheme(getSystemTheme());
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setAppliedTheme(themeMode as AppliedTheme);
    }
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);

    if (appliedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode, appliedTheme]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const toggleTheme = () => {
    setThemeModeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ themeMode, appliedTheme, theme: appliedTheme, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
