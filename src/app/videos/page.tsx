// src/app/videos/page.tsx
"use client";

import { useState, useMemo, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { TabNavigation } from '@/components/shared/TabNavigation';
import { VideoPlayer } from '@/components/videos/VideoPlayer';
import { VideoPlaylist } from '@/components/videos/VideoPlaylist';
import { CATEGORIES, SAMPLE_PLAYLIST_DATA, type PlaylistData, getCategories, getPlaylistData } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function VideosPageContent() {
  const searchParams = useSearchParams();
  const initialTabFromQuery = searchParams.get('tab');

  // Fetch categories and playlists dynamically
  const [dynamicCategories, setDynamicCategories] = useState(() => getCategories());
  const [dynamicPlaylists, setDynamicPlaylists] = useState(() => getPlaylistData());


  const [activeCategory, setActiveCategory] = useState<string>(() => {
    const isValidTab = dynamicCategories.some(c => c.id === initialTabFromQuery);
    return isValidTab && initialTabFromQuery ? initialTabFromQuery : (dynamicCategories.length > 0 ? dynamicCategories[0].id : "");
  });
  
  const currentPlaylist: PlaylistData | undefined = useMemo(() => {
    return dynamicPlaylists[activeCategory];
  }, [activeCategory, dynamicPlaylists]);

  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  const tabsRef = useRef<HTMLDivElement>(null);
  const videoPlayerRef = useRef<HTMLDivElement>(null);
  const videoInfoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Update categories and playlists if they change (e.g., after admin updates)
    // For this demo, this will re-fetch from the module-level exports
    setDynamicCategories(getCategories());
    setDynamicPlaylists(getPlaylistData());
  }, []); // Could add a dependency if there was a global state update mechanism

  useEffect(() => {
    const newPlaylist = dynamicPlaylists[activeCategory];
    setCurrentVideoId(newPlaylist?.videos[0]?.id || null);
  }, [activeCategory, dynamicPlaylists]);

  useEffect(() => {
    const tabFromQuery = searchParams.get('tab');
    const isValidTab = dynamicCategories.some(c => c.id === tabFromQuery);
    if (isValidTab && tabFromQuery && tabFromQuery !== activeCategory) {
      setActiveCategory(tabFromQuery);
    } else if (!isValidTab && initialTabFromQuery && dynamicCategories.length > 0) {
      // If query tab is invalid, default to first available category
      setActiveCategory(dynamicCategories[0].id);
    }
  }, [searchParams, activeCategory, dynamicCategories, initialTabFromQuery]);
  
  useEffect(() => {
    const root = document.documentElement;
    const headerHeight = document.querySelector('header')?.offsetHeight || 64; 
    root.style.setProperty('--header-height', `${headerHeight}px`);

    if (tabsRef.current) {
      root.style.setProperty('--tabs-height', `${tabsRef.current.offsetHeight}px`);
    }
    if (videoPlayerRef.current) {
      const playerWidth = videoPlayerRef.current.offsetWidth;
      const playerHeight = (playerWidth * 9) / 16;
      root.style.setProperty('--video-player-aspect-ratio-height', `${playerHeight}px`);
    }
     if (videoInfoRef.current) {
      root.style.setProperty('--video-info-height', `${videoInfoRef.current.offsetHeight}px`);
    }

  }, [activeCategory, currentVideoId]);


  const handleTabChange = (tabId: string) => {
    setActiveCategory(tabId);
  };

  const handleVideoSelect = (videoId: string) => {
    setCurrentVideoId(videoId);
  };

  const selectedVideo = useMemo(() => {
    return currentPlaylist?.videos.find(v => v.id === currentVideoId);
  }, [currentPlaylist, currentVideoId]);

  if (dynamicCategories.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No video categories available. Content might be managed by an administrator.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-0 md:space-y-4 lg:space-y-6">
      <div ref={tabsRef} className="sticky top-[var(--header-height,64px)] z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:pt-2 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 md:shadow-none shadow-sm mb-4 md:mb-0">
        <TabNavigation tabs={dynamicCategories} defaultTab={activeCategory} onTabChange={handleTabChange} />
      </div>
      
      {(!currentPlaylist || currentPlaylist.videos.length === 0) ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No videos available for {dynamicCategories.find(c => c.id === activeCategory)?.label || 'this category'} yet. Stay tuned!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-0 md:space-y-4">
            <div ref={videoPlayerRef} className="sticky top-[calc(var(--header-height,64px)_+_var(--tabs-height,58px))] md:top-[calc(var(--header-height,64px)_+_var(--tabs-height,58px)_+1rem)] z-30">
              <VideoPlayer 
                videoId={selectedVideo?.id || ""} 
                title={selectedVideo?.title || "Select a video"}
                isStuckToBottom={!!selectedVideo}
              />
            </div>
             {selectedVideo && (
              <div ref={videoInfoRef} className="sticky top-[calc(var(--header-height,64px)_+_var(--tabs-height,58px)_+_var(--video-player-aspect-ratio-height,0px))] md:top-auto md:static z-20 md:z-auto -mt-[1px] md:mt-0">
                <Card className="shadow-lg rounded-none rounded-b-lg md:rounded-lg mt-0 ">
                  <CardHeader className="p-3 md:px-4 md:py-3">
                    <CardTitle className="text-sm md:text-base lg:text-lg">{selectedVideo.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 md:px-4 md:pb-3">
                    <CardDescription className="text-xs md:text-sm text-muted-foreground">
                      Now playing: {selectedVideo.title}.
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            )}
            {!selectedVideo && currentPlaylist.videos.length > 0 && (
               <Card className="shadow-lg">
                <CardHeader className="py-4">
                  <CardTitle className="text-xl md:text-2xl">Welcome to {currentPlaylist.name}</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <CardDescription className="text-sm text-muted-foreground">
                    Select a video from the playlist on the right to start watching.
                  </CardDescription>
                </CardContent>
              </Card>
            )}
          </div>
          <div className="lg:col-span-1">
            <VideoPlaylist
              playlistName={currentPlaylist.name}
              videos={currentPlaylist.videos}
              currentVideoId={currentVideoId}
              onVideoSelect={handleVideoSelect}
            />
          </div>
        </div>
      )}
    </div>
  );
}

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
      <div className="flex space-x-2 mb-6 sticky top-[var(--header-height,64px)] z-40 bg-background md:pt-2 p-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="aspect-video w-full rounded-lg sticky top-[calc(var(--header-height,64px)_+_var(--tabs-height,58px))] md:top-[calc(var(--header-height,64px)_+_var(--tabs-height,58px)_+1rem)] z-30" />
          <Skeleton className="h-20 w-full rounded-lg sticky top-[calc(var(--header-height,64px)_+_var(--tabs-height,58px)_+_var(--video-player-aspect-ratio-height,0px))] md:static z-20" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-[calc(100vh-16rem)] max-h-[550px] w-full rounded-lg sticky top-[calc(var(--header-height,64px)_+_var(--tabs-height,58px)_+_1.5rem)] md:top-[calc(var(--header-height,64px)_+_1.5rem)]" />
        </div>
      </div>
    </div>
  );
}

