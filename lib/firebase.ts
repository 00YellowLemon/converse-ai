import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

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
    messageId: message.messageId,
    senderId: message.senderId,
    text: message.text,
    timestamp: new Date(),
    aiInsightRequest: message.aiInsightRequest,
    aiInsightResponse: message.aiInsightResponse
  });
};

export const addAiGlobalRequestToFirestore = async (request: any) => {
  const requestRef = collection(db, 'aiGlobalRequests');
  await addDoc(requestRef, {
    requestId: request.requestId,
    userId: request.userId,
    query: request.query,
    timestamp: new Date(),
    response: request.response,
    relatedChatIds: request.relatedChatIds
  });
};

export const fetchRecentChats = async () => {
  const recentChatsCollection = collection(db, 'recentChats');
  const recentChatsQuery = query(recentChatsCollection, orderBy("timestamp", "desc"));
  const snapshot = await getDocs(recentChatsQuery);
  const recentChats = snapshot.docs.map(doc => doc.data());
  return recentChats;
};

const chatGoogleGenerativeAI = new ChatGoogleGenerativeAI({ modelName: "gemini-pro" });

export { firebaseApp, chatGoogleGenerativeAI };
