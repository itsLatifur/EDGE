'use client';

import React, {useState, useEffect, useCallback, Suspense} from 'react';
import { useSearchParams } from 'next/navigation';
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
    saveGuestProgress
} from '@/services/user-progress';
import type { UserProgress, ContentItem, Playlist, PlaylistType } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { mockPlaylists } from '@/lib/data/playlists'; // Import playlists from the data file

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

// Define Points/Badges structure
const VIDEO_COMPLETION_POINTS = 10;
const PLAYLIST_COMPLETION_BADGES: Record<PlaylistType, string> = {
    html: 'html-master',
    css: 'css-stylist',
    javascript: 'javascript-ninja',
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
            const updatedProgressEntry = {
                watchedTime: cappedTime,
                lastWatched: new Date(),
                completed: isAlreadyCompleted || isNowCompleted,
            };
            setUserProgress(prev => ({ ...(prev || {}), [videoId]: updatedProgressEntry }));

            try {
                if (!isGuest && user) {
                    await updateUserProgress(user.uid, videoId, cappedTime, updatedProgressEntry.completed, updatedProgressEntry.lastWatched);

                    if (isNowCompleted) {
                        await awardPoints(user.uid, VIDEO_COMPLETION_POINTS);
                        toast({
                            title: "Video Completed!",
                            description: `+${VIDEO_COMPLETION_POINTS} points earned!`,
                        });

                        const playlistKey = videoDetailsResult.playlistId;
                        const playlistVideos = mockPlaylists[playlistKey].videos;

                        // Check completion against the *updated* local state
                        const allCompleted = playlistVideos.every(v => {
                            const entry = (userProgress || {})[v.id];
                             return (v.id === videoId) ? updatedProgressEntry.completed : (entry?.completed || false);
                        });

                        if (allCompleted) {
                            const badgeId = PLAYLIST_COMPLETION_BADGES[playlistKey];
                            if (badgeId && userProfile && !userProfile.badges.includes(badgeId)) {
                                await awardBadge(user.uid, badgeId);
                                toast({
                                    title: `Playlist Completed: ${mockPlaylists[playlistKey].title}`,
                                    description: `You've earned the "${badgeId.replace(/-/g, ' ')}" badge!`,
                                });
                                await refreshUserProfile();
                            }
                        } else {
                            await refreshUserProfile(); // Refresh points even if playlist not complete
                        }
                    }
                } else {
                    updateGuestProgressEntry(videoId, cappedTime, updatedProgressEntry.completed);
                    if (isNowCompleted) {
                        toast({
                            title: "Video Completed!",
                            description: "Sign in to save progress & earn points.",
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
                // Rollback optimistic update
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
                if (isGuest) {
                    const currentGuestProgress = loadGuestProgress() || {};
                    if (previousWatchedTime === 0 && !isAlreadyCompleted) {
                        delete currentGuestProgress[videoId];
                    } else {
                        currentGuestProgress[videoId] = {
                            watchedTime: previousWatchedTime,
                            lastWatched: currentProgressState[videoId]?.lastWatched || new Date(0),
                            completed: isAlreadyCompleted,
                        };
                    }
                    saveGuestProgress(currentGuestProgress);
                }
            }
        }
    }, [user, userProgress, isGuest, userProfile, toast, refreshUserProfile]);


    // Display loading skeleton while auth or progress data is loading
    if (authLoading || isLoading) {
        return (
        <div className="space-y-8 mt-6 animate-pulse">
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
                    Learn with Interactive Videos
                </h1>
                <p className="text-muted-foreground">
                    Select a topic (HTML, CSS, or JavaScript) to start watching tutorials and tracking your progress.
                </p>
                 {isGuest && (
                    <Button asChild size="sm" variant="outline" className="mt-3">
                        <Link href="/auth">Sign In / Register to Save Progress & Earn Rewards</Link>
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


// Skeleton component to show while waiting for Suspense boundary
function VideoPageSkeleton() {
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