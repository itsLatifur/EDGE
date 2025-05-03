'use client';

import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import Image from 'next/image';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Progress} from '@/components/ui/progress';
import {Button} from '@/components/ui/button';
import {PlayCircle, CheckCircle, Circle, ListVideo, Clock, Loader2 } from 'lucide-react';
import {cn} from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ContentItem, UserProgress, Playlist, UserProgressEntry } from '@/types'; // Import updated types


interface LearningContentProps {
  playlist: Playlist; // Use the Playlist interface
  userProgress: UserProgress; // Can be an empty object {} but not null
  onProgressUpdate: (videoId: string, currentTime: number) => void;
  currentTab?: string; // Keep for potential future use, but logic primarily uses playlist prop
}

// Helper function outside component
const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

const LearningContent: React.FC<LearningContentProps> = ({
  playlist,
  userProgress, // userProgress is guaranteed to be an object, potentially empty
  onProgressUpdate,
  currentTab,
}) => {
  const [activeVideo, setActiveVideo] = useState<ContentItem | null>(null);
  const [activeVideoStartTime, setActiveVideoStartTime] = useState<number>(0);
  const [isVideoLoading, setIsVideoLoading] = useState(true); // State for video iframe loading
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastReportedTimeRef = useRef<number>(0); // Track last reported time to reduce updates


  // Determine the initial/active video based on the provided playlist and userProgress
  useEffect(() => {
    setIsVideoLoading(true); // Assume loading when dependencies change
    let videoToPlay: ContentItem | null = null;
    let startTime = 0; // Declare startTime here with default value

    if (playlist.videos.length > 0) {
      // Find the most recently watched video within *this* playlist
      const playlistVideoIds = new Set(playlist.videos.map(v => v.id));

      // userProgress is now guaranteed to be an object
      const relevantHistory = Object.entries(userProgress)
          .filter(([videoId, data]) =>
              playlistVideoIds.has(videoId) &&
              data?.lastWatched instanceof Date && // Ensure lastWatched is a Date
              data.watchedTime >= 0 // Allow 0 watched time
          )
          // Convert to array of objects with videoId for easier sorting/finding
          .map(([videoId, data]) => ({ videoId, ...data }))
          .sort((a, b) => b.lastWatched.getTime() - a.lastWatched.getTime()); // Sort by most recent


      if (relevantHistory.length > 0) {
          const latestEntry = relevantHistory[0];
          const videoDetails = playlist.videos.find(v => v.id === latestEntry.videoId);
          // Resume if not completed (using the 'completed' flag or time check)
          if (videoDetails && !latestEntry.completed && latestEntry.watchedTime < videoDetails.duration * 0.98) {
              videoToPlay = videoDetails;
              startTime = latestEntry.watchedTime; // Update startTime
          }
      }

      // If no resumable video found, find the first uncompleted in order
      if (!videoToPlay) {
          const firstUnwatched = playlist.videos.find(
              (item) => !userProgress[item.id]?.completed // Check the completed flag
          );
          videoToPlay = firstUnwatched || playlist.videos[0]; // Fallback to the very first video
          startTime = userProgress[videoToPlay.id]?.watchedTime || 0; // Update startTime
      }

      setActiveVideo(videoToPlay);
      setActiveVideoStartTime(startTime);

    } else {
      // Reset if playlist is empty
      setActiveVideo(null);
      setActiveVideoStartTime(0);
      setIsVideoLoading(false);
    }
    lastReportedTimeRef.current = startTime; // Reset last reported time when video changes

    // Depend only on the playlist ID and the userProgress object itself.
    // Using playlist.id assumes if the ID changes, the content might have changed.
    // Directly depending on userProgress covers updates from logins, merges, etc.
  }, [playlist.id, userProgress]);


  // Update iframe src only when activeVideo or its specific startTime changes
  useEffect(() => {
      if (activeVideo && iframeRef.current) {
          setIsVideoLoading(true); // Set loading state before changing src
          const videoUrl = new URL(activeVideo.url);
          // Enable JS API for YouTube Player API interaction (if needed later)
          videoUrl.searchParams.set('enablejsapi', '1');
          videoUrl.searchParams.set('autoplay', '1'); // Autoplay the selected video
          videoUrl.searchParams.set('modestbranding', '1'); // Reduce YouTube logo
          videoUrl.searchParams.set('rel', '0'); // Don't show related videos at the end
          videoUrl.searchParams.set('start', Math.floor(activeVideoStartTime).toString());
          if (typeof window !== 'undefined') {
            videoUrl.searchParams.set('origin', window.location.origin);
          }

          const newSrc = videoUrl.toString();
          // Only update src if it's actually different to prevent unnecessary reloads
          if (iframeRef.current.src !== newSrc) {
              iframeRef.current.src = newSrc;
          } else {
              // If src is the same but start time changed, potentially seek?
              // For simplicity now, we just set loading to false if src is same
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
     // Clear any existing interval before starting a new one
     if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      // Restart the progress interval tracking after iframe loads
      startProgressTracking();

  }, [activeVideoStartTime]); // Added missing dependency `startProgressTracking` - Re-added startProgressTracking to dependencies


  // Function to start the progress tracking interval
    const startProgressTracking = useCallback(() => {
      if (progressIntervalRef.current) {
         clearInterval(progressIntervalRef.current);
      }

      if (activeVideo && !isVideoLoading) {
        let pseudoCurrentTime = activeVideoStartTime; // Initialize with start time

        progressIntervalRef.current = setInterval(() => {
          const currentIntervalVideo = activeVideo; // Capture activeVideo at interval creation
          if (!currentIntervalVideo) {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            return;
          }

          pseudoCurrentTime += 1; // Increment time
          const knownDuration = currentIntervalVideo.duration;

          // Report progress every 5 seconds, near start, or near end
          const shouldReport = pseudoCurrentTime - lastReportedTimeRef.current >= 5 ||
                             pseudoCurrentTime <= 5 ||
                             (knownDuration > 0 && knownDuration - pseudoCurrentTime <= 5);


          if (knownDuration <= 0 || pseudoCurrentTime <= knownDuration) {
             if (shouldReport) {
               onProgressUpdate(currentIntervalVideo.id, pseudoCurrentTime);
               lastReportedTimeRef.current = pseudoCurrentTime;
             }
          } else {
            // Time exceeded known duration, report final time if not already done and stop
            if (lastReportedTimeRef.current < knownDuration) {
              onProgressUpdate(currentIntervalVideo.id, knownDuration);
              lastReportedTimeRef.current = knownDuration;
            }
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          }
        }, 1000); // Check every second
      }
    }, [activeVideo, isVideoLoading, activeVideoStartTime, onProgressUpdate]); // Dependencies for the tracking logic


    // Effect to manage the interval lifecycle
    useEffect(() => {
        // Start tracking when video is ready
        if (activeVideo && !isVideoLoading) {
            startProgressTracking();
        }

        // Cleanup function to clear interval when component unmounts or dependencies change
        return () => {
            if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            }
        };
    }, [activeVideo, isVideoLoading, startProgressTracking]); // Depend on video, loading state, and the tracking function itself


  const handlePlaylistItemClick = useCallback((item: ContentItem) => {
    // Only update if a different video is clicked
    if (activeVideo?.id !== item.id) {
      const startTime = userProgress[item.id]?.watchedTime || 0; // Access directly, it's an object
      setActiveVideo(item);
      setActiveVideoStartTime(startTime);
      lastReportedTimeRef.current = startTime; // Reset reported time
      setIsVideoLoading(true); // Set loading state for the new video
       // Clear interval immediately when switching videos
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  }, [activeVideo?.id, userProgress]); // Simplified dependencies


  // Memoize calculation for progress based on userProgress and item duration
  const getVideoProgress = useCallback((item: ContentItem): number => {
      const history = userProgress[item.id]; // Access directly
      if (!history || !item.duration || item.duration <= 0) return 0;
      return Math.min(100, (history.watchedTime / item.duration) * 100);
  }, [userProgress]);

  // Memoize calculation for watched time based on userProgress
  const getWatchedTime = useCallback((itemId: string): number => {
      return userProgress[itemId]?.watchedTime || 0; // Access directly
  }, [userProgress]);

   // Memoize completion status check
   const isVideoCompleted = useCallback((item: ContentItem): boolean => {
     const progressData = userProgress[item.id]; // Access directly
     // Check the completed flag first, then fallback to time check
     return progressData?.completed || (progressData?.watchedTime && item.duration > 0 && progressData.watchedTime >= item.duration * 0.95) || false;
  }, [userProgress]);

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
      if (!playlist?.videos) return []; // Add guard for potentially undefined playlist or videos
      return playlist.videos.map((item, index) => {
         const progress = getVideoProgress(item);
         const watchedTime = getWatchedTime(item.id);
         const isCompleted = isVideoCompleted(item); // Use memoized function
         const isActive = activeVideo?.id === item.id;
         const thumbnailHint = getThumbnailHint(item.title);

         let StatusIcon = Circle;
         let iconColor = "text-muted-foreground/60";
         let statusText = 'Not Started';
         if (isCompleted) {
             StatusIcon = CheckCircle;
             iconColor = "text-green-600 dark:text-green-500";
             statusText = 'Completed';
         } else if (isActive) {
             StatusIcon = PlayCircle;
             iconColor = "text-primary animate-pulse";
             statusText = 'Playing';
         } else if (watchedTime > 0) {
             StatusIcon = PlayCircle;
             iconColor = "text-primary/80";
             statusText = 'In Progress'; // More accurate term
         }

         return (
           <TooltipProvider key={item.id} delayDuration={150}>
            <Tooltip>
             <TooltipTrigger asChild>
               <Button
                 variant="ghost"
                 className={cn(
                   "w-full justify-start h-auto p-3 text-left relative transition-colors duration-200 rounded-md",
                   "flex items-start space-x-3 group hover:bg-muted/70",
                    isActive ? 'bg-accent shadow-inner ring-1 ring-inset ring-primary/30' : '',
                    {'opacity-80 hover:opacity-100': isCompleted && !isActive}
                 )}
                 onClick={() => handlePlaylistItemClick(item)}
                 aria-current={isActive ? 'page' : undefined}
               >
                   {/* Index Number */}
                   <span className="text-xs font-medium text-muted-foreground w-5 text-center pt-1 flex-shrink-0">{index + 1}</span>

                   {/* Thumbnail Area */}
                   <div className="w-24 flex-shrink-0 relative aspect-video rounded overflow-hidden shadow-sm">
                        <Image
                           src={`https://picsum.photos/seed/${item.id}/96/54`}
                           alt="" // Decorative
                           layout="fill"
                           objectFit="cover"
                           className="transition-transform duration-300 group-hover:scale-105"
                           data-ai-hint={thumbnailHint}
                           unoptimized
                        />
                         {/* Duration Badge */}
                        <div className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] px-1 py-0.5 rounded-sm font-medium">
                            {formatTime(item.duration)}
                        </div>
                         {/* Play Icon Overlay on Active/Hover */}
                        {(isActive || watchedTime > 0) && ( // Show on hover if watched > 0
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
                             isActive ? 'text-primary font-semibold' : 'text-foreground'
                         )}>
                            {item.title}
                        </p>
                         {/* Status Icon and Time/Progress */}
                        <div className="flex items-center text-xs text-muted-foreground mt-1 space-x-1.5">
                           <StatusIcon className={cn("h-3.5 w-3.5 flex-shrink-0", iconColor)} aria-hidden="true" />
                           <span className="truncate">
                               {isCompleted ? 'Completed' : (watchedTime > 0 ? `${formatTime(watchedTime)} / ${formatTime(item.duration)}` : `Duration: ${formatTime(item.duration)}`)}
                           </span>
                        </div>
                    </div>

                    {/* Progress Bar (Subtle) */}
                    {progress > 0 && !isCompleted && ( // Hide if completed
                        <Progress
                         value={progress}
                         className="absolute bottom-0 left-0 right-0 h-[3px] rounded-none opacity-70 group-hover:opacity-100"
                         indicatorClassName={cn(isCompleted ? 'bg-green-600 dark:bg-green-500' : 'bg-primary')}
                         aria-label={`${item.title} progress: ${Math.round(progress)}%`}
                         />
                    )}
                     {/* Completed Indicator Bar */}
                    {isCompleted && (
                         <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-green-600 dark:bg-green-500 opacity-80" />
                    )}
               </Button>
               </TooltipTrigger>
                {/* Tooltip Content */}
                <TooltipContent side="left" align="start" className="max-w-xs" sideOffset={10}>
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
   }, [playlist?.videos, activeVideo?.id, getVideoProgress, getWatchedTime, isVideoCompleted, getThumbnailHint, handlePlaylistItemClick, handleIframeLoad]); // Added handleIframeLoad


  return (
    <Card className="overflow-hidden shadow-lg transition-shadow hover:shadow-xl duration-300 border">
      {/* Combined Header */}
      <CardHeader className="border-b bg-muted/40 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-2 sm:mb-0">
                <CardTitle className="text-lg font-semibold text-primary flex items-center gap-2">
                   {playlist?.icon && <playlist.icon className="h-5 w-5" />} {/* Add safe check */}
                   {playlist?.title || 'Playlist'} {/* Add safe check */}
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                    {(playlist?.videos?.length || 0)} videos ・ {playlist?.description || ''} {/* Add safe check */}
                </CardDescription>
            </div>
             {/* Optional: Maybe add overall progress for the playlist here */}
          </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Main Content Area: Video and Playlist */}
        <div className="flex flex-col md:flex-row">

          {/* Video Player Area */}
          <div className="w-full md:flex-grow aspect-video bg-gradient-to-br from-muted/50 to-muted relative group">
            {/* Loading State Overlay */}
            {isVideoLoading && activeVideo && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                   <Loader2 className="h-12 w-12 text-primary animate-spin mb-3" />
                   <p className="text-muted-foreground text-sm">Loading: {activeVideo.title}...</p>
              </div>
            )}
            {/* Placeholder when no video is selected */}
            {!activeVideo && (playlist?.videos?.length || 0) > 0 && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-center p-4">
                  <ListVideo className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground font-medium">Select a video from the playlist</p>
                  <p className="text-sm text-muted-foreground/80">Your learning journey awaits!</p>
              </div>
            )}
            {/* Placeholder for empty playlist */}
            {(!playlist?.videos || playlist.videos.length === 0) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-center p-4">
                   <ListVideo className="h-12 w-12 text-muted-foreground/50 mb-3" />
                   <p className="text-muted-foreground font-medium">No videos in this playlist yet.</p>
                </div>
            )}


             {/* YouTube Iframe */}
             {activeVideo && (
                 <iframe
                    ref={iframeRef}
                    width="100%"
                    height="100%"
                    title={activeVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className={cn("block transition-opacity duration-300", isVideoLoading ? "opacity-0" : "opacity-100")}
                    key={activeVideo.id} // Force re-render on video change
                    onLoad={handleIframeLoad}
                    // Removed src here, handled by useEffect
                  ></iframe>
              )}
          </div>

          {/* Playlist Area (Right on Desktop, Bottom on Mobile) */}
          {(playlist?.videos?.length || 0) > 0 && (
            <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l bg-background md:bg-muted/20 flex flex-col flex-shrink-0">
               <ScrollArea className="flex-grow h-[50vh] md:h-[calc(100vh-14rem)]"> {/* Adjusted height */}
                 <div className="p-2 space-y-1.5">
                     {renderedPlaylistItems}
                 </div>
               </ScrollArea>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LearningContent;
