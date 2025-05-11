import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type UIState = {
  isSidebarOpen: boolean
  isChatbotOpen: boolean
  toggleSidebar: () => void
  toggleChatbot: () => void
  closeAll: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      isChatbotOpen: false,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      toggleChatbot: () => set((state) => ({ isChatbotOpen: !state.isChatbotOpen })),
      closeAll: () => set({ isSidebarOpen: false, isChatbotOpen: false }),
    }),
    {
      name: 'ui-storage', // Key for localStorage
      partialize: (state) => ({ isSidebarOpen: state.isSidebarOpen }), // Only persist isSidebarOpen
    }
  )
)
