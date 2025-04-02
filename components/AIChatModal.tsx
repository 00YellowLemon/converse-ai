import { useState, useEffect, useRef } from "react";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { sendMessageToAI } from "@/lib/ai-service";

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  roomId: string;
}

interface AIMessageData {
  messageId: string;
  sender: "USER" | "AI";
  text: string;
  timestamp: Date;
}

export default function AIChatModal({ isOpen, onClose, userId, roomId }: AIChatModalProps) {
  const [messages, setMessages] = useState<AIMessageData[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!isOpen || !roomId || !userId) return;

    // Listen for AI chat messages for this specific user in this chat
    const aiMessagesPath = `chats/${roomId}/userAIChats/${userId}/aiMessages`;
    const messagesCollection = collection(db, aiMessagesPath);
    const messagesQuery = query(messagesCollection, orderBy("timestamp", "asc"));
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const updatedMessages: AIMessageData[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          messageId: doc.id,
          sender: data.sender,
          text: data.text,
          timestamp: data.timestamp?.toDate() || new Date(),
        };
      });

      // Filter out thinking messages if there's a newer AI message
      const filteredMessages = updatedMessages.filter((msg, index, array) => {
        if (msg.text === "Thinking..." && msg.sender === "AI") {
          // Check if there's a newer AI message after this one
          const hasNewerAIMessage = array.slice(index + 1).some(
            laterMsg => laterMsg.sender === "AI" && laterMsg.text !== "Thinking..."
          );
          return !hasNewerAIMessage;
        }
        return true;
      });

      setMessages(filteredMessages);
      setTimeout(scrollToBottom, 100);
    });

    return () => unsubscribe();
  }, [isOpen, roomId, userId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userId || !roomId) return;
    
    try {
      setIsLoading(true);
      const userMessageText = newMessage;
      setNewMessage(""); // Clear input immediately for better UX
      
      // Send message to AI through our service
      await sendMessageToAI(roomId, userId, userMessageText);
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error sending message to AI:", error);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md h-[600px] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Chat with Coach Assistant</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 my-8">
              No messages yet. Ask the coach assistant a question!
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.messageId}
                className={cn(
                  "max-w-[80%] p-3 rounded-lg",
                  message.sender === "USER" 
                    ? "bg-blue-500 text-white ml-auto rounded-br-none" 
                    : "bg-gray-200 text-gray-800 mr-auto rounded-bl-none",
                  message.text === "Thinking..." && "animate-pulse"
                )}
              >
                {message.text}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ask the coach assistant..."
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading}
              className={cn(
                "px-4 py-2 rounded-lg text-white",
                isLoading ? "bg-purple-300" : "bg-purple-500 hover:bg-purple-600"
              )}
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}