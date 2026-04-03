import { generateSlug, generateUniqueSlug } from './slug'

describe('generateSlug', () => {
  it('converts to lowercase kebab case', () => {
    expect(generateSlug('Fire Dragon')).toBe('fire-dragon')
  })

  it('removes special characters', () => {
    expect(generateSlug("Dragon's Lair!")).toBe('dragon-s-lair')
  })

  it('handles multiple spaces and special chars', () => {
    expect(generateSlug('  Fire & Ice  ')).toBe('fire-ice')
  })

  it('collapses multiple consecutive hyphens', () => {
    expect(generateSlug('Fire---Dragon')).toBe('fire-dragon')
  })

  it('removes leading and trailing hyphens', () => {
    expect(generateSlug('---dragon---')).toBe('dragon')
  })

  it('handles all uppercase', () => {
    expect(generateSlug('FIRE DRAGON')).toBe('fire-dragon')
  })

  it('handles numbers', () => {
    expect(generateSlug('Card 42')).toBe('card-42')
  })

  it('handles a single word', () => {
    expect(generateSlug('Dragon')).toBe('dragon')
  })

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('')
  })
})

describe('generateUniqueSlug', () => {
  it('returns the base slug when no collision', () => {
    expect(generateUniqueSlug('Fire Dragon', [])).toBe('fire-dragon')
    expect(generateUniqueSlug('Fire Dragon', ['ice-drake'])).toBe('fire-dragon')
  })

  it('adds a suffix on collision', () => {
    const existingSlugs = ['fire-dragon']
    const result = generateUniqueSlug('Fire Dragon', existingSlugs)

    expect(result).not.toBe('fire-dragon')
    expect(result).toMatch(/^fire-dragon-[a-z0-9]{4}$/)
  })

  it('generates a 4-character alphanumeric suffix', () => {
    const existingSlugs = ['dragon']
    const result = generateUniqueSlug('Dragon', existingSlugs)

    const suffix = result.replace('dragon-', '')
    expect(suffix).toHaveLength(4)
    expect(suffix).toMatch(/^[a-z0-9]+$/)
  })

  it('produces different suffixes on repeated calls (probabilistic)', () => {
    const existingSlugs = ['dragon']
    const results = new Set<string>()

    for (let i = 0; i < 10; i++) {
      results.add(generateUniqueSlug('Dragon', existingSlugs))
    }

    // With 36^4 = 1,679,616 possibilities, 10 calls should almost certainly produce at least 2 unique results
    expect(results.size).toBeGreaterThanOrEqual(2)
  })
})
