import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc, Timestamp, increment, serverTimestamp, FieldValue } from 'firebase/firestore';
import type { UserProgress, UserProgressEntry, UserProfile } from '@/types';

const GUEST_PROGRESS_KEY = 'selfLearnGuestProgress';

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

// --- Firestore User Progress ---

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
                 // Log a warning but still try to provide a default structure if possible
                 console.warn(`Invalid or missing Firestore progress data format for video ${videoId}, user ${userId}. Using defaults.`);
                 // Create a default entry if needed, or skip
                 // progress[videoId] = { watchedTime: 0, lastWatched: new Date(0), completed: false };
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

// Update user progress data in Firestore
export const updateUserProgress = async (
    userId: string,
    videoId: string,
    watchedTime: number,
    isCompleted: boolean,
    lastWatchedDate: Date = new Date() // Optional: allow passing specific date for merging
    ): Promise<void> => {
  if (!userId) return;
  const progressDocRef = doc(db, 'userProgress', userId);
  const updateData: { [key: string]: any } = {};
  const fieldPathPrefix = `${videoId}`; // Using videoId directly as key should be fine

  updateData[`${fieldPathPrefix}.watchedTime`] = watchedTime;
  // Ensure we use Firestore Timestamp when writing
  updateData[`${fieldPathPrefix}.lastWatched`] = Timestamp.fromDate(lastWatchedDate);
  updateData[`${fieldPathPrefix}.completed`] = isCompleted;

  try {
      // Use setDoc with merge: true to create the document if it doesn't exist
      // or update specific fields if it does.
      await setDoc(progressDocRef, updateData, { merge: true });
  } catch(error) {
       console.error(`Error updating Firestore progress for user ${userId}, video ${videoId}:`, error);
       throw error; // Re-throw error to be handled by the caller if needed
  }
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


// --- User Profile & Gamification (Firestore) ---

// Fetch user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!userId) return null;
    const userDocRef = doc(db, 'users', userId);
    try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            const data = userDocSnap.data();
             // Convert Firestore Timestamp to Date, handle potential undefined
            const createdAtTimestamp = data.createdAt;
            const createdAt = createdAtTimestamp instanceof Timestamp ? createdAtTimestamp.toDate() : new Date(); // Default to now if missing/invalid

            return {
                uid: data.uid || userId, // Ensure uid is present
                email: data.email || '',
                displayName: data.displayName || 'Learner',
                points: data.points ?? 0,
                badges: Array.isArray(data.badges) ? data.badges : [], // Ensure badges is an array
                createdAt: createdAt,
            } as UserProfile;
        } else {
            console.log(`Profile not found for user ${userId}, potentially a new user.`);
            return null; // Return null if profile doesn't exist yet
        }
    } catch (error) {
         console.error(`Error fetching profile for user ${userId}:`, error);
    }
    return null; // Return null on error
}

// Award points to a user
export const awardPoints = async (userId: string, points: number): Promise<void> => {
  if (!userId || points === 0) return; // Don't update if no points
  const userDocRef = doc(db, 'users', userId);
   try {
       // Use updateDoc which requires the document to exist.
       // If creating profile/awarding points first time, ensure profile exists first.
       await updateDoc(userDocRef, {
           points: increment(points)
       });
       console.log(`Awarded ${points} points to user ${userId}`);
   } catch(error) {
       console.error(`Error awarding points to user ${userId}:`, error);
        // Consider if profile might not exist yet
       const profile = await getUserProfile(userId);
       if (!profile) {
           console.warn(`Attempted to award points to non-existent profile for user ${userId}`);
           // Optionally create profile here or handle differently
       }
   }
};

// Award a badge to a user
export const awardBadge = async (userId: string, badgeId: string): Promise<void> => {
  if (!userId || !badgeId) return;
  const userDocRef = doc(db, 'users', userId);

  try {
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const currentBadges = Array.isArray(userData.badges) ? userData.badges : []; // Ensure it's an array
        if (!currentBadges.includes(badgeId)) {
          await updateDoc(userDocRef, {
            badges: [...currentBadges, badgeId]
          });
          console.log(`Awarded badge "${badgeId}" to user ${userId}`);
        } else {
           console.log(`User ${userId} already has badge "${badgeId}".`);
        }
      } else {
           console.warn(`Attempted to award badge to non-existent profile for user ${userId}`);
           // Optionally create profile here or handle differently
      }
  } catch(error) {
       console.error(`Error awarding badge ${badgeId} to user ${userId}:`, error);
  }
};
