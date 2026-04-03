import {
  tokenizeType,
  cardMatchesTypeFilter,
  cardMatchesRarityFilter,
  filterCards,
} from './filters'

describe('tokenizeType', () => {
  it('splits comma-separated types', () => {
    expect(tokenizeType('Fire, Water')).toEqual(['Fire', 'Water'])
  })

  it('trims whitespace from tokens', () => {
    expect(tokenizeType('  Fire ,  Water  ')).toEqual(['Fire', 'Water'])
  })

  it('handles a single type', () => {
    expect(tokenizeType('Fire')).toEqual(['Fire'])
  })

  it('filters out empty tokens', () => {
    expect(tokenizeType('Fire,,Water')).toEqual(['Fire', 'Water'])
  })

  it('returns empty array for empty string', () => {
    expect(tokenizeType('')).toEqual([])
  })
})

describe('cardMatchesTypeFilter', () => {
  it('matches a single type', () => {
    expect(cardMatchesTypeFilter('Fire', ['Fire'])).toBe(true)
  })

  it('matches multi-type cards when one type is in filter', () => {
    expect(cardMatchesTypeFilter('Fire, Water', ['Water'])).toBe(true)
  })

  it('returns false when no types match', () => {
    expect(cardMatchesTypeFilter('Fire', ['Water'])).toBe(false)
  })

  it('does NOT substring match ("Fire" does NOT match "Firewall")', () => {
    expect(cardMatchesTypeFilter('Firewall', ['Fire'])).toBe(false)
  })

  it('returns true when filter is empty (no type filter applied)', () => {
    expect(cardMatchesTypeFilter('Fire', [])).toBe(true)
  })

  it('matches when card has multiple types and filter has multiple types', () => {
    expect(cardMatchesTypeFilter('Fire, Water, Earth', ['Ice', 'Earth'])).toBe(true)
  })
})

describe('cardMatchesRarityFilter', () => {
  it('matches when rarity is in the filter', () => {
    expect(cardMatchesRarityFilter('Rare', ['Common', 'Rare'])).toBe(true)
  })

  it('does not match when rarity is not in the filter', () => {
    expect(cardMatchesRarityFilter('Mythic', ['Common', 'Rare'])).toBe(false)
  })

  it('returns true when filter is empty', () => {
    expect(cardMatchesRarityFilter('Rare', [])).toBe(true)
  })
})

describe('filterCards', () => {
  const cards = [
    { rarity: 'Common', cardType: 'Fire' },
    { rarity: 'Rare', cardType: 'Water' },
    { rarity: 'Common', cardType: 'Fire, Water' },
    { rarity: 'Mythic', cardType: 'Earth' },
  ]

  it('applies both rarity and type filters', () => {
    const result = filterCards(cards, ['Common'], ['Fire'])

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ rarity: 'Common', cardType: 'Fire' })
    expect(result[1]).toEqual({ rarity: 'Common', cardType: 'Fire, Water' })
  })

  it('with empty filters returns all cards', () => {
    const result = filterCards(cards, [], [])
    expect(result).toHaveLength(4)
  })

  it('filters by rarity only when type filter is empty', () => {
    const result = filterCards(cards, ['Rare'], [])
    expect(result).toHaveLength(1)
    expect(result[0].rarity).toBe('Rare')
  })

  it('filters by type only when rarity filter is empty', () => {
    const result = filterCards(cards, [], ['Water'])
    expect(result).toHaveLength(2)
  })

  it('returns empty array when no cards match', () => {
    const result = filterCards(cards, ['Legendary'], ['Ice'])
    expect(result).toHaveLength(0)
  })
})
