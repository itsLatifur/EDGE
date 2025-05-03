
'use client';

import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import Image from 'next/image';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Progress} from '@/components/ui/progress';
import {Button} from '@/components/ui/button';
import {PlayCircle, CheckCircle, Circle, ListVideo, Info, Clock, Loader2 } from 'lucide-react';
import {cn} from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from './ui/skeleton';

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

// Helper function outside component
const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
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
  const [isPlaylistVisible, setIsPlaylistVisible] = useState(true); // Control playlist visibility on smaller screens maybe?
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastReportedTimeRef = useRef<number>(0); // Track last reported time to reduce updates


  // Determine the initial/active video based on type and props
  useEffect(() => {
    setIsVideoLoading(true); // Assume loading when dependencies change
    if (type === 'playlist' && playlist.length > 0) {
      // Find the most recently watched video within *this* playlist
      const playlistVideoIds = new Set(playlist.map(v => v.id));
      const recentHistoryInPlaylist = Object.entries(userHistory)
        .filter(([videoId, data]) => playlistVideoIds.has(videoId) && data?.lastWatched instanceof Date) // Ensure valid date
        .sort(([, a], [, b]) => b.lastWatched.getTime() - a.lastWatched.getTime());

      let videoToPlay: ContentItem | null = null;
      let startTime = 0;

      if (recentHistoryInPlaylist.length > 0) {
          const [latestVideoId, latestData] = recentHistoryInPlaylist[0];
          const videoDetails = playlist.find(v => v.id === latestVideoId);
          // Only resume if not fully watched (e.g., less than 98% watched for buffer)
          if (videoDetails && latestData.watchedTime < videoDetails.duration * 0.98) {
              videoToPlay = videoDetails;
              startTime = latestData.watchedTime;
          }
      }

      // If no resumable video found, find the first unwatched/partially watched in order
      if (!videoToPlay) {
          const firstUnwatched = playlist.find(
              (item) => !userHistory[item.id] || (item.duration > 0 && userHistory[item.id].watchedTime < item.duration * 0.98)
          );
          videoToPlay = firstUnwatched || playlist[0]; // Fallback to the very first video
          startTime = userHistory[videoToPlay.id]?.watchedTime || 0;
      }

      setActiveVideo(videoToPlay);
      setActiveVideoStartTime(startTime);

    } else {
      // Reset or handle single video/article case
      setActiveVideo(null);
      setActiveVideoStartTime(0);
      setIsVideoLoading(false);
    }
    lastReportedTimeRef.current = startTime; // Reset last reported time when video changes

    // Only depend on external props and type
  }, [type, playlist, userHistory, url, currentTab]);


  // Update iframe src only when activeVideo or its specific startTime changes
  useEffect(() => {
      if (activeVideo && iframeRef.current) {
          setIsVideoLoading(true); // Set loading state before changing src
          const videoUrl = new URL(activeVideo.url);
          // Always enable JS API for potential future use (like getting real duration/progress)
          videoUrl.searchParams.set('enablejsapi', '1');
          // Add other useful params
          videoUrl.searchParams.set('autoplay', '1'); // Autoplay the selected video
          videoUrl.searchParams.set('modestbranding', '1'); // Reduce YouTube logo
          videoUrl.searchParams.set('rel', '0'); // Don't show related videos at the end
          videoUrl.searchParams.set('start', Math.floor(activeVideoStartTime).toString());
          if (typeof window !== 'undefined') {
            videoUrl.searchParams.set('origin', window.location.origin);
          }

          const newSrc = videoUrl.toString();
          if (iframeRef.current.src !== newSrc) {
              iframeRef.current.src = newSrc;
          } else {
              // If src is the same, it might already be loaded or loading
              // handleIframeLoad might be called again, or we assume it's fine
               setIsVideoLoading(false);
          }
      } else if (!activeVideo && iframeRef.current) {
          iframeRef.current.src = ''; // Clear src if no active video
          setIsVideoLoading(false);
      } else if (!activeVideo) {
         setIsVideoLoading(false);
      }
  }, [activeVideo, activeVideoStartTime]); // Only depends on the active video and start time

  // Handle iframe load event
  const handleIframeLoad = useCallback(() => {
    setIsVideoLoading(false);
    lastReportedTimeRef.current = activeVideoStartTime; // Ensure starting point is correct after load
  }, [activeVideoStartTime]);


  // Set up interval to track video progress (Simplified pseudo-progress)
  useEffect(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Only start interval if a video is active and not loading
    if (activeVideo && !isVideoLoading && type !== 'article') {
        let pseudoCurrentTime = activeVideoStartTime;

        progressIntervalRef.current = setInterval(() => {
            const currentIntervalVideo = activeVideo; // Use the video active when interval started
            if (!currentIntervalVideo) {
                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                return;
            }

            pseudoCurrentTime += 1;
            const knownDuration = currentIntervalVideo.duration;

             // Only report progress every 5 seconds or if the video is near completion/start
            const shouldReport = pseudoCurrentTime - lastReportedTimeRef.current >= 5 ||
                                pseudoCurrentTime <= 5 || // Report near start
                                (knownDuration > 0 && knownDuration - pseudoCurrentTime <= 5); // Report near end

            // Check if time is within known duration (if available)
            if (knownDuration <= 0 || pseudoCurrentTime <= knownDuration) {
                if (shouldReport) {
                    onProgressUpdate(currentIntervalVideo.id, pseudoCurrentTime);
                    lastReportedTimeRef.current = pseudoCurrentTime; // Update last reported time
                }
            } else {
                // Time exceeded known duration, report final time and stop
                if (lastReportedTimeRef.current < knownDuration) { // Report only if not already reported
                     onProgressUpdate(currentIntervalVideo.id, knownDuration);
                     lastReportedTimeRef.current = knownDuration;
                 }
                 if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            }

        }, 1000); // Check every second
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
    // Rerun effect if the active video changes, start time changes, or loading state changes
  }, [activeVideo, activeVideoStartTime, isVideoLoading, onProgressUpdate, type]);


  const handlePlaylistItemClick = useCallback((item: ContentItem) => {
    // Check if the clicked item is already active to avoid unnecessary state updates
    if (activeVideo?.id !== item.id) {
      const startTime = userHistory[item.id]?.watchedTime || 0;
      setActiveVideo(item);
      setActiveVideoStartTime(startTime);
      lastReportedTimeRef.current = startTime; // Reset reported time
      setIsVideoLoading(true); // Set loading state for the new video
    }
  }, [activeVideo, userHistory]); // Dependency on activeVideo and userHistory


  // Memoize calculation for progress based on userHistory and item duration
  const getVideoProgress = useCallback((item: ContentItem): number => {
      const history = userHistory[item.id];
      if (!history || !item.duration || item.duration <= 0) return 0;
      // Ensure progress doesn't exceed 100%
      return Math.min(100, (history.watchedTime / item.duration) * 100);
  }, [userHistory]);

  // Memoize calculation for watched time based on userHistory
  const getWatchedTime = useCallback((itemId: string): number => {
      return userHistory[itemId]?.watchedTime || 0;
  }, [userHistory]);

  // Basic keyword extraction for thumbnail search hint (can be improved)
  const getThumbnailHint = useCallback((title: string) => {
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('html')) return 'html code structure markup';
      if (lowerTitle.includes('css') || lowerTitle.includes('flexbox') || lowerTitle.includes('grid') || lowerTitle.includes('responsive')) return 'css design layout style responsive';
      if (lowerTitle.includes('javascript') || lowerTitle.includes('dom') || lowerTitle.includes('async') || lowerTitle.includes('es6')) return 'javascript programming logic code script';
      if (lowerTitle.includes('form')) return 'html form input interactive';
      if (lowerTitle.includes('table')) return 'html table data structure';
      if (lowerTitle.includes('media') || lowerTitle.includes('image') || lowerTitle.includes('video')) return 'html media image video embed';
      if (lowerTitle.includes('animation') || lowerTitle.includes('transition')) return 'css animation motion transition';
      if (lowerTitle.includes('array') || lowerTitle.includes('object')) return 'javascript data structure array object manipulation';
      return 'web development tutorial coding learn programming'; // Default
  }, []);

  // Memoize the playlist items rendering logic
   const renderedPlaylistItems = useMemo(() => {
      return playlist.map((item, index) => {
         const progress = getVideoProgress(item);
         const watchedTime = getWatchedTime(item.id);
         const isCompleted = progress >= 98; // Mark as completed slightly before 100%
         const isActive = activeVideo?.id === item.id;
         const thumbnailHint = getThumbnailHint(item.title);

         let StatusIcon = Circle;
         let iconColor = "text-muted-foreground/60"; // Default grey
         let statusText = 'Not Started';
         if (isCompleted) {
             StatusIcon = CheckCircle;
             iconColor = "text-green-600 dark:text-green-500"; // Consistent green
             statusText = 'Completed';
         } else if (isActive) {
             StatusIcon = PlayCircle;
             iconColor = "text-primary animate-pulse"; // Use primary color with pulse
             statusText = 'Playing';
         } else if (watchedTime > 0) {
             StatusIcon = PlayCircle;
             iconColor = "text-primary/80"; // Slightly faded primary for partial
             statusText = 'Partially Watched';
         }

         return (
           <TooltipProvider key={item.id} delayDuration={150}>
            <Tooltip>
             <TooltipTrigger asChild>
               <Button
                 variant="ghost"
                 className={cn(
                   "w-full justify-start h-auto p-3 text-left relative transition-colors duration-200 rounded-md", // Use rounded-md, add transition
                   "flex items-start space-x-3 group hover:bg-muted/70", // Standard hover
                    isActive ? 'bg-accent shadow-inner ring-1 ring-inset ring-primary/30' : '', // Active state with subtle ring
                    {'opacity-80 hover:opacity-100': isCompleted && !isActive} // Slightly dim completed items, brighten on hover
                 )}
                 onClick={() => handlePlaylistItemClick(item)}
                 aria-current={isActive ? 'page' : undefined} // Use 'page' for current item in a set
               >
                   {/* Index Number */}
                   <span className="text-xs font-medium text-muted-foreground w-5 text-center pt-1">{index + 1}</span>

                   {/* Thumbnail Area */}
                   <div className="w-24 flex-shrink-0 relative aspect-video rounded overflow-hidden shadow-sm">
                        <Image
                           src={`https://picsum.photos/seed/${item.id}/96/54`} // Consistent seeded image
                           alt="" // Decorative, title provides info
                           layout="fill"
                           objectFit="cover"
                           className="transition-transform duration-300 group-hover:scale-105"
                           data-ai-hint={thumbnailHint}
                           unoptimized // Good for external placeholders
                        />
                         {/* Duration Badge */}
                        <div className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] px-1 py-0.5 rounded-sm font-medium">
                            {formatTime(item.duration)}
                        </div>
                         {/* Play Icon Overlay on Active/Hover */}
                        {(isActive || progress > 0) && (
                            <div className={cn(
                                "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200",
                                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )}>
                               <PlayCircle className={cn("h-6 w-6", isActive ? "text-white" : "text-white/80")} />
                           </div>
                        )}
                    </div>

                    {/* Text Content */}
                    <div className="flex-grow overflow-hidden pt-0">
                        <p className={cn(
                            'text-sm font-medium line-clamp-2',
                             isActive ? 'text-primary font-semibold' : 'text-foreground' // Highlight active title
                         )}>
                            {item.title}
                        </p>
                         {/* Description (optional, smaller) */}
                         {/* {item.description && (
                             <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
                         )} */}
                         {/* Status Icon and Time/Progress */}
                        <div className="flex items-center text-xs text-muted-foreground mt-1 space-x-1.5">
                           <StatusIcon className={cn("h-3.5 w-3.5 flex-shrink-0", iconColor)} aria-hidden="true" />
                           <span className="truncate">
                               {isCompleted ? 'Completed' : (watchedTime > 0 ? `${formatTime(watchedTime)} watched` : `Duration: ${formatTime(item.duration)}`)}
                           </span>
                        </div>
                    </div>

                    {/* Progress Bar (Subtle) */}
                    {progress > 0 && (
                        <Progress
                         value={progress}
                         className="absolute bottom-0 left-0 right-0 h-[3px] rounded-none opacity-70 group-hover:opacity-100" // Thinner, subtle, appears on hover
                         indicatorClassName={cn(isCompleted ? 'bg-green-600 dark:bg-green-500' : 'bg-primary')}
                         aria-label={`${item.title} progress: ${Math.round(progress)}%`}
                         />
                    )}
               </Button>
               </TooltipTrigger>
                {/* Tooltip Content */}
                <TooltipContent side="top" align="start" className="max-w-xs">
                  <p className="font-semibold">{item.title}</p>
                  {item.description && <p className="text-sm text-muted-foreground my-1">{item.description}</p>}
                  <div className="text-xs space-y-0.5 mt-1">
                     <p><Clock className="inline h-3 w-3 mr-1" />{formatTime(item.duration)} total</p>
                     {watchedTime > 0 && <p><PlayCircle className="inline h-3 w-3 mr-1" />{formatTime(watchedTime)} watched ({Math.round(progress)}%)</p>}
                     <p className={cn("flex items-center", iconColor)}>
                         <StatusIcon className="inline h-3 w-3 mr-1" />{statusText}
                     </p>
                  </div>
                </TooltipContent>
             </Tooltip>
           </TooltipProvider>
         );
       });
   }, [playlist, activeVideo, userHistory, getVideoProgress, getWatchedTime, getThumbnailHint, handlePlaylistItemClick]);


  return (
    <Card className="overflow-hidden shadow-lg transition-shadow hover:shadow-xl duration-300 border">
      {/* Combined Header */}
      <CardHeader className="border-b bg-muted/40 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-2 sm:mb-0">
                <CardTitle className="text-lg font-semibold text-primary flex items-center gap-2">
                    <ListVideo className="h-5 w-5" /> {title}
                </CardTitle>
                 {playlist.length > 0 && (
                    <CardDescription className="text-sm mt-1">
                        {playlist.length} videos ・ Select one to start learning.
                    </CardDescription>
                )}
            </div>
             {/* Optional: Maybe add overall progress for the playlist here */}
          </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Main Content Area: Video and Playlist */}
        <div className="flex flex-col md:flex-row">

          {/* Video Player Area */}
          <div className="w-full md:w-[calc(100%-20rem)] lg:w-[calc(100%-24rem)] aspect-video bg-gradient-to-br from-muted/50 to-muted relative group"> {/* Use remaining width on larger screens */}
            {/* Loading State Overlay */}
            {isVideoLoading && activeVideo && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                   <Loader2 className="h-12 w-12 text-primary animate-spin mb-3" />
                   <p className="text-muted-foreground text-sm">Loading: {activeVideo.title}...</p>
              </div>
            )}
            {/* Placeholder when no video is selected */}
            {!activeVideo && type === 'playlist' && playlist.length > 0 && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-center p-4">
                  <ListVideo className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground font-medium">Select a video from the playlist</p>
                  <p className="text-sm text-muted-foreground/80">Your learning journey awaits!</p>
              </div>
            )}

             {/* YouTube Iframe */}
             {(activeVideo || url) && (
                 <iframe
                    ref={iframeRef}
                    width="100%"
                    height="100%"
                    title={activeVideo?.title || title || 'Learning Video Player'}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className={cn("block transition-opacity duration-300", isVideoLoading ? "opacity-0" : "opacity-100")}
                    key={activeVideo?.id || 'single-video'} // Force re-render on video change
                    onLoad={handleIframeLoad}
                  ></iframe>
              )}
          </div>

          {/* Playlist Area (Right on Desktop, Bottom on Mobile) */}
          {type === 'playlist' && playlist.length > 0 && (
            <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l bg-background md:bg-muted/20 flex flex-col">
               <ScrollArea className="flex-grow h-[50vh] md:h-[calc(100%-0px)]"> {/* Fill height */}
                 <div className="p-2 space-y-1.5">
                     {renderedPlaylistItems}
                 </div>
               </ScrollArea>
                {/* Maybe a small footer for the playlist section? */}
               {/* <div className="p-2 border-t text-xs text-muted-foreground">
                   Playlist Controls / Info
               </div> */}
            </div>
          )}
        </div>

        {/* Article Area (Placeholder) */}
        {type === 'article' && url && (
          <div className="p-6">
             <CardHeader className="p-0 mb-4">
                 <CardTitle className="text-lg flex items-center gap-2"><Info className="h-5 w-5"/> {title}</CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                 <p className="text-muted-foreground mb-4">Article content for "{title}" would be displayed here. Open the link to read more.</p>
                 <Button asChild variant="outline" size="sm">
                     <a href={url} target="_blank" rel="noopener noreferrer">
                       Read Full Article
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
