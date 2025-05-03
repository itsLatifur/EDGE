
'use client';

import React, {useState, useEffect, useCallback} from 'react';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import LearningContent from '@/components/learning-content';
import {useToast} from '@/hooks/use-toast';
import { PlayCircle, Code, Palette, Zap, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { getUserProgress, updateUserProgress, awardPoints, awardBadge } from '@/services/user-progress';
import type { UserProgress, ContentItem, Playlist, PlaylistType } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Mock data structure improvement
const mockPlaylists: Record<PlaylistType, Playlist> = {
  html: {
    id: 'html',
    title: 'HTML Learning Path',
    description: 'Master the structure of web pages with HTML.',
    icon: Code,
    videos: [
       {id: 'html1', title: 'HTML Basics: Tags and Structure', url: 'https://www.youtube.com/embed/ok-plXXHl2w', duration: 1835, description: 'Learn the foundational tags and structure of HTML.'},
       {id: 'html2', title: 'Creating Interactive HTML Forms', url: 'https://www.youtube.com/embed/YwbIeMlxZAU', duration: 1210, description: 'Understand how to create interactive forms for user input.'},
       {id: 'html3', title: 'Semantic HTML for Accessibility & SEO', url: 'https://www.youtube.com/embed/bWPMSSsVdPk', duration: 945, description: 'Improve accessibility and SEO with semantic elements.'},
       {id: 'html4', title: 'HTML Tables for Data Display', url: 'https://www.youtube.com/embed/N692qBST32c', duration: 1100, description: 'Learn how to structure and display tabular data effectively.'},
       {id: 'html5', title: 'Embedding Media: Images & Video', url: 'https://www.youtube.com/embed/3_lAb8m9MpY', duration: 780, description: 'Understand how to embed images and videos into your web pages.'},
     ]
  },
  css: {
    id: 'css',
    title: 'CSS Learning Path',
    description: 'Style your web pages and create stunning layouts.',
    icon: Palette,
    videos: [
      {id: 'css1', title: 'CSS Fundamentals: Selectors & Properties', url: 'https://www.youtube.com/embed/1Rs2ND1ryYc', duration: 2450, description: 'Grasp the core concepts of CSS styling, selectors, and basic properties.'},
      {id: 'css2', title: 'Mastering Layout with Flexbox', url: 'https://www.youtube.com/embed/fYq5PXgSsbE', duration: 1560, description: 'A comprehensive guide to designing flexible layouts using Flexbox.'},
      {id: 'css3', title: 'Building Complex Layouts with CSS Grid', url: 'https://www.youtube.com/embed/jV8B24rSN5o', duration: 1880, description: 'Learn to build complex, two-dimensional layouts easily with CSS Grid.'},
      {id: 'css4', title: 'Responsive Design Principles', url: 'https://www.youtube.com/embed/srvUrASWNUc', duration: 1300, description: 'Make your websites look great on all devices using media queries.'},
      {id: 'css5', title: 'CSS Transitions and Animations', url: 'https://www.youtube.com/embed/zH5pgsAQUqs', duration: 1050, description: 'Add life to your web pages with smooth transitions and animations.'},
     ]
  },
  javascript: {
    id: 'javascript',
    title: 'JavaScript Learning Path',
    description: 'Add interactivity and logic to your websites.',
    icon: Zap,
    videos: [
      {id: 'js1', title: 'JavaScript Introduction: Variables & Data Types', url: 'https://www.youtube.com/embed/W6NZfCO5SIk', duration: 3660, description: 'Start coding with the basics of JavaScript, including variables and data types.'},
      {id: 'js2', title: 'DOM Manipulation: Interacting with HTML', url: 'https://www.youtube.com/embed/y17RuWkWdn8', duration: 2140, description: 'Learn how to select and modify HTML elements dynamically using JavaScript.'},
      {id: 'js3', title: 'Asynchronous JavaScript: Callbacks, Promises, Async/Await', url: 'https://www.youtube.com/embed/8aGhZQkoFbQ', duration: 2790, description: 'Understand how to handle asynchronous operations effectively in JavaScript.'},
      {id: 'js4', title: 'Working with Arrays and Objects', url: 'https://www.youtube.com/embed/R8rmfD9Y5-c', duration: 1950, description: 'Learn essential methods for manipulating arrays and objects in JS.'},
      {id: 'js5', title: 'Introduction to ES6+ Features', url: 'https://www.youtube.com/embed/NCwa_xi0ZQk', duration: 1600, description: 'Explore modern JavaScript features like arrow functions, destructuring, and more.'},
     ]
  },
};

// Helper function to find video details across all playlists
const findVideoDetails = (videoId: string): ContentItem | undefined => {
  for (const key in mockPlaylists) {
    const playlist = mockPlaylists[key as PlaylistType];
    const video = playlist.videos.find(v => v.id === videoId);
    if (video) return video;
  }
  return undefined;
}

// Define Points/Badges structure
const VIDEO_COMPLETION_POINTS = 10;
const PLAYLIST_COMPLETION_BADGES: Record<PlaylistType, string> = {
    html: 'html-master',
    css: 'css-stylist',
    javascript: 'javascript-ninja',
};


export default function Home() {
  const { user, userProfile, loading: authLoading, refreshUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [activeTab, setActiveTab] = useState<PlaylistType>('html');
  const { toast } = useToast();

  // Fetch user progress when user logs in or changes
  useEffect(() => {
    const fetchProgress = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const progress = await getUserProgress(user.uid);
          setUserProgress(progress || {}); // Use empty object if null
        } catch (error) {
          console.error("Failed to fetch user progress:", error);
          toast({
            title: "Progress Load Error",
            description: "Could not load your learning progress.",
            variant: "destructive",
          });
          setUserProgress({}); // Fallback to empty progress on error
        } finally {
          setIsLoading(false);
        }
      } else {
        // User logged out, reset progress and loading state
        setUserProgress(null);
        setIsLoading(false); // No data to load if not logged in
      }
    };

    // Don't fetch until auth state is resolved
    if (!authLoading) {
        fetchProgress();
    }

  }, [user, authLoading, toast]);

  // Initial welcome toast (only show if user is logged in and profile exists)
  useEffect(() => {
     if (user && userProfile && !isLoading && !authLoading) {
       toast({
         title: `Welcome Back, ${userProfile.displayName}!`,
         description: 'Ready to continue your learning journey?',
         duration: 5000,
       });
     }
   }, [user, userProfile, isLoading, authLoading, toast]);


  const handleProgressUpdate = useCallback(async (videoId: string, currentTime: number) => {
     if (!user || userProgress === null) return; // Don't update if not logged in or progress not loaded

     const videoDetails = findVideoDetails(videoId);
     if (!videoDetails) return; // Should not happen

     // Prevent updating time beyond known duration or if currentTime is invalid
     const cappedTime = (!isNaN(currentTime)) ? Math.min(currentTime, videoDetails.duration) : (userProgress[videoId]?.watchedTime || 0);
     const previousWatchedTime = userProgress[videoId]?.watchedTime || 0;
     const isAlreadyCompleted = userProgress[videoId]?.completed || false;

     // Only update if time has progressed significantly (e.g., > 1 second)
     if (cappedTime > previousWatchedTime) {
         const isNowCompleted = !isAlreadyCompleted && cappedTime >= videoDetails.duration * 0.95; // Mark completed at 95%

         // Optimistically update local state
         const updatedProgressEntry = {
             watchedTime: cappedTime,
             lastWatched: new Date(),
             completed: isAlreadyCompleted || isNowCompleted,
         };
         setUserProgress(prev => ({ ...prev!, [videoId]: updatedProgressEntry }));


         try {
             // Update Firestore
             await updateUserProgress(user.uid, videoId, cappedTime, updatedProgressEntry.completed);

             // Award points/badge if newly completed
             if (isNowCompleted) {
                 await awardPoints(user.uid, VIDEO_COMPLETION_POINTS);
                 toast({
                     title: "Video Completed!",
                     description: `+${VIDEO_COMPLETION_POINTS} points earned!`,
                 });

                 // Check for playlist completion
                 const playlistKey = Object.keys(mockPlaylists).find(key =>
                    mockPlaylists[key as PlaylistType].videos.some(v => v.id === videoId)
                 ) as PlaylistType | undefined;

                 if (playlistKey) {
                     const playlistVideos = mockPlaylists[playlistKey].videos;
                     const allCompleted = playlistVideos.every(v =>
                        // Check the updated local state or the potentially updated Firestore data
                         (userProgress[v.id]?.completed || (v.id === videoId && updatedProgressEntry.completed))
                     );

                     if (allCompleted) {
                         const badgeId = PLAYLIST_COMPLETION_BADGES[playlistKey];
                         if (badgeId && !userProfile?.badges.includes(badgeId)) {
                             await awardBadge(user.uid, badgeId);
                              toast({
                                  title: `Playlist Completed: ${mockPlaylists[playlistKey].title}`,
                                  description: `You've earned the "${badgeId.replace(/-/g, ' ')}" badge!`,
                              });
                              // Refresh user profile to show new badge/points immediately in header
                              await refreshUserProfile();
                         }
                     } else {
                         // Refresh profile anyway to show points update
                          await refreshUserProfile();
                     }
                 } else {
                    // Refresh profile anyway to show points update
                    await refreshUserProfile();
                 }
             }
         } catch (error) {
             console.error("Failed to update progress or award points/badge:", error);
             toast({
                 title: "Update Error",
                 description: "Could not save your progress or award points.",
                 variant: "destructive",
             });
             // Optionally rollback optimistic update here if needed
             setUserProgress(prev => ({ ...prev!, [videoId]: {
                 watchedTime: previousWatchedTime,
                 lastWatched: userProgress[videoId]?.lastWatched || new Date(), // Keep old date or use current
                 completed: isAlreadyCompleted,
             }}));
         }
     }
  }, [user, userProgress, userProfile?.badges, toast, refreshUserProfile]); // Add refreshUserProfile dependency


   // Display loading skeleton while auth or progress data is loading
  if (authLoading || isLoading) {
    return (
      <div className="space-y-8 mt-6 animate-pulse">
        {/* Intro Skeleton */}
        <div className="space-y-2 mb-8">
            <Skeleton className="h-8 w-1/2 rounded-md" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
        </div>
        {/* Tabs Skeleton */}
        <Skeleton className="h-10 w-full md:w-1/2 rounded-md mb-6" />
         {/* Content Area Skeleton */}
        <Card className="overflow-hidden">
          <CardHeader>
              <Skeleton className="h-6 w-1/3 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
          </CardHeader>
          <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                  {/* Video Player Skeleton */}
                  <div className="w-full md:flex-grow aspect-video bg-muted flex items-center justify-center">
                     <PlayCircle className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                  {/* Playlist Skeleton */}
                  <div className="w-full md:w-80 lg:w-96 p-4 space-y-3 border-t md:border-t-0 md:border-l">
                      <Skeleton className="h-16 w-full rounded" />
                      <Skeleton className="h-16 w-full rounded" />
                      <Skeleton className="h-16 w-full rounded" />
                      <Skeleton className="h-16 w-full rounded" />
                  </div>
              </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Display message if user is not logged in
  if (!user) {
     return (
         <div className="animate-fadeIn space-y-8 mt-16 text-center">
            <Card className="max-w-lg mx-auto shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Welcome to Self-Learn!</CardTitle>
                    <CardDescription>
                        Sign in or create an account to save your progress, earn points, and unlock badges as you master web development.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Zap className="h-16 w-16 text-primary mx-auto mb-4" />
                     <p className="text-muted-foreground mb-6">
                        Interactive tutorials in HTML, CSS, and JavaScript await you.
                     </p>
                     <Button asChild size="lg">
                         <Link href="/auth">Get Started - Sign In / Register</Link>
                     </Button>
                </CardContent>
            </Card>
         </div>
     );
  }

  // Main content for logged-in users
  return (
    <div className="animate-fadeIn space-y-8 mt-6">
       <div className="mb-8">
           <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Your Web Development Journey</h1>
           <p className="text-muted-foreground">
               Select a topic below (HTML, CSS, or JavaScript) to start learning or continue where you left off. Videos are curated to guide you step-by-step.
           </p>
       </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PlaylistType)} className="w-full">
         <TabsList className="grid w-full grid-cols-3 mb-6 shadow-sm bg-card border">
            {Object.values(mockPlaylists).map((playlist) => (
               <TabsTrigger
                  key={playlist.id}
                  value={playlist.id}
                  className="transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md first:rounded-l-md last:rounded-r-md rounded-none data-[state=inactive]:border-r data-[state=inactive]:last:border-r-0"
                  >
                  <playlist.icon className="h-4 w-4 mr-2" />
                  {playlist.id.toUpperCase()}
               </TabsTrigger>
            ))}
         </TabsList>


        {/* Tab Content */}
        {Object.values(mockPlaylists).map((playlist) => (
          <TabsContent key={playlist.id} value={playlist.id} className="mt-0 pt-0 animate-fadeIn">
            <LearningContent
              playlist={playlist}
              userProgress={userProgress || {}} // Pass empty object if null
              onProgressUpdate={handleProgressUpdate}
              currentTab={activeTab} // Pass active tab for potential optimizations in LearningContent
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

