// test-color-selection.js
// Test the new ranking-based color selection algorithm

const { RatingAlgorithm } = require('./lib/rating-algorithm.js')

const algorithm = new RatingAlgorithm()

// Sample colors with various ratings
const sampleColors = [
  { id: 1, name: 'Crimson Red', hex_code: '#DC143C', rating: 85.3, total_votes: 45 },
  { id: 2, name: 'Ocean Blue', hex_code: '#0066CC', rating: 82.1, total_votes: 38 },
  { id: 3, name: 'Forest Green', hex_code: '#228B22', rating: 79.8, total_votes: 42 },
  { id: 4, name: 'Royal Purple', hex_code: '#7B68EE', rating: 76.2, total_votes: 29 },
  { id: 5, name: 'Sunset Orange', hex_code: '#FF6600', rating: 73.5, total_votes: 33 },
  { id: 6, name: 'Golden Yellow', hex_code: '#FFD700', rating: 68.9, total_votes: 27 },
  { id: 7, name: 'Sky Blue', hex_code: '#87CEEB', rating: 65.4, total_votes: 31 },
  { id: 8, name: 'Mint Green', hex_code: '#98FB98', rating: 61.7, total_votes: 24 },
  { id: 9, name: 'Coral Pink', hex_code: '#FF7F50', rating: 58.3, total_votes: 28 },
  { id: 10, name: 'Lavender', hex_code: '#E6E6FA', rating: 54.8, total_votes: 22 },
  { id: 11, name: 'Peach', hex_code: '#FFCBA4', rating: 51.2, total_votes: 19 },
  { id: 12, name: 'Sage Green', hex_code: '#9CAF88', rating: 47.9, total_votes: 25 },
  { id: 13, name: 'Dusty Rose', hex_code: '#DCAE96', rating: 44.1, total_votes: 21 },
  { id: 14, name: 'Steel Blue', hex_code: '#4682B4', rating: 40.6, total_votes: 18 },
  { id: 15, name: 'Muted Purple', hex_code: '#9370DB', rating: 36.8, total_votes: 16 }
]

// Simulate the selection algorithms from the voting page
function groupColorsByRatingTiers(colors) {
  const tierSize = 10 // Rating points per tier
  const tierMap = new Map()
  
  colors.forEach(color => {
    const effectiveRating = color.rating || algorithm.getBaseRating()
    const tierKey = Math.floor(effectiveRating / tierSize) * tierSize
    if (!tierMap.has(tierKey)) {
      tierMap.set(tierKey, [])
    }
    tierMap.get(tierKey).push({...color, effectiveRating})
  })
  
  return Array.from(tierMap.values()).filter(tier => tier.length >= 3)
}

function selectOptimalTier(tiers) {
  if (tiers.length === 0) return []
  
  const tiersWithAverage = tiers.map(tier => ({
    tier,
    averageRating: tier.reduce((sum, color) => sum + color.effectiveRating, 0) / tier.length
  }))
  
  tiersWithAverage.sort((a, b) => b.averageRating - a.averageRating)
  
  // Prefer tiers that are not at the extremes
  const middleIndex = Math.floor(tiersWithAverage.length / 2)
  const startIndex = Math.max(0, middleIndex - 1)
  const endIndex = Math.min(tiersWithAverage.length, middleIndex + 2)
  
  const candidateTiers = tiersWithAverage.slice(startIndex, endIndex)
  const selectedTierData = candidateTiers[Math.floor(Math.random() * candidateTiers.length)]
  
  return selectedTierData ? selectedTierData.tier : tiers[0]
}

function generateSimilarRankingSet(allColors, votedSets = []) {
  // Get colors with their ratings
  const colorsWithRatings = allColors.map(color => ({
    ...color,
    effectiveRating: color.rating || algorithm.getBaseRating()
  }))
  
  // Sort by rating
  const sortedColors = colorsWithRatings.sort((a, b) => b.effectiveRating - a.effectiveRating)
  
  // Find available colors not in recent sets
  const recentColorIds = new Set(votedSets.flat())
  const availableColors = sortedColors.filter(color => !recentColorIds.has(color.id))
  
  // Group colors into rating tiers
  const ratingTiers = groupColorsByRatingTiers(availableColors)
  
  // Select a tier with at least 3 colors
  const selectedTier = selectOptimalTier(ratingTiers)
  
  if (selectedTier.length >= 3) {
    // Pick 3 random colors from the selected tier
    const shuffledTier = [...selectedTier].sort(() => 0.5 - Math.random())
    return shuffledTier.slice(0, 3)
  } else {
    // Fallback to random selection
    const shuffled = [...availableColors].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, 3)
  }
}

function testColorSelection() {
  console.log('🎨 Testing Color Selection Algorithm')
  console.log('=====================================')
  
  // Show all colors grouped by rating
  console.log('\n1. All Colors by Rating:')
  const sortedColors = sampleColors.sort((a, b) => b.rating - a.rating)
  sortedColors.forEach((color, index) => {
    const tier = Math.floor(color.rating / 10) * 10
    console.log(`   ${(index + 1).toString().padStart(2)}. ${color.name.padEnd(15)} | ${color.rating.toFixed(1)}/100 | Tier: ${tier}-${tier+9}`)
  })
  
  // Show how colors are grouped into tiers
  console.log('\n2. Rating Tiers:')
  const allTiers = groupColorsByRatingTiers(sampleColors)
  allTiers.forEach(tier => {
    const averageRating = tier.reduce((sum, color) => sum + color.effectiveRating, 0) / tier.length
    const tierRange = `${Math.floor(averageRating / 10) * 10}-${Math.floor(averageRating / 10) * 10 + 9}`
    console.log(`   Tier ${tierRange}: ${tier.length} colors (avg: ${averageRating.toFixed(1)})`)
    tier.forEach(color => {
      console.log(`     • ${color.name} (${color.rating.toFixed(1)})`)
    })
  })
  
  // Generate several sets to show variety and similarity
  console.log('\n3. Generated Color Sets:')
  const votedSets = []
  
  for (let i = 1; i <= 5; i++) {
    const selectedSet = generateSimilarRankingSet(sampleColors, votedSets)
    
    if (selectedSet.length === 3) {
      const setIds = selectedSet.map(c => c.id)
      votedSets.push(setIds)
      
      const averageRating = selectedSet.reduce((sum, color) => sum + color.effectiveRating, 0) / 3
      const ratingRange = Math.max(...selectedSet.map(c => c.effectiveRating)) - Math.min(...selectedSet.map(c => c.effectiveRating))
      
      console.log(`   Set ${i}: (Avg: ${averageRating.toFixed(1)}, Range: ${ratingRange.toFixed(1)})`)
      selectedSet.forEach((color, index) => {
        const confidence = Math.round(algorithm.calculateConfidence(color.total_votes) * 100)
        console.log(`     ${index + 1}. ${color.name.padEnd(15)} | ${color.rating.toFixed(1)}/100 | ${confidence}% conf`)
      })
      console.log('')
    }
  }
  
  // Test with voted sets to show avoidance
  console.log('4. Testing Recent Set Avoidance:')
  console.log('   Previously voted sets:', votedSets)
  
  const nextSet = generateSimilarRankingSet(sampleColors, votedSets)
  console.log('   Next set avoids recent colors:')
  nextSet.forEach((color, index) => {
    const wasRecentlyVoted = votedSets.flat().includes(color.id) ? '⚠️' : '✅'
    console.log(`     ${index + 1}. ${color.name} ${wasRecentlyVoted}`)
  })
  
  // Test edge cases
  console.log('\n5. Edge Case Testing:')
  
  // Test with limited colors
  const limitedColors = sampleColors.slice(0, 5)
  const limitedSet = generateSimilarRankingSet(limitedColors, [])
  console.log(`   With only ${limitedColors.length} colors:`)
  limitedSet.forEach((color, index) => {
    console.log(`     ${index + 1}. ${color.name} (${color.rating.toFixed(1)})`)
  })
  
  // Test with mostly voted colors
  const heavyVotedSets = sampleColors.slice(0, 12).map(c => [c.id])
  const remainingSet = generateSimilarRankingSet(sampleColors, heavyVotedSets)
  console.log(`\n   After voting on most colors (${heavyVotedSets.length} sets):`)
  remainingSet.forEach((color, index) => {
    console.log(`     ${index + 1}. ${color.name} (${color.rating.toFixed(1)})`)
  })
  
  console.log('\n✅ Color selection testing completed!')
  console.log('\n📈 Benefits of New System:')
  console.log('   • Colors in each set are closer in rating (competitive matchups)')
  console.log('   • Avoids recently voted sets for variety')
  console.log('   • Prefers middle-tier colors over extreme high/low ratings')
  console.log('   • Fallback to random selection when needed')
  console.log('   • Shows ratings to help users understand competitiveness')
}

if (require.main === module) {
  testColorSelection()
}

module.exports = { testColorSelection }