// src/components/shared/TabNavigation.tsx
"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CategoryTab as CategoryTabType } from "@/lib/constants"; // Use type import
import type { LucideIcon } from "lucide-react";

// Updated props: tabs now expect the resolved icon component
interface TabWithIcon extends Omit<CategoryTabType, 'iconName'> {
  icon: LucideIcon;
}

interface TabNavigationProps {
  tabs: TabWithIcon[]; 
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
}

export function TabNavigation({
  tabs,
  defaultTab,
  onTabChange,
}: TabNavigationProps) {
  const effectiveDefaultTab = defaultTab || (tabs.length > 0 ? tabs[0].id : "");

  return (
    <Tabs value={effectiveDefaultTab} className="w-full" onValueChange={onTabChange}>
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
      {/* Content is handled by parent */}
    </Tabs>
  );
}
