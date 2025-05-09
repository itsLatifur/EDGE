

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
  id: string; // Unique ID for the video (could be YouTube ID)
  title: string;
  url: string; // Embed URL
  duration: number; // Duration in seconds
  description?: string; // Optional description
  playlistId: string; // ID of the playlist this video belongs to
}

export type PlaylistType = 'html' | 'css' | 'javascript';

// Summary used for browsing playlists
export interface PlaylistSummary {
    id: string; // Unique ID for the playlist (e.g., 'html-fcc-full')
    title: string;
    category: PlaylistType;
    description?: string;
    creator?: string; // Optional: Name of the content creator/channel
    // Add other summary fields if needed, e.g., total duration approximation
}

// Full playlist details including videos (used when a playlist is selected)
export interface Playlist extends PlaylistSummary {
  videos: ContentItem[];
}

// Structure to hold all playlists categorized
export interface PlaylistCollection {
    [category: string]: PlaylistSummary[]; // Category maps to array of playlist summaries
}

// Structure to hold all videos indexed by playlist ID
export interface VideoCollection {
    [playlistId: string]: ContentItem[];
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
    HTML_MASTER: 'html-master', // Example: Completed a specific core HTML playlist
    CSS_STYLIST: 'css-stylist', // Example: Completed a specific core CSS playlist
    JS_NINJA: 'javascript-ninja', // Example: Completed a specific core JS playlist
    STREAK_3: 'streak-3-days',
    STREAK_7: 'streak-7-days',
    STREAK_30: 'streak-30-days',
    TRIFECTA: 'trifecta-completed', // Example: Completed all *core* playlists
    // Add more specific badges, e.g., 'flexbox-pro', 'grid-guru', 'async-ace'
    PLAYLIST_COMPLETE_PREFIX: 'playlist-complete-', // Prefix for dynamic playlist completion badges
} as const;

// Combine known badge IDs with potential dynamic ones
export type KnownBadgeId = typeof BADGE_IDS[keyof typeof BADGE_IDS];
export type DynamicBadgeId = `${typeof BADGE_IDS.PLAYLIST_COMPLETE_PREFIX}${string}`;
export type BadgeId = KnownBadgeId | DynamicBadgeId;
