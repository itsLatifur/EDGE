
'use client';

import React, {useState, useEffect, useCallback, Suspense, useMemo} from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; // Import useRouter
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import LearningContent from '@/components/learning-content';
import PlaylistBrowser from '@/components/playlist-browser'; // Import PlaylistBrowser
import {useToast} from '@/hooks/use-toast';
import { PlayCircle, Loader2, Award, Flame, Trophy, ArrowLeft } from 'lucide-react'; // Added ArrowLeft
import { useAuth } from '@/context/auth-context';
import {
    getUserProgress,
    updateUserProgress,
    saveGuestProgress,
    loadGuestProgress,
    updateGuestProgressEntry, // Add this import
} from '@/services/user-progress';
import type { UserProgress, ContentItem, Playlist, PlaylistType, BadgeId, PlaylistSummary } from '@/types'; // Import PlaylistSummary
import { BADGE_IDS } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { playlistCategories, playlistVideos, findVideoDetails, findPlaylistSummary, getPlaylistIcon } from '@/lib/data/playlists'; // Import updated data structure and helpers
import { cn } from '@/lib/utils';

// Map badge IDs to display info (remains the same)
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
    const router = useRouter();
    const searchParams = useSearchParams();

    // Read initial state from URL parameters
    const initialTab = (searchParams.get('tab') as PlaylistType | null) || 'html';
    const initialPlaylistId = searchParams.get('playlistId');
    const initialVideoId = searchParams.get('videoId');
    const initialTime = parseInt(searchParams.get('time') || '0', 10);

    const [activeTab, setActiveTab] = useState<PlaylistType>(initialTab);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(initialPlaylistId);
    const [initialVideoInfo, setInitialVideoInfo] = useState<{ videoId: string | null; startTime: number }>({
        videoId: initialVideoId,
        startTime: initialTime,
    });


     // Effect to update state from URL parameters on change
    useEffect(() => {
        const currentTab = (searchParams.get('tab') as PlaylistType | null) || 'html';
        const currentPlaylistId = searchParams.get('playlistId');
        const currentVideoId = searchParams.get('videoId');
        const currentTime = parseInt(searchParams.get('time') || '0', 10);

        setActiveTab(currentTab);
        setSelectedPlaylistId(currentPlaylistId); // Update selected playlist based on URL
        setInitialVideoInfo({ videoId: currentVideoId, startTime: currentTime });
    }, [searchParams]);


    // Fetch user progress (Firestore or Local Storage) - Remains largely the same
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

        // Fetch progress only when auth state is resolved
        if (!authLoading) {
        fetchProgress();
        }
    }, [authLoading, isGuest, user?.uid, toast]);

    // Memoize the selected playlist details
    const selectedPlaylistDetails: Playlist | null = useMemo(() => {
        if (!selectedPlaylistId) return null;
        const summary = findPlaylistSummary(selectedPlaylistId);
        const videos = playlistVideos[selectedPlaylistId] || [];
        if (!summary) return null;
        return { ...summary, videos };
    }, [selectedPlaylistId]);


    // Updated handleProgressUpdate - logic remains similar but uses updated findVideoDetails
    const handleProgressUpdate = useCallback(async (videoId: string, currentTime: number) => {
        const videoDetailsResult = findVideoDetails(videoId); // Uses the updated helper
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
    }, [user, userProgress, isGuest, toast, refreshUserProfile]);


    // Handler for selecting a playlist from the browser
    const handleSelectPlaylist = (playlistId: string) => {
        console.log("Selected playlist:", playlistId);
        setSelectedPlaylistId(playlistId);
        // Reset initial video info when selecting a new playlist
        setInitialVideoInfo({ videoId: null, startTime: 0 });
        // Update URL, but remove videoId and time initially
        router.push(`/videos?tab=${activeTab}&playlistId=${playlistId}`, { scroll: false });
    };

    // Handler to go back to playlist selection
    const handleBackToPlaylists = () => {
        setSelectedPlaylistId(null);
        setInitialVideoInfo({ videoId: null, startTime: 0 });
        // Update URL to remove playlistId, videoId, and time
        router.push(`/videos?tab=${activeTab}`, { scroll: false });
    };

    // Handler for tab change - clears selected playlist
     const handleTabChange = (value: string) => {
        const newTab = value as PlaylistType;
        setActiveTab(newTab);
        setSelectedPlaylistId(null); // Deselect playlist when changing tabs
        setInitialVideoInfo({ videoId: null, startTime: 0 });
        // Update URL to reflect new tab and remove playlist/video info
        router.push(`/videos?tab=${newTab}`, { scroll: false });
    };

    // Display loading skeleton while auth or progress data is loading
    if (authLoading || isLoading) {
        return <VideoPageSkeleton />; // Use the dedicated skeleton component
    }

    // Render the main content
    return (
        <div className="animate-fadeIn space-y-6 sm:space-y-8 mt-6 sm:mt-8 lg:mt-10">
            {/* Show back button only when a playlist is selected */}
            {selectedPlaylistId && (
                <Button variant="outline" size="sm" onClick={handleBackToPlaylists} className="mb-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Playlists
                </Button>
            )}

            {!selectedPlaylistId && (
                 <>
                     {/* Header for Playlist Browser */}
                    <div className="mb-6 sm:mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
                            Learn with Interactive Playlists
                        </h1>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Select a topic (HTML, CSS, or JavaScript) and choose a playlist to start watching tutorials.
                        </p>
                        {isGuest && (
                            <Button asChild size="sm" variant="outline" className="mt-3 transition-transform duration-200 hover:scale-105 focus-visible:scale-105">
                                <Link href="/auth">Sign In / Register to Save Progress & Earn Rewards</Link>
                            </Button>
                        )}
                    </div>
                    {/* Tabs and Playlist Browser */}
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                         {/* Responsive Tabs List */}
                        <TabsList className="grid w-full grid-cols-3 mb-6 shadow-sm bg-card border max-w-lg mx-auto">
                            {Object.keys(playlistCategories).map((key) => {
                                const categoryId = key as PlaylistType;
                                const Icon = getPlaylistIcon(categoryId);
                                return (
                                    <TabsTrigger
                                        key={categoryId}
                                        value={categoryId}
                                        className={cn(
                                            "text-xs sm:text-sm py-2 sm:py-2.5",
                                            "focus-visible:ring-offset-0 focus-visible:z-10"
                                        )}
                                    >
                                        <Icon className="h-4 w-4 mr-1.5 sm:mr-2" />
                                        <span className="hidden sm:inline">{categoryId.toUpperCase()}</span>
                                        <span className="sm:hidden">{categoryId.toUpperCase()}</span>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>

                        {/* Tab Content for Playlist Browser */}
                        {Object.keys(playlistCategories).map((key) => {
                            const categoryId = key as PlaylistType;
                            return (
                                <TabsContent key={categoryId} value={categoryId} className="mt-6">
                                    <PlaylistBrowser
                                        category={categoryId}
                                        playlists={playlistCategories[categoryId]}
                                        userProgress={userProgress || {}}
                                        onSelectPlaylist={handleSelectPlaylist}
                                    />
                                </TabsContent>
                            );
                        })}
                    </Tabs>
                </>
            )}

            {/* Display LearningContent when a playlist is selected */}
            {selectedPlaylistId && selectedPlaylistDetails && (
                <LearningContent
                    playlist={selectedPlaylistDetails}
                    userProgress={userProgress || {}}
                    onProgressUpdate={handleProgressUpdate}
                    initialVideoId={initialVideoInfo.videoId}
                    initialStartTime={initialVideoInfo.startTime}
                />
            )}
        </div>
    );
}

// Wrap the main content component with Suspense
export default function VideosPage() {
    return (
        // Key added to force re-render on search param change if necessary,
        // but internal useEffect should handle it. Keep Suspense for safety.
        <Suspense fallback={<VideoPageSkeleton />}>
            <VideoPageContent />
        </Suspense>
    );
}


// Skeleton component to show while waiting for Suspense boundary or loading
// Updated skeleton for playlist browser view
function VideoPageSkeleton() {
     return (
      <div className="space-y-6 sm:space-y-8 mt-6 sm:mt-8 lg:mt-10 animate-pulse">
         {/* Intro Skeleton */}
        <div className="space-y-2 mb-6 sm:mb-8">
            <Skeleton className="h-8 w-3/5 rounded-md" />
            <Skeleton className="h-4 w-4/5 rounded-md" />
            <Skeleton className="h-8 w-48 rounded-md mt-3" /> {/* Skeleton for Sign In button */}
        </div>
        {/* Tabs Skeleton */}
        <Skeleton className="h-10 w-full max-w-lg mx-auto rounded-md mb-6" />

        {/* Playlist Browser Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-5 w-1/3 rounded" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-4/5 rounded mb-2" />
                        <Skeleton className="h-3 w-1/2 rounded mb-3" />
                        <Skeleton className="h-8 w-full rounded" />
                    </CardContent>
                </Card>
            ))}
        </div>

         {/* OR Video Player Skeleton (could conditionally show one or the other) */}
        {/*
        <Card className="overflow-hidden">
          <CardHeader className="p-4">
              <Skeleton className="h-6 w-1/3 rounded" />
              <Skeleton className="h-4 w-1/2 rounded mt-1" />
          </CardHeader>
          <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                  <div className="w-full md:flex-grow aspect-video bg-muted flex items-center justify-center">
                     <PlayCircle className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/30" />
                  </div>
                  <div className="w-full md:w-80 lg:w-96 p-2 sm:p-4 space-y-2 sm:space-y-3 border-t md:border-t-0 md:border-l h-[50vh] md:h-auto overflow-y-auto">
                      <Skeleton className="h-16 w-full rounded" />
                      <Skeleton className="h-16 w-full rounded" />
                      <Skeleton className="h-16 w-full rounded" />
                  </div>
              </div>
          </CardContent>
        </Card>
        */}
      </div>
    );
}
