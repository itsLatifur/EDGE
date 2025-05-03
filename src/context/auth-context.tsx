
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc, DocumentData, Timestamp, FieldValue } from 'firebase/firestore'; // Import FieldValue
import type { UserProfile, UserProgress, UserProgressEntry } from '@/types';
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
      console.log("fetchUserProfileAndSet: No Firebase user, setting to guest.");
      return null;
    }

    setIsGuest(false); // Has Firebase user, not a guest
    console.log(`fetchUserProfileAndSet: Fetching profile for user ${firebaseUser.uid}`);

    try {
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
        console.log(`fetchUserProfileAndSet: Profile set for user ${firebaseUser.uid}`, profileData);
        return profileData;
    } catch (error) {
        console.error("fetchUserProfileAndSet: Error fetching or creating profile:", error);
        setUserProfile(null); // Reset profile on error
        return null;
    }
  }, []);


  // Function to handle sign-in logic, including progress merging
  const signIn = useCallback(async (firebaseUser: FirebaseUser) => {
    setLoading(true);
    setUser(firebaseUser);
    setIsGuest(false);
    console.log(`signIn: User ${firebaseUser.uid} signing in.`);

    try {
        // 1. Load guest progress from local storage
        const guestProgress = loadGuestProgress();
        if (guestProgress && Object.keys(guestProgress).length > 0) {
            console.log("signIn: Found guest progress:", guestProgress);
        } else {
             console.log("signIn: No guest progress found.");
        }
        clearGuestProgress(); // Clear guest progress after loading, regardless of content

        // 2. Fetch or create user profile (fetchUserProfileAndSet handles creation if needed)
        let profile = await fetchUserProfileAndSet(firebaseUser);
         if (!profile) {
             // If profile creation somehow failed, try one more time
             console.warn("signIn: Profile fetch/create failed initially, retrying...");
              profile = await createUserProfileDocument(
                  firebaseUser.uid,
                  firebaseUser.email,
                  firebaseUser.displayName,
                  firebaseUser.photoURL
              );
              setUserProfile(profile); // Update context state
         }

        if (!profile) {
            console.error("signIn: Failed to fetch or create profile even after retry. Aborting merge.");
            toast({ title: "Sign In Error", description: "Could not load user profile.", variant: "destructive" });
            setLoading(false);
            return;
        }

        // 3. Fetch existing Firestore progress
        let firestoreProgress = await getUserProgress(firebaseUser.uid);
        if (firestoreProgress) {
             console.log("signIn: Found Firestore progress:", firestoreProgress);
        } else {
             console.log("signIn: No Firestore progress found for user.");
             firestoreProgress = {}; // Ensure it's an object
        }


        // 4. Merge progress if guest progress exists
        if (guestProgress && Object.keys(guestProgress).length > 0) {
          const mergedProgress = mergeProgress(firestoreProgress || {}, guestProgress);

          // 5. Save merged progress back to Firestore if changes occurred
           let hasChanges = false;
           const mergedKeys = Object.keys(mergedProgress);
           const firestoreKeys = Object.keys(firestoreProgress || {});

           // Basic check: Different number of keys or different keys means changes
           if (mergedKeys.length !== firestoreKeys.length || !mergedKeys.every(key => firestoreKeys.includes(key))) {
               hasChanges = true;
           } else {
               // Detailed check: Compare values for each key
               for (const key of mergedKeys) {
                   const mergedEntry = mergedProgress[key];
                   const firestoreEntry = firestoreProgress ? firestoreProgress[key] : undefined;
                   const mergedDate = mergedEntry.lastWatched instanceof Date ? mergedEntry.lastWatched : new Date(0);
                   const firestoreDate = firestoreEntry?.lastWatched instanceof Date ? firestoreEntry.lastWatched : new Date(0);

                   if (!firestoreEntry ||
                       mergedEntry.watchedTime !== firestoreEntry.watchedTime ||
                       mergedEntry.completed !== firestoreEntry.completed ||
                       mergedDate.getTime() !== firestoreDate.getTime()) {
                       hasChanges = true;
                       break;
                   }
               }
           }

           if (hasChanges) {
               console.log("signIn: Merging guest progress into Firestore...");
               const progressDocRef = doc(db, 'userProgress', firebaseUser.uid);
               const updateData: { [key: string]: any } = {};
               let latestActivityDateFromMerge = profile.lastActivityDate || new Date(0);

               for (const videoId in mergedProgress) {
                    const entry = mergedProgress[videoId];
                    const firestoreEntry = firestoreProgress ? firestoreProgress[videoId] : undefined;
                    const mergedLastWatched = entry.lastWatched instanceof Date ? entry.lastWatched : new Date();

                     // Only update if the merged entry is different from the original firestore entry
                    if (!firestoreEntry ||
                        entry.watchedTime !== firestoreEntry.watchedTime ||
                        entry.completed !== firestoreEntry.completed ||
                        mergedLastWatched.getTime() !== firestoreEntry.lastWatched.getTime())
                    {
                        updateData[`${videoId}.watchedTime`] = entry.watchedTime;
                        updateData[`${videoId}.lastWatched`] = Timestamp.fromDate(mergedLastWatched);
                        updateData[`${videoId}.completed`] = entry.completed;

                         if (mergedLastWatched.getTime() > latestActivityDateFromMerge.getTime()) {
                             latestActivityDateFromMerge = mergedLastWatched;
                         }
                    }
               }

               if (Object.keys(updateData).length > 0) {
                  await setDoc(progressDocRef, updateData, { merge: true }); // Use setDoc with merge
                  console.log("signIn: Merged progress saved to Firestore.");

                   // Update user profile's lastActivityDate if merge resulted in a later date
                  if (latestActivityDateFromMerge.getTime() > (profile.lastActivityDate || new Date(0)).getTime()) {
                     const userDocRef = doc(db, 'users', firebaseUser.uid);
                     await updateDoc(userDocRef, { lastActivityDate: Timestamp.fromDate(latestActivityDateFromMerge) });
                     console.log("signIn: Updated profile lastActivityDate due to merge.");
                     // Refresh profile locally after update
                     await fetchUserProfileAndSet(firebaseUser);
                  }

                  firestoreProgress = mergedProgress; // Update local view of Firestore progress
                  toast({
                      title: "Progress Synced",
                      description: "Your previous guest progress has been saved.",
                  });
                } else {
                     console.log("signIn: No actual changes detected after merge calculation. Skipping Firestore update.");
                }

           } else {
                console.log("signIn: No merge needed or no changes detected.");
           }
        }

    } catch (error) {
        console.error("signIn: Error during sign-in or progress merge:", error);
        toast({ title: "Sign In Error", description: "An error occurred during sign in.", variant: "destructive" });
        // Optionally sign out user if sign-in failed critically
        // await signOutUser();
    } finally {
        setLoading(false);
    }
  }, [fetchUserProfileAndSet, toast]);

  // Function to handle sign out
  const signOutUser = useCallback(async () => {
    setLoading(true);
    console.log("signOutUser: Signing out...");
    try {
      await auth.signOut();
      setUser(null);
      setUserProfile(null);
      setIsGuest(true);
      // Guest progress is handled by local storage, no need to clear here unless desired
      console.log("signOutUser: Sign out successful. Setting to guest.");
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
      console.log("Auth state changed. Firebase user:", firebaseUser?.uid || 'null');
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
         console.log("Auth state changed: User signed out, setting to guest.");
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
```