'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useUIStore } from '@/store/useUIStore'
import { useUserStore } from '@/store/useUserStore'
import { useProjectStore } from '@/store/useMainStore'
import Link from 'next/link'

// 1. Skeleton Card Component (Re-added)
const ProjectSkeletonCard = () => (
  <li className="border-b py-3 animate-pulse">
    <div className="h-5 bg-gray-300 rounded-md w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-300 rounded-md w-1/2"></div>
  </li>
);

// Define Project interface here
interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

// Helper function to format date
const formatDate = (dateString: string) => {
  try {
    // Handle PostgreSQL timestamp format by removing timezone and microseconds
    const cleanDateString = dateString.split('+')[0].split('.')[0];
    const date = new Date(cleanDateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date string:', dateString);
      return 'Invalid date';
    }

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error, 'Date string:', dateString);
    return 'Invalid date';
  }
};

const Sidenav = () => {
  const { isSidebarOpen, toggleSidebar } = useUIStore()
  const { user } = useUserStore()
  const { setSelectedProject, lastProjectsUpdate } = useProjectStore()

  const [showForm, setShowForm] = useState(false)
  const [projectData, setProjectData] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(true) // Initialized true for first load
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])

  // Ref to track if it's the initial mount for the lastProjectsUpdate effect
  const isInitialMountForLastUpdateRef = useRef(true)

  // Effect to handle setting loading to true for explicit refreshes
  useEffect(() => {
    if (isInitialMountForLastUpdateRef.current) {
      isInitialMountForLastUpdateRef.current = false // Mark initial mount as passed
    } else {
      // This means lastProjectsUpdate changed after the initial mount
      setLoading(true)
    }
  }, [lastProjectsUpdate])

  // Effect to handle data fetching
  useEffect(() => {
    const fetchProjectsData = async () => {
      if (user?.email) {
        // setError(null) // Clear error before new fetch attempt for this user
        try {
          const response = await fetch('/api/read-projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_email: user.email }),
          })
          if (!response.ok) {
            const result = await response.json()
            setError(result?.error || 'Failed to load projects.')
            setProjects([])
          } else {
            const data = await response.json()
            setProjects(data)
            setError(null) // Clear error on successful fetch
          }
        } catch (err: any) {
          setError(err.message || 'Unexpected error occurred.')
          setProjects([])
        } finally {
          setLoading(false)
        }
      } else {
        // No user, or user object doesn't have an email.
        setProjects([])
        setError(null) // Clear error if no user/logged out
        setLoading(false) // Stop loading indicator.
      }
    }

    // We fetch if we are in a loading state (initial or due to refresh)
    // OR if user.email is present (covers hydration: user appears, loading was false).
    // This ensures data is fetched when user state is resolved, even if not actively "loading".
    if (loading) { // If we are meant to be loading (initial or explicit refresh)
      fetchProjectsData()
    } else if (user?.email) { // If not "loading" but user.email just appeared (hydration)
      fetchProjectsData()
    } else if (!user?.email && !loading) {
      // Explicitly handle the case where we are not loading and there's no user
      // Ensures UI is clean if, for example, user logs out.
      setProjects([])
      setError(null)
    }
    // The dependencies are user?.email and loading (which changes due to lastProjectsUpdate indirectly).
    // And lastProjectsUpdate to re-trigger if user is same but data needs refresh.
  }, [user?.email, loading, lastProjectsUpdate])

  const handleShowForm = () => {
    setShowForm(true)
    setError(null) // Clear form error when showing form
  }

  const handleProjectClick = (projectId: number) => {
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      setSelectedProject({ ...project, id: project.id.toString() })
    } else {
      console.warn('Project not found:', projectId)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setProjectData({ name: '', description: '' })
    setError(null) // Clear form error on cancel
  }

  const handleAddProject = async () => {
    const trimmedName = projectData.name.trim()
    const trimmedDescription = projectData.description.trim()

    if (!trimmedName || !trimmedDescription) {
      setError('Please provide both a name and a description.') // Use formError
      return
    }

    setLoading(true) // Use formProcessing
    setError(null)

    try {
      const response = await fetch('/api/add-projects', {
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
        setError(result?.error || 'Failed to create project.') // Use formError
        setLoading(false) // Stop form processing
        return
      }

      // Assuming triggerProjectsRefresh is a function to refresh the project list
      // triggerProjectsRefresh()

      setProjectData({ name: '', description: '' })
      setShowForm(false)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError('Unexpected error: ' + err.message) // Use formError
      } else {
        setError('Unexpected error occurred.') // Use formError
      }
    } finally {
      setLoading(false) // Use formProcessing
    }
  }

  return (
    <div className={`h-full bg-white border-r border-gray-200 transition-all duration-200 ${isSidebarOpen ? 'w-64' : 'w-14'}`}>
      {!isSidebarOpen ? (
        <div className="flex flex-col items-center py-4 space-y-4">
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
            aria-label="Open Sidebar"
            title="Open Sidebar"
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
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </button>
          
          {loading ? (
            // Show skeleton loaders when loading
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-md bg-gray-200 animate-pulse" />
            ))
          ) : projects.length > 0 ? (
            // Show project icons
            projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors group relative"
                title={project.name}
              >
                <span className="text-sm font-medium group-hover:text-blue-600">
                  {project.name.charAt(0).toUpperCase()}
                </span>
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {project.name}
                </div>
              </button>
            ))
          ) : (
            // Show empty state
            <div className="text-gray-400 text-xs text-center px-2">
              No projects
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Projects</h3>
            <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <div className="flex-grow overflow-y-auto mb-4 pr-1">
            {error && !showForm && (
              <p className="text-red-500 text-sm mb-2 px-1 py-2 bg-red-50 rounded-md">{error}</p>
            )}

            {loading && projects.length === 0 && (
              <ul className="space-y-1">
                {[1, 2, 3].map((n) => <ProjectSkeletonCard key={n} />)}
              </ul>
            )}

            {!loading && projects.length === 0 && user && (
              <p className="text-gray-500 text-sm p-3 text-center">
                No projects yet. Add one to get started!
              </p>
            )}
            
            {!loading && projects.length > 0 && (
              <ul className="space-y-1">
                {projects.map((project) => (
                  <li
                    key={project.id}
                    className="p-2.5 border-b border-gray-200 hover:bg-slate-100 cursor-pointer rounded-md group"
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <div className="font-medium text-slate-700 group-hover:text-blue-600 truncate">{project.name}</div>
                    <div className="text-sm text-gray-500 truncate">{project.description}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Created {formatDate(project.created_at)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!showForm ? (
            <button
              onClick={handleShowForm}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Add Project
            </button>
          ) : (
            <div className="space-y-3 py-2">
              <h4 className="text-md font-semibold text-slate-700 mb-1">New Project</h4>
              <input
                type="text"
                value={projectData.name}
                onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                placeholder="Project Name"
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              />
              <textarea
                value={projectData.description}
                onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                placeholder="Short Description"
                rows={3}
                className="w-full p-2 border border-slate-300 rounded-md h-20 resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              />
              {error && showForm && <p className="text-red-500 text-xs mt-1">{error}</p>}
              <div className="flex space-x-2">
                <button
                  onClick={handleAddProject}
                  className="flex-1 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-70 transition-colors text-sm"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Sidenav
