import {
  pairKey,
  informationGain,
  selectPair,
  CandidateCard,
  PairSelectionContext,
} from './pairs'

describe('pairKey', () => {
  it('sorts IDs alphabetically', () => {
    expect(pairKey('b', 'a')).toBe('a:b')
    expect(pairKey('a', 'b')).toBe('a:b')
  })

  it('produces the same key regardless of argument order', () => {
    expect(pairKey('card1', 'card2')).toBe(pairKey('card2', 'card1'))
  })

  it('handles identical IDs', () => {
    expect(pairKey('x', 'x')).toBe('x:x')
  })
})

describe('informationGain', () => {
  it('scores higher for close ratings vs far-apart ratings', () => {
    const cardA: CandidateCard = { id: 'a', eloRating: 1500, comparisonCount: 10 }
    const cardB: CandidateCard = { id: 'b', eloRating: 1510, comparisonCount: 10 }
    const cardC: CandidateCard = { id: 'c', eloRating: 1900, comparisonCount: 10 }

    const closeScore = informationGain(cardA, cardB)
    const farScore = informationGain(cardA, cardC)

    expect(closeScore).toBeGreaterThan(farScore)
  })

  it('scores higher when cards have fewer comparisons', () => {
    const newCard: CandidateCard = { id: 'a', eloRating: 1500, comparisonCount: 0 }
    const otherNew: CandidateCard = { id: 'b', eloRating: 1500, comparisonCount: 0 }

    const oldCard: CandidateCard = { id: 'c', eloRating: 1500, comparisonCount: 50 }
    const otherOld: CandidateCard = { id: 'd', eloRating: 1500, comparisonCount: 50 }

    const newScore = informationGain(newCard, otherNew)
    const oldScore = informationGain(oldCard, otherOld)

    expect(newScore).toBeGreaterThan(oldScore)
  })

  it('returns a positive value', () => {
    const a: CandidateCard = { id: 'a', eloRating: 1500, comparisonCount: 5 }
    const b: CandidateCard = { id: 'b', eloRating: 1600, comparisonCount: 5 }

    expect(informationGain(a, b)).toBeGreaterThan(0)
  })
})

describe('selectPair', () => {
  it('returns a pair from the pool', () => {
    const pool: CandidateCard[] = [
      { id: 'a', eloRating: 1500, comparisonCount: 5 },
      { id: 'b', eloRating: 1500, comparisonCount: 5 },
      { id: 'c', eloRating: 1500, comparisonCount: 5 },
    ]

    const ctx: PairSelectionContext = {
      pool,
      seenPairs: new Set(),
      recentCardIds: [],
    }

    const result = selectPair(ctx)

    expect(result).not.toBeNull()
    expect(result!.cardA).toBeDefined()
    expect(result!.cardB).toBeDefined()
    expect(pool).toContainEqual(result!.cardA)
    expect(pool).toContainEqual(result!.cardB)
  })

  it('excludes seen pairs', () => {
    const pool: CandidateCard[] = [
      { id: 'a', eloRating: 1500, comparisonCount: 5 },
      { id: 'b', eloRating: 1500, comparisonCount: 5 },
      { id: 'c', eloRating: 1500, comparisonCount: 5 },
    ]

    const seenPairs = new Set([pairKey('a', 'b')])

    const ctx: PairSelectionContext = {
      pool,
      seenPairs,
      recentCardIds: [],
    }

    // Run multiple times to verify the seen pair is never selected
    for (let i = 0; i < 20; i++) {
      const result = selectPair(ctx)
      expect(result).not.toBeNull()
      const key = pairKey(result!.cardA.id, result!.cardB.id)
      expect(key).not.toBe(pairKey('a', 'b'))
    }
  })

  it('returns null when all pairs have been seen', () => {
    const pool: CandidateCard[] = [
      { id: 'a', eloRating: 1500, comparisonCount: 5 },
      { id: 'b', eloRating: 1500, comparisonCount: 5 },
      { id: 'c', eloRating: 1500, comparisonCount: 5 },
    ]

    const seenPairs = new Set([
      pairKey('a', 'b'),
      pairKey('a', 'c'),
      pairKey('b', 'c'),
    ])

    const ctx: PairSelectionContext = {
      pool,
      seenPairs,
      recentCardIds: [],
    }

    const result = selectPair(ctx)
    expect(result).toBeNull()
  })

  it('enforces max-3-in-a-row constraint', () => {
    const pool: CandidateCard[] = [
      { id: 'a', eloRating: 1500, comparisonCount: 0 },
      { id: 'b', eloRating: 1500, comparisonCount: 0 },
      { id: 'c', eloRating: 1500, comparisonCount: 0 },
      { id: 'd', eloRating: 1500, comparisonCount: 0 },
    ]

    // Card 'a' has appeared in the last 3 entries
    const recentCardIds = ['a', 'a', 'a']

    const ctx: PairSelectionContext = {
      pool,
      seenPairs: new Set(),
      recentCardIds,
    }

    // Run multiple times to verify card 'a' is never selected
    for (let i = 0; i < 20; i++) {
      const result = selectPair(ctx)
      expect(result).not.toBeNull()
      expect(result!.cardA.id).not.toBe('a')
      expect(result!.cardB.id).not.toBe('a')
    }
  })

  it('works with a 2-card pool', () => {
    const pool: CandidateCard[] = [
      { id: 'x', eloRating: 1400, comparisonCount: 3 },
      { id: 'y', eloRating: 1600, comparisonCount: 3 },
    ]

    const ctx: PairSelectionContext = {
      pool,
      seenPairs: new Set(),
      recentCardIds: [],
    }

    const result = selectPair(ctx)

    expect(result).not.toBeNull()
    const ids = [result!.cardA.id, result!.cardB.id].sort()
    expect(ids).toEqual(['x', 'y'])
  })

  it('returns null for a pool with fewer than 2 cards', () => {
    const ctx: PairSelectionContext = {
      pool: [{ id: 'a', eloRating: 1500, comparisonCount: 0 }],
      seenPairs: new Set(),
      recentCardIds: [],
    }

    expect(selectPair(ctx)).toBeNull()
  })

  it('returns null for an empty pool', () => {
    const ctx: PairSelectionContext = {
      pool: [],
      seenPairs: new Set(),
      recentCardIds: [],
    }

    expect(selectPair(ctx)).toBeNull()
  })
})
