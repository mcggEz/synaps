'use client'

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import LandingPageNavbar from '@/components/LandingPageNavbar';
import { useUserStore } from '@/store/useUserStore';

export default function LandingPage() {
  const router = useRouter();
  const setGuestUser = useUserStore((state) => state.setGuestUser);
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestMode = async () => {
    try {
      setIsLoading(true);
      await setGuestUser();
      router.push('/dashboard');
    } catch (error) {
      console.error('Error entering guest mode:', error);
      alert('Failed to enter guest mode. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      <LandingPageNavbar />
      
      {/* Hero Section */}
      <div className="flex-1 flex flex-col px-4 md:px-8">
        {/* Hero Content */}
        <div className="flex flex-col items-center text-center pt-8 md:pt-12 pb-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            synaps
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-md mb-6">
            Your intelligent project management companion powered by AI
          </p>
          <button
            onClick={handleGuestMode}
            disabled={isLoading}
            className={`w-fit px-8 py-3 text-base md:text-lg bg-black text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'
            }`}
          >
            {isLoading ? 'Loading...' : 'Try as Guest'}
          </button>
        </div>

        {/* Features Grid */}
        <div className="flex-1 flex items-center justify-center px-2 md:px-4 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full max-w-4xl">
            {/* AI Task Management */}
            <div className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg bg-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold">AI-Powered Tasks</h3>
              </div>
              <p className="text-sm text-gray-600">
                Let Gemini AI help break down your projects intelligently
              </p>
            </div>

            {/* Progress Tracking */}
            <div className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg bg-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold">Visual Progress</h3>
              </div>
              <p className="text-sm text-gray-600">
                Track completion with intuitive progress bars
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


