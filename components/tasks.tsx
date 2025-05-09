'use client'
import React, { useState, useEffect } from 'react'

import { useUIStore } from '@/store/useUIStore'
import { useProjectStore } from '@/store/useMainStore'
import { useUserStore } from '@/store/useUserStore'

type Task = {
  id: string
  title: string
  project_id: string
  user_email: string
}

const Tasks = () => {
  const selectedProject = useProjectStore((state) => state.selectedProject)
  const user = useUserStore((state) => state.user)
  const toggleChatbot = useUIStore((state) => state.toggleChatbot)

  const [tasks, setTasks] = useState<Task[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(false)

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
        <button
          onClick={toggleChatbot}
          className="ml-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-1 rounded"
        >
          Ask Gemini
        </button>
      </div>

      {loading && tasks.length === 0 && (
        <p className="text-slate-500 text-sm mt-4">Loading tasks...</p>
      )}
      {!loading && tasks.length === 0 && selectedProject && (
        <p className="text-slate-500 text-sm mt-4">No tasks yet for this project. Add one above or ask Gemini!</p>
      )}
      {!selectedProject && (
         <p className="text-slate-500 text-sm mt-4">Select a project to see its tasks.</p>
      )}

      {tasks.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {tasks.map((task) => (
            <li 
              key={task.id} 
              className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-slate-200 flex flex-col justify-between min-h-[100px]"
            >
              <button>=</button>
              <p className="text-sm text-slate-800 font-medium">{task.title}</p>
          
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Tasks
