import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabaseClient'

type User = {
  id: string
  email: string
  avatar_url?: string
  isGuest?: boolean
}

type UserStore = {
  user: User | null
  setUser: (user: User | null) => void
  setGuestUser: () => Promise<void>
  logout: () => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      setGuestUser: async () => {
        try {
          // Create a unique guest email with a valid format
          const timestamp = Date.now()
          const guestEmail = `guest.${timestamp}@synaps.app`
          const guestPassword = `guest_${timestamp}_${Math.random().toString(36).slice(-8)}`

          // Sign up a new guest user in Supabase
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: guestEmail,
            password: guestPassword,
            options: {
              data: {
                is_guest: true,
                guest_created_at: new Date().toISOString()
              },
              emailRedirectTo: `${window.location.origin}/auth/callback`
            }
          })

          if (authError) throw authError

          if (authData.user) {
            set({
              user: {
                id: authData.user.id,
                email: guestEmail,
                isGuest: true
              }
            })
          }
        } catch (error) {
          console.error('Error creating guest user:', error)
          throw error
        }
      },
      logout: () => set({ user: null }),
    }),
    {
      name: 'user-storage', // Key for localStorage
    }
  )
)
