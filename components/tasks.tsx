'use client'
import React, { useState, useEffect } from 'react'

import { useUIStore } from '@/store/useUIStore'
import { useProjectStore } from '@/store/useMainStore'
import { useUserStore } from '@/store/useUserStore'
import { useChatbotStore } from '@/store/useChatbotStore'
import { useTaskStore } from '@/store/useTaskStore'
import { useChatHistoryStore } from '@/store/useChatHistoryStore'


type Task = {
  id: string
  title: string
  project_id: string
  user_email: string
  created_at: string
  deadline: string | null
  completed: boolean
}

const Tasks = () => {
  const { selectedProject, setSelectedProject, triggerProjectsRefresh } = useProjectStore()
  const user = useUserStore((state) => state.user)
  const toggleChatbot = useUIStore((state) => state.toggleChatbot)
  const isChatbotOpen = useUIStore((state) => state.isChatbotOpen)
  const setInputTemplate = useChatbotStore((state) => state.setInputTemplate)
  const { addMessage } = useChatHistoryStore()
  
  const { tasks, setTasks, addTask, updateTask, deleteTask, clearTasks } = useTaskStore()
  const [newTitle, setNewTitle] = useState('')
  const [updateTitle, setUpdateTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const [updatetask, setUpdatetask] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [originalTitle, setOriginalTitle] = useState('')
  const [updatingDeadlineId, setUpdatingDeadlineId] = useState<string | null>(null)
  const [newDeadline, setNewDeadline] = useState<string>('')
  const [isStoreHydrated, setIsStoreHydrated] = useState(false)
  
  // Handle store hydration
  useEffect(() => {
    if (useTaskStore.persist.hasHydrated()) {
      setIsStoreHydrated(true);
    } else {
      const unsubscribe = useTaskStore.persist.onFinishHydration(() => {
        setIsStoreHydrated(true);
      });
      return () => {
        unsubscribe();
      };
    }
  }, []);

  // Fetch tasks when project or user changes
  useEffect(() => {
    if (!selectedProject || !user || !isStoreHydrated) {
      clearTasks()
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
          clearTasks()
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
        clearTasks();
      } finally {
        setLoading(false);
      }
    }
    fetchTasks()
  }, [selectedProject, user, setTasks, clearTasks, isStoreHydrated])

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

  // Add click outside handler for title update
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (updatingTaskId) {
        const target = event.target as HTMLElement;
        if (!target.closest('.title-input-container')) {
          if (updateTitle !== originalTitle) {
            handleUpdateTask(updatingTaskId);
          } else {
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
  }, [updatingTaskId, updateTitle, originalTitle]);

  // Add click outside handler for deadline update
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (updatingDeadlineId) {
        const target = event.target as HTMLElement;
        if (!target.closest('.deadline-input-container')) {
          handleUpdateDeadline(updatingDeadlineId);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [updatingDeadlineId, newDeadline]);

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
        addTask(data)
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
        deleteTask(taskId)
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
        updateTask(taskId, { title: updateTitle })
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

  const handleMarkComplete = async (taskId: string, completed: boolean) => {
    if (!user) return;
    
    // Optimistically update the UI
    updateTask(taskId, { completed });
    
    try {
      const res = await fetch('/api/update-task', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          user_email: user.email,
          updateData: { completed },
        }),
      });
      if (!res.ok) {
        // If the request fails, revert the optimistic update
        updateTask(taskId, { completed: !completed });
        console.error('Mark complete failed');
      }
    } catch (err) {
      // If there's an error, revert the optimistic update
      updateTask(taskId, { completed: !completed });
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

  const handleUpdateDeadline = async (taskId: string) => {
    if (!user) return;

    try {
      const res = await fetch('/api/update-task', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          user_email: user.email,
          updateData: { deadline: newDeadline },
        }),
      })
      if (res.ok) {
        updateTask(taskId, { deadline: newDeadline })
        setUpdatingDeadlineId(null)
        setNewDeadline('')
      } else {
        console.error('Update deadline failed')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleOpenDeadlineUpdate = (taskId: string, currentDeadline: string | null) => {
    setUpdatingDeadlineId(taskId)
    setNewDeadline(currentDeadline || '')
  }

  const extractTasksFromResponse = (text: string) => {
    const tasks: { title: string; deadline: string | null }[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      // Match numbered tasks (1. Task name) or bullet points (• Task name)
      const taskMatch = line.match(/^[•\d+\.]\s*(.+?)(?:\s*\(due:\s*([^)]+)\))?$/);
      if (taskMatch) {
        tasks.push({
          title: taskMatch[1].trim(),
          deadline: taskMatch[2] ? new Date(taskMatch[2]).toISOString() : null
        });
      }
    }
    
    return tasks;
  };

  const sendMessage = async (message: string) => {
    if (!selectedProject || !user) return;

    try {
      console.log('=== Starting Ask Gemini Flow ===');
      console.log('1. Current chatbot state:', isChatbotOpen);
      
      // Create a more detailed prompt with project context
      const enhancedMessage = `Based on this project:
Title: ${selectedProject.name}
Description: ${selectedProject.description}

${message}

Please provide a list of tasks that would help complete this project. For each task, include a suggested deadline if applicable. Format each task as a numbered or bulleted item, and if you suggest a deadline, include it in parentheses like this: "Task name (due: YYYY-MM-DD)".`;

      // Set the template in the chatbot store
      console.log('2. Setting input template');
      setInputTemplate(enhancedMessage);
      
      // Open the chatbot if it's not already open
      console.log('3. Checking if chatbot needs to be opened');
      if (!isChatbotOpen) {
        console.log('4. Toggling chatbot open');
        toggleChatbot();
      }

      // Add the user message to chat history
      const userMessage = {
        sender: 'user' as const,
        text: enhancedMessage,
        timestamp: new Date().toISOString()
      };

      // Add message to store
      addMessage(selectedProject.id, userMessage);

      // Save message to database
      await fetch('/api/chat-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: selectedProject.id,
          user_email: user.email,
          message: userMessage
        })
      });

      // Get response from Gemini API
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: enhancedMessage,
          context: [{
            role: 'user',
            content: enhancedMessage
          }]
        })
      });

      if (!res.ok) {
        throw new Error('Failed to get response from Gemini');
      }

      const data = await res.json();
      const botResponseText = data.text;

      // Add bot response to chat history
      const botMessage = {
        sender: 'bot' as const,
        text: botResponseText,
        timestamp: new Date().toISOString()
      };

      addMessage(selectedProject.id, botMessage);
      await fetch('/api/chat-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: selectedProject.id,
          user_email: user.email,
          message: botMessage
        })
      });

      // Extract tasks from the response
      const extractedTasks = extractTasksFromResponse(botResponseText);
      if (extractedTasks.length > 0) {
        // Add tasks to the project
        const tasksRes = await fetch('/api/add-multiple-tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project_id: selectedProject.id,
            user_email: user.email,
            tasks: extractedTasks
          })
        });

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          if (tasksData.data) {
            // Add tasks to the local store
            tasksData.data.forEach((task: any) => {
              addTask(task);
            });

            // Add success message to chat
            const successMessage = {
              sender: 'bot' as const,
              text: `✅ Successfully added ${extractedTasks.length} tasks to your project!`,
              timestamp: new Date().toISOString()
            };

            addMessage(selectedProject.id, successMessage);
            await fetch('/api/chat-history', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                project_id: selectedProject.id,
                user_email: user.email,
                message: successMessage
              })
            });
          }
        }
      }
      
      // Add a small delay to ensure the chatbot is open before sending the message
      setTimeout(() => {
        console.log('5. Chatbot state after toggle:', isChatbotOpen);
      }, 100);
    } catch (error) {
      console.error('Error in Ask Gemini flow:', error);
      // Add error message to chat history
      const errorMessage = {
        sender: 'bot' as const,
        text: 'Sorry, I encountered an error while processing your request.',
        timestamp: new Date().toISOString()
      };
      addMessage(selectedProject.id, errorMessage);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Tasks</h3>
        {tasks.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(tasks.filter(t => t.completed).length / tasks.length) * 100}%` 
                  }}
                />
              </div>
              <span className="text-sm text-gray-600">
                {Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)}% Complete
              </span>
            </div>
            <div className="text-sm text-gray-500">
              ({tasks.filter(t => t.completed).length}/{tasks.length} tasks)
            </div>
          </div>
        )}
      </div>

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
          className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-1 rounded-lg shadow"
        >
          Add Task
        </button>
    
      </div>

      {loading && tasks.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 animate-pulse">
              <div className="space-y-3">
                {/* Title skeleton */}
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                
                {/* Created date skeleton */}
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                
                {/* Deadline skeleton */}
                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                
                {/* Bottom section skeleton */}
                <div className="flex justify-between items-center pt-4">
                  <div className="h-5 bg-slate-200 rounded w-16"></div>
                  <div className="h-2 w-2 bg-slate-200 rounded-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && tasks.length === 0 && selectedProject && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
          <div className="bg-slate-50 rounded-lg p-8 max-w-md w-full border border-slate-200 mt-10">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12 text-slate-400 mx-auto mb-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
              />
            </svg>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Tasks Yet</h3>
            <p className="text-slate-500 mb-6">
              Get started by adding tasks manually or let Gemini help you create a task list for your project.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  const template = `Help me create tasks for this project`;
                  sendMessage(template);
                }}
                className="inline-flex items-center justify-center gap-2 bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
                  />
                </svg>
                Ask Gemini for Task Suggestions
              </button>
              <p className="text-sm text-slate-900">
                Or add your first task using the input field above
              </p>
            </div>
          </div>
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
                    {updatingTaskId === task.id ? (
                      <div className="title-input-container">
                        <textarea 
                          value={updateTitle} 
                          onChange={(e) => setUpdateTitle(e.target.value)}
                          className="text-sm text-slate-800 font-medium border rounded px-2 py-1 w-full min-h-[60px] resize-none"
                          autoFocus
                          onFocus={(e) => {
                            // Move cursor to end of text
                            const length = e.target.value.length;
                            e.target.setSelectionRange(length, length);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p 
                          className="text-sm text-slate-800 font-medium cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => {
                            setUpdatingTaskId(task.id);
                            setUpdateTitle(task.title);
                            setOriginalTitle(task.title);
                          }}
                        >
                          {task.title}
                        </p>
                      </div>
                    )}
                    <p className="text-sm text-slate-500 mt-2">Created: {new Date(task.created_at).toLocaleDateString()}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {updatingDeadlineId === task.id ? (
                        <div className="deadline-input-container">
                          <input
                            type="date"
                            value={newDeadline}
                            onChange={(e) => setNewDeadline(e.target.value)}
                            className="text-sm text-slate-500 border rounded px-2 py-1"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-slate-500">
                            Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                          </p>
                          <button
                            onClick={() => handleOpenDeadlineUpdate(task.id, task.deadline)}
                            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-1"
                            title="Update deadline"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
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
                          onClick={() => handleDeleteTask(task.id)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-5">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(e) => handleMarkComplete(task.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      {task.completed ? 'Done' : 'To Do'}
                    </span>
                  </label>
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

