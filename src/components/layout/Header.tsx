// src/components/layout/Header.tsx
import { Logo } from '@/components/shared/Logo';
import { NavLinks } from './NavLinks';
import { ThemeToggle } from './ThemeToggle';
import { MobileNavMenu } from './MobileNavMenu';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <div className="hidden md:flex items-center space-x-4">
          <NavLinks />
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <MobileNavMenu />
        </div>
      </div>
    </header>
  );
}
