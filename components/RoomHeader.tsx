import React from 'react';
import { useRouter } from 'next/navigation';

interface RoomHeaderProps {
  otherUser: {
    displayName?: string;
    email?: string;
  };
}

const RoomHeader: React.FC<RoomHeaderProps> = ({ otherUser }) => {
  const router = useRouter();
    const displayName = otherUser.displayName || otherUser.email

    return (
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="mr-4 text-gray-600 hover:text-gray-900">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <h2 className="text-xl font-semibold"> {displayName}</h2>
            </div>
        </div>
    );
};

export default RoomHeader;