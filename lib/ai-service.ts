import { db, chatGoogleGenerativeAI } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface AIMessage {
  sender: "USER" | "AI";
  text: string;
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
    
    // In a real app, we would call the AI service here
    // For example with the ChatGoogleGenerativeAI
    let aiResponse: string;
    
    try {
      // Try to get a response from the AI
      const result = await chatGoogleGenerativeAI.invoke([
        { role: "user", content: userMessage }
      ]);
      
      aiResponse = result.content.toString();
    } catch (aiError) {
      console.error("Error getting AI response:", aiError);
      aiResponse = "I'm sorry, I couldn't process your request at this time. Please try again later.";
    }
    
    // Add AI response to Firestore
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