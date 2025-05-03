import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc, Timestamp, increment, FieldValue, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import type { UserProgress, UserProgressEntry, UserProfile, LeaderboardEntry, PlaylistType, BadgeId } from '@/types';
import { BADGE_IDS } from '@/types'; // Import BADGE_IDS
import { mockPlaylists } from '@/lib/data/playlists'; // Needed for Trifecta badge check

const GUEST_PROGRESS_KEY = 'selfLearnGuestProgress';

// --- Helper functions for Dates ---
const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

const isConsecutiveDay = (date1: Date, date2: Date): boolean => {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const diffDays = Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
    return diffDays === 1;
};

// --- Guest Progress (Local Storage) ---

export const loadGuestProgress = (): UserProgress | null => {
  if (typeof window === 'undefined') return null; // Guard against SSR
  try {
    const storedProgress = localStorage.getItem(GUEST_PROGRESS_KEY);
    if (storedProgress) {
        const progress = JSON.parse(storedProgress) as UserProgress;
        // Ensure lastWatched are Date objects
        for (const videoId in progress) {
             if (progress[videoId].lastWatched && !(progress[videoId].lastWatched instanceof Date)) {
                // Attempt conversion from ISO string or number (timestamp)
                let dateValue = progress[videoId].lastWatched;
                if (typeof dateValue === 'string' || typeof dateValue === 'number') {
                    const parsedDate = new Date(dateValue);
                    // Check if parsing was successful
                    if (!isNaN(parsedDate.getTime())) {
                        progress[videoId].lastWatched = parsedDate;
                    } else {
                        console.warn(`Could not parse lastWatched date for video ${videoId} from localStorage:`, dateValue);
                        // Fallback: Set to epoch or current time? For simplicity, keep as is or set to now
                        progress[videoId].lastWatched = new Date(0); // Set to epoch if invalid
                    }
                } else {
                     console.warn(`Invalid type for lastWatched date for video ${videoId} from localStorage:`, dateValue);
                     progress[videoId].lastWatched = new Date(0); // Set to epoch if invalid type
                }
             } else if (!progress[videoId].lastWatched) {
                 // If lastWatched is missing or null, set to epoch
                 progress[videoId].lastWatched = new Date(0);
             }
        }
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
            lastWatched: progress[videoId].lastWatched instanceof Date
                ? progress[videoId].lastWatched.toISOString()
                : new Date().toISOString(), // Fallback to current time if invalid
        };
    }
    localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(serializableProgress));
  } catch (error) {
    console.error("Error saving guest progress to local storage:", error);
  }
};

export const updateGuestProgressEntry = (videoId: string, watchedTime: number, isCompleted: boolean): void => {
    const currentProgress = loadGuestProgress() || {};
    currentProgress[videoId] = {
        watchedTime,
        lastWatched: new Date(),
        completed: isCompleted,
    };
    saveGuestProgress(currentProgress);
};


export const clearGuestProgress = (): void => {
   if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(GUEST_PROGRESS_KEY);
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
    }
    return null;
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
          return {};
      }
  } catch(error) {
      console.error(`Error fetching Firestore progress for user ${userId}:`, error);
  }
  return null; // Return null on error
};


// Update user progress AND profile (for streaks)
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

    const progressUpdateData: { [key: string]: any } = {};
    const fieldPathPrefix = `${videoId}`;
    progressUpdateData[`${fieldPathPrefix}.watchedTime`] = watchedTime;
    progressUpdateData[`${fieldPathPrefix}.lastWatched`] = Timestamp.fromDate(lastWatchedDate);
    progressUpdateData[`${fieldPathPrefix}.completed`] = isCompleted;

    try {
        // Fetch current profile for streak calculation
        const userProfile = await getUserProfile(userId);
        if (!userProfile) {
            console.warn(`Cannot update progress/streaks for non-existent profile: ${userId}`);
            return { pointsAwarded: 0, badgesAwarded: [] };
        }

        // Use setDoc with merge: true for progress to handle creation/update
        await setDoc(progressDocRef, progressUpdateData, { merge: true });

        // --- Streak Calculation ---
        const profileUpdateData: { [key: string]: any } = {};
        let currentStreak = userProfile.currentStreak || 0;
        let longestStreak = userProfile.longestStreak || 0;

        if (userProfile.lastActivityDate) {
            if (!isSameDay(userProfile.lastActivityDate, lastWatchedDate)) {
                if (isConsecutiveDay(userProfile.lastActivityDate, lastWatchedDate)) {
                    currentStreak++;
                } else {
                    currentStreak = 1; // Streak broken, reset to 1 for today's activity
                }
            }
            // If it's the same day, streak doesn't change
        } else {
            currentStreak = 1; // First activity ever
        }

        if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
        }

        // Only update profile if streak or last activity date changed
        if (currentStreak !== userProfile.currentStreak || longestStreak !== userProfile.longestStreak || !userProfile.lastActivityDate || !isSameDay(userProfile.lastActivityDate, lastWatchedDate)) {
            profileUpdateData.currentStreak = currentStreak;
            profileUpdateData.longestStreak = longestStreak;
            profileUpdateData.lastActivityDate = Timestamp.fromDate(lastWatchedDate); // Update last activity date
            await updateDoc(userDocRef, profileUpdateData);
            console.log(`User ${userId} streak updated: Current ${currentStreak}, Longest ${longestStreak}`);

             // Award streak badges
             if (currentStreak >= 3 && !userProfile.badges.includes(BADGE_IDS.STREAK_3)) badgesAwarded.push(BADGE_IDS.STREAK_3);
             if (currentStreak >= 7 && !userProfile.badges.includes(BADGE_IDS.STREAK_7)) badgesAwarded.push(BADGE_IDS.STREAK_7);
             if (currentStreak >= 30 && !userProfile.badges.includes(BADGE_IDS.STREAK_30)) badgesAwarded.push(BADGE_IDS.STREAK_30);
        }

        // Award points if the video is newly completed
        const previousProgress = await getUserProgress(userId);
        const wasPreviouslyCompleted = previousProgress?.[videoId]?.completed || false;
        if (isCompleted && !wasPreviouslyCompleted) {
            pointsAwarded = 10; // Example points
            await awardPoints(userId, pointsAwarded);
        }

        // Award playlist and trifecta badges if applicable (re-fetch progress after update)
         if (isCompleted) {
            const updatedProgress = await getUserProgress(userId); // Fetch latest progress
            if (updatedProgress) {
                const badgeCheckResult = await checkAndAwardCompletionBadges(userId, userProfile.badges, updatedProgress);
                badgesAwarded = [...badgesAwarded, ...badgeCheckResult];
            }
         }

        // Apply newly awarded badges
        if (badgesAwarded.length > 0) {
            const uniqueNewBadges = badgesAwarded.filter(badge => !userProfile.badges.includes(badge));
            if (uniqueNewBadges.length > 0) {
                 await updateDoc(userDocRef, {
                     badges: [...userProfile.badges, ...uniqueNewBadges]
                 });
                 console.log(`Awarded new badges: ${uniqueNewBadges.join(', ')} to user ${userId}`);
            }
        }

        return { pointsAwarded, badgesAwarded: uniqueNewBadges }; // Return only newly awarded badges

    } catch (error) {
        console.error(`Error updating Firestore progress/profile for user ${userId}, video ${videoId}:`, error);
        throw error;
    }
};

// Helper to check for playlist completion and award badges
const checkAndAwardCompletionBadges = async (userId: string, currentBadges: BadgeId[], userProgress: UserProgress): Promise<BadgeId[]> => {
    let awardedBadges: BadgeId[] = [];
    let allPlaylistsCompleted = true;

    for (const playlistId in mockPlaylists) {
        const typedPlaylistId = playlistId as PlaylistType;
        const playlist = mockPlaylists[typedPlaylistId];
        const badgeId = (BADGE_IDS as Record<string, BadgeId>)[`${typedPlaylistId.toUpperCase()}_MASTER`] || (BADGE_IDS as Record<string, BadgeId>)[`${typedPlaylistId.toUpperCase()}_STYLIST`] || (BADGE_IDS as Record<string, BadgeId>)[`${typedPlaylistId.toUpperCase()}_NINJA`]; // Map playlist ID to badge ID

        if (badgeId && !currentBadges.includes(badgeId)) {
            const playlistComplete = playlist.videos.every(v => userProgress[v.id]?.completed);
            if (playlistComplete) {
                awardedBadges.push(badgeId);
            } else {
                allPlaylistsCompleted = false; // If any playlist is not complete
            }
        } else if (!badgeId) {
             console.warn(`No badge ID defined for playlist: ${playlistId}`);
             // Decide if missing badge definition means playlist completion doesn't count towards trifecta
             const playlistComplete = playlist.videos.every(v => userProgress[v.id]?.completed);
             if(!playlistComplete) allPlaylistsCompleted = false;
        } else if (!currentBadges.includes(badgeId)) {
             // Badge exists but user doesn't have it, check if playlist is complete
             const playlistComplete = playlist.videos.every(v => userProgress[v.id]?.completed);
             if (!playlistComplete) allPlaylistsCompleted = false;
        }
        // If user already has the badge, we assume the playlist is complete for trifecta check
    }

    // Check for Trifecta badge
    if (allPlaylistsCompleted && !currentBadges.includes(BADGE_IDS.TRIFECTA)) {
        awardedBadges.push(BADGE_IDS.TRIFECTA);
    }

    return awardedBadges;
};

// --- Merging Logic ---

export const mergeProgress = (firestoreProgress: UserProgress, guestProgress: UserProgress): UserProgress => {
  const merged: UserProgress = { ...firestoreProgress };

  for (const videoId in guestProgress) {
    const guestEntry = guestProgress[videoId];
    const firestoreEntry = firestoreProgress[videoId];

    // Ensure guest entry's lastWatched is a valid Date object
    const guestLastWatched = guestEntry.lastWatched instanceof Date ? guestEntry.lastWatched : new Date(0); // Default to epoch if invalid

    // Prioritize completed status: If guest is complete and Firestore isn't, take guest.
    if (guestEntry.completed && (!firestoreEntry || !firestoreEntry.completed)) {
        merged[videoId] = { ...guestEntry, lastWatched: guestLastWatched };
        continue; // Move to next videoId
    }

    // If Firestore is complete, keep it (unless guest is also complete AND somehow more recent - unlikely needed)
    if (firestoreEntry && firestoreEntry.completed) {
        continue; // Keep firestore completed entry
    }

    // If neither is complete, take the one with the later lastWatched date.
    // Also takes guest entry if firestore entry doesn't exist.
    if (!firestoreEntry || guestLastWatched.getTime() > firestoreEntry.lastWatched.getTime()) {
        merged[videoId] = { ...guestEntry, lastWatched: guestLastWatched };
    }
    // If firestore timestamp is later or equal, keep the firestore entry (already in `merged`)
  }

  return merged;
};


// --- Gamification Firestore Functions ---

// Award points to a user (Now internal, called by updateUserProgress)
const awardPoints = async (userId: string, points: number): Promise<void> => {
  if (!userId || points <= 0) return;
  const userDocRef = doc(db, 'users', userId);
   try {
       await updateDoc(userDocRef, {
           points: increment(points)
       });
       console.log(`Awarded ${points} points to user ${userId}`);
   } catch(error) {
       console.error(`Error awarding points to user ${userId}:`, error);
       // Profile should exist if updateUserProgress called this
   }
};

// Award a badge to a user (Now internal, called by updateUserProgress)
const awardBadge = async (userId: string, badgeId: BadgeId): Promise<void> => {
  if (!userId || !badgeId) return;
  const userDocRef = doc(db, 'users', userId);

  try {
      // Fetch fresh data before updating to avoid race conditions if needed,
      // but updateUserProgress already passes current badges.
      // We'll trust the logic in updateUserProgress to prevent duplicates for now.
       await updateDoc(userDocRef, {
         badges: FieldValue.arrayUnion(badgeId) // Use arrayUnion for safety
       });
       console.log(`Awarded badge "${badgeId}" to user ${userId}`);

  } catch(error) {
       console.error(`Error awarding badge ${badgeId} to user ${userId}:`, error);
       // Profile should exist
  }
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

    await setDoc(userDocRef, firestoreData);
    console.log(`Created profile for new user ${uid}`);
    return newProfile; // Return the profile object with JS Dates
};