import Link from 'next/link';
import { Code } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-14 items-center mx-auto px-4">
        <Link href="/" className="flex items-center space-x-2 mr-auto">
          <Code className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg text-primary">Self-Learn</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
