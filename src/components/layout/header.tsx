
'use client';

import Link from 'next/link';
import { Code, LogIn, LogOut, UserCircle, Star } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation'; // Use Next.js router

export default function Header() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter(); // Get router instance

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/'); // Redirect to home page after sign out
    } catch (error) {
      console.error("Error signing out: ", error);
      // Handle error (e.g., show toast notification)
    }
  };

  const getInitials = (name: string | null | undefined): string => {
      if (!name) return "?";
      const names = name.split(' ');
      if (names.length === 1) return names[0].charAt(0).toUpperCase();
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
  }

  return (
    <header className={cn(
        "w-full border-b bg-card shadow-sm sticky top-0 z-40 backdrop-blur-sm bg-opacity-90",
        "transition-all duration-300"
        )}>
      <div className="container flex h-16 items-center mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2 mr-auto group">
          <Code className="h-7 w-7 text-primary transition-transform group-hover:rotate-[-15deg]" />
          <span className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
             Self-Learn
          </span>
        </Link>

        {/* Gamification/Points Display */}
         {user && userProfile && !loading && (
            <div className="flex items-center gap-1 mr-4 text-sm font-medium text-amber-500 dark:text-amber-400">
                <Star className="h-4 w-4 fill-current" />
                <span>{userProfile.points} pts</span>
            </div>
         )}
         {loading && <Skeleton className="h-6 w-16 mr-4 rounded-md" /> }


        {/* Auth Section */}
        <div className="flex items-center gap-4">
           <ThemeToggle />
           {loading ? (
             <Skeleton className="h-10 w-10 rounded-full" />
           ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                   <Avatar className="h-9 w-9">
                     {/* Add AvatarImage if user has profile picture URL */}
                     {/* <AvatarImage src={userProfile?.photoURL || undefined} alt={userProfile?.displayName || 'User'} /> */}
                     <AvatarFallback>{getInitials(userProfile?.displayName)}</AvatarFallback>
                   </Avatar>
                 </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile?.displayName || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                 </DropdownMenuItem>
                 {/* Add other menu items like Settings, etc. */}
                 <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                   <LogOut className="mr-2 h-4 w-4" />
                   <span>Log out</span>
                 </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
           ) : (
             <Button asChild variant="outline" size="sm">
                <Link href="/auth">
                 <LogIn className="mr-2 h-4 w-4" />
                 Sign In
                </Link>
              </Button>
           )}
        </div>
      </div>
    </header>
  );
}
