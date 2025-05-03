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
                progress[videoId].lastWatched = new Date(progress[videoId].lastWatched);
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
                 console.warn(`Invalid progress data format for video ${videoId} for user ${userId}`);
                 // Optionally handle or skip invalid entries
            }
        }
        return progress;
      }
  } catch(error) {
      console.error(`Error fetching Firestore progress for user ${userId}:`, error);
  }
  return null; // Or return an empty object {} if preferred
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
  const fieldPathPrefix = `${videoId}`; // Firestore field paths don't support backticks well sometimes

  updateData[`${fieldPathPrefix}.watchedTime`] = watchedTime;
  // Ensure we use Firestore Timestamp when writing
  updateData[`${fieldPathPrefix}.lastWatched`] = Timestamp.fromDate(lastWatchedDate);
  updateData[`${fieldPathPrefix}.completed`] = isCompleted;

  try {
      await setDoc(progressDocRef, updateData, { merge: true });
  } catch(error) {
       console.error(`Error updating Firestore progress for user ${userId}, video ${videoId}:`, error);
  }
};


// --- Merging Logic ---

export const mergeProgress = (firestoreProgress: UserProgress, guestProgress: UserProgress): UserProgress => {
  const merged: UserProgress = { ...firestoreProgress };

  for (const videoId in guestProgress) {
    const guestEntry = guestProgress[videoId];
    const firestoreEntry = firestoreProgress[videoId];

    // Basic merge: prioritize the entry with the later lastWatched date
    // Or if firestore entry doesn't exist, take guest entry
    // Also prioritize completed status if one is completed and the other isn't
    if (
        !firestoreEntry ||
        guestEntry.completed && !firestoreEntry.completed ||
        (!firestoreEntry.completed && guestEntry.lastWatched.getTime() > firestoreEntry.lastWatched.getTime())
        ) {

         // Ensure the guest entry's lastWatched is a Date object before adding
         merged[videoId] = {
            ...guestEntry,
            lastWatched: guestEntry.lastWatched instanceof Date ? guestEntry.lastWatched : new Date(guestEntry.lastWatched)
         };
    }
    // If firestore entry is completed, keep it unless guest entry is somehow more recent *and* completed (unlikely)
    else if (firestoreEntry.completed && !guestEntry.completed) {
        // Keep firestore version
    }
    // If both are incomplete, take the one with the later timestamp
    else if (!firestoreEntry.completed && !guestEntry.completed && guestEntry.lastWatched.getTime() > firestoreEntry.lastWatched.getTime()) {
        merged[videoId] = {
            ...guestEntry,
            lastWatched: guestEntry.lastWatched instanceof Date ? guestEntry.lastWatched : new Date(guestEntry.lastWatched)
         };
    }
     // Handle case where watched time might be higher in guest but timestamp is older (less likely with current logic)
     else if (firestoreEntry && guestEntry.watchedTime > firestoreEntry.watchedTime && guestEntry.lastWatched.getTime() <= firestoreEntry.lastWatched.getTime()) {
         // Optionally update watched time but keep firestore timestamp?
         // For simplicity, the current logic based on timestamp and completion is likely sufficient.
     }
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
             // Convert Firestore Timestamp to Date
            const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date();
            return {
                uid: data.uid,
                email: data.email,
                displayName: data.displayName,
                points: data.points ?? 0,
                badges: data.badges ?? [],
                createdAt: createdAt,
            } as UserProfile;
        }
    } catch (error) {
         console.error(`Error fetching profile for user ${userId}:`, error);
    }
    return null;
}

// Award points to a user
export const awardPoints = async (userId: string, points: number): Promise<void> => {
  if (!userId) return;
  const userDocRef = doc(db, 'users', userId);
   try {
       await updateDoc(userDocRef, {
           points: increment(points)
       });
   } catch(error) {
       console.error(`Error awarding points to user ${userId}:`, error);
   }
};

// Award a badge to a user
export const awardBadge = async (userId: string, badgeId: string): Promise<void> => {
  if (!userId) return;
  const userDocRef = doc(db, 'users', userId);

  try {
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const currentBadges = userData.badges || []; // Handle case where badges array might not exist
        if (!currentBadges.includes(badgeId)) {
          await updateDoc(userDocRef, {
            badges: [...currentBadges, badgeId]
          });
        }
      }
  } catch(error) {
       console.error(`Error awarding badge ${badgeId} to user ${userId}:`, error);
  }
};
