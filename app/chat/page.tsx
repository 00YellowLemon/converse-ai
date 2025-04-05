"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionContext } from "@/lib/session-context";
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import ChatTile from "@/components/ChatTile";

interface ChatData {
  chatId: string;
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
  chatName?: string;
  lastMessage?: string;
}

interface UserData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  profilePictureUrl?: string;
}

export default function ChatPage() {
  const { user, loading } = useContext(SessionContext);
  const router = useRouter();
  const [chats, setChats] = useState<ChatData[]>([]);
  const [users, setUsers] = useState<Record<string, UserData>>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      const fetchChats = async () => {
        try {
          // Get chats where the current user is a participant
          const chatsCollection = collection(db, "chats");
          const chatsQuery = query(
            chatsCollection, 
            where("participants", "array-contains", user.uid),
            orderBy("updatedAt", "desc")
          );
          
          const chatsSnapshot = await getDocs(chatsQuery);
          const chatsList: ChatData[] = [];
          
          for (const chatDoc of chatsSnapshot.docs) {
            const chatData = chatDoc.data();
            
            // Get the last message
            const messagesCollection = collection(db, `chats/${chatDoc.id}/messages`);
            const messagesQuery = query(messagesCollection, orderBy("timestamp", "desc"));
            const messagesSnapshot = await getDocs(messagesQuery);
            
            const lastMessage = messagesSnapshot.docs.length > 0 
              ? messagesSnapshot.docs[0].data().text 
              : "No messages yet";
            
            chatsList.push({
              chatId: chatDoc.id,
              participants: chatData.participants,
              createdAt: chatData.createdAt.toDate(),
              updatedAt: chatData.updatedAt.toDate(),
              chatName: chatData.chatName,
              lastMessage
            });
          }
          
          setChats(chatsList);
          
          // Fetch user data for all participants
          const userIds = new Set<string>();
          chatsList.forEach(chat => {
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
        } catch (error) {
          console.error("Error fetching chats:", error);
        }
      };
      
      fetchChats();
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  const getChatPartnerInfo = (chat: ChatData) => {
    const partnerId = chat.participants.find(id => id !== user.uid);
    if (!partnerId) return null;
    
    return users[partnerId] || null;
  };

  // const analyzeConversation = async (chatId: string) => {
  //   try {
  //     const messagesCollection = collection(db, `chats/${chatId}/messages`);
  //     const messagesQuery = query(messagesCollection, orderBy("timestamp", "asc"));
  //     const messagesSnapshot = await getDocs(messagesQuery);
      
  //     const conversation = messagesSnapshot.docs.map(doc => doc.data().text).join("\n");
  //     const response = await chatGoogleGenerativeAI.call({
  //       chat_history: conversation,
  //       user_query: "Analyze this conversation and provide insights."
  //     });
      
  //     console.log("AI Response:", response.text);
  //   } catch (error) {
  //     console.error("Error analyzing conversation:", error);
  //   }
  // };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Your Conversations</h1>
      
      {chats.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent>
            <p className="text-gray-500 mb-4">You don't have any active conversations yet.</p>
            <button 
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              onClick={() => router.push('/')}
            >
              Start a New Conversation
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chats.map(chat => {
            const partner = getChatPartnerInfo(chat);
            const handleChatTileClick = () => {
              router.push(`/chat/${chat.chatId}`);
            }
            return (
              <ChatTile 
                key={chat.chatId}
                user={partner || {
                  uid: "unknown",
                  displayName: chat.chatName || "Unknown",
                }}
                lastMessage={chat.lastMessage || "No messages"}
                chatId={chat.chatId}
                onClick={handleChatTileClick}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
