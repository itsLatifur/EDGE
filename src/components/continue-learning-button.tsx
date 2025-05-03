'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { mockPlaylists } from '@/lib/data/playlists'; // Import playlist data
import type { ContentItem, UserProgressEntry, PlaylistType } from '@/types';
import { loadGuestProgress } from '@/services/user-progress'; // Need guest progress for initial check
import { getUserProgress } from '@/services/user-progress'; // Import getUserProgress

// Updated return type
interface ContinueData {
  video: ContentItem;
  playlistId: PlaylistType;
  startTime: number;
}

// Helper function to find the next video to watch
const findNextVideo = (progress: { [videoId: string]: UserProgressEntry } | null): ContinueData | null => {
  if (!progress) return null;

  const allPlaylistVideosMap = new Map<string, { video: ContentItem; playlistId: PlaylistType }>();
  Object.entries(mockPlaylists).forEach(([playlistId, playlist]) => {
      playlist.videos.forEach(video => {
          allPlaylistVideosMap.set(video.id, { video, playlistId: playlistId as PlaylistType });
      });
  });

  // Filter progress entries relevant to any known playlist video
  const relevantHistory = Object.entries(progress)
    .filter(([videoId, data]) => allPlaylistVideosMap.has(videoId) && data?.lastWatched instanceof Date && data.watchedTime >= 0)
    .map(([videoId, data]) => ({
      videoId,
      ...data,
      playlistId: allPlaylistVideosMap.get(videoId)?.playlistId, // Add playlistId
    }))
    // Filter out entries where playlistId couldn't be determined (shouldn't happen with current setup)
    .filter(entry => entry.playlistId)
    .sort((a, b) => b.lastWatched.getTime() - a.lastWatched.getTime()); // Sort by most recent activity


  // Find the most recently watched video that is NOT completed
  const lastIncomplete = relevantHistory.find(entry => !entry.completed);

  if (lastIncomplete) {
    const details = allPlaylistVideosMap.get(lastIncomplete.videoId);
    if (details && details.playlistId) { // Ensure details and playlistId are found
       return {
         video: details.video,
         playlistId: details.playlistId,
         startTime: lastIncomplete.watchedTime,
       };
    }
  }

  // If all watched videos are completed, or no history, find the very first video overall that isn't completed
  for (const playlistId in mockPlaylists) {
      const playlist = mockPlaylists[playlistId as PlaylistType];
      for (const video of playlist.videos) {
          if (!progress[video.id]?.completed) {
              return {
                  video: video,
                  playlistId: playlistId as PlaylistType,
                  startTime: progress[video.id]?.watchedTime || 0, // Start from beginning or saved time
              }; // Return the first uncompleted video found
          }
      }
  }

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
                 console.log("Continue button: Fetching user progress");
                 progressData = await getUserProgress(user.uid);
              } else if (isGuest) {
                 console.log("Continue button: Loading guest progress");
                 progressData = loadGuestProgress();
              }
              setUserProgress(progressData);
          } catch (error) {
             console.error("Continue button: Error fetching progress", error);
             setUserProgress(null); // Set to null on error
          } finally {
             setIsLoadingProgress(false);
          }
      };

      if (!authLoading) { // Only fetch after knowing auth state
          fetchProgress();
      }
      // Clear progress if auth state changes to loading or no user/guest
      else {
          setUserProgress(null);
          setIsLoadingProgress(true);
      }
      // Rerun when auth status changes
  }, [isGuest, user, authLoading]);

  const continueData = useMemo(() => {
      if (isLoadingProgress || authLoading) return null; // Don't calculate while loading
      return findNextVideo(userProgress);
  }, [userProgress, isLoadingProgress, authLoading]);

   // Effect to control visibility for animation
   useEffect(() => {
     // Show button only after loading is complete and there's data
     if (!isLoadingProgress && !authLoading && continueData) {
       // Use a timeout to allow initial render before animation
       const timer = setTimeout(() => setIsVisible(true), 100);
       return () => clearTimeout(timer);
     } else {
       setIsVisible(false); // Hide if loading or no data
     }
   }, [isLoadingProgress, authLoading, continueData]);


  if (!continueData) {
    // Don't render the button at all if no data (handles initial state and no progress cases)
    return null;
  }

  // Update href to point to the /videos page
  const continueHref = `/videos?tab=${continueData.playlistId}&videoId=${continueData.video.id}&time=${Math.floor(continueData.startTime)}`;

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
