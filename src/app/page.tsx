
'use client';

import React, {useState, useEffect} from 'react';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import LearningContent from '@/components/learning-content';
import {useToast} from '@/hooks/use-toast';
import { PlayCircle, Code, Palette, Zap } from 'lucide-react'; // Added relevant icons

// Mock data for playlists and user history
const mockPlaylists = {
  html: [
    {id: 'html1', title: 'HTML Basics', url: 'https://www.youtube.com/embed/ok-plXXHl2w', duration: 1800, description: 'Learn the foundational tags and structure of HTML.'}, // Example: W3Schools HTML Tutorial
    {id: 'html2', title: 'HTML Forms', url: 'https://www.youtube.com/embed/YwbIeMlxZAU', duration: 1200, description: 'Understand how to create interactive forms.'}, // Example: Traversy Media Forms Crash Course
    {id: 'html3', title: 'Semantic HTML', url: 'https://www.youtube.com/embed/bWPMSSsVdPk', duration: 900, description: 'Improve accessibility and SEO with semantic elements.'}, // Example: Kevin Powell Semantic HTML
  ],
  css: [
    {id: 'css1', title: 'CSS Fundamentals', url: 'https://www.youtube.com/embed/1Rs2ND1ryYc', duration: 2400, description: 'Grasp the core concepts of CSS styling.'}, // Example: freeCodeCamp CSS Course
    {id: 'css2', title: 'Flexbox Guide', url: 'https://www.youtube.com/embed/fYq5PXgSsbE', duration: 1500, description: 'Master layout design with Flexbox.'}, // Example: Wes Bos Flexbox Series (Conceptual)
    {id: 'css3', title: 'CSS Grid Layout', url: 'https://www.youtube.com/embed/jV8B24rSN5o', duration: 1800, description: 'Build complex layouts easily with CSS Grid.'}, // Example: Traversy Media Grid Crash Course
  ],
  javascript: [
    {id: 'js1', title: 'JavaScript Introduction', url: 'https://www.youtube.com/embed/W6NZfCO5SIk', duration: 3600, description: 'Start coding with the basics of JavaScript.'}, // Example: Mosh Hamedani JS Basics
    {id: 'js2', title: 'DOM Manipulation', url: 'https://www.youtube.com/embed/y17RuWkWdn8', duration: 2100, description: 'Learn how to interact with HTML elements using JS.'}, // Example: Dev Ed DOM Manipulation
    {id: 'js3', title: 'Asynchronous JavaScript', url: 'https://www.youtube.com/embed/8aGhZQkoFbQ', duration: 2700, description: 'Understand callbacks, promises, and async/await.'}, // Example: Net Ninja Async JS
  ],
};


const mockUserHistory = {
  html2: {watchedTime: 90, lastWatched: new Date(Date.now() - 86400000)}, // Watched 90s yesterday
  js1: {watchedTime: 250, lastWatched: new Date(Date.now() - 3600000)}, // Watched 250s an hour ago
};

// Helper function to find video details across all playlists
const findVideoDetails = (videoId: string) => {
  const allVideos = [...mockPlaylists.html, ...mockPlaylists.css, ...mockPlaylists.javascript];
  return allVideos.find(video => video.id === videoId);
}


export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const {toast} = useToast();
  const [userHistory, setUserHistory] = useState<Record<string, {watchedTime: number; lastWatched: Date}>>({});
  // Removed continueWatching state as it's handled within LearningContent

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Load user history (from localStorage or API in a real app)
      try {
        const storedHistory = localStorage.getItem('userLearningHistory');
        const parsedHistory = storedHistory ? JSON.parse(storedHistory, (key, value) => {
          if (key === 'lastWatched' && value) {
            return new Date(value);
          }
          return value;
        }) : mockUserHistory;
        setUserHistory(parsedHistory);
      } catch (error) {
        console.error("Failed to parse user history from localStorage", error);
        setUserHistory(mockUserHistory); // Fallback to mock data on error
      }

      toast({
        title: 'Welcome Back!',
        description: 'Ready to continue your learning journey?',
      });
    }, 1000); // Reduced loading time

    return () => clearTimeout(timer);
  }, [toast]);


  // Removed useEffect for setting continueWatching

  const handleProgressUpdate = (videoId: string, currentTime: number) => {
     setUserHistory(prevHistory => {
        const videoDetails = findVideoDetails(videoId);
        // Prevent updating time beyond known duration if available
        const cappedTime = videoDetails ? Math.min(currentTime, videoDetails.duration) : currentTime;

        const newHistory = {
         ...prevHistory,
          [videoId]: { watchedTime: cappedTime, lastWatched: new Date() }
        };
         // Save updated history to localStorage
         try {
            localStorage.setItem('userLearningHistory', JSON.stringify(newHistory));
         } catch (error) {
            console.error("Failed to save user history to localStorage", error);
             toast({
                title: "Storage Error",
                description: "Could not save your progress.",
                variant: "destructive",
            });
         }
         return newHistory;
     });
  };

  if (isLoading) {
    return (
      <div className="space-y-8 mt-8">
        {/* Skeleton for Tabs */}
        <Skeleton className="h-10 w-1/3 rounded-md mb-6" />
        {/* Skeleton for Video Player Area */}
        <Skeleton className="aspect-video w-full mb-4" />
        {/* Skeleton for Playlist Items */}
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-8 mt-8">
      {/* Explanation for potential two video sections removed */}
      {/* The "Continue Watching" card concept is integrated into the playlist now. */}
      {/* The currently selected video (or the next suggested one) appears above the playlist. */}

      <Tabs defaultValue="html" className="w-full">
        {/* TabsList remains standard */}
        <TabsList className="grid w-full grid-cols-3 mb-6 shadow-sm bg-muted">
          <TabsTrigger value="html" className="transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
            <Code className="h-4 w-4 mr-2" />
            HTML
          </TabsTrigger>
          <TabsTrigger value="css" className="transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
            <Palette className="h-4 w-4 mr-2" />
            CSS
          </TabsTrigger>
          <TabsTrigger value="javascript" className="transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
             <Zap className="h-4 w-4 mr-2" />
            JavaScript
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value="html" className="mt-0 pt-0 animate-fadeIn">
          <LearningContent
            title="HTML Learning Path"
            type="playlist"
            playlist={mockPlaylists.html}
            userHistory={userHistory}
            onProgressUpdate={handleProgressUpdate}
            currentTab="html"
          />
        </TabsContent>
        <TabsContent value="css" className="mt-0 pt-0 animate-fadeIn">
           <LearningContent
            title="CSS Learning Path"
            type="playlist"
            playlist={mockPlaylists.css}
            userHistory={userHistory}
            onProgressUpdate={handleProgressUpdate}
            currentTab="css"
           />
        </TabsContent>
        <TabsContent value="javascript" className="mt-0 pt-0 animate-fadeIn">
          <LearningContent
            title="JavaScript Learning Path"
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

// Ensure fade-in animation style is present (consider moving to globals.css if not already there)
if (typeof window !== 'undefined') {
  const styleId = 'fade-in-animation-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
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
  }
}
