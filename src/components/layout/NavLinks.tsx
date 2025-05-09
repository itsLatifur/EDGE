// src/components/layout/NavLinks.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_LINKS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface NavLinksProps {
  className?: string;
  linkClassName?: string;
  onClick?: () => void; // For closing mobile menu on navigation
}

export function NavLinks({ className, linkClassName, onClick }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)}>
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onClick}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname.startsWith(link.href) ? "text-primary" : "text-muted-foreground",
            linkClassName
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
