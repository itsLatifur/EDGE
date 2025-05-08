
import type { PlaylistType, PlaylistCollection, VideoCollection, ContentItem, PlaylistSummary, Playlist } from '@/types';
import { Code, Palette, Zap } from 'lucide-react';
import React from 'react';
import playlistSourcesData from './playlist-sources.json'; // Import the new JSON data

interface PlaylistSourceItem {
  id: string; // YouTube Playlist ID
  youtubePlaylistUrl: string;
  title: string;
  category: PlaylistType;
  description?: string;
  creator?: string;
}

const playlistSources: PlaylistSourceItem[] = playlistSourcesData;

// Helper function to extract YouTube Playlist ID from URL
export const extractPlaylistIdFromUrl = (url: string): string | null => {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname === 'www.youtube.com' || parsedUrl.hostname === 'youtube.com') {
      const listId = parsedUrl.searchParams.get('list');
      return listId;
    }
  } catch (error) {
    console.error('Invalid URL for playlist ID extraction:', url, error);
  }
  return null;
};


// --- 1. Playlist Summaries (for browsing) ---
// Dynamically build playlistCategories from playlistSources
export const playlistCategories: PlaylistCollection = {
  html: [],
  css: [],
  javascript: [],
};

playlistSources.forEach(source => {
  // The ID from playlistSources.json is already the YouTube Playlist ID
  const playlistId = source.id; 
  if (!playlistId) {
    console.warn(`Could not determine playlist ID for source: ${source.title} - URL: ${source.youtubePlaylistUrl}`);
    return;
  }

  const summary: PlaylistSummary = {
    id: playlistId, // Use the extracted/provided YouTube Playlist ID
    title: source.title,
    category: source.category,
    description: source.description,
    creator: source.creator,
  };
  if (playlistCategories[source.category]) {
    playlistCategories[source.category].push(summary);
  } else {
    console.warn(`Unknown category ${source.category} for playlist ${source.title}`);
  }
});


// --- 2. Video Data (indexed by YouTube playlist ID) ---
// IMPORTANT: The keys here MUST match the 'id' from playlist-sources.json (which are YouTube Playlist IDs)
// The video 'id' fields are YouTube Video IDs.
// 'playlistId' for each ContentItem should be the YouTube Playlist ID it belongs to.
export const playlistVideos: VideoCollection = {
  // HTML Playlists - IDs match those in playlist-sources.json
  'PLDoPjvoNmCo_E_st7g3hGj9hBNP5m_4up': [ // HTML Full Course (freeCodeCamp.org)
    { id: 'UB1O30fR-EE', playlistId: 'PLDoPjvoNmCo_E_st7g3hGj9hBNP5m_4up', title: 'HTML Full Course - Build a Website Tutorial', url: 'https://www.youtube.com/embed/UB1O30fR-EE', duration: 10800, description: 'Learn HTML by building a website.' },
    { id: 'kUMe1FH4paE', playlistId: 'PLDoPjvoNmCo_E_st7g3hGj9hBNP5m_4up', title: 'Learn HTML – Full Tutorial for Beginners (2022)', url: 'https://www.youtube.com/embed/kUMe1FH4paE', duration: 3600, description: 'Another great HTML tutorial for beginners.' },
  ],
  'PL4cUxeGkcC9gQeDH6xYhmOdu94Ry7xSoV': [ // HTML & CSS Crash Course (Traversy Media)
    { id: 'XiQ9rkwlWbo', playlistId: 'PL4cUxeGkcC9gQeDH6xYhmOdu94Ry7xSoV', title: 'HTML Crash Course For Absolute Beginners', url: 'https://www.youtube.com/embed/yfoY53QXEnI', duration: 3600, description: 'A beginner-friendly HTML crash course. (Note: Video ID changed for variety if original XiQ9... was just HTML)' },
    { id: 'qz0hrhGlgXg', playlistId: 'PL4cUxeGkcC9gQeDH6xYhmOdu94Ry7xSoV', title: 'CSS Crash Course For Absolute Beginners', url: 'https://www.youtube.com/embed/yfoY53QXEnI', duration: 5400, description: 'A beginner-friendly CSS crash course.' },
  ],
  'PL4-IKwSrm2tvK0f5N7f9f3j0HxVW7sJ0j': [ // Semantic HTML (Kevin Powell)
    { id: 'bWPMSSsVdPk', playlistId: 'PL4-IKwSrm2tvK0f5N7f9f3j0HxVW7sJ0j', title: 'Stop using divs for everything!', url: 'https://www.youtube.com/embed/bWPMSSsVdPk', duration: 945, description: 'Learn the importance of semantic HTML.' },
    { id: 'JsVj0ks7_Zw', playlistId: 'PL4-IKwSrm2tvK0f5N7f9f3j0HxVW7sJ0j', title: 'Understanding the section element', url: 'https://www.youtube.com/embed/JsVj0ks7_Zw', duration: 600, description: 'Deep dive into the <section> tag.' },
  ],

  // CSS Playlists - IDs match those in playlist-sources.json
  'PLDoPjvoNmCo7l1UE2m2t9x6PNTi0J0x-M': [ // CSS Full Course (freeCodeCamp.org)
    { id: 'OXGznpKZ_sA', playlistId: 'PLDoPjvoNmCo7l1UE2m2t9x6PNTi0J0x-M', title: 'CSS Full Course - Includes Flexbox and Grid', url: 'https://www.youtube.com/embed/OXGznpKZ_sA', duration: 14400, description: 'A complete guide to CSS.' },
  ],
  'PL4-IKwSrm2ttg_0z_po72gC7z4wB9Tj_A': [ // Flexbox Simplified (Kevin Powell)
    { id: 'u044iM9xsWU', playlistId: 'PL4-IKwSrm2ttg_0z_po72gC7z4wB9Tj_A', title: 'Flexbox fundamentals', url: 'https://www.youtube.com/embed/u044iM9xsWU', duration: 1200, description: 'Introduction to Flexbox concepts.' },
    { id: 'Y8zMYaD16w8', playlistId: 'PL4-IKwSrm2ttg_0z_po72gC7z4wB9Tj_A', title: 'align-items vs justify-content', url: 'https://www.youtube.com/embed/Y8zMYaD16w8', duration: 900, description: 'Understanding Flexbox alignment.' },
  ],
  'PL4-IKwSrm2tu_8yYDAh_xP7k0L2k38_tI': [ // CSS Grid Demystified (Kevin Powell)
     { id: 'rg7Fvvl3taU', playlistId: 'PL4-IKwSrm2tu_8yYDAh_xP7k0L2k38_tI', title: 'Introduction to CSS Grid', url: 'https://www.youtube.com/embed/rg7Fvvl3taU', duration: 1500, description: 'Getting started with CSS Grid.' },
     { id: 'Eu354gXW40g', playlistId: 'PL4-IKwSrm2tu_8yYDAh_xP7k0L2k38_tI', title: 'Making CSS Grid layouts responsive', url: 'https://www.youtube.com/embed/Eu354gXW40g', duration: 1100, description: 'Responsive design with Grid.' },
  ],
  'PL4cUxeGkcC9h_sYJ3Jz4hPF5HASQnS3Yt': [ // CSS Animations & Transitions (Traversy Media)
     { id: 'zH5pgsAQUqs', playlistId: 'PL4cUxeGkcC9h_sYJ3Jz4hPF5HASQnS3Yt', title: 'CSS Transitions & Animations Crash Course', url: 'https://www.youtube.com/embed/zH5pgsAQUqs', duration: 1050, description: 'Learn CSS transitions and keyframe animations.' },
  ],

  // JavaScript Playlists - IDs match those in playlist-sources.json
  'PLDoPjvoNmCo_b2v25SjHMrjQiA9H9LhW-': [ // JavaScript Full Course (freeCodeCamp.org)
     { id: 'PkZNo7MFNFo', playlistId: 'PLDoPjvoNmCo_b2v25SjHMrjQiA9H9LhW-', title: 'JavaScript Programming - Full Course', url: 'https://www.youtube.com/embed/PkZNo7MFNFo', duration: 21600, description: 'Learn JavaScript from beginner to advanced.' },
  ],
  'PL4cUxeGkcC9gfoKa5la9dsdCNpuey2s-V': [ // JavaScript DOM Manipulation (Traversy Media)
     { id: '0ik6X4DJKCc', playlistId: 'PL4cUxeGkcC9gfoKa5la9dsdCNpuey2s-V', title: 'JavaScript DOM Crash Course - Part 1', url: 'https://www.youtube.com/embed/0ik6X4DJKCc', duration: 1800, description: 'Introduction to DOM manipulation.' },
     { id: 'w7ejDZ8SWv8', playlistId: 'PL4cUxeGkcC9gfoKa5la9dsdCNpuey2s-V', title: 'JavaScript DOM Crash Course - Part 2', url: 'https://www.youtube.com/embed/w7ejDZ8SWv8', duration: 1500, description: 'More DOM manipulation techniques.' },
  ],
  'PL4cUxeGkcC9jAhrjt2i1uS7e07pG9pxp4': [ // Asynchronous JavaScript (The Net Ninja)
     { id: 'ZcQyJ-gxke0', playlistId: 'PL4cUxeGkcC9jAhrjt2i1uS7e07pG9pxp4', title: 'Async JS Crash Course - Callbacks, Promises, Async Await', url: 'https://www.youtube.com/embed/ZcQyJ-gxke0', duration: 2500, description: 'Handling asynchronous operations in JS.' },
  ],
  'PL0vfts4VzfNiI1BsIK5u7LpPaIDgS_3sC': [ // Modern JavaScript (ES6+) (Fireship)
     { id: 'fh9iiRCsqEo', playlistId: 'PL0vfts4VzfNiI1BsIK5u7LpPaIDgS_3sC', title: 'JavaScript ES6 in 10 Minutes', url: 'https://www.youtube.com/embed/fh9iiRCsqEo', duration: 600, description: 'Quick overview of modern JS features.' },
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

// Find video details across all playlists (YouTube Video ID)
// The ContentItem.playlistId will be the YouTube Playlist ID
export const findVideoDetails = (videoId: string): { video: ContentItem; playlistId: string /* YouTube Playlist ID */ } | undefined => {
  for (const playlistKey in playlistVideos) { // playlistKey is YouTube Playlist ID
    const videosInPlaylist = playlistVideos[playlistKey];
    const video = videosInPlaylist.find(v => v.id === videoId); // video.id is YouTube Video ID
    if (video) {
      // Ensure the video object itself contains the correct YouTube Playlist ID
      return { video: { ...video, playlistId: playlistKey }, playlistId: playlistKey };
    }
  }
  return undefined;
}

// Find playlist summary details by YouTube Playlist ID
export const findPlaylistSummary = (youtubePlaylistId: string): PlaylistSummary | undefined => {
    for (const category in playlistCategories) {
        const summary = playlistCategories[category as PlaylistType].find(p => p.id === youtubePlaylistId);
        if (summary) return summary;
    }
    return undefined;
}

// Get full playlist details (summary + videos) by YouTube Playlist ID
export const getPlaylistDetails = (youtubePlaylistId: string): Playlist | null => {
    const summary = findPlaylistSummary(youtubePlaylistId);
    // Videos are keyed by YouTube Playlist ID
    const videos = playlistVideos[youtubePlaylistId]?.map(v => ({...v, playlistId: youtubePlaylistId})) || [];
    if (!summary) return null;
    return { ...summary, videos };
}
