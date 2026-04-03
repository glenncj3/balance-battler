import Papa from 'papaparse'

export interface CsvRow {
  name: string
  rarity: string
  type: string
  image: string
  [key: string]: string
}

export interface CsvParseError {
  row: number
  message: string
}

export interface ParsedCsv {
  rows: CsvRow[]
  errors: CsvParseError[]
}

export interface MatchedCard {
  name: string
  rarity: string
  type: string
  imageFilename: string
}

export interface UnmatchedCsvRow {
  row: number
  name: string
  imageFilename: string
}

export interface ValidationResult {
  matched: MatchedCard[]
  unmatchedCsvRows: UnmatchedCsvRow[]
  unmatchedImages: string[]
  duplicateImages: string[]
}

export interface ExportCard {
  name: string
  rarity: string
  type: string
  image: string
  rating: number
}

export interface FullExportCard extends ExportCard {
  comparisonCount: number
  winCount: number
  winRate: number
  confidence: string
}

export function titleCase(word: string): string {
  if (word.length === 0) return word
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

export function normalizeRarity(raw: string): string {
  return titleCase(raw.trim())
}

export function normalizeType(raw: string): string {
  return raw
    .split(',')
    .map((part) => titleCase(part.trim()))
    .join(', ')
}

export function parseCsv(csvText: string): ParsedCsv {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  })

  const errors: CsvParseError[] = []
  const rows: CsvRow[] = []

  // Build case-insensitive column mapping
  const sampleRow = result.data[0]
  if (!sampleRow) {
    return { rows: [], errors: [] }
  }

  const fields = result.meta.fields || []
  const fieldMap: Record<string, string> = {}
  for (const field of fields) {
    fieldMap[field.toLowerCase()] = field
  }

  const requiredColumns = ['name', 'rarity', 'type', 'image']
  const missingColumns: string[] = []
  for (const col of requiredColumns) {
    if (!fieldMap[col]) {
      missingColumns.push(col)
    }
  }

  if (missingColumns.length > 0) {
    errors.push({
      row: 0,
      message: `Missing required columns: ${missingColumns.join(', ')}`,
    })
    return { rows: [], errors }
  }

  const nameCol = fieldMap['name']
  const rarityCol = fieldMap['rarity']
  const typeCol = fieldMap['type']
  const imageCol = fieldMap['image']

  for (let i = 0; i < result.data.length; i++) {
    const raw = result.data[i]
    const rowNum = i + 1

    const name = (raw[nameCol] || '').trim()
    const rarity = (raw[rarityCol] || '').trim()
    const type = (raw[typeCol] || '').trim()
    const image = (raw[imageCol] || '').trim()

    if (!name) {
      errors.push({ row: rowNum, message: 'Missing Name' })
      continue
    }
    if (!rarity) {
      errors.push({ row: rowNum, message: 'Missing Rarity' })
      continue
    }
    if (!type) {
      errors.push({ row: rowNum, message: 'Missing Type' })
      continue
    }
    if (!image) {
      errors.push({ row: rowNum, message: 'Missing Image' })
      continue
    }

    rows.push({
      name,
      rarity: normalizeRarity(rarity),
      type: normalizeType(type),
      image,
    })
  }

  // Include papaparse errors
  for (const err of result.errors) {
    errors.push({
      row: err.row !== undefined ? err.row + 1 : 0,
      message: err.message,
    })
  }

  return { rows, errors }
}

export function validateCsvAgainstImages(
  parsed: ParsedCsv,
  imageFilenames: string[]
): ValidationResult {
  const imageSet = new Set(imageFilenames)
  const matched: MatchedCard[] = []
  const unmatchedCsvRows: UnmatchedCsvRow[] = []
  const matchedImageSet = new Set<string>()
  const imageCountMap = new Map<string, number>()

  // Count image references to detect duplicates
  for (const row of parsed.rows) {
    const count = imageCountMap.get(row.image) || 0
    imageCountMap.set(row.image, count + 1)
  }

  const duplicateImages: string[] = []
  for (const [image, count] of imageCountMap.entries()) {
    if (count > 1) {
      duplicateImages.push(image)
    }
  }

  for (let i = 0; i < parsed.rows.length; i++) {
    const row = parsed.rows[i]
    if (imageSet.has(row.image)) {
      matched.push({
        name: row.name,
        rarity: row.rarity,
        type: row.type,
        imageFilename: row.image,
      })
      matchedImageSet.add(row.image)
    } else {
      unmatchedCsvRows.push({
        row: i + 1,
        name: row.name,
        imageFilename: row.image,
      })
    }
  }

  const unmatchedImages = imageFilenames.filter(
    (img) => !matchedImageSet.has(img)
  )

  return { matched, unmatchedCsvRows, unmatchedImages, duplicateImages }
}

export function generateExportCsv(cards: ExportCard[]): string {
  const data = cards.map((card) => ({
    Name: card.name,
    Rarity: card.rarity,
    Type: card.type,
    Image: card.image,
    Rating: card.rating,
  }))

  return Papa.unparse(data)
}

export function generateFullExportCsv(cards: FullExportCard[]): string {
  const data = cards.map((card) => ({
    Name: card.name,
    Rarity: card.rarity,
    Type: card.type,
    Image: card.image,
    Rating: card.rating,
    Comparison_Count: card.comparisonCount,
    Win_Count: card.winCount,
    Win_Rate: card.winRate,
    Confidence: card.confidence,
  }))

  return Papa.unparse(data)
}
