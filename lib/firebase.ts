import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, addDoc, getDocs, query, orderBy, getDoc } from 'firebase/firestore';

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

// Update recentChats when a new message is sent
export const updateRecentChat = async (chatId: string, userId: string, otherUserId: string, messageText: string) => {
  try {
    // First, get the other user's information
    const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
    if (!otherUserDoc.exists()) return;
    
    const otherUserData = otherUserDoc.data();
    
    // Create/update entry in recentChats collection
    const recentChatRef = doc(db, 'recentChats', chatId);
    await setDoc(recentChatRef, {
      chatId: chatId,
      user: {
        uid: otherUserId,
        displayName: otherUserData.displayName,
        email: otherUserData.email,
        profilePictureUrl: otherUserData.profilePictureUrl
      },
      lastMessage: messageText,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Error updating recent chat:", error);
  }
};

// Modified addMessageToFirestore function to also update recent chats
export const addMessageToFirestore = async (chatId: string, message: any) => {
  try {
    // Add message to the chat
    const messageRef = collection(db, `chats/${chatId}/messages`);
    await addDoc(messageRef, {
      senderId: message.senderId,
      text: message.text,
      timestamp: new Date(),
    });
    
    // Get chat document to find the other participant
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    if (!chatDoc.exists()) return;
    
    const chatData = chatDoc.data();
    const participants = chatData.participants || [];
    
    // Find the other user's ID (not the sender)
    const otherUserId = participants.find((id: string) => id !== message.senderId);
    
    if (otherUserId) {
      // Update recent chats for both participants
      await updateRecentChat(chatId, message.senderId, otherUserId, message.text);
    }
  } catch (error) {
    console.error("Error adding message to Firestore:", error);
  }
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

export const fetchRecentChats = async (userId: string) => {
  try {
    // Get all chats the user is a participant in
    const chatsCollection = collection(db, 'chats');
    const chatsSnapshot = await getDocs(chatsCollection);
    
    const userChats = chatsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((chat: any) => chat.participants && chat.participants.includes(userId));
    
    // For each chat, get the last message and other participant info
    const recentChatsPromises = userChats.map(async (chat: any) => {
      // Get the other participant's ID
      const otherUserId = chat.participants.find((id: string) => id !== userId);
      
      if (!otherUserId) return null;
      
      // Get other user info
      const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
      if (!otherUserDoc.exists()) return null;
      
      const otherUserData = otherUserDoc.data();
      
      // Get the last message from the chat
      const messagesCollection = collection(db, `chats