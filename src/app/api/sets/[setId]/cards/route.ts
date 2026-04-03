import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseCsv, validateCsvAgainstImages, normalizeRarity, normalizeType } from '@/lib/csv'
import { getStorage } from '@/lib/storage'
import { processImage } from '@/lib/images'
import { getConfidence, DEFAULT_RATING } from '@/lib/elo'
import { randomUUID } from 'crypto'
import type { DbCard } from '@/types/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params
    const { searchParams } = request.nextUrl

    const sortBy = searchParams.get('sortBy') || 'name'
    const sortDir = (searchParams.get('sortDir') || 'asc') as 'asc' | 'desc'
    const search = searchParams.get('search') || ''

    const set = await prisma.set.findUnique({ where: { id: setId } })
    if (!set) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    }

    const validSortFields: Record<string, string> = {
      name: 'name',
      rarity: 'rarity',
      cardType: 'cardType',
      eloRating: 'eloRating',
    }

    const orderField = validSortFields[sortBy] || 'name'

    const where: Record<string, unknown> = { setId }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    const cards: DbCard[] = await prisma.card.findMany({
      where,
      orderBy: { [orderField]: sortDir },
    })

    const result = cards.map((card) => ({
      id: card.id,
      name: card.name,
      rarity: card.rarity,
      cardType: card.cardType,
      imageFilename: card.imageFilename,
      imageUrl: card.imageUrl,
      thumbnailLg: card.thumbnailLg,
      thumbnailSm: card.thumbnailSm,
      eloRating: card.eloRating,
      importedRating: card.importedRating,
      comparisonCount: card.comparisonCount,
      winCount: card.winCount,
      confidence: getConfidence(card.comparisonCount),
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
    }))

    return NextResponse.json({ cards: result })
  } catch (error) {
    console.error('Failed to list cards:', error)
    return NextResponse.json(
      { error: 'Failed to list cards' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params

    const set = await prisma.set.findUnique({ where: { id: setId } })
    if (!set) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    }

    const contentType = request.headers.get('content-type') || ''

    // Phase 2: confirm upload (JSON body)
    if (contentType.includes('application/json')) {
      const body = await request.json()
      const { uploadBatchId } = body

      if (!uploadBatchId) {
        return NextResponse.json(
          { error: 'uploadBatchId is required' },
          { status: 400 }
        )
      }

      return await confirmUpload(setId, uploadBatchId)
    }

    // Phase 1: validate upload (multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      return await validateUpload(setId, formData)
    }

    return NextResponse.json(
      { error: 'Unsupported content type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Failed to upload cards:', error)
    return NextResponse.json(
      { error: 'Failed to upload cards' },
      { status: 500 }
    )
  }
}

async function validateUpload(setId: string, formData: FormData) {
  const storage = getStorage()
  const batchId = randomUUID()

  // Collect image files
  const imageFiles: Array<{ name: string; file: File }> = []
  const entries = Array.from(formData.entries())

  for (const [key, value] of entries) {
    if (key === 'csv' || key === 'mode') continue
    if (value instanceof File && value.size > 0) {
      imageFiles.push({ name: value.name, file: value })
    }
  }

  if (imageFiles.length === 0) {
    return NextResponse.json(
      { error: 'No image files provided' },
      { status: 400 }
    )
  }

  // Store images temporarily
  const imageFilenames: string[] = []
  for (const { name, file } of imageFiles) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const tempKey = `tmp/${batchId}/${name}`
    await storage.put(tempKey, buffer, file.type)
    imageFilenames.push(name)
  }

  // Parse CSV if provided
  const csvFile = formData.get('csv')
  let validationResult

  if (csvFile && csvFile instanceof File && csvFile.size > 0) {
    const csvText = await csvFile.text()
    const parsed = parseCsv(csvText)

    if (parsed.errors.length > 0) {
      // Clean up temp files on CSV error
      await storage.deletePrefix(`tmp/${batchId}/`)
      return NextResponse.json(
        { errors: parsed.errors, batchId: null },
        { status: 400 }
      )
    }

    validationResult = validateCsvAgainstImages(parsed, imageFilenames)

    // Store CSV text for phase 2
    await storage.put(
      `tmp/${batchId}/_metadata.json`,
      Buffer.from(JSON.stringify({
        csvProvided: true,
        matched: validationResult.matched,
        unmatchedImages: validationResult.unmatchedImages,
        imageFilenames,
      })),
      'application/json'
    )

    return NextResponse.json({
      batchId,
      imageCount: imageFilenames.length,
      matched: validationResult.matched.length,
      unmatchedCsvRows: validationResult.unmatchedCsvRows,
      unmatchedImages: validationResult.unmatchedImages,
      duplicateImages: validationResult.duplicateImages,
    })
  } else {
    // No CSV: create metadata from filenames
    const cardsFromFiles = imageFilenames.map((filename) => ({
      name: filename.replace(/\.[^.]+$/, ''),
      rarity: 'Unknown',
      type: 'Unknown',
      imageFilename: filename,
    }))

    await storage.put(
      `tmp/${batchId}/_metadata.json`,
      Buffer.from(JSON.stringify({
        csvProvided: false,
        matched: cardsFromFiles,
        unmatchedImages: [],
        imageFilenames,
      })),
      'application/json'
    )

    return NextResponse.json({
      batchId,
      imageCount: imageFilenames.length,
      matched: cardsFromFiles.length,
      unmatchedCsvRows: [],
      unmatchedImages: [],
      duplicateImages: [],
    })
  }
}

async function confirmUpload(setId: string, batchId: string) {
  const storage = getStorage()

  // Read metadata
  const metadataBuffer = await storage.get(`tmp/${batchId}/_metadata.json`)
  if (!metadataBuffer) {
    return NextResponse.json(
      { error: 'Upload batch not found or expired' },
      { status: 404 }
    )
  }

  const metadata = JSON.parse(metadataBuffer.toString())
  const { matched, unmatchedImages, imageFilenames } = metadata as {
    matched: Array<{ name: string; rarity: string; type: string; imageFilename: string }>
    unmatchedImages: string[]
    imageFilenames: string[]
  }

  // Process all cards (matched from CSV + unmatched images with defaults)
  const allCards = [...matched]

  // Add unmatched images with default metadata
  for (const filename of unmatchedImages) {
    allCards.push({
      name: filename.replace(/\.[^.]+$/, ''),
      rarity: 'Unknown',
      type: 'Unknown',
      imageFilename: filename,
    })
  }

  const createdCards: DbCard[] = []

  for (const cardData of allCards) {
    const filename = cardData.imageFilename
    const tempKey = `tmp/${batchId}/${filename}`
    const imageBuffer = await storage.get(tempKey)

    if (!imageBuffer) {
      console.warn(`Image not found in temp storage: ${filename}`)
      continue
    }

    // Process image to generate thumbnails
    const processed = await processImage(imageBuffer, filename)
    const ext = processed.format === 'png' ? 'png' : 'jpg'
    const baseName = filename.replace(/\.[^.]+$/, '')

    // Store permanently
    const imageKey = `sets/${setId}/cards/${filename}`
    const thumbLgKey = `sets/${setId}/cards/${baseName}_lg.jpg`
    const thumbSmKey = `sets/${setId}/cards/${baseName}_sm.jpg`

    const [imageUrl, thumbLgUrl, thumbSmUrl] = await Promise.all([
      storage.put(imageKey, processed.original, `image/${ext}`),
      storage.put(thumbLgKey, processed.thumbnailLg, 'image/jpeg'),
      storage.put(thumbSmKey, processed.thumbnailSm, 'image/jpeg'),
    ])

    // Create card record
    const card: DbCard = await prisma.card.create({
      data: {
        setId,
        name: cardData.name,
        rarity: normalizeRarity(cardData.rarity),
        cardType: normalizeType(cardData.type),
        imageFilename: filename,
        imageUrl,
        thumbnailLg: thumbLgUrl,
        thumbnailSm: thumbSmUrl,
        eloRating: DEFAULT_RATING,
      },
    })

    createdCards.push(card)
  }

  // Clean up temp files
  await storage.deletePrefix(`tmp/${batchId}/`)

  return NextResponse.json(
    {
      created: createdCards.length,
      cards: createdCards.map((c) => ({
        id: c.id,
        name: c.name,
        rarity: c.rarity,
        cardType: c.cardType,
        imageFilename: c.imageFilename,
        imageUrl: c.imageUrl,
      })),
    },
    { status: 201 }
  )
}
