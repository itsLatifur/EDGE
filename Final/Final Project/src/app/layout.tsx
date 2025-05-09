
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { AuthProvider } from '@/context/auth-context'; // Import AuthProvider
import { cn } from '@/lib/utils';
import BackToTopButton from '@/components/back-to-top-button'; // Import BackToTopButton
import ContinueLearningButton from '@/components/continue-learning-button'; // Import ContinueLearningButton


const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Self-Learn | Interactive Web Dev Tutorials',
  description: 'Master HTML, CSS, and JavaScript with interactive video playlists on Self-Learn.',
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
          `${poppins.variable} font-sans`,
          "antialiased",
          "flex flex-col min-h-screen bg-background text-foreground"
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AuthProvider> {/* Wrap content with AuthProvider */}
            <Header />
             {/* Responsive padding for main content */}
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 relative">
               {children}
            </main>
            <Footer />
            <Toaster />
            <ContinueLearningButton /> {/* Add Continue Learning Button */}
            <BackToTopButton /> {/* Add Back to Top Button */}
          </AuthProvider> {/* Close AuthProvider */}
        </ThemeProvider>
      </body>
    </html>
  );
}
