
import Link from 'next/link';
import { Code } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils'; // Import cn

export default function Header() {
  return (
    <header className={cn(
        "w-full border-b bg-card shadow-sm sticky top-0 z-40 backdrop-blur-sm bg-opacity-90", // Make header sticky and slightly transparent
        "transition-all duration-300" // Add transition for potential future effects
        )}>
      <div className="container flex h-16 items-center mx-auto px-4 sm:px-6 lg:px-8"> {/* Increased height and padding */}
        <Link href="/" className="flex items-center space-x-2 mr-auto group">
          <Code className="h-7 w-7 text-primary transition-transform group-hover:rotate-[-15deg]" /> {/* Slightly larger icon, hover effect */}
          <span className="font-bold text-xl text-foreground group-hover:text-primary transition-colors"> {/* Larger text, hover color change */}
             Self-Learn
          </span>
        </Link>
        {/* Optional: Add navigation links here if needed */}
        {/* <nav className="hidden md:flex space-x-4">
          <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-primary">About</Link>
          <Link href="/courses" className="text-sm font-medium text-muted-foreground hover:text-primary">Courses</Link>
        </nav> */}
        <div className="ml-4"> {/* Add margin for spacing */}
            <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
