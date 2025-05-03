
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl?: string; // Optional avatar URL
  points: number;
  badges: string[]; // Array of badge identifiers (e.g., 'html-basics-completed')
  createdAt: Date; // Use JS Date object in the application
  // Gamification: Streaks
  currentStreak: number; // Number of consecutive days with activity
  longestStreak: number; // Longest streak achieved
  lastActivityDate?: Date | null; // Last date any progress was recorded
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

// --- Leaderboard ---
export interface LeaderboardEntry {
    uid: string;
    displayName: string;
    avatarUrl?: string;
    points: number;
    rank?: number; // Optional rank assigned after sorting
}

// --- Badges ---
// Define badge details if needed for display (optional)
export interface BadgeDetails {
    id: string;
    name: string;
    description: string;
    icon?: React.ElementType; // e.g., lucide-react icon
}

// Define specific badge IDs
export const BADGE_IDS = {
    HTML_MASTER: 'html-master',
    CSS_STYLIST: 'css-stylist',
    JS_NINJA: 'javascript-ninja',
    STREAK_3: 'streak-3-days',
    STREAK_7: 'streak-7-days',
    STREAK_30: 'streak-30-days',
    TRIFECTA: 'trifecta-completed', // Completed all playlists
} as const;

export type BadgeId = typeof BADGE_IDS[keyof typeof BADGE_IDS];

