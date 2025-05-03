
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
import { Skeleton } from './ui/skeleton'; // Import Skeleton

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
  const [isVideoLoading, setIsVideoLoading] = useState(true); // State for video iframe loading
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const internalUserHistoryRef = useRef(userHistory); // Ref to track latest history for progress update logic

  // Update ref whenever userHistory prop changes
  useEffect(() => {
    internalUserHistoryRef.current = userHistory;
  }, [userHistory]);


  // Determine the initial/active video based on type and props
  useEffect(() => {
    setIsVideoLoading(true); // Start loading state when video changes
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

      // Only update state if the video or start time actually changes
      if (activeVideo?.id !== videoToPlay?.id || activeVideoStartTime !== startTime) {
        setActiveVideo(videoToPlay);
        setActiveVideoStartTime(startTime);
      } else if (!videoToPlay) {
        // Handle case where playlist is empty or no video is selected
        setActiveVideo(null);
        setActiveVideoStartTime(0);
        setIsVideoLoading(false); // No video to load
      } else {
        // If same video and start time, assume already loaded or loading
        // Potentially set isVideoLoading based on iframeRef state if needed, but onload handles this.
      }


    } else if (type === 'video' && url) {
        // Case for single video display (less common now)
        // setActiveVideo(null); // Need video details object
        // setActiveVideoStartTime(0);
         setIsVideoLoading(false); // Not implemented fully
    } else {
        // Reset if no valid case
        setActiveVideo(null);
        setActiveVideoStartTime(0);
        setIsVideoLoading(false); // No video to load
    }
    // Dependencies: Recalculate when playlist, history, or currentTab changes
  }, [type, playlist, userHistory, url, currentTab]); // Removed activeVideo, activeVideoStartTime


  // Update iframe src only when activeVideo or its specific startTime changes
  useEffect(() => {
      if (activeVideo && iframeRef.current) {
          setIsVideoLoading(true); // Set loading state before changing src
          const videoUrl = new URL(activeVideo.url);
          videoUrl.searchParams.set('start', Math.floor(activeVideoStartTime).toString());
          videoUrl.searchParams.set('enablejsapi', '1');
          // Ensure origin is set correctly for JS API
          if (typeof window !== 'undefined') {
            videoUrl.searchParams.set('origin', window.location.origin);
          }

          const newSrc = videoUrl.toString();
          // Check if src needs updating to prevent unnecessary reloads
          if (iframeRef.current.src !== newSrc) {
              iframeRef.current.src = newSrc;
          } else {
              // If src is the same, video might already be loaded
              setIsVideoLoading(false);
          }
      } else if (!activeVideo && iframeRef.current) {
          iframeRef.current.src = ''; // Clear src if no active video
          setIsVideoLoading(false); // No video loading
      } else if (!activeVideo) {
         setIsVideoLoading(false); // No video loading
      }
  }, [activeVideo, activeVideoStartTime]);

  // Handle iframe load event
  const handleIframeLoad = () => {
    setIsVideoLoading(false);
  };


  // Set up interval to track video progress (Simplified)
  useEffect(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Only start interval if video is active and not loading
    if (activeVideo && !isVideoLoading && type !== 'article') {
        let pseudoCurrentTime = activeVideoStartTime;

        progressIntervalRef.current = setInterval(() => {
             // Use a stable reference to the active video *at the time the interval was set up*
             // This avoids issues if activeVideo changes while the interval is running
             const currentIntervalVideo = activeVideo;

             if (currentIntervalVideo) {
                pseudoCurrentTime += 1;
                const knownDuration = currentIntervalVideo.duration;
                const latestWatchedTime = internalUserHistoryRef.current[currentIntervalVideo.id]?.watchedTime || 0;

                // Only update if pseudo time is ahead and within duration
                if (pseudoCurrentTime > latestWatchedTime && (knownDuration <= 0 || pseudoCurrentTime <= knownDuration)) {
                    onProgressUpdate(currentIntervalVideo.id, pseudoCurrentTime);
                }

                // Stop interval if duration is known and reached
                if (knownDuration > 0 && pseudoCurrentTime >= knownDuration) {
                   if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                }
             } else {
                 // Clear interval if video becomes inactive
                 if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
             }
        }, 1000);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
    // Re-run effect if activeVideo, startTime, or loading state changes
  }, [activeVideo, activeVideoStartTime, isVideoLoading, onProgressUpdate, type]);


  const handlePlaylistItemClick = (item: ContentItem) => {
    if (activeVideo?.id !== item.id) {
        setActiveVideo(item);
        setActiveVideoStartTime(internalUserHistoryRef.current[item.id]?.watchedTime || 0);
        setIsVideoLoading(true); // Assume loading will start
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
      if (lowerTitle.includes('html')) return 'html code structure';
      if (lowerTitle.includes('css') || lowerTitle.includes('flexbox') || lowerTitle.includes('grid')) return 'css design layout responsive';
      if (lowerTitle.includes('javascript') || lowerTitle.includes('dom') || lowerTitle.includes('async')) return 'javascript programming logic';
      return 'web development tutorial coding'; // Default
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
                    {playlist.length} videos in this path. {activeVideo ? `Current: "${activeVideo.title}"` : "Select a video to start."}
                </CardDescription>
            )}
          </CardHeader>
      )}

      <CardContent className="p-0">
        {/* Flex container for Video and Playlist */}
        <div className="flex flex-col md:flex-row">

          {/* Video Player Area (Left on Desktop, Top on Mobile) */}
          {(type === 'playlist' || type === 'video') && (
            <div className="w-full md:w-2/3 aspect-video bg-black relative">
              {/* Skeleton Loader */}
              {isVideoLoading && (
                 <div className="absolute inset-0 flex items-center justify-center bg-muted">
                     <Skeleton className="w-full h-full" />
                     <div className="absolute text-foreground text-sm">Loading video...</div>
                </div>
              )}
              {/* Iframe - Hidden while loading */}
              {(activeVideo || url) && (
                 <iframe
                    ref={iframeRef}
                    width="100%"
                    height="100%"
                    title={activeVideo?.title || title || 'YouTube video player'}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className={cn("block", isVideoLoading ? "invisible" : "visible")} // Hide iframe until loaded
                    key={activeVideo?.id} // Force iframe re-render if the video ID changes
                    onLoad={handleIframeLoad} // Set loading state to false when iframe loads
                  ></iframe>
              )}
              {!activeVideo && type === 'playlist' && !isVideoLoading && (
                 <div className="absolute inset-0 flex items-center justify-center bg-muted text-foreground">
                    Select a video from the playlist.
                </div>
              )}
            </div>
          )}

          {/* Playlist Area (Right on Desktop, Bottom on Mobile) */}
          {type === 'playlist' && (
            // Use flex-grow on mobile, fixed width on desktop. Border added for visual separation.
            <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l">
               {/* Desktop: Height matches video aspect ratio (approx 56.25% of width). Mobile: Fixed height or different calc */}
               <ScrollArea className="h-[50vh] md:h-[calc((100vw*2/3)*0.5625)] md:max-h-[75vh]"> {/* Adjust height dynamically or use fixed values */}
                 <div className="p-0">
                    {playlist.map((item) => {
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
                                "flex items-start space-x-3 group", // Added group for hover effects
                                 isActive ? 'bg-accent shadow-inner' : 'hover:bg-muted/50', // Simpler active state
                                 {'opacity-70 hover:opacity-100': isCompleted && !isActive} // Slightly dim completed items
                              )}
                              onClick={() => handlePlaylistItemClick(item)}
                              aria-current={isActive ? 'true' : 'false'} // Accessibility
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
                                        unoptimized // Added as picsum can be slow/unreliable sometimes
                                     />
                                     <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded-sm">
                                         {formatTime(item.duration)}
                                     </div>
                                     {/* Overlay for active/playing state */}
                                     {isActive && (
                                         <div className="absolute inset-0 bg-primary/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <PlayCircle className="h-6 w-6 text-white" />
                                         </div>
                                     )}
                                 </div>

                                 {/* Text Content */}
                                 <div className="flex-grow overflow-hidden pt-1">
                                     <p className={cn(
                                         'text-sm font-medium line-clamp-2',
                                         isActive ? 'text-accent-foreground font-semibold' : 'text-foreground' // Make active title bold
                                      )}>
                                         {item.title}
                                     </p>
                                     {item.description && (
                                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
                                      )}
                                      {/* Status Icons and Time */}
                                     <div className="flex items-center text-xs text-muted-foreground mt-1.5 space-x-2">
                                        <TooltipProvider>
                                           <Tooltip>
                                                <TooltipTrigger>
                                                    <StatusIcon className={cn("h-4 w-4 flex-shrink-0", iconColor)} aria-hidden="true" />
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                     {isCompleted ? 'Completed' : isActive ? 'Playing' : watchedTime > 0 ? 'Partially Watched' : 'Not Started'}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                         <span className="truncate"> {/* Wrap text that might overflow */}
                                             {isCompleted ? 'Completed' : (watchedTime > 0 ? `${formatTime(watchedTime)} / ${formatTime(item.duration)}` : `${formatTime(item.duration)}`)}
                                         </span>
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
                                 <TooltipContent side="left" align="start" className="max-w-xs md:hidden"> {/* Show tooltip only on mobile */}
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
            </div>
          )}
        </div>

        {/* Article Area (Placeholder) - Remains unchanged */}
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
