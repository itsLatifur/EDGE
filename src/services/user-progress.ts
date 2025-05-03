
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc, Timestamp, increment } from 'firebase/firestore';
import type { UserProgress, UserProfile } from '@/types';

// Fetch user progress data
export const getUserProgress = async (userId: string): Promise<UserProgress | null> => {
  const progressDocRef = doc(db, 'userProgress', userId);
  const progressDocSnap = await getDoc(progressDocRef);
  if (progressDocSnap.exists()) {
    // Convert Timestamps back to Dates
    const data = progressDocSnap.data();
    const progress: UserProgress = {};
    for (const videoId in data) {
        progress[videoId] = {
            ...data[videoId],
            lastWatched: (data[videoId].lastWatched as Timestamp).toDate(),
        };
    }
    return progress;
  }
  return null; // Or return an empty object {} if preferred
};

// Update user progress data
export const updateUserProgress = async (userId: string, videoId: string, watchedTime: number, isCompleted: boolean): Promise<void> => {
  const progressDocRef = doc(db, 'userProgress', userId);
  const updateData = {
    [`${videoId}.watchedTime`]: watchedTime,
    [`${videoId}.lastWatched`]: Timestamp.now(), // Use Firestore Timestamp
    [`${videoId}.completed`]: isCompleted,
  };
  await setDoc(progressDocRef, updateData, { merge: true });
};

// Fetch user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
        return {
            ...userDocSnap.data(),
            createdAt: (userDocSnap.data().createdAt as Timestamp).toDate(),
        } as UserProfile;
    }
    return null;
}

// Award points to a user
export const awardPoints = async (userId: string, points: number): Promise<void> => {
  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    points: increment(points)
  });
};

// Award a badge to a user
export const awardBadge = async (userId: string, badgeId: string): Promise<void> => {
  const userDocRef = doc(db, 'users', userId);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const userData = userDocSnap.data() as UserProfile;
    if (!userData.badges.includes(badgeId)) {
      await updateDoc(userDocRef, {
        badges: [...userData.badges, badgeId]
      });
    }
  }
};
