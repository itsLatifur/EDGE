'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Code, Palette, Zap } from 'lucide-react';

// Define learning topics
const learningTopics = [
  {
    id: 'html',
    title: 'HTML',
    description: 'Learn the fundamental building blocks of the web. Structure content and create the skeleton of your websites.',
    icon: Code,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-200 dark:border-orange-800/50',
    link: '/videos?tab=html',
  },
  {
    id: 'css',
    title: 'CSS',
    description: 'Style your websites and bring your designs to life. Control layout, colors, fonts, and create beautiful user interfaces.',
    icon: Palette,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-800/50',
    link: '/videos?tab=css',
  },
  {
    id: 'javascript',
    title: 'JavaScript',
    description: 'Add interactivity and dynamic behavior to your web pages. Handle user actions, fetch data, and build powerful web applications.',
    icon: Zap,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    borderColor: 'border-yellow-200 dark:border-yellow-800/50',
    link: '/videos?tab=javascript',
  },
];

export default function HomePage() {
  return (
    <div className="animate-fadeIn space-y-12 mt-6">
      {/* Hero Section */}
      <section className="text-center py-10 bg-gradient-to-b from-background to-muted/30 rounded-lg shadow-sm border">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
          Master Web Development, Step-by-Step
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Welcome to Self-Learn! Dive into interactive video playlists covering HTML, CSS, and JavaScript. Start building your web development skills today, at your own pace.
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/videos">
              Start Learning Videos
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/blogs">
              Explore Resources
            </Link>
          </Button>
        </div>
      </section>

      {/* Learning Topics Section */}
      <section>
        <h2 className="text-3xl font-semibold text-center mb-8">
          Choose Your Learning Path
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {learningTopics.map((topic) => (
            <Card key={topic.id} className={`overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-lg ${topic.borderColor}`}>
              <CardHeader className={`p-6 ${topic.bgColor}`}>
                <div className="flex items-center gap-4">
                   <div className={`p-3 rounded-full bg-background border ${topic.borderColor}`}>
                     <topic.icon className={`h-8 w-8 ${topic.color}`} />
                   </div>
                   <CardTitle className={`text-2xl font-semibold ${topic.color}`}>{topic.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <CardDescription className="text-base text-muted-foreground min-h-[70px]">
                  {topic.description}
                </CardDescription>
                <Button variant="default" className="w-full group" asChild>
                  <Link href={topic.link}>
                    Learn {topic.title} with Videos
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Optional: Add more sections like testimonials, features, etc. */}

    </div>
  );
}