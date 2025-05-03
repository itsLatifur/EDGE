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
import { getPlaylistIcon } from '@/lib/data/playlists'; // Import helper

interface LearningContentProps {
  playlist: Playlist; // Now accepts the full Playlist object
  userProgress: UserProgress; // Can be an empty object {} but not null
  onProgressUpdate: (videoId: string, currentTime: number) => void;
  initialVideoId?: string | null; // Optional initial video ID from URL
  initialStartTime?: number; // Optional initial start time from URL
}

// Helper function outside component
const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

const LearningContent: React.FC<LearningContentProps> = ({
  playlist, // Playlist object now includes summary + videos
  userProgress,
  onProgressUpdate,
  initialVideoId,
  initialStartTime = 0,
}) => {
  const [activeVideo, setActiveVideo] = useState<ContentItem | null>(null);
  const [activeVideoStartTime, setActiveVideoStartTime] = useState<number>(0);
  const [isVideoLoading, setIsVideoLoading] = useState(true); // State for video iframe loading
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastReportedTimeRef = useRef<number>(0); // Track last reported time to reduce updates
  const isInitialLoadHandledRef = useRef(false); // Track if initial URL params have been handled
  const playlistItemRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map()); // Refs for playlist items


  // Effect to scroll active playlist item into view
  useEffect(() => {
    if (activeVideo?.id) {
      const itemRef = playlistItemRefs.current.get(activeVideo.id);
      if (itemRef) {
        itemRef.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [activeVideo?.id]);


  // Determine the initial/active video based on the provided playlist, userProgress, and initial URL params
  // Simplified: Now relies on parent component (VideoPage) to provide initialVideoId and initialStartTime
   useEffect(() => {
    setIsVideoLoading(true);
    let videoToPlay: ContentItem | null = null;
    let determinedStartTime = 0; // Renamed to avoid confusion with prop

    if (playlist.videos.length > 0) {
        // Priority 1: Initial URL Parameters (provided via props)
        if (initialVideoId) {
            const foundVideo = playlist.videos.find(v => v.id === initialVideoId);
            if (foundVideo) {
                console.log(`Setting initial video from URL: ${initialVideoId} at ${initialStartTime}s`);
                videoToPlay = foundVideo;
                // Use URL time if > 0, otherwise fallback to saved progress, then 0
                determinedStartTime = initialStartTime > 0 ? initialStartTime : (userProgress[initialVideoId]?.watchedTime || 0);
            } else {
                console.warn(`Video ID ${initialVideoId} from URL not found in playlist ${playlist.id}.`);
                 // Fallback: Find first unwatched or first video if URL video not found
                const firstUnwatched = playlist.videos.find(
                    (item) => !userProgress[item.id]?.completed
                );
                videoToPlay = firstUnwatched || playlist.videos[0];
                determinedStartTime = userProgress[videoToPlay.id]?.watchedTime || 0;
            }
        } else {
            // Priority 2: First uncompleted video (if no URL params)
            const firstUnwatched = playlist.videos.find(
                (item) => !userProgress[item.id]?.completed
            );
            if (firstUnwatched) {
                console.log(`Starting first unwatched video: ${firstUnwatched.id}`);
                videoToPlay = firstUnwatched;
                determinedStartTime = userProgress[firstUnwatched.id]?.watchedTime || 0;
            } else {
                // Priority 3: First video overall (fallback)
                 console.log(`Falling back to first video: ${playlist.videos[0].id}`);
                videoToPlay = playlist.videos[0];
                determinedStartTime = userProgress[videoToPlay.id]?.watchedTime || 0;
            }
        }

        setActiveVideo(videoToPlay);
        setActiveVideoStartTime(determinedStartTime);
    } else {
        setActiveVideo(null);
        setActiveVideoStartTime(0);
        setIsVideoLoading(false);
    }
    lastReportedTimeRef.current = determinedStartTime; // Use determinedStartTime

  }, [playlist.id, playlist.videos, userProgress, initialVideoId, initialStartTime]); // Dependencies remain the same


  // Update iframe src only when activeVideo or its specific startTime changes
  useEffect(() => {
      if (activeVideo && iframeRef.current) {
           const videoUrl = new URL(activeVideo.url);
          videoUrl.searchParams.set('enablejsapi', '1');
          videoUrl.searchParams.set('autoplay', '1');
          videoUrl.searchParams.set('modestbranding', '1');
          videoUrl.searchParams.set('rel', '0');
          videoUrl.searchParams.set('playsinline', '1');
           const currentStartTime = Math.floor(activeVideoStartTime);
          videoUrl.searchParams.set('start', currentStartTime.toString());
          if (typeof window !== 'undefined') {
            videoUrl.searchParams.set('origin', window.location.origin);
          }
          const newSrc = videoUrl.toString();

           const currentSrc = iframeRef.current.getAttribute('src');
           let needsUpdate = false;
           if (!currentSrc || currentSrc === 'about:blank') {
               needsUpdate = true;
           } else {
               try {
                   const currentUrl = new URL(currentSrc);
                   const currentVideoIdFromSrc = currentUrl.pathname.split('/').pop();
                   const currentStartTimeFromSrc = parseInt(currentUrl.searchParams.get('start') || '0', 10);

                   // Only update src if video ID changes OR start time differs significantly
                   if (currentVideoIdFromSrc !== activeVideo.id || Math.abs(currentStartTimeFromSrc - currentStartTime) > 5) {
                       needsUpdate = true;
                   }
               } catch (e) {
                   needsUpdate = true;
                   console.error("Could not parse current iframe src:", currentSrc, e);
               }
           }


          if (needsUpdate) {
              console.log(`Updating iframe src for ${activeVideo.id} to start at ${currentStartTime}s`);
              setIsVideoLoading(true);
              iframeRef.current.src = newSrc;
          } else {
               // If src doesn't need update but we are in loading state, finish loading
               if (isVideoLoading) setIsVideoLoading(false);
          }
      } else if (!activeVideo && iframeRef.current) {
          iframeRef.current.src = 'about:blank'; // Use about:blank instead of removing src
          setIsVideoLoading(false);
      } else if (!activeVideo) {
         setIsVideoLoading(false);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVideo, activeVideoStartTime]); // isVideoLoading removed as dependency


 // Function to start the progress tracking interval (memoized)
 const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
    }

    if (activeVideo && !isVideoLoading) {
        let currentTrackedTime = activeVideoStartTime;
        lastReportedTimeRef.current = activeVideoStartTime;

        progressIntervalRef.current = setInterval(() => {
            const intervalVideoId = activeVideo?.id;
            const intervalVideoDuration = activeVideo?.duration;

            if (!intervalVideoId || !intervalVideoDuration) {
                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                return;
            }

            currentTrackedTime += 1;

            // Report progress every 5 seconds, or near start/end
            const shouldReport = currentTrackedTime - lastReportedTimeRef.current >= 5 ||
                                currentTrackedTime <= 5 ||
                                (intervalVideoDuration > 0 && intervalVideoDuration - currentTrackedTime <= 5);

            if (intervalVideoDuration <= 0 || currentTrackedTime <= intervalVideoDuration) {
                if (shouldReport) {
                    // console.log(`Reporting progress for ${intervalVideoId} at ${currentTrackedTime}s`);
                    onProgressUpdate(intervalVideoId, currentTrackedTime);
                    lastReportedTimeRef.current = currentTrackedTime;
                }
            } else {
                // Ensure final progress is reported exactly at duration
                if (lastReportedTimeRef.current < intervalVideoDuration) {
                    // console.log(`Reporting final progress for ${intervalVideoId} at ${intervalVideoDuration}s`);
                    onProgressUpdate(intervalVideoId, intervalVideoDuration);
                    lastReportedTimeRef.current = intervalVideoDuration;
                }
                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            }
        }, 1000);
    }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [activeVideo?.id, activeVideo?.duration, isVideoLoading, activeVideoStartTime, onProgressUpdate]);


  // Handle iframe load event
  const handleIframeLoad = useCallback(() => {
    console.log(`Iframe loaded for ${activeVideo?.id}`);
    setIsVideoLoading(false);
    // Tracking starts via the effect below now
  }, [activeVideo?.id]);


  // Effect to manage the interval lifecycle based on video state and loading state
  useEffect(() => {
      if (activeVideo && !isVideoLoading) {
          startProgressTracking();
      }

      return () => {
          if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null; // Clear ref on cleanup
          }
      };
  }, [activeVideo, isVideoLoading, startProgressTracking]);


  const handlePlaylistItemClick = useCallback((item: ContentItem) => {
    if (activeVideo?.id !== item.id) {
      const startTime = userProgress[item.id]?.watchedTime || 0;
      console.log(`Playlist item clicked: ${item.id}, setting start time to ${startTime}s`);
      setActiveVideo(item);
      setActiveVideoStartTime(startTime);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null; // Ensure interval stops
      }
       // Update URL
       // Find a way to access router here or lift state up
       // Example (requires router): router.push(`/videos?tab=${playlist.category}&playlistId=${playlist.id}&videoId=${item.id}&time=${Math.floor(startTime)}`, { scroll: false });

    } else {
         console.log(`Playlist item clicked: ${item.id} (already active)`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVideo?.id, userProgress, playlist.id, playlist.category]); // Removed router dependency for now


  // Memoize calculation for progress based on userProgress and item duration
  const getVideoProgress = useCallback((item: ContentItem): number => {
      const history = userProgress[item.id];
      if (!history || !item.duration || item.duration <= 0) return 0;
      return Math.min(100, (history.watchedTime / item.duration) * 100);
  }, [userProgress]);

  // Memoize calculation for watched time based on userProgress
  const getWatchedTime = useCallback((itemId: string): number => {
      return userProgress[itemId]?.watchedTime || 0;
  }, [userProgress]);

   // Memoize completion status check
   const isVideoCompleted = useCallback((item: ContentItem): boolean => {
     const progressData = userProgress[item.id];
     return progressData?.completed || (progressData?.watchedTime && item.duration > 0 && progressData.watchedTime >= item.duration * 0.95) || false;
  }, [userProgress]);

  // Basic keyword extraction for thumbnail search hint
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
      if (!playlist?.videos) return [];
      return playlist.videos.map((item, index) => {
         const progress = getVideoProgress(item);
         const watchedTime = getWatchedTime(item.id);
         const isCompleted = isVideoCompleted(item);
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
             statusText = 'In Progress';
         }

         return (
           <TooltipProvider key={item.id} delayDuration={150}>
            <Tooltip>
             <TooltipTrigger asChild>
               <Button
                 ref={(el) => playlistItemRefs.current.set(item.id, el)}
                 variant="ghost"
                 className={cn(
                   "w-full justify-start h-auto p-2 sm:p-3 text-left relative transition-all duration-200 rounded-md group", // Added group class, transition-all
                   "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background", // Focus ring
                   "hover:bg-muted/80", // Enhanced hover effect
                    isActive ? 'bg-accent shadow-inner ring-1 ring-inset ring-primary/30' : '',
                    {'opacity-80 hover:opacity-100': isCompleted && !isActive}
                 )}
                 onClick={() => handlePlaylistItemClick(item)}
                 aria-current={isActive ? 'page' : undefined}
               >
                   {/* Index Number */}
                   <span className="text-xs font-medium text-muted-foreground w-5 text-center pt-1 flex-shrink-0 hidden sm:block">{index + 1}</span>

                   {/* Thumbnail Area */}
                   <div className="w-20 sm:w-24 flex-shrink-0 relative aspect-video rounded overflow-hidden shadow-sm border border-border/50"> {/* Added border */}
                        <Image
                           src={`https://picsum.photos/seed/${item.id}/160/90`} // Increased size slightly for better quality
                           alt="" // Decorative
                           layout="fill"
                           objectFit="cover"
                           className="transition-transform duration-300 group-hover:scale-105"
                           data-ai-hint={thumbnailHint}
                           unoptimized
                        />
                         {/* Duration Badge */}
                        <div className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 bg-black/80 text-white text-[10px] px-1 py-0.5 rounded-sm font-medium backdrop-blur-sm"> {/* Added backdrop-blur */}
                            {formatTime(item.duration)}
                        </div>
                         {/* Play Icon Overlay */}
                        <div className={cn(
                             "absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-center justify-center transition-opacity duration-300", // Gradient overlay
                             isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" // Show on focus too
                         )}>
                           <PlayCircle className="h-6 w-6 sm:h-7 sm:w-7 text-white/90 drop-shadow-lg" /> {/* Larger, slight shadow */}
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className="flex-grow overflow-hidden pt-0 ml-3"> {/* Added ml-3 */}
                        <p className={cn(
                            'text-sm font-medium line-clamp-2 leading-snug',
                             isActive ? 'text-primary font-semibold' : 'text-foreground group-hover:text-foreground' // Ensure text is foreground on hover
                         )}>
                            {item.title}
                        </p>
                         {/* Status Icon and Time/Progress */}
                        <div className="flex items-center text-xs text-muted-foreground mt-1 space-x-1.5">
                           <StatusIcon className={cn("h-3.5 w-3.5 flex-shrink-0", iconColor)} aria-hidden="true" />
                           <span className="truncate text-[11px] sm:text-xs">
                               {isCompleted ? 'Completed' : (watchedTime > 0 ? `${formatTime(watchedTime)} / ${formatTime(item.duration)}` : `${formatTime(item.duration)}`)}
                           </span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <Progress
                     value={progress}
                     className={cn(
                        "absolute bottom-0 left-0 right-0 h-[3px] sm:h-[4px] rounded-none opacity-75 group-hover:opacity-100 transition-opacity duration-200", // Thicker, slightly more opaque
                        isCompleted ? 'bg-green-600/30 dark:bg-green-500/30' : 'bg-primary/30'
                     )}
                     indicatorClassName={cn(
                        'transition-transform duration-500 ease-out', // Adjusted transition timing
                        isCompleted ? 'bg-green-600 dark:bg-green-500' : 'bg-primary'
                     )}
                     aria-label={`${item.title} progress: ${Math.round(progress)}%`}
                     />
               </Button>
               </TooltipTrigger>
                {/* Tooltip Content */}
                <TooltipContent side="left" align="start" className="max-w-[200px] sm:max-w-xs text-xs sm:text-sm" sideOffset={10}>
                  <p className="font-semibold mb-1">{item.title}</p>
                  {item.description && <p className="text-xs text-muted-foreground my-1">{item.description}</p>}
                   <div className="text-xs space-y-0.5 mt-1">
                     {item.duration > 0 && <p><Clock className="inline h-3 w-3 mr-1" />{formatTime(item.duration)} total</p>}
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
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [playlist?.videos, activeVideo?.id, getVideoProgress, getWatchedTime, isVideoCompleted, getThumbnailHint, handlePlaylistItemClick]);

  const PlaylistIcon = getPlaylistIcon(playlist.category);

  return (
    <Card className="overflow-hidden shadow-lg border">
      {/* Combined Header */}
      <CardHeader className="border-b bg-muted/40 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-2 sm:mb-0">
                <CardTitle className="text-base sm:text-lg font-semibold text-primary flex items-center gap-2">
                   {PlaylistIcon && <PlaylistIcon className="h-4 w-4 sm:h-5 sm:w-5" />}
                   {playlist?.title || 'Playlist'}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                    {(playlist?.videos?.length || 0)} videos {playlist.creator ? `・ By ${playlist.creator}` : ''} {playlist?.description ? `・ ${playlist.description}`: ''}
                </CardDescription>
            </div>
          </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Main Content Area: Video and Playlist */}
        <div className="flex flex-col md:flex-row">

          {/* Video Player Area */}
          <div className="w-full md:flex-grow relative aspect-video bg-gradient-to-br from-muted/50 to-muted group shadow-inner"> {/* Added inner shadow */}
            {/* Loading State Overlay */}
            {isVideoLoading && activeVideo && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10 text-center p-4 animate-pulseFast"> {/* Changed pulse animation */}
                   <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 text-primary animate-spin mb-2 sm:mb-3" />
                   <p className="text-muted-foreground text-xs sm:text-sm">Loading: {activeVideo.title}...</p>
              </div>
            )}
            {/* Placeholder when no video is selected */}
            {!activeVideo && (playlist?.videos?.length || 0) > 0 && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-center p-4">
                  <ListVideo className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mb-2 sm:mb-3" />
                  <p className="text-muted-foreground text-sm sm:text-base font-medium">Select a video from the playlist</p>
                  <p className="text-xs sm:text-sm text-muted-foreground/80 mt-1">Your learning journey awaits!</p>
              </div>
            )}
            {/* Placeholder for empty playlist */}
            {(!playlist?.videos || playlist.videos.length === 0) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-center p-4">
                   <ListVideo className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mb-2 sm:mb-3" />
                   <p className="text-muted-foreground text-sm sm:text-base font-medium">No videos in this playlist yet.</p>
                </div>
            )}

             {/* YouTube Iframe */}
             {activeVideo && (
                 <iframe
                    ref={iframeRef}
                    title={activeVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className={cn(
                      "block absolute inset-0 w-full h-full transition-opacity duration-500", // Increased duration
                      isVideoLoading ? "opacity-0 pointer-events-none" : "opacity-100" // Prevent interaction while loading
                     )}
                    key={activeVideo.id} // Re-render iframe when video ID changes
                    onLoad={handleIframeLoad}
                    src={iframeRef.current?.src || "about:blank"} // Start with blank or current src
                  ></iframe>
              )}
          </div>

          {/* Playlist Area */}
          {(playlist?.videos?.length || 0) > 0 && (
            <div className="w-full md:w-72 lg:w-80 xl:w-96 border-t md:border-t-0 md:border-l bg-background md:bg-muted/20 flex flex-col flex-shrink-0">
               {/* Use fixed height for scroll area on larger screens */}
               <ScrollArea className="flex-grow h-[45vh] sm:h-[50vh] md:h-[calc(var(--vh,1vh)*100-10rem)] lg:h-[calc(var(--vh,1vh)*100-11rem)] md:max-h-[calc(100vh-theme(spacing.16))]">
                 <div className="p-1.5 sm:p-2 space-y-1 sm:space-y-1.5">
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