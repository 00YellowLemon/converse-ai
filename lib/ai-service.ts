import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import axios from 'axios';

interface DialogueMessage {
  role: "user" | "other";
  content: string;
}

interface CoachingMessage {
  role: "user" | "ai";
  content: string;
}

interface ConverseAIRequest {
  user_input: string;
  dialogue_history: DialogueMessage[];
  coaching_history: CoachingMessage[];
}

export const sendMessageToAI = async (
  chatId: string, 
  userId: string, 
  userMessage: string
): Promise<string> => {
  try {
    // Path to the user's AI messages subcollection
    const aiMessagesPath = `chats/${chatId}/userAIChats/${userId}/aiMessages`;
    const messagesCollection = collection(db, aiMessagesPath);
    
    // Add user message to Firestore
    await addDoc(messagesCollection, {
      sender: "USER",
      text: userMessage,
      timestamp: serverTimestamp(),
    });
    
    // Add thinking message
    const thinkingDocRef = await addDoc(messagesCollection, {
      sender: "AI",
      text: "Thinking...",
      timestamp: serverTimestamp(),
    });
    
    // Fetch previous messages to build dialogue and coaching history
    const previousMessagesQuery = query(messagesCollection, orderBy("timestamp", "asc"));
    const messagesSnapshot = await getDocs(previousMessagesQuery);
    
    // Build dialogue history and coaching history from previous messages
    const dialogueHistory: DialogueMessage[] = [];
    const coachingHistory: CoachingMessage[] = [];
    
    messagesSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      
      // Skip the thinking message we just added
      if (doc.id === thinkingDocRef.id) return;
      
      if (index % 2 === 0) { // User messages become dialogue history
        dialogueHistory.push({
          role: "user",
          content: data.text
        });
      } else { // AI responses become coaching history
        if (dialogueHistory.length > 0) {
          // Add a placeholder "other" response for dialogue history
          dialogueHistory.push({
            role: "other",
            content: "placeholder response"
          });
        }
        
        coachingHistory.push({
          role: "user",
          content: doc.id === thinkingDocRef.id ? userMessage : messagesSnapshot.docs[index-1]?.data()?.text || ""
        });
        
        if (data.sender === "AI" && data.text !== "Thinking...") {
          coachingHistory.push({
            role: "ai",
            content: data.text
          });
        }
      }
    });
    
    // Add the current message to coaching history
    coachingHistory.push({
      role: "user",
      content: userMessage
    });
    
    // Prepare request for the AI backend
    const requestData: ConverseAIRequest = {
      user_input: userMessage,
      dialogue_history: dialogueHistory,
      coaching_history: coachingHistory
    };
    
    // Call hosted backend AI service
    let aiResponse: string;
    try {
      const response = await axios.post('https://converse-backend-ai.onrender.com/coach', requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      aiResponse = response.data.response || "I'm sorry, I couldn't generate a response.";
    } catch (aiError) {
      console.error("Error calling AI service:", aiError);
      aiResponse = "I'm sorry, I couldn't process your request at this time. Please try again later.";
    }
    
    // Update the thinking message with the actual AI response
    await addDoc(messagesCollection, {
      sender: "AI",
      text: aiResponse,
      timestamp: serverTimestamp(),
    });
    
    return aiResponse;
  } catch (error) {
    console.error("Error in sendMessageToAI:", error);
    throw new Error("Failed to process AI message");
  }
};
