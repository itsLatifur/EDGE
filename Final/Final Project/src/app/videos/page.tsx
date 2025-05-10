// src/app/videos/page.tsx
"use client";

import { useState, useMemo, useEffect, Suspense, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { TabNavigation } from '@/components/shared/TabNavigation';
import { VideoPlayer } from '@/components/videos/VideoPlayer';
import { VideoPlaylist } from '@/components/videos/VideoPlaylist';
import { 
    type PlaylistData, 
    getCategories, 
    getPlaylistData,
    LUCIDE_ICON_MAP,
    type CategoryTab
} from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';


function VideosPageContent() {
  const searchParams = useSearchParams();
  const initialTabFromQuery = searchParams.get('tab');

  const [dynamicCategories, setDynamicCategories] = useState<CategoryTab[]>([]);
  const [dynamicPlaylists, setDynamicPlaylists] = useState<Record<string, PlaylistData>>({});
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(() => {
    setIsLoading(true);
    setDynamicCategories(getCategories());
    setDynamicPlaylists(getPlaylistData());
    setIsLoading(false);
  }, []);
  
  useEffect(() => {
    refreshData();
  }, [refreshData]);


  const [activeCategory, setActiveCategory] = useState<string>("");
   
  useEffect(() => {
    if (dynamicCategories.length > 0) {
        const isValidTab = dynamicCategories.some(c => c.id === initialTabFromQuery);
        // Set active category only if it's different or not set yet
        const newActiveCategory = isValidTab && initialTabFromQuery ? initialTabFromQuery : dynamicCategories[0].id;
        if (newActiveCategory !== activeCategory) {
            setActiveCategory(newActiveCategory);
        }
    }
  }, [initialTabFromQuery, dynamicCategories, activeCategory]);


  const currentPlaylist: PlaylistData | undefined = useMemo(() => {
    return dynamicPlaylists[activeCategory];
  }, [activeCategory, dynamicPlaylists]);

  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  const tabsRef = useRef<HTMLDivElement>(null);
  const videoPlayerRef = useRef<HTMLDivElement>(null);
  const videoInfoRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const newPlaylist = dynamicPlaylists[activeCategory];
    setCurrentVideoId(newPlaylist?.videos[0]?.id || null);
  }, [activeCategory, dynamicPlaylists]);

  useEffect(() => {
    const tabFromQuery = searchParams.get('tab');
    if (dynamicCategories.length > 0) {
        const isValidTab = dynamicCategories.some(c => c.id === tabFromQuery);
        if (isValidTab && tabFromQuery && tabFromQuery !== activeCategory) {
          setActiveCategory(tabFromQuery);
        } else if (!isValidTab && tabFromQuery && activeCategory !== dynamicCategories[0].id) {
          // If query tab is no longer valid, default to first available
          setActiveCategory(dynamicCategories[0].id);
        }
    }
  }, [searchParams, activeCategory, dynamicCategories]);
  
  useEffect(() => {
    const root = document.documentElement;
    const headerElement = document.querySelector('header');
    const headerHeight = headerElement ? headerElement.offsetHeight : 64; 
    root.style.setProperty('--header-height', `${headerHeight}px`);

    if (tabsRef.current) {
      root.style.setProperty('--tabs-height', `${tabsRef.current.offsetHeight}px`);
    }
    if (videoPlayerRef.current) {
      const playerWidth = videoPlayerRef.current.offsetWidth;
      const playerHeight = (playerWidth * 9) / 16; // Assuming 16:9 aspect ratio
      root.style.setProperty('--video-player-aspect-ratio-height', `${playerHeight}px`);
    }
     if (videoInfoRef.current) {
      root.style.setProperty('--video-info-height', `${videoInfoRef.current.offsetHeight}px`);
    }

  }, [activeCategory, currentVideoId]); // Re-run if activeCategory or currentVideoId changes layout


  const handleTabChange = (tabId: string) => {
    setActiveCategory(tabId);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', tabId);
    window.history.pushState({ path: newUrl.href }, '', newUrl.href);
  };

  const handleVideoSelect = (videoId: string) => {
    setCurrentVideoId(videoId);
     if (videoPlayerRef.current) {
      videoPlayerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const selectedVideo = useMemo(() => {
    return currentPlaylist?.videos.find(v => v.id === currentVideoId);
  }, [currentPlaylist, currentVideoId]);

  if (isLoading) {
    return <VideosPageSkeleton />;
  }

  if (dynamicCategories.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No video categories available. Content might be managed by an administrator.</p>
        </CardContent>
      </Card>
    );
  }

  const tabsForNavigation = dynamicCategories.map(cat => ({
    ...cat,
    icon: LUCIDE_ICON_MAP[cat.iconName] || LUCIDE_ICON_MAP.Video, // Fallback icon
  }));

  return (
    <div className="space-y-0 md:space-y-4 lg:space-y-6">
      <div ref={tabsRef} className="sticky top-[var(--header-height,64px)] z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:pt-2 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 md:shadow-none shadow-sm mb-4 md:mb-0">
        <TabNavigation tabs={tabsForNavigation} defaultTab={activeCategory} onTabChange={handleTabChange} />
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
      <div className="flex space-x-2 mb-6 sticky top-[var(--header-height,64px)] z-40 bg-background md:pt-2 p-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 md:shadow-none shadow-sm">
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
