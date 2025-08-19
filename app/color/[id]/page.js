// app/color/[id]/page.js
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
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

      // Get all votes to calculate rankings
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('*')

      if (votesError) throw votesError

      // Get all colors to calculate rank
      const { data: allColors, error: allColorsError } = await supabase
        .from('colors')
        .select('*')

      if (allColorsError) throw allColorsError

      // Calculate vote counts for all colors
      const colorCounts = {}
      
      allColors.forEach(c => {
        colorCounts[c.id] = {
          ...c,
          keepVotes: 0,
          tradeVotes: 0,
          cutVotes: 0,
          totalScore: 0
        }
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

      // Sort all colors by score to find rank
      const sortedColors = Object.values(colorCounts)
        .sort((a, b) => b.totalScore - a.totalScore)

      // Find this color's rank and data
      const rank = sortedColors.findIndex(c => c.id == colorId) + 1
      const colorWithStats = colorCounts[colorId]
      
      setColorData({
        ...colorWithStats,
        rank: rank
      })

    } catch (error) {
      console.error('Error fetching color details:', error)
    } finally {
      setLoading(false)
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

          {/* Points Card */}
          <div className="card-glassy text-center p-8">
            <div className="mb-4 flex justify-center">
              <StarCircleIcon size={64} color="black" strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-bold text-black mb-2">{colorData.totalScore} Points</h2>
            <p className="text-black opacity-80">Total score earned</p>
          </div>
        </div>

        {/* Vote Breakdown */}
        <div className="card-glassy p-8">
          <h3 className="text-2xl font-bold text-black mb-6 text-center">Vote Breakdown</h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Keep Votes */}
            <div className="text-center p-6 bg-green-500/20 rounded-xl border border-green-500/30">
              <div className="mb-2 flex justify-center">
                <SecurityCheckIcon size={36} color="#16a34a" strokeWidth={2} />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-1">{colorData.keepVotes}</div>
              <div className="text-black font-semibold">Keep Votes</div>
              <div className="text-sm text-black opacity-70">3 pts each</div>
            </div>

            {/* Trade Votes */}
            <div className="text-center p-6 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
              <div className="mb-2 flex justify-center">
                <Exchange01Icon size={36} color="#ca8a04" strokeWidth={2} />
              </div>
              <div className="text-3xl font-bold text-yellow-600 mb-1">{colorData.tradeVotes}</div>
              <div className="text-black font-semibold">Trade Votes</div>
              <div className="text-sm text-black opacity-70">1 pt each</div>
            </div>

            {/* Cut Votes */}
            <div className="text-center p-6 bg-red-500/20 rounded-xl border border-red-500/30">
              <div className="mb-2 flex justify-center">
                <Cancel01Icon size={36} color="#dc2626" strokeWidth={2} />
              </div>
              <div className="text-3xl font-bold text-red-600 mb-1">{colorData.cutVotes}</div>
              <div className="text-black font-semibold">Cut Votes</div>
              <div className="text-sm text-black opacity-70">0 pts each</div>
            </div>
          </div>
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