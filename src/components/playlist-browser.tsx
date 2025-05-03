
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PlayCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPlaylistIcon, playlistVideos } from '@/lib/data/playlists'; // Import helper and video data
import type { PlaylistSummary, UserProgress, PlaylistType } from '@/types';

interface PlaylistBrowserProps {
  category: PlaylistType;
  playlists: PlaylistSummary[];
  userProgress: UserProgress;
  onSelectPlaylist: (playlistId: string) => void;
}

const PlaylistBrowser: React.FC<PlaylistBrowserProps> = ({
  category,
  playlists,
  userProgress,
  onSelectPlaylist,
}) => {
  const calculateProgress = (playlistId: string): { completed: number; total: number; percentage: number } => {
    const videos = playlistVideos[playlistId] || [];
    if (!videos || videos.length === 0) return { completed: 0, total: 0, percentage: 0 };

    let completedCount = 0;
    videos.forEach(video => {
      // Check completion status using the userProgress object
      // Handle both logged-in (object with `completed` property) and guest (boolean) progress formats if necessary
      const progressEntry = userProgress[video.id];
      if (progressEntry && progressEntry.completed) {
         completedCount++;
      }
    });
    const percentage = videos.length > 0 ? Math.round((completedCount / videos.length) * 100) : 0;
    return { completed: completedCount, total: videos.length, percentage };
  };

  const Icon = getPlaylistIcon(category);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {playlists.map((playlist) => {
        const { completed, total, percentage } = calculateProgress(playlist.id);
        const isCompleted = percentage === 100;

        return (
          <Card
            key={playlist.id}
            className={cn(
              "flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/30 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
              isCompleted && "bg-muted/30 border-green-500/30"
            )}
          >
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-base sm:text-lg font-semibold leading-tight flex items-center gap-2">
                   {Icon && <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />}
                   <span className="flex-grow">{playlist.title}</span>
                </CardTitle>
                 {isCompleted && (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" aria-label="Completed"/>
                 )}
              </div>
               {playlist.creator && (
                  <p className="text-xs text-muted-foreground pt-1">By {playlist.creator}</p>
               )}
            </CardHeader>
            <CardContent className="flex-grow flex flex-col pb-3 sm:pb-4">
              {playlist.description && (
                <CardDescription className="text-sm mb-3 flex-grow min-h-[40px]">
                  {playlist.description}
                </CardDescription>
              )}
               {/* Progress Bar */}
               <div className="mt-auto space-y-1.5">
                   <Progress
                     value={percentage}
                     className={cn("h-1.5", isCompleted && "bg-green-600/30")}
                     indicatorClassName={cn(isCompleted ? "bg-green-600" : "bg-primary")}
                     aria-label={`${playlist.title} progress: ${percentage}%`}
                   />
                   <p className="text-xs text-muted-foreground">
                     {completed} / {total} videos completed ({percentage}%)
                   </p>
                </div>
            </CardContent>
             <div className="p-4 pt-0">
                <Button
                  onClick={() => onSelectPlaylist(playlist.id)}
                  className="w-full"
                  variant={isCompleted ? "secondary" : "default"}
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  {isCompleted ? 'Review Playlist' : (percentage > 0 ? 'Continue Playlist' : 'Start Playlist')}
                </Button>
             </div>
          </Card>
        );
      })}
       {playlists.length === 0 && (
         <div className="col-span-full text-center py-12 text-muted-foreground">
            <p>No playlists found for {category.toUpperCase()} yet. Check back later!</p>
         </div>
       )}
    </div>
  );
};

export default PlaylistBrowser;
