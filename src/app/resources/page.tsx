// src/app/resources/page.tsx
"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { TabNavigation } from '@/components/shared/TabNavigation';
import { 
    type ResourceLink, 
    getCategories, 
    getResourcesData,
    LUCIDE_ICON_MAP,
    type CategoryTab 
} from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';


function ResourcesPageContent() {
  const searchParams = useSearchParams();
  const initialTabFromQuery = searchParams.get('tab');
  const tabsRef = useRef<HTMLDivElement>(null);

  const [dynamicCategories, setDynamicCategories] = useState<CategoryTab[]>([]);
  const [dynamicResources, setDynamicResources] = useState<Record<string, ResourceLink[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(() => {
    setIsLoading(true);
    setDynamicCategories(getCategories());
    setDynamicResources(getResourcesData());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshData();
    // Optional: set up an interval or event listener if changes can happen without full page interaction
    // For demo, we assume admin changes trigger navigation or state updates that lead to re-fetch
    // const interval = setInterval(refreshData, 30000); // Example: refresh every 30s
    // return () => clearInterval(interval);
  }, [refreshData]);

  const [activeCategory, setActiveCategory] = useState<string>("");

  useEffect(() => {
    if (dynamicCategories.length > 0) {
      const isValidTab = dynamicCategories.some(c => c.id === initialTabFromQuery);
      const newActiveCategory = isValidTab && initialTabFromQuery ? initialTabFromQuery : dynamicCategories[0].id;
      if (newActiveCategory !== activeCategory) {
        setActiveCategory(newActiveCategory);
      }
    }
  }, [initialTabFromQuery, dynamicCategories, activeCategory]);


  useEffect(() => {
    const tabFromQuery = searchParams.get('tab');
    if (dynamicCategories.length > 0) {
      const isValidTab = dynamicCategories.some(c => c.id === tabFromQuery);
      if (isValidTab && tabFromQuery && tabFromQuery !== activeCategory) {
        setActiveCategory(tabFromQuery);
      } else if (!isValidTab && tabFromQuery && activeCategory !== dynamicCategories[0].id) {
        // If query tab is no longer valid (e.g. deleted by admin), default to first available
        setActiveCategory(dynamicCategories[0].id);
      }
    }
  }, [searchParams, activeCategory, dynamicCategories]);


  useEffect(() => {
    const root = document.documentElement;
    const headerElement = document.querySelector('header');
    const headerHeight = headerElement ? headerElement.offsetHeight : 64; 
    root.style.setProperty('--header-height', `${headerHeight}px`);
    if (tabsRef.current) {
      root.style.setProperty('--tabs-height', `${tabsRef.current.offsetHeight}px`);
    }
  }, [activeCategory]); // Re-run if activeCategory changes which might affect layout slightly


  const handleTabChange = (tabId: string) => {
    setActiveCategory(tabId);
    // Update URL query param without full page reload
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', tabId);
    window.history.pushState({ path: newUrl.href }, '', newUrl.href);
  };
  
  const currentCategoryLabel = dynamicCategories.find(c => c.id === activeCategory)?.label || 'Resources';

  if (isLoading) {
    return <ResourcesPageSkeleton />;
  }

  if (dynamicCategories.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No resource categories available. Content might be managed by an administrator.</p>
        </CardContent>
      </Card>
    );
  }
  
  const tabsForNavigation = dynamicCategories.map(cat => ({
    ...cat,
    icon: LUCIDE_ICON_MAP[cat.iconName] || LUCIDE_ICON_MAP.BookOpen, // Fallback icon
  }));


  return (
    <div className="space-y-0 md:space-y-4 lg:space-y-6">
      <header className="mb-4 md:mb-6 pt-2 md:pt-0">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Curated {currentCategoryLabel} Resources</h1>
        <p className="mt-1 text-md text-muted-foreground sm:text-lg">
          Hand-picked articles, docs, and tools.
        </p>
      </header>

      <div ref={tabsRef} className="sticky top-[var(--header-height,64px)] z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:pt-2 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 md:shadow-none shadow-sm mb-4 md:mb-0">
         <TabNavigation tabs={tabsForNavigation} defaultTab={activeCategory} onTabChange={handleTabChange} />
      </div>
      
      {(() => {
          const resourcesForActiveCategory = dynamicResources[activeCategory];
          if (!resourcesForActiveCategory || resourcesForActiveCategory.length === 0) {
            return (
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">No resources available for {dynamicCategories.find(c => c.id === activeCategory)?.label || 'this category'} yet. Check back soon!</p>
                </CardContent>
              </Card>
            );
          }
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {resourcesForActiveCategory.map((resource: ResourceLink) => (
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
        })()}
    </div>
  );
}

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
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-5 w-1/2" />
      </header>
      <div className="flex space-x-2 mb-6 sticky top-[var(--header-height,64px)] z-40 bg-background md:pt-2 p-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 md:shadow-none shadow-sm">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
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
