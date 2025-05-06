// store/useProjectStore.ts
import { create } from 'zustand';

type Project = {
  id: string;
  name: string;
  description: string;
};

type ProjectStore = {
  selectedProject: Project | null;
  setSelectedProject: (project: Project) => void;
};

export const useProjectStore = create<ProjectStore>((set) => ({
  selectedProject: null,
  setSelectedProject: (project) => set({ selectedProject: project }),
}));
