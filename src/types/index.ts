// ─── Game Types ──────────────────────────────────────────────

export interface GameSummary {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  setCount: number
  totalCards: number
  createdAt: string
}

export interface GameDetail {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  sets: SetSummary[]
  createdAt: string
  updatedAt: string
}

// ─── Set Types ───────────────────────────────────────────────

export interface SetConfig {
  showCardNames: boolean
  showCardInfo: boolean
  requireMinComparisons: number
}

export interface SetSummary {
  id: string
  name: string
  slug: string
  gameId: string
  imageUrl: string | null
  cardCount: number
  comparisonCount: number
  config: SetConfig
  createdAt: string
}

export interface SetDetail {
  id: string
  name: string
  slug: string
  gameId: string
  gameSlug: string
  gameName: string
  imageUrl: string | null
  cardCount: number
  comparisonCount: number
  config: SetConfig
  rarities: string[]
  types: string[]
  cards: CardSummary[]
  createdAt: string
  updatedAt: string
}

// ─── Card Types ──────────────────────────────────────────────

export interface CardSummary {
  id: string
  name: string
  rarity: string
  cardType: string
  imageUrl: string
  thumbnailLgUrl: string
  eloRating: number
  comparisonCount: number
  winCount: number
  confidence: 'low' | 'medium' | 'high'
}

export interface CardDetail {
  id: string
  name: string
  rarity: string
  cardType: string
  imageUrl: string
  thumbnailLgUrl: string
  thumbnailSmUrl: string
  eloRating: number
  comparisonCount: number
  winCount: number
  winRate: number
  confidence: 'low' | 'medium' | 'high'
  rank: number
  setId: string
  setName: string
  recentComparisons: Array<{
    id: string
    opponentName: string
    opponentImageUrl: string
    won: boolean
    ratingChange: number
    createdAt: string
  }>
}

export interface LeaderboardCard {
  id: string
  rank: number
  name: string
  rarity: string
  cardType: string
  imageUrl: string
  thumbnailLgUrl: string
  eloRating: number
  comparisonCount: number
  winCount: number
  winRate: number
  confidence: 'low' | 'medium' | 'high'
}

// ─── Voting Types ────────────────────────────────────────────

export interface VoteCard {
  id: string
  imageUrl: string
  thumbnailLg: string
  name?: string
  rarity?: string
  cardType?: string
}

export interface VoteSubmission {
  setId: string
  winnerId: string
  loserId: string
  sessionId: string
  timeTakenMs: number
}

export interface VoteResult {
  comparisonId: string
  winnerNewRating: number
  loserNewRating: number
  winnerRatingChange: number
  loserRatingChange: number
  nextPair: { cardA: VoteCard; cardB: VoteCard } | null
}

// ─── Analytics Types ─────────────────────────────────────────

export interface RarityDistribution {
  rarity: string
  count: number
  meanRating: number
  stdDev: number
}

export interface TypeDistribution {
  type: string
  count: number
  meanRating: number
}

export interface RatingHistogramBin {
  min: number
  max: number
  count: number
}

export interface OutlierCard {
  id: string
  name: string
  rarity: string
  eloRating: number
  overallDeviation: number
  rarityDeviation: number
}

export interface ComparisonTrend {
  date: string
  count: number
}

export interface AnalyticsPayload {
  totalCards: number
  totalComparisons: number
  meanRating: number
  stdDev: number
  rarityDistribution: RarityDistribution[]
  typeDistribution: TypeDistribution[]
  ratingHistogram: RatingHistogramBin[]
  outliers: OutlierCard[]
  comparisonTrend: ComparisonTrend[]
  topCards: LeaderboardCard[]
  bottomCards: LeaderboardCard[]
}
