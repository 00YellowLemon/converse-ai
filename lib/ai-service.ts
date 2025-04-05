import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, where } from 'firebase/firestore';
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
    
    // 1. Fetch regular chat messages between users (dialogue history)
    const chatMessagesCollection = collection(db, `chats/${chatId}/messages`);
    const chatMessagesQuery = query(chatMessagesCollection, orderBy("timestamp", "asc"));
    const chatMessagesSnapshot = await getDocs(chatMessagesQuery);
    
    // Build dialogue history from regular chat messages
    const dialogueHistory: DialogueMessage[] = [];
    
    chatMessagesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const messageRole = data.senderId === userId ? "user" : "other";
      
      dialogueHistory.push({
        role: messageRole,
        content: data.text
      });
    });
    
    // 2. Fetch previous AI conversation messages (coaching history)
    const aiMessagesQuery = query(messagesCollection, orderBy("timestamp", "asc"));
    const aiMessagesSnapshot = await getDocs(aiMessagesQuery);
    
    // Build coaching history from AI conversation
    const coachingHistory: CoachingMessage[] = [];
    
    // Process all AI messages except the thinking message we just added
    for (let i = 0; i < aiMessagesSnapshot.docs.length; i++) {
      const currentDoc = aiMessagesSnapshot.docs[i];
      const currentData = currentDoc.data();
      
      // Skip the thinking message we just added
      if (currentDoc.id === thinkingDocRef.id) continue;
      
      if (currentData.sender === "USER") {
        coachingHistory.push({
          role: "user",
          content: currentData.text
        });
      } else if (currentData.sender === "AI" && currentData.text !== "Thinking...") {
        coachingHistory.push({
          role: "ai",
          content: currentData.text
        });
      }
    }
    
    // Add the current message to coaching history if it's not already there
    if (!coachingHistory.some(msg => msg.role === "user" && msg.content === userMessage)) {
      coachingHistory.push({
        role: "user",
        content: userMessage
      });
    }
    
    // Prepare request for the AI backend
    const requestData: ConverseAIRequest = {
      user_input: userMessage,
      dialogue_history: dialogueHistory,
      coaching_history: coachingHistory
    };

    console.log("Dialogue history:", dialogueHistory);
    console.log("Coaching history:", coachingHistory);
    console.log("Sending to AI service:", JSON.stringify(requestData, null, 2));
    
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