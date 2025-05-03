'use client';

import React, {useState, useEffect, useCallback} from 'react';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import LearningContent from '@/components/learning-content';
import {useToast} from '@/hooks/use-toast';
import { PlayCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import {
    getUserProgress,
    updateUserProgress,
    awardPoints,
    awardBadge,
    loadGuestProgress,
    updateGuestProgressEntry,
    saveGuestProgress // Import saveGuestProgress
} from '@/services/user-progress';
import type { UserProgress, ContentItem, Playlist, PlaylistType } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { mockPlaylists } from '@/lib/data/playlists'; // Import playlists from the data file

// Helper function to find video details across all playlists (remains the same)
const findVideoDetails = (videoId: string): ContentItem | undefined => {
  for (const key in mockPlaylists) {
    const playlist = mockPlaylists[key as PlaylistType];
    const video = playlist.videos.find(v => v.id === videoId);
    if (video) return video;
  }
  return undefined;
}

// Define Points/Badges structure (remains the same)
const VIDEO_COMPLETION_POINTS = 10;
const PLAYLIST_COMPLETION_BADGES: Record<PlaylistType, string> = {
    html: 'html-master',
    css: 'css-stylist',
    javascript: 'javascript-ninja',
};


export default function Home() {
  const { user, userProfile, isGuest, loading: authLoading, refreshUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true); // Tracks progress loading specifically
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [activeTab, setActiveTab] = useState<PlaylistType>('html');
  const { toast } = useToast();

  // Fetch user progress (Firestore or Local Storage)
  useEffect(() => {
    const fetchProgress = async () => {
      setIsLoading(true); // Start loading progress data
      let progressData: UserProgress | null = null;
      try {
        if (!isGuest && user) {
          console.log("Fetching Firestore progress for user:", user.uid);
          progressData = await getUserProgress(user.uid);
        } else {
          console.log("Loading guest progress from local storage");
          progressData = loadGuestProgress();
        }
        setUserProgress(progressData || {}); // Use empty object if null/no progress found
      } catch (error) {
        console.error("Failed to fetch user progress:", error);
        toast({
          title: "Progress Load Error",
          description: "Could not load your learning progress.",
          variant: "destructive",
        });
        setUserProgress({}); // Fallback to empty progress on error
      } finally {
        setIsLoading(false); // Finish loading progress data
      }
    };

    // Fetch progress only when auth state is resolved and we know if user is guest or not
    if (!authLoading) {
      fetchProgress();
    }
     // Add dependencies: authLoading, isGuest, user?.uid
  }, [authLoading, isGuest, user?.uid, toast]);


  // Initial welcome toast (adapted for guests)
  useEffect(() => {
     // Only show welcome *after* initial auth and progress loading is complete
     if (!authLoading && !isLoading) {
       if (!isGuest && userProfile) {
         toast({
           title: `Welcome Back, ${userProfile.displayName}!`,
           description: 'Ready to continue your learning journey?',
           duration: 5000,
         });
       } else if (isGuest) {
          // Optional: Welcome message for guests
           // toast({
           //   title: "Welcome, Guest!",
           //   description: "Sign in to save your progress permanently.",
           //   duration: 7000,
           // });
       }
     }
   }, [isGuest, userProfile, authLoading, isLoading, toast]); // Depend on loading states too


  const handleProgressUpdate = useCallback(async (videoId: string, currentTime: number) => {
     // Always allow progress update, but handle storage based on guest status
     // if (userProgress === null) return; // Don't update if progress hasn't loaded yet

     const videoDetails = findVideoDetails(videoId);
     if (!videoDetails) return;

     // Prevent updating time beyond known duration or if currentTime is invalid
     const currentProgressState = userProgress || {}; // Use empty object if null
     const cappedTime = (!isNaN(currentTime)) ? Math.min(currentTime, videoDetails.duration) : (currentProgressState[videoId]?.watchedTime || 0);
     const previousWatchedTime = currentProgressState[videoId]?.watchedTime || 0;
     const isAlreadyCompleted = currentProgressState[videoId]?.completed || false;

     // Only update if time has progressed significantly (e.g., > 1 second) or completion status changes
     const isNowCompleted = !isAlreadyCompleted && cappedTime >= videoDetails.duration * 0.95; // Mark completed at 95%
     const needsUpdate = (cappedTime > previousWatchedTime + 1) || (isNowCompleted && !isAlreadyCompleted);


     if (needsUpdate) {
         // Optimistically update local state first for immediate UI feedback
         const updatedProgressEntry = {
             watchedTime: cappedTime,
             lastWatched: new Date(), // Use JS Date for local state
             completed: isAlreadyCompleted || isNowCompleted,
         };
         setUserProgress(prev => ({ ...(prev || {}), [videoId]: updatedProgressEntry }));

         try {
             if (!isGuest && user) {
                 // --- Logged-in User: Update Firestore ---
                 await updateUserProgress(user.uid, videoId, cappedTime, updatedProgressEntry.completed, updatedProgressEntry.lastWatched);

                 // Award points/badge if newly completed (only for logged-in users)
                 if (isNowCompleted) {
                     await awardPoints(user.uid, VIDEO_COMPLETION_POINTS);
                     toast({
                         title: "Video Completed!",
                         description: `+${VIDEO_COMPLETION_POINTS} points earned!`,
                     });

                     // Check for playlist completion
                     const playlistKey = Object.keys(mockPlaylists).find(key =>
                         mockPlaylists[key as PlaylistType].videos.some(v => v.id === videoId)
                     ) as PlaylistType | undefined;

                     if (playlistKey) {
                         const playlistVideos = mockPlaylists[playlistKey].videos;
                         // Check against the potentially updated state `userProgress` AFTER the optimistic update
                          // Need to include the currently updated video in the check
                         const allCompleted = playlistVideos.every(v => {
                            const progressEntry = (prevProgress: UserProgress | null) => (prevProgress || {})[v.id];
                            const currentEntry = progressEntry(userProgress);
                            return (v.id === videoId) ? updatedProgressEntry.completed : (currentEntry?.completed || false);
                         });


                         if (allCompleted) {
                             const badgeId = PLAYLIST_COMPLETION_BADGES[playlistKey];
                             // Ensure userProfile is available before checking badges
                             if (badgeId && userProfile && !userProfile.badges.includes(badgeId)) {
                                 await awardBadge(user.uid, badgeId);
                                 toast({
                                     title: `Playlist Completed: ${mockPlaylists[playlistKey].title}`,
                                     description: `You've earned the "${badgeId.replace(/-/g, ' ')}" badge!`,
                                 });
                                 // Refresh user profile to show new badge/points immediately
                                 await refreshUserProfile();
                             }
                         } else {
                              // Refresh profile anyway if points were awarded
                              await refreshUserProfile();
                         }
                     } else {
                         // Refresh profile anyway if points were awarded
                         await refreshUserProfile();
                     }
                 }
             } else {
                 // --- Guest User: Update Local Storage ---
                 updateGuestProgressEntry(videoId, cappedTime, updatedProgressEntry.completed);

                 // Optional: Toast for guest video completion (no points/badges)
                 if (isNowCompleted) {
                      toast({
                          title: "Video Completed!",
                          description: "Sign in to save progress & earn points.",
                          duration: 7000, // Longer duration for guests
                      });
                 }
             }
         } catch (error) {
             console.error("Failed to update progress:", error);
             toast({
                 title: "Update Error",
                 description: "Could not save your progress.",
                 variant: "destructive",
             });
             // Rollback optimistic update for the specific video entry
              setUserProgress(prev => {
                  const newState = { ...(prev || {}) };
                  if (previousWatchedTime === 0 && !isAlreadyCompleted) {
                     // If it was the first update, remove the entry
                     delete newState[videoId];
                  } else {
                      // Otherwise, revert to previous state
                      newState[videoId] = {
                          watchedTime: previousWatchedTime,
                          lastWatched: currentProgressState[videoId]?.lastWatched || new Date(), // Keep old date or use current
                          completed: isAlreadyCompleted,
                      };
                  }
                  return newState;
              });
              // Also attempt to rollback local storage if guest
              if (isGuest) {
                 const currentGuestProgress = loadGuestProgress() || {}; // Load fresh state
                 if (previousWatchedTime === 0 && !isAlreadyCompleted) {
                     // If it was the first update, remove the entry
                     delete currentGuestProgress[videoId];
                 } else {
                      // Otherwise, revert to previous state
                      currentGuestProgress[videoId] = {
                          watchedTime: previousWatchedTime,
                          lastWatched: currentProgressState[videoId]?.lastWatched || new Date(),
                          completed: isAlreadyCompleted,
                      };
                 }
                  saveGuestProgress(currentGuestProgress); // Save rolled-back state
              }
         }
     }
  }, [user, userProgress, isGuest, userProfile, toast, refreshUserProfile]);


   // Display loading skeleton while auth or progress data is loading
  if (authLoading || isLoading) {
    return (
      <div className="space-y-8 mt-6 animate-pulse">
        {/* Intro Skeleton */}
        <div className="space-y-2 mb-8">
            <Skeleton className="h-8 w-1/2 rounded-md" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
        </div>
        {/* Tabs Skeleton */}
        <Skeleton className="h-10 w-full md:w-1/2 rounded-md mb-6" />
         {/* Content Area Skeleton */}
        <Card className="overflow-hidden">
          <CardHeader>
              <Skeleton className="h-6 w-1/3 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
          </CardHeader>
          <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                  {/* Video Player Skeleton */}
                  <div className="w-full md:flex-grow aspect-video bg-muted flex items-center justify-center">
                     <PlayCircle className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                  {/* Playlist Skeleton */}
                  <div className="w-full md:w-80 lg:w-96 p-4 space-y-3 border-t md:border-t-0 md:border-l">
                      <Skeleton className="h-16 w-full rounded" />
                      <Skeleton className="h-16 w-full rounded" />
                      <Skeleton className="h-16 w-full rounded" />
                      <Skeleton className="h-16 w-full rounded" />
                  </div>
              </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Display welcome/content for both logged-in and guest users
  return (
    <div className="animate-fadeIn space-y-8 mt-6">
       <div className="mb-8">
           <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                {isGuest ? "Welcome, Guest Learner!" : `Your Web Development Journey, ${userProfile?.displayName || 'Learner'}`}
           </h1>
           <p className="text-muted-foreground">
               {isGuest
                    ? "Select a topic below (HTML, CSS, or JavaScript) to start learning. Your progress will be saved locally in this browser. Sign in to save permanently and earn rewards!"
                    : "Select a topic below to continue where you left off or start a new one. Keep learning to earn points and badges!"}
           </p>
           {isGuest && (
               <Button asChild size="sm" className="mt-3">
                  <Link href="/auth">Sign In / Register to Save Progress</Link>
               </Button>
           )}
       </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PlaylistType)} className="w-full">
         <TabsList className="grid w-full grid-cols-3 mb-6 shadow-sm bg-card border">
            {Object.values(mockPlaylists).map((playlist) => (
               <TabsTrigger
                  key={playlist.id}
                  value={playlist.id}
                  className="transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md first:rounded-l-md last:rounded-r-md rounded-none data-[state=inactive]:border-r data-[state=inactive]:last:border-r-0"
                  >
                  <playlist.icon className="h-4 w-4 mr-2" />
                  {playlist.id.toUpperCase()}
               </TabsTrigger>
            ))}
         </TabsList>


        {/* Tab Content */}
        {Object.values(mockPlaylists).map((playlist) => (
          <TabsContent key={playlist.id} value={playlist.id} className="mt-0 pt-0 animate-fadeIn">
            <LearningContent
              playlist={playlist}
              userProgress={userProgress || {}} // Pass loaded progress (could be guest or user)
              onProgressUpdate={handleProgressUpdate}
              currentTab={activeTab} // Still useful for LearningContent's internal logic if needed
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
