import { useContext, useEffect, useState } from "react";
import { SessionContext } from "@/lib/session-context";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from "firebase/firestore";
import ChatMessage from "@/components/ChatMessage";

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

  return (
    <div className="p-8">
      {messages.map((message) => (
        <ChatMessage
          key={message.messageId}
          message={message.text}
          isUser={message.senderId === user?.uid}
        />
      ))}
    </div>
  );
}
