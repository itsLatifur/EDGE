
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc, Timestamp, increment, FieldValue, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import type { UserProgress, UserProgressEntry, UserProfile, LeaderboardEntry, PlaylistType, BadgeId, DynamicBadgeId, KnownBadgeId } from '@/types';
import { BADGE_IDS } from '@/types'; 
// findPlaylistSummary, getPlaylistDetails, and playlistCategories now use YouTube Playlist IDs as primary keys
import { playlistCategories, playlistVideos, findVideoDetails, getPlaylistDetails, findPlaylistSummary } from '@/lib/data/playlists'; 

const GUEST_PROGRESS_KEY = 'selfLearnGuestProgress';

// --- Helper functions for Dates ---
const isSameDay = (date1: Date, date2: Date): boolean => {
    if (!(date1 instanceof Date) || !(date2 instanceof Date) || isNaN(date1.getTime()) || isNaN(date2.getTime())) {
        return false; 
    }
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

const isConsecutiveDay = (date1: Date, date2: Date): boolean => {
    if (!(date1 instanceof Date) || !(date2 instanceof Date) || isNaN(date1.getTime()) || isNaN(date2.getTime())) {
        return false; 
    }
    const oneDay = 24 * 60 * 60 * 1000; 
    const startOfDate1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const startOfDate2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
    const diffDays = Math.round((startOfDate2 - startOfDate1) / oneDay);
    return diffDays === 1;
};

// --- Guest Progress (Local Storage) ---

export const loadGuestProgress = (): UserProgress | null => {
  if (typeof window === 'undefined') return null; 
  try {
    const storedProgress = localStorage.getItem(GUEST_PROGRESS_KEY);
    if (storedProgress) {
        const progressRaw = JSON.parse(storedProgress);
        const progress: UserProgress = {};
        for (const videoId in progressRaw) { // videoId is YouTube Video ID
            const entry = progressRaw[videoId];
            let lastWatchedDate = new Date(0); 
            if (entry.lastWatched) {
                 const parsedDate = new Date(entry.lastWatched); 
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
    const serializableProgress: { [key: string]: any } = {};
    for (const videoId in progress) { // videoId is YouTube Video ID
        serializableProgress[videoId] = {
            ...progress[videoId],
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

// videoId is YouTube Video ID
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
    console.log("Cleared guest progress from local storage.");
  } catch (error) {
    console.error("Error clearing guest progress from local storage:", error);
  }
};

// --- Firestore User Progress & Profile ---

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!userId) return null;
    const userDocRef = doc(db, 'users', userId);
    try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            const createdAtTimestamp = data.createdAt;
            const createdAt = createdAtTimestamp instanceof Timestamp ? createdAtTimestamp.toDate() : new Date();
            const lastActivityTimestamp = data.lastActivityDate;
            const lastActivityDate = lastActivityTimestamp instanceof Timestamp ? lastActivityTimestamp.toDate() : null;

            return {
                uid: data.uid || userId,
                email: data.email || '',
                displayName: data.displayName || 'Learner',
                avatarUrl: data.avatarUrl || undefined,
                points: data.points ?? 0,
                badges: Array.isArray(data.badges) ? data.badges : [],
                createdAt: createdAt,
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
         throw error; 
    }
};


export const getUserProgress = async (userId: string): Promise<UserProgress | null> => {
  if (!userId) return null;
  const progressDocRef = doc(db, 'userProgress', userId);
  try {
      const progressDocSnap = await getDoc(progressDocRef);
      if (progressDocSnap.exists()) {
        const data = progressDocSnap.data();
        const progress: UserProgress = {};
        for (const videoId in data) { // videoId is YouTube Video ID
            if (data[videoId] && data[videoId].lastWatched instanceof Timestamp) {
                 progress[videoId] = {
                    watchedTime: data[videoId].watchedTime ?? 0,
                    lastWatched: data[videoId].lastWatched.toDate(),
                    completed: data[videoId].completed ?? false,
                 };
            } else {
                 console.warn(`Invalid or missing Firestore progress data format for video ${videoId}, user ${userId}. Using defaults.`);
            }
        }
        return progress;
      } else {
          console.log(`No progress document found for user ${userId}. Returning empty progress.`);
          return {};
      }
  } catch(error) {
      console.error(`Error fetching Firestore progress for user ${userId}:`, error);
      throw error; 
  }
};


export const updateUserProgress = async (
    userId: string,
    videoId: string, // YouTube Video ID
    watchedTime: number,
    isCompleted: boolean,
    lastWatchedDate: Date = new Date() 
): Promise<{ pointsAwarded: number; badgesAwarded: BadgeId[] }> => {
    if (!userId) return { pointsAwarded: 0, badgesAwarded: [] };

    const progressDocRef = doc(db, 'userProgress', userId);
    const userDocRef = doc(db, 'users', userId);
    let pointsAwarded = 0;
    let newBadges: BadgeId[] = []; 

    const progressUpdateData: { [key: string]: any } = {};
    const fieldPathPrefix = `${videoId}`; // videoId is YouTube Video ID
    progressUpdateData[`${fieldPathPrefix}.watchedTime`] = watchedTime;
    progressUpdateData[`${fieldPathPrefix}.lastWatched`] = Timestamp.fromDate(lastWatchedDate);
    progressUpdateData[`${fieldPathPrefix}.completed`] = isCompleted;

    try {
        await setDoc(progressDocRef, progressUpdateData, { merge: true });

        const userProfile = await getUserProfile(userId);
        if (!userProfile) {
            console.warn(`Cannot update progress/streaks for non-existent profile: ${userId}. Progress saved, but profile update skipped.`);
            return { pointsAwarded: 0, badgesAwarded: [] };
        }

        const currentProgress = await getUserProgress(userId) || {}; // Ensure it's an object even if null
        const wasPreviouslyCompleted = currentProgress[videoId]?.completed || false;

        const profileUpdateData: { [key: string]: any } = {};

        let currentStreak = userProfile.currentStreak || 0;
        let longestStreak = userProfile.longestStreak || 0;
        let activityDateChanged = false;

        if (userProfile.lastActivityDate) {
            if (!isSameDay(userProfile.lastActivityDate, lastWatchedDate)) {
                if (isConsecutiveDay(userProfile.lastActivityDate, lastWatchedDate)) {
                    currentStreak++;
                } else {
                    currentStreak = 1; 
                }
                activityDateChanged = true;
            }
            else if (lastWatchedDate.getTime() > userProfile.lastActivityDate.getTime()){
                 activityDateChanged = true; 
            }
        } else {
            currentStreak = 1; 
            activityDateChanged = true;
        }

        if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
        }

        if (currentStreak !== userProfile.currentStreak) profileUpdateData.currentStreak = currentStreak;
        if (longestStreak !== userProfile.longestStreak) profileUpdateData.longestStreak = longestStreak;
        if (activityDateChanged) profileUpdateData.lastActivityDate = Timestamp.fromDate(lastWatchedDate);


        if (isCompleted && !wasPreviouslyCompleted) {
            pointsAwarded = 10; 
            profileUpdateData.points = increment(pointsAwarded);
            console.log(`Awarding ${pointsAwarded} points to user ${userId} for completing video ${videoId}`);
        }

        const currentBadges = userProfile.badges || [];

        if (currentStreak >= 3 && !currentBadges.includes(BADGE_IDS.STREAK_3)) newBadges.push(BADGE_IDS.STREAK_3);
        if (currentStreak >= 7 && !currentBadges.includes(BADGE_IDS.STREAK_7)) newBadges.push(BADGE_IDS.STREAK_7);
        if (currentStreak >= 30 && !currentBadges.includes(BADGE_IDS.STREAK_30)) newBadges.push(BADGE_IDS.STREAK_30);

        if (isCompleted && !wasPreviouslyCompleted) {
            const completionBadges = await checkAndAwardCompletionBadges(userId, currentBadges, currentProgress, videoId);
            newBadges.push(...completionBadges);
        }

        newBadges = [...new Set(newBadges)];

        if (newBadges.length > 0) {
            profileUpdateData.badges = FieldValue.arrayUnion(...newBadges);
            console.log(`Awarding new badges: ${newBadges.join(', ')} to user ${userId}`);
        }

        if (Object.keys(profileUpdateData).length > 0) {
            await updateDoc(userDocRef, profileUpdateData);
            console.log(`User profile updated for ${userId}:`, profileUpdateData);
        }

        return { pointsAwarded, badgesAwarded: newBadges }; 

    } catch (error) {
        console.error(`Error updating Firestore progress/profile for user ${userId}, video ${videoId}:`, error);
        throw error; 
    }
};

// Helper to check for playlist completion and award badges
// userProgress is the state *after* the current video was marked complete
// completedVideoId is the YouTube Video ID
const checkAndAwardCompletionBadges = async (userId: string, currentBadges: BadgeId[], userProgress: UserProgress, completedVideoId: string): Promise<BadgeId[]> => {
    let awardedBadges: BadgeId[] = [];

    const videoDetailsResult = findVideoDetails(completedVideoId);
    if (!videoDetailsResult) return awardedBadges; 

    const youtubePlaylistId = videoDetailsResult.playlistId; // This is the YouTube Playlist ID
    const playlist = getPlaylistDetails(youtubePlaylistId); // Fetches playlist using YouTube Playlist ID
    if (!playlist) return awardedBadges;

    // Check if this specific playlist (identified by YouTube Playlist ID) is now complete
    const playlistBadgeId: DynamicBadgeId = `${BADGE_IDS.PLAYLIST_COMPLETE_PREFIX}${youtubePlaylistId}`;
    const isPlaylistNewlyCompleted = !currentBadges.includes(playlistBadgeId) &&
                                    playlist.videos.every(v => userProgress[v.id]?.completed); // v.id is YouTube Video ID

    if (isPlaylistNewlyCompleted) {
        awardedBadges.push(playlistBadgeId);
        console.log(`Playlist "${playlist.title}" (ID: ${youtubePlaylistId}) completed by user ${userId}. Awarding badge ${playlistBadgeId}.`);
    }

    // Define which YouTube Playlist IDs correspond to core badges
    // These should be the actual YouTube Playlist IDs from your playlist-sources.json
    const corePlaylistIds: Partial<Record<PlaylistType, string>> = {
      html: playlistCategories.html.find(p => p.title.toLowerCase().includes("full course"))?.id, // Example: find the "HTML Full Course" by its YouTube Playlist ID
      css: playlistCategories.css.find(p => p.title.toLowerCase().includes("full course"))?.id,   // Example: find the "CSS Full Course" by its YouTube Playlist ID
      javascript: playlistCategories.javascript.find(p => p.title.toLowerCase().includes("full course"))?.id, // Example: find the "JS Full Course" by its YouTube Playlist ID
    };

     const corePlaylistMap: Partial<Record<PlaylistType, KnownBadgeId>> = {
        html: BADGE_IDS.HTML_MASTER,
        css: BADGE_IDS.CSS_STYLIST,
        javascript: BADGE_IDS.JS_NINJA,
    };


    const coreBadgeIdToAward = corePlaylistMap[playlist.category];
    // Check if the completed playlist IS one of the defined core playlists
    const isCorePlaylist = youtubePlaylistId === corePlaylistIds[playlist.category];

    if (coreBadgeIdToAward && isCorePlaylist && isPlaylistNewlyCompleted && !currentBadges.includes(coreBadgeIdToAward)) {
         awardedBadges.push(coreBadgeIdToAward);
         console.log(`Core Playlist "${playlist.title}" (ID: ${youtubePlaylistId}) completed. Awarding badge ${coreBadgeIdToAward}.`);
    }

    let allCorePlaylistsCompleted = true;
    for (const categoryKey in corePlaylistIds) {
        const cat = categoryKey as PlaylistType;
        const actualCorePlaylistId = corePlaylistIds[cat]; // Actual YouTube Playlist ID for this core category
        const coreBadgeToCheck = corePlaylistMap[cat];

        if (actualCorePlaylistId && coreBadgeToCheck) {
            // User has the badge OR is getting it now OR the playlist is fully complete in progress
            if (currentBadges.includes(coreBadgeToCheck) || awardedBadges.includes(coreBadgeToCheck)) {
                continue; // Already has/getting this core badge
            }
            // If not, check if the playlist is complete in userProgress
            const corePlaylistDetails = getPlaylistDetails(actualCorePlaylistId);
            if (corePlaylistDetails) {
                 const coreComplete = corePlaylistDetails.videos.every(v => userProgress[v.id]?.completed);
                 if (!coreComplete) {
                     allCorePlaylistsCompleted = false;
                     break;
                 }
            } else {
                 allCorePlaylistsCompleted = false; 
                 break;
            }
        } else {
            allCorePlaylistsCompleted = false; 
            break;
        }
    }

    if (allCorePlaylistsCompleted && !currentBadges.includes(BADGE_IDS.TRIFECTA)) {
         const hasAllCoreBadgesNow = Object.values(corePlaylistMap).every(badge =>
             currentBadges.includes(badge) || awardedBadges.includes(badge)
         );
         if (hasAllCoreBadgesNow) {
            awardedBadges.push(BADGE_IDS.TRIFECTA);
            console.log(`All core playlists completed. Awarding Trifecta badge.`);
         }
    }

    return [...new Set(awardedBadges)]; 
};


// --- Merging Logic ---

export const mergeProgress = (firestoreProgress: UserProgress, guestProgress: UserProgress): UserProgress => {
  const merged: UserProgress = { ...firestoreProgress };
  console.log("Starting merge. Firestore:", firestoreProgress, "Guest:", guestProgress);

  for (const videoId in guestProgress) { // videoId is YouTube Video ID
    const guestEntry = guestProgress[videoId];
    const firestoreEntry = firestoreProgress[videoId];

    const guestLastWatched = guestEntry.lastWatched instanceof Date && !isNaN(guestEntry.lastWatched.getTime())
                               ? guestEntry.lastWatched
                               : new Date(0); 

    console.log(`Merging video ${videoId}: Guest watchedTime=${guestEntry.watchedTime}, completed=${guestEntry.completed}, lastWatched=${guestLastWatched.toISOString()}`);
    if (firestoreEntry) {
         console.log(`Firestore entry exists: watchedTime=${firestoreEntry.watchedTime}, completed=${firestoreEntry.completed}, lastWatched=${firestoreEntry.lastWatched.toISOString()}`);
    } else {
         console.log(`No Firestore entry for video ${videoId}.`);
    }

    if (guestEntry.completed && (!firestoreEntry || !firestoreEntry.completed)) {
        merged[videoId] = { ...guestEntry, lastWatched: guestLastWatched };
        console.log(` -> Merged ${videoId}: Guest completed, Firestore not. Taking guest.`);
        continue; 
    }

    if (firestoreEntry && firestoreEntry.completed) {
        if (guestEntry.completed && guestLastWatched.getTime() > firestoreEntry.lastWatched.getTime()) {
            merged[videoId] = { ...guestEntry, lastWatched: guestLastWatched };
             console.log(` -> Merged ${videoId}: Both completed, guest more recent. Updating timestamp.`);
        } else {
             console.log(` -> Merged ${videoId}: Firestore completed. Keeping Firestore.`);
        }
        continue; 
    }

    if (!firestoreEntry || guestLastWatched.getTime() > firestoreEntry.lastWatched.getTime()) {
        merged[videoId] = { ...guestEntry, lastWatched: guestLastWatched };
        console.log(` -> Merged ${videoId}: Neither complete, guest more recent (or Firestore missing). Taking guest.`);
    } else {
        console.log(` -> Merged ${videoId}: Neither complete, Firestore more recent or same. Keeping Firestore.`);
    }
  }
  console.log("Merge complete. Result:", merged);
  return merged;
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
        return []; 
    }
};

// Create User Profile (used during sign-up/initial social sign-in)
export const createUserProfileDocument = async (uid: string, email: string | null, displayName: string | null, photoURL: string | null): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', uid);
    const createdAt = new Date(); 

    const newProfile: UserProfile = {
        uid: uid,
        email: email || '',
        displayName: displayName || email?.split('@')[0] || 'Learner',
        avatarUrl: photoURL || undefined,
        points: 0,
        badges: [],
        createdAt: createdAt,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
    };

    const firestoreData = {
        ...newProfile,
        createdAt: Timestamp.fromDate(createdAt),
        lastActivityDate: null, 
    };

    try {
        await setDoc(userDocRef, firestoreData);
        console.log(`Created profile for new user ${uid}`);
        return newProfile; 
    } catch (error) {
        console.error(`Error creating profile for user ${uid}:`, error);
        throw error; 
    }
};
