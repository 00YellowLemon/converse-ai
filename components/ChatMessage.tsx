import React from 'react';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
}

function ChatMessage({ message, isUser }: ChatMessageProps) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
      <div className={`max-w-md p-3 rounded-lg shadow-md ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
        {message}
      </div>
    </div>
  );
}

export default ChatMessage;
