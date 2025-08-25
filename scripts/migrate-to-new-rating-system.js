// scripts/migrate-to-new-rating-system.js
// Script to migrate from old voting system to new individual rating system

const { createClient } = require('@supabase/supabase-js')

// Try to load environment variables from .env.local (Next.js style)
const fs = require('fs')
const path = require('path')

function loadEnvLocal() {
  const envLocalPath = path.join(__dirname, '..', '.env.local')
  
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf8')
    const lines = envContent.split('\n')
    
    lines.forEach(line => {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '') // Remove quotes
          process.env[key] = value
        }
      }
    })
    
    console.log('Loaded environment variables from .env.local')
  } else {
    console.log('.env.local file not found, using system environment variables')
  }
}

loadEnvLocal()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING')
  console.error('\nPlease set these environment variables or create a .env.local file with:')
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Import the rating algorithm
const { ratingAlgorithm } = require('../lib/rating-algorithm.js')

async function migrate() {
  try {
    console.log('Starting migration to new rating system...')

    // Step 1: Create individual_votes table if it doesn't exist
    console.log('Creating individual_votes table...')
    
    // This would need to be done in Supabase dashboard or with service role key
    // For now, we'll document the SQL needed:
    console.log(`
Please run this SQL in your Supabase dashboard:

-- Create individual_votes table
CREATE TABLE IF NOT EXISTS individual_votes (
  id SERIAL PRIMARY KEY,
  color_id INTEGER REFERENCES colors(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('keep', 'trade', 'cut')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_individual_votes_color_id ON individual_votes(color_id);
CREATE INDEX IF NOT EXISTS idx_individual_votes_vote_type ON individual_votes(vote_type);
CREATE INDEX IF NOT EXISTS idx_individual_votes_created_at ON individual_votes(created_at);

-- Add rating and vote count columns to colors table
ALTER TABLE colors 
ADD COLUMN IF NOT EXISTS rating DECIMAL(5,2) DEFAULT 50.0,
ADD COLUMN IF NOT EXISTS total_votes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
`)

    // Step 2: Get existing data
    console.log('Fetching existing data...')
    
    const { data: colors, error: colorsError } = await supabase
      .from('colors')
      .select('*')

    if (colorsError) {
      throw new Error(`Error fetching colors: ${colorsError.message}`)
    }

    const { data: oldVotes, error: votesError } = await supabase
      .from('votes')
      .select('*')

    if (votesError) {
      console.log('No old votes table found, starting fresh')
      return
    }

    // Step 3: Convert old votes to individual votes with proper timestamps
    console.log('Converting old votes to individual votes...')
    
    const individualVotes = []
    
    // Sort old votes by created_at to maintain chronological order
    const sortedOldVotes = oldVotes.sort((a, b) => {
      const dateA = new Date(a.created_at || '1970-01-01')
      const dateB = new Date(b.created_at || '1970-01-01')
      return dateA - dateB
    })
    
    sortedOldVotes.forEach((vote, index) => {
      // Each old vote becomes 3 individual votes with slight time offsets to maintain order
      const baseTime = new Date(vote.created_at || new Date())
      
      if (vote.color_keep) {
        individualVotes.push({
          color_id: vote.color_keep,
          vote_type: 'keep',
          created_at: new Date(baseTime.getTime() + (index * 3000)).toISOString() // 3 second intervals
        })
      }
      if (vote.color_trade) {
        individualVotes.push({
          color_id: vote.color_trade,
          vote_type: 'trade', 
          created_at: new Date(baseTime.getTime() + (index * 3000) + 1000).toISOString() // +1 second
        })
      }
      if (vote.color_cut) {
        individualVotes.push({
          color_id: vote.color_cut,
          vote_type: 'cut',
          created_at: new Date(baseTime.getTime() + (index * 3000) + 2000).toISOString() // +2 seconds
        })
      }
    })
    
    console.log(`Converted ${oldVotes.length} old votes into ${individualVotes.length} individual votes`)

    // Insert individual votes in batches
    console.log(`Inserting ${individualVotes.length} individual votes...`)
    
    const batchSize = 100
    for (let i = 0; i < individualVotes.length; i += batchSize) {
      const batch = individualVotes.slice(i, i + batchSize)
      
      const { error: insertError } = await supabase
        .from('individual_votes')
        .insert(batch)
      
      if (insertError) {
        console.error(`Error inserting batch ${i}-${i + batchSize}:`, insertError)
      } else {
        console.log(`Inserted batch ${i}-${i + batchSize}`)
      }
    }

    // Step 4: Calculate ratings for all colors using the new algorithm
    console.log('Calculating ratings for all colors...')
    
    const colorRatings = new Map()
    
    // Initialize all colors with base rating
    colors.forEach(color => {
      colorRatings.set(color.id, {
        ...color,
        rating: ratingAlgorithm.getBaseRating(),
        votes: []
      })
    })
    
    // Sort all individual votes by timestamp to process chronologically
    const { data: allNewVotes, error: allVotesError } = await supabase
      .from('individual_votes')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (allVotesError) {
      console.error('Error fetching individual votes:', allVotesError)
      return
    }
    
    console.log(`Processing ${allNewVotes.length} individual votes chronologically...`)
    
    // Process votes in chronological order across all colors
    allNewVotes.forEach((vote, globalIndex) => {
      const colorData = colorRatings.get(vote.color_id)
      if (!colorData) return
      
      // Add vote to color's history
      colorData.votes.push(vote)
      
      // Calculate new rating based on current vote count for this color
      const colorVoteCount = colorData.votes.length
      const oldRating = colorData.rating
      
      colorData.rating = ratingAlgorithm.calculateNewRating(
        oldRating,
        vote.vote_type,
        colorVoteCount - 1 // previous vote count
      )
      
      // Log significant rating changes
      const ratingChange = colorData.rating - oldRating
      if (Math.abs(ratingChange) > 0.5) {
        console.log(`  Vote ${globalIndex + 1}: ${colorData.name} ${vote.vote_type} -> ${colorData.rating.toFixed(1)} (${ratingChange > 0 ? '+' : ''}${ratingChange.toFixed(1)})`)
      }
    })
    
    // Update all colors in database
    console.log('Updating color ratings in database...')
    
    for (const [colorId, colorData] of colorRatings.entries()) {
      const { error: updateError } = await supabase
        .from('colors')
        .update({
          rating: Math.round(colorData.rating * 100) / 100, // Round to 2 decimal places
          total_votes: colorData.votes.length,
          updated_at: new Date().toISOString()
        })
        .eq('id', colorId)

      if (updateError) {
        console.error(`Error updating color ${colorId}:`, updateError)
      } else {
        const keepVotes = colorData.votes.filter(v => v.vote_type === 'keep').length
        const tradeVotes = colorData.votes.filter(v => v.vote_type === 'trade').length
        const cutVotes = colorData.votes.filter(v => v.vote_type === 'cut').length
        const confidence = Math.round(ratingAlgorithm.calculateConfidence(colorData.votes.length) * 100)
        
        console.log(`✓ ${colorData.name}: ${colorData.rating.toFixed(1)}/100 (${confidence}% conf) | K:${keepVotes} T:${tradeVotes} C:${cutVotes}`)
      }
    }

    console.log('\n🎉 Migration completed successfully!')
    console.log('\n📊 Summary:')
    
    // Generate summary statistics
    const finalRatings = Array.from(colorRatings.values())
      .map(color => ({
        name: color.name,
        rating: color.rating,
        votes: color.votes.length
      }))
      .sort((a, b) => b.rating - a.rating)
    
    console.log(`   • Processed ${oldVotes.length} original votes`)
    console.log(`   • Created ${individualVotes.length} individual votes`) 
    console.log(`   • Updated ratings for ${colors.length} colors`)
    console.log(`   • Top rated color: ${finalRatings[0]?.name} (${finalRatings[0]?.rating.toFixed(1)}/100)`)
    console.log(`   • Most voted color: ${finalRatings.reduce((max, color) => color.votes > max.votes ? color : max, finalRatings[0])?.name} (${Math.max(...finalRatings.map(c => c.votes))} votes)`)
    
    console.log('\n💡 Next steps:')
    console.log('   1. Test the voting interface at /vote')
    console.log('   2. Check rankings at /rankings')
    console.log('   3. Optionally archive the old votes table')
    console.log('   4. Monitor the new system performance')

  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  migrate()
}

module.exports = { migrate }