import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type User = {
  id: string
  email: string
  avatar_url?: string
}

type UserStore = {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'user-storage', // Key for localStorage
    }
  )
)
