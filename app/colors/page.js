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
        <div className="text-2xl font-bold text-black">Loading colors...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-5xl font-bold mb-8 text-black text-center">
        All Colors
      </h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {colors.map((color) => (
          <div
            key={color.id}
            className="card-glassy hover:scale-105 transition-all duration-300"
          >
            <div
              className="h-24 w-full rounded-lg shadow-inner"
              style={{ backgroundColor: color.hex_code }}
            ></div>
            <div className="p-3">
              <h3 className="font-bold text-black text-lg">{color.name}</h3>
              <p className="text-sm text-black font-mono font-medium">{color.hex_code}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-black font-bold text-lg">
          {colors.length} colors available for voting
        </p>
      </div>
    </div>
  )
}