'use client'

import React, { useState } from 'react'
import { useUIStore } from '@/store/useUIStore'
import { useUserStore } from '@/store/useUserStore'

const Sidenav = () => {
  const { isSidebarOpen, toggleSidebar } = useUIStore()
  const { user } = useUserStore()

  const [showForm, setShowForm] = useState(false)
  const [projectData, setProjectData] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleShowForm = () => setShowForm(true)

  const handleCancel = () => {
    setShowForm(false)
    setProjectData({ name: '', description: '' })
    setError(null)
  }

  const handleAddProject = async () => {
    const trimmedName = projectData.name.trim()
    const trimmedDescription = projectData.description.trim()
  
    if (!trimmedName || !trimmedDescription) {
      setError('Please provide both a name and a description.')
      return
    }
  
    setLoading(true)
    setError(null)
  
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          description: trimmedDescription,
          user_email: user?.email, // ✅ get it from Zustand
        }),
      })
  
      const result = await response.json()
  
      if (!response.ok) {
        setError(result?.error || 'Failed to create project.')
        return
      }
  
      alert('Project created successfully!')
      console.log('Project created:', result)
  
      setProjectData({ name: '', description: '' })
      setShowForm(false)
    } catch (err: any) {
      console.error('Request failed:', err)
      setError('Unexpected error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }
  

  if (!isSidebarOpen) {
    return (
      <div className="w-12 h-full bg-gray-100 border-r flex items-center justify-center">
        <button onClick={toggleSidebar} className="text-gray-500 hover:text-black">
          ☰
        </button>
      </div>
    )
  }

  return (
    <aside className="w-64 p-4 overflow-y-auto border-r bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Navigation</h2>
        <button onClick={toggleSidebar} className="text-gray-500 hover:text-black">
          ×
        </button>
      </div>

      {!showForm && (
        <button
          onClick={handleShowForm}
          className="px-4 py-2 mb-4 bg-blue-500 text-white rounded hover:bg-blue-700"
        >
          Add Project
        </button>
      )}

      {showForm && (
        <div className="space-y-2">
          <input
            type="text"
            value={projectData.name}
            onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
            placeholder="Project Name"
            className="w-full p-2 border rounded"
            required
          />

          <input
            type="text"
            value={projectData.description}
            onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
            placeholder="Project Description"
            className="w-full p-2 border rounded"
            required
          />

          <div className="flex space-x-2">
            <button
              onClick={handleAddProject}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>

            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>

          {error && <p className="text-red-500">{error}</p>}
        </div>
      )}
    </aside>
  )
}

export default Sidenav
