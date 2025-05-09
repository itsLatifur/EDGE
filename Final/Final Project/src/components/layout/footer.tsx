
import { cn } from '@/lib/utils'; // Import cn

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className={cn(
        "border-t py-8 mt-16 bg-muted/50", // Increased padding and margin-top
        "text-center"
        )}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          © {currentYear} Self-Learn. All rights reserved.
        </p>
        {/* Optional: Add more links or info */}
        {/* <p className="text-xs text-muted-foreground/70 mt-2">
          Built with Next.js & ShadCN UI.
        </p> */}
      </div>
    </footer>
  );
}
