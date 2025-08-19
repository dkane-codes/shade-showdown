// components/Layout.js
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useBackground } from '../lib/background-context'
import { Menu04Icon, Home07Icon, PaintBoardIcon, NoteIcon, Award01Icon } from 'hugeicons-react'

export default function Layout({ children }) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { currentBackground, getHomeBackground, getColorsBackground, getDefaultVotingBackground } = useBackground()

  const navItems = [
    { href: '/', label: 'Home', icon: Home07Icon },
    { href: '/colors', label: 'All Colors', icon: PaintBoardIcon },
    { href: '/vote', label: 'Vote', icon: NoteIcon },
    { href: '/rankings', label: 'Rankings', icon: Award01Icon },
  ]

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  // Determine background based on current page and background state
  const getCurrentBackground = () => {
    if (pathname === '/vote') {
      // If we're on the vote page, use the current voting background or show gray gradient
      if (currentBackground.type === 'voting') {
        return currentBackground.gradient
      }
      // Show gray gradient until colors are loaded
      return getHomeBackground()
    }
    
    if (currentBackground.type === 'voting') {
      return currentBackground.gradient
    }
    
    if (pathname === '/') {
      return getHomeBackground()
    }
    
    if (pathname === '/colors') {
      return getColorsBackground()
    }
    
    return currentBackground.gradient
  }

  return (
    <div className="relative min-h-screen">
      {/* Full-width background gradient */}
      <div 
        className="absolute inset-0 -z-10 transition-all duration-1000"
        style={{ background: getCurrentBackground() }}
      ></div>
      
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 right-4 z-50 md:hidden bg-white/10 backdrop-blur-md w-12 h-12 rounded-full shadow-2xl hover:shadow-black/30 border border-white/30 flex items-center justify-center transition-all duration-200 text-black hover:bg-white/20"
      >
        <Menu04Icon size={24} color="black" strokeWidth={3} />
      </button>
      
      {/* Left Sidebar - positioned fixed for proper scroll behavior */}
      <div className={`
        fixed left-0 top-0 w-64 h-[calc(100vh-32px)] bg-white/10 backdrop-blur-md shadow-2xl drop-shadow-2xl rounded-r-3xl mt-4 mr-4 mb-4
        transition-transform duration-300 ease-in-out z-60
        md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-black">Shade Showdown</h1>
        </div>
        
        <nav className="mt-6">
          {navItems.map((item) => {
            const IconComponent = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center px-6 py-3 text-left w-full transition-all duration-200 ${
                  pathname === item.href
                    ? 'bg-white/30 backdrop-blur-md text-black shadow-lg'
                    : 'text-black hover:bg-white/20 hover:text-black'
                }`}
              >
                {typeof IconComponent === 'string' ? (
                  <span className="text-xl mr-3 text-black">{IconComponent}</span>
                ) : (
                  <IconComponent size={20} color="black" strokeWidth={2} className="mr-3" />
                )}
                <span className="font-bold">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content - with left margin to account for sidebar */}
      <div className="ml-0 md:ml-72 overflow-auto transition-all duration-300 pt-8 md:pt-0">
        {children}
      </div>
    </div>
  )
}