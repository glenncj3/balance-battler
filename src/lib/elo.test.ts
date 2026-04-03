import {
  expectedScore,
  getKFactor,
  calculateElo,
  undoElo,
  getConfidence,
  K_NEW,
  K_IMPORTED,
  K_ESTABLISHED,
} from './elo'

describe('expectedScore', () => {
  it('returns 0.5 for equal ratings', () => {
    expect(expectedScore(1500, 1500)).toBe(0.5)
  })

  it('returns ~0.76 for a 200-point advantage', () => {
    const score = expectedScore(1700, 1500)
    expect(score).toBeCloseTo(0.76, 2)
  })

  it('returns ~0.24 for a 200-point disadvantage', () => {
    const score = expectedScore(1500, 1700)
    expect(score).toBeCloseTo(0.24, 2)
  })

  it('returns close to 1 for a very large advantage', () => {
    const score = expectedScore(2000, 1000)
    expect(score).toBeGreaterThan(0.99)
  })

  it('returns close to 0 for a very large disadvantage', () => {
    const score = expectedScore(1000, 2000)
    expect(score).toBeLessThan(0.01)
  })
})

describe('getKFactor', () => {
  it('returns 40 for new cards (0 comparisons, not imported)', () => {
    expect(getKFactor(0, false)).toBe(K_NEW)
    expect(getKFactor(0, false)).toBe(40)
  })

  it('returns 32 for imported cards with < 15 comparisons', () => {
    expect(getKFactor(0, true)).toBe(K_IMPORTED)
    expect(getKFactor(0, true)).toBe(32)
    expect(getKFactor(14, true)).toBe(32)
  })

  it('returns 20 for cards with >= 15 comparisons', () => {
    expect(getKFactor(15, false)).toBe(K_ESTABLISHED)
    expect(getKFactor(15, false)).toBe(20)
    expect(getKFactor(100, false)).toBe(20)
  })

  it('returns 20 for imported cards with >= 15 comparisons', () => {
    expect(getKFactor(15, true)).toBe(K_ESTABLISHED)
    expect(getKFactor(50, true)).toBe(20)
  })

  it('returns 40 for non-imported cards with < 15 comparisons', () => {
    expect(getKFactor(5, false)).toBe(K_NEW)
    expect(getKFactor(14, false)).toBe(K_NEW)
  })
})

describe('calculateElo', () => {
  it('winner gains rating, loser loses rating', () => {
    const result = calculateElo({
      ratingA: 1500,
      ratingB: 1500,
      comparisonsA: 0,
      comparisonsB: 0,
      wasImportedA: false,
      wasImportedB: false,
      winner: 'a',
    })

    expect(result.newRatingA).toBeGreaterThan(1500)
    expect(result.newRatingB).toBeLessThan(1500)
  })

  it('sum of adjustments is approximately zero', () => {
    const result = calculateElo({
      ratingA: 1500,
      ratingB: 1500,
      comparisonsA: 20,
      comparisonsB: 20,
      wasImportedA: false,
      wasImportedB: false,
      winner: 'a',
    })

    const deltaA = result.newRatingA - 1500
    const deltaB = result.newRatingB - 1500
    // With equal K-factors, the sum should be near zero (within rounding)
    expect(Math.abs(deltaA + deltaB)).toBeLessThanOrEqual(1)
  })

  it('larger adjustment when ratings are far apart and underdog wins', () => {
    // Underdog wins (B rated much lower than A)
    const upsetResult = calculateElo({
      ratingA: 1800,
      ratingB: 1200,
      comparisonsA: 20,
      comparisonsB: 20,
      wasImportedA: false,
      wasImportedB: false,
      winner: 'b',
    })

    // Expected matchup: A rated much higher, B wins -> large gain for B
    const normalResult = calculateElo({
      ratingA: 1500,
      ratingB: 1500,
      comparisonsA: 20,
      comparisonsB: 20,
      wasImportedA: false,
      wasImportedB: false,
      winner: 'b',
    })

    const upsetGain = upsetResult.newRatingB - 1200
    const normalGain = normalResult.newRatingB - 1500
    expect(upsetGain).toBeGreaterThan(normalGain)
  })

  it('each card uses its own K-factor', () => {
    // Card A is new (K=40), Card B is established (K=20)
    const result = calculateElo({
      ratingA: 1500,
      ratingB: 1500,
      comparisonsA: 0,
      comparisonsB: 20,
      wasImportedA: false,
      wasImportedB: false,
      winner: 'a',
    })

    const deltaA = result.newRatingA - 1500
    const deltaB = result.newRatingB - 1500

    // A has K=40 so it should gain more than B loses (B has K=20)
    expect(Math.abs(deltaA)).toBeGreaterThan(Math.abs(deltaB))
  })

  it('correctly handles winner b', () => {
    const result = calculateElo({
      ratingA: 1500,
      ratingB: 1500,
      comparisonsA: 20,
      comparisonsB: 20,
      wasImportedA: false,
      wasImportedB: false,
      winner: 'b',
    })

    expect(result.newRatingB).toBeGreaterThan(1500)
    expect(result.newRatingA).toBeLessThan(1500)
  })
})

describe('undoElo', () => {
  it('correctly restores pre-vote ratings', () => {
    const preElos = { cardAPreElo: 1520, cardBPreElo: 1480 }
    const result = undoElo(preElos)

    expect(result.restoredRatingA).toBe(1520)
    expect(result.restoredRatingB).toBe(1480)
  })

  it('restores arbitrary ratings', () => {
    const preElos = { cardAPreElo: 1000, cardBPreElo: 2000 }
    const result = undoElo(preElos)

    expect(result.restoredRatingA).toBe(1000)
    expect(result.restoredRatingB).toBe(2000)
  })
})

describe('getConfidence', () => {
  it('returns "low" for comparison count < 5', () => {
    expect(getConfidence(0)).toBe('low')
    expect(getConfidence(4)).toBe('low')
  })

  it('returns "medium" at the boundary of 5', () => {
    expect(getConfidence(5)).toBe('medium')
  })

  it('returns "medium" for counts between 5 and 15 inclusive', () => {
    expect(getConfidence(10)).toBe('medium')
    expect(getConfidence(15)).toBe('medium')
  })

  it('returns "high" for counts above 15', () => {
    expect(getConfidence(16)).toBe('high')
    expect(getConfidence(100)).toBe('high')
  })
})
