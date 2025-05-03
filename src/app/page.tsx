'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Code, Palette, Zap } from 'lucide-react';
import { cn } from '@/lib/utils'; // Import cn

// Define learning topics
const learningTopics = [
  {
    id: 'html',
    title: 'HTML',
    description: 'Learn the fundamental building blocks of the web. Structure content and create the skeleton of your websites.',
    icon: Code,
    color: 'text-orange-500 dark:text-orange-400', // Adjusted dark mode color
    bgColor: 'bg-orange-50 dark:bg-orange-900/30', // Lighter bg
    borderColor: 'border-orange-200 dark:border-orange-800/50',
    focusRing: 'focus-visible:ring-orange-500', // Focus ring color
    link: '/videos?tab=html',
  },
  {
    id: 'css',
    title: 'CSS',
    description: 'Style your websites and bring your designs to life. Control layout, colors, fonts, and create beautiful user interfaces.',
    icon: Palette,
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-800/50',
    focusRing: 'focus-visible:ring-blue-500',
    link: '/videos?tab=css',
  },
  {
    id: 'javascript',
    title: 'JavaScript',
    description: 'Add interactivity and dynamic behavior to your web pages. Handle user actions, fetch data, and build powerful web applications.',
    icon: Zap,
    color: 'text-yellow-500 dark:text-yellow-400', // Using amber for better visibility
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/30', // Adjusted yellow
    borderColor: 'border-yellow-200 dark:border-yellow-800/50', // Adjusted yellow
    focusRing: 'focus-visible:ring-yellow-500', // Adjusted yellow
    link: '/videos?tab=javascript',
  },
];

export default function HomePage() {
  return (
    <div className="animate-fadeIn space-y-12 mt-6 sm:mt-8 lg:mt-10">
      {/* Hero Section */}
      <section className="text-center py-8 sm:py-12 lg:py-16 bg-gradient-to-b from-background to-muted/30 rounded-lg shadow-sm border px-4">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
          Master Web Development, Step-by-Step
        </h1>
        <p className="text-md sm:text-lg text-muted-foreground max-w-xl md:max-w-2xl mx-auto mb-6 sm:mb-8">
          Welcome to Self-Learn! Dive into interactive video playlists covering HTML, CSS, and JavaScript. Start building your web development skills today, at your own pace.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
          <Button size="lg" asChild className="w-full sm:w-auto transition-transform duration-200 hover:scale-105 focus-visible:scale-105">
            <Link href="/videos">
              Start Learning Videos
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="w-full sm:w-auto transition-transform duration-200 hover:scale-105 focus-visible:scale-105">
            <Link href="/blogs">
              Explore Resources
            </Link>
          </Button>
        </div>
      </section>

      {/* Learning Topics Section */}
      <section>
        <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-6 sm:mb-8">
          Choose Your Learning Path
        </h2>
        {/* Responsive Grid: 1 col on mobile, 2 on sm, 3 on md+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
          {learningTopics.map((topic) => (
             // Wrap card in Link for better accessibility and make the whole card clickable
             <Link
               key={topic.id}
               href={topic.link}
               className={cn(
                 "group block rounded-lg overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                 topic.focusRing // Apply specific focus ring color
               )}
             >
                 <Card className={cn(
                     "flex flex-col h-full", // Ensure card takes full height of the link wrapper
                     "transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-lg group-focus-visible:scale-[1.03] group-focus-visible:shadow-lg", // Apply transform on group hover/focus
                     topic.borderColor
                 )}>
                     <CardHeader className={cn("p-4 sm:p-6", topic.bgColor)}>
                         <div className="flex items-center gap-3 sm:gap-4">
                            <div className={cn("p-2 sm:p-3 rounded-full bg-background border", topic.borderColor)}>
                                <topic.icon className={cn("h-6 w-6 sm:h-8 sm:w-8", topic.color)} />
                            </div>
                            <CardTitle className={cn("text-xl sm:text-2xl font-semibold", topic.color)}>{topic.title}</CardTitle>
                         </div>
                     </CardHeader>
                     <CardContent className="p-4 sm:p-6 space-y-4 flex-grow flex flex-col">
                         <CardDescription className="text-sm sm:text-base text-muted-foreground flex-grow min-h-[60px] sm:min-h-[70px]">
                         {topic.description}
                         </CardDescription>
                         {/* Button is now more like a visual indicator within the link */}
                         <div
                           className={cn(
                             "mt-auto inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors disabled:pointer-events-none disabled:opacity-50",
                             "bg-primary text-primary-foreground group-hover:bg-primary/90", // Style like a default button
                             "h-10 px-4 py-2 w-full" // Size like a default button
                           )}
                           aria-hidden="true" // Hide from screen readers as the link handles navigation
                         >
                         Learn {topic.title} with Videos
                         <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                         </div>
                     </CardContent>
                 </Card>
             </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
