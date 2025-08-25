// lib/rating-algorithm.js
// New individual voting system with 0-100 rating scale

export class RatingAlgorithm {
  constructor() {
    this.BASE_RATING = 50;
    this.MIN_RATING = 0;
    this.MAX_RATING = 100;
    
    // Vote impact values
    this.VOTE_IMPACTS = {
      keep: 1.0,
      trade: -0.3,
      cut: -1.0
    };
    
    // K-factor for rating updates (can be adjusted)
    this.K_FACTOR = 2.0;
    
    // Confidence calculation
    this.FULL_CONFIDENCE_VOTES = 20;
    
    // Diminishing returns thresholds
    this.HIGH_RATING_THRESHOLD = 70;
    this.LOW_RATING_THRESHOLD = 30;
    this.DIMINISHING_FACTOR = 0.5; // Reduce impact by 50%
  }

  /**
   * Calculate new rating for a color based on a single vote
   * @param {number} currentRating - Current rating (0-100)
   * @param {string} voteType - 'keep', 'trade', or 'cut'
   * @param {number} totalVotes - Total number of votes this color has received
   * @returns {number} New rating (0-100)
   */
  calculateNewRating(currentRating, voteType, totalVotes) {
    if (!this.VOTE_IMPACTS[voteType]) {
      throw new Error(`Invalid vote type: ${voteType}`);
    }

    let voteImpact = this.VOTE_IMPACTS[voteType];
    
    // Apply diminishing returns
    voteImpact = this.applyDiminishingReturns(currentRating, voteImpact);
    
    // Calculate confidence factor based on total votes
    const confidenceFactor = this.calculateConfidence(totalVotes);
    
    // Apply the rating update formula
    const ratingChange = this.K_FACTOR * confidenceFactor * voteImpact;
    const newRating = currentRating + ratingChange;
    
    // Ensure rating stays within bounds
    return Math.max(this.MIN_RATING, Math.min(this.MAX_RATING, newRating));
  }

  /**
   * Apply diminishing returns based on current rating
   * @param {number} currentRating - Current rating (0-100)
   * @param {number} voteImpact - Original vote impact
   * @returns {number} Adjusted vote impact
   */
  applyDiminishingReturns(currentRating, voteImpact) {
    // For high-rated colors (70+), reduce positive impact (keep votes)
    if (currentRating >= this.HIGH_RATING_THRESHOLD && voteImpact > 0) {
      return voteImpact * this.DIMINISHING_FACTOR;
    }
    
    // For low-rated colors (30-), reduce negative impact (cut votes)
    if (currentRating <= this.LOW_RATING_THRESHOLD && voteImpact < 0) {
      return voteImpact * this.DIMINISHING_FACTOR;
    }
    
    return voteImpact;
  }

  /**
   * Calculate confidence factor based on total votes
   * @param {number} totalVotes - Total number of votes
   * @returns {number} Confidence factor (0-1)
   */
  calculateConfidence(totalVotes) {
    return Math.min(1.0, totalVotes / this.FULL_CONFIDENCE_VOTES);
  }

  /**
   * Get the base rating for new colors
   * @returns {number} Base rating
   */
  getBaseRating() {
    return this.BASE_RATING;
  }

  /**
   * Calculate statistics for a color based on its votes
   * @param {Array} votes - Array of vote objects for this color
   * @returns {Object} Statistics object
   */
  calculateColorStats(votes) {
    const stats = {
      keepVotes: 0,
      tradeVotes: 0,
      cutVotes: 0,
      totalVotes: votes.length,
      confidence: this.calculateConfidence(votes.length)
    };

    votes.forEach(vote => {
      if (vote.vote_type === 'keep') stats.keepVotes++;
      else if (vote.vote_type === 'trade') stats.tradeVotes++;
      else if (vote.vote_type === 'cut') stats.cutVotes++;
    });

    return stats;
  }

  /**
   * Simulate rating progression for a color given a sequence of votes
   * @param {Array} voteSequence - Array of vote types ['keep', 'trade', 'cut']
   * @param {number} startingRating - Starting rating (defaults to base)
   * @returns {Array} Array of rating values after each vote
   */
  simulateRatingProgression(voteSequence, startingRating = this.BASE_RATING) {
    let currentRating = startingRating;
    const progression = [currentRating];
    
    voteSequence.forEach((voteType, index) => {
      currentRating = this.calculateNewRating(currentRating, voteType, index + 1);
      progression.push(currentRating);
    });
    
    return progression;
  }
}

// Create singleton instance
export const ratingAlgorithm = new RatingAlgorithm();