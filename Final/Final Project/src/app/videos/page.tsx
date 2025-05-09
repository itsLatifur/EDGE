
'use client';

import React, {useState, useEffect, useCallback, Suspense, useMemo} from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import LearningContent from '@/components/learning-content';
import PlaylistBrowser from '@/components/playlist-browser'; 
import {useToast} from '@/hooks/use-toast';
import { PlayCircle, Loader2, Award, Flame, Trophy, ArrowLeft, ListFilter } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import {
    getUserProgress,
    updateUserProgress,
    saveGuestProgress,
    loadGuestProgress,
    updateGuestProgressEntry, 
} from '@/services/user-progress';
import type { UserProgress, Playlist, PlaylistType, BadgeId, PlaylistSummary } from '@/types';
import { BADGE_IDS } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
// playlistCategories, playlistVideos, findVideoDetails, findPlaylistSummary, getPlaylistIcon are now driven by playlist-sources.json via playlists.ts
import { playlistCategories, findVideoDetails, findPlaylistSummary, getPlaylistIcon, getPlaylistDetails } from '@/lib/data/playlists'; 
import { cn } from '@/lib/utils';

const badgeDisplayInfo: Record<BadgeId, { name: string; icon: React.ElementType }> = {
    [BADGE_IDS.HTML_MASTER]: { name: 'HTML Master', icon: Award },
    [BADGE_IDS.CSS_STYLIST]: { name: 'CSS Stylist', icon: Award },
    [BADGE_IDS.JS_NINJA]: { name: 'JavaScript Ninja', icon: Award },
    [BADGE_IDS.STREAK_3]: { name: '3 Day Streak', icon: Flame },
    [BADGE_IDS.STREAK_7]: { name: '7 Day Streak', icon: Flame },
    [BADGE_IDS.STREAK_30]: { name: '30 Day Streak', icon: Flame },
    [BADGE_IDS.TRIFECTA]: { name: 'Trifecta', icon: Trophy },
    // Dynamic playlist completion badges will be handled differently or might not need explicit display info here
    // For now, we'll focus on the known ones.
};


function VideoPageContent() {
    const { user, userProfile, isGuest, loading: authLoading, refreshUserProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(true); 
    const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    const initialTab = (searchParams.get('tab') as PlaylistType | null) || 'html';
    // selectedPlaylistId is now YouTube Playlist ID
    const initialPlaylistId = searchParams.get('playlistId'); 
    // initialVideoId is now YouTube Video ID
    const initialVideoId = searchParams.get('videoId'); 
    const initialTime = parseInt(searchParams.get('time') || '0', 10);

    const [activeTab, setActiveTab] = useState<PlaylistType>(initialTab);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(initialPlaylistId); // YouTube Playlist ID
    const [initialVideoInfo, setInitialVideoInfo] = useState<{ videoId: string | null; startTime: number }>({ // videoId is YouTube Video ID
        videoId: initialVideoId,
        startTime: initialTime,
    });


    useEffect(() => {
        const currentTab = (searchParams.get('tab') as PlaylistType | null) || 'html';
        const currentPlaylistId = searchParams.get('playlistId'); // YouTube Playlist ID
        const currentVideoId = searchParams.get('videoId'); // YouTube Video ID
        const currentTime = parseInt(searchParams.get('time') || '0', 10);

        setActiveTab(currentTab);
        setSelectedPlaylistId(currentPlaylistId); 
        setInitialVideoInfo({ videoId: currentVideoId, startTime: currentTime });
    }, [searchParams]);


    useEffect(() => {
        const fetchProgress = async () => {
        setIsLoading(true); 
        let progressData: UserProgress | null = null;
        try {
            if (!isGuest && user) {
            console.log("Fetching Firestore progress for user:", user.uid);
            progressData = await getUserProgress(user.uid);
            } else {
            console.log("Loading guest progress from local storage");
            progressData = loadGuestProgress();
            }
            setUserProgress(progressData || {}); 
        } catch (error) {
            console.error("Failed to fetch user progress:", error);
            toast({
            title: "Progress Load Error",
            description: "Could not load your learning progress.",
            variant: "destructive",
            });
            setUserProgress({}); 
        } finally {
            setIsLoading(false); 
        }
        };

        if (!authLoading) {
        fetchProgress();
        }
    }, [authLoading, isGuest, user?.uid, toast]);

    // Memoize the selected playlist details (uses YouTube Playlist ID)
    const selectedPlaylistDetails: Playlist | null = useMemo(() => {
        if (!selectedPlaylistId) return null;
        // getPlaylistDetails now fetches based on YouTube Playlist ID
        return getPlaylistDetails(selectedPlaylistId); 
    }, [selectedPlaylistId]);


    const handleProgressUpdate = useCallback(async (videoId: string, currentTime: number) => { // videoId is YouTube Video ID
        const videoDetailsResult = findVideoDetails(videoId); 
        if (!videoDetailsResult) return;
        const { video: videoDetails } = videoDetailsResult;

        const currentProgressState = userProgress || {};
        const cappedTime = (!isNaN(currentTime)) ? Math.min(currentTime, videoDetails.duration) : (currentProgressState[videoId]?.watchedTime || 0);
        const previousWatchedTime = currentProgressState[videoId]?.watchedTime || 0;
        const isAlreadyCompleted = currentProgressState[videoId]?.completed || false;

        const isNowCompleted = !isAlreadyCompleted && cappedTime >= videoDetails.duration * 0.95;
        const needsUpdate = (cappedTime > previousWatchedTime + 5) || (isNowCompleted && !isAlreadyCompleted); // Report every 5s or on completion


        if (needsUpdate) {
            const updateTime = new Date(); 
            const updatedProgressEntry = {
                watchedTime: cappedTime,
                lastWatched: updateTime,
                completed: isAlreadyCompleted || isNowCompleted,
            };
            setUserProgress(prev => ({ ...(prev || {}), [videoId]: updatedProgressEntry }));

            try {
                if (!isGuest && user) {
                    const { pointsAwarded, badgesAwarded } = await updateUserProgress(
                        user.uid,
                        videoId, // YouTube Video ID
                        cappedTime,
                        updatedProgressEntry.completed,
                        updateTime
                    );

                    if (pointsAwarded > 0) {
                        toast({
                            title: "Progress Saved!",
                            description: `+${pointsAwarded} points earned!`,
                        });
                    }
                    badgesAwarded.forEach(badgeId => {
                        const badgeInfo = badgeDisplayInfo[badgeId as keyof typeof badgeDisplayInfo] || { name: badgeId.replace(/-/g, ' '), icon: Award };
                        toast({
                            title: "Achievement Unlocked!",
                            description: `You earned the "${badgeInfo.name}" badge!`,
                        });
                    });
                    if (badgesAwarded.length > 0 || pointsAwarded > 0) {
                        await refreshUserProfile();
                    }
                } else {
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
    }, [user, userProgress, isGuest, toast, refreshUserProfile]);


    // Handler for selecting a playlist from the browser (playlistId is YouTube Playlist ID)
    const handleSelectPlaylist = (playlistId: string) => {
        console.log("Selected playlist (YouTube Playlist ID):", playlistId);
        setSelectedPlaylistId(playlistId);
        setInitialVideoInfo({ videoId: null, startTime: 0 });
        router.push(`/videos?tab=${activeTab}&playlistId=${playlistId}`, { scroll: false });
    };


    const handleBackToPlaylists = () => {
        setSelectedPlaylistId(null);
        setInitialVideoInfo({ videoId: null, startTime: 0 });
        router.push(`/videos?tab=${activeTab}`, { scroll: false });
    };


     const handleTabChange = (value: string) => {
        const newTab = value as PlaylistType;
        setActiveTab(newTab);
        setSelectedPlaylistId(null); 
        setInitialVideoInfo({ videoId: null, startTime: 0 });
        router.push(`/videos?tab=${newTab}`, { scroll: false });
    };


    if (authLoading || isLoading) {
        return <VideoPageSkeleton />; 
    }


    return (
        <div className="animate-fadeIn space-y-6 sm:space-y-8 mt-6 sm:mt-8 lg:mt-10">
            
            {!selectedPlaylistId ? (
                 <>
                    <div className="mb-6 sm:mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2 flex items-center gap-2">
                            <ListFilter className="h-7 w-7 text-primary"/>
                            Learn with Interactive Playlists
                        </h1>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Select a topic (HTML, CSS, or JavaScript) and choose a playlist to start watching tutorials.
                        </p>
                        {isGuest && (
                            <Button asChild size="sm" variant="outline" className="mt-4 transition-transform duration-200 hover:scale-105 focus-visible:scale-105 shadow-sm border-primary/30 hover:bg-primary/10 text-primary hover:text-primary">
                                <Link href="/auth">Sign In / Register to Save Progress & Earn Rewards</Link>
                            </Button>
                        )}
                    </div>
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6 shadow-md bg-card border-2 border-border max-w-xl mx-auto rounded-lg p-0.5">
                            {Object.keys(playlistCategories).map((key) => {
                                const categoryId = key as PlaylistType;
                                const Icon = getPlaylistIcon(categoryId);
                                return (
                                    <TabsTrigger
                                        key={categoryId}
                                        value={categoryId}
                                        className={cn(
                                            "text-xs sm:text-sm py-2.5 sm:py-3 rounded-md", // Adjusted padding and ensure rounding for individual triggers
                                            "focus-visible:ring-offset-0 focus-visible:z-10",
                                            "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg",
                                            "data-[state=inactive]:hover:bg-muted data-[state=inactive]:border-transparent border-2 border-transparent" // Ensure inactive also have border for consistent sizing
                                        )}
                                    >
                                        <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                                        <span className="hidden sm:inline">{categoryId.toUpperCase()}</span>
                                        <span className="sm:hidden">{categoryId.toUpperCase()}</span>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>

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
            ) : (
                 <>
                    {selectedPlaylistId && (
                        <Button variant="outline" size="sm" onClick={handleBackToPlaylists} className="mb-4 flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow hover:bg-accent">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Playlists
                        </Button>
                    )}
                    {selectedPlaylistDetails && (
                        <LearningContent
                            playlist={selectedPlaylistDetails} // Pass YouTube Playlist ID
                            userProgress={userProgress || {}}
                            onProgressUpdate={handleProgressUpdate}
                            initialVideoId={initialVideoInfo.videoId} // Pass YouTube Video ID
                            initialStartTime={initialVideoInfo.startTime}
                        />
                    )}
                 </>
            )}
        </div>
    );
}


export default function VideosPage() {
    return (
        <Suspense fallback={<VideoPageSkeleton />}>
            <VideoPageContent />
        </Suspense>
    );
}


function VideoPageSkeleton() {
     return (
      <div className="space-y-6 sm:space-y-8 mt-6 sm:mt-8 lg:mt-10 animate-pulse">
        <div className="space-y-2 mb-6 sm:mb-8">
            <Skeleton className="h-8 w-3/5 rounded-lg" />
            <Skeleton className="h-4 w-4/5 rounded-md" />
            <Skeleton className="h-9 w-52 rounded-md mt-4" /> 
        </div>
        <Skeleton className="h-12 w-full max-w-xl mx-auto rounded-lg mb-6" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(3)].map((_, i) => (
                <Card key={i} className="rounded-xl">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-2 mb-1">
                            <Skeleton className="h-6 w-3/5 rounded-md" />
                            <Skeleton className="h-6 w-6 rounded-full" />
                        </div>
                        <Skeleton className="h-3 w-1/3 rounded-md mb-1" />
                        <Skeleton className="h-3 w-1/4 rounded-md" />
                    </CardHeader>
                    <CardContent className="pb-3">
                        <Skeleton className="h-10 w-full rounded-md mb-3" />
                         <Skeleton className="h-2 w-full rounded-full mb-1.5" />
                         <Skeleton className="h-3 w-1/2 rounded-md" />
                    </CardContent>
                     <div className="p-4 pt-0">
                         <Skeleton className="h-9 w-full rounded-md" />
                     </div>
                </Card>
            ))}
        </div>
      </div>
    );
}
