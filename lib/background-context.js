'use client'

import { createContext, useContext, useState, useCallback } from 'react'

const BackgroundContext = createContext()

export function BackgroundProvider({ children }) {
  const [currentBackground, setCurrentBackground] = useState({
    type: 'default', // 'default' for black/gray/white, 'voting' for color-based
    gradient: 'linear-gradient(135deg, #666666 0%, #999999 50%, #cccccc 100%)'
  })

  const updateBackground = useCallback((type, gradient) => {
    setCurrentBackground({ type, gradient })
  }, [])

  const getHomeBackground = useCallback(() => {
    return 'linear-gradient(135deg, #666666 0%, #999999 50%, #cccccc 100%)'
  }, [])

  const getColorsBackground = useCallback(() => {
    return 'linear-gradient(135deg, #777777 0%, #aaaaaa 50%, #dddddd 100%)'
  }, [])

  const getDefaultVotingBackground = useCallback(() => {
    return 'var(--gradient-primary)'
  }, [])

  return (
    <BackgroundContext.Provider value={{ 
      currentBackground, 
      updateBackground, 
      getHomeBackground, 
      getColorsBackground,
      getDefaultVotingBackground
    }}>
      {children}
    </BackgroundContext.Provider>
  )
}

export function useBackground() {
  const context = useContext(BackgroundContext)
  if (!context) {
    throw new Error('useBackground must be used within a BackgroundProvider')
  }
  return context
}
