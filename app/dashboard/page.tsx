'use client';
import React from 'react';
import Navbar from '@/components/navbar';
import Sidenav from '@/components/sidenav';
import Chatbot from '@/components/chatbot';
import MainContent from '@/components/maincontent';
import { useUIStore } from '@/store/useUIStore';

const Dashboard = () => {
  const { isSidebarOpen, isChatbotOpen } = useUIStore();

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidenav />
        <div className="flex-1 p-4 overflow-auto transition-all duration-200 ">
          <MainContent />
        </div>
        {isChatbotOpen && <Chatbot />}
      </div>
    </div>
  );
};

export default Dashboard;
