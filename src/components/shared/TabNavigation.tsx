// src/components/shared/TabNavigation.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CategoryTab } from "@/lib/constants"; // Use type import

interface TabNavigationProps {
  tabs: CategoryTab[]; 
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  // Children prop is used by VideosPage to render content based on active tab,
  // but it's not directly used here for rendering TabsContent as VideosPage handles that logic.
  // The issue was that VideosPage was trying to use TabNavigation's children prop
  // as if TabNavigation itself would iterate and call it.
  // Instead, TabNavigation provides the Tabs structure, and VideosPage (or any parent)
  // decides what to render *inside* its own structure, reacting to tab changes.
  // For this specific setup, we don't need children as a function here.
  // The parent component (VideosPageContent) will use the activeTabId state to render conditionally.
}

export function TabNavigation({
  tabs,
  defaultTab,
  onTabChange,
}: TabNavigationProps) {
  const effectiveDefaultTab = defaultTab || (tabs.length > 0 ? tabs[0].id : "");

  // The actual content rendering based on the tab selection happens in the parent component (e.g., VideosPageContent).
  // This component just sets up the Tabs structure.
  return (
    <Tabs defaultValue={effectiveDefaultTab} className="w-full" onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-3 h-auto items-center rounded-lg bg-muted p-1.5 text-muted-foreground mb-0 gap-1.5 shadow-inner md:mb-2">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-md px-2 py-2 sm:px-3 text-xs sm:text-sm font-semibold ring-offset-background transition-all duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md flex-shrink-0 hover:bg-background/70 data-[state=active]:hover:bg-background"
          >
            <tab.icon aria-hidden="true" className="mr-1 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {/*
        The <TabsContent> for each tab will be rendered by the parent component
        that uses this TabNavigation, like in VideosPageContent.
        It will typically look like:
        <TabsContent value="html">...</TabsContent>
        <TabsContent value="css">...</TabsContent>
        etc.
        This component's responsibility is the TabsList and Triggers.
      */}
    </Tabs>
  );
}
