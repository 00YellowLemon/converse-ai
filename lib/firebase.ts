import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';

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
      lastSeen: new Date(),
      createdAt: new Date(),
      lastActive: new Date(),
      profilePictureUrl: user.photoURL
    }, { merge: true });
  }
};

export const addChatToFirestore = async (chat: any, isChatStarted: boolean) => {
  if (isChatStarted) {
    const chatRef = collection(db, 'chats');
    await addDoc(chatRef, {
      chatId: chat.chatId,
      participants: chat.participants,
      createdAt: new Date(),
      updatedAt: new Date(),
      chatName: chat.chatName
    });
  }
};

export const addMessageToFirestore = async (chatId: string, message: any) => {
  const messageRef = collection(db, `chats/${chatId}/messages`);
  await addDoc(messageRef, {
    senderId: message.senderId,
    text: message.text,
    timestamp: new Date(),
  });
};

export const addAIMessageToFirestore = async (chatId: string, userId: string, message: any) => {
  const aiMessageRef = collection(db, `chats/${chatId}/userAIChats/${userId}/aiMessages`);
  await addDoc(aiMessageRef, {
    sender: message.sender, // "USER" or "AI"
    text: message.text,
    timestamp: new Date(),
  });
};

export const fetchUserAIMessages = async (chatId: string, userId: string) => {
  const aiMessagesCollection = collection(db, `chats/${chatId}/userAIChats/${userId}/aiMessages`);
  const aiMessagesQuery = query(aiMessagesCollection, orderBy("timestamp", "asc"));
  const snapshot = await getDocs(aiMessagesQuery);
  const aiMessages = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  return aiMessages;
};

export const fetchRecentChats = async () => {
  const recentChatsCollection = collection(db, 'recentChats');
  const recentChatsQuery = query(recentChatsCollection, orderBy("timestamp", "desc"));
  const snapshot = await getDocs(recentChatsQuery);
  const recentChats = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      timestamp: data.timestamp?.toMillis()
    };
  });
  return recentChats;
};

export const signUpWithEmailAndPassword = async (email: string, password: string, username: string) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const user = result.user;
  const userDocRef = doc(db, 'users', user.uid);
  await setDoc(userDocRef, {
    uid: user.uid,
    displayName: username,
    email: user.email,
    photoURL: user.photoURL,
    createdAt: new Date(),
    lastActive: new Date(),
    profilePictureUrl: user.photoURL
  }, { merge: true });
};

export const signUpWithGoogle = async (username: string) => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const userDocRef = doc(db, 'users', user.uid);
  await setDoc(userDocRef, {
    uid: user.uid,
    displayName: username || user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    createdAt: new Date(),
    lastActive: new Date(),
    profilePictureUrl: user.photoURL
  }, { merge: true });
};

export { firebaseApp };