
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
    {id: 'html1', title: 'HTML Basics: Tags and Structure', url: 'https://www.youtube.com/embed/ok-plXXHl2w', duration: 1835, description: 'Learn the foundational tags and structure of HTML.'}, // Example: W3Schools HTML Tutorial ~30 min
    {id: 'html2', title: 'Creating Interactive HTML Forms', url: 'https://www.youtube.com/embed/YwbIeMlxZAU', duration: 1210, description: 'Understand how to create interactive forms for user input.'}, // Example: Traversy Media Forms Crash Course ~20 min
    {id: 'html3', title: 'Semantic HTML for Accessibility & SEO', url: 'https://www.youtube.com/embed/bWPMSSsVdPk', duration: 945, description: 'Improve accessibility and SEO with semantic elements.'}, // Example: Kevin Powell Semantic HTML ~15 min
    {id: 'html4', title: 'HTML Tables for Data Display', url: 'https://www.youtube.com/embed/N692qBST32c', duration: 1100, description: 'Learn how to structure and display tabular data effectively.'}, // Example ~18 min
    {id: 'html5', title: 'Embedding Media: Images & Video', url: 'https://www.youtube.com/embed/3_lAb8m9MpY', duration: 780, description: 'Understand how to embed images and videos into your web pages.'}, // Example ~13 min
  ],
  css: [
    {id: 'css1', title: 'CSS Fundamentals: Selectors & Properties', url: 'https://www.youtube.com/embed/1Rs2ND1ryYc', duration: 2450, description: 'Grasp the core concepts of CSS styling, selectors, and basic properties.'}, // Example: freeCodeCamp CSS Course ~40 min
    {id: 'css2', title: 'Mastering Layout with Flexbox', url: 'https://www.youtube.com/embed/fYq5PXgSsbE', duration: 1560, description: 'A comprehensive guide to designing flexible layouts using Flexbox.'}, // Example: Wes Bos Flexbox Series (Conceptual) ~26 min
    {id: 'css3', title: 'Building Complex Layouts with CSS Grid', url: 'https://www.youtube.com/embed/jV8B24rSN5o', duration: 1880, description: 'Learn to build complex, two-dimensional layouts easily with CSS Grid.'}, // Example: Traversy Media Grid Crash Course ~31 min
    {id: 'css4', title: 'Responsive Design Principles', url: 'https://www.youtube.com/embed/srvUrASWNUc', duration: 1300, description: 'Make your websites look great on all devices using media queries.'}, // Example ~21 min
    {id: 'css5', title: 'CSS Transitions and Animations', url: 'https://www.youtube.com/embed/zH5pgsAQUqs', duration: 1050, description: 'Add life to your web pages with smooth transitions and animations.'}, // Example ~17 min
  ],
  javascript: [
    {id: 'js1', title: 'JavaScript Introduction: Variables & Data Types', url: 'https://www.youtube.com/embed/W6NZfCO5SIk', duration: 3660, description: 'Start coding with the basics of JavaScript, including variables and data types.'}, // Example: Mosh Hamedani JS Basics ~61 min
    {id: 'js2', title: 'DOM Manipulation: Interacting with HTML', url: 'https://www.youtube.com/embed/y17RuWkWdn8', duration: 2140, description: 'Learn how to select and modify HTML elements dynamically using JavaScript.'}, // Example: Dev Ed DOM Manipulation ~35 min
    {id: 'js3', title: 'Asynchronous JavaScript: Callbacks, Promises, Async/Await', url: 'https://www.youtube.com/embed/8aGhZQkoFbQ', duration: 2790, description: 'Understand how to handle asynchronous operations effectively in JavaScript.'}, // Example: Net Ninja Async JS ~46 min
    {id: 'js4', title: 'Working with Arrays and Objects', url: 'https://www.youtube.com/embed/R8rmfD9Y5-c', duration: 1950, description: 'Learn essential methods for manipulating arrays and objects in JS.'}, // Example ~32 min
    {id: 'js5', title: 'Introduction to ES6+ Features', url: 'https://www.youtube.com/embed/NCwa_xi0ZQk', duration: 1600, description: 'Explore modern JavaScript features like arrow functions, destructuring, and more.'}, // Example ~26 min
  ],
};


const mockUserHistory = {
  html2: {watchedTime: 90, lastWatched: new Date(Date.now() - 86400000)}, // Watched 90s yesterday
  js1: {watchedTime: 250, lastWatched: new Date(Date.now() - 3600000)}, // Watched 250s an hour ago
};

// Helper function to find video details across all playlists
const findVideoDetails = (videoId: string) => {
  for (const key in mockPlaylists) {
    const playlist = mockPlaylists[key as keyof typeof mockPlaylists];
    const video = playlist.find(v => v.id === videoId);
    if (video) return video;
  }
  return undefined; // Return undefined if not found
}


export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const {toast} = useToast();
  const [userHistory, setUserHistory] = useState<Record<string, {watchedTime: number; lastWatched: Date}>>({});

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Load user history (from localStorage or API in a real app)
      try {
        const storedHistory = localStorage.getItem('userLearningHistory');
        const parsedHistory = storedHistory ? JSON.parse(storedHistory, (key, value) => {
          if (key === 'lastWatched' && value) {
            // Ensure value is valid date string before creating Date object
            const date = new Date(value);
            return isNaN(date.getTime()) ? null : date; // Return null if invalid date
          }
          return value;
        }) : mockUserHistory;

        // Filter out entries with null lastWatched dates if any parsing failed
        const validHistory: Record<string, {watchedTime: number; lastWatched: Date}> = {};
        for (const key in parsedHistory) {
           if (parsedHistory[key]?.lastWatched instanceof Date) {
               validHistory[key] = parsedHistory[key];
           }
        }
        setUserHistory(validHistory);

      } catch (error) {
        console.error("Failed to parse user history from localStorage", error);
        setUserHistory(mockUserHistory); // Fallback to mock data on error
        toast({
            title: "History Load Error",
            description: "Could not load your progress, using default.",
            variant: "destructive",
        });
      }

      toast({
        title: 'Welcome Back!',
        description: 'Ready to continue your learning journey?',
        duration: 5000, // Show for 5 seconds
      });
    }, 800); // Slightly faster loading sim

    return () => clearTimeout(timer);
  }, [toast]);


  const handleProgressUpdate = (videoId: string, currentTime: number) => {
     setUserHistory(prevHistory => {
        const videoDetails = findVideoDetails(videoId);
        // Prevent updating time beyond known duration if available, or if currentTime is invalid
        const cappedTime = (videoDetails && !isNaN(currentTime)) ? Math.min(currentTime, videoDetails.duration) : (!isNaN(currentTime) ? currentTime : (prevHistory[videoId]?.watchedTime || 0));

        // Only update if time has progressed or video is new
        if (cappedTime > (prevHistory[videoId]?.watchedTime || -1)) {
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
        }
        // If time hasn't progressed, return the previous history state
        return prevHistory;
     });
  };

  if (isLoading) {
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
                  <div className="w-full md:w-2/3 aspect-video bg-muted flex items-center justify-center">
                     <PlayCircle className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                  {/* Playlist Skeleton */}
                  <div className="w-full md:w-1/3 p-4 space-y-3 border-t md:border-t-0 md:border-l">
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

  return (
    <div className="animate-fadeIn space-y-8 mt-6">
       {/* Added Introductory Text */}
       <div className="mb-8">
           <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Your Web Development Journey</h1>
           <p className="text-muted-foreground">
               Select a topic below (HTML, CSS, or JavaScript) to start learning or continue where you left off. Videos are curated to guide you step-by-step.
           </p>
       </div>

      <Tabs defaultValue="html" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 shadow-sm bg-card border">
          <TabsTrigger value="html" className="transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-l-md rounded-r-none">
            <Code className="h-4 w-4 mr-2" />
            HTML
          </TabsTrigger>
          <TabsTrigger value="css" className="transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-none border-x">
            <Palette className="h-4 w-4 mr-2" />
            CSS
          </TabsTrigger>
          <TabsTrigger value="javascript" className="transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-r-md rounded-l-none">
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
