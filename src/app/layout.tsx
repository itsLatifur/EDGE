
import type { Metadata } from 'next';
// Swapping Inter for a more distinct font like Poppins or Lato
import { Poppins } from 'next/font/google'; // Example: Using Poppins
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { cn } from '@/lib/utils'; // Import cn

// Configure the chosen font
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // Include desired weights
  variable: '--font-sans', // Assign to CSS variable
});

export const metadata: Metadata = {
  title: 'Self-Learn | Interactive Web Dev Tutorials', // More descriptive title
  description: 'Master HTML, CSS, and JavaScript with interactive video playlists on Self-Learn.',
  // Add icons and manifest later if needed
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          `${poppins.variable} font-sans`, // Apply font variable and class
          "antialiased", // Smoother font rendering
          "flex flex-col min-h-screen bg-background text-foreground" // Base layout structure
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false} // Allow theme transitions
        >
          <Header />
          {/* Main content with better padding */}
          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
             {children}
          </main>
          <Footer />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
