
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PlayCircle, CheckCircle, ListVideo } from 'lucide-react'; // Added ListVideo
import { cn } from '@/lib/utils';
import { getPlaylistIcon, playlistVideos } from '@/lib/data/playlists'; // Import helper and video data
import type { PlaylistSummary, UserProgress, PlaylistType } from '@/types';

interface PlaylistBrowserProps {
  category: PlaylistType;
  playlists: PlaylistSummary[];
  userProgress: UserProgress;
  onSelectPlaylist: (playlistId: string) => void; // playlistId is YouTube Playlist ID
}

const PlaylistBrowser: React.FC<PlaylistBrowserProps> = ({
  category,
  playlists,
  userProgress,
  onSelectPlaylist,
}) => {
  const calculateProgress = (playlistId: string): { completed: number; total: number; percentage: number } => {
    // playlistId is YouTube Playlist ID
    const videos = playlistVideos[playlistId] || [];
    if (!videos || videos.length === 0) return { completed: 0, total: 0, percentage: 0 };

    let completedCount = 0;
    videos.forEach(video => {
      const progressEntry = userProgress[video.id]; // video.id is YouTube Video ID
      if (progressEntry && progressEntry.completed) {
         completedCount++;
      }
    });
    const percentage = videos.length > 0 ? Math.round((completedCount / videos.length) * 100) : 0;
    return { completed: completedCount, total: videos.length, percentage };
  };

  const PlaylistCategoryIcon = getPlaylistIcon(category);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {playlists.map((playlist) => {
        // playlist.id is YouTube Playlist ID
        const { completed, total, percentage } = calculateProgress(playlist.id);
        const isCompleted = percentage === 100;

        return (
          <Card
            key={playlist.id}
            className={cn(
              "flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out",
              "hover:shadow-xl hover:border-primary/50 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
              "border-2", // Slightly thicker border
              isCompleted ? "border-green-500/60 bg-green-500/5 dark:bg-green-500/10" : "border-border",
              "group"
            )}
          >
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex justify-between items-start gap-2 mb-1">
                <CardTitle className="text-base sm:text-lg font-semibold leading-tight flex items-center gap-2.5 group-hover:text-primary transition-colors">
                   {PlaylistCategoryIcon && <PlaylistCategoryIcon className="h-5 w-5 text-primary flex-shrink-0" />}
                   <span className="flex-grow">{playlist.title}</span>
                </CardTitle>
                 {isCompleted && (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" aria-label="Completed"/>
                 )}
              </div>
               {playlist.creator && (
                  <p className="text-xs text-muted-foreground">By {playlist.creator}</p>
               )}
               <div className="flex items-center text-xs text-muted-foreground mt-1.5">
                  <ListVideo className="h-3.5 w-3.5 mr-1.5"/>
                  <span>{total} video{total === 1 ? '' : 's'}</span>
               </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col pb-3 sm:pb-4">
              {playlist.description && (
                <CardDescription className="text-sm mb-4 flex-grow min-h-[40px] line-clamp-3">
                  {playlist.description}
                </CardDescription>
              )}
               {/* Progress Bar */}
               <div className="mt-auto space-y-1.5 pt-2">
                   <Progress
                     value={percentage}
                     className={cn("h-2", isCompleted && "bg-green-600/30")}
                     indicatorClassName={cn("rounded-full",isCompleted ? "bg-green-600" : "bg-primary")}
                     aria-label={`${playlist.title} progress: ${percentage}%`}
                   />
                   <p className="text-xs text-muted-foreground">
                     {completed} / {total} videos completed ({percentage}%)
                   </p>
                </div>
            </CardContent>
             <div className="p-4 pt-2">
                <Button
                  onClick={() => onSelectPlaylist(playlist.id)} // playlist.id is YouTube Playlist ID
                  className="w-full transition-transform duration-200 hover:scale-105 focus-visible:scale-105"
                  variant={isCompleted ? "outline" : "default"}
                  size="sm"
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
            <PlaylistCategoryIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium">No playlists found for {category.toUpperCase()} yet.</p>
            <p className="text-sm">Please check back later or try another category.</p>
         </div>
       )}
    </div>
  );
};

export default PlaylistBrowser;
