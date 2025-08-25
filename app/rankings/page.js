// app/rankings/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { ratingAlgorithm } from '../../lib/rating-algorithm'
import Link from 'next/link'

export default function RankingsPage() {
  const [colorRankings, setColorRankings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRankings()
  }, [])

  async function fetchRankings() {
    try {
      // Get all colors with their ratings
      const { data: colors, error: colorsError } = await supabase
        .from('colors')
        .select('*')

      if (colorsError) throw colorsError

      // Get all individual votes to calculate stats
      const { data: individualVotes, error: votesError } = await supabase
        .from('individual_votes')
        .select('*')

      if (votesError) {
        // If individual_votes table doesn't exist yet, fall back to old system
        console.warn('individual_votes table not found, using old vote system')
        const { data: oldVotes, error: oldVotesError } = await supabase
          .from('votes')
          .select('*')
        
        if (oldVotesError) throw oldVotesError
        processOldVoteSystem(colors, oldVotes || [])
        return
      }

      // Process colors with new rating system
      const processedColors = colors.map(color => {
        // Get votes for this color
        const colorVotes = (individualVotes || []).filter(vote => vote.color_id === color.id)
        
        // Calculate vote counts
        const keepVotes = colorVotes.filter(vote => vote.vote_type === 'keep').length
        const tradeVotes = colorVotes.filter(vote => vote.vote_type === 'trade').length
        const cutVotes = colorVotes.filter(vote => vote.vote_type === 'cut').length
        const totalVotes = colorVotes.length
        
        // Use rating from database or base rating
        const rating = color.rating !== null ? color.rating : ratingAlgorithm.getBaseRating()
        const confidence = ratingAlgorithm.calculateConfidence(totalVotes)
        
        return {
          ...color,
          rating: Math.round(rating * 10) / 10, // Round to 1 decimal
          keepVotes,
          tradeVotes, 
          cutVotes,
          totalVotes,
          confidence: Math.round(confidence * 100)
        }
      })

      // Sort by rating (highest first)
      const rankings = processedColors.sort((a, b) => b.rating - a.rating)

      setColorRankings(rankings)
    } catch (error) {
      console.error('Error fetching rankings:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Fallback for old vote system
  function processOldVoteSystem(colors, votes) {
    const colorCounts = {}
    
    // Initialize all colors with 0 counts
    colors.forEach(color => {
      colorCounts[color.id] = {
        ...color,
        keepVotes: 0,
        tradeVotes: 0,
        cutVotes: 0,
        totalScore: 0,
        rating: ratingAlgorithm.getBaseRating(),
        totalVotes: 0,
        confidence: 0
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
        Colors ranked by individual votes using a 0-100 rating system
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

                    {/* Rating & Stats */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-2xl font-bold text-black mb-1">
                        {color.rating !== undefined ? color.rating : color.totalScore}
                        <span className="text-sm text-black/50 ml-1">
                          {color.rating !== undefined ? '/100' : 'pts'}
                        </span>
                      </div>
                      {color.confidence !== undefined && (
                        <div className="text-xs text-black/70 mb-2">{color.confidence}% confidence</div>
                      )}
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

                      {/* Rating */}
                      <div className="flex-shrink-0 text-right">
                        <div className="text-xl font-bold text-black">
                          {color.rating !== undefined ? color.rating : color.totalScore}
                          <span className="text-sm text-black/50">
                            {color.rating !== undefined ? '/100' : 'pts'}
                          </span>
                        </div>
                        {color.confidence !== undefined && (
                          <div className="text-xs text-black/70">{color.confidence}% conf.</div>
                        )}
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

  // Fallback: simulate new rating system from old votes
  function processOldVoteSystem(colors, votes) {
    console.log('Processing old vote system with new algorithm simulation...')
    
    const colorRatings = new Map()
    
    // Initialize all colors with base rating
    colors.forEach(color => {
      colorRatings.set(color.id, {
        ...color,
        rating: ratingAlgorithm.getBaseRating(),
        keepVotes: 0,
        tradeVotes: 0,
        cutVotes: 0,
        totalVotes: 0,
        totalScore: 0 // Keep for backward compatibility
      })
    })
    
    // Convert old votes to individual votes for processing
    const simulatedVotes = []
    votes.forEach(vote => {
      const timestamp = vote.created_at || new Date().toISOString()
      
      if (vote.color_keep) {
        simulatedVotes.push({
          color_id: vote.color_keep,
          vote_type: 'keep',
          created_at: timestamp
        })
      }
      if (vote.color_trade) {
        simulatedVotes.push({
          color_id: vote.color_trade,
          vote_type: 'trade',
          created_at: timestamp
        })
      }
      if (vote.color_cut) {
        simulatedVotes.push({
          color_id: vote.color_cut,
          vote_type: 'cut',
          created_at: timestamp
        })
      }
    })
    
    // Sort by timestamp and process chronologically
    simulatedVotes.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    
    simulatedVotes.forEach(vote => {
      const colorData = colorRatings.get(vote.color_id)
      if (!colorData) return
      
      // Update vote counts
      if (vote.vote_type === 'keep') colorData.keepVotes++
      else if (vote.vote_type === 'trade') colorData.tradeVotes++
      else if (vote.vote_type === 'cut') colorData.cutVotes++
      
      // Calculate new rating
      const oldRating = colorData.rating
      colorData.rating = ratingAlgorithm.calculateNewRating(
        oldRating,
        vote.vote_type,
        colorData.totalVotes
      )
      
      colorData.totalVotes++
      
      // Keep old scoring for compatibility
      if (vote.vote_type === 'keep') colorData.totalScore += 3
      else if (vote.vote_type === 'trade') colorData.totalScore += 1
    })
    
    // Add confidence calculation
    colorRatings.forEach(colorData => {
      colorData.confidence = Math.round(ratingAlgorithm.calculateConfidence(colorData.totalVotes) * 100)
    })
    
    // Convert to array and sort by rating
    const rankings = Array.from(colorRatings.values())
      .sort((a, b) => b.rating - a.rating)

    setColorRankings(rankings)
  }
}