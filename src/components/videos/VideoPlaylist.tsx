// src/components/videos/VideoPlaylist.tsx
import Image from 'next/image';
import type { VideoItem } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { PlayCircle } from 'lucide-react';

interface VideoPlaylistProps {
  playlistName: string;
  videos: VideoItem[];
  currentVideoId: string | null;
  onVideoSelect: (videoId: string) => void;
}

export function VideoPlaylist({ playlistName, videos, currentVideoId, onVideoSelect }: VideoPlaylistProps) {
  return (
    <Card className="shadow-xl sticky top-[calc(var(--header-height,64px)_+_var(--tabs-height,58px)_+_1.5rem)] md:top-[calc(var(--header-height,64px)_+_1.5rem)]">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">{playlistName}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea 
          className="h-[calc(100vh-var(--header-height,64px)-var(--tabs-height,58px)-var(--video-player-aspect-ratio-height,0px)-var(--video-info-height,0px)-10rem)] 
                     md:h-[calc(100vh-var(--header-height,64px)-12rem)] 
                     max-h-[400px] md:max-h-[500px] lg:max-h-[600px] pr-3"
        >
          <div className="space-y-3">
            {videos.map((video) => (
              <button
                key={video.id}
                onClick={() => onVideoSelect(video.id)}
                aria-pressed={video.id === currentVideoId}
                className={cn(
                  "flex items-center w-full p-2 md:p-3 rounded-lg transition-all duration-200 ease-in-out group",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  video.id === currentVideoId 
                    ? "bg-primary/10 ring-2 ring-primary shadow-lg" 
                    : "bg-card hover:bg-accent/10 hover:shadow-md"
                )}
              >
                <div className="relative w-24 h-14 md:w-28 md:h-16 mr-3 md:mr-4 rounded-md overflow-hidden shrink-0 shadow-sm">
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={cn(
                        "object-cover transition-transform duration-300 ease-in-out",
                        video.id === currentVideoId ? "scale-100" : "group-hover:scale-105"
                    )}
                    data-ai-hint="video thumbnail"
                  />
                   {video.id === currentVideoId && (
                    <div className="absolute inset-0 bg-primary/50 flex items-center justify-center">
                      <PlayCircle className="h-6 w-6 md:h-8 md:w-8 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="text-left">
                    <span className={cn(
                        "text-xs md:text-sm font-medium line-clamp-2", // Adjusted: default text-xs, md:text-sm
                        video.id === currentVideoId ? "text-primary" : "text-card-foreground group-hover:text-accent-foreground"
                    )}>
                    {video.title}
                    </span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
