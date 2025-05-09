// src/app/page.tsx
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CodeXml, Palette, Braces, Smartphone, GitMerge, Component } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  learnMoreLink: string;
  iconBgClass: string;
  iconColorClass: string;
  cardBorderClass: string;
  titleColorClass: string;
  buttonClass: string;
}

const roadmapSteps: RoadmapStep[] = [
  {
    id: 'html',
    title: 'HTML Fundamentals',
    description: 'Build the skeleton of websites. Learn about tags, elements, attributes, and semantic HTML for well-structured content.',
    icon: CodeXml,
    learnMoreLink: '/videos?tab=html',
    iconBgClass: 'bg-orange-100 dark:bg-orange-900/40',
    iconColorClass: 'text-orange-600 dark:text-orange-400',
    cardBorderClass: 'border-orange-500 dark:border-orange-600',
    titleColorClass: 'text-orange-700 dark:text-orange-300',
    buttonClass: 'bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white',
  },
  {
    id: 'css',
    title: 'CSS Styling',
    description: 'Bring your HTML to life. Master selectors, properties, layouts (Flexbox, Grid), and responsive design principles.',
    icon: Palette,
    learnMoreLink: '/videos?tab=css',
    iconBgClass: 'bg-blue-100 dark:bg-blue-900/40',
    iconColorClass: 'text-blue-600 dark:text-blue-400',
    cardBorderClass: 'border-blue-500 dark:border-blue-600',
    titleColorClass: 'text-blue-700 dark:text-blue-300',
    buttonClass: 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white',
  },
  {
    id: 'javascript',
    title: 'JavaScript Essentials',
    description: 'Add interactivity and dynamic behavior. Understand variables, functions, DOM manipulation, and modern ES6+ features.',
    icon: Braces,
    learnMoreLink: '/videos?tab=javascript',
    iconBgClass: 'bg-yellow-100 dark:bg-yellow-800/40',
    iconColorClass: 'text-yellow-600 dark:text-yellow-400',
    cardBorderClass: 'border-yellow-500 dark:border-yellow-600',
    titleColorClass: 'text-yellow-700 dark:text-yellow-300',
    buttonClass: 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-black dark:text-white',
  },
  {
    id: 'responsive',
    title: 'Responsive Web Design',
    description: 'Ensure your websites look great on all devices. Learn about media queries, fluid layouts, and mobile-first strategies.',
    icon: Smartphone,
    learnMoreLink: '/resources',
    iconBgClass: 'bg-green-100 dark:bg-green-900/40',
    iconColorClass: 'text-green-600 dark:text-green-400',
    cardBorderClass: 'border-green-500 dark:border-green-600',
    titleColorClass: 'text-green-700 dark:text-green-300',
    buttonClass: 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white',
  },
   {
    id: 'git',
    title: 'Version Control with Git',
    description: 'Track changes, collaborate with others, and manage your codebase effectively using Git and platforms like GitHub.',
    icon: GitMerge,
    learnMoreLink: '/resources',
    iconBgClass: 'bg-purple-100 dark:bg-purple-900/40',
    iconColorClass: 'text-purple-600 dark:text-purple-400',
    cardBorderClass: 'border-purple-500 dark:border-purple-600',
    titleColorClass: 'text-purple-700 dark:text-purple-300',
    buttonClass: 'bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white',
  },
  {
    id: 'frameworks',
    title: 'Intro to Frontend Frameworks',
    description: 'Explore powerful tools like React (and Next.js by extension) to build complex, scalable, and interactive user interfaces.',
    icon: Component,
    learnMoreLink: '/videos',
    iconBgClass: 'bg-teal-100 dark:bg-teal-900/40',
    iconColorClass: 'text-teal-600 dark:text-teal-400',
    cardBorderClass: 'border-teal-500 dark:border-teal-600',
    titleColorClass: 'text-teal-700 dark:text-teal-300',
    buttonClass: 'bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700 text-white',
  },
];

const RoadmapStepCard = ({ step, index, totalSteps }: { step: RoadmapStep; index: number; totalSteps: number }) => {
  const isEven = index % 2 === 0;
  // Bubble dimensions: lg:h-24 lg:w-24 (6rem), default h-20 w-20 (5rem)
  // Connector line will attach to card from the 1rem padding area of its container.
  // Bubble radius is 2.5rem (for 5rem diameter bubble)
  // Card container padding is md:p-4 (1rem)

  return (
    <div className={`relative flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center group ${index === totalSteps - 1 ? 'mb-0' : 'mb-12 md:mb-24'}`}>
      {/* Content Card container */}
      {/* For md screens, card takes up 50% width minus bubble radius (2.5rem), with 1rem padding */}
      <div className="w-full md:w-[calc(50%_-_2.5rem)] p-3 md:p-4 mt-4 md:mt-0">
        <Card className={`relative w-full shadow-xl hover:shadow-2xl transition-shadow duration-300 ease-in-out border-2 ${step.cardBorderClass} bg-card`}>
          <CardHeader className="p-5 md:p-6 pb-2 md:pb-3">
            <div className="flex items-center md:hidden mb-2"> {/* Mobile Icon & Title */}
              <div className={`p-2.5 rounded-lg mr-3 ${step.iconBgClass} ring-1 ${step.cardBorderClass.replace('border-','ring-')}`}>
                <step.icon className={`h-5 w-5 ${step.iconColorClass}`} />
              </div>
              <CardTitle className={`text-xl font-semibold ${step.titleColorClass}`}>{step.title}</CardTitle>
            </div>
            <CardTitle className={`hidden md:block text-2xl lg:text-3xl font-bold ${step.titleColorClass}`}>{step.title}</CardTitle> {/* Desktop Title */}
          </CardHeader>
          <CardContent className="p-5 md:p-6 pt-0">
            <CardDescription className="text-base text-muted-foreground mb-5 leading-relaxed">
              {step.description}
            </CardDescription>
            <Link href={step.learnMoreLink} passHref>
              <Button className={`w-full sm:w-auto ${step.buttonClass} font-medium rounded-md shadow-md hover:shadow-lg transition-shadow`}>
                Start Learning <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
          
          {/* Horizontal connector line from Card to Bubble's timeline area */}
          <div
            className={cn(
              "hidden md:block absolute top-1/2 -translate-y-1/2 w-4 h-[2px] z-[5]", // w-4 is 1rem, h-[2px] for thickness
              isEven ? "right-[-1rem]" : "left-[-1rem]", // Positioned in the 1rem padding gap of parent
              step.cardBorderClass ? step.cardBorderClass.replace('border-', 'bg-') : 'bg-border' // Use step's border color or fallback
            )}
          />
          {/* Arrowhead pointing towards the bubble on the timeline */}
          <div
            className={cn(
              "hidden md:block absolute top-1/2 -translate-y-1/2 w-[8px] h-[8px] transform rotate-45 z-[5]",
              isEven ? "right-[-1rem] mr-[-4px]" : "left-[-1rem] ml-[-4px]", // Positioned at the end of the line, slightly offset
              step.cardBorderClass ? step.cardBorderClass.replace('border-', 'bg-') : 'bg-border' // Use step's border color or fallback
            )}
          />
        </Card>
      </div>

      {/* Bubble (on the timeline for Desktop) */}
      <div className={`hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center h-20 w-20 lg:h-24 lg:w-24 rounded-full border-4 ${step.cardBorderClass} bg-background shadow-xl z-10`}>
        <step.icon className={`h-10 w-10 lg:h-12 lg:w-12 ${step.iconColorClass}`} />
      </div>
    </div>
  );
};


export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-10 sm:py-12 lg:py-16">
      <header className="text-center mb-12 md:mb-20">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-4">
          Your Frontend Learning <span className="text-primary">Roadmap</span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
          Navigate your path to becoming a frontend developer. Each step builds on the last, guiding you from fundamentals to more advanced topics.
        </p>
      </header>

      <div className="relative mt-8 md:mt-12">
        {/* Central line for desktop timeline */}
        {/* This line visually connects the bubbles vertically. */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-border to-transparent -translate-x-1/2 z-0"></div>
        
        {roadmapSteps.map((step, index) => (
          <RoadmapStepCard key={step.id} step={step} index={index} totalSteps={roadmapSteps.length} />
        ))}
      </div>

      <footer className="text-center mt-16 md:mt-24 pt-8 border-t">
        <p className="text-muted-foreground">
          Ready to dive in? Explore our <Link href="/videos" className="font-medium text-primary hover:underline">Video Playlists</Link> and <Link href="/resources" className="font-medium text-primary hover:underline">Curated Resources</Link>.
        </p>
      </footer>
    </div>
  );
}
