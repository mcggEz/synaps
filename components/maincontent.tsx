import React from 'react'
import { useProjectStore } from '@/store/useMainStore'
const MainContent = () => {

    const { selectedProject } = useProjectStore()
  return (
   <>
      {selectedProject ? (
        <>
            <h1 className="text-3xl font-bold mb-4">Project:</h1>
          <h2 className="text-2xl font-bold"> {selectedProject.name}</h2>
            <p className="text-gray-500 mb-2">Project Details</p>
          <p className="text-gray-700">{selectedProject.description}</p>
          {/* Render more project-specific details here */}
        </>
      ) : (
        <p>Select a project to view details.</p>
      )}
  
</>
  )
}

export default MainContent
