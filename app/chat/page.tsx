import { useContext, useEffect, useState } from "react";
import { SessionContext } from "@/lib/session-context";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, doc, getDoc } from "firebase/firestore";
import ChatMessage from "@/components/ChatMessage";
import RoomHeader from "@/app/chat/[roomId]/components/RoomHeader";

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

export default function ChatPage() {
  const { user, loading } = useContext(SessionContext);
  const [chats, setChats] = useState<ChatData[]>([]);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [chatUser, setChatUser] = useState<string>("");

  useEffect(() => {
    if (!loading && user) {
      const chatsCollection = collection(db, "chats");
      const unsubscribeChats = onSnapshot(query(chatsCollection), (snapshot) => {
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

      return () => unsubscribeChats();
    }
  }, [user, loading]);

  useEffect(() => {
    if (!loading && user) {
      const messagesCollection = collection(db, "chats/exampleChatId/messages");
      const unsubscribeMessages = onSnapshot(query(messagesCollection), (snapshot) => {
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

      return () => unsubscribeMessages();
    }
  }, [user, loading]);

  useEffect(() => {
    if (!loading && user) {
      const fetchChatUser = async () => {
        const chatDocRef = doc(db, "chats", "exampleChatId");
        const chatDoc = await getDoc(chatDocRef);
        if (chatDoc.exists()) {
          const chatData = chatDoc.data();
          const chatUserId = chatData.participants.find((participant: string) => participant !== user.uid);
          if (chatUserId) {
            const userDocRef = doc(db, "users", chatUserId);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setChatUser(userData.displayName);
            }
          }
        }
      };

      fetchChatUser();
    }
  }, [user, loading]);

  return (
    <div className="p-8">
      <RoomHeader chatUser={chatUser} />
      {messages.map((message) => (
        <ChatMessage
          key={message.messageId}
          message={message.text}
          isUser={message.senderId === user?.uid}
        />
      ))}
      <div className="flex justify-end mt-4">
        <button className="bg-blue-500 text-white py-2 px-4 rounded">Ask AI</button>
      </div>
    </div>
  );
}
