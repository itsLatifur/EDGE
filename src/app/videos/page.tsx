// src/app/videos/page.tsx
"use client";

import { useState, useMemo } from 'react';
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

  const [currentVideoId, setCurrentVideoId] = useState<string | null>(
    currentPlaylist?.videos[0]?.id || null
  );

  const handleTabChange = (tabId: string) => {
    setActiveCategory(tabId);
    const newPlaylist = SAMPLE_PLAYLIST_DATA[tabId];
    setCurrentVideoId(newPlaylist?.videos[0]?.id || null);
  };

  const handleVideoSelect = (videoId: string) => {
    setCurrentVideoId(videoId);
  };

  const selectedVideo = useMemo(() => {
    return currentPlaylist?.videos.find(v => v.id === currentVideoId);
  }, [currentPlaylist, currentVideoId]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Learn with Videos</h1>
      <TabNavigation tabs={CATEGORIES} defaultTab={activeCategory} onTabChange={handleTabChange}>
        {(tabId) => {
          const playlist = SAMPLE_PLAYLIST_DATA[tabId];
          if (!playlist) {
            return <p>No videos available for this category yet.</p>;
          }
          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              <div className="lg:col-span-2">
                <VideoPlayer 
                  videoId={currentVideoId || ""} 
                  title={selectedVideo?.title || "Select a video"}
                />
                 {selectedVideo && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle>{selectedVideo.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Now playing: {selectedVideo.title}. Select another video from the playlist on the right.
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
