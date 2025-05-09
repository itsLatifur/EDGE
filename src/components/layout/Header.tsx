// src/components/layout/Header.tsx
import { Logo } from '@/components/shared/Logo';
import { NavLinks } from './NavLinks';
import { ThemeToggle } from './ThemeToggle';
import { MobileNavMenu } from './MobileNavMenu';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left Area: MobileNavMenu on mobile, Logo on desktop */}
        <div className="flex items-center">
          <div className="md:hidden">
            <MobileNavMenu />
          </div>
          <div className="hidden md:block">
            <Logo />
          </div>
        </div>

        {/* Center Area: Logo on mobile, NavLinks on desktop */}
        <div>
          <div className="md:hidden">
            <Logo />
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <NavLinks />
          </div>
        </div>
        
        {/* Right Area: ThemeToggle on both mobile and desktop */}
        <div className="flex items-center">
          <ThemeToggle />
        </div>
        
      </div>
    </header>
  );
}

