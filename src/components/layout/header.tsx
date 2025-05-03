'use client';

import Link from 'next/link';
import { Code, LogIn, LogOut, UserCircle, Star, Menu, BookOpen, PlaySquare } from 'lucide-react';
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
    // Add profile link conditionally for mobile sheet if logged in
    // { href: "/profile", label: "Profile", icon: UserCircle, loggedInOnly: true }
  ];

  return (
    <header className={cn(
        "w-full border-b bg-card shadow-sm sticky top-0 z-40 backdrop-blur-sm bg-opacity-90",
        "transition-all duration-300"
        )}>
      <div className="container flex h-16 items-center mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Menu Trigger */}
        <div className="md:hidden mr-3">
           <Sheet>
             <SheetTrigger asChild>
               <Button variant="ghost" size="icon">
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
                 {/* Optional Description */}
                 {/* <SheetDescription>
                     Navigate through learning resources.
                 </SheetDescription> */}
               </SheetHeader>
               <nav className="flex flex-col space-y-1 p-4 flex-grow overflow-y-auto">
                  {navItems.map((item) => {
                    // Conditionally render profile link
                    // if (item.loggedInOnly && (isGuest || loading)) return null;

                    return (
                      <SheetClose asChild key={item.href}>
                         <Link
                           href={item.href}
                           className={cn(
                             "flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors",
                             pathname.startsWith(item.href)
                               ? "bg-accent text-accent-foreground"
                               : "text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground"
                           )}
                         >
                           <item.icon className="h-5 w-5" />
                           {item.label}
                         </Link>
                       </SheetClose>
                    );
                  })}
                   {/* Separator */}
                  <hr className="my-3 border-border" />
                  {/* Profile link specifically for mobile sheet if logged in */}
                  {!isGuest && !loading && (
                       <SheetClose asChild>
                         <Link
                           href="/profile"
                           className={cn(
                             "flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors",
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
                {/* Auth buttons at the bottom of the sheet */}
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

         {/* Desktop Logo & Navigation - Use flex grow to push auth to right */}
        <div className="flex items-center flex-grow">
            <Link href="/" className="flex items-center space-x-2 mr-4 md:mr-6 group flex-shrink-0">
            <Code className="h-6 w-6 sm:h-7 sm:w-7 text-primary transition-transform group-hover:rotate-[-15deg]" />
            <span className="font-bold text-lg sm:text-xl text-foreground group-hover:text-primary transition-colors hidden sm:inline">
                Self-Learn
            </span>
            </Link>

            {/* Desktop Navigation */}
            <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
                {navItems.map((item) => {
                    // if (item.loggedInOnly) return null; // Don't show profile in main nav
                    return (
                    <NavigationMenuItem key={item.href}>
                        <Link href={item.href} legacyBehavior passHref>
                        <NavigationMenuLink
                            className={cn(
                                navigationMenuTriggerStyle(),
                                pathname.startsWith(item.href) ? 'bg-accent text-accent-foreground' : '',
                                "px-3 lg:px-4" // Adjust padding
                            )}
                            active={pathname.startsWith(item.href)}
                        >
                            <item.icon className="h-4 w-4 mr-1.5" />
                            {item.label}
                        </NavigationMenuLink>
                        </Link>
                    </NavigationMenuItem>
                    );
                })}
            </NavigationMenuList>
            </NavigationMenu>
        </div>


        {/* Auth Section & Theme Toggle (Right Aligned) */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto flex-shrink-0">
            {/* Gamification/Points Display */}
            {!isGuest && userProfile && !loading && (
                <div className="hidden sm:flex items-center gap-1 mr-2 text-sm font-medium text-amber-500 dark:text-amber-400">
                    <Star className="h-4 w-4 fill-current" />
                    <span>{userProfile.points} pts</span>
                </div>
            )}
            {loading && !isGuest && <Skeleton className="h-6 w-16 mr-2 rounded-md hidden sm:block" /> }

           <ThemeToggle />

           <div className="hidden md:flex items-center gap-2"> {/* Hide on mobile, show on md+ */}
               {loading ? (
                 <Skeleton className="h-9 w-24 rounded-md" />
               ) : !isGuest && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
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
                        {/* Show points in dropdown too */}
                        <div className="flex items-center gap-1 pt-1 text-xs text-amber-500 dark:text-amber-400">
                           <Star className="h-3 w-3 fill-current" />
                           <span>{userProfile?.points ?? 0} points</span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={() => router.push('/profile')}>
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>Profile & Progress</span>
                     </DropdownMenuItem>
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
