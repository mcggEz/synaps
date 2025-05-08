// store/useChatbotStore.ts
import { create } from 'zustand';

interface ChatbotState {
  isOpen: boolean;
  toggleChatbot: () => void;
  inputTemplate: string;
  setInputTemplate: (template: string) => void;
}

export const useChatbotStore = create<ChatbotState>((set) => ({
  isOpen: false,
  toggleChatbot: () => set((state) => ({ isOpen: !state.isOpen })),
  inputTemplate: '',
  setInputTemplate: (template) => set({ inputTemplate: template }),
}));
