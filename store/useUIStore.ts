import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
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
      closeAll: () => set((state) => {
        console.log('Closing all panels. Previous state:', { isSidebarOpen: state.isSidebarOpen, isChatbotOpen: state.isChatbotOpen });
        return { isSidebarOpen: false, isChatbotOpen: false };
      }),
    }),
    {
      name: 'ui-storage', // Key for localStorage
      partialize: (state) => ({ 
        isSidebarOpen: state.isSidebarOpen,
        isChatbotOpen: state.isChatbotOpen 
      }), // Persist both states
    }
  )
)
