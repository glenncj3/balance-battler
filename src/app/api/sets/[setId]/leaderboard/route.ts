import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getConfidence } from '@/lib/elo'
import { filterCards } from '@/lib/filters'
import type { DbCard, DbSet } from '@/types/db'

interface LeaderboardCard {
  id: string
  name: string
  rarity: string
  cardType: string
  imageUrl: string
  thumbnailSm: string | null
  eloRating: number
  comparisonCount: number
  winCount: number
  winRate: number
  confidence: 'low' | 'medium' | 'high'
  balanceZone: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params
    const { searchParams } = request.nextUrl

    const rarityFilter = searchParams.get('rarity')
    const typeFilter = searchParams.get('type')
    const minVotes = parseInt(searchParams.get('minVotes') || '0', 10)
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'eloRating'
    const sortDir = searchParams.get('sortDir') || 'desc'

    const set: DbSet | null = await prisma.set.findUnique({ where: { id: setId } })
    if (!set) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    }

    // Fetch all cards in set
    const allCards: DbCard[] = await prisma.card.findMany({
      where: { setId },
    })

    if (allCards.length === 0) {
      return NextResponse.json({
        cards: [],
        stats: { mean: 0, stddev: 0, totalVotes: 0, uniqueVoters: 0 },
      })
    }

    // Compute mean and stddev of elo ratings
    const ratings = allCards.map((c) => c.eloRating)
    const mean = ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
    const variance =
      ratings.reduce((sum: number, r: number) => sum + (r - mean) ** 2, 0) / ratings.length
    const stddev = Math.sqrt(variance)

    // Classify balance zones
    const balanceZoneSd = set.balanceZoneSd

    const classifyZone = (rating: number): string => {
      const deviation = (rating - mean) / (stddev || 1)
      if (deviation > balanceZoneSd) return 'overpowered'
      if (deviation < -balanceZoneSd) return 'underpowered'
      return 'balanced'
    }

    // Build leaderboard cards
    let cards: LeaderboardCard[] = allCards.map((card) => ({
      id: card.id,
      name: card.name,
      rarity: card.rarity,
      cardType: card.cardType,
      imageUrl: card.imageUrl,
      thumbnailSm: card.thumbnailSm,
      eloRating: card.eloRating,
      comparisonCount: card.comparisonCount,
      winCount: card.winCount,
      winRate:
        card.comparisonCount > 0
          ? Math.round((card.winCount / card.comparisonCount) * 1000) / 1000
          : 0,
      confidence: getConfidence(card.comparisonCount),
      balanceZone: classifyZone(card.eloRating),
    }))

    // Apply rarity/type filters
    if (rarityFilter || typeFilter) {
      const rarities = rarityFilter ? rarityFilter.split(',') : []
      const types = typeFilter ? typeFilter.split(',') : []
      cards = filterCards(cards, rarities, types)
    }

    // Apply min votes filter
    if (minVotes > 0) {
      cards = cards.filter((c) => c.comparisonCount >= minVotes)
    }

    // Apply search filter
    if (search) {
      const lower = search.toLowerCase()
      cards = cards.filter((c) => c.name.toLowerCase().includes(lower))
    }

    // Sort
    const validSorts: Record<string, keyof LeaderboardCard> = {
      eloRating: 'eloRating',
      name: 'name',
      winRate: 'winRate',
      comparisonCount: 'comparisonCount',
      rarity: 'rarity',
    }
    const sortField = validSorts[sortBy] || 'eloRating'

    cards.sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      const aNum = Number(aVal)
      const bNum = Number(bVal)
      return sortDir === 'asc' ? aNum - bNum : bNum - aNum
    })

    // Get stats
    const totalVotes = await prisma.vote.count({
      where: { setId, undone: false },
    })
    const uniqueVoters = await prisma.voterSession.count({
      where: { setId, votesCast: { gt: 0 } },
    })

    return NextResponse.json({
      cards,
      stats: {
        mean: Math.round(mean * 100) / 100,
        stddev: Math.round(stddev * 100) / 100,
        totalVotes,
        uniqueVoters,
      },
    })
  } catch (error) {
    console.error('Failed to get leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to get leaderboard' },
      { status: 500 }
    )
  }
}
