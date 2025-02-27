import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDAnH4Hm54GJ6h5gQMtExwJolE8FbHNBBg",
  authDomain: "prod-ai-dd945.firebaseapp.com",
  projectId: "prod-ai-dd945",
  storageBucket: "prod-ai-dd945.firebasestorage.app",
  messagingSenderId: "339827130138",
  appId: "1:339827130138:web:0f785b198075e5d654b6a3",
  measurementId: "G-V3J4963LJ7"
};

let firebaseApp: FirebaseApp;

if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApps()[0];
}

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

// Create a new Google Auth provider
export const googleProvider = new GoogleAuthProvider();

export const addUserToFirestore = async (user: any) => {
  if (user) {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      lastSeen: new Date()
    }, { merge: true });
  }
};

export { firebaseApp };
