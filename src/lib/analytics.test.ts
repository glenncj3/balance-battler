import {
  computeMean,
  computeStdDev,
  classifyBalanceZone,
  detectOutliers,
} from './analytics'

describe('computeMean', () => {
  it('calculates the mean correctly', () => {
    expect(computeMean([10, 20, 30])).toBe(20)
  })

  it('handles a single value', () => {
    expect(computeMean([42])).toBe(42)
  })

  it('returns 0 for an empty array', () => {
    expect(computeMean([])).toBe(0)
  })

  it('handles negative values', () => {
    expect(computeMean([-10, 10])).toBe(0)
  })

  it('handles decimal values', () => {
    expect(computeMean([1.5, 2.5])).toBe(2)
  })
})

describe('computeStdDev', () => {
  it('calculates standard deviation correctly', () => {
    // Mean = 4, diffs = [-2,-1,0,1,2], squaredDiffs = [4,1,0,1,4], variance = 10/5 = 2, sd = sqrt(2)
    const result = computeStdDev([2, 3, 4, 5, 6])
    expect(result).toBeCloseTo(Math.sqrt(2), 10)
  })

  it('returns 0 for a single value', () => {
    expect(computeStdDev([42])).toBe(0)
  })

  it('returns 0 for an empty array', () => {
    expect(computeStdDev([])).toBe(0)
  })

  it('returns 0 when all values are the same', () => {
    expect(computeStdDev([5, 5, 5, 5])).toBe(0)
  })

  it('calculates correctly for two values', () => {
    // Mean = 5, diffs = [-5, 5], squaredDiffs = [25, 25], variance = 25, sd = 5
    expect(computeStdDev([0, 10])).toBe(5)
  })
})

describe('classifyBalanceZone', () => {
  const mean = 1500
  const sd = 100
  const threshold = 2

  it('classifies a rating well above the mean as overpowered', () => {
    // deviation = (1750 - 1500) / 100 = 2.5 > 2
    expect(classifyBalanceZone(1750, mean, sd, threshold)).toBe('overpowered')
  })

  it('classifies a rating well below the mean as underpowered', () => {
    // deviation = (1250 - 1500) / 100 = -2.5 < -2
    expect(classifyBalanceZone(1250, mean, sd, threshold)).toBe('underpowered')
  })

  it('classifies a rating near the mean as balanced', () => {
    expect(classifyBalanceZone(1500, mean, sd, threshold)).toBe('balanced')
    expect(classifyBalanceZone(1550, mean, sd, threshold)).toBe('balanced')
  })

  it('classifies at the exact boundary as balanced', () => {
    // deviation = (1700 - 1500) / 100 = 2.0, not > 2, so balanced
    expect(classifyBalanceZone(1700, mean, sd, threshold)).toBe('balanced')
    // deviation = (1300 - 1500) / 100 = -2.0, not < -2, so balanced
    expect(classifyBalanceZone(1300, mean, sd, threshold)).toBe('balanced')
  })

  it('returns balanced when sd is 0', () => {
    expect(classifyBalanceZone(2000, 1500, 0, threshold)).toBe('balanced')
  })

  it('classifies just past the boundary as overpowered/underpowered', () => {
    // deviation = (1701 - 1500) / 100 = 2.01 > 2
    expect(classifyBalanceZone(1701, mean, sd, threshold)).toBe('overpowered')
    // deviation = (1299 - 1500) / 100 = -2.01 < -2
    expect(classifyBalanceZone(1299, mean, sd, threshold)).toBe('underpowered')
  })
})

describe('detectOutliers', () => {
  it('flags cards that are outliers in both overall and rarity tier', () => {
    // We need the outlier to be > 2 SD from the overall mean AND > 2 SD from its rarity tier mean.
    // The rarity tier must have SD > 0 (at least two different ratings in the same rarity).
    // Build a dataset where Common cards cluster around 1500 with one extreme outlier at 2000,
    // and the overall distribution also makes 2000 an outlier.
    const cards = [
      { id: '1', name: 'Common1', rarity: 'Common', eloRating: 1500 },
      { id: '2', name: 'Common2', rarity: 'Common', eloRating: 1500 },
      { id: '3', name: 'Common3', rarity: 'Common', eloRating: 1500 },
      { id: '4', name: 'Common4', rarity: 'Common', eloRating: 1500 },
      { id: '5', name: 'Common5', rarity: 'Common', eloRating: 1500 },
      { id: '6', name: 'Common6', rarity: 'Common', eloRating: 1500 },
      { id: '7', name: 'Common7', rarity: 'Common', eloRating: 1500 },
      { id: '8', name: 'Common8', rarity: 'Common', eloRating: 1500 },
      { id: '9', name: 'Common9', rarity: 'Common', eloRating: 1500 },
      { id: '10', name: 'Common10', rarity: 'Common', eloRating: 1510 },
      { id: '11', name: 'Outlier', rarity: 'Common', eloRating: 2200 },
    ]

    const outliers = detectOutliers(cards)

    expect(outliers.length).toBeGreaterThanOrEqual(1)
    expect(outliers.some((o) => o.name === 'Outlier')).toBe(true)
  })

  it('returns empty array when all cards have the same rating', () => {
    const cards = [
      { id: '1', name: 'Card1', rarity: 'Common', eloRating: 1500 },
      { id: '2', name: 'Card2', rarity: 'Common', eloRating: 1500 },
      { id: '3', name: 'Card3', rarity: 'Rare', eloRating: 1500 },
    ]

    const outliers = detectOutliers(cards)
    expect(outliers).toHaveLength(0)
  })

  it('returns empty array for empty input', () => {
    expect(detectOutliers([])).toHaveLength(0)
  })

  it('does not flag cards that are only outliers overall but not within their rarity', () => {
    // Card is an outlier overall but not within its rarity tier
    // because all cards in that rarity are high
    const cards = [
      { id: '1', name: 'LowCommon1', rarity: 'Common', eloRating: 1000 },
      { id: '2', name: 'LowCommon2', rarity: 'Common', eloRating: 1000 },
      { id: '3', name: 'LowCommon3', rarity: 'Common', eloRating: 1000 },
      { id: '4', name: 'LowCommon4', rarity: 'Common', eloRating: 1000 },
      { id: '5', name: 'HighRare1', rarity: 'Rare', eloRating: 2000 },
      { id: '6', name: 'HighRare2', rarity: 'Rare', eloRating: 2000 },
      { id: '7', name: 'HighRare3', rarity: 'Rare', eloRating: 2000 },
      { id: '8', name: 'HighRare4', rarity: 'Rare', eloRating: 2000 },
    ]

    const outliers = detectOutliers(cards)
    // All rares have the same rating, so SD within Rare is 0 -> they get skipped
    // All commons have the same rating, so SD within Common is 0 -> they get skipped
    expect(outliers).toHaveLength(0)
  })

  it('includes overallDeviation and rarityDeviation in results', () => {
    const cards = [
      { id: '1', name: 'Normal1', rarity: 'Common', eloRating: 1500 },
      { id: '2', name: 'Normal2', rarity: 'Common', eloRating: 1500 },
      { id: '3', name: 'Normal3', rarity: 'Common', eloRating: 1500 },
      { id: '4', name: 'Normal4', rarity: 'Common', eloRating: 1500 },
      { id: '5', name: 'Normal5', rarity: 'Common', eloRating: 1500 },
      { id: '6', name: 'Outlier', rarity: 'Common', eloRating: 2500 },
    ]

    const outliers = detectOutliers(cards)

    for (const outlier of outliers) {
      expect(outlier).toHaveProperty('overallDeviation')
      expect(outlier).toHaveProperty('rarityDeviation')
      expect(typeof outlier.overallDeviation).toBe('number')
      expect(typeof outlier.rarityDeviation).toBe('number')
    }
  })
})
