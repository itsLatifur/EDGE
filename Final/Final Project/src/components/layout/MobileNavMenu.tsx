// src/components/layout/MobileNavMenu.tsx
"use client";

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { NavLinks } from './NavLinks';
import { Logo } from '@/components/shared/Logo';

export function MobileNavMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader className="mb-6">
          <SheetTitle>
            <Logo />
          </SheetTitle>
        </SheetHeader>
        <NavLinks 
          className="flex-col space-x-0 space-y-4 items-start" 
          linkClassName="text-lg"
          onClick={() => setIsOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
