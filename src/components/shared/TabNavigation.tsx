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
      <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="text-sm sm:text-base py-2.5">
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
