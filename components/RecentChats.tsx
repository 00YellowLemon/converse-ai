import { FC, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionContext } from "@/lib/session-context";
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { Card, CardContent } from "./ui/card";
import ChatTile from "./RecentChatTile";
import { MessageSquare } from "lucide-react";

interface ChatData {
  chatId: string;
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
  chatName?: string;
  lastMessage?: string;
  lastMessageTimestamp?: Date; // Add this field to track last message timestamp
  hasMessages: boolean;
}

interface UserData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  profilePictureUrl?: string;
}

interface RecentChatsProps {
  limit?: number;
}

const RecentChats: FC<RecentChatsProps> = ({ limit: chatLimit = 7 }) => {
  const { user, loading: sessionLoading } = useContext(SessionContext);
  const router = useRouter();
  const [chats, setChats] = useState<ChatData[]>([]);
  const [users, setUsers] = useState<Record<string, UserData>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      try {
        setLoading(true);
        // Get chats where the current user is a participant
        const chatsCollection = collection(db, "chats");
        const chatsQuery = query(
          chatsCollection, 
          where("participants", "array-contains", user.uid),
          orderBy("updatedAt", "desc"),
          limit(chatLimit)
        );
        
        const chatsSnapshot = await getDocs(chatsQuery);
        const chatsData: ChatData[] = [];
        
        for (const chatDoc of chatsSnapshot.docs) {
          const chatData = chatDoc.data();
          
          // Get the last message
          const messagesCollection = collection(db, `chats/${chatDoc.id}/messages`);
          const messagesQuery = query(messagesCollection, orderBy("timestamp", "desc"), limit(1));
          const messagesSnapshot = await getDocs(messagesQuery);
          
          const hasMessages = messagesSnapshot.docs.length > 0;
          let lastMessage = "No messages yet";
          let lastMessageTimestamp = chatData.updatedAt.toDate();
          
          if (hasMessages) {
            const messageData = messagesSnapshot.docs[0].data();
            lastMessage = messageData.text;
            lastMessageTimestamp = messageData.timestamp.toDate();
          }
          
          // Only add chats that have at least one message
          if (hasMessages) {
            chatsData.push({
              chatId: chatDoc.id,
              participants: chatData.participants,
              createdAt: chatData.createdAt.toDate(),
              updatedAt: chatData.updatedAt.toDate(),
              chatName: chatData.chatName,
              lastMessage,
              lastMessageTimestamp, // Store the actual message timestamp
              hasMessages
            });
          }
        }
        
        // Sort chats by the last message timestamp
        chatsData.sort((a, b) => {
          return (b.lastMessageTimestamp?.getTime() || 0) - (a.lastMessageTimestamp?.getTime() || 0);
        });
        
        setChats(chatsData);
        
        // Fetch user data for all participants
        const userIds = new Set<string>();
        chatsData.forEach(chat => {
          chat.participants.forEach(participantId => {
            if (participantId !== user.uid) {
              userIds.add(participantId);
            }
          });
        });
        
        const usersData: Record<string, UserData> = {};
        for (const userId of userIds) {
          const userCollection = collection(db, "users");
          const userQuery = query(userCollection, where("uid", "==", userId));
          const userSnapshot = await getDocs(userQuery);
          
          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            usersData[userId] = {
              uid: userData.uid,
              displayName: userData.displayName,
              email: userData.email,
              photoURL: userData.photoURL,
              profilePictureUrl: userData.profilePictureUrl
            };
          }
        }
        
        setUsers(usersData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching chats:", error);
        setLoading(false);
      }
    };
    
    fetchChats();
  }, [user, chatLimit]);

  if (sessionLoading || loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (chats.length === 0) {
    return (
      <Card className="bg-white p-8 text-center">
        <CardContent className="pt-6 flex flex-col items-center justify-center">
          <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-lg font-medium text-gray-700">No conversations yet</p>
          <p className="text-gray-500 mt-1">Start a conversation to see your chats here</p>
        </CardContent>
      </Card>
    );
  }

  const getChatPartnerInfo = (chat: ChatData) => {
    const partnerId = chat.participants.find(id => id !== user.uid);
    if (!partnerId) return null;
    
    return users[partnerId] || null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {chats.map(chat => {
        const partner = getChatPartnerInfo(chat);
        return (
          <ChatTile 
            key={chat.chatId}
            user={partner || {
              uid: "unknown",
              displayName: chat.chatName || "Unknown",
            }}
            lastMessage={chat.lastMessage || "No messages"}
            timestamp={chat.lastMessageTimestamp || chat.updatedAt} // Use the actual message timestamp
            onClick={() => router.push(`/chat/${chat.chatId}`)}
          />
        );
      })}
    </div>
  );
};

export default RecentChats;