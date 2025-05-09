// src/app/resources/page.tsx
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TabNavigation } from '@/components/shared/TabNavigation';
import { CATEGORIES, SAMPLE_RESOURCES_DATA, type ResourceLink } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';


function ResourcesPageContent() {
  const searchParams = useSearchParams();
  const initialTabFromQuery = searchParams.get('tab');

  const [activeCategory, setActiveCategory] = useState<string>(() => {
    const isValidTab = CATEGORIES.some(c => c.id === initialTabFromQuery);
    return isValidTab && initialTabFromQuery ? initialTabFromQuery : CATEGORIES[0].id;
  });

  // Effect to update activeCategory if query param changes after initial load
  useEffect(() => {
    const tabFromQuery = searchParams.get('tab');
    const isValidTab = CATEGORIES.some(c => c.id === tabFromQuery);
    if (isValidTab && tabFromQuery && tabFromQuery !== activeCategory) {
      setActiveCategory(tabFromQuery);
    }
  }, [searchParams, activeCategory]);

  const handleTabChange = (tabId: string) => {
    setActiveCategory(tabId);
    // Optionally update URL: window.history.pushState(null, '', `?tab=${tabId}`);
  };

  return (
    <div className="space-y-8">
      <header className="mb-6">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Curated Resources</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Discover hand-picked articles, documentation, and tools to supplement your learning.
        </p>
      </header>
      <TabNavigation tabs={CATEGORIES} defaultTab={activeCategory} onTabChange={handleTabChange}>
        {(tabId) => {
          const resources = SAMPLE_RESOURCES_DATA[tabId];
          if (!resources || resources.length === 0) {
            return (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">No resources available for {CATEGORIES.find(c => c.id === tabId)?.label || 'this category'} yet. Check back soon!</p>
                </CardContent>
              </Card>
            );
          }
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource: ResourceLink) => (
                <Card key={resource.id} className="flex flex-col shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1">
                  <CardHeader>
                    <CardTitle className="text-xl">{resource.title}</CardTitle>
                    <CardDescription className="capitalize text-xs font-medium text-primary pt-1">
                      {resource.type}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-3">{resource.description}</p>
                  </CardContent>
                  <div className="p-6 pt-2">
                    <Button asChild variant="default" className="w-full group">
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        Visit Resource <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                      </a>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          );
        }}
      </TabNavigation>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function ResourcesPage() {
  return (
    <Suspense fallback={<ResourcesPageSkeleton />}>
      <ResourcesPageContent />
    </Suspense>
  );
}

function ResourcesPageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <header className="mb-6">
        <Skeleton className="h-12 w-3/4 mb-2" />
        <Skeleton className="h-6 w-1/2" />
      </header>
      <div className="flex space-x-2 mb-6">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-3 rounded-lg border p-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
