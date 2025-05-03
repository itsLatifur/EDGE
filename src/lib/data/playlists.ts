
import type { PlaylistType, PlaylistCollection, VideoCollection, ContentItem, PlaylistSummary, Playlist } from '@/types';
import { Code, Palette, Zap } from 'lucide-react';
import React from 'react';

// --- 1. Playlist Summaries (for browsing) ---
export const playlistCategories: PlaylistCollection = {
  html: [
    { id: 'html-fcc', title: 'HTML Full Course', category: 'html', description: 'Comprehensive HTML course covering all essential tags and concepts.', creator: 'freeCodeCamp.org' },
    { id: 'html-traversy', title: 'HTML Crash Course For Beginners', category: 'html', description: 'A faster-paced crash course on HTML basics.', creator: 'Traversy Media' },
    { id: 'html-semantic', title: 'Semantic HTML Explained', category: 'html', description: 'Focus on using semantic elements for better structure and accessibility.', creator: 'Kevin Powell' },
  ],
  css: [
    { id: 'css-fcc', title: 'CSS Full Course', category: 'css', description: 'In-depth CSS course covering selectors, properties, layout, and more.', creator: 'freeCodeCamp.org' },
    { id: 'css-kevin-flex', title: 'Flexbox Simplified', category: 'css', description: 'Master Flexbox layout with clear explanations.', creator: 'Kevin Powell' },
    { id: 'css-kevin-grid', title: 'CSS Grid Demystified', category: 'css', description: 'Learn the powerful CSS Grid layout system.', creator: 'Kevin Powell' },
    { id: 'css-traversy-animations', title: 'CSS Animations & Transitions', category: 'css', description: 'Add smooth animations and transitions to your sites.', creator: 'Traversy Media' },
  ],
  javascript: [
    { id: 'js-fcc', title: 'JavaScript Full Course', category: 'javascript', description: 'Complete JavaScript course from basics to advanced topics.', creator: 'freeCodeCamp.org' },
    { id: 'js-traversy-dom', title: 'DOM Manipulation Crash Course', category: 'javascript', description: 'Learn how to interact with HTML using JavaScript.', creator: 'Traversy Media' },
    { id: 'js-ninja-async', title: 'Asynchronous JavaScript', category: 'javascript', description: 'Understand callbacks, promises, and async/await.', creator: 'The Net Ninja' },
    { id: 'js-fireship-es6', title: 'Modern JavaScript Features (ES6+)', category: 'javascript', description: 'Quick overview of modern JS syntax and features.', creator: 'Fireship' },
  ],
};

// --- 2. Video Data (indexed by playlist ID) ---
export const playlistVideos: VideoCollection = {
  // HTML Playlists
  'html-fcc': [
    { id: 'UB1O30fR-EE', playlistId: 'html-fcc', title: 'HTML Full Course - Build a Website Tutorial', url: 'https://www.youtube.com/embed/UB1O30fR-EE', duration: 10800, description: 'Learn HTML by building a website.' }, // Placeholder duration
  ],
  'html-traversy': [
    { id: 'XiQ9rkwlWbo', playlistId: 'html-traversy', title: 'HTML Crash Course For Absolute Beginners', url: 'https://www.youtube.com/embed/XiQ9rkwlWbo', duration: 3600, description: 'A beginner-friendly HTML crash course.' }, // Placeholder duration
  ],
  'html-semantic': [
    { id: 'bWPMSSsVdPk', playlistId: 'html-semantic', title: 'Stop using divs for everything!', url: 'https://www.youtube.com/embed/bWPMSSsVdPk', duration: 945, description: 'Learn the importance of semantic HTML.' },
    { id: 'JsVj0ks7_Zw', playlistId: 'html-semantic', title: 'Understanding the section element', url: 'https://www.youtube.com/embed/JsVj0ks7_Zw', duration: 600, description: 'Deep dive into the <section> tag.' }, // Placeholder duration
    // Add more semantic HTML videos...
  ],
  // CSS Playlists
  'css-fcc': [
    { id: 'OXGznpKZ_sA', playlistId: 'css-fcc', title: 'CSS Full Course - Includes Flexbox and Grid', url: 'https://www.youtube.com/embed/OXGznpKZ_sA', duration: 14400, description: 'A complete guide to CSS.' }, // Placeholder duration
  ],
  'css-kevin-flex': [
    { id: 'u044iM9xsWU', playlistId: 'css-kevin-flex', title: 'Flexbox fundamentals', url: 'https://www.youtube.com/embed/u044iM9xsWU', duration: 1200, description: 'Introduction to Flexbox concepts.' }, // Placeholder duration
    { id: 'Y8zMYaD16w8', playlistId: 'css-kevin-flex', title: 'align-items vs justify-content', url: 'https://www.youtube.com/embed/Y8zMYaD16w8', duration: 900, description: 'Understanding Flexbox alignment.' }, // Placeholder duration
    // Add more Flexbox videos...
  ],
  'css-kevin-grid': [
     { id: 'rg7Fvvl3taU', playlistId: 'css-kevin-grid', title: 'Introduction to CSS Grid', url: 'https://www.youtube.com/embed/rg7Fvvl3taU', duration: 1500, description: 'Getting started with CSS Grid.' }, // Placeholder duration
     { id: 'Eu354gXW40g', playlistId: 'css-kevin-grid', title: 'Making CSS Grid layouts responsive', url: 'https://www.youtube.com/embed/Eu354gXW40g', duration: 1100, description: 'Responsive design with Grid.' }, // Placeholder duration
     // Add more Grid videos...
  ],
  'css-traversy-animations': [
     { id: 'zH5pgsAQUqs', playlistId: 'css-traversy-animations', title: 'CSS Transitions & Animations Crash Course', url: 'https://www.youtube.com/embed/zH5pgsAQUqs', duration: 1050, description: 'Learn CSS transitions and keyframe animations.' },
     // Add more animation videos...
  ],
  // JavaScript Playlists
  'js-fcc': [
     { id: 'PkZNo7MFNFo', playlistId: 'js-fcc', title: 'JavaScript Programming - Full Course', url: 'https://www.youtube.com/embed/PkZNo7MFNFo', duration: 21600, description: 'Learn JavaScript from beginner to advanced.' }, // Placeholder duration
  ],
  'js-traversy-dom': [
     { id: '0ik6X4DJKCc', playlistId: 'js-traversy-dom', title: 'JavaScript DOM Crash Course - Part 1', url: 'https://www.youtube.com/embed/0ik6X4DJKCc', duration: 1800, description: 'Introduction to DOM manipulation.' }, // Placeholder duration
     { id: 'w7ejDZ8SWv8', playlistId: 'js-traversy-dom', title: 'JavaScript DOM Crash Course - Part 2', url: 'https://www.youtube.com/embed/w7ejDZ8SWv8', duration: 1500, description: 'More DOM manipulation techniques.' }, // Placeholder duration
     // Add more DOM videos...
  ],
  'js-ninja-async': [
     { id: 'ZcQyJ-gxke0', playlistId: 'js-ninja-async', title: 'Async JS Crash Course - Callbacks, Promises, Async Await', url: 'https://www.youtube.com/embed/ZcQyJ-gxke0', duration: 2500, description: 'Handling asynchronous operations in JS.' }, // Placeholder duration
     // Add more async videos...
  ],
  'js-fireship-es6': [
     { id: 'fh9iiRCsqEo', playlistId: 'js-fireship-es6', title: 'JavaScript ES6 in 10 Minutes', url: 'https://www.youtube.com/embed/fh9iiRCsqEo', duration: 600, description: 'Quick overview of modern JS features.' }, // Placeholder duration
     // Add more ES6+ videos...
  ],
};

// --- 3. Helper Functions ---

// Get the icon associated with a category
export const getPlaylistIcon = (category: PlaylistType): React.ElementType => {
  switch (category) {
    case 'html': return Code;
    case 'css': return Palette;
    case 'javascript': return Zap;
    default: return Code; // Default icon
  }
};

// Find video details across all playlists
export const findVideoDetails = (videoId: string): { video: ContentItem; playlistId: string } | undefined => {
  for (const playlistId in playlistVideos) {
    const videos = playlistVideos[playlistId];
    const video = videos.find(v => v.id === videoId);
    if (video) return { video, playlistId };
  }
  return undefined;
}

// Find playlist summary details by ID
export const findPlaylistSummary = (playlistId: string): PlaylistSummary | undefined => {
    for (const category in playlistCategories) {
        const summary = playlistCategories[category as PlaylistType].find(p => p.id === playlistId);
        if (summary) return summary;
    }
    return undefined;
}

// Get full playlist details (summary + videos) by ID
export const getPlaylistDetails = (playlistId: string): Playlist | null => {
    const summary = findPlaylistSummary(playlistId);
    const videos = playlistVideos[playlistId] || [];
    if (!summary) return null;
    return { ...summary, videos };
}
```