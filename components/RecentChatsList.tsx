import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SessionContext } from "@/lib/session-context";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, onSnapshot, getDocs } from "firebase/firestore";
import { UserCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Type definitions
interface UserData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  profilePictureUrl?: string;
}

interface RecentChatData {
  chatId: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: Date;
  otherUser: UserData | null;
}

const RecentChatsList: React.FC = () => {
  const { user } = useContext(SessionContext);
  const router = useRouter();
  const [recentChats, setRecentChats] = useState<RecentChatData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Format time to show in AM/PM format
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format message to limit length
  const formatMessage = (message: string): string => {
    return message.length > 40 ? `${message.substring(0, 40)}...` : message;
  };

  // Fetch recent chats
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // Get chats where the current user is a participant
    const chatsRef = collection(db, "chats");
    const userChatsQuery = query(
      chatsRef,
      where("participants", "array-contains", user.uid),
      orderBy("updatedAt", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(userChatsQuery, async (snapshot) => {
      const chatsPromises = snapshot.docs.map(async (doc) => {
        const chatData = doc.data();
        const chatId = doc.id;
        
        // Get the other user in the chat
        const otherUserId = chatData.participants.find((id: string) => id !== user.uid);
        let otherUserData: UserData | null = null;
        
        if (otherUserId) {
          const userSnapshot = await getDocs(query(collection(db, "users"), where("uid", "==", otherUserId)));
          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            otherUserData = {
              uid: userData.uid,
              displayName: userData.displayName || "Unknown User",
              email: userData.email || "",
              photoURL: userData.photoURL || "",
              profilePictureUrl: userData.profilePictureUrl || ""
            };
          }
        }

        // Get the last message
        const messagesRef = collection(db, `chats/${chatId}/messages`);
        const lastMessageQuery = query(messagesRef, orderBy("timestamp", "desc"), limit(1));
        const messagesSnapshot = await getDocs(lastMessageQuery);
        
        let lastMessage = "No messages yet";
        let lastMessageTime = chatData.updatedAt?.toDate() || new Date();
        
        if (!messagesSnapshot.empty) {
          const messageData = messagesSnapshot.docs[0].data();
          lastMessage = messageData.text || "No message content";
          lastMessageTime = messageData.timestamp?.toDate() || new Date();
        }

        return {
          chatId,
          participants: chatData.participants,
          lastMessage,
          lastMessageTime,
          otherUser: otherUserData
        };
      });

      const chatsData = await Promise.all(chatsPromises);
      
      // Sort by last message time
      const sortedChats = chatsData.sort((a, b) => 
        b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
      );
      
      setRecentChats(sortedChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="h-20 animate-pulse bg-gray-100">
            <CardContent className="p-0"></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recentChats.length > 0 ? (
        recentChats.map((chat) => (
          <Card 
            key={chat.chatId}
            className="bg-white hover:bg-gray-50 cursor-pointer transition-colors duration-200"
            onClick={() => router.push(`/chat/${chat.chatId}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                {/* User Avatar */}
                {chat.otherUser?.profilePictureUrl ? (
                  <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white shadow-sm flex-shrink-0">
                    <Image 
                      src={chat.otherUser.profilePictureUrl} 
                      alt={chat.otherUser.displayName}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 flex-shrink-0">
                    <UserCircle className="h-8 w-8" />
                  </div>
                )}
                
                {/* Chat Information */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {chat.otherUser?.displayName || chat.otherUser?.email || "Unknown User"}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(chat.lastMessageTime)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {formatMessage(chat.lastMessage)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-8 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">No recent chats</p>
        </div>
      )}
    </div>
  );
};

export default RecentChatsList;