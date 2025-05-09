// store/useProjectStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Project {
  id: string;
  name: string;
  description: string;
}

interface ProjectState {
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  lastProjectsUpdate: number;
  triggerProjectsRefresh: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      selectedProject: null,
      setSelectedProject: (project) => set({ selectedProject: project }),
      lastProjectsUpdate: Date.now(),
      triggerProjectsRefresh: () => set({ lastProjectsUpdate: Date.now() }),
    }),
    {
      name: 'project-storage',
    }
  )
);
