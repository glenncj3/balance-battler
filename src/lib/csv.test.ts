import {
  titleCase,
  normalizeRarity,
  normalizeType,
  parseCsv,
  validateCsvAgainstImages,
  generateExportCsv,
  generateFullExportCsv,
} from './csv'

describe('titleCase', () => {
  it('converts lowercase to title case', () => {
    expect(titleCase('creature')).toBe('Creature')
  })

  it('converts uppercase to title case', () => {
    expect(titleCase('MYTHIC')).toBe('Mythic')
  })

  it('handles already title-cased words', () => {
    expect(titleCase('Rare')).toBe('Rare')
  })

  it('handles single character', () => {
    expect(titleCase('a')).toBe('A')
  })

  it('returns empty string for empty input', () => {
    expect(titleCase('')).toBe('')
  })
})

describe('normalizeRarity', () => {
  it('trims whitespace and title-cases', () => {
    expect(normalizeRarity('  common  ')).toBe('Common')
  })

  it('handles uppercase input', () => {
    expect(normalizeRarity('RARE')).toBe('Rare')
  })

  it('handles mixed case', () => {
    expect(normalizeRarity('lEgEnDaRy')).toBe('Legendary')
  })
})

describe('normalizeType', () => {
  it('handles a single type', () => {
    expect(normalizeType('creature')).toBe('Creature')
  })

  it('handles multiple types separated by commas', () => {
    expect(normalizeType('fire,water')).toBe('Fire, Water')
  })

  it('handles extra whitespace around types', () => {
    expect(normalizeType('  fire ,  water , earth ')).toBe('Fire, Water, Earth')
  })

  it('title-cases each type individually', () => {
    expect(normalizeType('DRAGON,BEAST')).toBe('Dragon, Beast')
  })
})

describe('parseCsv', () => {
  it('parses valid CSV with all columns', () => {
    const csv = `Name,Rarity,Type,Image
Dragon,Rare,Fire,dragon.png
Goblin,Common,Beast,goblin.png`

    const result = parseCsv(csv)

    expect(result.errors).toHaveLength(0)
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toEqual({
      name: 'Dragon',
      rarity: 'Rare',
      type: 'Fire',
      image: 'dragon.png',
    })
    expect(result.rows[1]).toEqual({
      name: 'Goblin',
      rarity: 'Common',
      type: 'Beast',
      image: 'goblin.png',
    })
  })

  it('handles case-insensitive column names', () => {
    const csv = `NAME,RARITY,TYPE,IMAGE
Dragon,Rare,Fire,dragon.png`

    const result = parseCsv(csv)

    expect(result.errors).toHaveLength(0)
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].name).toBe('Dragon')
  })

  it('reports error for missing required columns', () => {
    const csv = `Name,Rarity
Dragon,Rare`

    const result = parseCsv(csv)

    expect(result.rows).toHaveLength(0)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0].message).toContain('Missing required columns')
    expect(result.errors[0].message).toContain('type')
    expect(result.errors[0].message).toContain('image')
  })

  it('handles optional Rating column without error', () => {
    const csv = `Name,Rarity,Type,Image,Rating
Dragon,Rare,Fire,dragon.png,1600`

    const result = parseCsv(csv)

    expect(result.errors).toHaveLength(0)
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].name).toBe('Dragon')
  })

  it('normalizes rarity and type values', () => {
    const csv = `Name,Rarity,Type,Image
Dragon,RARE,fire,dragon.png`

    const result = parseCsv(csv)

    expect(result.rows[0].rarity).toBe('Rare')
    expect(result.rows[0].type).toBe('Fire')
  })

  it('reports errors for rows with missing fields', () => {
    const csv = `Name,Rarity,Type,Image
,Rare,Fire,dragon.png
Dragon,,Fire,dragon.png
Dragon,Rare,,dragon.png
Dragon,Rare,Fire,`

    const result = parseCsv(csv)

    expect(result.rows).toHaveLength(0)
    expect(result.errors).toHaveLength(4)
    expect(result.errors[0].message).toBe('Missing Name')
    expect(result.errors[1].message).toBe('Missing Rarity')
    expect(result.errors[2].message).toBe('Missing Type')
    expect(result.errors[3].message).toBe('Missing Image')
  })

  it('returns empty rows for empty CSV', () => {
    const result = parseCsv('')
    expect(result.rows).toHaveLength(0)
    expect(result.errors).toHaveLength(0)
  })
})

describe('validateCsvAgainstImages', () => {
  it('correctly categorizes matched, unmatched CSV rows, unmatched images, and duplicates', () => {
    const parsed = {
      rows: [
        { name: 'Dragon', rarity: 'Rare', type: 'Fire', image: 'dragon.png' },
        { name: 'Goblin', rarity: 'Common', type: 'Beast', image: 'goblin.png' },
        { name: 'Phoenix', rarity: 'Mythic', type: 'Fire', image: 'phoenix.png' },
      ],
      errors: [],
    }
    const imageFilenames = ['dragon.png', 'goblin.png', 'unicorn.png']

    const result = validateCsvAgainstImages(parsed, imageFilenames)

    // Dragon and Goblin match
    expect(result.matched).toHaveLength(2)
    expect(result.matched[0].name).toBe('Dragon')
    expect(result.matched[1].name).toBe('Goblin')

    // Phoenix references phoenix.png which doesn't exist
    expect(result.unmatchedCsvRows).toHaveLength(1)
    expect(result.unmatchedCsvRows[0].name).toBe('Phoenix')
    expect(result.unmatchedCsvRows[0].imageFilename).toBe('phoenix.png')

    // unicorn.png exists in images but not referenced
    expect(result.unmatchedImages).toHaveLength(1)
    expect(result.unmatchedImages[0]).toBe('unicorn.png')

    // No duplicates
    expect(result.duplicateImages).toHaveLength(0)
  })

  it('detects duplicate image references', () => {
    const parsed = {
      rows: [
        { name: 'Dragon', rarity: 'Rare', type: 'Fire', image: 'shared.png' },
        { name: 'Drake', rarity: 'Common', type: 'Fire', image: 'shared.png' },
      ],
      errors: [],
    }
    const imageFilenames = ['shared.png']

    const result = validateCsvAgainstImages(parsed, imageFilenames)

    expect(result.duplicateImages).toHaveLength(1)
    expect(result.duplicateImages[0]).toBe('shared.png')
    expect(result.matched).toHaveLength(2)
  })

  it('handles empty parsed rows', () => {
    const parsed = { rows: [], errors: [] }
    const imageFilenames = ['dragon.png']

    const result = validateCsvAgainstImages(parsed, imageFilenames)

    expect(result.matched).toHaveLength(0)
    expect(result.unmatchedCsvRows).toHaveLength(0)
    expect(result.unmatchedImages).toHaveLength(1)
    expect(result.duplicateImages).toHaveLength(0)
  })
})

describe('generateExportCsv', () => {
  it('produces correct CSV output', () => {
    const cards = [
      { name: 'Dragon', rarity: 'Rare', type: 'Fire', image: 'dragon.png', rating: 1600 },
      { name: 'Goblin', rarity: 'Common', type: 'Beast', image: 'goblin.png', rating: 1400 },
    ]

    const csv = generateExportCsv(cards)

    expect(csv).toContain('Name')
    expect(csv).toContain('Rarity')
    expect(csv).toContain('Type')
    expect(csv).toContain('Image')
    expect(csv).toContain('Rating')
    expect(csv).toContain('Dragon')
    expect(csv).toContain('1600')
    expect(csv).toContain('Goblin')
    expect(csv).toContain('1400')
  })

  it('produces parseable CSV', () => {
    const cards = [
      { name: 'Dragon', rarity: 'Rare', type: 'Fire', image: 'dragon.png', rating: 1600 },
    ]

    const csv = generateExportCsv(cards)
    const lines = csv.split('\n')

    expect(lines).toHaveLength(2) // header + 1 data row
    expect(lines[0]).toContain('Name')
  })
})

describe('generateFullExportCsv', () => {
  it('includes extra columns', () => {
    const cards = [
      {
        name: 'Dragon',
        rarity: 'Rare',
        type: 'Fire',
        image: 'dragon.png',
        rating: 1600,
        comparisonCount: 20,
        winCount: 15,
        winRate: 0.75,
        confidence: 'high',
      },
    ]

    const csv = generateFullExportCsv(cards)

    expect(csv).toContain('Name')
    expect(csv).toContain('Rating')
    expect(csv).toContain('Comparison_Count')
    expect(csv).toContain('Win_Count')
    expect(csv).toContain('Win_Rate')
    expect(csv).toContain('Confidence')
    expect(csv).toContain('Dragon')
    expect(csv).toContain('1600')
    expect(csv).toContain('20')
    expect(csv).toContain('15')
    expect(csv).toContain('high')
  })
})
