import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { useStore } from '../store';

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const { compareIds } = useStore();

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`fixed ${compareIds.length > 0 ? 'bottom-[210px]' : 'bottom-24'} sm:bottom-8 right-4 sm:right-8 p-3 bg-orange-600 text-white rounded-full shadow-lg hover:bg-orange-500 hover:scale-110 transition-all z-50 flex items-center justify-center border border-orange-400/30 backdrop-blur-sm`}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
