'use client';

import React, {useState, useEffect} from 'react';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import LearningContent from '@/components/learning-content';
import {useToast} from '@/hooks/use-toast';

// Mock data for playlists and user history
const mockPlaylists = {
  html: [
    {id: 'html1', title: 'HTML Basics', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 212},
    {id: 'html2', title: 'HTML Forms', url: 'https://www.youtube.com/embed/rokGy0huYEA', duration: 180},
    {id: 'html3', title: 'Semantic HTML', url: 'https://www.youtube.com/embed/bWPMSSsVdPk', duration: 245},
  ],
  css: [
    {id: 'css1', title: 'CSS Fundamentals', url: 'https://www.youtube.com/embed/OEV8gHsW_M', duration: 300},
    {id: 'css2', title: 'Flexbox Guide', url: 'https://www.youtube.com/embed/fYq5PXgSsbE', duration: 450},
    {id: 'css3', title: 'CSS Grid Layout', url: 'https://www.youtube.com/embed/jV8B24rSN5o', duration: 600},
  ],
  javascript: [
    {id: 'js1', title: 'JavaScript Introduction', url: 'https://www.youtube.com/embed/W6NZfCO5SIk', duration: 500},
    {id: 'js2', title: 'DOM Manipulation', url: 'https://www.youtube.com/embed/y17RuWkWdn8', duration: 700},
    {id: 'js3', title: 'Asynchronous JavaScript', url: 'https://www.youtube.com/embed/8aGhZQkoFbQ', duration: 900},
  ],
};

const mockUserHistory = {
  html2: {watchedTime: 90, lastWatched: new Date(Date.now() - 86400000)}, // Watched 90s yesterday
  js1: {watchedTime: 250, lastWatched: new Date(Date.now() - 3600000)}, // Watched 250s an hour ago
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const {toast} = useToast();
  const [userHistory, setUserHistory] = useState<Record<string, {watchedTime: number; lastWatched: Date}>>({});
  const [continueWatching, setContinueWatching] = useState<{id: string; title: string; url: string; startTime: number} | null>(null);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Load user history (from localStorage or API in a real app)
      const storedHistory = localStorage.getItem('userLearningHistory');
      const parsedHistory = storedHistory ? JSON.parse(storedHistory, (key, value) => {
        if (key === 'lastWatched') {
          return new Date(value);
        }
        return value;
      }) : mockUserHistory;
      setUserHistory(parsedHistory);

      toast({
        title: 'Welcome!',
        description: 'Start your learning journey.',
      });
    }, 1500); // Simulate 1.5 seconds loading

    return () => clearTimeout(timer);
  }, [toast]);


  useEffect(() => {
    // Determine "Continue Watching" item based on the most recently watched video
    if (Object.keys(userHistory).length > 0) {
      const sortedHistory = Object.entries(userHistory).sort(
        ([, a], [, b]) => b.lastWatched.getTime() - a.lastWatched.getTime()
      );
      const [latestVideoId, latestData] = sortedHistory[0];

      const allVideos = [...mockPlaylists.html, ...mockPlaylists.css, ...mockPlaylists.javascript];
      const videoDetails = allVideos.find(video => video.id === latestVideoId);

      if (videoDetails && latestData.watchedTime < videoDetails.duration) { // Only suggest if not fully watched
        setContinueWatching({
          id: latestVideoId,
          title: videoDetails.title,
          url: `${videoDetails.url}?start=${Math.floor(latestData.watchedTime)}`, // Add start time parameter
          startTime: latestData.watchedTime,
        });
      } else {
         setContinueWatching(null); // Reset if fully watched or no history
      }
    } else {
        setContinueWatching(null); // Reset if no history
    }
  }, [userHistory]);

  const handleProgressUpdate = (videoId: string, currentTime: number) => {
     setUserHistory(prevHistory => {
        const newHistory = {
         ...prevHistory,
          [videoId]: { watchedTime: currentTime, lastWatched: new Date() }
        };
         // Save updated history to localStorage
         localStorage.setItem('userLearningHistory', JSON.stringify(newHistory));
         return newHistory;
     });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
        {continueWatching && (
          <Card className="mb-6 bg-secondary border-accent shadow-md transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play-circle"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                Continue Watching: {continueWatching.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
               <LearningContent
                  title={continueWatching.title}
                  type="video"
                  url={continueWatching.url}
                  videoId={continueWatching.id}
                  initialStartTime={continueWatching.startTime}
                  onProgressUpdate={handleProgressUpdate}
                  playlist={[]} // Not part of a specific tab playlist here
                  userHistory={userHistory}
                  isContinueWatching={true}
                />
            </CardContent>
          </Card>
        )}


      <Tabs defaultValue="html" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mb-6 shadow-sm">
          <TabsTrigger value="html" className="transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            HTML
          </TabsTrigger>
          <TabsTrigger value="css" className="transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="12" cy="12" r="10"/><path d="M14.31 8l5.74 9.94"/><path d="M9.69 8h11.48"/><path d="M7.38 12l5.74-9.94"/><path d="M9.69 16L3.95 6.06"/><path d="M14.31 16H2.83"/><path d="M16.62 12l-5.74 9.94"/></svg>
            CSS
          </TabsTrigger>
          <TabsTrigger value="javascript" className="transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M10.061 19.061 3.757 12.757a1.5 1.5 0 0 1 0-2.121l6.304-6.304"/><path d="M13.939 4.939 20.243 11.243a1.5 1.5 0 0 1 0 2.121l-6.304 6.304"/><line x1="10" x2="14" y1="4" y2="20"/></svg>
            JavaScript
          </TabsTrigger>
        </TabsList>
        <TabsContent value="html" className="mt-0 pt-6 animate-fadeIn">
          <LearningContent
            title="HTML Path"
            type="playlist"
            playlist={mockPlaylists.html}
            userHistory={userHistory}
            onProgressUpdate={handleProgressUpdate}
            currentTab="html"
          />
        </TabsContent>
        <TabsContent value="css" className="mt-0 pt-6 animate-fadeIn">
           <LearningContent
            title="CSS Path"
            type="playlist"
            playlist={mockPlaylists.css}
            userHistory={userHistory}
            onProgressUpdate={handleProgressUpdate}
            currentTab="css"
           />
        </TabsContent>
        <TabsContent value="javascript" className="mt-0 pt-6 animate-fadeIn">
          <LearningContent
            title="JavaScript Path"
            type="playlist"
            playlist={mockPlaylists.javascript}
            userHistory={userHistory}
            onProgressUpdate={handleProgressUpdate}
            currentTab="javascript"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Add simple fade-in animation
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out forwards;
  }
`;
document.head.appendChild(style);
