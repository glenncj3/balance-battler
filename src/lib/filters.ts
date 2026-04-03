export function tokenizeType(cardType: string): string[] {
  return cardType
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}

export function cardMatchesTypeFilter(
  cardType: string,
  selectedTypes: string[]
): boolean {
  if (selectedTypes.length === 0) return true
  const tokens = tokenizeType(cardType)
  return tokens.some((token) => selectedTypes.includes(token))
}

export function cardMatchesRarityFilter(
  rarity: string,
  selectedRarities: string[]
): boolean {
  if (selectedRarities.length === 0) return true
  return selectedRarities.includes(rarity)
}

export function filterCards<T extends { rarity: string; cardType: string }>(
  cards: T[],
  rarityFilter: string[],
  typeFilter: string[]
): T[] {
  return cards.filter(
    (card) =>
      cardMatchesRarityFilter(card.rarity, rarityFilter) &&
      cardMatchesTypeFilter(card.cardType, typeFilter)
  )
}
