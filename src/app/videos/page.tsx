
'use client';

import React, {useState, useEffect, useCallback, Suspense} from 'react';
import { useSearchParams } from 'next/navigation';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import LearningContent from '@/components/learning-content';
import {useToast} from '@/hooks/use-toast';
import { PlayCircle, Loader2, Award, Flame, Trophy } from 'lucide-react'; // Added Award, Flame, Trophy
import { useAuth } from '@/context/auth-context';
import {
    getUserProgress,
    updateUserProgress,
    saveGuestProgress,
    loadGuestProgress,
    // Removed explicit award functions, now handled within updateUserProgress
    // awardPoints,
    // awardBadge,
} from '@/services/user-progress';
import type { UserProgress, ContentItem, Playlist, PlaylistType, BadgeId } from '@/types';
import { BADGE_IDS } from '@/types'; // Import BADGE_IDS
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { mockPlaylists } from '@/lib/data/playlists'; // Import playlists from the data file
import { cn } from '@/lib/utils'; // Import cn

// Helper function to find video details across all playlists
const findVideoDetails = (videoId: string): { video: ContentItem; playlistId: PlaylistType } | undefined => {
  for (const key in mockPlaylists) {
    const playlistId = key as PlaylistType;
    const playlist = mockPlaylists[playlistId];
    const video = playlist.videos.find(v => v.id === videoId);
    if (video) return { video, playlistId };
  }
  return undefined;
}


// Map badge IDs to display info
const badgeDisplayInfo: Record<BadgeId, { name: string; icon: React.ElementType }> = {
    [BADGE_IDS.HTML_MASTER]: { name: 'HTML Master', icon: Award },
    [BADGE_IDS.CSS_STYLIST]: { name: 'CSS Stylist', icon: Award },
    [BADGE_IDS.JS_NINJA]: { name: 'JavaScript Ninja', icon: Award },
    [BADGE_IDS.STREAK_3]: { name: '3 Day Streak', icon: Flame },
    [BADGE_IDS.STREAK_7]: { name: '7 Day Streak', icon: Flame },
    [BADGE_IDS.STREAK_30]: { name: '30 Day Streak', icon: Flame },
    [BADGE_IDS.TRIFECTA]: { name: 'Trifecta', icon: Trophy },
};


// Component using useSearchParams needs to be wrapped in Suspense
function VideoPageContent() {
    const { user, userProfile, isGuest, loading: authLoading, refreshUserProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(true); // Tracks progress loading specifically
    const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
    const { toast } = useToast();
    const searchParams = useSearchParams(); // Get search params

    // Read initial state from URL parameters
    const initialTab = (searchParams.get('tab') as PlaylistType | null) || 'html';
    const initialVideoId = searchParams.get('videoId');
    const initialTime = parseInt(searchParams.get('time') || '0', 10);

    const [activeTab, setActiveTab] = useState<PlaylistType>(initialTab);
    const [initialVideoInfo, setInitialVideoInfo] = useState<{ videoId: string | null; startTime: number }>({
        videoId: initialVideoId,
        startTime: initialTime,
    });

     // Update activeTab if initialTab changes (e.g., navigation)
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    // Update initialVideoInfo if URL params change
    useEffect(() => {
        setInitialVideoInfo({ videoId: initialVideoId, startTime: initialTime });
    }, [initialVideoId, initialTime]);


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


    const handleProgressUpdate = useCallback(async (videoId: string, currentTime: number) => {
        const videoDetailsResult = findVideoDetails(videoId);
        if (!videoDetailsResult) return;
        const { video: videoDetails } = videoDetailsResult;

        const currentProgressState = userProgress || {};
        const cappedTime = (!isNaN(currentTime)) ? Math.min(currentTime, videoDetails.duration) : (currentProgressState[videoId]?.watchedTime || 0);
        const previousWatchedTime = currentProgressState[videoId]?.watchedTime || 0;
        const isAlreadyCompleted = currentProgressState[videoId]?.completed || false;

        const isNowCompleted = !isAlreadyCompleted && cappedTime >= videoDetails.duration * 0.95;
        const needsUpdate = (cappedTime > previousWatchedTime + 1) || (isNowCompleted && !isAlreadyCompleted);

        if (needsUpdate) {
            const updateTime = new Date(); // Consistent timestamp for this update
            const updatedProgressEntry = {
                watchedTime: cappedTime,
                lastWatched: updateTime,
                completed: isAlreadyCompleted || isNowCompleted,
            };
            setUserProgress(prev => ({ ...(prev || {}), [videoId]: updatedProgressEntry }));

            try {
                if (!isGuest && user) {
                     // updateUserProgress now handles points and badges internally
                    const { pointsAwarded, badgesAwarded } = await updateUserProgress(
                        user.uid,
                        videoId,
                        cappedTime,
                        updatedProgressEntry.completed,
                        updateTime
                    );

                     // Show toasts for awarded points and badges
                    if (pointsAwarded > 0) {
                        toast({
                            title: "Progress Saved!",
                            description: `+${pointsAwarded} points earned!`,
                        });
                    }
                    if (badgesAwarded.length > 0) {
                        badgesAwarded.forEach(badgeId => {
                            const badgeInfo = badgeDisplayInfo[badgeId];
                            toast({
                                title: "Achievement Unlocked!",
                                description: `You earned the "${badgeInfo?.name || badgeId.replace(/-/g, ' ')}" badge!`,
                                // Add icon if available?
                            });
                        });
                    }

                    // Refresh user profile in context to reflect new points/badges/streak
                    await refreshUserProfile();

                } else {
                    // Guest user progress update
                    updateGuestProgressEntry(videoId, cappedTime, updatedProgressEntry.completed);
                    if (isNowCompleted) {
                        toast({
                            title: "Video Completed!",
                            description: "Sign in to save progress & earn points/badges.",
                            duration: 7000,
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
                // Rollback optimistic update for UI
                setUserProgress(prev => {
                    const newState = { ...(prev || {}) };
                    if (previousWatchedTime === 0 && !isAlreadyCompleted) {
                        delete newState[videoId];
                    } else {
                        newState[videoId] = {
                            watchedTime: previousWatchedTime,
                            lastWatched: currentProgressState[videoId]?.lastWatched || new Date(0),
                            completed: isAlreadyCompleted,
                        };
                    }
                    return newState;
                });
                // Rollback guest storage if necessary
                if (isGuest) {
                    const currentGuestProgress = loadGuestProgress() || {};
                    if (previousWatchedTime === 0 && !isAlreadyCompleted) {
                        delete currentGuestProgress[videoId];
                    } else {
                        currentGuestProgress[videoId] = {
                            watchedTime: previousWatchedTime,
                            lastWatched: currentProgressState[videoId]?.lastWatched || new Date(0), // Revert lastWatched too
                            completed: isAlreadyCompleted,
                        };
                    }
                    saveGuestProgress(currentGuestProgress);
                }
            }
        }
    }, [user, userProgress, isGuest, toast, refreshUserProfile]); // Removed userProfile dependency


    // Display loading skeleton while auth or progress data is loading
    if (authLoading || isLoading) {
        return <VideoPageSkeleton />; // Use the dedicated skeleton component
    }

    // Display welcome/content for both logged-in and guest users
    return (
        <div className="animate-fadeIn space-y-6 sm:space-y-8 mt-6 sm:mt-8 lg:mt-10">
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
                    Learn with Interactive Videos
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                    Select a topic (HTML, CSS, or JavaScript) to start watching tutorials and tracking your progress.
                </p>
                 {isGuest && (
                    <Button asChild size="sm" variant="outline" className="mt-3 transition-transform duration-200 hover:scale-105 focus-visible:scale-105">
                        <Link href="/auth">Sign In / Register to Save Progress & Earn Rewards</Link>
                    </Button>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PlaylistType)} className="w-full">
                 {/* Responsive Tabs List */}
                <TabsList className="grid w-full grid-cols-3 mb-6 shadow-sm bg-card border max-w-lg mx-auto">
                    {Object.values(mockPlaylists).map((playlist) => (
                        <TabsTrigger
                        key={playlist.id}
                        value={playlist.id}
                        // Base styles are in ui/tabs, add specific layout/sizing here
                         className={cn(
                            "text-xs sm:text-sm py-2 sm:py-2.5",
                            // Ensure focus ring is visible within the bordered list
                            "focus-visible:ring-offset-0 focus-visible:z-10"
                        )}
                        >
                        <playlist.icon className="h-4 w-4 mr-1.5 sm:mr-2" />
                        <span className="hidden sm:inline">{playlist.id.toUpperCase()}</span>
                        <span className="sm:hidden">{playlist.id.toUpperCase()}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>


                {/* Tab Content */}
                {Object.values(mockPlaylists).map((playlist) => (
                <TabsContent key={playlist.id} value={playlist.id} className="mt-6"> {/* Keep mt-6 for spacing */}
                    <LearningContent
                    playlist={playlist}
                    userProgress={userProgress || {}} // Pass loaded progress (could be guest or user)
                    onProgressUpdate={handleProgressUpdate}
                    initialVideoId={activeTab === playlist.id ? initialVideoInfo.videoId : null} // Pass initial video ID only if the tab matches
                    initialStartTime={activeTab === playlist.id ? initialVideoInfo.startTime : 0} // Pass initial time only if the tab matches
                    />
                </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}

// Wrap the main content component with Suspense
export default function VideosPage() {
    return (
        <Suspense fallback={<VideoPageSkeleton />}>
            <VideoPageContent />
        </Suspense>
    );
}


// Skeleton component to show while waiting for Suspense boundary or loading
function VideoPageSkeleton() {
     return (
      <div className="space-y-6 sm:space-y-8 mt-6 sm:mt-8 lg:mt-10 animate-pulse">
         {/* Intro Skeleton */}
        <div className="space-y-2 mb-6 sm:mb-8">
            <Skeleton className="h-8 w-1/2 rounded-md" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-8 w-48 rounded-md mt-3" /> {/* Skeleton for Sign In button */}
        </div>
        {/* Tabs Skeleton */}
        <Skeleton className="h-10 w-full max-w-lg mx-auto rounded-md mb-6" />
         {/* Content Area Skeleton */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4">
              <Skeleton className="h-6 w-1/3 rounded" />
              <Skeleton className="h-4 w-1/2 rounded mt-1" />
          </CardHeader>
          <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                  {/* Video Player Skeleton */}
                  <div className="w-full md:flex-grow aspect-video bg-muted flex items-center justify-center">
                     <PlayCircle className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/30" />
                  </div>
                  {/* Playlist Skeleton */}
                  <div className="w-full md:w-80 lg:w-96 p-2 sm:p-4 space-y-2 sm:space-y-3 border-t md:border-t-0 md:border-l h-[50vh] md:h-auto overflow-y-auto">
                      <Skeleton className="h-16 w-full rounded" />
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
