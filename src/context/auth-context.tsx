'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, DocumentData, Timestamp } from 'firebase/firestore';
import type { UserProfile, UserProgress } from '@/types';
import { getUserProgress, updateUserProgress, saveGuestProgress, loadGuestProgress, clearGuestProgress, mergeProgress, getUserProfile } from '@/services/user-progress';
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

  const fetchUserProfileAndSet = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      setUserProfile(null);
      setIsGuest(true); // No Firebase user means guest
      return null;
    }

    setIsGuest(false); // Has Firebase user, not a guest
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    let userDocSnap = await getDoc(userDocRef);
    let profileData: UserProfile | null = null;

    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
       // Ensure createdAt is a Date object
       let createdAtDate = new Date(); // Default to now
       if (data.createdAt && data.createdAt instanceof Timestamp) {
           createdAtDate = data.createdAt.toDate();
       }
       profileData = {
         uid: data.uid || firebaseUser.uid,
         email: data.email || firebaseUser.email || '',
         displayName: data.displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Learner',
         avatarUrl: data.avatarUrl || firebaseUser.photoURL || undefined, // Include avatarUrl
         points: data.points ?? 0,
         badges: Array.isArray(data.badges) ? data.badges : [],
         createdAt: createdAtDate,
       };
    } else {
      // Create a basic profile if it doesn't exist (e.g., after social sign-in)
      console.log(`Creating new profile for user ${firebaseUser.uid}`);
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Learner',
        avatarUrl: firebaseUser.photoURL || undefined, // Include avatarUrl on creation
        points: 0,
        badges: [],
        createdAt: new Date(), // Use JS Date directly here
      };
      // Ensure createdAt is Firestore Timestamp when writing
      await setDoc(userDocRef, { ...newProfile, createdAt: Timestamp.fromDate(newProfile.createdAt) });
      profileData = newProfile;
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

    // 2. Fetch or create user profile
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
               if (!firestoreEntry ||
                   mergedEntry.watchedTime !== firestoreEntry.watchedTime ||
                   mergedEntry.completed !== firestoreEntry.completed ||
                   mergedEntry.lastWatched.getTime() !== firestoreEntry.lastWatched.getTime()) {
                   hasChanges = true;
                   break;
               }
           }
       }

       if (hasChanges) {
           console.log("Merging guest progress into Firestore...");
           for (const videoId in mergedProgress) {
              const entry = mergedProgress[videoId];
              // Ensure lastWatched is a valid Date before converting
              const lastWatchedDate = entry.lastWatched instanceof Date ? entry.lastWatched : new Date();
              await updateUserProgress(firebaseUser.uid, videoId, entry.watchedTime, entry.completed, lastWatchedDate);
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
        // Don't automatically merge here, let the explicit signIn handle it
        setUser(firebaseUser);
        await fetchUserProfileAndSet(firebaseUser);
      } else {
        setUser(null);
        setUserProfile(null);
        setIsGuest(true);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfileAndSet]);


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
