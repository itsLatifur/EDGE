// src/components/shared/TabNavigation.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CATEGORIES } from "@/lib/constants"; // Use type import

interface TabItem {
  id: string;
  label: string;
}

interface TabNavigationProps {
  tabs: typeof CATEGORIES; // Using the type from constants
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  children: (activeTabId: string) => React.ReactNode;
}

export function TabNavigation({
  tabs,
  defaultTab,
  onTabChange,
  children,
}: TabNavigationProps) {
  const effectiveDefaultTab = defaultTab || (tabs.length > 0 ? tabs[0].id : "");

  return (
    <Tabs defaultValue={effectiveDefaultTab} className="w-full" onValueChange={onTabChange}>
      <TabsList className="flex h-auto items-center w-full overflow-x-auto rounded-lg bg-muted p-1.5 text-muted-foreground mb-6 gap-1.5 shadow-inner">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="flex-1 sm:flex-none inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-xs sm:text-sm font-semibold ring-offset-background transition-all duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md flex-shrink-0 hover:bg-background/70 data-[state=active]:hover:bg-background"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-0">
          {children(tab.id)}
        </TabsContent>
      ))}
    </Tabs>
  );
}

