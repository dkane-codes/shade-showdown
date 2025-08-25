# New Rating System Documentation

## Overview

The Shade Showdown application has been updated from a head-to-head comparison system to an individual voting system with advanced rating calculations.

## Key Changes

### From Old System:
- Users voted on 3 colors at once (Keep, Trade, Cut)
- Simple point system: Keep = 3pts, Trade = 1pt, Cut = 0pts
- Head-to-head Elo-style comparisons

### To New System:
- Users vote on individual colors one at a time
- 0-100 rating scale with base rating of 50
- Vote impacts: Keep (+1.0), Trade (-0.3), Cut (-1.0)
- Diminishing returns for extreme ratings
- Confidence scaling based on total votes

## Rating Algorithm Details

### Base Rating
- All colors start with a rating of 50/100
- This represents a neutral baseline

### Vote Impacts
- **Keep**: +1.0 impact (positive rating change)
- **Trade**: -0.3 impact (slight negative rating change)
- **Cut**: -1.0 impact (negative rating change)

### Diminishing Returns
- Colors rated 70+ receive reduced boost from Keep votes (50% reduction)
- Colors rated 30- receive reduced penalty from Cut votes (50% reduction)
- This prevents ratings from becoming too extreme

### Confidence Scaling
- Rating changes scale with total vote count
- Full confidence reached at 20 votes
- Early votes have less impact to prevent volatility
- Formula: `confidence = min(1.0, totalVotes / 20)`

### Rating Update Formula
```javascript
newRating = oldRating + (kFactor * confidenceFactor * adjustedVoteImpact)
```

Where:
- `kFactor = 2.0` (adjustable multiplier)
- `confidenceFactor` = vote count confidence (0-1)
- `adjustedVoteImpact` = vote impact after diminishing returns

### Bounds
- Ratings are constrained between 0 and 100
- No rating can exceed these bounds

## Database Schema Changes

### New Table: `individual_votes`
```sql
CREATE TABLE individual_votes (
  id SERIAL PRIMARY KEY,
  color_id INTEGER REFERENCES colors(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('keep', 'trade', 'cut')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Updated Table: `colors`
```sql
ALTER TABLE colors 
ADD COLUMN rating DECIMAL(5,2) DEFAULT 50.0,
ADD COLUMN total_votes INTEGER DEFAULT 0,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
```

## Migration Process

### 1. Database Schema Setup
Run this SQL in your Supabase dashboard to create the required tables and columns:

```sql
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
```

### 2. Run Migration Script
Execute the migration script to convert existing votes and calculate ratings:

```bash
node scripts/migrate-to-new-rating-system.js
```

### 3. Migration Process Details

The migration script:
1. **Converts old votes**: Each head-to-head vote becomes 3 individual votes
2. **Preserves chronological order**: Maintains vote timestamps with slight offsets
3. **Processes chronologically**: Applies the new algorithm to all votes in time order
4. **Calculates accurate ratings**: Each vote updates the rating using the diminishing returns logic
5. **Provides detailed logging**: Shows rating changes and final statistics

### 4. Test Migration (Optional)
You can test the migration logic with sample data:

```bash
node test-migration.js
```

This shows how the new algorithm differs from the old point system and validates the migration process.

### 5. Verification
After migration:
- Check that colors have ratings between 0-100
- Verify vote counts match expected numbers
- Test the voting interface at `/vote`
- Review rankings at `/rankings`
- Monitor system performance

## UI Changes

### Voting Page (`/vote`)
- Now shows one color at a time instead of three
- Displays current rating and confidence level
- Shows vote impact values on buttons
- Progress indicator for votes cast
- Skip option for colors users don't want to rate

### Rankings Page (`/rankings`)
- Now sorts by rating (0-100) instead of points
- Shows confidence percentage
- Displays individual vote counts (Keep/Trade/Cut)
- Backwards compatible with old point system

## Testing

Run the test suite to verify the algorithm:
```bash
node test-rating-algorithm.js
```

## Benefits of New System

1. **More Granular**: 100-point scale vs simple point system
2. **Individual Focus**: Users can focus on one color at a time
3. **Balanced**: Diminishing returns prevent extreme ratings
4. **Confidence-Based**: Early votes have less impact to reduce volatility
5. **Progressive**: Ratings evolve naturally with more data
6. **User-Friendly**: Clear impact values and rating display

## Configuration

The algorithm can be tuned by adjusting these values in `lib/rating-algorithm.js`:

- `BASE_RATING`: Starting rating (default: 50)
- `K_FACTOR`: Rating change multiplier (default: 2.0)
- `VOTE_IMPACTS`: Individual vote impact values
- `FULL_CONFIDENCE_VOTES`: Votes needed for full confidence (default: 20)
- `DIMINISHING_FACTOR`: Reduction factor for extreme ratings (default: 0.5)
- `HIGH_RATING_THRESHOLD`: Rating considered "high" (default: 70)
- `LOW_RATING_THRESHOLD`: Rating considered "low" (default: 30)