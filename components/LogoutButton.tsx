'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Adjust path as needed
import { useRouter } from 'next/navigation'; // Adjusted for Next.js 13

const LogoutButton = () => {

  const [isMounted, setIsMounted] = useState(false); // Add state to track if component is mounted
  const router = useRouter();

  useEffect(() => {
    // Ensure that the router is only accessed after the component is mounted
    setIsMounted(true);
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error logging out:', error.message);
    } else {
      // Redirect to login or home page after successful logout
      router.push('/');  // or router.push('/')
    }
  };

  if (!isMounted) return null; // Avoid rendering the component until mounted

  return (
    <div className="relative">
   
   

            <li
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={handleLogout}
            >
              Logout
            </li>
      </div>
  
  );
};

export default LogoutButton;
