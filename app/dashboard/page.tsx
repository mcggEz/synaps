'use client';

import React from 'react';
import Navbar from '@/components/navbar';
import Chatbot from '@/components/chatbot';
import Sidenav from '@/components/sidenav';

const Dashboard = () => {
  return (
    <div className="h-screen flex flex-col">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content: Sidebar + Content + Chatbot */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
    <Sidenav /> 

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <p>Welcome to your dashboard. Choose something from the sidebar to get started.</p>
        </main>


       <Chatbot />
      </div>
    </div>
  );
};

export default Dashboard;
