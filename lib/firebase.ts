import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, where, setDoc, collection, addDoc, getDocs, query, orderBy, getDoc, limit, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDAnH4Hm54GJ6h5gQMtExwJolE8FbHNBBg",
  authDomain: "prod-ai-dd945.firebaseapp.com",
  projectId: "prod-ai-dd945",
  storageBucket: "prod-ai-dd945.appspot.com",
  messagingSenderId: "339827130138",
  appId: "1:339827130138:web:0f785b198075e5d654b6a3",
  measurementId: "G-V3J4963LJ7"
};

export let firebaseApp: FirebaseApp;

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
    const timestamp = new Date();
    await addDoc(chatRef, {
      chatId: chat.chatId,
      participants: chat.participants,
      createdAt: timestamp,
      updatedAt: timestamp, // Initialize with current timestamp
      chatName: chat.chatName
    });
  }
};

export const updateRecentChat = async (chatId: string, userId: string, otherUserId: string, messageText: string) => {
  try {
    // First, get the other user's information
    const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
    if (!otherUserDoc.exists()) return;
    
    const otherUserData = otherUserDoc.data();
    const timestamp = new Date();
    
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
      timestamp: timestamp
    }, { merge: true });

    // Also update the chat's updatedAt field
    const chatDocRef = doc(db, 'chats', chatId);
    await updateDoc(chatDocRef, {
      updatedAt: timestamp
    });
  } catch (error) {
    console.error("Error updating recent chat:", error);
  }
};

export const addMessageToFirestore = async (chatId: string, message: any) => {
  try {
    // Create a timestamp for this message
    const messageTimestamp = new Date();
    
    // Add message to the chat
    const messageRef = collection(db, `chats/${chatId}/messages`);
    await addDoc(messageRef, {
      senderId: message.senderId,
      text: message.text,
      timestamp: messageTimestamp,
    });
    
    // Update the chat document's updatedAt field
    const chatDocRef = doc(db, 'chats', chatId);
    await updateDoc(chatDocRef, {
      updatedAt: messageTimestamp
    });

    // Update recent chats if this is a user-to-user message
    if (message.receiverId && message.senderId) {
      await updateRecentChat(
        chatId, 
        message.senderId, 
        message.receiverId, 
        message.text
      );
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
    const chatsQuery = query(chatsCollection, 
      where("participants", "array-contains", userId),
      orderBy("updatedAt", "desc")
    );
    const chatsSnapshot = await getDocs(chatsQuery);
    
    const userChats = chatsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }));
    
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
      const messagesCollection = collection(db, `chats/${chat.id}/messages`);
      const messagesQuery = query(messagesCollection, orderBy("timestamp", "desc"), limit(1));
      const messagesSnapshot = await getDocs(messagesQuery);
      
      // Only include chats that have at least one message
      if (messagesSnapshot.empty) {
        return null;
      }
      
      let lastMessage = "No messages yet";
      let timestamp = chat.updatedAt ? chat.updatedAt.toDate() : new Date();
      
      if (!messagesSnapshot.empty) {
        const messageData = messagesSnapshot.docs[0].data();
        lastMessage = messageData.text;
        timestamp = messageData.timestamp.toDate();
      }
      
      return {
        chatId: chat.id,
        user: {
          uid: otherUserId,
          displayName: otherUserData.displayName,
          email: otherUserData.email,
          profilePictureUrl: otherUserData.profilePictureUrl
        },
        lastMessage,
        timestamp,
        updatedAt: chat.updatedAt ? chat.updatedAt.toDate() : new Date()
      };
    });
    
    const recentChats = (await Promise.all(recentChatsPromises)).filter(Boolean);
    
    return recentChats.sort((a, b) => {
      if (!a) return 1;
      if (!b) return -1;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

  } catch (error) {
    console.error("Error fetching recent chats:", error);
    return [];
  }
};