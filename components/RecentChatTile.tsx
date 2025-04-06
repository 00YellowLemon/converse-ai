import { FC } from "react";
import Image from "next/image";
import { UserCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { formatDistanceToNow } from "date-fns";

interface UserData {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  profilePictureUrl?: string;
}

interface ChatTileProps {
  user: UserData;
  lastMessage: string;
  timestamp: Date;
  onClick: () => void;
}

const ChatTile: FC<ChatTileProps> = ({ user, lastMessage, timestamp, onClick }) => {
  // Format the timestamp to relative time (e.g., "5 minutes ago", "2 hours ago")
  const formattedTime = formatDistanceToNow(timestamp, { addSuffix: true });
  
  // Use display name or fallback to email if available
  const displayName = user.displayName || (user.email ? user.email.split('@')[0] : "Unknown User");

  return (
    <Card 
      className="bg-white  transition-all duration-300 hover:shadow-md cursor-pointer" 
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center gap-4 py-2">
        {user.profilePictureUrl ? (
          <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-sm">
            <Image
              src={user.profilePictureUrl}
              alt={displayName}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <UserCircle className="h-6 w-6" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-medium">{displayName}</h3>
          <p className="text-sm text-gray-500 truncate max-w-[200px]">{lastMessage}</p>
        </div>
        <div className="text-xs text-gray-400">
          {formattedTime}
        </div>
      </CardHeader>
    </Card>
  );
};

export default ChatTile;