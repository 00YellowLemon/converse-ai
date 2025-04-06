import { FC, useContext, useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { SessionContext } from "@/lib/session-context";
import ChatTile from "./RecentChatTile";
import { Card, CardContent } from "./ui/card";
import { MessageSquare } from "lucide-react";

interface UserData {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  profilePictureUrl?: string;
}

interface RecentChatData {
  chatId: string;
  user: UserData;
  lastMessage: string;
  timestamp: Date;
}

interface RecentChatsProps {
  limit?: number;
}

const RecentChats: FC<RecentChatsProps> = ({ limit: chatLimit = 7 }) => {
  const { user } = useContext(SessionContext);
  const [recentChats, setRecentChats] = useState<RecentChatData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    
    const recentChatsCollection = collection(db, "recentChats");
    
    // Create query with orderBy and limit to get most recent chats
    const recentChatsQuery = query(
      recentChatsCollection, 
      orderBy("timestamp", "desc"), 
      limit(chatLimit)
    );
    
    const unsubscribe = onSnapshot(recentChatsQuery, (snapshot) => {
      const updatedRecentChats: RecentChatData[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          chatId: doc.id,
          user: data.user,
          lastMessage: data.lastMessage,
          timestamp: data.timestamp?.toDate() || new Date()
        } as RecentChatData;
      });

      setRecentChats(updatedRecentChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, chatLimit]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (recentChats.length === 0) {
    return (
      <Card className="bg-white p-8 text-center">
        <CardContent className="pt-6 flex flex-col items-center justify-center">
          <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-lg font-medium text-gray-700">No recent chats</p>
          <p className="text-gray-500 mt-1">Start a conversation to see your chats here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recentChats.map(chat => (
        <ChatTile 
          key={chat.chatId}
          user={chat.user}
          lastMessage={chat.lastMessage}
          timestamp={chat.timestamp}
          onClick={() => router.push(`/chat/${chat.chatId}`)}
        />
      ))}
    </div>
  );
};

export default RecentChats;