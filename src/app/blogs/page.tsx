'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Code, Palette, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Define types for resources
type ResourceCategory = 'html' | 'css' | 'javascript';
interface Resource {
  id: string;
  title: string;
  url: string;
  description: string;
  type: 'blog' | 'documentation' | 'tutorial' | 'tool';
  source?: string; // Optional: Name of the source website (e.g., MDN, CSS-Tricks)
}

// Mock data for resources - Replace with actual data fetching or static data
const mockResources: Record<ResourceCategory, Resource[]> = {
  html: [
    { id: 'html-mdn', title: 'MDN Web Docs: HTML', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML', description: 'The essential and comprehensive reference for HTML elements, attributes, and concepts.', type: 'documentation', source: 'MDN' },
    { id: 'html-w3schools', title: 'W3Schools HTML Tutorial', url: 'https://www.w3schools.com/html/', description: 'A beginner-friendly interactive tutorial covering all aspects of HTML.', type: 'tutorial', source: 'W3Schools' },
    { id: 'html-semantic', title: 'HTML Semantic Elements Guide', url: 'https://web.dev/learn/html/semantic-html/', description: 'Learn why and how to use semantic HTML for better accessibility and SEO.', type: 'blog', source: 'web.dev' },
    { id: 'html-validator', title: 'W3C Markup Validation Service', url: 'https://validator.w3.org/', description: 'Check the validity of your HTML documents against W3C standards.', type: 'tool', source: 'W3C' },
    { id: 'html-forms', title: 'A Complete Guide to HTML Forms', url: 'https://css-tricks.com/complete-guide-forms/', description: 'In-depth article covering everything about HTML forms and their elements.', type: 'blog', source: 'CSS-Tricks' },
  ],
  css: [
    { id: 'css-mdn', title: 'MDN Web Docs: CSS', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS', description: 'The complete guide to CSS, covering selectors, properties, layout, and more.', type: 'documentation', source: 'MDN' },
    { id: 'css-tricks', title: 'CSS-Tricks', url: 'https://css-tricks.com/', description: 'A fantastic blog with articles, guides, and tips for all things CSS.', type: 'blog', source: 'CSS-Tricks' },
    { id: 'css-flexbox-guide', title: 'A Complete Guide to Flexbox', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', description: 'An indispensable visual guide to understanding CSS Flexbox.', type: 'tutorial', source: 'CSS-Tricks' },
    { id: 'css-grid-guide', title: 'A Complete Guide to CSS Grid', url: 'https://css-tricks.com/snippets/css/complete-guide-grid/', description: 'Master CSS Grid layout with this comprehensive visual guide.', type: 'tutorial', source: 'CSS-Tricks' },
    { id: 'css-caniuse', title: 'Can I use...', url: 'https://caniuse.com/', description: 'Check browser compatibility tables for front-end web technologies.', type: 'tool', source: 'caniuse.com' },
    { id: 'css-smashing', title: 'Smashing Magazine: CSS', url: 'https://www.smashingmagazine.com/category/css', description: 'High-quality articles on modern CSS techniques and best practices.', type: 'blog', source: 'Smashing Magazine' },
  ],
  javascript: [
    { id: 'js-mdn', title: 'MDN Web Docs: JavaScript', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', description: 'The definitive resource for JavaScript language features and APIs.', type: 'documentation', source: 'MDN' },
    { id: 'js-info', title: 'The Modern JavaScript Tutorial', url: 'https://javascript.info/', description: 'A detailed and up-to-date tutorial covering JavaScript from basics to advanced topics.', type: 'tutorial', source: 'javascript.info' },
    { id: 'js-eloquent', title: 'Eloquent JavaScript (Online Book)', url: 'https://eloquentjavascript.net/', description: 'A well-regarded book introducing programming with JavaScript, available online.', type: 'tutorial', source: 'Eloquent JavaScript' },
    { id: 'js-wesbos', title: 'Wes Bos Courses & Tutorials', url: 'https://wesbos.com/', description: 'Popular video courses and free tutorials on various JavaScript topics.', type: 'tutorial', source: 'Wes Bos' },
    { id: 'js-es6-features', title: 'ES6 Features Guide', url: 'http://es6-features.org/', description: 'A concise overview of new features introduced in ECMAScript 6 (ES2015).', type: 'documentation', source: 'es6-features.org' },
    { id: 'js-devto', title: 'JavaScript on DEV Community', url: 'https://dev.to/t/javascript', description: 'Community-driven blog posts and discussions about JavaScript.', type: 'blog', source: 'DEV Community' },
  ],
};

const resourceIcons = {
  html: Code,
  css: Palette,
  javascript: Zap,
};

// Resource Card Component
const ResourceCard: React.FC<{ resource: Resource }> = ({ resource }) => {
  const typeColors = {
    blog: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    documentation: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    tutorial: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    tool: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-shadow duration-300 hover:shadow-md">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <CardTitle className="text-base sm:text-lg font-semibold leading-tight flex-grow">{resource.title}</CardTitle>
             <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap flex-shrink-0 mt-1 sm:mt-0 ${typeColors[resource.type]}`}>
                 {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
            </span>
        </div>
        {resource.source && (
           <p className="text-xs text-muted-foreground pt-1">Source: {resource.source}</p>
        )}
      </CardHeader>
      <CardContent className="flex-grow pb-3 sm:pb-4">
        <p className="text-sm text-muted-foreground">{resource.description}</p>
      </CardContent>
      <div className="p-4 pt-0 mt-auto"> {/* Ensure button is at the bottom */}
        <Button variant="outline" size="sm" asChild className="w-full">
          <Link href={resource.url} target="_blank" rel="noopener noreferrer">
            Visit Resource
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
};

// Main Blogs Page Component
export default function BlogsPage() {
  const [activeTab, setActiveTab] = useState<ResourceCategory>('html');
  const [isLoading, setIsLoading] = useState(false); // Simulate loading

  // Simulate loading on tab change (optional)
  const handleTabChange = (value: string) => {
    setIsLoading(true);
    setActiveTab(value as ResourceCategory);
    // Simulate data fetch delay
    setTimeout(() => setIsLoading(false), 300);
  };

  return (
    <div className="animate-fadeIn space-y-6 sm:space-y-8 mt-6 sm:mt-8 lg:mt-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
          Curated Resources & Links
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Explore helpful blogs, documentation, tutorials, and tools for HTML, CSS, and JavaScript.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* Responsive Tabs List */}
        <TabsList className="grid w-full grid-cols-3 mb-6 shadow-sm bg-card border max-w-lg mx-auto">
          {Object.keys(mockResources).map((key) => {
             const category = key as ResourceCategory;
             const Icon = resourceIcons[category];
             return (
                 <TabsTrigger
                     key={category}
                     value={category}
                     className="transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md first:rounded-l-md last:rounded-r-md rounded-none data-[state=inactive]:border-r data-[state=inactive]:last:border-r-0 text-xs sm:text-sm py-2 sm:py-2.5"
                 >
                     <Icon className="h-4 w-4 mr-1.5 sm:mr-2" />
                     <span className="hidden sm:inline">{category.toUpperCase()}</span>
                     <span className="sm:hidden">{category.toUpperCase()}</span> {/* Show uppercase on small screens too */}
                 </TabsTrigger>
             );
          })}
        </TabsList>

        {Object.keys(mockResources).map((key) => {
          const category = key as ResourceCategory;
          return (
            <TabsContent key={category} value={category} className="mt-6">
              {isLoading ? (
                // Skeleton Loading State - Responsive Grid
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader><Skeleton className="h-5 w-3/4 rounded" /></CardHeader>
                      <CardContent className="space-y-2">
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-5/6 rounded" />
                      </CardContent>
                      <div className="p-4"><Skeleton className="h-9 w-full rounded" /></div>
                    </Card>
                  ))}
                </div>
              ) : (
                // Actual Content - Responsive Grid
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {mockResources[category].map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>
              )}
               {mockResources[category].length === 0 && !isLoading && (
                 <div className="text-center py-12 text-muted-foreground">
                    <p>No resources found for {category.toUpperCase()} yet. Check back later!</p>
                 </div>
                )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
