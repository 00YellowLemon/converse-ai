import Sidebar from "@/components/Sidebar";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionContext } from "@/lib/session-context";
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, onSnapshot, query, setDoc, addDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChatTile from "@/components/ChatTile"; // Import ChatTile component

interface UserData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  online?: boolean;
  createdAt?: Date;
  lastActive?: Date;
  profilePictureUrl?: string;
}

interface ChatData {
  chatId: string;
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
  chatName?: string;
}

interface MessageData {
  messageId: string;
  senderId: string;
  text: string;
  timestamp: Date;
  aiInsightRequest?: boolean;
  aiInsightResponse?: string;
}

interface AiGlobalRequestData {
  requestId: string;
  userId: string;
  query: string;
  timestamp: Date;
  response?: string;
  relatedChatIds?: string[];
}

interface RecentChatData {
  chatId: string;
  user: UserData;
  lastMessage: string;
}

export default function Home() {
  const { user, loading, firebaseClient } = useContext(SessionContext);
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [chats, setChats] = useState<ChatData[]>([]);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [aiGlobalRequests, setAiGlobalRequests] = useState<AiGlobalRequestData[]>([]);
  const [recentChats, setRecentChats] = useState<RecentChatData[]>([]); // State for recent chats
  const [isChatStarted, setIsChatStarted] = useState<boolean>(false); // State to track if a chat has started

  useEffect(() => { 
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <>
        <div>
          <p>Loading...</p>
        </div>
        <Sidebar/>
      </>);
  }

  if (!user) {
    return null;
  }

  useEffect(() => {
    const usersCollection = collection(db, "users");
    const userDocRef = doc(usersCollection, user.uid);
    const setUserData = async () => {
        await setDoc(userDocRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          online: true,
          createdAt: new Date(),
          lastActive: new Date(),
          profilePictureUrl: user.photoURL
        },{ merge: true })
    };
    setUserData();

    const unsubscribe = onSnapshot(query(usersCollection), (snapshot) => {
      const updatedUsers: UserData[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: data.uid,
          displayName: data.displayName,
          email: data.email,
          photoURL: data.photoURL,
          online: data.online,
          createdAt: data.createdAt?.toDate(),
          lastActive: data.lastActive?.toDate(),
          profilePictureUrl: data.profilePictureUrl
        } as UserData;
      });

      setUsers(updatedUsers);
    });

    return () => unsubscribe();
  }, [user,firebaseClient]);

  useEffect(() => {
    const chatsCollection = collection(db, "chats");
    const setChatData = async () => {
      setIsChatStarted(true); // Set isChatStarted to true when a chat is initiated
    };

    const unsubscribe = onSnapshot(query(chatsCollection), (snapshot) => {
      const updatedChats: ChatData[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          chatId: data.chatId,
          participants: data.participants,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          chatName: data.chatName
        } as ChatData;
      });

      setChats(updatedChats);
    });

    return () => unsubscribe();
  }, [user,firebaseClient]);

  const handleSendMessage = async (chatId: string, message: MessageData) => {
    if (isChatStarted) {
      const messagesCollection = collection(db, `chats/${chatId}/messages`);
      await addDoc(messagesCollection, {
        messageId: message.messageId,
        senderId: message.senderId,
        text: message.text,
        timestamp: new Date(),
        aiInsightRequest: message.aiInsightRequest,
        aiInsightResponse: message.aiInsightResponse
      });
    }
  };

  useEffect(() => {
    const messagesCollection = collection(db, "chats/exampleChatId/messages");
    const setMessageData = async () => {
      await addDoc(messagesCollection, {
        messageId: "exampleMessageId",
        senderId: user.uid,
        text: "Hello, this is a test message.",
        timestamp: new Date(),
        aiInsightRequest: false,
        aiInsightResponse: ""
      });
    };
    setMessageData();

    const unsubscribe = onSnapshot(query(messagesCollection), (snapshot) => {
      const updatedMessages: MessageData[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          messageId: data.messageId,
          senderId: data.senderId,
          text: data.text,
          timestamp: data.timestamp.toDate(),
          aiInsightRequest: data.aiInsightRequest,
          aiInsightResponse: data.aiInsightResponse
        } as MessageData;
      });

      setMessages(updatedMessages);
    });

    return () => unsubscribe();
  }, [user,firebaseClient]);

  useEffect(() => {
    const aiGlobalRequestsCollection = collection(db, "aiGlobalRequests");
    const setAiGlobalRequestData = async () => {
      await addDoc(aiGlobalRequestsCollection, {
        requestId: "exampleRequestId",
        userId: user.uid,
        query: "What is the weather like today?",
        timestamp: new Date(),
        response: "The weather is sunny.",
        relatedChatIds: ["exampleChatId"]
      });
    };
    setAiGlobalRequestData();

    const unsubscribe = onSnapshot(query(aiGlobalRequestsCollection), (snapshot) => {
      const updatedAiGlobalRequests: AiGlobalRequestData[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          requestId: data.requestId,
          userId: data.userId,
          query: data.query,
          timestamp: data.timestamp.toDate(),
          response: data.response,
          relatedChatIds: data.relatedChatIds
        } as AiGlobalRequestData;
      });

      setAiGlobalRequests(updatedAiGlobalRequests);
    });

    return () => unsubscribe();
  }, [user,firebaseClient]);

  useEffect(() => {
    const recentChatsCollection = collection(db, "recentChats");
    const unsubscribe = onSnapshot(query(recentChatsCollection), (snapshot) => {
      const updatedRecentChats: RecentChatData[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          chatId: data.chatId,
          user: data.user,
          lastMessage: data.lastMessage
        } as RecentChatData;
      });

      setRecentChats(updatedRecentChats);
    });

    return () => unsubscribe();
  }, [user, firebaseClient]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">
        Welcome, {user.displayName}!
      </h1>
      <p className="text-center mb-8">
          User List
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((userData) => (
          <Card
            key={userData.uid}
            className="border-2 border-gray-300 hover:border-blue-500 transition-all duration-300"
          >
            <CardHeader>
              <CardTitle className="font-semibold">{userData.displayName}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Email: {userData.email}</p>
              <p className="text-sm text-gray-600">Online: {userData.online ? "Yes" : "No"}</p>
              <p className="text-sm text-gray-600">Created At: {userData.createdAt?.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Last Active: {userData.lastActive?.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Profile Picture URL: {userData.profilePictureUrl}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <h2 className="text-2xl font-bold text-center mt-8 mb-4">Recent Chats</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recentChats.map((chat) => (
          <ChatTile key={chat.chatId} user={chat.user} lastMessage={chat.lastMessage} />
        ))}
      </div>
      <button 
        className="fixed bottom-4 right-4 bg-blue-500 text-white py-2 px-4 rounded-full shadow-lg"
        onClick={() => router.push('/chat')}
      >
        Chat to AI
      </button>
    </div>
  );
}
