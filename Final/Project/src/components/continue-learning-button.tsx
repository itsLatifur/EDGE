
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
// playlistCategories and playlistVideos are now driven by playlist-sources.json
// Their keys are YouTube Playlist IDs.
import { playlistCategories, playlistVideos, findVideoDetails } from '@/lib/data/playlists'; 
import type { ContentItem, UserProgressEntry, PlaylistType } from '@/types';
import { loadGuestProgress, getUserProgress } from '@/services/user-progress';


interface ContinueData {
  video: ContentItem; // video.id is YouTube Video ID
  playlistId: string; // YouTube Playlist ID
  playlistCategory: PlaylistType; 
  startTime: number;
}


const findNextVideo = (progress: { [videoId: string]: UserProgressEntry } | null): ContinueData | null => {
  if (!progress) {
     console.log("findNextVideo: No progress data provided.");
     return null;
  }
  console.log("findNextVideo: Searching with progress data:", progress);

  // Create a map of all videos where keys are YouTube Video IDs
  // and values contain video details, YouTube Playlist ID, and category.
  const allVideosMap = new Map<string, { video: ContentItem; playlistId: string; playlistCategory: PlaylistType }>();
  Object.entries(playlistCategories).forEach(([category, playlistSummaries]) => {
      playlistSummaries.forEach(summary => { // summary.id is YouTube Playlist ID
          const videosInPlaylist = playlistVideos[summary.id] || []; // Access videos using YouTube Playlist ID
          videosInPlaylist.forEach(video => { // video.id is YouTube Video ID
              allVideosMap.set(video.id, { video, playlistId: summary.id, playlistCategory: category as PlaylistType });
          });
      });
  });

  const relevantHistory = Object.entries(progress)
    .filter(([videoId, data]) => // videoId is YouTube Video ID
        allVideosMap.has(videoId) &&
        data?.lastWatched instanceof Date && 
        !isNaN(data.lastWatched.getTime()) && 
        data.watchedTime >= 0
    )
    .map(([videoId, data]) => { // videoId is YouTube Video ID
      const details = allVideosMap.get(videoId)!; 
      return {
          videoId, // YouTube Video ID
          watchedTime: data.watchedTime,
          lastWatched: data.lastWatched,
          completed: data.completed,
          playlistId: details.playlistId, // YouTube Playlist ID
          playlistCategory: details.playlistCategory,
      };
    })
    .sort((a, b) => b.lastWatched.getTime() - a.lastWatched.getTime()); 

   console.log("findNextVideo: Relevant history sorted:", relevantHistory);

  const lastIncomplete = relevantHistory.find(entry => !entry.completed);

  if (lastIncomplete) {
    const details = allVideosMap.get(lastIncomplete.videoId); // lastIncomplete.videoId is YouTube Video ID
    if (details) {
       console.log(`findNextVideo: Found last incomplete video: ${details.video.title} in playlist ${details.playlistId} at ${lastIncomplete.watchedTime}s`);
       return {
         video: details.video, // video.id is YouTube Video ID
         playlistId: details.playlistId, // YouTube Playlist ID
         playlistCategory: details.playlistCategory,
         startTime: lastIncomplete.watchedTime,
       };
    }
  } else {
     console.log("findNextVideo: No incomplete videos found in history.");
  }

   console.log("findNextVideo: Searching for the first overall uncompleted video.");
   for (const category in playlistCategories) {
       const cat = category as PlaylistType;
       for (const summary of playlistCategories[cat]) { // summary.id is YouTube Playlist ID
           const videosInPlaylist = playlistVideos[summary.id] || []; // Access using YouTube Playlist ID
           for (const video of videosInPlaylist) { // video.id is YouTube Video ID
               if (!progress[video.id]?.completed) {
                   console.log(`findNextVideo: Found first overall uncompleted video: ${video.title} in playlist ${summary.id}`);
                   return {
                       video: video, // video.id is YouTube Video ID
                       playlistId: summary.id, // YouTube Playlist ID
                       playlistCategory: cat,
                       startTime: progress[video.id]?.watchedTime || 0, 
                   };
               }
           }
       }
   }

  console.log("findNextVideo: No video found to continue.");
  return null; 
};


export default function ContinueLearningButton() {
  const { user, isGuest, loading: authLoading } = useAuth();
  const [userProgress, setUserProgress] = useState<{[videoId: string]: UserProgressEntry} | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [isVisible, setIsVisible] = useState(false); 

  useEffect(() => {
      const fetchProgress = async () => {
          setIsLoadingProgress(true);
          let progressData = null;
          try {
              if (!isGuest && user) {
                 console.log("Continue button: Fetching user progress for", user.uid);
                 progressData = await getUserProgress(user.uid);
              } else if (isGuest) {
                 console.log("Continue button: Loading guest progress");
                 progressData = loadGuestProgress();
              }
              setUserProgress(progressData);
              console.log("Continue button: Progress data set:", progressData);
          } catch (error) {
             console.error("Continue button: Error fetching/loading progress", error);
             setUserProgress(null); 
          } finally {
             setIsLoadingProgress(false);
             console.log("Continue button: Finished loading progress.");
          }
      };

      if (!authLoading) { 
           console.log("Continue button: Auth state resolved, fetching progress...");
          fetchProgress();
      } else {
          console.log("Continue button: Waiting for auth state...");
          setUserProgress(null);
          setIsLoadingProgress(true);
          setIsVisible(false); 
      }
  }, [isGuest, user, authLoading]);

  const continueData = useMemo(() => {
      if (isLoadingProgress || authLoading) {
          console.log("Continue button: Memo - Still loading auth or progress.");
          return null; 
      }
      console.log("Continue button: Memo - Calculating next video...");
      const nextVideo = findNextVideo(userProgress);
      console.log("Continue button: Memo - Calculation result:", nextVideo);
      return nextVideo;
  }, [userProgress, isLoadingProgress, authLoading]);

   useEffect(() => {
     if (!isLoadingProgress && !authLoading && continueData) {
        console.log("Continue button: Visibility effect - Showing button.");
       const timer = setTimeout(() => setIsVisible(true), 100);
       return () => clearTimeout(timer);
     } else {
        console.log("Continue button: Visibility effect - Hiding button.");
       setIsVisible(false); 
     }
   }, [isLoadingProgress, authLoading, continueData]);


  if (!continueData) {
    console.log("Continue button: Render - No continue data, rendering null.");
    return null;
  }

  // continueData.playlistId is YouTube Playlist ID, continueData.video.id is YouTube Video ID
  const continueHref = `/videos?tab=${continueData.playlistCategory}&playlistId=${continueData.playlistId}&videoId=${continueData.video.id}&time=${Math.floor(continueData.startTime)}`;
  console.log("Continue button: Render - Rendering button with href:", continueHref);

  return (
    <Button
      asChild
      variant="default" 
      size="lg" 
      className={cn(
        'fixed bottom-4 right-4 z-50 h-12 shadow-lg',
        'pl-4 pr-5', 
        'transition-all duration-300 ease-out',
        'transform scale-95 opacity-0', 
        isVisible && 'scale-100 opacity-100', 
        'hover:scale-105 focus-visible:scale-105' 
      )}
      aria-label={`Continue learning: ${continueData.video.title}`}
    >
      <Link href={continueHref}> 
        <Play className="h-5 w-5 mr-2 fill-current" /> 
        Continue
      </Link>
    </Button>
  );
}
