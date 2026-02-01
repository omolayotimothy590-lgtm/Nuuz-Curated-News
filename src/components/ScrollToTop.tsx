import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 z-40 p-3 bg-nuuz-yellow hover:bg-yellow-500 active:bg-yellow-600 text-white rounded-full shadow-lg transition active:scale-95"
          aria-label="Scroll to top"
        >
          <ArrowUp size={24} strokeWidth={2} />
        </button>
      )}
    </>
  );
};
