// src/lib/constants.ts
export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/videos", label: "Videos" },
  { href: "/resources", label: "Resources" },
];

export const CATEGORIES = [
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "javascript", label: "JavaScript" },
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

// Using generic placeholder thumbnails for simplicity with next/image
// In a real app, these would be actual YouTube thumbnail URLs.
// https://i.ytimg.com/vi/<VIDEO_ID>/hqdefault.jpg for example.
// For next/image with external URLs, ensure hostname is in next.config.js if not using picsum.
// Since picsum is already configured, we'll use it for placeholders.
// NOTE: The original request mentioned integrating a "selected YouTube playlist".
// The video IDs provided here are real and can be used in an iframe.
// The thumbnail URLs are constructed as if they were real YouTube thumbnails for better context.
// However, to adhere strictly to placeholder image guidelines for `next/image`, picsum would be used if these were dynamic.
// For this case, as they are static string URLs, they might work directly if `i.ytimg.com` is whitelisted.
// Let's assume `i.ytimg.com` needs to be added to `next.config.js` remotePatterns if these were to be used with `next/image`.
// For now, these URLs will be used directly by `img` tags or as background if `next/image` is problematic without config change.
// To be safe and use `next/image` correctly with `data-ai-hint` for placeholders, let's switch to picsum.

const placeholderBase = "https://picsum.photos/seed";

export const SAMPLE_PLAYLIST_DATA: Record<string, PlaylistData> = {
  html: {
    playlistId: "PL4cUxeGkcC9ivBf_eKCPIAYXWzLlPA72V",
    name: "HTML Essentials",
    videos: [
      { id: "qz0aGYrrlhU", title: "HTML Crash Course For Beginners", thumbnailUrl: `${placeholderBase}/html1/160/90` },
      { id: "kUMe1FH4CHE", title: "Learn HTML – Full Tutorial for Beginners", thumbnailUrl: `${placeholderBase}/html2/160/90` },
      { id: "UB1O30fR-EE", title: "HTML Full Course - Build a Website Tutorial", thumbnailUrl: `${placeholderBase}/html3/160/90` },
      { id: "MDLn5-zSQIF", title: "HTML & CSS Full Course for free", thumbnailUrl: `${placeholderBase}/html4/160/90` },
    ],
  },
  css: {
    playlistId: "PL4cUxeGkcC9gQeDH6xYhmO-db2mhoTSrT",
    name: "CSS Styling Techniques",
    videos: [
      { id: "1Rs2ND1ryYc", title: "CSS Crash Course For Absolute Beginners", thumbnailUrl: `${placeholderBase}/css1/160/90` },
      { id: "wRNinF7YQqQ", title: "CSS Full Course - Includes Flexbox and Grid", thumbnailUrl: `${placeholderBase}/css2/160/90` },
      { id: "OEV8gHsIEN8", title: "Learn CSS in 20 Minutes", thumbnailUrl: `${placeholderBase}/css3/160/90` },
      { id: "J35jug1uHzE", title: "CSS Grid Layout Crash Course", thumbnailUrl: `${placeholderBase}/css4/160/90` },
    ],
  },
  javascript: {
    playlistId: "PL4cUxeGkcC9jx2TTZk3IGWKSbtugYdrlL",
    name: "JavaScript Fundamentals",
    videos: [
      { id: "W6NZfCO5SIk", title: "JavaScript Tutorial for Beginners", thumbnailUrl: `${placeholderBase}/js1/160/90` },
      { id: "jS4aFq5-91M", title: "Learn JavaScript - Full Course for Beginners", thumbnailUrl: `${placeholderBase}/js2/160/90` },
      { id: "PkZNo7MFNFg", title: "JavaScript Crash Course For Beginners", thumbnailUrl: `${placeholderBase}/js3/160/90` },
      { id: "htznMG rebord", title: "Modern JavaScript Tutorial", thumbnailUrl: `${placeholderBase}/js4/160/90` },
    ],
  },
};

export interface ResourceLink {
  id: string;
  title: string;
  url: string;
  description: string;
  type: 'documentation' | 'article' | 'tool' | 'guide';
}

export const SAMPLE_RESOURCES_DATA: Record<string, ResourceLink[]> = {
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
