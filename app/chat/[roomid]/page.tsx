"use client";

import { useContext, useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { SessionContext } from "@/lib/session-context";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, doc, getDoc, addDoc, orderBy, serverTimestamp } from "firebase/firestore";
import ChatMessage from "@/components/ChatMessage";
import RoomHeader from "@/components/RoomHeader";
import AIChatModal from "@/components/AIChatModal";

interface MessageData {
  messageId: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

export default function ChatRoomPage() {
  const params = useParams();
  // Fix: ensure consistent parameter naming - convert to string and lowercase for consistency
  const roomId = (params.roomId || params.roomid) as string;
  
  const { user, loading } = useContext(SessionContext);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [roomName, setRoomName] = useState<string>("");
  const [otherUser, setOtherUser] = useState<{ username?: string; email: string } | null>(null);
  const [newMessage, setNewMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isAIChatOpen, setIsAIChatOpen] = useState<boolean>(false);
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
              
              const otherUserData = userDoc.data();
              const otherUser: { displayName?: string; email: string } = {
                displayName: otherUserData?.displayName,
                email: otherUserData?.email || "No Email", // Fallback in case email is missing
              };

              setOtherUser(otherUser);
              console.log("Other User:", otherUser);
            } else {
              // Handle group chats or cases with no other participant differently
              setOtherUser({ email: "Group Chat" }); // Example handling
              console.log("Group Chat or No Other User");
            }

            //For now just set room name as chat name
            setRoomName(chatData.chatName || "Chat Room");

          } else {
            setError("Chat room not found");
            setRoomName("Chat Room");
          }
        } catch (error) {
          console.error("Error fetching room details:", error);
          setError("Failed to load chat details");
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
          };
        });

        setMessages(updatedMessages);
        setTimeout(scrollToBottom, 100);
      }, (error) => {
        console.error("Error listening to messages:", error);
        setError("Failed to load messages");
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
        timestamp: serverTimestamp(), // Use serverTimestamp for more accurate timing
      });
      
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message");
    }
  };

  const handleOpenAiChat = () => {
    if (user && roomId) {
      setIsAIChatOpen(true);
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
      <RoomHeader otherUser={otherUser || {email: "Unknown"}} />
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 mt-2">
          {error}
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 my-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.messageId}
              message={message.text}
              isUser={message.senderId === user?.uid}
            />
          ))
        )}
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
            onClick={handleOpenAiChat}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
          >
            Ask AI
          </button>
        </div>
      </div>
      
      {/* AI Chat Modal */}
      {user && (
        <AIChatModal
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
          userId={user.uid}
          roomId={roomId}
        />
      )}
    </div>
  );
}