
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { playlistCategories, playlistVideos, findVideoDetails } from '@/lib/data/playlists'; // Import playlist data helpers
import type { ContentItem, UserProgressEntry, PlaylistType } from '@/types';
import { loadGuestProgress, getUserProgress } from '@/services/user-progress';

// Updated return type
interface ContinueData {
  video: ContentItem;
  playlistId: string; // Use generic string for playlist ID
  playlistCategory: PlaylistType; // Store category for the URL
  startTime: number;
}

// Helper function to find the next video to watch
const findNextVideo = (progress: { [videoId: string]: UserProgressEntry } | null): ContinueData | null => {
  if (!progress) {
     console.log("findNextVideo: No progress data provided.");
     return null;
  }
  console.log("findNextVideo: Searching with progress data:", progress);

  const allVideosMap = new Map<string, { video: ContentItem; playlistId: string; playlistCategory: PlaylistType }>();
  Object.entries(playlistCategories).forEach(([category, playlists]) => {
      playlists.forEach(summary => {
          const videos = playlistVideos[summary.id] || [];
          videos.forEach(video => {
              allVideosMap.set(video.id, { video, playlistId: summary.id, playlistCategory: category as PlaylistType });
          });
      });
  });

  // Filter progress entries relevant to any known video and sort by most recent activity
  const relevantHistory = Object.entries(progress)
    .filter(([videoId, data]) =>
        allVideosMap.has(videoId) &&
        data?.lastWatched instanceof Date && // Ensure it's a Date object
        !isNaN(data.lastWatched.getTime()) && // Ensure it's a valid Date
        data.watchedTime >= 0
    )
    .map(([videoId, data]) => {
      const details = allVideosMap.get(videoId)!; // Should exist due to filter
      return {
          videoId,
          watchedTime: data.watchedTime,
          lastWatched: data.lastWatched,
          completed: data.completed,
          playlistId: details.playlistId,
          playlistCategory: details.playlistCategory,
      };
    })
    .sort((a, b) => b.lastWatched.getTime() - a.lastWatched.getTime()); // Most recent first

   console.log("findNextVideo: Relevant history sorted:", relevantHistory);

  // Find the most recently watched video that is NOT completed
  const lastIncomplete = relevantHistory.find(entry => !entry.completed);

  if (lastIncomplete) {
    const details = allVideosMap.get(lastIncomplete.videoId);
    if (details) {
       console.log(`findNextVideo: Found last incomplete video: ${details.video.title} in playlist ${details.playlistId} at ${lastIncomplete.watchedTime}s`);
       return {
         video: details.video,
         playlistId: details.playlistId,
         playlistCategory: details.playlistCategory,
         startTime: lastIncomplete.watchedTime,
       };
    }
  } else {
     console.log("findNextVideo: No incomplete videos found in history.");
  }

  // If all watched videos are completed, or no history, find the very first video overall (across all playlists) that isn't completed
   console.log("findNextVideo: Searching for the first overall uncompleted video.");
   for (const category in playlistCategories) {
       const cat = category as PlaylistType;
       for (const summary of playlistCategories[cat]) {
           const videos = playlistVideos[summary.id] || [];
           for (const video of videos) {
               if (!progress[video.id]?.completed) {
                   console.log(`findNextVideo: Found first overall uncompleted video: ${video.title} in playlist ${summary.id}`);
                   return {
                       video: video,
                       playlistId: summary.id,
                       playlistCategory: cat,
                       startTime: progress[video.id]?.watchedTime || 0, // Start from beginning or saved time
                   };
               }
           }
       }
   }

  console.log("findNextVideo: No video found to continue.");
  return null; // No video found to continue
};


export default function ContinueLearningButton() {
  const { user, isGuest, loading: authLoading } = useAuth();
  const [userProgress, setUserProgress] = useState<{[videoId: string]: UserProgressEntry} | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [isVisible, setIsVisible] = useState(false); // State to manage visibility for animation

  // Fetch progress based on auth state
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
             setUserProgress(null); // Set to null on error
          } finally {
             setIsLoadingProgress(false);
             console.log("Continue button: Finished loading progress.");
          }
      };

      if (!authLoading) { // Only fetch after knowing auth state
           console.log("Continue button: Auth state resolved, fetching progress...");
          fetchProgress();
      } else {
          console.log("Continue button: Waiting for auth state...");
          // Clear progress if auth state changes to loading
          setUserProgress(null);
          setIsLoadingProgress(true);
          setIsVisible(false); // Hide button while waiting for auth
      }
      // Rerun when auth status changes
  }, [isGuest, user, authLoading]);

  const continueData = useMemo(() => {
      if (isLoadingProgress || authLoading) {
          console.log("Continue button: Memo - Still loading auth or progress.");
          return null; // Don't calculate while loading
      }
      console.log("Continue button: Memo - Calculating next video...");
      const nextVideo = findNextVideo(userProgress);
      console.log("Continue button: Memo - Calculation result:", nextVideo);
      return nextVideo;
  }, [userProgress, isLoadingProgress, authLoading]);

   // Effect to control visibility for animation
   useEffect(() => {
     // Show button only after loading is complete and there's data
     if (!isLoadingProgress && !authLoading && continueData) {
        console.log("Continue button: Visibility effect - Showing button.");
       // Use a timeout to allow initial render before animation
       const timer = setTimeout(() => setIsVisible(true), 100);
       return () => clearTimeout(timer);
     } else {
        console.log("Continue button: Visibility effect - Hiding button.");
       setIsVisible(false); // Hide if loading or no data
     }
   }, [isLoadingProgress, authLoading, continueData]);


  if (!continueData) {
    // Don't render the button at all if no data (handles initial state and no progress cases)
    console.log("Continue button: Render - No continue data, rendering null.");
    return null;
  }

  // Construct the correct href
  const continueHref = `/videos?tab=${continueData.playlistCategory}&playlistId=${continueData.playlistId}&videoId=${continueData.video.id}&time=${Math.floor(continueData.startTime)}`;
  console.log("Continue button: Render - Rendering button with href:", continueHref);

  return (
    <Button
      asChild
      variant="default" // Use primary color
      size="lg" // Make it larger
      className={cn(
        'fixed bottom-4 right-4 z-50 h-12 shadow-lg',
        'pl-4 pr-5', // Adjust padding for icon and text
        // Animation classes
        'transition-all duration-300 ease-out',
        'transform scale-95 opacity-0', // Initial state for animation
        isVisible && 'scale-100 opacity-100', // Visible state
        'hover:scale-105 focus-visible:scale-105' // Hover/Focus scale animation
      )}
      aria-label={`Continue learning: ${continueData.video.title}`}
    >
      <Link href={continueHref}> {/* Link to the videos page with params */}
        <Play className="h-5 w-5 mr-2 fill-current" /> {/* Filled play icon */}
        Continue
      </Link>
    </Button>
  );
}
