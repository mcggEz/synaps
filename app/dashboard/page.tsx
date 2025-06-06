'use client';
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navbar';
import Sidenav from '@/components/sidenav';
import Chatbot from '@/components/chatbot';
import MainContent from '@/components/maincontent';
import { useUIStore } from '@/store/useUIStore';
import { Menu } from 'lucide-react';

const Dashboard = () => {
  const { isSidebarOpen, isChatbotOpen, toggleSidebar } = useUIStore();
  const [isStoreHydrated, setIsStoreHydrated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    if (useUIStore.persist.hasHydrated()) {
      setIsStoreHydrated(true);
    } else {
      const unsubscribe = useUIStore.persist.onFinishHydration(() => {
        setIsStoreHydrated(true);
      });
      return () => {
        unsubscribe();
      };
    }
  }, []);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Get the current state from the store
      const currentState = useUIStore.getState();
      
      // If switching to mobile, close sidebar; if switching to desktop, open sidebar
      if (mobile && currentState.isSidebarOpen) {
        useUIStore.setState({ isSidebarOpen: false });
      } else if (!mobile && !currentState.isSidebarOpen) {
        useUIStore.setState({ isSidebarOpen: true });
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isStoreHydrated) {
    return (
      <div className="flex flex-col h-screen">
        <Navbar />
        <div className="flex flex-1 overflow-hidden relative">
          <Sidenav />
          <div className="flex-1 p-4 overflow-auto transition-all duration-200">
            <MainContent />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-1 overflow-hidden relative mt-16">
        {/* Mobile Sidebar Toggle Button */}
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}

        {/* Sidebar */}
        <div className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-40' : 'relative'}
          ${isMobile ? (isSidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
          transition-transform duration-200 ease-in-out
          ${isMobile ? 'pt-16' : ''}
          h-[calc(100vh-4rem)]
        `}>
          <Sidenav />
        </div>

        {/* Main Content */}
        <div className={`
          flex-1 p-4 overflow-auto transition-all duration-200
          ${isChatbotOpen && !isMobile ? 'hidden md:block' : ''}
          h-[calc(100vh-4rem)]
        `}>
          <MainContent />
        </div>

        {/* Chatbot */}
        {isChatbotOpen && (
          <div className={`
            ${isMobile ? 'fixed bottom-0 left-0 right-0 h-[calc(100vh-4rem)]' : 'relative h-[calc(100vh-4rem)]'}
            bg-white z-40
            ${isMobile ? 'mt-16' : ''}
          `}>
            <Chatbot />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
