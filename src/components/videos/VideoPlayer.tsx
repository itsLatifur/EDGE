// src/components/videos/VideoPlayer.tsx
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  videoId: string;
  title: string;
  isStuckToBottom?: boolean;
}

export function VideoPlayer({ videoId, title, isStuckToBottom = false }: VideoPlayerProps) {
  if (!videoId) {
    return (
      <div className={cn(
        "aspect-video w-full bg-muted flex items-center justify-center",
        isStuckToBottom ? "rounded-t-lg md:rounded-lg" : "rounded-lg"
      )}>
        <p className="text-muted-foreground">Select a video to play</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "aspect-video w-full overflow-hidden shadow-lg",
      isStuckToBottom ? "rounded-t-lg md:rounded-lg" : "rounded-lg"
    )}>
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="bg-black"
      ></iframe>
    </div>
  );
}
