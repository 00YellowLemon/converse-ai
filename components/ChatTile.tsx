import React from 'react';
import { useRouter } from 'next/navigation';

interface User {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  profilePictureUrl?: string;
}

interface ChatTileProps {
  user: User;
  lastMessage: string;
  onClick: () => void;
  chatId?: string;
}

const ChatTile: React.FC<ChatTileProps> = ({ user, lastMessage, chatId, onClick }) => {
  const router = useRouter();

  const handleChatClick = () => {
    if (chatId) {
      router.push(`/chat/${chatId}`);
    }
  };

  return (
    <div 
      className="bg-white shadow-md rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-center mb-2">
        {user.profilePictureUrl ? (
          <img 
            src={user.profilePictureUrl} 
            alt={user.displayName} 
            className="w-10 h-10 rounded-full mr-3"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
            <span className="text-gray-600 font-bold">
              {user.displayName?.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <h3 className="font-semibold">{user.displayName}</h3>
        </div>
      </div>
      <p className="text-gray-600 text-sm truncate">{lastMessage}</p>
    </div>
  );
};

export default ChatTile;