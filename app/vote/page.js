// app/vote/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useBackground } from '../../lib/background-context'

export default function VotePage() {
  const [colors, setColors] = useState([])
  const [currentSet, setCurrentSet] = useState([])
  const [votes, setVotes] = useState({ keep: null, trade: null, cut: null })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { updateBackground } = useBackground()

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
    const newSet = shuffled.slice(0, 3)
    setCurrentSet(newSet)
    setVotes({ keep: null, trade: null, cut: null })
    
    // Only update background after loading is complete to prevent flash
    if (newSet.length === 3 && !loading) {
      const [color1, color2, color3] = newSet
      const newGradient = `linear-gradient(135deg, ${color1.hex_code} 0%, ${color2.hex_code} 50%, ${color3.hex_code} 100%)`
      updateBackground('voting', newGradient)
    }
  }

  // Update background when loading completes and we have colors
  useEffect(() => {
    if (!loading && currentSet.length === 3) {
      const [color1, color2, color3] = currentSet
      const newGradient = `linear-gradient(135deg, ${color1.hex_code} 0%, ${color2.hex_code} 50%, ${color3.hex_code} 100%)`
      updateBackground('voting', newGradient)
    }
  }, [loading, currentSet, updateBackground])

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

  // Create dynamic background gradient from current colors
  const getDynamicBackground = () => {
    if (currentSet.length === 3) {
      const [color1, color2, color3] = currentSet
      return `linear-gradient(135deg, ${color1.hex_code} 0%, ${color2.hex_code} 50%, ${color3.hex_code} 100%)`
    }
    return 'var(--gradient-primary)' // fallback
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-2xl font-bold text-black">Loading voting interface...</div>
      </div>
    )
  }

  return (
    <div className="p-8 min-h-screen">
      <h1 className="text-5xl font-bold mb-4 text-black text-center">
        Vote on Colors
      </h1>
      <p className="text-black mb-8 text-center font-medium text-xl">
        Choose: Keep one, Trade one, Cut one
      </p>

      <div className="grid md:grid-cols-3 gap-8 mb-8">
        {currentSet.map((color) => (
          <div 
            key={color.id} 
            className="card-glassy hover:scale-105 transition-all duration-300"
          >
            <div
              className="h-48 w-full rounded-lg shadow-inner"
              style={{ backgroundColor: color.hex_code }}
            ></div>
            
            <div className="p-4">
              <h3 className="text-xl font-bold mb-2 text-center text-black">{color.name}</h3>
              <p className="text-black text-center mb-4 font-mono font-medium">{color.hex_code}</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleVote(color.id, 'keep')}
                  className={`w-full py-3 px-4 rounded-lg font-bold transition-all duration-200 ${
                    votes.keep === color.id
                      ? 'bg-green-500 text-white shadow-lg scale-105'
                      : 'bg-white/10 backdrop-blur-md text-green-700 hover:bg-white/20 hover:scale-105 border border-green-500/30'
                  }`}
                >
                  Keep
                </button>
                
                <button
                  onClick={() => handleVote(color.id, 'trade')}
                  className={`w-full py-3 px-4 rounded-lg font-bold transition-all duration-200 ${
                    votes.trade === color.id
                      ? 'bg-yellow-500 text-white shadow-lg scale-105'
                      : 'bg-white/10 backdrop-blur-md text-yellow-700 hover:bg-white/20 hover:scale-105 border border-yellow-500/30'
                  }`}
                >
                  Trade
                </button>
                
                <button
                  onClick={() => handleVote(color.id, 'cut')}
                  className={`w-full py-3 px-4 rounded-lg font-bold transition-all duration-200 ${
                    votes.cut === color.id
                      ? 'bg-red-500 text-white shadow-lg scale-105'
                      : 'bg-white/10 backdrop-blur-md text-red-700 hover:bg-white/20 hover:scale-105 border border-red-500/30'
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
          className={`px-8 py-3 rounded-lg font-bold transition-all duration-200 ${
            submitting || !votes.keep || !votes.trade || !votes.cut
              ? 'bg-white/10 backdrop-blur-md text-gray-400 cursor-not-allowed border border-gray-400/30'
              : 'btn-primary'
          }`}
        >
          {submitting ? 'Submitting...' : 'Submit Votes'}
        </button>
      </div>
    </div>
  )
}