
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl?: string; // Optional avatar URL
  points: number;
  badges: string[]; // Array of badge identifiers (e.g., 'html-basics-completed')
  createdAt: Date; // Use JS Date object in the application
  // Add other profile fields as needed
}

export interface UserProgressEntry {
    watchedTime: number;
    lastWatched: Date; // Consistently use JS Date object in application logic
    completed: boolean;
}

export interface UserProgress {
    [videoId: string]: UserProgressEntry;
}

// --- Content Structure ---

export interface ContentItem {
  id: string;
  title: string;
  url: string;
  duration: number; // Duration in seconds
  description?: string; // Optional description
}

export type PlaylistType = 'html' | 'css' | 'javascript';

export interface Playlist {
  id: PlaylistType;
  title: string;
  description: string;
  videos: ContentItem[];
  icon: React.ElementType; // Icon component
}
