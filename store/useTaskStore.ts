import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Task = {
  id: string
  title: string
  project_id: string
  user_email: string
  created_at: string
  deadline: string | null
  completed: boolean
}

interface TaskState {
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  deleteTask: (taskId: string) => void
  clearTasks: () => void
}

// Helper function to sort tasks by creation date
const sortTasks = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      setTasks: (tasks) => set({ tasks: sortTasks(tasks) }),
      addTask: (task) => set((state) => ({ 
        tasks: sortTasks([...state.tasks, task]) 
      })),
      updateTask: (taskId, updates) =>
        set((state) => ({
          tasks: sortTasks(state.tasks.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task
          )),
        })),
      deleteTask: (taskId) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== taskId),
        })),
      clearTasks: () => set({ tasks: [] }),
    }),
    {
      name: 'task-storage', // unique name for localStorage
      partialize: (state) => ({ tasks: state.tasks }), // only persist tasks
    }
  )
) 