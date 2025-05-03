'use client';

import React, {useState, useEffect, useRef} from 'react';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Progress} from '@/components/ui/progress';
import {Button} from '@/components/ui/button';
import {PlayCircle, CheckCircle, Clock} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  url: string;
  duration: number; // Duration in seconds
}

interface UserHistory {
  [videoId: string]: {watchedTime: number; lastWatched: Date};
}

interface LearningContentProps {
  title: string;
  type: 'video' | 'article' | 'playlist';
  url?: string;
  videoId?: string;
  playlist?: ContentItem[];
  userHistory: UserHistory;
  onProgressUpdate: (videoId: string, currentTime: number) => void;
  currentTab?: string; // To know which tab's playlist is active
  isContinueWatching?: boolean; // Flag for the special "continue watching" card
  initialStartTime?: number; // Start time for "continue watching"
}

const LearningContent: React.FC<LearningContentProps> = ({
  title,
  type,
  url,
  videoId,
  playlist = [],
  userHistory,
  onProgressUpdate,
  currentTab,
  isContinueWatching = false,
  initialStartTime = 0,
}) => {
  const [activeVideo, setActiveVideo] = useState<ContentItem | null>(null);
  const [activeVideoStartTime, setActiveVideoStartTime] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Determine the initial video for playlist view
  useEffect(() => {
    if (type === 'playlist' && playlist.length > 0 && !isContinueWatching) {
      // Find the first unwatched or partially watched video in the current tab's playlist
      const firstUnwatched = playlist.find(
        (item) => !userHistory[item.id] || userHistory[item.id].watchedTime < item.duration
      );
      if (firstUnwatched) {
        setActiveVideo(firstUnwatched);
        setActiveVideoStartTime(userHistory[firstUnwatched.id]?.watchedTime || 0);
      } else {
        // If all are watched, default to the first video
        setActiveVideo(playlist[0]);
        setActiveVideoStartTime(userHistory[playlist[0].id]?.watchedTime || 0);
      }
    } else if (type === 'video' && url && videoId) {
      // For single video or continue watching
      setActiveVideo({id: videoId, title: title, url: url, duration: 0}); // Duration might not be known initially for single video
      setActiveVideoStartTime(initialStartTime);
    }
  }, [type, playlist, userHistory, url, videoId, title, isContinueWatching, initialStartTime, currentTab]);


  // Update iframe src when activeVideo or startTime changes
  useEffect(() => {
      if (activeVideo && iframeRef.current) {
          const videoUrl = new URL(activeVideo.url);
          // Ensure we append 'start' correctly, considering existing params
          videoUrl.searchParams.set('start', Math.floor(activeVideoStartTime).toString());
          videoUrl.searchParams.set('enablejsapi', '1'); // Enable JS API
          videoUrl.searchParams.set('origin', window.location.origin); // Important for JS API security

          if (iframeRef.current.src !== videoUrl.toString()) {
            iframeRef.current.src = videoUrl.toString();
          }
      }
  }, [activeVideo, activeVideoStartTime]);


  // Set up interval to track video progress via YouTube IFrame Player API (simplified example)
  useEffect(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    if (activeVideo && type !== 'article') {
        // Basic time tracking - a real implementation would use the YouTube API for accuracy
        // This is a placeholder as the YT API setup is complex for this context
        let pseudoCurrentTime = activeVideoStartTime;
        progressIntervalRef.current = setInterval(() => {
             if (activeVideo) { // Check if activeVideo is still valid
                pseudoCurrentTime += 1;
                // Check against known duration if available, otherwise estimate
                const knownDuration = activeVideo.duration || Infinity;
                if(pseudoCurrentTime <= knownDuration) {
                    onProgressUpdate(activeVideo.id, pseudoCurrentTime);
                } else {
                   if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                }
             } else {
                 if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); // Clear if video changed
             }

        }, 1000);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
    // Re-run effect when activeVideo changes
  }, [activeVideo, onProgressUpdate, activeVideoStartTime]);


  const handlePlaylistItemClick = (item: ContentItem) => {
    setActiveVideo(item);
    setActiveVideoStartTime(userHistory[item.id]?.watchedTime || 0);
  };

  const getVideoProgress = (item: ContentItem): number => {
      const history = userHistory[item.id];
      if (!history || !item.duration) return 0;
      return Math.min(100, (history.watchedTime / item.duration) * 100);
  }

  const formatTime = (seconds: number): string => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }

  return (
    <Card className="overflow-hidden shadow-lg transition-shadow hover:shadow-xl duration-300">
      {!isContinueWatching && type === 'playlist' && (
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary">{title}</CardTitle>
            <CardDescription>Select a video from the playlist to start learning.</CardDescription>
          </CardHeader>
      )}
      <CardContent className={`p-0 ${type === 'playlist' ? 'md:grid md:grid-cols-3 gap-0' : ''}`}>
        {type === 'playlist' && activeVideo && (
          <div className="md:col-span-2 aspect-video border-b md:border-b-0 md:border-r">
            <iframe
              ref={iframeRef}
              width="100%"
              height="100%"
              src={activeVideo ? `${activeVideo.url}?start=${Math.floor(activeVideoStartTime)}&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}` : ''}
              title={activeVideo?.title || 'YouTube video player'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="transition-opacity duration-500 ease-in-out"
              key={activeVideo?.id} // Force re-render on video change
            ></iframe>
          </div>
        )}

        {type === 'video' && url && (
           <div className="aspect-video">
            <iframe
                ref={iframeRef}
                width="100%"
                height="100%"
                src={url ? `${url}&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}` : ''}
                title={title || 'YouTube video player'}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="transition-opacity duration-500 ease-in-out"
             ></iframe>
          </div>
        )}


        {type === 'playlist' && (
          <ScrollArea className="md:col-span-1 h-64 md:h-full">
            <div className="p-4 space-y-2">
              <h3 className="font-medium text-base mb-2 px-2">Playlist</h3>
              {playlist.map((item) => {
                const progress = getVideoProgress(item);
                const isWatched = progress >= 99; // Consider watched if near 100%
                const isActive = activeVideo?.id === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start h-auto py-2 px-2 text-left relative transition-all duration-200 ${isActive ? 'bg-accent shadow-inner' : ''}`}
                    onClick={() => handlePlaylistItemClick(item)}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      {isWatched ? (
                         <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                       ) : (
                         isActive ? <PlayCircle className="h-5 w-5 text-primary flex-shrink-0 animate-pulse" /> : <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                       )}
                       <div className="flex-grow overflow-hidden">
                           <p className={`text-sm font-medium truncate ${isActive ? 'text-accent-foreground' : ''}`}>{item.title}</p>
                           <p className="text-xs text-muted-foreground">Duration: {formatTime(item.duration)}</p>
                      </div>
                    </div>
                    {progress > 0 && (
                        <Progress value={progress} className="absolute bottom-0 left-0 right-0 h-1 rounded-none" aria-label={`${item.title} progress: ${Math.round(progress)}%`} />
                    )}
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {type === 'article' && url && (
          <div className="p-6">
             <h2 className="text-lg font-semibold mb-4">{title}</h2>
             {/* In a real app, fetch and render article content here */}
             <p className="text-muted-foreground">Article content for "{title}" would be displayed here. This could involve fetching markdown or using an embedded view.</p>
             <a href={url} target="_blank" rel="noopener noreferrer" className="text-accent-foreground hover:underline mt-4 inline-block">
               Read full article
             </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LearningContent;
