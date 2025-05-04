'use client';

import React, { useState, useEffect } from 'react';

import { supabase } from '@/lib/supabaseClient'; // Adjust the import based on your project structure

import LogoutButton from './LogoutButton';

const Navbar = () => {
  const [openProfile, setOpenProfile] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();
  }, []);

  return (
    <nav className="w-full px-6 py-4 flex items-center justify-between shadow-md bg-white text-black relative">
      <div className="text-2xl font-bold tracking-wide">synaps</div>

      <div className="flex items-center gap-4 relative">
        <input
          type="text"
          placeholder="Search..."
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {/* Profile Button */}
        <div className="relative">
          <button
            onClick={() => setOpenProfile((prev) => !prev)}
            className="flex items-center gap-2 "
          >
            {/* Display user's Gmail profile image if available */}
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <span className="text-xl">{user?.email?.charAt(0).toUpperCase()}</span>
            )}
 
          </button>

          {/* Dropdown Menu */}
          {openProfile && (
            <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-md z-10">
              <ul className="py-1 text-sm text-gray-700">
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">My Account</li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Settings</li>
                <LogoutButton /> {/* Logout button component */}
              </ul>
            </div>
          )}
        </div>

        {/* Chat Button */}
        <button className="cursor-pointer hover:underline text-sm text-gray-600">
          <p>Chat</p>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
