// app/color/[id]/page.js
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { ratingAlgorithm } from '../../../lib/rating-algorithm'
import Link from 'next/link'
import { ArrowLeft01Icon, Award01Icon, StarCircleIcon, SecurityCheckIcon, Exchange01Icon, Cancel01Icon, NoteIcon } from 'hugeicons-react'

export default function ColorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [colorData, setColorData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchColorDetails(params.id)
    }
  }, [params.id])

  async function fetchColorDetails(colorId) {
    try {
      // Get the specific color
      const { data: color, error: colorError } = await supabase
        .from('colors')
        .select('*')
        .eq('id', colorId)
        .single()

      if (colorError) throw colorError

      // Get individual votes for this color
      const { data: individualVotes, error: votesError } = await supabase
        .from('individual_votes')
        .select('*')
        .eq('color_id', colorId)

      if (votesError) {
        // Fallback to old vote system if individual_votes doesn't exist
        console.warn('individual_votes table not found, using old system for color details')
        return await fetchColorDetailsOldSystem(colorId)
      }

      // Get all colors to calculate rank
      const { data: allColors, error: allColorsError } = await supabase
        .from('colors')
        .select('*')

      if (allColorsError) throw allColorsError

      // Calculate vote counts for this color
      const keepVotes = individualVotes.filter(vote => vote.vote_type === 'keep').length
      const tradeVotes = individualVotes.filter(vote => vote.vote_type === 'trade').length
      const cutVotes = individualVotes.filter(vote => vote.vote_type === 'cut').length
      const totalVotes = individualVotes.length

      // Sort all colors by rating to find rank
      const sortedColors = allColors
        .map(c => ({ ...c, effectiveRating: c.rating || ratingAlgorithm.getBaseRating() }))
        .sort((a, b) => b.effectiveRating - a.effectiveRating)

      // Find this color's rank
      const rank = sortedColors.findIndex(c => c.id == colorId) + 1
      
      const rating = color.rating || ratingAlgorithm.getBaseRating()
      const confidence = ratingAlgorithm.calculateConfidence(totalVotes)
      
      setColorData({
        ...color,
        rank,
        rating: Math.round(rating * 10) / 10,
        keepVotes,
        tradeVotes,
        cutVotes,
        totalVotes,
        confidence: Math.round(confidence * 100)
      })

    } catch (error) {
      console.error('Error fetching color details:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fallback for old vote system
  async function fetchColorDetailsOldSystem(colorId) {
    try {
      const { data: color, error: colorError } = await supabase
        .from('colors')
        .select('*')
        .eq('id', colorId)
        .single()

      if (colorError) throw colorError

      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('*')

      if (votesError) throw votesError

      const { data: allColors, error: allColorsError } = await supabase
        .from('colors')
        .select('*')

      if (allColorsError) throw allColorsError

      // Calculate using old system
      const colorCounts = {}
      allColors.forEach(c => {
        colorCounts[c.id] = { ...c, keepVotes: 0, tradeVotes: 0, cutVotes: 0, totalScore: 0 }
      })

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
        }
      })

      const sortedColors = Object.values(colorCounts).sort((a, b) => b.totalScore - a.totalScore)
      const rank = sortedColors.findIndex(c => c.id == colorId) + 1
      const colorWithStats = colorCounts[colorId]
      
      setColorData({ ...colorWithStats, rank, isOldSystem: true })
    } catch (error) {
      console.error('Error fetching old system color details:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-2xl font-bold text-black">Loading color details...</div>
      </div>
    )
  }

  if (!colorData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <div className="text-2xl font-bold text-black mb-4">Color not found</div>
          <Link href="/rankings" className="btn-primary">
            Back to Rankings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 min-h-screen">
      {/* Back Button */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="fixed top-4 left-4 z-50 bg-white/10 backdrop-blur-md w-12 h-12 rounded-full shadow-2xl hover:shadow-black/30 border border-white/30 flex items-center justify-center transition-all duration-200 text-black hover:bg-white/20"
        >
          <ArrowLeft01Icon size={24} color="black" strokeWidth={3} />
        </button>
      </div>

      {/* Color Display */}
      <div className="max-w-4xl mx-auto">
        {/* Large Color Preview */}
        <div className="text-center mb-8">
          <div 
            className="w-64 h-64 md:w-80 md:h-80 rounded-3xl shadow-2xl mx-auto mb-6 border-4 border-white/30"
            style={{ backgroundColor: colorData.hex_code }}
          ></div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-black">
            {colorData.name}
          </h1>
          
          <p className="text-2xl md:text-3xl font-mono text-black opacity-80 mb-2">
            {colorData.hex_code}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Rank Card */}
          <div className="card-glassy text-center p-8">
            <div className="mb-4 flex justify-center">
              <Award01Icon size={64} color="black" strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-bold text-black mb-2">Rank #{colorData.rank}</h2>
            <p className="text-black opacity-80">Out of all colors</p>
          </div>

          {/* Rating Card */}
          <div className="card-glassy text-center p-8">
            <div className="mb-4 flex justify-center">
              <StarCircleIcon size={64} color="black" strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-bold text-black mb-2">
              {colorData.isOldSystem ? `${colorData.totalScore} Points` : `${colorData.rating}/100`}
            </h2>
            <p className="text-black opacity-80">
              {colorData.isOldSystem ? 'Total score earned' : 'Current Rating'}
            </p>
            {!colorData.isOldSystem && colorData.confidence && (
              <p className="text-sm text-black opacity-60 mt-1">{colorData.confidence}% confidence</p>
            )}
          </div>
        </div>

        {/* Vote Breakdown */}
        <div className="card-glassy p-8">
          <h3 className="text-2xl font-bold text-black mb-2 text-center">Vote Breakdown</h3>
          <p className="text-center text-black opacity-70 mb-6">
            {colorData.isOldSystem ? 
              'Based on old point system' : 
              `Total: ${colorData.totalVotes || 0} votes using new rating system`
            }
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Keep Votes */}
            <div className="text-center p-6 bg-green-500/20 rounded-xl border border-green-500/30">
              <div className="mb-2 flex justify-center">
                <SecurityCheckIcon size={36} color="#16a34a" strokeWidth={2} />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-1">{colorData.keepVotes || 0}</div>
              <div className="text-black font-semibold">Keep Votes</div>
              <div className="text-sm text-black opacity-70">
                {colorData.isOldSystem ? '3 pts each' : '+1.0 rating impact'}
              </div>
            </div>

            {/* Trade Votes */}
            <div className="text-center p-6 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
              <div className="mb-2 flex justify-center">
                <Exchange01Icon size={36} color="#ca8a04" strokeWidth={2} />
              </div>
              <div className="text-3xl font-bold text-yellow-600 mb-1">{colorData.tradeVotes || 0}</div>
              <div className="text-black font-semibold">Trade Votes</div>
              <div className="text-sm text-black opacity-70">
                {colorData.isOldSystem ? '1 pt each' : '-0.3 rating impact'}
              </div>
            </div>

            {/* Cut Votes */}
            <div className="text-center p-6 bg-red-500/20 rounded-xl border border-red-500/30">
              <div className="mb-2 flex justify-center">
                <Cancel01Icon size={36} color="#dc2626" strokeWidth={2} />
              </div>
              <div className="text-3xl font-bold text-red-600 mb-1">{colorData.cutVotes || 0}</div>
              <div className="text-black font-semibold">Cut Votes</div>
              <div className="text-sm text-black opacity-70">
                {colorData.isOldSystem ? '0 pts each' : '-1.0 rating impact'}
              </div>
            </div>
          </div>
          
          {!colorData.isOldSystem && (
            <div className="mt-6 text-center text-sm text-black opacity-60">
              <p>Rating system uses diminishing returns and confidence scaling</p>
              <p>Based on chronological vote processing with K-factor of 2.0</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mt-8">
          <Link href="/vote" className="btn-primary flex items-center">
            <NoteIcon size={16} color="white" strokeWidth={2} className="mr-2" />
            Vote on Colors
          </Link>
          <Link href="/rankings" className="btn-secondary flex items-center">
            <Award01Icon size={16} color="black" strokeWidth={2} className="mr-2" />
            View All Rankings
          </Link>
        </div>
      </div>
    </div>
  )
}