// src/app/resources/page.tsx
"use client";

import { useState } from 'react';
import { TabNavigation } from '@/components/shared/TabNavigation';
import { CATEGORIES, SAMPLE_RESOURCES_DATA, type ResourceLink } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export default function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0].id);

  const handleTabChange = (tabId: string) => {
    setActiveCategory(tabId);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Helpful Resources</h1>
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
                <Card key={resource.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <CardDescription className="capitalize text-xs">{resource.type}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-3">{resource.description}</p>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Button asChild variant="outline" className="w-full">
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        Visit Resource <ExternalLink className="ml-2 h-4 w-4" />
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
