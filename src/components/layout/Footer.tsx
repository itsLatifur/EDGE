// src/components/layout/Footer.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export function Footer() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    if (footerRef.current) {
      const footerHeight = footerRef.current.offsetHeight;
      document.documentElement.style.setProperty('--footer-height', `${footerHeight}px`);
    }
  }, [currentYear]); // Re-calculate if content changes that might affect height

  return (
    <footer ref={footerRef} className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-muted-foreground text-xs md:text-sm">
        <p>
          &copy; {currentYear !== null ? currentYear : <span className="inline-block w-10 h-4 bg-muted-foreground/20 rounded animate-pulse" />} All rights reserved by developer{' '}
          <Link href="https://latifur.netlify.app/" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
            Latifur
          </Link>.
        </p>
      </div>
    </footer>
  );
}
