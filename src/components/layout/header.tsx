
'use client';

import Link from 'next/link';
import { Code, LogIn, LogOut, UserCircle, Star, Menu, BookOpen, PlaySquare, Flame } from 'lucide-react'; // Added Flame
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
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet";
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, usePathname } from 'next/navigation';
import React from 'react'; // Import React

export default function Header() {
  const { user, userProfile, isGuest, loading, signOutUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOutUser();
    router.push('/');
  };

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "?";
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
  }

  const navItems = [
    { href: "/videos", label: "Videos", icon: PlaySquare },
    { href: "/blogs", label: "Blogs/Links", icon: BookOpen },
    // { href: "/leaderboard", label: "Leaderboard", icon: Users }, // Example: Add Leaderboard link
  ];

  return (
    <header className={cn(
        "w-full border-b bg-card shadow-sm sticky top-0 z-40 backdrop-blur-sm bg-opacity-90",
        "transition-all duration-300" // Global transition for potential future changes
        )}>
      <div className="container flex h-16 items-center justify-between mx-auto px-4 sm:px-6 lg:px-8 relative"> {/* Added justify-between and relative */}

        {/* Left Side (Mobile Menu Trigger / Desktop Logo + Nav) */}
        <div className="flex items-center">
            {/* Mobile Menu Trigger */}
            <div className="md:hidden mr-auto"> {/* Use mr-auto to push it left */}
                <Sheet>
                    <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle Navigation Menu</span>
                    </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 sm:w-72 p-0 flex flex-col">
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle className="flex items-center gap-2">
                            <Code className="h-6 w-6 text-primary" />
                            <span className="font-bold text-lg">Self-Learn</span>
                        </SheetTitle>
                    </SheetHeader>
                    <nav className="flex flex-col space-y-1 p-4 flex-grow overflow-y-auto">
                        {navItems.map((item) => (
                        <SheetClose asChild key={item.href}>
                            <Link
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors duration-200", // Added transition
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background", // Custom focus for sheet items
                                pathname.startsWith(item.href)
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground"
                            )}
                            >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                            </Link>
                        </SheetClose>
                        ))}
                        <hr className="my-3 border-border" />
                        {!isGuest && !loading && (
                        <SheetClose asChild>
                            <Link
                            href="/profile"
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors duration-200",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                                pathname === '/profile'
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground"
                            )}
                            >
                            <UserCircle className="h-5 w-5" />
                            Profile
                            </Link>
                        </SheetClose>
                        )}
                    </nav>
                    <div className="p-4 border-t mt-auto">
                        {loading ? (
                            <Skeleton className="h-9 w-full rounded-md" />
                        ) : !isGuest && user ? (
                            <Button variant="outline" className="w-full" onClick={handleSignOut}>
                                <LogOut className="mr-2 h-4 w-4" /> Log Out
                            </Button>
                        ) : (
                            <SheetClose asChild>
                                <Button variant="default" className="w-full" asChild>
                                    <Link href="/auth">
                                        <LogIn className="mr-2 h-4 w-4" /> Sign In / Register
                                    </Link>
                                </Button>
                            </SheetClose>
                        )}
                    </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop Logo & Navigation */}
            <div className="hidden md:flex items-center"> {/* Removed flex-grow */}
                <Link href="/" className="flex items-center space-x-2 mr-4 md:mr-6 group flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm">
                    <Code className="h-6 w-6 sm:h-7 sm:w-7 text-primary transition-transform duration-300 group-hover:rotate-[-15deg]" />
                    <span className="font-bold text-lg sm:text-xl text-foreground group-hover:text-primary transition-colors duration-200 hidden sm:inline">
                        Self-Learn
                    </span>
                </Link>

                <NavigationMenu>
                    <NavigationMenuList>
                        {navItems.map((item) => (
                            <NavigationMenuItem key={item.href}>
                                <Link href={item.href} legacyBehavior passHref>
                                <NavigationMenuLink
                                    className={cn(
                                        navigationMenuTriggerStyle(),
                                        "transition-colors duration-200", // Added transition
                                        pathname.startsWith(item.href) ? 'bg-accent text-accent-foreground' : '',
                                        "px-3 lg:px-4"
                                    )}
                                    active={pathname.startsWith(item.href)}
                                >
                                    <item.icon className="h-4 w-4 mr-1.5" />
                                    {item.label}
                                </NavigationMenuLink>
                                </Link>
                            </NavigationMenuItem>
                        ))}
                    </NavigationMenuList>
                </NavigationMenu>
            </div>
        </div>

        {/* Centered Logo (Mobile Only) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden">
            <Link href="/" className="flex items-center space-x-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm">
                <Code className="h-6 w-6 text-primary transition-transform duration-300 group-hover:rotate-[-15deg]" />
                <span className="font-bold text-lg text-foreground group-hover:text-primary transition-colors duration-200">
                    Self-Learn
                </span>
            </Link>
        </div>


        {/* Right Side (Auth/Theme Toggle) */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto"> {/* Use ml-auto to push it right */}
            {/* Gamification/Points/Streak Display */}
            {!isGuest && userProfile && !loading && (
                <div className="hidden sm:flex items-center gap-3 mr-2 text-sm font-medium">
                    {/* Points */}
                    <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                        <Star className="h-4 w-4 fill-current" />
                        <span>{userProfile.points} pts</span>
                    </div>
                    {/* Streak */}
                    {userProfile.currentStreak > 0 && (
                        <div className="flex items-center gap-1 text-orange-500 dark:text-orange-400">
                            <Flame className="h-4 w-4" />
                            <span>{userProfile.currentStreak}</span>
                        </div>
                    )}
                </div>
            )}
            {loading && !isGuest && <Skeleton className="h-6 w-24 mr-2 rounded-md hidden sm:block" /> }

           <ThemeToggle />

           <div className="flex items-center"> {/* Hide on mobile (auth is in sheet), show on md+ */}
               {loading ? (
                 <Skeleton className="h-9 w-9 rounded-full md:h-9 md:w-24 md:rounded-md" /> // Show round skeleton on mobile like avatar
               ) : !isGuest && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2">
                       <Avatar className="h-8 w-8">
                         {userProfile?.avatarUrl && <AvatarImage src={userProfile.avatarUrl} alt={userProfile.displayName} />}
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
                        {/* Points and Streak in Dropdown */}
                        <div className="flex items-center gap-3 pt-1.5">
                            <div className="flex items-center gap-1 text-xs text-amber-500 dark:text-amber-400">
                               <Star className="h-3 w-3 fill-current" />
                               <span>{userProfile?.points ?? 0} points</span>
                            </div>
                            {userProfile && userProfile.currentStreak > 0 && (
                                <div className="flex items-center gap-1 text-xs text-orange-500 dark:text-orange-400">
                                   <Flame className="h-3 w-3" />
                                   <span>{userProfile.currentStreak} day streak</span>
                                </div>
                            )}
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer focus:bg-accent">
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>Profile & Progress</span>
                     </DropdownMenuItem>
                     <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                       <LogOut className="mr-2 h-4 w-4" />
                       <span>Log out</span>
                     </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
               ) : (
                 // Hide Sign In button on mobile as it's in the sheet
                 <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
                    <Link href="/auth">
                     <LogIn className="mr-2 h-4 w-4" />
                     Sign In / Register
                    </Link>
                  </Button>
               )}
            </div>
        </div>
      </div>
    </header>
  );
}
