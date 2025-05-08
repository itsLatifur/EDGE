
'use client';

import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import Image from 'next/image';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Progress} from '@/components/ui/progress';
import {Button} from '@/components/ui/button';
import {PlayCircle, CheckCircle, Circle, ListVideo, Clock, Loader2, TvMinimalPlay } from 'lucide-react';
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
  playlist: Playlist; // Now accepts the full Playlist object (id is YouTube Playlist ID)
  userProgress: UserProgress; // Can be an empty object {} but not null
  onProgressUpdate: (videoId: string, currentTime: number) => void; // videoId is YouTube Video ID
  initialVideoId?: string | null; // Optional initial YouTube Video ID from URL
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
  playlist, 
  userProgress,
  onProgressUpdate,
  initialVideoId,
  initialStartTime = 0,
}) => {
  const [activeVideo, setActiveVideo] = useState<ContentItem | null>(null); // ContentItem.id is YouTube Video ID
  const [activeVideoStartTime, setActiveVideoStartTime] = useState<number>(0);
  const [isVideoLoading, setIsVideoLoading] = useState(true); 
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastReportedTimeRef = useRef<number>(0); 
  const playlistItemRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map()); 


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


   useEffect(() => {
    setIsVideoLoading(true);
    let videoToPlay: ContentItem | null = null;
    let determinedStartTime = 0; 

    if (playlist.videos.length > 0) {
        if (initialVideoId) {
            const foundVideo = playlist.videos.find(v => v.id === initialVideoId);
            if (foundVideo) {
                console.log(`Setting initial video from URL: ${initialVideoId} at ${initialStartTime}s`);
                videoToPlay = foundVideo;
                determinedStartTime = initialStartTime > 0 ? initialStartTime : (userProgress[initialVideoId]?.watchedTime || 0);
            } else {
                console.warn(`Video ID ${initialVideoId} from URL not found in playlist ${playlist.id}.`);
                const firstUnwatched = playlist.videos.find(
                    (item) => !userProgress[item.id]?.completed
                );
                videoToPlay = firstUnwatched || playlist.videos[0];
                determinedStartTime = userProgress[videoToPlay.id]?.watchedTime || 0;
            }
        } else {
            const firstUnwatched = playlist.videos.find(
                (item) => !userProgress[item.id]?.completed
            );
            if (firstUnwatched) {
                console.log(`Starting first unwatched video: ${firstUnwatched.id}`);
                videoToPlay = firstUnwatched;
                determinedStartTime = userProgress[firstUnwatched.id]?.watchedTime || 0;
            } else {
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
    lastReportedTimeRef.current = determinedStartTime; 

  }, [playlist.id, playlist.videos, userProgress, initialVideoId, initialStartTime]); 


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
               if (isVideoLoading) setIsVideoLoading(false);
          }
      } else if (!activeVideo && iframeRef.current) {
          iframeRef.current.src = 'about:blank'; 
          setIsVideoLoading(false);
      } else if (!activeVideo) {
         setIsVideoLoading(false);
      }
  }, [activeVideo, activeVideoStartTime, isVideoLoading]); 


 const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
    }

    if (activeVideo && !isVideoLoading) {
        let currentTrackedTime = activeVideoStartTime;
        lastReportedTimeRef.current = activeVideoStartTime;

        progressIntervalRef.current = setInterval(() => {
            const intervalVideoId = activeVideo?.id; // YouTube Video ID
            const intervalVideoDuration = activeVideo?.duration;

            if (!intervalVideoId || !intervalVideoDuration) {
                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                return;
            }

            currentTrackedTime += 1;

            const shouldReport = currentTrackedTime - lastReportedTimeRef.current >= 5 ||
                                currentTrackedTime <= 5 ||
                                (intervalVideoDuration > 0 && intervalVideoDuration - currentTrackedTime <= 5);

            if (intervalVideoDuration <= 0 || currentTrackedTime <= intervalVideoDuration) {
                if (shouldReport) {
                    onProgressUpdate(intervalVideoId, currentTrackedTime);
                    lastReportedTimeRef.current = currentTrackedTime;
                }
            } else {
                if (lastReportedTimeRef.current < intervalVideoDuration) {
                    onProgressUpdate(intervalVideoId, intervalVideoDuration);
                    lastReportedTimeRef.current = intervalVideoDuration;
                }
                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            }
        }, 1000);
    }
 }, [activeVideo, isVideoLoading, activeVideoStartTime, onProgressUpdate]);


  const handleIframeLoad = useCallback(() => {
    console.log(`Iframe loaded for ${activeVideo?.id}`);
    setIsVideoLoading(false);
  }, [activeVideo?.id]);


  useEffect(() => {
      if (activeVideo && !isVideoLoading) {
          startProgressTracking();
      }
      return () => {
          if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null; 
          }
      };
  }, [activeVideo, isVideoLoading, startProgressTracking]);


  const handlePlaylistItemClick = useCallback((item: ContentItem) => { // item.id is YouTube Video ID
    if (activeVideo?.id !== item.id) {
      const startTime = userProgress[item.id]?.watchedTime || 0;
      console.log(`Playlist item clicked: ${item.id}, setting start time to ${startTime}s`);
      setActiveVideo(item);
      setActiveVideoStartTime(startTime);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null; 
      }
      // TODO: Update URL here via router or lifted state, using playlist.id (YouTube Playlist ID) and item.id (YouTube Video ID)
      // e.g., router.push(`/videos?tab=${playlist.category}&playlistId=${playlist.id}&videoId=${item.id}&time=${Math.floor(startTime)}`, { scroll: false });
    } else {
         console.log(`Playlist item clicked: ${item.id} (already active)`);
    }
  }, [activeVideo?.id, userProgress, playlist.id, playlist.category]); 


  const getVideoProgress = useCallback((item: ContentItem): number => {
      const history = userProgress[item.id]; // item.id is YouTube Video ID
      if (!history || !item.duration || item.duration <= 0) return 0;
      return Math.min(100, (history.watchedTime / item.duration) * 100);
  }, [userProgress]);


  const getWatchedTime = useCallback((itemId: string): number => { // itemId is YouTube Video ID
      return userProgress[itemId]?.watchedTime || 0;
  }, [userProgress]);


   const isVideoCompleted = useCallback((item: ContentItem): boolean => {
     const progressData = userProgress[item.id]; // item.id is YouTube Video ID
     return progressData?.completed || (progressData?.watchedTime && item.duration > 0 && progressData.watchedTime >= item.duration * 0.95) || false;
  }, [userProgress]);


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
      return 'web development tutorial coding learn programming'; 
  }, []);


   const renderedPlaylistItems = useMemo(() => {
      if (!playlist?.videos) return [];
      return playlist.videos.map((item, index) => { // item.id is YouTube Video ID
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
             StatusIcon = TvMinimalPlay; // Updated Icon
             iconColor = "text-primary animate-pulseFast"; // Faster pulse
             statusText = 'Playing';
         } else if (watchedTime > 0) {
             StatusIcon = PlayCircle;
             iconColor = "text-primary/80";
             statusText = 'In Progress';
         }

         return (
           <TooltipProvider key={item.id} delayDuration={200}>
            <Tooltip>
             <TooltipTrigger asChild>
               <Button
                 ref={(el) => playlistItemRefs.current.set(item.id, el)}
                 variant="ghost"
                 className={cn(
                   "w-full justify-start h-auto p-2 sm:p-3 text-left relative transition-all duration-200 ease-in-out rounded-lg group border-2 border-transparent", 
                   "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:z-10", 
                   "hover:bg-muted/80 hover:border-primary/30", 
                    isActive ? 'bg-primary/10 shadow-inner ring-2 ring-inset ring-primary/70 border-primary/70' : (isCompleted ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/50' :'hover:border-border'),
                    {'opacity-70 hover:opacity-100': isCompleted && !isActive}
                 )}
                 onClick={() => handlePlaylistItemClick(item)}
                 aria-current={isActive ? 'page' : undefined}
               >
                   <span className="text-xs font-medium text-muted-foreground w-6 text-center pt-1 flex-shrink-0 hidden sm:block self-start">{index + 1}.</span>

                   <div className="w-24 sm:w-28 flex-shrink-0 relative aspect-video rounded-md overflow-hidden shadow-md border border-border/60 group-hover:shadow-lg transition-shadow duration-200">
                        <Image
                           src={`https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`} // Standard YouTube thumbnail URL structure
                           alt={`Thumbnail for ${item.title}`}
                           layout="fill"
                           objectFit="cover"
                           className="transition-transform duration-300 group-hover:scale-105"
                           data-ai-hint={thumbnailHint} // Keep for potential future use
                           unoptimized // Generally good for external URLs
                        />
                        <div className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 bg-black/85 text-white text-[10px] px-1.5 py-0.5 rounded-sm font-semibold backdrop-blur-sm">
                            {formatTime(item.duration)}
                        </div>
                        <div className={cn(
                             "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-center justify-center transition-opacity duration-300",
                             isActive ? "opacity-0" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" 
                         )}>
                           <PlayCircle className="h-7 w-7 sm:h-8 sm:w-8 text-white/90 drop-shadow-xl" />
                        </div>
                        {isActive && (
                            <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                                <TvMinimalPlay className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground drop-shadow-lg animate-pulseFast" />
                            </div>
                        )}
                    </div>

                    <div className="flex-grow overflow-hidden pt-0 ml-3 sm:ml-4">
                        <p className={cn(
                            'text-sm font-semibold line-clamp-2 leading-snug mb-0.5',
                             isActive ? 'text-primary' : 'text-foreground group-hover:text-primary transition-colors'
                         )}>
                            {item.title}
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground mt-1 space-x-2">
                           <div className="flex items-center">
                               <StatusIcon className={cn("h-3.5 w-3.5 flex-shrink-0 mr-1", iconColor)} aria-hidden="true" />
                               <span className="truncate text-[11px] sm:text-xs">{statusText}</span>
                           </div>
                           {watchedTime > 0 && !isCompleted && (
                               <span className="truncate text-[11px] sm:text-xs hidden sm:inline">
                                   {formatTime(watchedTime)} / {formatTime(item.duration)}
                               </span>
                           )}
                        </div>
                        <Progress
                         value={progress}
                         className={cn(
                            "mt-1.5 h-1 sm:h-[5px] rounded-full opacity-80 group-hover:opacity-100 transition-opacity duration-200",
                            isCompleted ? 'bg-green-600/30 dark:bg-green-500/30' : (isActive ? 'bg-primary/30' : 'bg-muted')
                         )}
                         indicatorClassName={cn(
                            'transition-all duration-500 ease-out rounded-full', 
                            isCompleted ? 'bg-green-600 dark:bg-green-500' : 'bg-primary'
                         )}
                         aria-label={`${item.title} progress: ${Math.round(progress)}%`}
                         />
                    </div>
               </Button>
               </TooltipTrigger>
                <TooltipContent side="left" align="center" className="max-w-[220px] sm:max-w-xs text-xs sm:text-sm p-2.5" sideOffset={10}>
                  <p className="font-semibold mb-1.5 text-sm">{item.title}</p>
                  {item.description && <p className="text-xs text-muted-foreground my-1.5 line-clamp-3">{item.description}</p>}
                   <div className="text-xs space-y-1 mt-1.5 border-t pt-1.5">
                     {item.duration > 0 && <p className="flex items-center"><Clock className="inline h-3.5 w-3.5 mr-1.5 text-muted-foreground" />Duration: {formatTime(item.duration)}</p>}
                     {watchedTime > 0 && <p className="flex items-center"><PlayCircle className="inline h-3.5 w-3.5 mr-1.5 text-muted-foreground" />Watched: {formatTime(watchedTime)} ({Math.round(progress)}%)</p>}
                     <p className={cn("flex items-center font-medium", iconColor)}>
                         <StatusIcon className="inline h-3.5 w-3.5 mr-1.5" />Status: {statusText}
                     </p>
                  </div>
                </TooltipContent>
             </Tooltip>
           </TooltipProvider>
         );
       });
   }, [playlist?.videos, activeVideo?.id, getVideoProgress, getWatchedTime, isVideoCompleted, getThumbnailHint, handlePlaylistItemClick]);

  const PlaylistIcon = getPlaylistIcon(playlist.category);

  return (
    <Card className="overflow-hidden shadow-lg border rounded-xl">
      <CardHeader className="border-b bg-muted/30 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-2 sm:mb-0 flex-grow min-w-0">
                <CardTitle className="text-lg sm:text-xl font-bold text-primary flex items-center gap-2.5">
                   {PlaylistIcon && <PlaylistIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                   <span className="truncate">{playlist?.title || 'Playlist'}</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1.5 truncate">
                    {(playlist?.videos?.length || 0)} videos {playlist.creator ? `・ By ${playlist.creator}` : ''} {playlist?.description ? `・ ${playlist.description}`: ''}
                </CardDescription>
            </div>
          </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:flex-grow relative aspect-video bg-gradient-to-br from-muted/60 to-muted/90 group shadow-inner">
            {isVideoLoading && activeVideo && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md z-10 text-center p-4 animate-pulseFast">
                   <Loader2 className="h-10 w-10 sm:h-14 sm:w-14 text-primary animate-spin mb-3 sm:mb-4" />
                   <p className="text-muted-foreground text-sm sm:text-base font-medium">Loading: {activeVideo.title}...</p>
                   <p className="text-xs text-muted-foreground/80 mt-1">Please wait a moment.</p>
              </div>
            )}
            {!activeVideo && (playlist?.videos?.length || 0) > 0 && (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 text-center p-4">
                  <ListVideo className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/40 mb-3 sm:mb-4" />
                  <p className="text-muted-foreground text-base sm:text-lg font-semibold">Select a video to start learning</p>
                  <p className="text-sm text-muted-foreground/80 mt-1.5">Your journey to mastering {playlist.category} begins here!</p>
              </div>
            )}
            {(!playlist?.videos || playlist.videos.length === 0) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 text-center p-4">
                   <ListVideo className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/40 mb-3 sm:mb-4" />
                   <p className="text-muted-foreground text-base sm:text-lg font-semibold">No videos in this playlist yet.</p>
                   <p className="text-sm text-muted-foreground/80 mt-1.5">Check back soon for new content!</p>
                </div>
            )}

             {activeVideo && (
                 <iframe
                    ref={iframeRef}
                    title={activeVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className={cn(
                      "block absolute inset-0 w-full h-full transition-opacity duration-500 ease-in-out",
                      isVideoLoading ? "opacity-0 pointer-events-none" : "opacity-100" 
                     )}
                    key={`${activeVideo.id}-${activeVideoStartTime}`} // Key change forces re-render if start time changes for same video
                    onLoad={handleIframeLoad}
                    src={iframeRef.current?.src || "about:blank"} 
                  ></iframe>
              )}
          </div>

          {(playlist?.videos?.length || 0) > 0 && (
            <div className="w-full md:w-80 lg:w-96 xl:w-[26rem] border-t md:border-t-0 md:border-l bg-background/70 md:bg-muted/20 flex flex-col flex-shrink-0 backdrop-blur-sm">
               <ScrollArea 
                className="flex-grow h-[50vh] sm:h-[55vh] md:h-[calc(var(--vh,1vh)*100-theme(spacing.16)-theme(spacing.16))] md:max-h-[calc(100vh-theme(spacing.16)-theme(spacing.4))]"
                style={{ '--vh': '1vh' } as React.CSSProperties} // For more accurate vh on mobile
               >
                 <div className="p-2 sm:p-2.5 space-y-1.5 sm:space-y-2">
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
