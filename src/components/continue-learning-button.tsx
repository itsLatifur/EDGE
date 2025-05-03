'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { mockPlaylists } from '@/lib/data/playlists'; // Import playlist data
import type { ContentItem, UserProgressEntry } from '@/types';
import { loadGuestProgress } from '@/services/user-progress'; // Need guest progress for initial check

// Helper function to find the next video to watch
const findNextVideo = (progress: { [videoId: string]: UserProgressEntry } | null): ContentItem | null => {
  if (!progress) return null;

  const allPlaylistVideos = Object.values(mockPlaylists).flatMap(p => p.videos);
  const playlistVideoIds = new Set(allPlaylistVideos.map(v => v.id));

  // Filter progress entries relevant to any known playlist video
  const relevantHistory = Object.entries(progress)
    .filter(([videoId, data]) => playlistVideoIds.has(videoId) && data?.lastWatched instanceof Date && data.watchedTime >= 0) // Allow 0 watched time
    .map(([videoId, data]) => ({ videoId, ...data }))
    .sort((a, b) => b.lastWatched.getTime() - a.lastWatched.getTime()); // Sort by most recent activity

  // Find the most recently watched video that is NOT completed
  const lastIncomplete = relevantHistory.find(entry => !entry.completed);

  if (lastIncomplete) {
    // Find the details of this video
    return allPlaylistVideos.find(v => v.id === lastIncomplete.videoId) || null;
  }

  // If all watched videos are completed, or no history, find the very first video overall that isn't completed
  for (const playlist of Object.values(mockPlaylists)) {
      for (const video of playlist.videos) {
          if (!progress[video.id]?.completed) {
              return video; // Return the first uncompleted video found
          }
      }
  }


  return null; // No video found to continue
};


export default function ContinueLearningButton() {
  const { user, userProfile, isGuest, loading: authLoading } = useAuth();
  const [userProgress, setUserProgress] = useState<{[videoId: string]: UserProgressEntry} | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);

  // Fetch progress based on auth state
  useEffect(() => {
      const fetchProgress = async () => {
          setIsLoadingProgress(true);
          let progressData = null;
          if (!isGuest && user) {
              // Fetch user progress (simplified, assuming getUserProgress exists and returns the right format)
              const { getUserProgress } = await import('@/services/user-progress');
              progressData = await getUserProgress(user.uid);
          } else if (isGuest) {
              // Load guest progress
              progressData = loadGuestProgress();
          }
          setUserProgress(progressData);
          setIsLoadingProgress(false);
      };

      if (!authLoading) { // Only fetch after knowing auth state
          fetchProgress();
      }
  }, [isGuest, user, authLoading]);

  const videoToContinue = useMemo(() => {
      if (isLoadingProgress || authLoading) return null; // Don't calculate while loading
      return findNextVideo(userProgress);
  }, [userProgress, isLoadingProgress, authLoading]);


  if (!videoToContinue || isLoadingProgress || authLoading) {
    // Don't show if no video to continue or still loading
    return null;
  }

  // Find the playlist this video belongs to for context (optional, but good for tooltip)
  const playlist = Object.values(mockPlaylists).find(p => p.videos.some(v => v.id === videoToContinue.id));

  return (
    <Button
      asChild
      variant="default" // Use primary color
      size="lg" // Make it larger
      className={cn(
        'fixed bottom-4 left-4 z-50 h-12 shadow-lg transition-opacity duration-300',
        'pl-4 pr-5' // Adjust padding for icon and text
      )}
      aria-label={`Continue learning: ${videoToContinue.title}`}
    >
      <Link href="/"> {/* Link to the main learning page */}
        <Play className="h-5 w-5 mr-2 fill-current" /> {/* Filled play icon */}
        Continue: {playlist?.id.toUpperCase()} - {(videoToContinue.title.length > 25) ? videoToContinue.title.substring(0, 25) + '...' : videoToContinue.title}
      </Link>
    </Button>
  );
}
