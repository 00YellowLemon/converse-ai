
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface RoomHeaderProps {
  roomName: string;
}

const RoomHeader: React.FC<RoomHeaderProps> = ({ roomName }) => {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100">
        <ArrowLeftIcon className="h-6 w-6" />
      </button>
      <h2 className="text-lg font-semibold text-center w-full absolute left-1/2 transform -translate-x-1/2">{roomName}</h2>
      <div className="w-10" />
    </div>
  );
};

export default RoomHeader;