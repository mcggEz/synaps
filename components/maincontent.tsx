'use client'
import React, { useState, useEffect } from 'react'
import Tasks from './tasks'
import { useUserStore } from '@/store/useUserStore'
import { useProjectStore } from '@/store/useMainStore'
import { useUIStore } from '@/store/useUIStore'
import { useChatbotStore } from '@/store/useChatbotStore'

const MainContent = () => {
  const { selectedProject, setSelectedProject, triggerProjectsRefresh } = useProjectStore()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [isStoreHydrated, setIsStoreHydrated] = useState(false)
  const { user } = useUserStore()
  const toggleChatbot = useUIStore((state) => state.toggleChatbot)
  const setInputTemplate = useChatbotStore((state) => state.setInputTemplate)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen)

  useEffect(() => {
    if (useProjectStore.persist.hasHydrated()) {
      setIsStoreHydrated(true)
    } else {
      const unsubscribe = useProjectStore.persist.onFinishHydration(() => {
        setIsStoreHydrated(true)
      })
      return () => {
        unsubscribe()
      }
    }
  }, [])

  useEffect(() => {
    if (selectedProject) {
      setName(selectedProject.name || '')
      setDescription(selectedProject.description || '')
    } else {
      setName('')
      setDescription('')
      setEditing(false)
    }
    setLoading(false)
  }, [selectedProject])

  const handleSave = async () => {
    if (!selectedProject || !user) return
    setLoading(true)

    const res = await fetch('/api/update-projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedProject.id,
        user_email: user.email, // ✅ Include user email
        updateData: {
          name,
          description,
        },
      }),
    })

    if (res.ok) {
      setSelectedProject({
        ...selectedProject,
        name,
        description,
      })
      setEditing(false)
      triggerProjectsRefresh()
    } else {
      console.error('Update failed')
    }

    setLoading(false)
  }

  if (!isStoreHydrated) {
    return <p>Loading project details...</p>
  }

  if (!selectedProject) {
    return <p>Select a project to view details.</p>
  }

  return (
    <div className="relative">
      {/* Sidebar Toggle Button - Only show when sidebar is closed */}
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-20 left-4 z-50 p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 hover:bg-gray-50"
          aria-label="Toggle Sidebar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}

      <div> {/* Increased padding to account for both nav and button */}
        {editing ? (
          <>
            <input
              className="text-2xl font-bold px-2 py-1 w-full mb-2 rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="text-gray-500 mb-2">Project Details</p>
            <textarea
              className="text-gray-700 px-2 py-1 w-full rounded"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold">{selectedProject.name}</h2>
            <p className="text-gray-500 mb-2">{selectedProject.description}</p>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setName(selectedProject.name)
                  setDescription(selectedProject.description)
                  setEditing(true)
                }}
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
              >
                Edit
              </button>
              
              <button
                onClick={async () => {
                  if (!user) return
                  const res = await fetch('/api/delete-projects', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id: selectedProject.id,
                      user_email: user.email,
                    }),
                  })

                  if (res.ok) {
                    setSelectedProject(null)
                    triggerProjectsRefresh()
                  } else {
                    console.error('Delete failed')
                  }
                }}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </>
        )}
        <Tasks />
      </div>
    </div>
  )
}

export default MainContent
