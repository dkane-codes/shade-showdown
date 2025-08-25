// app/vote/page.js
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useBackground } from '../../lib/background-context'
import { ratingAlgorithm } from '../../lib/rating-algorithm'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import { EffectCoverflow } from 'swiper/modules'
import Link from 'next/link'
import { NoteIcon, PaintBoardIcon, Award01Icon, CheckmarkBadge03Icon } from 'hugeicons-react'

export default function VotePage() {
  const [colors, setColors] = useState([])
  const [currentSet, setCurrentSet] = useState([])
  const [votes, setVotes] = useState({ keep: null, trade: null, cut: null })
  const [votedSets, setVotedSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeIndex, setActiveIndex] = useState(1) // Center card is focused by default
  const [popup, setPopup] = useState({ isOpen: false, message: '', type: 'success', keptColorId: null })
  const { updateBackground } = useBackground()
  const [swiperInstance, setSwiperInstance] = useState(null)

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
      generateSimilarRankingSet(data || [])
    } catch (error) {
      console.error('Error fetching colors:', error)
    } finally {
      setLoading(false)
    }
  }

  function generateSimilarRankingSet(allColors) {
    if (allColors.length < 3) return
    
    // Get colors with their ratings, defaulting to base rating if not set
    const colorsWithRatings = allColors.map(color => ({
      ...color,
      effectiveRating: color.rating || ratingAlgorithm.getBaseRating()
    }))
    
    // Sort by rating to group similar colors
    const sortedColors = colorsWithRatings.sort((a, b) => b.effectiveRating - a.effectiveRating)
    
    // Find available colors not in recent sets
    const recentColorIds = new Set(votedSets.flat())
    const availableColors = sortedColors.filter(color => !recentColorIds.has(color.id))
    
    // If we don't have enough available colors, reset the voted sets
    if (availableColors.length < 3) {
      setVotedSets([])
      return generateSimilarRankingSet(allColors)
    }
    
    // Group colors into rating tiers
    const ratingTiers = groupColorsByRatingTiers(availableColors)
    
    // Select a tier with at least 3 colors, preferring middle tiers
    const selectedTier = selectOptimalTier(ratingTiers)
    
    if (selectedTier.length >= 3) {
      // Pick 3 random colors from the selected tier
      const shuffledTier = [...selectedTier].sort(() => 0.5 - Math.random())
      const newSet = shuffledTier.slice(0, 3)
      
      setCurrentSet(newSet)
      setVotes({ keep: null, trade: null, cut: null })
      setActiveIndex(1)
      
      // Track this set to avoid repeating too soon
      const setIds = newSet.map(c => c.id)
      setVotedSets(prev => [...prev, setIds].slice(-10)) // Keep last 10 sets
      
      updateSetBackground(newSet)
    } else {
      // Fallback to random selection if no good tiers found
      const shuffled = [...availableColors].sort(() => 0.5 - Math.random())
      const newSet = shuffled.slice(0, 3)
      setCurrentSet(newSet)
      setVotes({ keep: null, trade: null, cut: null })
      setActiveIndex(1)
      updateSetBackground(newSet)
    }
  }
  
  function groupColorsByRatingTiers(colors) {
    const tiers = []
    const tierSize = 10 // Rating points per tier
    
    // Group colors into rating ranges
    const tierMap = new Map()
    
    colors.forEach(color => {
      const tierKey = Math.floor(color.effectiveRating / tierSize) * tierSize
      if (!tierMap.has(tierKey)) {
        tierMap.set(tierKey, [])
      }
      tierMap.get(tierKey).push(color)
    })
    
    return Array.from(tierMap.values()).filter(tier => tier.length >= 3)
  }
  
  function selectOptimalTier(tiers) {
    if (tiers.length === 0) return []
    
    // Prefer middle-tier colors for more competitive matchups
    // Sort tiers by average rating and pick from middle ranges
    const tiersWithAverage = tiers.map(tier => ({
      tier,
      averageRating: tier.reduce((sum, color) => sum + color.effectiveRating, 0) / tier.length
    }))
    
    tiersWithAverage.sort((a, b) => b.averageRating - a.averageRating)
    
    // Prefer tiers that are not at the extremes (avoid always top or bottom)
    const middleIndex = Math.floor(tiersWithAverage.length / 2)
    const startIndex = Math.max(0, middleIndex - 1)
    const endIndex = Math.min(tiersWithAverage.length, middleIndex + 2)
    
    const candidateTiers = tiersWithAverage.slice(startIndex, endIndex)
    const selectedTierData = candidateTiers[Math.floor(Math.random() * candidateTiers.length)]
    
    return selectedTierData ? selectedTierData.tier : tiers[0]
  }
  
  function updateSetBackground(colorSet) {
    if (colorSet.length === 3 && !loading) {
      const [color1, color2, color3] = colorSet
      const newGradient = `linear-gradient(135deg, ${color1.hex_code} 0%, ${color2.hex_code} 50%, ${color3.hex_code} 100%)`
      updateBackground('voting', newGradient)
    }
  }

  // Update background when loading completes and we have colors
  useEffect(() => {
    if (!loading && currentSet.length === 3) {
      updateSetBackground(currentSet)
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
      showPopup('Please select Keep, Trade, and Cut for all three colors!', 'error')
      return
    }

    // Validate that all vote IDs are different
    const voteIds = [votes.keep, votes.trade, votes.cut]
    if (new Set(voteIds).size !== 3) {
      showPopup('Please select different colors for Keep, Trade, and Cut!', 'error')
      return
    }
    
    // Validate that vote IDs exist in current set
    const currentSetIds = currentSet.map(c => c.id)
    const invalidVotes = voteIds.filter(id => !currentSetIds.includes(id))
    if (invalidVotes.length > 0) {
      console.error('Invalid vote IDs:', invalidVotes, 'Current set IDs:', currentSetIds)
      showPopup('Error: Invalid color selection. Please refresh and try again.', 'error')
      return
    }

    setSubmitting(true)
    
    try {
      // First, try to submit individual votes (new system)
      const individualVotes = [
        { color_id: votes.keep, vote_type: 'keep', created_at: new Date().toISOString() },
        { color_id: votes.trade, vote_type: 'trade', created_at: new Date().toISOString() },
        { color_id: votes.cut, vote_type: 'cut', created_at: new Date().toISOString() }
      ]
      
      const { error: voteError } = await supabase
        .from('individual_votes')
        .insert(individualVotes)
      
      if (voteError) {
        // If individual_votes table doesn't exist, fall back to old system
        console.log('individual_votes table not found, falling back to old vote system')
        
        const { error: oldVoteError } = await supabase
          .from('votes')
          .insert([{
            color_keep: votes.keep,
            color_trade: votes.trade,
            color_cut: votes.cut,
            category_id: null
          }])
        
        if (oldVoteError) {
          console.error('Database error details:', oldVoteError)
          throw new Error(`Database error: ${oldVoteError.message || 'Unknown error'}`)
        }
        
      } else {
        // Update ratings for all three colors using new system
        await updateColorRatings([votes.keep, votes.trade, votes.cut])
      }
      
      const keptColorId = votes.keep // Store before resetting
      generateSimilarRankingSet(colors)
      showPopup('Votes submitted! Here\'s your next set.', 'success', keptColorId)
      
    } catch (error) {
      console.error('Error submitting votes:', {
        error: error.message,
        details: error,
        votes: votes
      })
      showPopup(`Error submitting votes: ${error.message || 'Please try again.'}`, 'error')
    } finally {
      setSubmitting(false)
    }
  }
  
  async function updateColorRatings(colorIds) {
    
    for (const colorId of colorIds) {
      try {
        // Get current color data
        const { data: colorData, error: colorError } = await supabase
          .from('colors')
          .select('*')
          .eq('id', colorId)
          .single()
        
        if (colorError) continue
        
        // Get all votes for this color
        const { data: allVotes, error: votesError } = await supabase
          .from('individual_votes')
          .select('*')
          .eq('color_id', colorId)
          .order('created_at', { ascending: true })
        
        if (votesError) continue
        
        if (!allVotes || allVotes.length === 0) continue
        
        // Calculate new rating by processing all votes chronologically
        let currentRating = ratingAlgorithm.getBaseRating()
        
        allVotes.forEach((vote, index) => {
          currentRating = ratingAlgorithm.calculateNewRating(
            currentRating,
            vote.vote_type,
            index
          )
        })
        
        // Update the color's rating
        const { error: updateError } = await supabase
          .from('colors')
          .update({ 
            rating: Math.round(currentRating * 100) / 100, // Round to 2 decimal places
            total_votes: allVotes.length,
            updated_at: new Date().toISOString()
          })
          .eq('id', colorId)
        
        if (updateError) {
          console.error(`Error updating color ${colorId} rating:`, updateError)
        }
          
      } catch (error) {
        console.error(`Error updating rating for color ${colorId}:`, error)
      }
    }
  }


  const showPopup = (message, type = 'success', keptColorId = null) => {
    setPopup({ isOpen: true, message, type, keptColorId })
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
      <h1 className="text-3xl md:text-5xl font-bold mb-4 text-black text-center">
        Vote on Colors
      </h1>
      <p className="text-black mb-6 md:mb-8 text-center font-medium text-lg md:text-xl">
        Choose: Keep one, Trade one, Cut one (similar-ranked colors)
      </p>

      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-8 mb-8">
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
              <p className="text-black text-center mb-2 font-mono font-medium">{color.hex_code}</p>
              
              {/* Rating Display */}
              <div className="text-center mb-4">
                <div className="text-sm text-black/70">Rating: {Math.round(color.rating || ratingAlgorithm.getBaseRating())}/100</div>
                {color.total_votes && (
                  <div className="text-xs text-black/60">
                    {color.total_votes} votes • {Math.round(ratingAlgorithm.calculateConfidence(color.total_votes) * 100)}% conf
                  </div>
                )}
              </div>
              
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


      {/* Mobile/Tablet Swiper Layout */}
      <div className="lg:hidden mb-8 -mx-8 -my-4 py-4">
        <Swiper
          effect="coverflow"
          grabCursor={true}
          centeredSlides={true}
          slidesPerView="auto"
          initialSlide={1}
          coverflowEffect={{
            rotate: 0,
            stretch: 0,
            depth: 100,
            modifier: 2,
            slideShadows: false,
          }}
          modules={[EffectCoverflow]}
          className="h-[28rem] !overflow-visible px-8"
          onSwiper={setSwiperInstance}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        >
          {currentSet.map((color, index) => (
            <SwiperSlide key={color.id} className="w-[65vw] max-w-[250px]">
              <div 
                className="card-glassy h-full mx-4 cursor-pointer" 
                onClick={() => {
                  if (swiperInstance && index !== activeIndex) {
                    swiperInstance.slideTo(index)
                  }
                }}
              >
                <div
                  className="h-32 w-full rounded-lg shadow-inner mb-3"
                  style={{ backgroundColor: color.hex_code }}
                ></div>
                
                <div className="px-4 pt-2 pb-2">
                  <h3 className="text-lg font-bold mb-1 text-center text-black">{color.name}</h3>
                  <p className="text-black text-center mb-2 font-mono text-sm">{color.hex_code}</p>
                  
                  {/* Rating Display */}
                  <div className="text-center mb-3">
                    <div className="text-xs text-black/70">Rating: {Math.round(color.rating || ratingAlgorithm.getBaseRating())}/100</div>
                    {color.total_votes && (
                      <div className="text-xs text-black/60">{color.total_votes}v • {Math.round(ratingAlgorithm.calculateConfidence(color.total_votes) * 100)}%</div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => handleVote(color.id, 'keep')}
                      className={`w-full py-2 px-3 rounded-lg font-bold transition-all duration-200 text-sm ${
                        votes.keep === color.id
                          ? 'bg-green-500 text-white shadow-lg scale-105'
                          : 'bg-white/10 backdrop-blur-md text-green-700 hover:bg-white/20 border border-green-500/30'
                      }`}
                    >
                      Keep
                    </button>
                    
                    <button
                      onClick={() => handleVote(color.id, 'trade')}
                      className={`w-full py-2 px-3 rounded-lg font-bold transition-all duration-200 text-sm ${
                        votes.trade === color.id
                          ? 'bg-yellow-500 text-white shadow-lg scale-105'
                          : 'bg-white/10 backdrop-blur-md text-yellow-700 hover:bg-white/20 border border-yellow-500/30'
                      }`}
                    >
                      Trade
                    </button>
                    
                    <button
                      onClick={() => handleVote(color.id, 'cut')}
                      className={`w-full py-2 px-3 rounded-lg font-bold transition-all duration-200 text-sm ${
                        votes.cut === color.id
                          ? 'bg-red-500 text-white shadow-lg scale-105'
                          : 'bg-white/10 backdrop-blur-md text-red-700 hover:bg-white/20 border border-red-500/30'
                      }`}
                    >
                      Cut
                    </button>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        
        {/* Navigation dots for mobile */}
        <div className="flex justify-center space-x-2 mt-4">
          {currentSet.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (swiperInstance) {
                  swiperInstance.slideTo(index)
                }
              }}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === activeIndex 
                  ? 'bg-white shadow-lg' 
                  : 'bg-white/40'
              }`}
            />
          ))}
        </div>
        
        {/* Drag instruction */}
        <p className="text-center text-black/70 text-sm mt-2">
          Drag left or right to view other colors
        </p>
      </div>

      {/* Submit Votes Button */}
      <div className="text-center mb-8">
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
        
        {/* Skip Set Button */}
        <div className="mt-4">
          <button
            onClick={() => generateSimilarRankingSet(colors)}
            disabled={submitting}
            className="px-6 py-2 rounded-lg font-medium transition-all duration-200 bg-white/10 backdrop-blur-md text-black hover:bg-white/20 border border-white/30 hover:scale-105 text-sm"
          >
            Skip This Set
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      {votedSets.length > 0 && (
        <div className="text-center text-black/70">
          <p>You've voted on {votedSets.length} set{votedSets.length !== 1 ? 's' : ''} of similar-ranked colors</p>
        </div>
      )}

      {/* Popup Modal */}
      {popup.isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setPopup({ isOpen: false, message: '', type: 'success' })}
          />
          
          {/* Popup */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 
                          bg-white/20 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 
                          p-6 w-[80vw] max-w-sm transition-all duration-300">
            <div className="text-center">
              <div className={`mb-4 flex justify-center`}>
                {popup.type === 'success' ? (
                  <CheckmarkBadge03Icon size={48} color="black" strokeWidth={2} />
                ) : (
                  <div className="text-4xl">⚠️</div>
                )}
              </div>
              <p className="text-black font-medium text-lg mb-6">
                {popup.message}
              </p>
              
              {popup.type === 'success' ? (
                // Success popup with three action buttons
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setPopup({ isOpen: false, message: '', type: 'success', keptColorId: null })
                      // Continue voting - just closes popup
                    }}
                    className="btn-primary w-full flex items-center justify-center"
                  >
                    <NoteIcon size={20} color="white" strokeWidth={2} className="mr-3" />
                    Continue Voting
                  </button>
                  {popup.keptColorId && (
                    <Link
                      href={`/color/${popup.keptColorId}`}
                      onClick={() => setPopup({ isOpen: false, message: '', type: 'success', keptColorId: null })}
                      className="btn-secondary w-full flex items-center justify-center py-4"
                    >
                      <PaintBoardIcon size={20} color="black" strokeWidth={2} className="mr-3" />
                      View Your Keep Color
                    </Link>
                  )}
                  <Link
                    href="/rankings"
                    onClick={() => setPopup({ isOpen: false, message: '', type: 'success', keptColorId: null })}
                    className="btn-secondary w-full flex items-center justify-center py-4"
                  >
                    <Award01Icon size={20} color="black" strokeWidth={2} className="mr-3" />
                    View Rankings
                  </Link>
                </div>
              ) : (
                // Error popup with just dismiss button
                <button
                  onClick={() => setPopup({ isOpen: false, message: '', type: 'success', keptColorId: null })}
                  className="btn-primary"
                >
                  Got it!
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}