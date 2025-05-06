'use client'

import React, { useState , useEffect} from 'react'
import { useUIStore } from '@/store/useUIStore'
import { useUserStore } from '@/store/useUserStore'
import { useProjectStore } from '@/store/useMainStore'

const Sidenav = () => {
  const { isSidebarOpen, toggleSidebar } = useUIStore()
  const { user } = useUserStore()

  const [showForm, setShowForm] = useState(false)
  const [projectData, setProjectData] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<any[]>([]) // Add state for projects


  useEffect(() => {
    console.log(user); // Log the user object to check if it's correctly populated
  
    if (user?.email) {
      const fetchProjects = async () => {
        try {
          const response = await fetch('/api/read-projects', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_email: user.email,
            }),
          });
  
          if (!response.ok) {
            const result = await response.json();
            setError(result?.error || 'Failed to load projects.');
            return;
          }
  
          const data = await response.json();
          setProjects(data);
        } catch (err) {
          setError('Unexpected error while fetching projects.');
        }
      };
  
      fetchProjects();
    }
  }, [user?.email]);
  

  const handleShowForm = () => setShowForm(true)
  const { setSelectedProject } = useProjectStore();

  const handleProjectClick = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
    } else {
      console.warn('Project not found:', projectId);
    }
  };

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
  // fetch posts from supabase



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

    
      </div>

      {/* fetch the projets from supabase  */}
        {/* Render the list of projects */}
        <div className="mb-4">
        <h3 className="text-lg font-semibold">Your Projects</h3>    <button onClick={toggleSidebar} className="text-gray-500 hover:text-black">
          ×
        </button>
        {projects.length === 0 ? (
          <p>No projects found.</p>
        ) : (
          <ul className="space-y-2">
            {projects.map((project) => (
              <li key={project.id} className="border-b py-2"
              onClick={() => handleProjectClick(project.id)}>
                <div className="font-semibold">{project.name}</div>
                <div className="text-sm text-gray-600">{project.description}</div>
              </li>
            ))}
          </ul>
        )}
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
