// components/Layout.js
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Layout({ children }) {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/colors', label: 'All Colors', icon: '🎨' },
    { href: '/vote', label: 'Vote', icon: '🗳️' },
    { href: '/rankings', label: 'Rankings', icon: '🏆' },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">Shade Showdown</h1>
        </div>
        
        <nav className="mt-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-6 py-3 text-left w-full transition-colors ${
                pathname === item.href
                  ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-500'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 text-sm text-gray-500">
          <p>Built with Next.js</p>
          <p>& Supabase</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}