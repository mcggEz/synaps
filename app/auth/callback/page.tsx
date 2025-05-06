'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useUserStore } from '@/store/useUserStore'; // Assuming this exists

export default function AuthCallback() {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error retrieving session:', error);
        return router.push('/login');
      }

      if (session?.user) {
        const { id, email, user_metadata } = session.user;

        setUser({
          id,
          email: email || '',
          avatar_url: user_metadata?.avatar_url || user_metadata?.picture || '',
        });

        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    };

    checkSession();
  }, [router, setUser]);

  return null;
}
