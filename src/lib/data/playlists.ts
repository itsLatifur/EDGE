
import type { Playlist, PlaylistType } from '@/types';
import { Code, Palette, Zap } from 'lucide-react';

// Moved mock data here for better organization and reusability
export const mockPlaylists: Record<PlaylistType, Playlist> = {
  html: {
    id: 'html',
    title: 'HTML Learning Path',
    description: 'Master the structure of web pages with HTML.',
    icon: Code,
    videos: [
       {id: 'html1', title: 'HTML Basics: Tags and Structure', url: 'https://www.youtube.com/embed/ok-plXXHl2w', duration: 1835, description: 'Learn the foundational tags and structure of HTML.'},
       {id: 'html2', title: 'Creating Interactive HTML Forms', url: 'https://www.youtube.com/embed/YwbIeMlxZAU', duration: 1210, description: 'Understand how to create interactive forms for user input.'},
       {id: 'html3', title: 'Semantic HTML for Accessibility & SEO', url: 'https://www.youtube.com/embed/bWPMSSsVdPk', duration: 945, description: 'Improve accessibility and SEO with semantic elements.'},
       {id: 'html4', title: 'HTML Tables for Data Display', url: 'https://www.youtube.com/embed/N692qBST32c', duration: 1100, description: 'Learn how to structure and display tabular data effectively.'},
       {id: 'html5', title: 'Embedding Media: Images & Video', url: 'https://www.youtube.com/embed/3_lAb8m9MpY', duration: 780, description: 'Understand how to embed images and videos into your web pages.'},
     ]
  },
  css: {
    id: 'css',
    title: 'CSS Learning Path',
    description: 'Style your web pages and create stunning layouts.',
    icon: Palette,
    videos: [
      {id: 'css1', title: 'CSS Fundamentals: Selectors & Properties', url: 'https://www.youtube.com/embed/1Rs2ND1ryYc', duration: 2450, description: 'Grasp the core concepts of CSS styling, selectors, and basic properties.'},
      {id: 'css2', title: 'Mastering Layout with Flexbox', url: 'https://www.youtube.com/embed/fYq5PXgSsbE', duration: 1560, description: 'A comprehensive guide to designing flexible layouts using Flexbox.'},
      {id: 'css3', title: 'Building Complex Layouts with CSS Grid', url: 'https://www.youtube.com/embed/jV8B24rSN5o', duration: 1880, description: 'Learn to build complex, two-dimensional layouts easily with CSS Grid.'},
      {id: 'css4', title: 'Responsive Design Principles', url: 'https://www.youtube.com/embed/srvUrASWNUc', duration: 1300, description: 'Make your websites look great on all devices using media queries.'},
      {id: 'css5', title: 'CSS Transitions and Animations', url: 'https://www.youtube.com/embed/zH5pgsAQUqs', duration: 1050, description: 'Add life to your web pages with smooth transitions and animations.'},
     ]
  },
  javascript: {
    id: 'javascript',
    title: 'JavaScript Learning Path',
    description: 'Add interactivity and logic to your websites.',
    icon: Zap,
    videos: [
      {id: 'js1', title: 'JavaScript Introduction: Variables & Data Types', url: 'https://www.youtube.com/embed/W6NZfCO5SIk', duration: 3660, description: 'Start coding with the basics of JavaScript, including variables and data types.'},
      {id: 'js2', title: 'DOM Manipulation: Interacting with HTML', url: 'https://www.youtube.com/embed/y17RuWkWdn8', duration: 2140, description: 'Learn how to select and modify HTML elements dynamically using JavaScript.'},
      {id: 'js3', title: 'Asynchronous JavaScript: Callbacks, Promises, Async/Await', url: 'https://www.youtube.com/embed/8aGhZQkoFbQ', duration: 2790, description: 'Understand how to handle asynchronous operations effectively in JavaScript.'},
      {id: 'js4', title: 'Working with Arrays and Objects', url: 'https://www.youtube.com/embed/R8rmfD9Y5-c', duration: 1950, description: 'Learn essential methods for manipulating arrays and objects in JS.'},
      {id: 'js5', title: 'Introduction to ES6+ Features', url: 'https://www.youtube.com/embed/NCwa_xi0ZQk', duration: 1600, description: 'Explore modern JavaScript features like arrow functions, destructuring, and more.'},
     ]
  },
};
