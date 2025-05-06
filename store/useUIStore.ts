import { create } from 'zustand'

type UIState = {
  isSidebarOpen: boolean
  isChatbotOpen: boolean
  toggleSidebar: () => void
  toggleChatbot: () => void
  closeAll: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  isChatbotOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleChatbot: () => set((state) => ({ isChatbotOpen: !state.isChatbotOpen })),
  closeAll: () => set({ isSidebarOpen: false, isChatbotOpen: false }),
}))
