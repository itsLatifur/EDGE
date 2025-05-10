// src/components/admin/AdminSidebar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Video, BookOpen, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Separator } from '../ui/separator';

const adminNavLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/videos', label: 'Manage Videos', icon: Video },
  { href: '/admin/resources', label: 'Manage Resources', icon: BookOpen },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col shadow-lg">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold text-primary">Admin Panel</h2>
      </div>
      <nav className="flex-grow p-4 space-y-2">
        {adminNavLinks.map((link) => (
          <Button
            key={link.href}
            asChild
            variant={pathname === link.href ? 'secondary' : 'ghost'}
            className={cn(
              "w-full justify-start",
              pathname === link.href && "font-semibold"
            )}
          >
            <Link href={link.href}>
              <link.icon className="mr-2 h-5 w-5" />
              {link.label}
            </Link>
          </Button>
        ))}
      </nav>
      <Separator />
      <div className="p-4 mt-auto border-t">
        <Button variant="outline" className="w-full justify-start" onClick={logout}>
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
