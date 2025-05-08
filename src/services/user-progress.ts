
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc, Timestamp, increment, FieldValue, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import type { UserProgress, UserProgressEntry, UserProfile, LeaderboardEntry, PlaylistType, BadgeId, DynamicBadgeId, KnownBadgeId } from '@/types';
import { BADGE_IDS } from '@/types'; // Import BADGE_IDS
import { playlistCategories, playlistVideos, findPlaylistSummary, getPlaylistDetails } from '@/lib/data/playlists'; // Needed for badge checks

const GUEST_PROGRESS_KEY = 'selfLearnGuestProgress';

// --- Helper functions for Dates ---
const isSameDay = (date1: Date, date2: Date): boolean => {
    if (!(date1 instanceof Date) || !(date2 instanceof Date) || isNaN(date1.getTime()) || isNaN(date2.getTime())) {
        return false; // Handle invalid dates
    }
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

const isConsecutiveDay = (date1: Date, date2: Date): boolean => {
    if (!(date1 instanceof Date) || !(date2 instanceof Date) || isNaN(date1.getTime()) || isNaN(date2.getTime())) {
        return false; // Handle invalid dates
    }
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    // Calculate difference in days based on UTC midnight
    const startOfDate1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const startOfDate2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
    const diffDays = Math.round((startOfDate2 - startOfDate1) / oneDay);
    return diffDays === 1;
};

// --- Guest Progress (Local Storage) ---

export const loadGuestProgress = (): UserProgress | null => {
  if (typeof window === 'undefined') return null; // Guard against SSR
  try {
    const storedProgress = localStorage.getItem(GUEST_PROGRESS_KEY);
    if (storedProgress) {
        const progressRaw = JSON.parse(storedProgress);
        const progress: UserProgress = {};
        for (const videoId in progressRaw) {
            const entry = progressRaw[videoId];
            let lastWatchedDate = new Date(0); // Default to epoch
            if (entry.lastWatched) {
                 const parsedDate = new Date(entry.lastWatched); // Try parsing ISO string or timestamp number
                 if (!isNaN(parsedDate.getTime())) {
                     lastWatchedDate = parsedDate;
                 } else {
                      console.warn(`Could not parse guest lastWatched date for video ${videoId}:`, entry.lastWatched);
                 }
            }
             progress[videoId] = {
                watchedTime: entry.watchedTime ?? 0,
                lastWatched: lastWatchedDate,
                completed: entry.completed ?? false,
            };
        }
        console.log("Loaded guest progress:", progress);
        return progress;
    }
  } catch (error) {
    console.error("Error loading guest progress from local storage:", error);
  }
  return null;
};

export const saveGuestProgress = (progress: UserProgress): void => {
   if (typeof window === 'undefined') return;
  try {
    // Ensure dates are stored in a serializable format (ISO string)
    const serializableProgress: { [key: string]: any } = {};
    for (const videoId in progress) {
        serializableProgress[videoId] = {
            ...progress[videoId],
            // Only convert valid Date objects, otherwise store null or a default
            lastWatched: progress[videoId].lastWatched instanceof Date && !isNaN(progress[videoId].lastWatched.getTime())
                ? progress[videoId].lastWatched.toISOString()
                : null,
        };
    }
    localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(serializableProgress));
     console.log("Saved guest progress:", serializableProgress);
  } catch (error) {
    console.error("Error saving guest progress to local storage:", error);
  }
};

export const updateGuestProgressEntry = (videoId: string, watchedTime: number, isCompleted: boolean): void => {
    const currentProgress = loadGuestProgress() || {};
    currentProgress[videoId] = {
        watchedTime,
        lastWatched: new Date(), // Update with current timestamp
        completed: isCompleted,
    };
    saveGuestProgress(currentProgress);
};


export const clearGuestProgress = (): void => {
   if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(GUEST_PROGRESS_KEY);
    console.log("Cleared guest progress from local storage.");
  } catch (error) {
    console.error("Error clearing guest progress from local storage:", error);
  }
};

// --- Firestore User Progress & Profile ---

// Fetch user profile (including streak info)
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!userId) return null;
    const userDocRef = doc(db, 'users', userId);
    try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            // Convert Firestore Timestamps to Dates, handle potential undefined/null
            const createdAtTimestamp = data.createdAt;
            const createdAt = createdAtTimestamp instanceof Timestamp ? createdAtTimestamp.toDate() : new Date();
            const lastActivityTimestamp = data.lastActivityDate;
            // Handle null or undefined lastActivityDate
            const lastActivityDate = lastActivityTimestamp instanceof Timestamp ? lastActivityTimestamp.toDate() : null;

            return {
                uid: data.uid || userId,
                email: data.email || '',
                displayName: data.displayName || 'Learner',
                avatarUrl: data.avatarUrl || undefined,
                points: data.points ?? 0,
                badges: Array.isArray(data.badges) ? data.badges : [],
                createdAt: createdAt,
                // Gamification fields
                currentStreak: data.currentStreak ?? 0,
                longestStreak: data.longestStreak ?? 0,
                lastActivityDate: lastActivityDate,
            } as UserProfile;
        } else {
            console.log(`Profile not found for user ${userId}, potentially a new user.`);
            return null;
        }
    } catch (error) {
         console.error(`Error fetching profile for user ${userId}:`, error);
         throw error; // Re-throw error for upstream handling
    }
};


// Fetch user progress data from Firestore
export const getUserProgress = async (userId: string): Promise<UserProgress | null> => {
  if (!userId) return null;
  const progressDocRef = doc(db, 'userProgress', userId);
  try {
      const progressDocSnap = await getDoc(progressDocRef);
      if (progressDocSnap.exists()) {
        const data = progressDocSnap.data();
        const progress: UserProgress = {};
        for (const videoId in data) {
            if (data[videoId] && data[videoId].lastWatched instanceof Timestamp) {
                 progress[videoId] = {
                    watchedTime: data[videoId].watchedTime ?? 0,
                    lastWatched: data[videoId].lastWatched.toDate(),
                    completed: data[videoId].completed ?? false,
                 };
            } else {
                 console.warn(`Invalid or missing Firestore progress data format for video ${videoId}, user ${userId}. Using defaults.`);
                 // Optionally create default entry: progress[videoId] = { watchedTime: 0, lastWatched: new Date(0), completed: false };
            }
        }
        return progress;
      } else {
          // No progress doc exists, return empty object
          console.log(`No progress document found for user ${userId}. Returning empty progress.`);
          return {};
      }
  } catch(error) {
      console.error(`Error fetching Firestore progress for user ${userId}:`, error);
      throw error; // Re-throw error
  }
};


// Update user progress AND profile (for streaks, points, badges)
export const updateUserProgress = async (
    userId: string,
    videoId: string,
    watchedTime: number,
    isCompleted: boolean,
    lastWatchedDate: Date = new Date() // This is the CURRENT timestamp of the update
): Promise<{ pointsAwarded: number; badgesAwarded: BadgeId[] }> => {
    if (!userId) return { pointsAwarded: 0, badgesAwarded: [] };

    const progressDocRef = doc(db, 'userProgress', userId);
    const userDocRef = doc(db, 'users', userId);
    let pointsAwarded = 0;
    let badgesAwarded: BadgeId[] = [];
    let newBadges: BadgeId[] = []; // Track only newly awarded badges in this update

    const progressUpdateData: { [key: string]: any } = {};
    const fieldPathPrefix = `${videoId}`;
    progressUpdateData[`${fieldPathPrefix}.watchedTime`] = watchedTime;
    progressUpdateData[`${fieldPathPrefix}.lastWatched`] = Timestamp.fromDate(lastWatchedDate);
    progressUpdateData[`${fieldPathPrefix}.completed`] = isCompleted;

    try {
        // Use setDoc with merge: true for progress to handle creation/update atomically
        await setDoc(progressDocRef, progressUpdateData, { merge: true });

        // Fetch current profile for streak, points, and badges calculation
        const userProfile = await getUserProfile(userId);
        if (!userProfile) {
            console.warn(`Cannot update progress/streaks for non-existent profile: ${userId}. Progress saved, but profile update skipped.`);
            return { pointsAwarded: 0, badgesAwarded: [] };
        }

        // Fetch current progress to check previous completion status
        const previousProgress = await getUserProgress(userId); // Fetch *after* saving current update
        const wasPreviouslyCompleted = previousProgress?.[videoId]?.completed || false;

        const profileUpdateData: { [key: string]: any } = {};

        // --- Streak Calculation ---
        let currentStreak = userProfile.currentStreak || 0;
        let longestStreak = userProfile.longestStreak || 0;
        let activityDateChanged = false;

        if (userProfile.lastActivityDate) {
            if (!isSameDay(userProfile.lastActivityDate, lastWatchedDate)) {
                if (isConsecutiveDay(userProfile.lastActivityDate, lastWatchedDate)) {
                    currentStreak++;
                } else {
                    currentStreak = 1; // Streak broken, reset to 1 for today's activity
                }
                activityDateChanged = true;
            }
            // If it's the same day, streak doesn't change, but update lastActivityDate to current time
            else if (lastWatchedDate.getTime() > userProfile.lastActivityDate.getTime()){
                 activityDateChanged = true; // Update timestamp even if same day
            }
        } else {
            currentStreak = 1; // First activity ever
            activityDateChanged = true;
        }

        if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
        }

        // Add streak/date updates to profileUpdateData if changed
        if (currentStreak !== userProfile.currentStreak) profileUpdateData.currentStreak = currentStreak;
        if (longestStreak !== userProfile.longestStreak) profileUpdateData.longestStreak = longestStreak;
        if (activityDateChanged) profileUpdateData.lastActivityDate = Timestamp.fromDate(lastWatchedDate);


        // --- Award Points ---
        if (isCompleted && !wasPreviouslyCompleted) {
            pointsAwarded = 10; // Example points
            profileUpdateData.points = increment(pointsAwarded);
            console.log(`Awarding ${pointsAwarded} points to user ${userId} for completing video ${videoId}`);
        }

        // --- Award Badges ---
        const currentBadges = userProfile.badges || [];

        // Streak Badges
        if (currentStreak >= 3 && !currentBadges.includes(BADGE_IDS.STREAK_3)) newBadges.push(BADGE_IDS.STREAK_3);
        if (currentStreak >= 7 && !currentBadges.includes(BADGE_IDS.STREAK_7)) newBadges.push(BADGE_IDS.STREAK_7);
        if (currentStreak >= 30 && !currentBadges.includes(BADGE_IDS.STREAK_30)) newBadges.push(BADGE_IDS.STREAK_30);

        // Completion Badges (only check if video was newly completed)
        if (isCompleted && !wasPreviouslyCompleted) {
            const completionBadges = await checkAndAwardCompletionBadges(userId, currentBadges, previousProgress || {}, videoId); // Pass previousProgress
            newBadges.push(...completionBadges);
        }

        // Filter out duplicates within newBadges (though logic should prevent this)
        newBadges = [...new Set(newBadges)];

        // Add new badges to profile update if any exist
        if (newBadges.length > 0) {
            profileUpdateData.badges = FieldValue.arrayUnion(...newBadges);
            console.log(`Awarding new badges: ${newBadges.join(', ')} to user ${userId}`);
        }

        // Update profile document only if there are changes
        if (Object.keys(profileUpdateData).length > 0) {
            await updateDoc(userDocRef, profileUpdateData);
            console.log(`User profile updated for ${userId}:`, profileUpdateData);
        }

        return { pointsAwarded, badgesAwarded: newBadges }; // Return only newly awarded badges

    } catch (error) {
        console.error(`Error updating Firestore progress/profile for user ${userId}, video ${videoId}:`, error);
        throw error; // Re-throw for upstream handling
    }
};

// Helper to check for playlist completion and award badges
const checkAndAwardCompletionBadges = async (userId: string, currentBadges: BadgeId[], userProgress: UserProgress, completedVideoId: string): Promise<BadgeId[]> => {
    let awardedBadges: BadgeId[] = [];

    // Find the playlist the completed video belongs to
    const videoDetails = findVideoDetails(completedVideoId);
    if (!videoDetails) return awardedBadges; // Should not happen if called correctly

    const playlistId = videoDetails.playlistId;
    const playlist = getPlaylistDetails(playlistId);
    if (!playlist) return awardedBadges;

    // Check if this specific playlist is now complete
    const playlistBadgeId: DynamicBadgeId = `${BADGE_IDS.PLAYLIST_COMPLETE_PREFIX}${playlistId}`;
    const isPlaylistNewlyCompleted = !currentBadges.includes(playlistBadgeId) &&
                                    playlist.videos.every(v => userProgress[v.id]?.completed || v.id === completedVideoId); // Check completion including the current video

    if (isPlaylistNewlyCompleted) {
        awardedBadges.push(playlistBadgeId);
        console.log(`Playlist "${playlist.title}" completed by user ${userId}. Awarding badge ${playlistBadgeId}.`);
    }

    // Check for CORE playlist completion badges (HTML_MASTER, CSS_STYLIST, JS_NINJA)
    // Define which playlist IDs correspond to core badges
    const corePlaylistMap: Partial<Record<PlaylistType, BadgeId>> = {
        html: BADGE_IDS.HTML_MASTER,
        css: BADGE_IDS.CSS_STYLIST,
        javascript: BADGE_IDS.JS_NINJA,
    };
    // Example: Assume first playlist in each category is the "core" one
    const corePlaylistIds = {
        html: playlistCategories.html[0]?.id,
        css: playlistCategories.css[0]?.id,
        javascript: playlistCategories.javascript[0]?.id,
    };

    const coreBadgeId = corePlaylistMap[playlist.category];
    const isCorePlaylist = playlist.id === corePlaylistIds[playlist.category];

    if (coreBadgeId && isCorePlaylist && isPlaylistNewlyCompleted && !currentBadges.includes(coreBadgeId)) {
         awardedBadges.push(coreBadgeId);
         console.log(`Core Playlist "${playlist.title}" completed. Awarding badge ${coreBadgeId}.`);
    }


    // Check for Trifecta badge (completion of all *core* playlists)
    let allCorePlaylistsCompleted = true;
    for (const category in corePlaylistIds) {
        const cat = category as PlaylistType;
        const coreId = corePlaylistIds[cat];
        const coreBadge = corePlaylistMap[cat];

        if (coreId && coreBadge) {
            // Check if user has the badge OR if the playlist is now complete (including current video)
            if (!currentBadges.includes(coreBadge) && !awardedBadges.includes(coreBadge)) { // If user doesn't have badge and isn't getting it now
                 // Check if *this* core playlist is complete based on progress
                 const corePlaylistDetails = getPlaylistDetails(coreId);
                 if (corePlaylistDetails) {
                     const coreComplete = corePlaylistDetails.videos.every(v => userProgress[v.id]?.completed || v.id === completedVideoId);
                     if (!coreComplete) {
                         allCorePlaylistsCompleted = false;
                         break;
                     }
                 } else {
                     allCorePlaylistsCompleted = false; // Cannot verify if core playlist doesn't exist
                     break;
                 }
            }
        } else {
            allCorePlaylistsCompleted = false; // If any core playlist/badge is undefined
            break;
        }
    }


    if (allCorePlaylistsCompleted && !currentBadges.includes(BADGE_IDS.TRIFECTA)) {
         // Check one last time to ensure all core badges are present or newly awarded
         const hasAllCoreBadges = Object.values(corePlaylistMap).every(badge =>
             currentBadges.includes(badge) || awardedBadges.includes(badge)
         );
         if (hasAllCoreBadges) {
            awardedBadges.push(BADGE_IDS.TRIFECTA);
            console.log(`All core playlists completed. Awarding Trifecta badge.`);
         }
    }

    return [...new Set(awardedBadges)]; // Return unique new badges
};


// --- Merging Logic ---

export const mergeProgress = (firestoreProgress: UserProgress, guestProgress: UserProgress): UserProgress => {
  const merged: UserProgress = { ...firestoreProgress };

  console.log("Starting merge. Firestore:", firestoreProgress, "Guest:", guestProgress);

  for (const videoId in guestProgress) {
    const guestEntry = guestProgress[videoId];
    const firestoreEntry = firestoreProgress[videoId];

    // Ensure guest entry's lastWatched is a valid Date object
    const guestLastWatched = guestEntry.lastWatched instanceof Date && !isNaN(guestEntry.lastWatched.getTime())
                               ? guestEntry.lastWatched
                               : new Date(0); // Default to epoch if invalid

    console.log(`Merging video ${videoId}: Guest watchedTime=${guestEntry.watchedTime}, completed=${guestEntry.completed}, lastWatched=${guestLastWatched.toISOString()}`);
    if (firestoreEntry) {
         console.log(`Firestore entry exists: watchedTime=${firestoreEntry.watchedTime}, completed=${firestoreEntry.completed}, lastWatched=${firestoreEntry.lastWatched.toISOString()}`);
    } else {
         console.log(`No Firestore entry for video ${videoId}.`);
    }


    // Priority 1: If guest is complete and Firestore isn't, take guest.
    if (guestEntry.completed && (!firestoreEntry || !firestoreEntry.completed)) {
        merged[videoId] = { ...guestEntry, lastWatched: guestLastWatched };
        console.log(` -> Merged ${videoId}: Guest completed, Firestore not. Taking guest.`);
        continue; // Move to next videoId
    }

    // Priority 2: If Firestore is complete, keep it (unless guest is somehow more recent AND complete?)
    if (firestoreEntry && firestoreEntry.completed) {
        // Optional: Update timestamp if guest is also complete and more recent?
        if (guestEntry.completed && guestLastWatched.getTime() > firestoreEntry.lastWatched.getTime()) {
            merged[videoId] = { ...guestEntry, lastWatched: guestLastWatched };
             console.log(` -> Merged ${videoId}: Both completed, guest more recent. Updating timestamp.`);
        } else {
             console.log(` -> Merged ${videoId}: Firestore completed. Keeping Firestore.`);
        }
        continue; // Keep Firestore completed entry (or updated timestamp)
    }

    // Priority 3: If neither is complete, take the one with the later lastWatched date.
    // Also takes guest entry if firestore entry doesn't exist.
    if (!firestoreEntry || guestLastWatched.getTime() > firestoreEntry.lastWatched.getTime()) {
        merged[videoId] = { ...guestEntry, lastWatched: guestLastWatched };
        console.log(` -> Merged ${videoId}: Neither complete, guest more recent (or Firestore missing). Taking guest.`);
    } else {
        console.log(` -> Merged ${videoId}: Neither complete, Firestore more recent or same. Keeping Firestore.`);
        // If firestore timestamp is later or equal, keep the firestore entry (already in `merged`)
    }
  }
  console.log("Merge complete. Result:", merged);
  return merged;
};


// --- Gamification Firestore Functions --- (Keep internal for now)

// Award points to a user
const awardPoints = async (userId: string, points: number): Promise<void> => {
  // This is now handled within updateUserProgress using increment
};

// Award a badge to a user
const awardBadge = async (userId: string, badgeId: BadgeId): Promise<void> => {
  // This is now handled within updateUserProgress using arrayUnion
};


// --- Leaderboard ---

export const getLeaderboard = async (count: number = 10): Promise<LeaderboardEntry[]> => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("points", "desc"), limit(count));
    const leaderboard: LeaderboardEntry[] = [];

    try {
        const querySnapshot = await getDocs(q);
        let rank = 1;
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            leaderboard.push({
                uid: doc.id,
                displayName: data.displayName || 'Anonymous',
                avatarUrl: data.avatarUrl || undefined,
                points: data.points ?? 0,
                rank: rank++,
            });
        });
        return leaderboard;
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return []; // Return empty array on error
    }
};

// Create User Profile (used during sign-up/initial social sign-in)
export const createUserProfileDocument = async (uid: string, email: string | null, displayName: string | null, photoURL: string | null): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', uid);
    const createdAt = new Date(); // Use JS Date for the object

    const newProfile: UserProfile = {
        uid: uid,
        email: email || '',
        displayName: displayName || email?.split('@')[0] || 'Learner',
        avatarUrl: photoURL || undefined,
        points: 0,
        badges: [],
        createdAt: createdAt,
        // Initialize streak fields
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
    };

    // Ensure createdAt and lastActivityDate are Firestore Timestamps when writing
    const firestoreData = {
        ...newProfile,
        createdAt: Timestamp.fromDate(createdAt),
        lastActivityDate: null, // Store null initially
    };

    try {
        await setDoc(userDocRef, firestoreData);
        console.log(`Created profile for new user ${uid}`);
        return newProfile; // Return the profile object with JS Dates
    } catch (error) {
        console.error(`Error creating profile for user ${uid}:`, error);
        throw error; // Re-throw error
    }
};
