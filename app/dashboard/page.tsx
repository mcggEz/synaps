'use client';
import React from 'react';
import Navbar from '@/components/navbar';
import Sidenav from '@/components/sidenav';
import Chatbot from '@/components/chatbot';
import MainContent from '@/components/maincontent';
import { useUIStore } from '@/store/useUIStore';

const Dashboard = () => {
  const { isSidebarOpen, isChatbotOpen} = useUIStore();

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-1 overflow-hidden relative">
        {!isSidebarOpen && (
          <button
            onClick={isSidebarOpen ? undefined : () => useUIStore.setState({ isSidebarOpen: true })}
            className="absolute top-4 left-4 z-50 bg-white shadow px-3 py-1 rounded hover:bg-gray-100"
          >
            Open
          </button>
        )}
        {isSidebarOpen && <Sidenav />}
        <div className="flex-1 p-4 overflow-auto">
          <MainContent />
        </div>
        {isChatbotOpen && <Chatbot />}
      </div>
    </div>
  );
};

export default Dashboard;
