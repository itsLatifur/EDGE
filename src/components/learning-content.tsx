
'use client';

import React, {useState, useEffect, useRef} from 'react';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Progress} from '@/components/ui/progress';
import {Button} from '@/components/ui/button';
import {PlayCircle, CheckCircle, Circle, ListVideo, Info} from 'lucide-react';
import {cn} from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ContentItem {
  id: string;
  title: string;
  url: string;
  duration: number; // Duration in seconds
  description?: string; // Optional description
}

interface UserHistory {
  [videoId: string]: {watchedTime: number; lastWatched: Date};
}

interface LearningContentProps {
  title: string;
  type: 'video' | 'article' | 'playlist';
  url?: string; // Used for single video/article or continue watching
  // videoId?: string; // Kept for potential single video use cases without full details initially
  playlist?: ContentItem[];
  userHistory: UserHistory;
  onProgressUpdate: (videoId: string, currentTime: number) => void;
  currentTab?: string; // To know which tab's playlist is active
  isContinueWatching?: boolean; // Flag for the special "continue watching" card
  initialStartTime?: number; // Start time for "continue watching"
  videoDetails?: ContentItem | null; // Pass full details when available, esp. for continue watching
}

const LearningContent: React.FC<LearningContentProps> = ({
  title,
  type,
  url,
  playlist = [],
  userHistory,
  onProgressUpdate,
  currentTab,
  isContinueWatching = false,
  initialStartTime = 0,
  videoDetails, // Receive full video details
}) => {
  const [activeVideo, setActiveVideo] = useState<ContentItem | null>(null);
  const [activeVideoStartTime, setActiveVideoStartTime] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const internalUserHistoryRef = useRef(userHistory); // Ref to track latest history for progress update logic

  // Update ref whenever userHistory prop changes
  useEffect(() => {
    internalUserHistoryRef.current = userHistory;
  }, [userHistory]);


  // Determine the initial/active video based on type and props
  useEffect(() => {
    if (isContinueWatching && videoDetails) {
      // Case 1: Continue Watching card - use provided videoDetails
      setActiveVideo(videoDetails);
      setActiveVideoStartTime(initialStartTime);
    } else if (type === 'playlist' && playlist.length > 0) {
      // Case 2: Playlist view - find first unwatched/partially watched or default to first
      const firstUnwatched = playlist.find(
        (item) => !userHistory[item.id] || (item.duration > 0 && userHistory[item.id].watchedTime < item.duration * 0.99) // Consider watched if very close to end
      );
      const videoToPlay = firstUnwatched || playlist[0]; // Fallback to first video
      setActiveVideo(videoToPlay);
      setActiveVideoStartTime(userHistory[videoToPlay.id]?.watchedTime || 0);
    } else if (type === 'video' && url && videoDetails) {
        // Case 3: Single video display (if needed, though playlist is primary)
        setActiveVideo(videoDetails);
        setActiveVideoStartTime(initialStartTime);
    } else {
        // Reset if no valid case
        setActiveVideo(null);
        setActiveVideoStartTime(0);
    }
    // Dependencies: Recalculate when playlist, history, or specific video details change
  }, [type, playlist, userHistory, isContinueWatching, videoDetails, initialStartTime, currentTab]);


  // Update iframe src only when activeVideo or its specific startTime changes
  useEffect(() => {
      if (activeVideo && iframeRef.current) {
          const videoUrl = new URL(activeVideo.url);
          // Use activeVideoStartTime state for the start parameter
          videoUrl.searchParams.set('start', Math.floor(activeVideoStartTime).toString());
          videoUrl.searchParams.set('enablejsapi', '1'); // Enable JS API
          videoUrl.searchParams.set('origin', window.location.origin); // Necessary for API

          const newSrc = videoUrl.toString();
          // Only update src if it's actually different to avoid unnecessary reloads
          if (iframeRef.current.src !== newSrc) {
            iframeRef.current.src = newSrc;
          }
      } else if (!activeVideo && iframeRef.current) {
          // Clear src if no active video
          iframeRef.current.src = '';
      }
  }, [activeVideo, activeVideoStartTime]); // Depends only on activeVideo object and its start time state


  // Set up interval to track video progress (Simplified)
  // NOTE: This is a basic polling mechanism. A robust solution would use the YouTube IFrame Player API
  //       to get accurate currentTime updates via postMessage events. Implementing the full API
  //       is complex and outside the scope of this basic example.
  useEffect(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    if (activeVideo && type !== 'article') {
        // Start tracking from the current activeVideoStartTime
        let pseudoCurrentTime = activeVideoStartTime;

        progressIntervalRef.current = setInterval(() => {
             const currentActiveVideo = activeVideo; // Capture current active video in this closure
             if (currentActiveVideo) {
                pseudoCurrentTime += 1; // Increment time every second

                // Use the duration from the activeVideo object
                const knownDuration = currentActiveVideo.duration;

                // Get the latest watched time from the ref to avoid stale state
                const latestWatchedTime = internalUserHistoryRef.current[currentActiveVideo.id]?.watchedTime || 0;

                // Update progress if the pseudo time is greater than the last known watched time
                // and within the video duration (if known)
                if (pseudoCurrentTime > latestWatchedTime && (knownDuration <= 0 || pseudoCurrentTime <= knownDuration)) {
                    onProgressUpdate(currentActiveVideo.id, pseudoCurrentTime);
                }

                // Stop interval if duration is known and pseudo time exceeds it
                if (knownDuration > 0 && pseudoCurrentTime >= knownDuration) {
                   if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                }
             } else {
                 // Clear interval if video becomes null
                 if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
             }
        }, 1000); // Update every second
    }

    // Cleanup function to clear interval when component unmounts or activeVideo changes
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
    // Rerun this effect ONLY when activeVideo changes, or the initial start time changes
  }, [activeVideo, activeVideoStartTime, onProgressUpdate]);


  const handlePlaylistItemClick = (item: ContentItem) => {
    if (activeVideo?.id !== item.id) {
        setActiveVideo(item);
        // Set start time based on history, defaulting to 0 if no history
        setActiveVideoStartTime(internalUserHistoryRef.current[item.id]?.watchedTime || 0);
    }
  };

  const getVideoProgress = (item: ContentItem): number => {
      const history = internalUserHistoryRef.current[item.id];
      if (!history || !item.duration || item.duration <= 0) return 0;
      // Calculate progress, ensuring it doesn't exceed 100%
      return Math.min(100, (history.watchedTime / item.duration) * 100);
  }

  const formatTime = (seconds: number): string => {
      if (isNaN(seconds) || seconds < 0) return "0:00";
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }

  const getWatchedTime = (itemId: string): number => {
      return internalUserHistoryRef.current[itemId]?.watchedTime || 0;
  }


  return (
    <Card className={cn("overflow-hidden shadow-lg transition-shadow hover:shadow-xl duration-300", {
        'bg-secondary/50': isContinueWatching // Slightly different background for continue watching
    })}>
      {/* Header only shown for playlist view, not for continue watching */}
      {!isContinueWatching && type === 'playlist' && (
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
                <ListVideo className="h-5 w-5" /> {title}
            </CardTitle>
            <CardDescription>Select a video from the playlist below to start learning.</CardDescription>
          </CardHeader>
      )}

      <CardContent className={cn("p-0", {
        'md:grid md:grid-cols-10 gap-0': type === 'playlist' && !isContinueWatching, // Adjust grid for playlist view
        'block': type === 'video' || isContinueWatching, // Single column for video/continue watching
      })}>

        {/* Video Player Area */}
        {(type === 'playlist' || type === 'video') && (activeVideo || url) && (
          <div className={cn("aspect-video", {
              'md:col-span-7': type === 'playlist' && !isContinueWatching, // Video takes more space in playlist view on desktop
              'md:col-span-10': type === 'video' || isContinueWatching, // Full width for single video or continue watching
              'border-b md:border-b-0 md:border-r': type === 'playlist' && !isContinueWatching // Border separates video and list
          })}>
            <iframe
              ref={iframeRef}
              width="100%"
              height="100%"
              // src is set via useEffect to avoid direct manipulation causing reloads
              title={activeVideo?.title || title || 'YouTube video player'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="transition-opacity duration-500 ease-in-out block bg-black" // Ensure it's a block element
              key={activeVideo?.id || videoDetails?.id} // Force iframe re-render if the video ID changes
            ></iframe>
          </div>
        )}

        {/* Playlist Area */}
        {type === 'playlist' && !isContinueWatching && (
          <ScrollArea className="md:col-span-3 h-64 md:h-[calc(100vh-250px)]"> {/* Adjust height */}
            <div className="p-3 space-y-2">
              {playlist.map((item) => {
                const progress = getVideoProgress(item);
                const watchedTime = getWatchedTime(item.id);
                const isCompleted = progress >= 99; // Consider completed if very close to end
                const isActive = activeVideo?.id === item.id;

                let IconComponent = Circle;
                let iconColor = "text-muted-foreground";
                if (isCompleted) {
                    IconComponent = CheckCircle;
                    iconColor = "text-green-500";
                } else if (isActive) {
                    IconComponent = PlayCircle;
                    iconColor = "text-primary animate-pulse";
                } else if (watchedTime > 0) {
                    IconComponent = PlayCircle; // Show play if partially watched but not active
                    iconColor = "text-primary/60";
                }

                return (
                  <TooltipProvider key={item.id} delayDuration={300}>
                   <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start h-auto py-2.5 px-3 text-left relative transition-all duration-200 rounded-md",
                           isActive ? 'bg-accent shadow-inner ring-1 ring-primary/20' : 'hover:bg-muted/50'
                        )}
                        onClick={() => handlePlaylistItemClick(item)}
                      >
                        <div className="flex items-start space-x-3 w-full">
                           <IconComponent className={cn("h-5 w-5 mt-0.5 flex-shrink-0", iconColor)} />
                           <div className="flex-grow overflow-hidden mr-2">
                               <p className={`text-sm font-medium truncate ${isActive ? 'text-accent-foreground' : 'text-foreground'}`}>{item.title}</p>
                               <p className="text-xs text-muted-foreground">
                                    {formatTime(item.duration)}
                                    {watchedTime > 0 && ` | Watched: ${formatTime(watchedTime)}`}
                               </p>
                                {item.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                                )}
                          </div>
                        </div>
                        {progress > 0 && (
                            <Progress
                              value={progress}
                              className="absolute bottom-0 left-0 right-0 h-1 rounded-b-md rounded-t-none"
                              aria-label={`${item.title} progress: ${Math.round(progress)}%`}
                            />
                        )}
                      </Button>
                      </TooltipTrigger>
                       {(item.description || (watchedTime > 0)) && (
                           <TooltipContent side="left" align="center" className="max-w-xs">
                             <p className="font-medium">{item.title}</p>
                             {item.description && <p className="text-sm text-muted-foreground my-1">{item.description}</p>}
                             <p className="text-xs">Duration: {formatTime(item.duration)}</p>
                             {watchedTime > 0 && <p className="text-xs">Watched: {formatTime(watchedTime)} ({Math.round(progress)}%)</p>}
                           </TooltipContent>
                       )}
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Article Area (Placeholder) */}
        {type === 'article' && url && (
          <div className="p-6 md:col-span-10">
             <CardHeader>
                 <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5"/> {title}</CardTitle>
             </CardHeader>
             <CardContent>
                 {/* In a real app, fetch and render article content here */}
                 <p className="text-muted-foreground mb-4">Article content for "{title}" would be displayed here. This could involve fetching markdown or using an embedded view.</p>
                 <Button asChild variant="link" className="px-0">
                     <a href={url} target="_blank" rel="noopener noreferrer">
                       Read full article
                     </a>
                 </Button>
             </CardContent>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LearningContent;
