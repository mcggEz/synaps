'use client'
import React, { useState, useEffect } from 'react'

import { useUIStore } from '@/store/useUIStore'
import { useProjectStore } from '@/store/useMainStore'
import { useUserStore } from '@/store/useUserStore'
import { useChatbotStore } from '@/store/useChatbotStore'


type Task = {
  id: string
  title: string
  project_id: string
  user_email: string
  date_created: string
  deadline: string | null
  completed: boolean
}

const Tasks = () => {
  const { selectedProject, setSelectedProject, triggerProjectsRefresh } = useProjectStore()
  const user = useUserStore((state) => state.user)
  const toggleChatbot = useUIStore((state) => state.toggleChatbot)
  const setInputTemplate = useChatbotStore((state) => state.setInputTemplate)
  

  const [tasks, setTasks] = useState<Task[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [updateTitle, setUpdateTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const [updatetask, setUpdatetask] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [originalTitle, setOriginalTitle] = useState('')
  

  // Fetch tasks when project or user changes
  useEffect(() => {
    if (!selectedProject || !user) {
      setTasks([])
      return
    }
    setLoading(true);
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/read-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: selectedProject.id,
            user_email: user.email,
          }),
        })
        if (res.ok) {
          const data: Task[] = await res.json()
          setTasks(data)
        } else {
          console.error('Failed to fetch tasks')
          setTasks([])
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks()
  }, [selectedProject, user])

  // Add click outside handler for task settings menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openTaskId) {
        const target = event.target as HTMLElement;
        if (!target.closest('.task-settings-menu')) {
          setOpenTaskId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openTaskId]);

  // Existing click outside handler for update form
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (updatetask && updatingTaskId) {
        const target = event.target as HTMLElement;
        if (!target.closest('.update-input-container')) {
          // Only update if the title has changed
          if (updateTitle !== originalTitle) {
            handleUpdateTask(updatingTaskId);
          } else {
            // Reset states if no changes
            setUpdatetask(false);
            setUpdatingTaskId(null);
            setUpdateTitle('');
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [updatetask, updatingTaskId, updateTitle, originalTitle]);

  // Handler to add a new task
  const handleAddTask = async () => {
    if (!newTitle.trim() || !selectedProject || !user) return
    try {
      const res = await fetch('/api/add-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          project_id: selectedProject.id,
          user_email: user.email,
        }),
      })
      if (res.ok) {
        const data: Task = await res.json()
        setTasks((prev) => [...prev, data])
        setNewTitle('')
      } else {
        console.error('Add task failed')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/delete-task', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          user_email: user.email,
        }),
      })
      if (res.ok) {
        setTasks((prev) => prev.filter((task) => task.id !== taskId))
      } else {
        console.error('Delete task failed')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdateTask = async (taskId: string) => {
    if (!user) return;

    if (!updateTitle) return

    try {
      const res = await fetch('/api/update-task', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          user_email: user.email,
          updateData: { title: updateTitle },
        }),
      })
      if (res.ok) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, title: updateTitle } : task
          )
        )
        setUpdatetask(false)
        setUpdatingTaskId(null)
        setUpdateTitle('')
      } else {
        console.error('Update task failed')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkComplete = async (taskId: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/update-task', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          user_email: user.email,
          updateData: { completed: true },
        }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, completed: true } : task
          )
        );
      } else {
        console.error('Mark complete failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenTaskSettings = (taskId: string) => {
    // Toggle the task settings menu
    setOpenTaskId((prev) => (prev === taskId ? null : taskId));
  }

  const handleOpenUpdateTask = (taskId: string) => {
    const task = tasks.find(task => task.id === taskId);
    if (task) {
      setOpenTaskId(taskId);
      setUpdatetask(true);
      setUpdatingTaskId(taskId);
      setUpdateTitle(task.title);
      setOriginalTitle(task.title); // Store original title for comparison
    }
  }

  const getRAGStatus = (deadline: string | null): string => {
    if (!deadline) return 'green'; // No deadline, assume green

    const deadlineDate = new Date(deadline);
    const currentDate = new Date();
    const timeDiff = deadlineDate.getTime() - currentDate.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);

    if (daysDiff < 0) return 'red'; // Overdue
    if (daysDiff <= 3) return 'amber'; // Due soon
    return 'green'; // Plenty of time
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">Tasks</h3>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New task title"
          className="flex-1 border px-2 py-1 rounded"
        />
        <button
          onClick={handleAddTask}
          className="bg-amber-400 hover:bg-amber-500 text-black px-4 py-1 rounded-lg shadow"
        >
          Add Task
        </button>
    
      </div>

      {loading && tasks.length === 0 && (
        <p className="text-slate-500 text-sm mt-4">Loading tasks...</p>
      )}
      {!loading && tasks.length === 0 && selectedProject && (
        <div>
             <button
            onClick={() => {
              // Create a template with project details
              const template = `Help me create tasks for this project:
Project ID: ${selectedProject.id}
Project Name: ${selectedProject.name}
Project Description: ${selectedProject.description}

Please suggest some tasks that would be appropriate for this project.`;
              
              // Set the template in the store
              setInputTemplate(template);
              
              // Toggle the chatbot
              toggleChatbot();
            }}
            className="ml-2 bg-yellow-600 text-white px-4 py-2 rounded"
          >
            Ask Gemini
          </button> 
          <p className="text-slate-500 text-sm mt-4">No tasks yet for this project. Add one above or ask Gemini!</p>
        </div>
       
        
      )}
      {!selectedProject && (
         <p className="text-slate-500 text-sm mt-4">Select a project to see its tasks.</p>
      )}

      {tasks.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {tasks.map((task) => {
            const ragStatus = getRAGStatus(task.deadline);
            return (
              <li 
                key={task.id} 
                className={`bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-slate-200 flex flex-col justify-between min-h-[100px] relative ${ragStatus}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {updatetask && updatingTaskId === task.id ? (
                      <div className="update-input-container w-full">
                        <textarea 
                          value={updateTitle} 
                          onChange={(e) => setUpdateTitle(e.target.value)}
                          className="text-sm text-slate-800 font-medium border rounded px-2 py-1 w-full min-h-[60px] resize-none"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-slate-800 font-medium">{task.title}</p>
                    )}
                    <p className="text-sm text-slate-500 mt-2">Created: {new Date(task.date_created).toLocaleDateString()}</p>
                    <p className="text-sm text-slate-500 mt-2">Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}</p>
                  </div>
                  <div className="relative">
                    <button 
                      className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-1 task-settings-menu"
                      onClick={() => handleOpenTaskSettings(task.id)}
                    >
                      &#x22EE; {/* Vertical ellipsis */}
                    </button>
                    {openTaskId === task.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-10 task-settings-menu">
                        <button
                          onClick={() => handleOpenUpdateTask(task.id)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => handleMarkComplete(task.id)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          Mark as Done
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <div 
                    className={`w-2 h-2 rounded-full ${
                      task.completed ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  )
}

export default Tasks
