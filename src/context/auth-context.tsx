
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, DocumentData, Timestamp } from 'firebase/firestore';
import type { UserProfile, UserProgress } from '@/types';
import { getUserProgress, updateUserProgress, saveGuestProgress, loadGuestProgress, clearGuestProgress, mergeProgress, getUserProfile, createUserProfileDocument } from '@/services/user-progress'; // Import createUserProfileDocument
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  isGuest: boolean;
  loading: boolean;
  refreshUserProfile: () => Promise<void>;
  signIn: (firebaseUser: FirebaseUser) => Promise<void>; // Add signIn handler
  signOutUser: () => Promise<void>; // Add signOut handler
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(true); // Assume guest initially
  const { toast } = useToast();

  const fetchUserProfileAndSet = useCallback(async (firebaseUser: FirebaseUser | null): Promise<UserProfile | null> => {
    if (!firebaseUser) {
      setUserProfile(null);
      setIsGuest(true); // No Firebase user means guest
      return null;
    }

    setIsGuest(false); // Has Firebase user, not a guest

    // Try fetching existing profile first
    let profileData = await getUserProfile(firebaseUser.uid);

    if (!profileData) {
      // Create a profile if it doesn't exist (e.g., after social sign-in or first email registration)
      console.log(`Creating new profile for user ${firebaseUser.uid} in fetchUserProfileAndSet`);
      profileData = await createUserProfileDocument(
          firebaseUser.uid,
          firebaseUser.email,
          firebaseUser.displayName,
          firebaseUser.photoURL
      );
    }

    setUserProfile(profileData);
    return profileData;
  }, []);


  // Function to handle sign-in logic, including progress merging
  const signIn = useCallback(async (firebaseUser: FirebaseUser) => {
    setLoading(true);
    setUser(firebaseUser);
    setIsGuest(false);

    // 1. Load guest progress from local storage
    const guestProgress = loadGuestProgress();
    clearGuestProgress(); // Clear guest progress after loading

    // 2. Fetch or create user profile (fetchUserProfileAndSet handles creation if needed)
    const profile = await fetchUserProfileAndSet(firebaseUser);

    // 3. Fetch existing Firestore progress
    let firestoreProgress = await getUserProgress(firebaseUser.uid);

    // 4. Merge progress if guest progress exists
    if (guestProgress && profile) {
      const mergedProgress = mergeProgress(firestoreProgress || {}, guestProgress);

      // 5. Save merged progress back to Firestore (only if changes occurred)
      // Refined check: compare keys and values for actual differences
       let hasChanges = false;
       const mergedKeys = Object.keys(mergedProgress);
       const firestoreKeys = Object.keys(firestoreProgress || {});

       if (mergedKeys.length !== firestoreKeys.length) {
           hasChanges = true;
       } else {
           for (const key of mergedKeys) {
               const mergedEntry = mergedProgress[key];
               const firestoreEntry = firestoreProgress ? firestoreProgress[key] : undefined;
                // Ensure dates are Dates before comparison
                const mergedDate = mergedEntry.lastWatched instanceof Date ? mergedEntry.lastWatched : new Date(0);
                const firestoreDate = firestoreEntry?.lastWatched instanceof Date ? firestoreEntry.lastWatched : new Date(0);

               if (!firestoreEntry ||
                   mergedEntry.watchedTime !== firestoreEntry.watchedTime ||
                   mergedEntry.completed !== firestoreEntry.completed ||
                   mergedDate.getTime() !== firestoreDate.getTime()) { // Compare timestamps
                   hasChanges = true;
                   break;
               }
           }
       }

       if (hasChanges) {
           console.log("Merging guest progress into Firestore...");
           let lastMergedUpdateDate = new Date(0); // Track the latest date from merged progress
           for (const videoId in mergedProgress) {
              const entry = mergedProgress[videoId];
              // Ensure lastWatched is a valid Date before passing to updateUserProgress
              const lastWatchedDate = entry.lastWatched instanceof Date ? entry.lastWatched : new Date(); // Default to now if invalid
              // Intentionally DO NOT await updateUserProgress inside the loop to avoid multiple profile updates
              // We'll update the profile once after the loop if needed
               const progressDocRef = doc(db, 'userProgress', firebaseUser.uid);
               const updateData: { [key: string]: any } = {};
               updateData[`${videoId}.watchedTime`] = entry.watchedTime;
               updateData[`${videoId}.lastWatched`] = Timestamp.fromDate(lastWatchedDate);
               updateData[`${videoId}.completed`] = entry.completed;
               await setDoc(progressDocRef, updateData, { merge: true }); // Update progress entry

               if (lastWatchedDate.getTime() > lastMergedUpdateDate.getTime()) {
                   lastMergedUpdateDate = lastWatchedDate;
               }
           }

           // Update user profile's lastActivityDate based on the latest merge activity if necessary
           if (profile && (!profile.lastActivityDate || lastMergedUpdateDate.getTime() > profile.lastActivityDate.getTime())) {
               const userDocRef = doc(db, 'users', firebaseUser.uid);
               await updateDoc(userDocRef, { lastActivityDate: Timestamp.fromDate(lastMergedUpdateDate) });
               // Refresh profile locally after update
               await fetchUserProfileAndSet(firebaseUser);
           }

           firestoreProgress = mergedProgress; // Update local view of Firestore progress
           toast({
               title: "Progress Synced",
               description: "Your previous guest progress has been saved to your account.",
           });
       }
    }

    setLoading(false);
  }, [fetchUserProfileAndSet, toast]);

  // Function to handle sign out
  const signOutUser = useCallback(async () => {
    setLoading(true);
    try {
      await auth.signOut();
      setUser(null);
      setUserProfile(null);
      setIsGuest(true);
      // Guest progress is handled by local storage, no need to clear here unless desired
      toast({ title: "Signed Out", description: "See you next time!" });
    } catch (error) {
      console.error("Sign out error:", error);
      toast({ title: "Sign Out Error", description: "Could not sign out.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);


  // Effect to listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed. User:", firebaseUser?.uid);
      setLoading(true);
      if (firebaseUser) {
        // User is signed in. Fetch their profile.
        // fetchUserProfileAndSet handles both existing and new user profile creation.
        setUser(firebaseUser);
        await fetchUserProfileAndSet(firebaseUser);
      } else {
        // User is signed out. Reset state to guest.
        setUser(null);
        setUserProfile(null);
        setIsGuest(true);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfileAndSet]); // Dependency on fetchUserProfileAndSet


  // Function to manually refresh user profile data
  const refreshUserProfile = async () => {
    if (user) {
       console.log("Refreshing user profile...");
       setLoading(true); // Add loading state during refresh
       await fetchUserProfileAndSet(user);
       setLoading(false);
    } else {
        console.log("Cannot refresh profile, no user logged in.");
    }
  };


  return (
    <AuthContext.Provider value={{ user, userProfile, isGuest, loading, refreshUserProfile, signIn, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
