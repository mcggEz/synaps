'use client'
import React, { useState, useEffect } from 'react'
import Tasks from './tasks'
import { useUserStore } from '@/store/useUserStore'
import { useProjectStore } from '@/store/useMainStore'
import { useUIStore } from '@/store/useUIStore'
import { useChatbotStore } from '@/store/useChatbotStore'

const MainContent = () => {
  const { selectedProject, setSelectedProject, triggerProjectsRefresh } = useProjectStore()
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
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
      setEditingTitle(false)
      setEditingDescription(false)
    }
    setLoading(false)
  }, [selectedProject])

  const handleSave = async () => {
    if (!selectedProject || !user) return
    // Only update if there are changes
    if (name === selectedProject.name && description === selectedProject.description) {
      setEditingTitle(false)
      setEditingDescription(false)
      return
    }
    setLoading(true)

    const res = await fetch('/api/update-projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedProject.id,
        user_email: user.email,
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
      setEditingTitle(false)
      setEditingDescription(false)
      triggerProjectsRefresh()
    } else {
      console.error('Update failed')
    }

    setLoading(false)
  }

  // Add click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (editingTitle && !target.closest('.title-input-container')) {
        handleSave();
      }
      if (editingDescription && !target.closest('.description-input-container')) {
        handleSave();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingTitle, editingDescription, name, description]);

  if (!isStoreHydrated) {
    return <p>Loading project details...</p>
  }

  if (!selectedProject) {
    return <p>Select a project to view details.</p>
  }

  return (
    <div className="relative">
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {editingTitle ? (
              <div className="title-input-container">
                <input
                  className="text-2xl font-bold px-2 py-1 w-full mb-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  onFocus={(e) => {
                    const length = e.target.value.length;
                    e.target.setSelectionRange(length, length);
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <h2 
                    className="text-2xl font-bold cursor-pointer hover:text-blue-600 transition-colors peer"
                    onClick={() => setEditingTitle(true)}
                  >
                    {selectedProject.name}
                  </h2>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-slate-400 opacity-0 peer-hover:opacity-100 transition-opacity absolute left-full top-1/2 -translate-y-1/2 ml-1" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                    />
                  </svg>
                </div>
              </div>
            )}

            {editingDescription ? (
              <div className="description-input-container">
                <textarea
                  className="text-gray-700 px-2 py-1 w-full rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  autoFocus
                  onFocus={(e) => {
                    const length = e.target.value.length;
                    e.target.setSelectionRange(length, length);
                  }}
                />
              </div>
            ) : (
              <div className="group flex items-center gap-2">
                <p 
                  className="text-gray-500 mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => setEditingDescription(true)}
                >
                  {selectedProject.description}
                </p>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                  />
                </svg>
              </div>
            )}
          </div>
          
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
            className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
            title="Delete project"
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
                strokeWidth={1.5} 
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
              />
            </svg>
          </button>
        </div>
        <Tasks />
      </div>
    </div>
  )
}

export default MainContent
