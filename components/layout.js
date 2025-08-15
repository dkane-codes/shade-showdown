// components/Layout.js
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useBackground } from '../lib/background-context'

export default function Layout({ children }) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { currentBackground, getHomeBackground, getColorsBackground, getDefaultVotingBackground } = useBackground()

  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/colors', label: 'All Colors', icon: '🎨' },
    { href: '/vote', label: 'Vote', icon: '🗳️' },
    { href: '/rankings', label: 'Rankings', icon: '🏆' },
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
        className="fixed top-4 left-4 z-50 md:hidden bg-white/20 backdrop-blur-md w-12 h-12 rounded-full shadow-lg border border-white/30 flex items-center justify-center"
      >
        <span className="text-2xl">☰</span>
      </button>
      
      {/* Left Sidebar - positioned absolutely over background */}
      <div className={`
        absolute left-0 top-0 w-64 h-[calc(100%-32px)] bg-white/10 backdrop-blur-md shadow-2xl rounded-r-3xl mt-4 mr-4 mb-4
        transition-transform duration-300 ease-in-out z-40
        md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-black">Shade Showdown</h1>
        </div>
        
        <nav className="mt-6">
          {navItems.map((item) => (
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
              <span className="text-xl mr-3 text-black">{item.icon}</span>
              <span className="font-bold">{item.label}</span>
            </Link>
          ))}
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
      <div className="ml-0 md:ml-72 overflow-auto transition-all duration-300">
        {children}
      </div>
    </div>
  )
}