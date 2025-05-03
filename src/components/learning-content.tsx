
'use client';

import React, {useState, useEffect, useRef} from 'react';
import Image from 'next/image';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Progress} from '@/components/ui/progress';
import {Button} from '@/components/ui/button';
import {PlayCircle, CheckCircle, Circle, ListVideo, Info, Clock } from 'lucide-react';
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
  url?: string; // Used for single video/article
  playlist?: ContentItem[];
  userHistory: UserHistory;
  onProgressUpdate: (videoId: string, currentTime: number) => void;
  currentTab?: string; // To know which tab's playlist is active
  // Removed isContinueWatching and initialStartTime, videoDetails as they are handled internally
}

const LearningContent: React.FC<LearningContentProps> = ({
  title,
  type,
  url,
  playlist = [],
  userHistory,
  onProgressUpdate,
  currentTab,
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
    if (type === 'playlist' && playlist.length > 0) {
      // Find the most recently watched video within *this* playlist
      const playlistVideoIds = new Set(playlist.map(v => v.id));
      const recentHistoryInPlaylist = Object.entries(internalUserHistoryRef.current)
        .filter(([videoId]) => playlistVideoIds.has(videoId))
        .sort(([, a], [, b]) => b.lastWatched.getTime() - a.lastWatched.getTime());

      let videoToPlay: ContentItem | null = null;
      let startTime = 0;

      if (recentHistoryInPlaylist.length > 0) {
          const [latestVideoId, latestData] = recentHistoryInPlaylist[0];
          const videoDetails = playlist.find(v => v.id === latestVideoId);
          // Only resume if not fully watched (e.g., less than 99% watched)
          if (videoDetails && latestData.watchedTime < videoDetails.duration * 0.99) {
              videoToPlay = videoDetails;
              startTime = latestData.watchedTime;
          }
      }

      // If no resumable video found, find the first unwatched/partially watched in order
      if (!videoToPlay) {
          const firstUnwatched = playlist.find(
              (item) => !internalUserHistoryRef.current[item.id] || (item.duration > 0 && internalUserHistoryRef.current[item.id].watchedTime < item.duration * 0.99)
          );
          videoToPlay = firstUnwatched || playlist[0]; // Fallback to the very first video
          startTime = internalUserHistoryRef.current[videoToPlay.id]?.watchedTime || 0;
      }

      setActiveVideo(videoToPlay);
      setActiveVideoStartTime(startTime);

    } else if (type === 'video' && url) {
        // Case for single video display (less common now)
        // We need a way to get videoDetails if only url is provided initially.
        // For now, assuming videoDetails would be passed somehow if needed.
        // setActiveVideo(videoDetails);
        // setActiveVideoStartTime(initialStartTime);
        setActiveVideo(null); // Reset if playlist logic doesn't apply
        setActiveVideoStartTime(0);
    } else {
        // Reset if no valid case
        setActiveVideo(null);
        setActiveVideoStartTime(0);
    }
    // Dependencies: Recalculate when playlist, history, or currentTab changes
  }, [type, playlist, userHistory, url, currentTab]); // Added currentTab dependency


  // Update iframe src only when activeVideo or its specific startTime changes
  useEffect(() => {
      if (activeVideo && iframeRef.current) {
          const videoUrl = new URL(activeVideo.url);
          videoUrl.searchParams.set('start', Math.floor(activeVideoStartTime).toString());
          videoUrl.searchParams.set('enablejsapi', '1');
          videoUrl.searchParams.set('origin', window.location.origin);

          const newSrc = videoUrl.toString();
          if (iframeRef.current.src !== newSrc) {
            iframeRef.current.src = newSrc;
          }
      } else if (!activeVideo && iframeRef.current) {
          iframeRef.current.src = '';
      }
  }, [activeVideo, activeVideoStartTime]);


  // Set up interval to track video progress (Simplified)
  useEffect(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    if (activeVideo && type !== 'article') {
        let pseudoCurrentTime = activeVideoStartTime;

        progressIntervalRef.current = setInterval(() => {
             const currentActiveVideo = activeVideo; // Capture current active video
             if (currentActiveVideo) {
                pseudoCurrentTime += 1;
                const knownDuration = currentActiveVideo.duration;
                const latestWatchedTime = internalUserHistoryRef.current[currentActiveVideo.id]?.watchedTime || 0;

                if (pseudoCurrentTime > latestWatchedTime && (knownDuration <= 0 || pseudoCurrentTime <= knownDuration)) {
                    onProgressUpdate(currentActiveVideo.id, pseudoCurrentTime);
                }

                if (knownDuration > 0 && pseudoCurrentTime >= knownDuration) {
                   if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                }
             } else {
                 if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
             }
        }, 1000);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [activeVideo, activeVideoStartTime, onProgressUpdate]);


  const handlePlaylistItemClick = (item: ContentItem) => {
    if (activeVideo?.id !== item.id) {
        setActiveVideo(item);
        setActiveVideoStartTime(internalUserHistoryRef.current[item.id]?.watchedTime || 0);
    }
  };

  const getVideoProgress = (item: ContentItem): number => {
      const history = internalUserHistoryRef.current[item.id];
      if (!history || !item.duration || item.duration <= 0) return 0;
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

  // Basic keyword extraction for thumbnail search hint (can be improved)
  const getThumbnailHint = (title: string) => {
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('html')) return 'html code';
      if (lowerTitle.includes('css') || lowerTitle.includes('flexbox') || lowerTitle.includes('grid')) return 'css design layout';
      if (lowerTitle.includes('javascript') || lowerTitle.includes('dom') || lowerTitle.includes('async')) return 'javascript programming';
      return 'web development coding'; // Default
  }

  return (
    <Card className="overflow-hidden shadow-lg transition-shadow hover:shadow-xl duration-300">
      {/* Header for Playlist Title */}
       {type === 'playlist' && (
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
                <ListVideo className="h-5 w-5" /> {title}
            </CardTitle>
            {playlist.length > 0 && (
                <CardDescription>
                    {playlist.length} videos in this path. {activeVideo ? `Currently playing: "${activeVideo.title}"` : "Select a video to start."}
                </CardDescription>
            )}
          </CardHeader>
      )}

      <CardContent className="p-0">
        {/* Video Player Area - Always on top now */}
        {(type === 'playlist' || type === 'video') && (activeVideo || url) && (
          <div className="aspect-video w-full bg-black">
            <iframe
              ref={iframeRef}
              width="100%"
              height="100%"
              title={activeVideo?.title || title || 'YouTube video player'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="block" // Ensure it's a block element
              key={activeVideo?.id} // Force iframe re-render if the video ID changes
            ></iframe>
          </div>
        )}

        {/* Playlist Area - Below the video player */}
        {type === 'playlist' && (
          // Adjusted height - consider making this dynamic or using flex-grow in a flex container
          <ScrollArea className="h-[calc(100vh-500px)] md:h-[calc(100vh-600px)] border-t">
            <div className="p-0"> {/* Removed padding, added border-t */}
              {playlist.map((item, index) => {
                const progress = getVideoProgress(item);
                const watchedTime = getWatchedTime(item.id);
                const isCompleted = progress >= 99;
                const isActive = activeVideo?.id === item.id;
                const thumbnailHint = getThumbnailHint(item.title);

                let StatusIcon = Circle;
                let iconColor = "text-muted-foreground/50";
                if (isCompleted) {
                    StatusIcon = CheckCircle;
                    iconColor = "text-green-500";
                } else if (isActive) {
                    StatusIcon = PlayCircle;
                    iconColor = "text-primary animate-pulse";
                } else if (watchedTime > 0) {
                    StatusIcon = PlayCircle; // Partially watched
                    iconColor = "text-primary/70";
                }

                return (
                  <TooltipProvider key={item.id} delayDuration={300}>
                   <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost" // Use ghost variant for cleaner look
                        className={cn(
                          "w-full justify-start h-auto p-3 text-left relative transition-all duration-200 rounded-none border-b", // Use border-b for separation
                          "flex items-start space-x-3", // Flex layout for thumbnail and text
                           isActive ? 'bg-accent shadow-inner ring-1 ring-primary/10' : 'hover:bg-muted/50',
                           {'opacity-70 hover:opacity-100': isCompleted && !isActive} // Slightly dim completed items
                        )}
                        onClick={() => handlePlaylistItemClick(item)}
                      >
                          {/* Thumbnail Placeholder */}
                          <div className="w-28 flex-shrink-0 relative aspect-video rounded overflow-hidden">
                               <Image
                                  src={`https://picsum.photos/seed/${item.id}/112/63`} // Seeded picsum for consistency
                                  alt={`Thumbnail for ${item.title}`}
                                  layout="fill"
                                  objectFit="cover"
                                  className="transition-transform duration-300 group-hover:scale-105"
                                  data-ai-hint={thumbnailHint} // AI hint for image generation
                                />
                                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded-sm">
                                    {formatTime(item.duration)}
                                </div>
                                {isActive && (
                                    <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                                       <PlayCircle className="h-6 w-6 text-white" />
                                    </div>
                                )}
                           </div>

                           {/* Text Content */}
                           <div className="flex-grow overflow-hidden pt-1">
                               <p className={cn(
                                   'text-sm font-medium line-clamp-2',
                                   isActive ? 'text-accent-foreground' : 'text-foreground'
                                )}>
                                   {item.title}
                               </p>
                                {item.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
                                )}
                                <div className="flex items-center text-xs text-muted-foreground mt-1.5 space-x-2">
                                    <StatusIcon className={cn("h-4 w-4", iconColor)} />
                                     <span>
                                         {isCompleted ? 'Completed' : (watchedTime > 0 ? `Watched ${formatTime(watchedTime)}` : 'Not started')}
                                     </span>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="hidden sm:inline">{formatTime(item.duration)} total</span>
                                </div>
                           </div>

                           {/* Progress Bar */}
                           {progress > 0 && (
                                <Progress
                                value={progress}
                                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-none" // Thinner progress bar at the bottom
                                indicatorClassName={cn({'bg-green-500': isCompleted})}
                                aria-label={`${item.title} progress: ${Math.round(progress)}%`}
                                />
                           )}
                      </Button>
                      </TooltipTrigger>
                       {/* Tooltip Content (Optional but helpful) */}
                       {(item.description || watchedTime > 0) && (
                           <TooltipContent side="top" align="start" className="max-w-xs">
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
          <div className="p-6">
             <CardHeader>
                 <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5"/> {title}</CardTitle>
             </CardHeader>
             <CardContent>
                 <p className="text-muted-foreground mb-4">Article content for "{title}" would be displayed here.</p>
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
