import { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';
import { onSnapshot, doc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { dbService } from '../services/db';
import { UserProfile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        // Initial check and potential creation
        let userProfile = await dbService.getUserProfile(firebaseUser.uid);
        if (!userProfile) {
          const isMonitor = firebaseUser.email === 'brennomcpe10@gmail.com';
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'Estudante',
            email: firebaseUser.email || '',
            role: isMonitor ? 'monitor' : 'student',
          };
          await dbService.createUserProfile(newProfile);
        }

        // Real-time listener for the profile
        unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (snapshot) => {
          if (snapshot.exists()) {
            setProfile({ uid: firebaseUser.uid, ...snapshot.data() } as UserProfile);
          }
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in', error);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return { user, profile, loading, signIn, signOut };
}
