// test-rating-algorithm.js
// Simple test to verify the new rating algorithm works as expected

const { RatingAlgorithm } = require('./lib/rating-algorithm.js')

const algorithm = new RatingAlgorithm()

function testAlgorithm() {
  console.log('Testing New Rating Algorithm')
  console.log('============================')
  
  // Test 1: Basic functionality
  console.log('\n1. Basic Rating Calculation:')
  let rating = algorithm.getBaseRating()
  console.log(`Starting rating: ${rating}`)
  
  rating = algorithm.calculateNewRating(rating, 'keep', 1)
  console.log(`After 1 keep vote: ${rating.toFixed(2)}`)
  
  rating = algorithm.calculateNewRating(rating, 'trade', 2)
  console.log(`After 1 trade vote: ${rating.toFixed(2)}`)
  
  rating = algorithm.calculateNewRating(rating, 'cut', 3)
  console.log(`After 1 cut vote: ${rating.toFixed(2)}`)
  
  // Test 2: Diminishing returns for high ratings
  console.log('\n2. Diminishing Returns (High Rating):')
  let highRating = 80
  console.log(`High rating (${highRating}) + keep vote:`)
  const normalImpact = algorithm.calculateNewRating(50, 'keep', 10) - 50
  const diminishedImpact = algorithm.calculateNewRating(highRating, 'keep', 10) - highRating
  console.log(`Normal impact at rating 50: +${normalImpact.toFixed(2)}`)
  console.log(`Diminished impact at rating 80: +${diminishedImpact.toFixed(2)}`)
  
  // Test 3: Diminishing returns for low ratings
  console.log('\n3. Diminishing Returns (Low Rating):')
  let lowRating = 20
  console.log(`Low rating (${lowRating}) + cut vote:`)
  const normalCutImpact = algorithm.calculateNewRating(50, 'cut', 10) - 50
  const diminishedCutImpact = algorithm.calculateNewRating(lowRating, 'cut', 10) - lowRating
  console.log(`Normal impact at rating 50: ${normalCutImpact.toFixed(2)}`)
  console.log(`Diminished impact at rating 20: ${diminishedCutImpact.toFixed(2)}`)
  
  // Test 4: Confidence scaling
  console.log('\n4. Confidence Scaling:')
  const votesWith1Vote = algorithm.calculateNewRating(50, 'keep', 1) - 50
  const votesWith10Votes = algorithm.calculateNewRating(50, 'keep', 10) - 50
  const votesWith20Votes = algorithm.calculateNewRating(50, 'keep', 20) - 50
  console.log(`Impact with 1 vote: +${votesWith1Vote.toFixed(2)}`)
  console.log(`Impact with 10 votes: +${votesWith10Votes.toFixed(2)}`)
  console.log(`Impact with 20+ votes: +${votesWith20Votes.toFixed(2)}`)
  
  // Test 5: Rating bounds
  console.log('\n5. Rating Bounds:')
  let testRating = 95
  for (let i = 0; i < 10; i++) {
    testRating = algorithm.calculateNewRating(testRating, 'keep', 20)
  }
  console.log(`After 10 keep votes on rating 95: ${testRating.toFixed(2)} (should not exceed 100)`)
  
  testRating = 5
  for (let i = 0; i < 10; i++) {
    testRating = algorithm.calculateNewRating(testRating, 'cut', 20)
  }
  console.log(`After 10 cut votes on rating 5: ${testRating.toFixed(2)} (should not go below 0)`)
  
  // Test 6: Simulation
  console.log('\n6. Vote Sequence Simulation:')
  const voteSequence = ['keep', 'keep', 'trade', 'keep', 'cut', 'keep', 'trade', 'keep']
  const progression = algorithm.simulateRatingProgression(voteSequence)
  
  console.log('Vote progression:')
  voteSequence.forEach((vote, i) => {
    console.log(`  ${i + 1}. ${vote.padEnd(5)} -> ${progression[i + 1].toFixed(2)}`)
  })
  
  // Test 7: Vote impact values
  console.log('\n7. Vote Impact Values:')
  console.log(`Keep: +${algorithm.VOTE_IMPACTS.keep}`)
  console.log(`Trade: ${algorithm.VOTE_IMPACTS.trade}`)
  console.log(`Cut: ${algorithm.VOTE_IMPACTS.cut}`)
  
  console.log('\n✅ All tests completed!')
}

if (require.main === module) {
  testAlgorithm()
}

module.exports = { testAlgorithm }