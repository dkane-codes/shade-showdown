// app/rankings/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function RankingsPage() {
  const [colorRankings, setColorRankings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRankings()
  }, [])

  async function fetchRankings() {
    try {
      // First get all colors
      const { data: colors, error: colorsError } = await supabase
        .from('colors')
        .select('*')

      if (colorsError) throw colorsError

      // Then get all votes
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('*')

      if (votesError) throw votesError

      // Calculate vote counts for each color
      const colorCounts = {}
      
      // Initialize all colors with 0 counts
      colors.forEach(color => {
        colorCounts[color.id] = {
          ...color,
          keepVotes: 0,
          tradeVotes: 0,
          cutVotes: 0,
          totalScore: 0
        }
      })

      // Count votes (Keep = 3 points, Trade = 1 point, Cut = 0 points)
      votes.forEach(vote => {
        if (colorCounts[vote.color_keep]) {
          colorCounts[vote.color_keep].keepVotes += 1
          colorCounts[vote.color_keep].totalScore += 3
        }
        if (colorCounts[vote.color_trade]) {
          colorCounts[vote.color_trade].tradeVotes += 1
          colorCounts[vote.color_trade].totalScore += 1
        }
        if (colorCounts[vote.color_cut]) {
          colorCounts[vote.color_cut].cutVotes += 1
          // Cut votes add 0 points
        }
      })

      // Convert to array and sort by total score
      const rankings = Object.values(colorCounts)
        .sort((a, b) => b.totalScore - a.totalScore)

      setColorRankings(rankings)
    } catch (error) {
      console.error('Error fetching rankings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-2xl font-bold text-black">Loading rankings...</div>
      </div>
    )
  }

  return (
    <div className="p-8 min-h-screen">
      <h1 className="text-3xl md:text-5xl font-bold mb-6 text-black text-center">
        Color Rankings
      </h1>
      <p className="text-black mb-8 text-center font-medium text-lg">
        Colors ranked by total votes (Keep = 3pts, Trade = 1pt, Cut = 0pts)
      </p>

      <div className="max-w-4xl mx-auto">
        {colorRankings.length === 0 ? (
          <div className="text-center card-glassy p-12">
            <div className="text-4xl mb-4">🗳️</div>
            <h3 className="text-xl font-bold mb-2 text-black">No votes yet!</h3>
            <p className="text-black">Be the first to vote on colors to see rankings.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {colorRankings.map((color, index) => (
              <Link key={color.id} href={`/color/${color.id}`} className="block">
                <div className="card-glassy p-4 md:p-6 hover:scale-102 transition-all duration-200 cursor-pointer mb-4">
                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-center gap-4">
                    {/* Rank Number */}
                    <div className="flex-shrink-0 w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-black">#{index + 1}</span>
                    </div>

                    {/* Color Square */}
                    <div 
                      className="flex-shrink-0 w-16 h-16 rounded-lg shadow-lg border-2 border-white/30"
                      style={{ backgroundColor: color.hex_code }}
                    ></div>

                    {/* Color Info */}
                    <div className="flex-grow">
                      <h3 className="text-xl font-bold text-black mb-1">{color.name}</h3>
                      <p className="text-black font-mono text-sm opacity-80">{color.hex_code}</p>
                    </div>

                    {/* Vote Counts */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-2xl font-bold text-black mb-1">{color.totalScore} pts</div>
                      <div className="text-sm flex gap-2 justify-end">
                        <span className="bg-green-500/20 backdrop-blur-sm px-2 py-1 rounded-full text-black font-semibold border border-green-500/30">{color.keepVotes} Keep</span>
                        <span className="bg-yellow-500/20 backdrop-blur-sm px-2 py-1 rounded-full text-black font-semibold border border-yellow-500/30">{color.tradeVotes} Trade</span>
                        <span className="bg-red-500/20 backdrop-blur-sm px-2 py-1 rounded-full text-black font-semibold border border-red-500/30">{color.cutVotes} Cut</span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden">
                    <div className="flex items-center gap-3 mb-3">
                      {/* Rank Number */}
                      <div className="flex-shrink-0 w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-black">#{index + 1}</span>
                      </div>

                      {/* Color Square */}
                      <div 
                        className="flex-shrink-0 w-12 h-12 rounded-lg shadow-lg border-2 border-white/30"
                        style={{ backgroundColor: color.hex_code }}
                      ></div>

                      {/* Color Info */}
                      <div className="flex-grow">
                        <h3 className="text-lg font-bold text-black mb-1">{color.name}</h3>
                        <p className="text-black font-mono text-xs opacity-80">{color.hex_code}</p>
                      </div>

                      {/* Points */}
                      <div className="flex-shrink-0 text-right">
                        <div className="text-xl font-bold text-black">{color.totalScore} pts</div>
                      </div>
                    </div>

                    {/* Vote Stats - Wrapped on separate line for mobile */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      <span className="bg-green-500/20 backdrop-blur-sm px-2 py-1 rounded-full text-black font-semibold border border-green-500/30 text-sm">{color.keepVotes} Keep</span>
                      <span className="bg-yellow-500/20 backdrop-blur-sm px-2 py-1 rounded-full text-black font-semibold border border-yellow-500/30 text-sm">{color.tradeVotes} Trade</span>
                      <span className="bg-red-500/20 backdrop-blur-sm px-2 py-1 rounded-full text-black font-semibold border border-red-500/30 text-sm">{color.cutVotes} Cut</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}