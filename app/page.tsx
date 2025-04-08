"use client";

import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">ConverseAI</span>
          </div>
          <div className="flex space-x-4">
            <Button 
              variant="ghost" 
              className="text-gray-700 hover:text-blue-600"
              onClick={() => router.push('/login')}
            >
              Login
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => router.push('/signup')}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 mb-12 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Connect, Chat, <span className="text-blue-600">Collaborate</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              Experience seamless communication with friends and colleagues, enhanced by AI-powered conversation assistance.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Button 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-lg py-6 px-8"
                onClick={() => router.push('/signup')}
              >
                Get Started
              </Button>
              <Button 
                size="lg"
                variant="outline" 
                className="border-blue-600 text-blue-600 hover:bg-blue-50 text-lg py-6 px-8"
                onClick={() => router.push('/login')}
              >
                Login
              </Button>
            </div>
          </div>
          <div className="w-full md:w-1/2 flex justify-center">
            <div className="relative w-full max-w-md h-[400px]">
              <div className="absolute w-full h-full rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 blur-xl opacity-20"></div>
              <div className="absolute w-full h-full bg-white/80 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 rounded-full bg-red-400"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                    <div className="h-3 w-3 rounded-full bg-green-400"></div>
                  </div>
                </div>
                <div className="p-4 h-[350px] overflow-y-auto">
                  <div className="bg-blue-100 rounded-lg p-3 max-w-[70%] mb-4">
                    <p className="text-gray-800">Hey! How's the project coming along?</p>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3 max-w-[70%] ml-auto mb-4">
                    <p className="text-gray-800">Just finished the first milestone! Need to discuss the next steps.</p>
                  </div>
                  <div className="bg-blue-100 rounded-lg p-3 max-w-[70%] mb-4">
                    <p className="text-gray-800">Great! Let's schedule a call tomorrow.</p>
                  </div>
                  <div className="bg-purple-100 rounded-lg p-3 max-w-[80%] mb-4 border border-purple-200">
                    <p className="text-gray-800"><span className="text-purple-600 font-medium">AI Assistant:</span> I've added a calendar invite for tomorrow at 2 PM based on both your available times.</p>
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
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose ConnectAI?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="bg-blue-50 rounded-xl p-8 transition-all hover:shadow-lg">
              <div className="bg-blue-100 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <MessageSquare className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Real-time Messaging</h3>
              <p className="text-gray-600">Connect instantly with your contacts through our seamless real-time messaging platform.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-purple-50 rounded-xl p-8 transition-all hover:shadow-lg">
              <div className="bg-purple-100 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <Sparkles className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Assistant</h3>
              <p className="text-gray-600">Get intelligent suggestions and assistance from our built-in AI coach to enhance your conversations.</p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-green-50 rounded-xl p-8 transition-all hover:shadow-lg">
              <div className="bg-green-100 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">User Presence</h3>
              <p className="text-gray-600">See when your contacts are online and stay connected with real-time presence indicators.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to transform your conversations?</h2>
          <p className="text-blue-100 text-lg mb-10">Join thousands of users who have elevated their communication experience.</p>
          <Button 
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6"
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
              <MessageSquare className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-bold text-white">ConverseAI</span>
            </div>
            <div className="flex space-x-8">
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Features</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
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