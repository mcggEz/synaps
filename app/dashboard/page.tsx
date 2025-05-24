'use client';
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/navbar';
import Sidenav from '@/components/sidenav';
import Chatbot from '@/components/chatbot';
import MainContent from '@/components/maincontent';
import { useUIStore } from '@/store/useUIStore';

const Dashboard = () => {
  const { isSidebarOpen, isChatbotOpen } = useUIStore();
  const [isStoreHydrated, setIsStoreHydrated] = useState(false);
  
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

  console.log('Dashboard render - Chatbot state:', isChatbotOpen);

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
      <div className="flex flex-1 overflow-hidden relative">
        <Sidenav />
        <div className="flex-1 p-4 overflow-auto transition-all duration-200 ">
          <MainContent />
        </div>
        {isChatbotOpen && (() => {
          console.log('Rendering Chatbot component');
          return <Chatbot />;
        })()}
      </div>
    </div>
  );
};

export default Dashboard;
