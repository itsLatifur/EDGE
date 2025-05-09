'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SCROLL_THRESHOLD = 200; // Pixels scrolled before button appears

export default function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > SCROLL_THRESHOLD) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    // Cleanup listener on component unmount
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={scrollToTop}
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 h-11 w-11 rounded-full shadow-lg',
        'bg-background/80 backdrop-blur-sm hover:bg-accent', // Semi-transparent background
        // Animation classes
        'transition-all duration-300 ease-out', // Combined transition for opacity and transform
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none', // Fade in/out with scale
        'hover:scale-110 focus-visible:scale-110' // Hover/Focus scale animation
      )}
      aria-label="Scroll back to top"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}
