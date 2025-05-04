'use client'
import React from 'react'
import { supabase } from '@/lib/supabaseClient';

const LandingPageNavbar = () => {

    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`
          }
        });
      
        if (error) console.error('Error logging in:', error.message);
      };

  return (

  <header className="w-full px-6 py-4 flex items-center justify-between shadow-sm bg-white">
    <div className="text-2xl font-bold text-indigo-600">Synaps</div>
    <nav>
 <button onClick={handleLogin}>Login with Google</button>
    </nav>
  </header>

  )
}

export default LandingPageNavbar
