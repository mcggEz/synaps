'use client'
import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar'
import { useUserStore } from '@/store/useUserStore'
import { deleteAccount } from '@/app/actions'

const Settings = () => {
  const user = useUserStore((state) => state.user)
  const [showModal, setShowModal] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const CONFIRMATION_PHRASE = 'delete-my-account'

  const handleDeactivateAccount = async () => {
    if (confirmationText !== CONFIRMATION_PHRASE || !user?.id) return

    try {
      setIsDeleting(true)
      setError(null)
      
      const result = await deleteAccount(user.id)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      // Clear local storage and redirect
      localStorage.clear()
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete account')
    } finally {
      setIsDeleting(false)
      setShowModal(false)
      setConfirmationText('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="divide-y divide-gray-200">
              {/* Account Section */}
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-24 text-sm font-medium text-gray-500">Email</div>
                    <div className="text-sm text-gray-900">
                      {user?.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="p-6">
                <h2 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-red-800">Deactivate Account</h3>
                      <p className="text-sm text-red-600 mt-1">
                        Permanently deactivate your account and remove all your data
                      </p>
                    </div>
                    <button
                      onClick={() => setShowModal(true)}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Deactivate Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div 
            ref={modalRef}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative shadow-2xl transform transition-all"
          >
            {/* Close button */}
            <button
              onClick={() => {
                setShowModal(false)
                setConfirmationText('')
                setError(null)
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="pr-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Deactivate Account</h2>
              <p className="text-gray-600 mb-4">
                Are you sure you want to deactivate your account? This action cannot be undone.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                To confirm, please type <span className="font-mono bg-gray-100 px-2 py-1 rounded">delete-my-account</span> below:
              </p>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type delete-my-account"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowModal(false)
                  setConfirmationText('')
                  setError(null)
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivateAccount}
                disabled={confirmationText !== CONFIRMATION_PHRASE || isDeleting}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                  confirmationText === CONFIRMATION_PHRASE && !isDeleting
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    : 'bg-red-400 cursor-not-allowed'
                }`}
              >
                {isDeleting ? 'Deleting...' : 'Deactivate Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings