// src/app/videos/page.tsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import { TabNavigation } from '@/components/shared/TabNavigation';
import { VideoPlayer } from '@/components/videos/VideoPlayer';
import { VideoPlaylist } from '@/components/videos/VideoPlaylist';
import { CATEGORIES, SAMPLE_PLAYLIST_DATA, type PlaylistData } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function VideosPage() {
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0].id);
  
  const currentPlaylist: PlaylistData | undefined = useMemo(() => {
    return SAMPLE_PLAYLIST_DATA[activeCategory];
  }, [activeCategory]);

  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  useEffect(() => {
    // Set initial video for the default category or when category changes
    const initialPlaylist = SAMPLE_PLAYLIST_DATA[activeCategory];
    setCurrentVideoId(initialPlaylist?.videos[0]?.id || null);
  }, [activeCategory]);


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
    <div className="space-y-8">
      <header className="mb-6">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Learn with Videos</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Explore curated video playlists on HTML, CSS, and JavaScript to kickstart your web development journey.
        </p>
      </header>
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
                    <CardHeader>
                      <CardTitle className="text-2xl">{selectedVideo.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        Now playing: {selectedVideo.title}. Choose another video from the playlist to continue learning.
                      </CardDescription>
                    </CardContent>
                  </Card>
                )}
                {!selectedVideo && playlist.videos.length > 0 && (
                   <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-2xl">Welcome to {playlist.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
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
