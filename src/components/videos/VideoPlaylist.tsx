// src/components/videos/VideoPlaylist.tsx
import Image from 'next/image';
import type { VideoItem } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface VideoPlaylistProps {
  playlistName: string;
  videos: VideoItem[];
  currentVideoId: string | null;
  onVideoSelect: (videoId: string) => void;
}

export function VideoPlaylist({ playlistName, videos, currentVideoId, onVideoSelect }: VideoPlaylistProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">{playlistName}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4"> {/* Adjust height as needed */}
          <div className="space-y-3">
            {videos.map((video) => (
              <button
                key={video.id}
                onClick={() => onVideoSelect(video.id)}
                aria-pressed={video.id === currentVideoId}
                className={cn(
                  "flex items-center w-full p-2 rounded-md transition-all duration-150 ease-in-out",
                  "hover:bg-accent/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  video.id === currentVideoId ? "bg-accent ring-2 ring-primary" : "bg-card hover:bg-accent/50"
                )}
              >
                <div className="relative w-24 h-14 mr-3 rounded overflow-hidden shrink-0">
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    data-ai-hint="video thumbnail"
                  />
                </div>
                <span className="text-sm font-medium text-left line-clamp-2 text-card-foreground">
                  {video.title}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
