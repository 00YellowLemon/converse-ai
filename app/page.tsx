"use client"

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SessionContext } from "@/lib/session-context";
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, onSnapshot, query, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MessageSquare, Plus, UserCircle, Users } from "lucide-react";
import ChatTile from "@/components/ChatTile";
import Sidebar from "@/components/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Type definitions
interface UserData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  online?: boolean;
  createdAt?: Date;
  lastActive?: Date;
  profilePictureUrl?: string;
}

interface ChatData {
  chatId: string;
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
  chatName?: string;
}

interface MessageData {
  messageId: string;
  senderId: string;
  text: string;
  timestamp: Date;
  aiInsightRequest?: boolean;
  aiInsightResponse?: string;
}

interface AiGlobalRequestData {
  requestId: string;
  userId: string;
  query: string;
  timestamp: Date;
  response?: string;
  relatedChatIds?: string[];
}

interface RecentChatData {
  chatId: string;
  user: UserData;
  lastMessage: string;
}

export default function Home() {
  const { user, loading, firebaseClient } = useContext(SessionContext);
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [chats, setChats] = useState<ChatData[]>([]);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [aiGlobalRequests, setAiGlobalRequests] = useState<AiGlobalRequestData[]>([]);
  const [recentChats, setRecentChats] = useState<RecentChatData[]>([]);
  const [isChatStarted, setIsChatStarted] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Redirect to login if not authenticated
  useEffect(() => { 
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user) {
      setIsLoading(false);
    }
  }, [user, loading, router]);

  // Set user data in Firestore
  useEffect(() => {
    if (!user) return;

    const usersCollection = collection(db, "users");
    const userDocRef = doc(usersCollection, user.uid);
    const setUserData = async () => {
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        online: true,
        createdAt: new Date(),
        lastActive: new Date(),
        profilePictureUrl: user.photoURL
      }, { merge: true });
    };
    
    setUserData();

    const unsubscribe = onSnapshot(query(usersCollection), (snapshot) => {
      const updatedUsers: UserData[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: data.uid,
          displayName: data.displayName,
          email: data.email,
          photoURL: data.photoURL,
          online: data.online,
          createdAt: data.createdAt?.toDate(),
          lastActive: data.lastActive?.toDate(),
          profilePictureUrl: data.profilePictureUrl
        } as UserData;
      });

      setUsers(updatedUsers);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen for chats
  useEffect(() => {
    if (!user) return;

    const chatsCollection = collection(db, "chats");
    
    const unsubscribe = onSnapshot(query(chatsCollection), (snapshot) => {
      const updatedChats: ChatData[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          chatId: doc.id,
          participants: data.participants,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          chatName: data.chatName
        } as ChatData;
      });

      setChats(updatedChats);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen for messages in example chat
  useEffect(() => {
    if (!user) return;

    const messagesCollection = collection(db, "chats/exampleChatId/messages");
    
    const unsubscribe = onSnapshot(query(messagesCollection), (snapshot) => {
      const updatedMessages: MessageData[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          messageId: doc.id,
          senderId: data.senderId,
          text: data.text,
          timestamp: data.timestamp?.toDate(),
          aiInsightRequest: data.aiInsightRequest,
          aiInsightResponse: data.aiInsightResponse
        } as MessageData;
      });

      setMessages(updatedMessages);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen for AI global requests
  useEffect(() => {
    if (!user) return;

    const aiGlobalRequestsCollection = collection(db, "aiGlobalRequests");
    
    const unsubscribe = onSnapshot(query(aiGlobalRequestsCollection), (snapshot) => {
      const updatedAiGlobalRequests: AiGlobalRequestData[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          requestId: doc.id,
          userId: data.userId,
          query: data.query,
          timestamp: data.timestamp?.toDate(),
          response: data.response,
          relatedChatIds: data.relatedChatIds
        } as AiGlobalRequestData;
      });

      setAiGlobalRequests(updatedAiGlobalRequests);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen for recent chats
  useEffect(() => {
    if (!user) return;

    const recentChatsCollection = collection(db, "recentChats");
    
    const unsubscribe = onSnapshot(query(recentChatsCollection), (snapshot) => {
      const updatedRecentChats: RecentChatData[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          chatId: doc.id,
          user: data.user,
          lastMessage: data.lastMessage
        } as RecentChatData;
      });

      setRecentChats(updatedRecentChats);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle sending a message
  const handleSendMessage = async (chatId: string, text: string) => {
    if (!user || !text.trim()) return;
    
    const messagesCollection = collection(db, `chats/${chatId}/messages`);
    await addDoc(messagesCollection, {
      senderId: user.uid,
      text,
      timestamp: new Date(),
      aiInsightRequest: false,
      aiInsightResponse: ""
    });
  };

  // Start a new chat
  const startNewChat = async (userId?: string): Promise<void> => {
    if (!user) return;
    
    const chatsCollection = collection(db, "chats");
    const participants = [user.uid];
    if (userId) {
      participants.push(userId);
    }
    const newChatRef = await addDoc(chatsCollection, {
      participants: participants,
      createdAt: new Date(),
      chatName: `Chat ${Date.now()}`
    });
    
    setIsChatStarted(true);
    router.push(`/chat/${newChatRef.id}`);
  };

  // Start new chat wrapper to be used as a callback
  const handleStartNewChat = () => {
    startNewChat();
  };

  // Filter users based on search query and exclude current user
  const filteredUsers = users.filter(userData => 
    // Only include users who are not the current user and match search query
    userData.uid !== user?.uid && (
      userData.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userData.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Loading screen
  if (loading || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
       <div className="flex flex-col items-center space-y-4">
          <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
          <p className="text-xl font-medium text-gray-700">Loading...</p>
        </div>
        
        {/* AI Chat Button - Fixed position */}
        <div className="fixed bottom-6 right-6">
          <Button 
            onClick={() => router.push('/chat')}
            className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 transition-all duration-300 p-0 flex items-center justify-center"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-6xl">
          {/* Header section */}
          <header className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.displayName}!</h1>
                <p className="mt-1 text-gray-600">Connect with friends and colleagues</p>
              </div>
              <div className="flex items-center">
                {user.photoURL ? (
                  <div className="relative h-10 w-10 overflow-hidden rounded-full">
                    <Image 
                      src={user.photoURL} 
                      alt={user.displayName || "User"}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <UserCircle className="h-10 w-10 text-gray-400" />
                )}
              </div>
            </div>
            
            {/* Search bar */}
            <div className="mt-6 flex items-center rounded-lg bg-white p-2 shadow">
              <Search className="mx-2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search users..." 
                className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </header>
          
          {/* Recent chats section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Recent Chats</h2>
              <Button 
                onClick={handleStartNewChat}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            </div>
            
            {recentChats.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recentChats.map((chat) => (
                  <ChatTile 
                    key={chat.chatId} 
                    user={chat.user} 
                    lastMessage={chat.lastMessage} 
                    onClick={() => router.push(`/chat/${chat.chatId}`)}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-white/50 border-dashed border-2 text-center p-8">
                <CardContent className="flex flex-col items-center pt-6">
                  <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recent chats</h3>
                  <p className="text-gray-500 mb-4">Start a conversation with friends or colleagues</p>
                  <Button onClick={handleStartNewChat} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Start a chat
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>
          
          {/* Tabs for All Users and Recent AI Requests */}
          <Tabs defaultValue="users" className="mt-8">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Available Users
              </TabsTrigger>
              <TabsTrigger value="ai-requests" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                AI Requests
              </TabsTrigger>
            </TabsList>
            
            {/* Users Tab */}
            <TabsContent value="users">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((userData) => (
                    <Card
                      key={userData.uid}
                      className="bg-white transition-all duration-300 hover:shadow-md"
                    >
                      <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        {userData.profilePictureUrl ? (
                          <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-sm">
                            <Image 
                              src={userData.profilePictureUrl} 
                              alt={userData.displayName || "User"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <UserCircle className="h-6 w-6" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg font-medium">{userData.displayName}</CardTitle>
                          <p className="text-sm text-gray-500">{userData.email}</p>
                        </div>
                        <div className="ml-auto flex flex-col items-end">
                          <div className="flex items-center">
                            <div className={`h-2.5 w-2.5 rounded-full ${userData.online ? 'bg-green-500' : 'bg-gray-300'} mr-1.5`}></div>
                            <span className="text-xs font-medium text-gray-500">
                              {userData.online ? 'Online' : 'Offline'}
                            </span>
                          </div>
                          {userData.lastActive && (
                            <span className="text-xs text-gray-400 mt-1">
                              Last active: {new Date(userData.lastActive).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          variant="outline" 
                          className="w-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          onClick={() => {
                            const existingChat = chats.find(chat => chat.participants.includes(userData.uid) && chat.participants.includes(user.uid));
                            if (existingChat) {
                              router.push(`/chat/${existingChat.chatId}`)
                            } else { startNewChat(userData.uid);
                            }
                          }}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Message
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-sm">
                    <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-lg font-medium text-gray-700">No users match your search</p>
                    <p className="text-gray-500 mt-1">Try adjusting your search query</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* AI Requests Tab */}
            <TabsContent value="ai-requests">
              <div className="space-y-4">
                {aiGlobalRequests.length > 0 ? (
                  aiGlobalRequests.map((request) => (
                    <Card key={request.requestId}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg font-medium">AI Query</CardTitle>
                          <span className="text-xs text-gray-500">
                            {request.timestamp?.toLocaleDateString()} at {request.timestamp?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-3 bg-blue-50 p-3 rounded-md">
                          <p className="font-medium text-blue-700">{request.query}</p>
                        </div>
                        {request.response && (
                          <div className="bg-gray-50 p-3 rounded-md">
                            <p className="text-gray-700">{request.response}</p>
                          </div>
                        )}
                        {request.relatedChatIds && request.relatedChatIds.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs text-gray-500 mb-2">Related chats:</p>
                            <div className="flex flex-wrap gap-2">
                              {request.relatedChatIds.map((chatId) => (
                                <Button 
                                  key={chatId}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => router.push(`/chat/${chatId}`)}
                                >
                                  View Chat
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-lg font-medium text-gray-700">No AI requests yet</p>
                    <p className="text-gray-500 mt-1">Ask AI a question to get started</p>
                    <Button
                      className="mt-4"
                      onClick={() => router.push('/chat')}
                    >
                      Chat with AI
                    </Button>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
