import { expectedScore } from './elo'

export interface CandidateCard {
  id: string
  eloRating: number
  comparisonCount: number
}

export interface PairSelectionContext {
  pool: CandidateCard[]
  seenPairs: Set<string>
  recentCardIds: string[]
}

export interface SelectedPair {
  cardA: CandidateCard
  cardB: CandidateCard
}

export function pairKey(idA: string, idB: string): string {
  return [idA, idB].sort().join(':')
}

export function informationGain(a: CandidateCard, b: CandidateCard): number {
  const expected = expectedScore(a.eloRating, b.eloRating)
  const uncertaintyScore = 1 - Math.abs(expected - 0.5) * 2
  const scarcityScore =
    1 / (1 + a.comparisonCount) + 1 / (1 + b.comparisonCount)

  return 0.6 * uncertaintyScore + 0.4 * scarcityScore
}

export function selectPair(ctx: PairSelectionContext): SelectedPair | null {
  const { pool, seenPairs, recentCardIds } = ctx

  if (pool.length < 2) return null

  // Determine cards that have appeared in the last 3 entries of recentCardIds
  const last3 = recentCardIds.slice(-3)
  const recentCounts = new Map<string, number>()
  for (const id of last3) {
    recentCounts.set(id, (recentCounts.get(id) || 0) + 1)
  }
  // A card is blocked if it appeared in all 3 of the last 3 entries
  const blockedIds = new Set<string>()
  for (const [id, count] of recentCounts.entries()) {
    if (count >= 3) {
      blockedIds.add(id)
    }
  }

  // Build all eligible pairs
  const eligiblePairs: Array<{ a: CandidateCard; b: CandidateCard; score: number }> = []

  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const a = pool[i]
      const b = pool[j]
      const key = pairKey(a.id, b.id)

      // Exclude already-seen pairs
      if (seenPairs.has(key)) continue

      // Apply max-3-in-a-row constraint
      if (blockedIds.has(a.id) || blockedIds.has(b.id)) continue

      const score = informationGain(a, b)
      eligiblePairs.push({ a, b, score })
    }
  }

  if (eligiblePairs.length === 0) return null

  // Sort by score descending
  eligiblePairs.sort((x, y) => y.score - x.score)

  // 70% chance pick highest-scoring, 30% pick random from top 5
  const useRandom = Math.random() < 0.3
  let selected: { a: CandidateCard; b: CandidateCard }

  if (useRandom && eligiblePairs.length > 1) {
    const topN = eligiblePairs.slice(0, Math.min(5, eligiblePairs.length))
    const idx = Math.floor(Math.random() * topN.length)
    selected = topN[idx]
  } else {
    selected = eligiblePairs[0]
  }

  return { cardA: selected.a, cardB: selected.b }
}
