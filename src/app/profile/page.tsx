
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Star, Award, CheckSquare, Clock, Flame, Trophy, Users, BarChart3 } from 'lucide-react'; // Added Flame, Trophy, Users, BarChart3
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { BADGE_IDS, BadgeId } from '@/types'; // Import BADGE_IDS and BadgeId
import { getLeaderboard, LeaderboardEntry } from '@/services/user-progress'; // Import leaderboard service
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip components

// Mock Badge details (replace with actual data source if needed)
const badgeDetailsMap: Record<BadgeId, { name: string; description: string; icon: React.ElementType }> = {
    [BADGE_IDS.HTML_MASTER]: { name: 'HTML Master', description: 'Completed the HTML Learning Path', icon: Award },
    [BADGE_IDS.CSS_STYLIST]: { name: 'CSS Stylist', description: 'Completed the CSS Learning Path', icon: Award },
    [BADGE_IDS.JS_NINJA]: { name: 'JavaScript Ninja', description: 'Completed the JavaScript Learning Path', icon: Award },
    [BADGE_IDS.STREAK_3]: { name: '3 Day Streak', description: 'Learned 3 days in a row', icon: Flame },
    [BADGE_IDS.STREAK_7]: { name: '7 Day Streak', description: 'Learned 7 days in a row', icon: Flame },
    [BADGE_IDS.STREAK_30]: { name: '30 Day Streak', description: 'Learned 30 days in a row!', icon: Flame },
    [BADGE_IDS.TRIFECTA]: { name: 'Trifecta', description: 'Completed all core learning paths!', icon: Trophy },
};


// Leaderboard Component
const LeaderboardDisplay: React.FC<{ currentUserUid?: string }> = ({ currentUserUid }) => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            const data = await getLeaderboard(10); // Fetch top 10
            setLeaderboard(data);
            setLoading(false);
        };
        fetchLeaderboard();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Users className="h-5 w-5 text-purple-600" />
                    Leaderboard (Top 10)
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded" />)}
                    </div>
                ) : leaderboard.length > 0 ? (
                    <ul className="space-y-3">
                        {leaderboard.map((entry) => (
                            <li key={entry.uid} className={cn(
                                "flex items-center justify-between gap-3 p-2 rounded-md",
                                entry.uid === currentUserUid ? "bg-primary/10 border border-primary/30" : "bg-muted/50"
                            )}>
                                <div className="flex items-center gap-2 flex-grow min-w-0">
                                     <span className="font-bold text-sm w-6 text-center">{entry.rank}.</span>
                                     <Avatar className="h-7 w-7 border">
                                        {entry.avatarUrl && <AvatarImage src={entry.avatarUrl} alt={entry.displayName} />}
                                        <AvatarFallback className="text-xs">{entry.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                                     </Avatar>
                                     <span className="text-sm font-medium truncate flex-grow">{entry.displayName}</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm font-semibold text-amber-600 dark:text-amber-400 flex-shrink-0">
                                    <Star className="h-4 w-4 fill-current" />
                                    <span>{entry.points}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">Leaderboard is currently empty.</p>
                )}
            </CardContent>
        </Card>
    );
};


// Achievements Component
const AchievementsDisplay: React.FC<{ earnedBadges: BadgeId[] }> = ({ earnedBadges }) => {
     const sortedBadges = earnedBadges
         .map(badgeId => badgeDetailsMap[badgeId]) // Get details
         .filter(details => !!details) // Filter out any potential undefined badges
         .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Achievements
                </CardTitle>
            </CardHeader>
            <CardContent>
                {sortedBadges.length > 0 ? (
                    <TooltipProvider>
                         <div className="flex flex-wrap gap-2 sm:gap-3">
                            {sortedBadges.map((badge) => (
                                <Tooltip key={badge.id}>
                                    <TooltipTrigger asChild>
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                "text-xs capitalize py-1 px-2.5 border-2",
                                                badge.icon === Flame && "border-orange-500/50 bg-orange-100/70 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
                                                badge.icon === Award && "border-blue-500/50 bg-blue-100/70 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
                                                badge.icon === Trophy && "border-yellow-500/50 bg-yellow-100/70 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
                                                "cursor-default" // Indicate it's hoverable
                                            )}
                                        >
                                            <badge.icon className="h-3.5 w-3.5 mr-1.5" />
                                            {badge.name}
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        <p>{badge.description}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    </TooltipProvider>
                ) : (
                    <p className="text-sm text-muted-foreground">No badges earned yet. Complete video playlists and build streaks to earn them!</p>
                )}
            </CardContent>
        </Card>
    );
};


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
              <div className="flex justify-center sm:justify-start space-x-4 pt-2">
                 <Skeleton className="h-6 w-20" />
                 <Skeleton className="h-6 w-20" />
                 <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-32 mx-auto sm:mx-0 mt-1" />
            </div>
          </CardHeader>
        </Card>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
           <Card><CardHeader><Skeleton className="h-5 w-32 mb-2" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
           <Card><CardHeader><Skeleton className="h-5 w-32 mb-2" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
           <Card><CardHeader><Skeleton className="h-5 w-32 mb-2" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
           <Card><CardHeader><Skeleton className="h-5 w-32 mb-2" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card> {/* Leaderboard skeleton */}
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
            {userProfile.avatarUrl && <AvatarImage src={userProfile.avatarUrl} alt={userProfile.displayName} />}
            <AvatarFallback className="text-3xl sm:text-4xl">
              {getInitials(userProfile.displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-grow space-y-1">
            <CardTitle className="text-xl sm:text-2xl font-semibold">{userProfile.displayName}</CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground">{userProfile.email}</CardDescription>
             {/* Gamification Stats Row */}
            <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2 pt-2 sm:justify-start">
               <div className="flex items-center gap-1 text-base font-semibold text-amber-600 dark:text-amber-400">
                   <Star className="h-5 w-5 fill-current" />
                   <span>{userProfile.points} Points</span>
               </div>
               <div className="flex items-center gap-1 text-base font-semibold text-orange-600 dark:text-orange-400">
                   <Flame className="h-5 w-5" />
                   <span>{userProfile.currentStreak} Day Streak</span>
               </div>
               <div className="flex items-center gap-1 text-base font-semibold text-purple-600 dark:text-purple-400">
                   <Trophy className="h-5 w-5" />
                   <span>{userProfile.longestStreak} Longest</span>
               </div>
            </div>
             <p className="text-xs text-muted-foreground pt-1">
                Member since: {userProfile.createdAt instanceof Date ? userProfile.createdAt.toLocaleDateString() : 'N/A'}
             </p>
          </div>
        </CardHeader>
      </Card>

       {/* Achievements Card (Moved up) */}
       <AchievementsDisplay earnedBadges={userProfile.badges as BadgeId[]} />


      {/* Content Grid - Responsive */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">

        {/* Learning Progress Card (takes 2 columns on large screens) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Playlist Progress (Example)
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Overall completion percentage for each topic.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-2">
            {/* Add Progress for each topic */}
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
             <div className="sm:col-span-3 mt-2">
                 <Button variant="outline" size="sm" onClick={() => router.push('/videos')} className="w-full sm:w-auto">
                    Go to Videos
                </Button>
             </div>
          </CardContent>
        </Card>

        {/* Leaderboard Card (takes 1 column on large screens) */}
         <LeaderboardDisplay currentUserUid={user.uid} />

        {/* Recent Activity Card (Placeholder - could be added back if needed) */}
         {/*
         <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="h-5 w-5 text-blue-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No recent activity tracked yet.</p>
          </CardContent>
        </Card>
         */}
      </div>
    </div>
  );
}
