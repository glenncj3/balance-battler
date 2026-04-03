export const DEFAULT_RATING = 1500
export const K_NEW = 40
export const K_IMPORTED = 32
export const K_ESTABLISHED = 20
export const K_DECAY_THRESHOLD = 15
export const ELO_DIVISOR = 400

export interface EloInput {
  ratingA: number
  ratingB: number
  comparisonsA: number
  comparisonsB: number
  wasImportedA: boolean
  wasImportedB: boolean
  winner: 'a' | 'b'
}

export interface EloResult {
  newRatingA: number
  newRatingB: number
}

export function getKFactor(comparisons: number, wasImported: boolean): number {
  if (comparisons >= K_DECAY_THRESHOLD) {
    return K_ESTABLISHED
  }
  if (wasImported) {
    return K_IMPORTED
  }
  return K_NEW
}

export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / ELO_DIVISOR))
}

export function calculateElo(input: EloInput): EloResult {
  const {
    ratingA,
    ratingB,
    comparisonsA,
    comparisonsB,
    wasImportedA,
    wasImportedB,
    winner,
  } = input

  const kA = getKFactor(comparisonsA, wasImportedA)
  const kB = getKFactor(comparisonsB, wasImportedB)

  const eA = expectedScore(ratingA, ratingB)
  const eB = 1 - eA

  const scoreA = winner === 'a' ? 1 : 0
  const scoreB = winner === 'b' ? 1 : 0

  const newRatingA = Math.round(ratingA + kA * (scoreA - eA))
  const newRatingB = Math.round(ratingB + kB * (scoreB - eB))

  return { newRatingA, newRatingB }
}

export function undoElo(preElos: {
  cardAPreElo: number
  cardBPreElo: number
}): { restoredRatingA: number; restoredRatingB: number } {
  return {
    restoredRatingA: preElos.cardAPreElo,
    restoredRatingB: preElos.cardBPreElo,
  }
}

export function getConfidence(
  comparisonCount: number
): 'low' | 'medium' | 'high' {
  if (comparisonCount < 5) return 'low'
  if (comparisonCount <= 15) return 'medium'
  return 'high'
}
