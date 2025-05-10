// src/lib/constants.ts
import type { LucideIcon } from 'lucide-react';
import { CodeXml, Palette, Braces, Settings, Video, BookOpen, PlusCircle, FileText, Brain, GitBranch, Layers } from 'lucide-react';

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/videos", label: "Videos" },
  { href: "/resources", label: "Resources" },
  { href: "/developer", label: "Developer" },
];

// Map icon names to Lucide components for dynamic icon selection
export const LUCIDE_ICON_MAP = {
  CodeXml,
  Palette,
  Braces,
  Settings,
  Video,
  BookOpen,
  PlusCircle,
  FileText, // Example: For "Documents" or "Articles"
  Brain,    // Example: For "Concepts" or "Theory"
  GitBranch, // Example: For "Version Control"
  Layers,    // Example: For "Frameworks" or "Stacks"
  // Add more icons here as needed for new categories
};

export const AVAILABLE_ICONS_FOR_TABS = Object.keys(LUCIDE_ICON_MAP) as (keyof typeof LUCIDE_ICON_MAP)[];


export interface CategoryTab {
  id: string;
  label: string;
  iconName: keyof typeof LUCIDE_ICON_MAP;
}

// Initial categories, admin panel will be able to add more (in-memory for this demo)
export let CATEGORIES: CategoryTab[] = [
  { id: "html", label: "HTML", iconName: "CodeXml" },
  { id: "css", label: "CSS", iconName: "Palette" },
  { id: "javascript", label: "JavaScript", iconName: "Braces" },
];

export interface VideoItem {
  id: string; // YouTube video ID
  title: string;
  thumbnailUrl: string; // Full YouTube thumbnail URL
}

export interface PlaylistData {
  playlistId: string; // YouTube playlist ID (for linking, if needed)
  name: string;
  videos: VideoItem[];
}

const placeholderBase = "https://picsum.photos/seed";

// Initial video data, admin panel will be able to add more (in-memory for this demo)
export let SAMPLE_PLAYLIST_DATA: Record<string, PlaylistData> = {
  html: {
    playlistId: "PL4cUxeGkcC9ivBf_eKCPIAYXWzLlPA72V",
    name: "HTML Essentials",
    videos: [
      { id: "qz0aGYrrlhU", title: "HTML Crash Course For Beginners", thumbnailUrl: `https://i.ytimg.com/vi/qz0aGYrrlhU/hqdefault.jpg` },
      { id: "kUMe1FH4CHE", title: "Learn HTML – Full Tutorial for Beginners", thumbnailUrl: `https://i.ytimg.com/vi/kUMe1FH4CHE/hqdefault.jpg` },
      { id: "UB1O30fR-EE", title: "HTML Full Course - Build a Website Tutorial", thumbnailUrl: `https://i.ytimg.com/vi/UB1O30fR-EE/hqdefault.jpg` },
      { id: "MDLn5-zSQIF", title: "HTML & CSS Full Course for free", thumbnailUrl: `https://i.ytimg.com/vi/MDLn5-zSQIF/hqdefault.jpg` },
    ],
  },
  css: {
    playlistId: "PL4cUxeGkcC9gQeDH6xYhmO-db2mhoTSrT",
    name: "CSS Styling Techniques",
    videos: [
      { id: "1Rs2ND1ryYc", title: "CSS Crash Course For Absolute Beginners", thumbnailUrl: `https://i.ytimg.com/vi/1Rs2ND1ryYc/hqdefault.jpg` },
      { id: "wRNinF7YQqQ", title: "CSS Full Course - Includes Flexbox and Grid", thumbnailUrl: `https://i.ytimg.com/vi/wRNinF7YQqQ/hqdefault.jpg` },
      { id: "OEV8gHsIEN8", title: "Learn CSS in 20 Minutes", thumbnailUrl: `https://i.ytimg.com/vi/OEV8gHsIEN8/hqdefault.jpg` },
      { id: "J35jug1uHzE", title: "CSS Grid Layout Crash Course", thumbnailUrl: `https://i.ytimg.com/vi/J35jug1uHzE/hqdefault.jpg` },
    ],
  },
  javascript: {
    playlistId: "PL4cUxeGkcC9jx2TTZk3IGWKSbtugYdrlL",
    name: "JavaScript Fundamentals",
    videos: [
      { id: "W6NZfCO5SIk", title: "JavaScript Tutorial for Beginners", thumbnailUrl: `https://i.ytimg.com/vi/W6NZfCO5SIk/hqdefault.jpg` },
      { id: "jS4aFq5-91M", title: "Learn JavaScript - Full Course for Beginners", thumbnailUrl: `https://i.ytimg.com/vi/jS4aFq5-91M/hqdefault.jpg` },
      { id: "PkZNo7MFNFg", title: "JavaScript Crash Course For Beginners", thumbnailUrl: `https://i.ytimg.com/vi/PkZNo7MFNFg/hqdefault.jpg` },
      { id: "htznMG rebord", title: "Modern JavaScript Tutorial", thumbnailUrl: `https://i.ytimg.com/vi/htznMGyB00A/hqdefault.jpg` }, // Corrected ID
    ],
  },
};

export type ResourceType = 'documentation' | 'article' | 'tool' | 'guide';
export const RESOURCE_LINK_TYPES: ResourceType[] = ['documentation', 'article', 'tool', 'guide'];

export interface ResourceLink {
  id: string;
  title: string;
  url: string;
  description: string;
  type: ResourceType;
}

// Initial resource data, admin panel will be able to add more (in-memory for this demo)
export let SAMPLE_RESOURCES_DATA: Record<string, ResourceLink[]> = {
  html: [
    { id: 'html-mdn', title: 'MDN Web Docs: HTML', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML', description: 'Comprehensive HTML documentation by Mozilla.', type: 'documentation' },
    { id: 'html-w3schools', title: 'W3Schools HTML Tutorial', url: 'https://www.w3schools.com/html/', description: 'Interactive HTML tutorials and references.', type: 'guide' },
    { id: 'html-validator', title: 'W3C Markup Validation Service', url: 'https://validator.w3.org/', description: 'Check the markup validity of HTML documents.', type: 'tool' },
  ],
  css: [
    { id: 'css-mdn', title: 'MDN Web Docs: CSS', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS', description: 'In-depth CSS documentation and guides.', type: 'documentation' },
    { id: 'css-tricks', title: 'CSS-Tricks', url: 'https://css-tricks.com/', description: 'Articles, guides, and almanac for CSS techniques.', type: 'article' },
    { id: 'css-flexbox-guide', title: 'A Complete Guide to Flexbox', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', description: 'Detailed guide on CSS Flexbox.', type: 'guide' },
  ],
  javascript: [
    { id: 'js-mdn', title: 'MDN Web Docs: JavaScript', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', description: 'The ultimate JavaScript reference by Mozilla.', type: 'documentation' },
    { id: 'js-eloquent', title: 'Eloquent JavaScript', url: 'https://eloquentjavascript.net/', description: 'A modern introduction to programming with JavaScript.', type: 'guide' },
    { id: 'js-info', title: 'The Modern JavaScript Tutorial', url: 'https://javascript.info/', description: 'From basic to advanced topics with simple, but detailed explanations.', type: 'guide' },
  ],
};

// In-memory data management functions

export const getCategories = (): CategoryTab[] => JSON.parse(JSON.stringify(CATEGORIES));
export const getPlaylistData = (): Record<string, PlaylistData> => JSON.parse(JSON.stringify(SAMPLE_PLAYLIST_DATA));
export const getResourcesData = (): Record<string, ResourceLink[]> => JSON.parse(JSON.stringify(SAMPLE_RESOURCES_DATA));

export const addCategory = (newCategoryData: { id: string; label: string; iconName: keyof typeof LUCIDE_ICON_MAP }): CategoryTab | null => {
  if (CATEGORIES.find(cat => cat.id === newCategoryData.id || cat.label.toLowerCase() === newCategoryData.label.toLowerCase())) {
    console.warn("Category with this ID or label already exists");
    return null;
  }
  const newCategory: CategoryTab = { ...newCategoryData };
  CATEGORIES.push(newCategory);
  
  if (!SAMPLE_PLAYLIST_DATA[newCategory.id]) {
    SAMPLE_PLAYLIST_DATA[newCategory.id] = { playlistId: `custom-${newCategory.id}`, name: `${newCategory.label} Videos`, videos: [] };
  }
  if (!SAMPLE_RESOURCES_DATA[newCategory.id]) {
    SAMPLE_RESOURCES_DATA[newCategory.id] = [];
  }
  return JSON.parse(JSON.stringify(newCategory));
};

export const updateCategory = (categoryId: string, updatedData: Partial<Omit<CategoryTab, 'id'>>): CategoryTab | null => {
  const categoryIndex = CATEGORIES.findIndex(cat => cat.id === categoryId);
  if (categoryIndex === -1) {
    console.warn("Category not found for update");
    return null;
  }
  // Check for label uniqueness if label is being changed
  if (updatedData.label && CATEGORIES.some(cat => cat.label.toLowerCase() === updatedData.label!.toLowerCase() && cat.id !== categoryId)) {
    console.warn("Another category with this label already exists.");
    return null;
  }

  CATEGORIES[categoryIndex] = { ...CATEGORIES[categoryIndex], ...updatedData };

  // Update playlist name if category label changed and playlist name was default
  if (updatedData.label && SAMPLE_PLAYLIST_DATA[categoryId]) {
     const oldLabel = CATEGORIES.find(c => c.id === categoryId)?.label || updatedData.label; // A bit tricky to get old label if it's also being updated
     if (SAMPLE_PLAYLIST_DATA[categoryId].name === `${oldLabel} Videos` || SAMPLE_PLAYLIST_DATA[categoryId].name.endsWith(" Videos")) { // simple check
        SAMPLE_PLAYLIST_DATA[categoryId].name = `${updatedData.label} Videos`;
     }
  }
  return JSON.parse(JSON.stringify(CATEGORIES[categoryIndex]));
};

export const deleteCategory = (categoryId: string): CategoryTab | null => {
  const categoryIndex = CATEGORIES.findIndex(cat => cat.id === categoryId);
  if (categoryIndex === -1) {
    console.warn("Category not found for deletion");
    return null;
  }
  const deletedCategory = CATEGORIES.splice(categoryIndex, 1)[0];
  delete SAMPLE_PLAYLIST_DATA[categoryId];
  delete SAMPLE_RESOURCES_DATA[categoryId];
  return JSON.parse(JSON.stringify(deletedCategory));
};


export const addVideoToPlaylist = (categoryId: string, video: VideoItem): VideoItem | null => {
  if (SAMPLE_PLAYLIST_DATA[categoryId]) {
    if (SAMPLE_PLAYLIST_DATA[categoryId].videos.find(v => v.id === video.id)) {
        console.warn("Video with this ID already exists in the playlist.");
        return null;
    }
    SAMPLE_PLAYLIST_DATA[categoryId].videos.push(video);
    return JSON.parse(JSON.stringify(video));
  }
  console.warn("Category not found for adding video");
  return null;
};

export const updateVideoInPlaylist = (categoryId: string, videoId: string, updatedData: Partial<Omit<VideoItem, 'id'>>): VideoItem | null => {
    if (SAMPLE_PLAYLIST_DATA[categoryId]) {
        const videoIndex = SAMPLE_PLAYLIST_DATA[categoryId].videos.findIndex(v => v.id === videoId);
        if (videoIndex !== -1) {
            SAMPLE_PLAYLIST_DATA[categoryId].videos[videoIndex] = { ...SAMPLE_PLAYLIST_DATA[categoryId].videos[videoIndex], ...updatedData };
            return JSON.parse(JSON.stringify(SAMPLE_PLAYLIST_DATA[categoryId].videos[videoIndex]));
        }
    }
    console.warn("Video or category not found for update");
    return null;
};

export const deleteVideoFromPlaylist = (categoryId: string, videoId: string): VideoItem | null => {
    if (SAMPLE_PLAYLIST_DATA[categoryId]) {
        const videoIndex = SAMPLE_PLAYLIST_DATA[categoryId].videos.findIndex(v => v.id === videoId);
        if (videoIndex !== -1) {
            const deletedVideo = SAMPLE_PLAYLIST_DATA[categoryId].videos.splice(videoIndex, 1)[0];
            return JSON.parse(JSON.stringify(deletedVideo));
        }
    }
    console.warn("Video or category not found for deletion");
    return null;
};


export const addResourceLink = (categoryId: string, resource: ResourceLink): ResourceLink | null => {
  if (SAMPLE_RESOURCES_DATA[categoryId]) {
     if (SAMPLE_RESOURCES_DATA[categoryId].find(r => r.id === resource.id || r.url === resource.url)) {
        console.warn("Resource with this ID or URL already exists in the category.");
        return null;
    }
    SAMPLE_RESOURCES_DATA[categoryId].push(resource);
    return JSON.parse(JSON.stringify(resource));
  }
  console.warn("Category not found for adding resource");
  return null;
};

export const updateResourceLink = (categoryId: string, resourceId: string, updatedData: Partial<Omit<ResourceLink, 'id'>>): ResourceLink | null => {
    if (SAMPLE_RESOURCES_DATA[categoryId]) {
        const resourceIndex = SAMPLE_RESOURCES_DATA[categoryId].findIndex(r => r.id === resourceId);
        if (resourceIndex !== -1) {
            // Check for URL uniqueness if URL is being changed
            if (updatedData.url && SAMPLE_RESOURCES_DATA[categoryId].some(r => r.url === updatedData.url && r.id !== resourceId)) {
                console.warn("Another resource with this URL already exists in this category.");
                return null;
            }
            SAMPLE_RESOURCES_DATA[categoryId][resourceIndex] = { ...SAMPLE_RESOURCES_DATA[categoryId][resourceIndex], ...updatedData };
            return JSON.parse(JSON.stringify(SAMPLE_RESOURCES_DATA[categoryId][resourceIndex]));
        }
    }
    console.warn("Resource or category not found for update");
    return null;
};

export const deleteResourceLink = (categoryId: string, resourceId: string): ResourceLink | null => {
    if (SAMPLE_RESOURCES_DATA[categoryId]) {
        const resourceIndex = SAMPLE_RESOURCES_DATA[categoryId].findIndex(r => r.id === resourceId);
        if (resourceIndex !== -1) {
            const deletedResource = SAMPLE_RESOURCES_DATA[categoryId].splice(resourceIndex, 1)[0];
            return JSON.parse(JSON.stringify(deletedResource));
        }
    }
    console.warn("Resource or category not found for deletion");
    return null;
};
