// store/useChatbotStore.ts
import { create } from 'zustand';

interface ChatbotState {
  inputTemplate: string;
  setInputTemplate: (template: string) => void;
}

export const useChatbotStore = create<ChatbotState>((set) => ({
  inputTemplate: '',
  setInputTemplate: (template) => set({ inputTemplate: template }),
}));
