import { useTheme } from '../contexts/ThemeContext';

export const Logo = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <img
      src={isDarkMode ? "/Black-and-Yellow-Idea-Creative-Agency-Logo copy copy.png" : "/nuuz copy copy.png"}
      alt="Nuuz - Trending News"
      className="h-10 w-auto"
      height="40"
    />
  );
};
