// app/vote/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function VotePage() {
  const [colors, setColors] = useState([])
  const [currentSet, setCurrentSet] = useState([])
  const [votes, setVotes] = useState({ keep: null, trade: null, cut: null })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchColorsAndGenerateSet()
  }, [])

  async function fetchColorsAndGenerateSet() {
    try {
      const { data, error } = await supabase
        .from('colors')
        .select('*')
      
      if (error) throw error
      
      setColors(data || [])
      generateRandomSet(data || [])
    } catch (error) {
      console.error('Error fetching colors:', error)
    } finally {
      setLoading(false)
    }
  }

  function generateRandomSet(allColors) {
    if (allColors.length < 3) return
    
    const shuffled = [...allColors].sort(() => 0.5 - Math.random())
    setCurrentSet(shuffled.slice(0, 3))
    setVotes({ keep: null, trade: null, cut: null })
  }

  function handleVote(colorId, action) {
    setVotes(prev => {
      const newVotes = { ...prev }
      
      // If this color already has this action, remove it (toggle off)
      if (newVotes[action] === colorId) {
        newVotes[action] = null
        return newVotes
      }
      
      // Remove this action from any other color that might have it
      newVotes[action] = colorId
      
      // Remove any other actions this color might have
      Object.keys(newVotes).forEach(key => {
        if (key !== action && newVotes[key] === colorId) {
          newVotes[key] = null
        }
      })
      
      return newVotes
    })
  }

  async function submitVotes() {
    if (!votes.keep || !votes.trade || !votes.cut) {
      alert('Please select Keep, Trade, and Cut for all three colors!')
      return
    }

    setSubmitting(true)
    
    try {
      const { error } = await supabase
        .from('votes')
        .insert([{
          color_keep: votes.keep,
          color_trade: votes.trade,
          color_cut: votes.cut,
          category_id: null
        }])

      if (error) throw error

      generateRandomSet(colors)
      alert('Vote submitted! Here\'s your next set.')
      
    } catch (error) {
      console.error('Error submitting vote:', error)
      alert('Error submitting vote. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Loading voting interface...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">
        Vote on Colors
      </h1>
      <p className="text-gray-600 mb-8">
        Choose: Keep one, Trade one, Cut one
      </p>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {currentSet.map((color) => (
          <div key={color.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div
              className="h-48 w-full"
              style={{ backgroundColor: color.hex_code }}
            ></div>
            
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2 text-center">{color.name}</h3>
              <p className="text-gray-600 text-center mb-4">{color.hex_code}</p>
              
              <div className="space-y-2">
                <button
                  onClick={() => handleVote(color.id, 'keep')}
                  className={`w-full py-2 px-4 rounded font-semibold transition-colors ${
                    votes.keep === color.id
                      ? 'bg-green-500 text-white'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  Keep
                </button>
                
                <button
                  onClick={() => handleVote(color.id, 'trade')}
                  className={`w-full py-2 px-4 rounded font-semibold transition-colors ${
                    votes.trade === color.id
                      ? 'bg-yellow-500 text-white'
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }`}
                >
                  Trade
                </button>
                
                <button
                  onClick={() => handleVote(color.id, 'cut')}
                  className={`w-full py-2 px-4 rounded font-semibold transition-colors ${
                    votes.cut === color.id
                      ? 'bg-red-500 text-white'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  Cut
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={submitVotes}
          disabled={submitting || !votes.keep || !votes.trade || !votes.cut}
          className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Submitting...' : 'Submit Votes'}
        </button>
      </div>
    </div>
  )
}