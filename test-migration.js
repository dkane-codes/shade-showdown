// test-migration.js
// Test script to simulate migration with sample data

const { RatingAlgorithm } = require('./lib/rating-algorithm.js')

const algorithm = new RatingAlgorithm()

// Sample data to simulate existing votes
const sampleColors = [
  { id: 1, name: 'Ocean Blue', hex_code: '#0066CC' },
  { id: 2, name: 'Sunset Orange', hex_code: '#FF6600' },
  { id: 3, name: 'Forest Green', hex_code: '#228B22' },
  { id: 4, name: 'Royal Purple', hex_code: '#7B68EE' },
  { id: 5, name: 'Cherry Red', hex_code: '#DC143C' }
]

const sampleOldVotes = [
  { id: 1, color_keep: 1, color_trade: 2, color_cut: 3, created_at: '2024-01-01T10:00:00Z' },
  { id: 2, color_keep: 1, color_trade: 4, color_cut: 5, created_at: '2024-01-01T11:00:00Z' },
  { id: 3, color_keep: 2, color_trade: 3, color_cut: 4, created_at: '2024-01-01T12:00:00Z' },
  { id: 4, color_keep: 1, color_trade: 5, color_cut: 2, created_at: '2024-01-01T13:00:00Z' },
  { id: 5, color_keep: 3, color_trade: 1, color_cut: 4, created_at: '2024-01-01T14:00:00Z' },
  { id: 6, color_keep: 1, color_trade: 3, color_cut: 5, created_at: '2024-01-01T15:00:00Z' },
  { id: 7, color_keep: 2, color_trade: 4, color_cut: 1, created_at: '2024-01-01T16:00:00Z' },
  { id: 8, color_keep: 3, color_trade: 2, color_cut: 5, created_at: '2024-01-01T17:00:00Z' },
]

function simulateMigration() {
  console.log('🧪 Testing Migration with Sample Data')
  console.log('=====================================')
  
  // Step 1: Convert old votes to individual votes
  console.log('\n1. Converting old votes to individual votes:')
  
  const individualVotes = []
  const sortedOldVotes = sampleOldVotes.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  
  sortedOldVotes.forEach((vote, index) => {
    const baseTime = new Date(vote.created_at)
    
    if (vote.color_keep) {
      individualVotes.push({
        color_id: vote.color_keep,
        vote_type: 'keep',
        created_at: new Date(baseTime.getTime() + (index * 3000)).toISOString()
      })
    }
    if (vote.color_trade) {
      individualVotes.push({
        color_id: vote.color_trade,
        vote_type: 'trade',
        created_at: new Date(baseTime.getTime() + (index * 3000) + 1000).toISOString()
      })
    }
    if (vote.color_cut) {
      individualVotes.push({
        color_id: vote.color_cut,
        vote_type: 'cut',
        created_at: new Date(baseTime.getTime() + (index * 3000) + 2000).toISOString()
      })
    }
  })
  
  console.log(`   Converted ${sampleOldVotes.length} old votes into ${individualVotes.length} individual votes`)
  
  // Step 2: Process votes chronologically
  console.log('\n2. Processing votes chronologically:')
  
  const colorRatings = new Map()
  
  // Initialize colors with base rating
  sampleColors.forEach(color => {
    colorRatings.set(color.id, {
      ...color,
      rating: algorithm.getBaseRating(),
      votes: []
    })
  })
  
  // Sort all votes by timestamp
  const sortedVotes = individualVotes.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  
  console.log('   Processing each vote:')
  sortedVotes.forEach((vote, index) => {
    const colorData = colorRatings.get(vote.color_id)
    if (!colorData) return
    
    colorData.votes.push(vote)
    
    const oldRating = colorData.rating
    colorData.rating = algorithm.calculateNewRating(
      oldRating,
      vote.vote_type,
      colorData.votes.length - 1
    )
    
    const change = colorData.rating - oldRating
    console.log(`   ${(index + 1).toString().padStart(2)}. ${colorData.name.padEnd(15)} ${vote.vote_type.padEnd(5)} -> ${colorData.rating.toFixed(1).padStart(5)} (${change > 0 ? '+' : ''}${change.toFixed(1)})`)
  })
  
  // Step 3: Generate final results
  console.log('\n3. Final Results:')
  
  const finalResults = Array.from(colorRatings.values()).map(color => {
    const keepVotes = color.votes.filter(v => v.vote_type === 'keep').length
    const tradeVotes = color.votes.filter(v => v.vote_type === 'trade').length  
    const cutVotes = color.votes.filter(v => v.vote_type === 'cut').length
    const confidence = Math.round(algorithm.calculateConfidence(color.votes.length) * 100)
    
    return {
      ...color,
      keepVotes,
      tradeVotes,
      cutVotes,
      totalVotes: color.votes.length,
      confidence
    }
  }).sort((a, b) => b.rating - a.rating)
  
  console.log('   Rank | Color           | Rating | Confidence | K | T | C')
  console.log('   -----|-----------------|--------|------------|---|---|---')
  
  finalResults.forEach((color, index) => {
    console.log(`   ${(index + 1).toString().padStart(4)} | ${color.name.padEnd(15)} | ${color.rating.toFixed(1).padStart(6)} | ${color.confidence.toString().padStart(9)}% | ${color.keepVotes} | ${color.tradeVotes} | ${color.cutVotes}`)
  })
  
  // Step 4: Compare with old system
  console.log('\n4. Comparison with Old Point System:')
  
  const oldSystemResults = sampleColors.map(color => {
    let keepVotes = 0, tradeVotes = 0, cutVotes = 0
    
    sampleOldVotes.forEach(vote => {
      if (vote.color_keep === color.id) keepVotes++
      if (vote.color_trade === color.id) tradeVotes++
      if (vote.color_cut === color.id) cutVotes++
    })
    
    const totalScore = (keepVotes * 3) + (tradeVotes * 1) + (cutVotes * 0)
    
    return { ...color, keepVotes, tradeVotes, cutVotes, totalScore }
  }).sort((a, b) => b.totalScore - a.totalScore)
  
  console.log('   Old System (Points):')
  console.log('   Rank | Color           | Points | K | T | C')
  console.log('   -----|-----------------|--------|---|---|---')
  
  oldSystemResults.forEach((color, index) => {
    console.log(`   ${(index + 1).toString().padStart(4)} | ${color.name.padEnd(15)} | ${color.totalScore.toString().padStart(6)} | ${color.keepVotes} | ${color.tradeVotes} | ${color.cutVotes}`)
  })
  
  // Summary
  console.log('\n5. Summary:')
  console.log(`   ✓ Successfully processed ${sampleOldVotes.length} original votes`)
  console.log(`   ✓ Created ${individualVotes.length} individual votes`) 
  console.log(`   ✓ Updated ${sampleColors.length} color ratings`)
  console.log(`   ✓ Top color (new): ${finalResults[0].name} (${finalResults[0].rating.toFixed(1)}/100)`)
  console.log(`   ✓ Top color (old): ${oldSystemResults[0].name} (${oldSystemResults[0].totalScore} pts)`)
  
  const rankingChanges = finalResults.map((newResult, newIndex) => {
    const oldIndex = oldSystemResults.findIndex(old => old.id === newResult.id)
    return {
      name: newResult.name,
      oldRank: oldIndex + 1,
      newRank: newIndex + 1,
      change: oldIndex - newIndex
    }
  }).filter(item => item.change !== 0)
  
  if (rankingChanges.length > 0) {
    console.log('\n   📊 Ranking Changes:')
    rankingChanges.forEach(change => {
      const direction = change.change > 0 ? '↑' : '↓'
      console.log(`   ${direction} ${change.name}: ${change.oldRank} -> ${change.newRank} (${Math.abs(change.change)} positions)`)
    })
  }
  
  console.log('\n✅ Migration test completed successfully!')
}

if (require.main === module) {
  simulateMigration()
}

module.exports = { simulateMigration }