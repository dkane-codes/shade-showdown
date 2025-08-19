// app/vote/page.js
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useBackground } from '../../lib/background-context'
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
    setActiveIndex(1) // Always reset to center card
    
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


  const showPopup = (message, type = 'success', keptColorId = null) => {
    setPopup({ isOpen: true, message, type, keptColorId })
  }

  async function submitVotes() {
    if (!votes.keep || !votes.trade || !votes.cut) {
      showPopup('Please select Keep, Trade, and Cut for all three colors!', 'error')
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

      const keptColorId = votes.keep // Store before resetting
      generateRandomSet(colors)
      showPopup('Vote submitted! Here\'s your next set.', 'success', keptColorId)
      
    } catch (error) {
      console.error('Error submitting vote:', error)
      showPopup('Error submitting vote. Please try again.', 'error')
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
      <h1 className="text-3xl md:text-5xl font-bold mb-4 text-black text-center">
        Vote on Colors
      </h1>
      <p className="text-black mb-6 md:mb-8 text-center font-medium text-lg md:text-xl">
        Choose: Keep one, Trade one, Cut one
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
          className="h-[24rem] !overflow-visible px-8"
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
                
                <div className="px-4 pt-2 pb-0">
                  <h3 className="text-lg font-bold mb-1 text-center text-black">{color.name}</h3>
                  <p className="text-black text-center mb-3 font-mono text-sm">{color.hex_code}</p>
                  
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
                      // Vote again - just closes popup to continue voting
                    }}
                    className="btn-primary w-full flex items-center justify-center"
                  >
                    <NoteIcon size={20} color="white" strokeWidth={2} className="mr-3" />
                    Vote Again
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
                  onClick={() => setPopup({ isOpen: false, message: '', type: 'success' })}
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