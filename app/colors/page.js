// app/colors/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function ColorsPage() {
  const [colors, setColors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchColors()
  }, [])

  async function fetchColors() {
    try {
      const { data, error } = await supabase
        .from('colors')
        .select('*')
        .order('name')
      
      if (error) throw error
      setColors(data || [])
    } catch (error) {
      console.error('Error fetching colors:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Loading colors...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        All Colors
      </h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {colors.map((color) => (
          <div
            key={color.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div
              className="h-24 w-full"
              style={{ backgroundColor: color.hex_code }}
            ></div>
            <div className="p-3">
              <h3 className="font-semibold text-gray-800">{color.name}</h3>
              <p className="text-sm text-gray-600">{color.hex_code}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <p className="text-gray-600">
          {colors.length} colors available for voting
        </p>
      </div>
    </div>
  )
}