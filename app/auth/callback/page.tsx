'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');  // Redirect to dashboard if authenticated
      } else {
        router.push('/login'); // Or wherever you want to send the user if no session
      }
    };

    checkSession();
  }, [router]);

  // No UI content, just silently redirecting
  return null;
}
