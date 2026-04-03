export function computeMean(values: number[]): number {
  if (values.length === 0) return 0
  const sum = values.reduce((acc, v) => acc + v, 0)
  return sum / values.length
}

export function computeStdDev(values: number[]): number {
  if (values.length === 0) return 0
  const mean = computeMean(values)
  const squaredDiffs = values.map((v) => (v - mean) ** 2)
  const variance = squaredDiffs.reduce((acc, v) => acc + v, 0) / values.length
  return Math.sqrt(variance)
}

export function classifyBalanceZone(
  rating: number,
  mean: number,
  sd: number,
  threshold: number
): 'overpowered' | 'balanced' | 'underpowered' {
  if (sd === 0) return 'balanced'
  const deviation = (rating - mean) / sd
  if (deviation > threshold) return 'overpowered'
  if (deviation < -threshold) return 'underpowered'
  return 'balanced'
}

export function detectOutliers(
  cards: Array<{
    id: string
    name: string
    rarity: string
    eloRating: number
  }>
): Array<{
  id: string
  name: string
  rarity: string
  eloRating: number
  overallDeviation: number
  rarityDeviation: number
}> {
  if (cards.length === 0) return []

  const ratings = cards.map((c) => c.eloRating)
  const overallMean = computeMean(ratings)
  const overallSd = computeStdDev(ratings)

  if (overallSd === 0) return []

  // Group by rarity for rarity-tier statistics
  const rarityGroups = new Map<string, number[]>()
  for (const card of cards) {
    const group = rarityGroups.get(card.rarity) || []
    group.push(card.eloRating)
    rarityGroups.set(card.rarity, group)
  }

  const rarityStats = new Map<string, { mean: number; sd: number }>()
  for (const [rarity, group] of rarityGroups.entries()) {
    rarityStats.set(rarity, {
      mean: computeMean(group),
      sd: computeStdDev(group),
    })
  }

  const outliers: Array<{
    id: string
    name: string
    rarity: string
    eloRating: number
    overallDeviation: number
    rarityDeviation: number
  }> = []

  for (const card of cards) {
    const overallDeviation = (card.eloRating - overallMean) / overallSd
    const stats = rarityStats.get(card.rarity)

    if (!stats || stats.sd === 0) continue

    const rarityDeviation = (card.eloRating - stats.mean) / stats.sd

    // Flag cards that are > 2 SD from overall mean AND > 2 SD from their rarity tier mean
    if (Math.abs(overallDeviation) > 2 && Math.abs(rarityDeviation) > 2) {
      outliers.push({
        id: card.id,
        name: card.name,
        rarity: card.rarity,
        eloRating: card.eloRating,
        overallDeviation,
        rarityDeviation,
      })
    }
  }

  return outliers
}
