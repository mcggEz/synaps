import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

interface ChatHistory {
  [projectId: string]: Message[];
}

interface ChatHistoryState {
  chatHistory: ChatHistory;
  addMessage: (projectId: string, message: Message) => void;
  getProjectHistory: (projectId: string) => Message[];
  clearProjectHistory: (projectId: string) => void;
}

export const useChatHistoryStore = create<ChatHistoryState>()(
  persist(
    (set, get) => ({
      chatHistory: {},
      addMessage: (projectId: string, message: Message) => {
        set((state) => ({
          chatHistory: {
            ...state.chatHistory,
            [projectId]: [...(state.chatHistory[projectId] || []), message],
          },
        }));
      },
      getProjectHistory: (projectId: string) => {
        return get().chatHistory[projectId] || [];
      },
      clearProjectHistory: (projectId: string) => {
        set((state) => {
          const newHistory = { ...state.chatHistory };
          delete newHistory[projectId];
          return { chatHistory: newHistory };
        });
      },
    }),
    {
      name: 'chat-history-storage',
    }
  )
); 