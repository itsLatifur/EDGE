'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; // Import Button
import { Progress } from '@/components/ui/progress';
import { Star, Award, CheckSquare, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

   // Redirect to login if user is not authenticated and not loading
    useEffect(() => {
        if (!loading && !user) {
        router.push('/auth');
        }
    }, [user, loading, router]);

   const getInitials = (name: string | null | undefined): string => {
      if (!name) return "?";
      const names = name.split(' ');
      if (names.length === 1) return names[0].charAt(0).toUpperCase();
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
  }

  // Placeholder for fetching detailed progress, replace with actual data fetching
  // TODO: Fetch real progress data based on userProgress context or Firestore
  const learningProgress = {
      html: 75, // Example Percentage completion
      css: 40,
      javascript: 15,
  };

  // Skeleton for loading state
  if (loading || (!user && !loading)) { // Show skeleton if loading OR if not loading and no user (before redirect)
    return (
      <div className="space-y-6 sm:space-y-8 animate-pulse mt-6 sm:mt-8 lg:mt-10">
        <Card>
          <CardHeader className="flex flex-col items-center space-y-4 p-4 sm:p-6 text-center sm:flex-row sm:items-start sm:space-y-0 sm:space-x-6 sm:text-left">
            <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full" />
            <div className="space-y-2 flex-grow">
              <Skeleton className="h-6 w-3/4 sm:w-48 mx-auto sm:mx-0" />
              <Skeleton className="h-4 w-full sm:w-64 mx-auto sm:mx-0" />
              <Skeleton className="h-5 w-24 mx-auto sm:mx-0" />
              <Skeleton className="h-4 w-32 mx-auto sm:mx-0" />
            </div>
          </CardHeader>
        </Card>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
           <Card><CardHeader><Skeleton className="h-5 w-32 mb-2" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
           <Card><CardHeader><Skeleton className="h-5 w-32 mb-2" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
           <Card><CardHeader><Skeleton className="h-5 w-32 mb-2" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  // Render profile only if user and userProfile exist
   if (!user || !userProfile) {
     // This state should ideally not be reached due to redirect, but acts as a safeguard
     return <div className="mt-10 text-center text-muted-foreground">Redirecting or loading...</div>;
   }


  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn mt-6 sm:mt-8 lg:mt-10">
      {/* User Info Card */}
      <Card className="overflow-hidden shadow-md">
        <CardHeader className="flex flex-col items-center space-y-4 bg-muted/30 p-4 sm:p-6 text-center sm:flex-row sm:items-start sm:space-y-0 sm:space-x-6 sm:text-left">
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-background shadow-lg">
            {/* Use userProfile avatar if available, otherwise fallback */}
            {userProfile.avatarUrl && <AvatarImage src={userProfile.avatarUrl} alt={userProfile.displayName} />}
            <AvatarFallback className="text-3xl sm:text-4xl">
              {getInitials(userProfile.displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-grow space-y-1">
            <CardTitle className="text-xl sm:text-2xl font-semibold">{userProfile.displayName}</CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground">{userProfile.email}</CardDescription>
            <div className="flex items-center justify-center space-x-2 pt-2 sm:justify-start">
               <Star className="h-5 w-5 text-amber-500 fill-current" />
               <span className="text-lg font-semibold text-foreground">{userProfile.points} Points</span>
            </div>
             <p className="text-xs text-muted-foreground pt-1">
                Member since: {userProfile.createdAt instanceof Date ? userProfile.createdAt.toLocaleDateString() : 'N/A'}
             </p>
          </div>
        </CardHeader>
      </Card>

      {/* Gamification & Progress Overview - Responsive Grid */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Badges Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Award className="h-5 w-5 text-primary" />
              Earned Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userProfile.badges.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {userProfile.badges.map((badgeId) => (
                  <Badge key={badgeId} variant="secondary" className="text-xs capitalize py-1 px-2.5">
                    {badgeId.replace(/-/g, ' ')} {/* Basic formatting */}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No badges earned yet. Complete video playlists to earn them!</p>
            )}
          </CardContent>
        </Card>

        {/* Learning Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CheckSquare className="h-5 w-5 text-green-600" />
              Playlist Progress (Example)
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Overall completion percentage for each topic.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-xs sm:text-sm font-medium">
                <span>HTML</span>
                <span className="text-muted-foreground">{learningProgress.html}%</span>
              </div>
              <Progress value={learningProgress.html} aria-label="HTML Progress" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs sm:text-sm font-medium">
                <span>CSS</span>
                <span className="text-muted-foreground">{learningProgress.css}%</span>
              </div>
              <Progress value={learningProgress.css} aria-label="CSS Progress" indicatorClassName="bg-[hsl(var(--chart-2))]" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs sm:text-sm font-medium">
                <span>JavaScript</span>
                <span className="text-muted-foreground">{learningProgress.javascript}%</span>
              </div>
              <Progress value={learningProgress.javascript} aria-label="JavaScript Progress" indicatorClassName="bg-[hsl(var(--chart-3))]" />
            </div>
             {/* Add link back to video dashboard */}
             <Button variant="outline" size="sm" onClick={() => router.push('/videos')} className="mt-3 sm:mt-4 w-full sm:w-auto">
                Go to Videos
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity Card (Placeholder) */}
         <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="h-5 w-5 text-blue-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
             {/* TODO: This should be dynamically populated based on UserProgress */}
            <p className="text-sm text-muted-foreground">No recent activity tracked yet.</p>
            {/* Example:
            <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Completed "HTML Basics" - +10 points</li>
                <li>Watched 15 mins of "CSS Flexbox"</li>
            </ul>
             */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
