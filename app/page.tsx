"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Shield, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-sm py-4 px-6 md:px-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold text-purple-600">ConverseAI</span>
          </div>
          <div className="flex space-x-4">
            <Button 
              variant="ghost" 
              className="text-gray-700 hover:text-purple-600"
              onClick={() => router.push('/login')}
            >
              Login
            </Button>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              onClick={() => router.push('/signup')}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 mb-12 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Connect, Chat, <span className="text-purple-600">Collaborate</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              Experience seamless communication with friends and colleagues, enhanced by AI-powered conversation assistance.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-lg py-6 px-8"
                onClick={() => router.push('/signup')}
              >
                Get Started
              </Button>
              <Button 
                size="lg"
                variant="outline" 
                className="border-purple-600 text-purple-600 hover:bg-purple-50 text-lg py-6 px-8"
                onClick={() => router.push('/login')}
              >
                Login
              </Button>
            </div>
          </div>
          <div className="w-full md:w-1/2 flex justify-center">
            <div className="relative w-full max-w-md h-[500px]">
              {/* Windows-style chat window */}
              <div className="absolute w-full h-full bg-white rounded-md shadow-xl overflow-hidden border border-gray-200">
                {/* Window header */}
                <div className="bg-gray-100 p-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    
                  </div>
                  <div className="text-sm font-medium text-gray-600">Chat with Tate</div>
                  <div className="w-5"></div>
                </div>
                
                {/* Chat area */}
                <div className="flex-1 p-4 h-[400px] overflow-y-auto bg-gray-50">
                  {/* User message */}
                  <div className="flex mb-4 items-end">
                    
                    <div className="ml-2 max-w-[70%] bg-white rounded-lg rounded-bl-none p-3 shadow-sm border border-gray-200">
                      <p className="text-gray-800">Hey Sarah, have you seen the design proposal?</p>
                    </div>
                  </div>
                  
                  {/* Other user message */}
                  <div className="flex mb-4 items-end flex-row-reverse">
                    <div className="mr-2 max-w-[70%] bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg rounded-br-none p-3 shadow-sm">
                      <p>Yes, I just reviewed it. I think we should discuss some changes to the UX flow.</p>
                    </div>
                  </div>
                  
                  {/* User message */}
                  <div className="flex mb-4 items-end">
                    <div className="ml-2 max-w-[70%] bg-white rounded-lg rounded-bl-none p-3 shadow-sm border border-gray-200">
                      <p className="text-gray-800">Sure, when are you free for a call?</p>
                    </div>
                  </div>
                  
                  
                </div>
                
                {/* Message input area */}
                <div className="p-3 border-t border-gray-200 bg-white">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                    />
                    <button
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1 rounded-lg hover:from-purple-700 hover:to-indigo-700"
                    >
                      Send
                    </button>
                    <button
                      className="bg-purple-500 text-white px-4 py-1 rounded-lg hover:bg-purple-600"
                    >
                      AI
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose ConverseAI?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="bg-purple-50 rounded-xl p-8 transition-all hover:shadow-lg">
              <div className="bg-purple-100 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <MessageSquare className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Real-time Messaging</h3>
              <p className="text-gray-600">Connect instantly with your contacts through our seamless real-time messaging platform.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-indigo-50 rounded-xl p-8 transition-all hover:shadow-lg">
              <div className="bg-indigo-100 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <Sparkles className="h-7 w-7 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Assistant</h3>
              <p className="text-gray-600">Get intelligent suggestions and assistance from our built-in AI coach to enhance your conversations.</p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-violet-50 rounded-xl p-8 transition-all hover:shadow-lg">
              <div className="bg-violet-100 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-violet-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">User Presence</h3>
              <p className="text-gray-600">See when your contacts are online and stay connected with real-time presence indicators.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-indigo-600 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to transform your conversations?</h2>
          <p className="text-purple-100 text-lg mb-10">Join thousands of users who have elevated their communication experience.</p>
          <Button 
            size="lg"
            className="bg-white text-purple-600 hover:bg-purple-50 text-lg px-8 py-6"
            onClick={() => router.push('/signup')}
          >
            Get Started For Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-6 md:mb-0">
              <MessageSquare className="h-6 w-6 text-purple-400" />
              <span className="text-xl font-bold text-white">ConverseAI</span>
            </div>
            <div className="flex space-x-8">
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Features</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} ConverseAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}