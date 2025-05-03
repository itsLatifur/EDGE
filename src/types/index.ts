
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  points: number;
  badges: string[]; // Array of badge identifiers (e.g., 'html-basics-completed')
  createdAt: Date;
  // Add other profile fields as needed
}

export interface UserProgress {
    [videoId: string]: {
        watchedTime: number;
        lastWatched: Date | any; // Allow Firestore Timestamp type
        completed: boolean;
    }
}

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

