/**
 * Database model types that mirror the Prisma schema.
 * These are used for explicit typing in API routes to avoid implicit-any
 * issues when Prisma client types are not yet generated.
 * Once Prisma client is generated, these can be replaced by Prisma's own types.
 */

export interface DbCard {
  id: string
  setId: string
  name: string
  rarity: string
  cardType: string
  imageFilename: string
  imageUrl: string
  thumbnailLg: string | null
  thumbnailSm: string | null
  eloRating: number
  importedRating: number | null
  comparisonCount: number
  winCount: number
  createdAt: Date
  updatedAt: Date
}

export interface DbVote {
  id: string
  setId: string
  cardAId: string
  cardBId: string
  winnerId: string | null
  voterSessionId: string
  decisionTimeMs: number | null
  cardAPreElo: number
  cardBPreElo: number
  whyTag: string | null
  undone: boolean
  createdAt: Date
}

export interface DbVoterSession {
  id: string
  setId: string
  rarityFilter: string[]
  typeFilter: string[]
  showMetadata: boolean
  votesCast: number
  createdAt: Date
  lastActive: Date
}

export interface DbSet {
  id: string
  gameId: string
  name: string
  slug: string
  description: string | null
  votingOpen: boolean
  defaultShowMetadata: boolean
  minVoteThreshold: number
  balanceZoneSd: number
  voterLimit: number | null
  whyTagsEnabled: boolean
  whyTagLabels: string[]
  createdAt: Date
  updatedAt: Date
}

export interface DbCardRatingSnapshot {
  id: string
  cardId: string
  voteId: string
  eloRating: number
  createdAt: Date
}
