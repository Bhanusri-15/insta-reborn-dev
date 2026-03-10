import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Ensure user profile document exists
        const profileRef = doc(db, 'users', firebaseUser.uid);
        const profileSnap = await getDoc(profileRef);
        if (!profileSnap.exists()) {
          await setDoc(profileRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'user',
            display_name: firebaseUser.displayName || '',
            avatar_url: firebaseUser.photoURL || '',
            bio: '',
            website: '',
            is_private: false,
            created_at: serverTimestamp(),
          });
          console.log('[Auth] Created new user profile for', firebaseUser.uid);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const profileRef = doc(db, 'users', cred.user.uid);
      await setDoc(profileRef, {
        uid: cred.user.uid,
        email,
        username,
        display_name: username,
        avatar_url: '',
        bio: '',
        website: '',
        is_private: false,
        created_at: serverTimestamp(),
      });
      console.log('[Auth] Sign up success:', cred.user.uid);
      return { error: null };
    } catch (error: any) {
      console.error('[Auth] Sign up error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('[Auth] Sign in success');
      return { error: null };
    } catch (error: any) {
      console.error('[Auth] Sign in error:', error);
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      console.log('[Auth] Google sign in success');
      return { error: null };
    } catch (error: any) {
      console.error('[Auth] Google sign in error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    console.log('[Auth] Signed out');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
