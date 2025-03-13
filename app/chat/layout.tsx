"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useContext } from 'react';
import { SessionContext } from "@/lib/session-context";

interface ChatLayoutProps {
  children: React.ReactNode;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  const { user, loading } = useContext(SessionContext);
  const router = useRouter();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect, no need to render anything
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {children}
    </div>
  );
};

export default ChatLayout;