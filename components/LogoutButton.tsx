'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';

const LogoutButton = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, logout } = useUserStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      
      if (user?.isGuest) {
        console.log('Attempting to delete guest user:', user.id);
        
        // Delete the guest user account
        const response = await fetch('/api/delete-guest', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: user.id }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('Error deleting guest account:', data.error, data.details);
          throw new Error(data.error || 'Failed to delete guest account');
        }

        console.log('Successfully deleted guest account');

        // Sign out and clear local storage
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          console.error('Error signing out:', signOutError);
        }

        localStorage.removeItem('user-storage');
        logout();
        router.push('/');
        return;
      }

      // Regular user logout
      const { error } = await supabase.auth.signOut();
      localStorage.removeItem('user-storage');

      if (error) {
        console.error('Error logging out:', error.message);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      alert('Failed to exit guest mode. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div
      className={`px-4 py-2 hover:bg-gray-100 transition-colors duration-150 cursor-pointer ${
        isLoading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      onClick={handleLogout}
    >
      {isLoading ? 'Loading...' : user?.isGuest ? 'Exit Guest Mode' : 'Logout'}
    </div>
  );
};

export default LogoutButton;
