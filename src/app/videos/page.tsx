// src/app/videos/page.tsx
"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TabNavigation } from '@/components/shared/TabNavigation';
import { VideoPlayer } from '@/components/videos/VideoPlayer';
import { VideoPlaylist } from '@/components/videos/VideoPlaylist';
import { CATEGORIES, SAMPLE_PLAYLIST_DATA, type PlaylistData } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';


function VideosPageContent() {
  const searchParams = useSearchParams();
  const initialTabFromQuery = searchParams.get('tab');

  const [activeCategory, setActiveCategory] = useState<string>(() => {
    const isValidTab = CATEGORIES.some(c => c.id === initialTabFromQuery);
    return isValidTab && initialTabFromQuery ? initialTabFromQuery : CATEGORIES[0].id;
  });
  
  const currentPlaylist: PlaylistData | undefined = useMemo(() => {
    return SAMPLE_PLAYLIST_DATA[activeCategory];
  }, [activeCategory]);

  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  useEffect(() => {
    // Set initial video for the active category or when category changes
    const newPlaylist = SAMPLE_PLAYLIST_DATA[activeCategory];
    setCurrentVideoId(newPlaylist?.videos[0]?.id || null);
  }, [activeCategory]);

  // Effect to update activeCategory if query param changes after initial load (e.g. browser back/forward)
  useEffect(() => {
    const tabFromQuery = searchParams.get('tab');
    const isValidTab = CATEGORIES.some(c => c.id === tabFromQuery);
    if (isValidTab && tabFromQuery && tabFromQuery !== activeCategory) {
      setActiveCategory(tabFromQuery);
    }
  }, [searchParams, activeCategory]);


  const handleTabChange = (tabId: string) => {
    setActiveCategory(tabId);
    // VideoId will be updated by the useEffect hook when activeCategory changes
  };

  const handleVideoSelect = (videoId: string) => {
    setCurrentVideoId(videoId);
  };

  const selectedVideo = useMemo(() => {
    return currentPlaylist?.videos.find(v => v.id === currentVideoId);
  }, [currentPlaylist, currentVideoId]);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header removed as per request */}
      <TabNavigation tabs={CATEGORIES} defaultTab={activeCategory} onTabChange={handleTabChange}>
        {(tabId) => {
          const playlist = SAMPLE_PLAYLIST_DATA[tabId];
          if (!playlist || playlist.videos.length === 0) {
            return (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">No videos available for {CATEGORIES.find(c => c.id === tabId)?.label || 'this category'} yet. Stay tuned!</p>
                </CardContent>
              </Card>
            );
          }
          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              <div className="lg:col-span-2 space-y-4">
                <VideoPlayer 
                  videoId={selectedVideo?.id || ""} 
                  title={selectedVideo?.title || "Select a video"}
                />
                 {selectedVideo && (
                  <Card className="shadow-lg">
                    <CardHeader className="py-4">
                      <CardTitle className="text-xl md:text-2xl">{selectedVideo.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <CardDescription className="text-sm text-muted-foreground"> {/* Decreased text size here */}
                        Now playing: {selectedVideo.title}. Choose another video from the playlist to continue learning.
                      </CardDescription>
                    </CardContent>
                  </Card>
                )}
                {!selectedVideo && playlist.videos.length > 0 && (
                   <Card className="shadow-lg">
                    <CardHeader className="py-4">
                      <CardTitle className="text-xl md:text-2xl">Welcome to {playlist.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <CardDescription className="text-sm text-muted-foreground"> {/* Decreased text size here */}
                        Select a video from the playlist on the right to start watching.
                      </CardDescription>
                    </CardContent>
                  </Card>
                )}
              </div>
              <div className="lg:col-span-1">
                <VideoPlaylist
                  playlistName={playlist.name}
                  videos={playlist.videos}
                  currentVideoId={currentVideoId}
                  onVideoSelect={handleVideoSelect}
                />
              </div>
            </div>
          );
        }}
      </TabNavigation>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function VideosPage() {
  return (
    <Suspense fallback={<VideosPageSkeleton />}>
      <VideosPageContent />
    </Suspense>
  );
}

function VideosPageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Skeleton for removed header */}
      {/* <header className="mb-6">
        <Skeleton className="h-12 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2" />
      </header> */}
      <div className="flex space-x-2 mb-6">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" /> {/* Adjusted skeleton height for smaller text card */}
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-[calc(100vh-16rem)] max-h-[550px] w-full rounded-lg" /> {/* Adjusted max height */}
        </div>
      </div>
    </div>
  );
}

