'use client'
import React, {  useState } from 'react'

import LogoutButton from './LogoutButton'
import { useUserStore } from '@/store/useUserStore'
import { useUIStore } from '@/store/useUIStore'
import Link from 'next/link'

const Navbar = () => {
  const [openProfile, setOpenProfile] = useState(false)
  const toggleChatbot = useUIStore((state) => state.toggleChatbot)


  const { user} = useUserStore()



  return (
    <nav className="w-full px-6 py-4 flex items-center justify-between shadow-md bg-white text-black relative">
      <Link href="/dashboard">
        <div className="text-2xl font-bold tracking-wide">synaps</div>
      </Link>

      <div className="flex items-center gap-4 relative">
        <input
          type="text"
          placeholder="Search..."
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="relative">
          <button
            onClick={() => setOpenProfile((prev) => !prev)}
            className="flex items-center gap-2 focus:outline-none"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Profile"
                className="w-8 h-8 rounded-full border border-gray-300 object-cover"
              />
            ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold">
                    {user?.email?.charAt(0).toUpperCase()}
                </div>
            )}
          </button>

          {openProfile && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
              <ul className="py-2 text-sm text-gray-700">
                <li>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 transition-colors duration-150"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/account"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 transition-colors duration-150"
                  >
                    Account
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 transition-colors duration-150"
                  >
                    Settings
                  </Link>
                </li>
                <li>
                  <LogoutButton />
                </li>
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={toggleChatbot}
          className="cursor-pointer hover:underline text-sm text-gray-600"
        >
          <p>C</p>
        </button>
      </div>
    </nav>
  )
}

export default Navbar
