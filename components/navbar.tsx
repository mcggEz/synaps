'use client'
import React, { useState } from 'react'
import LogoutButton from './LogoutButton'
import { useUserStore } from '@/store/useUserStore'
import { useUIStore } from '@/store/useUIStore'
import Link from 'next/link'
import { Menu } from 'lucide-react'

const Navbar = () => {
  const [openProfile, setOpenProfile] = useState(false)
  const toggleChatbot = useUIStore((state) => state.toggleChatbot)
  const { user } = useUserStore()
  const { toggleSidebar } = useUIStore()

  return (
    <nav className="fixed top-0 left-0 right-0 w-full px-6 py-3 flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-white to-gray-50 text-black z-50">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 mr-2 text-gray-600 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 md:hidden"
        >
          <Menu className="w-6 h-6" />
          <span className="sr-only">Toggle sidebar</span>
        </button>
        <Link href="/dashboard">
          <div className="text-xl font-bold tracking-tight text-black hover:text-gray-700 transition-all duration-300">synaps</div>
        </Link>
      </div>

      <div className="flex items-center gap-1 relative">
        <div className="relative">
          <button
            onClick={() => setOpenProfile((prev) => !prev)}
            className="flex items-center gap-2 focus:outline-none hover:bg-gray-100 p-1 rounded-lg transition-colors duration-200"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Profile"
                className="w-8 h-8 rounded-full border border-gray-200 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                {user?.isGuest ? 'G' : user?.email?.charAt(0).toUpperCase()}
              </div>
            )}
          </button>

          {openProfile && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
              <div className="p-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  {user?.isGuest ? 'Guest User' : user?.email}
                </p>
              </div>
              <ul className="py-1">
                <li>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                  >
                    Dashboard
                  </Link>
                </li>
                {!user?.isGuest && (
                  <li>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                    >
                      Settings
                    </Link>
                  </li>
                )}
                <li className="border-t border-gray-100">
                  <LogoutButton />
                </li>
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={toggleChatbot}
          className="cursor-pointer hover:bg-gray-100 p-2 rounded-md transition-colors duration-200 relative bg-white border border-gray-200"
          aria-label="Toggle Chatbot"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            fill="none"
            className="w-6 h-6 text-gray-700"
          >
            <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2" fill="white" />
            <circle cx="11" cy="16" r="2" fill="currentColor" />
            <circle cx="21" cy="12" r="2" fill="currentColor" />
            <circle cx="21" cy="20" r="2" fill="currentColor" />
            <line x1="12.5" y1="16" x2="19" y2="12.8" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12.5" y1="16" x2="19" y2="19.2" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
    </nav>
  )
}

export default Navbar
