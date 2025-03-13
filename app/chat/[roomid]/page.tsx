"use client";

import { useContext, useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { SessionContext } from "@/lib/session-context";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, doc, getDoc, addDoc, orderBy } from "firebase/firestore";
import ChatMessage from "@/components/ChatMessage";
import RoomHeader from "./components/RoomHeader";

interface MessageData {
  messageId: string;
  senderId: string;
  text: string;
  timestamp: Date;
  aiInsightRequest?: boolean;
  aiInsightResponse?: string;
}

export default function ChatRoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { user, loading } = useContext(SessionContext);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [roomName, setRoomName] = useState<string>("");
  const [newMessage, setNewMessage] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!loading && user && roomId) {
      // Fetch chat room details
      const fetchRoomDetails = async () => {
        try {
          const chatDocRef = doc(db, "chats", roomId);
          const chatDoc = await getDoc(chatDocRef);
          
          if (chatDoc.exists()) {
            const chatData = chatDoc.data();
            // Find the other participant
            const otherParticipantId = chatData.participants.find(
              (participant: string) => participant !== user.uid
            );
            
            if (otherParticipantId) {
              const userDocRef = doc(db, "users", otherParticipantId);
              const userDoc = await getDoc(userDocRef);
              
              if (userDoc.exists()) {
                setRoomName(userDoc.data().displayName);
              } else {
                setRoomName("Chat Room");
              }
            } else {
              setRoomName(chatData.chatName || "Chat Room");
            }
          }
        } catch (error) {
          console.error("Error fetching room details:", error);
          setRoomName("Chat Room");
        }
      };
      
      fetchRoomDetails();

      // Listen for messages in this chat room
      const messagesCollection = collection(db, `chats/${roomId}/messages`);
      const messagesQuery = query(messagesCollection, orderBy("timestamp", "asc"));
      
      const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
        const updatedMessages: MessageData[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            messageId: doc.id,
            senderId: data.senderId,
            text: data.text,
            timestamp: data.timestamp?.toDate() || new Date(),
            aiInsightRequest: data.aiInsightRequest,
            aiInsightResponse: data.aiInsightResponse
          };
        });

        setMessages(updatedMessages);
        setTimeout(scrollToBottom, 100);
      });

      return () => unsubscribeMessages();
    }
  }, [user, loading, roomId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !roomId) return;
    
    try {
      const messagesCollection = collection(db, `chats/${roomId}/messages`);
      await addDoc(messagesCollection, {
        senderId: user.uid,
        text: newMessage,
        timestamp: new Date(),
        aiInsightRequest: false,
        aiInsightResponse: ""
      });
      
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleAskAi = async () => {
    if (!user || !roomId) return;
    
    try {
      // Add a placeholder message for the AI request
      const messagesCollection = collection(db, `chats/${roomId}/messages`);
      const aiMessage = await addDoc(messagesCollection, {
        senderId: "AI",
        text: "Thinking...",
        timestamp: new Date(),
        aiInsightRequest: true,
        aiInsightResponse: ""
      });
      
      // Log the AI request globally
      const aiRequestData = {
        userId: user.uid,
        query: "Analyze recent conversation",
        timestamp: new Date(),
        response: "This is an AI insight response",
        relatedChatIds: [roomId]
      };
      
      const aiGlobalRequestsCollection = collection(db, "aiGlobalRequests");
      await addDoc(aiGlobalRequestsCollection, aiRequestData);
      
      // Update the AI message with the response
      // In a real application, you would wait for the actual AI response
      setTimeout(async () => {
        await addDoc(messagesCollection, {
          senderId: "AI",
          text: "Based on your conversation, I've noticed you're discussing [topic]. Here's some additional information that might be helpful...",
          timestamp: new Date(),
          aiInsightRequest: false,
          aiInsightResponse: "AI insight response"
        });
      }, 1000);
      
      setAiResponse(aiRequestData.response);
    } catch (error) {
      console.error("Error asking AI:", error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Please log in to access chat.</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <RoomHeader roomName={roomName} />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.messageId}
            message={message.text}
            isUser={message.senderId === user?.uid}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4 bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Send
          </button>
          <button
            onClick={handleAskAi}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
          >
            Ask AI
          </button>
        </div>
      </div>
    </div>
  );
}