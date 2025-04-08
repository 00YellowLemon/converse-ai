import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface SessionContextType {
  user: User | null;
  loading: boolean;
  firebaseClient: any | null;
}

export const SessionContext = createContext<SessionContextType>({ user: null, loading: true, firebaseClient: null });

interface SessionContextProviderProps {
  children: ReactNode;
}

export const SessionContextProvider: React.FC<SessionContextProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [firebaseClient, setFirebaseClient] = useState<any | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          online: true,
          createdAt: new Date(),
          lastActive: new Date(),
          profilePictureUrl: user.photoURL
        }, { merge: true });
        setUser(user);
      } else {
        setUser(null);
        if (router) {
          router.push('/');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <SessionContext.Provider value={{ user, loading, firebaseClient }}>
      {children}
    </SessionContext.Provider>
  );
};

export type { SessionContextType };
