import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { DbSet } from '@/types/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params
    const { searchParams } = request.nextUrl
    const metric = searchParams.get('metric')

    const set: DbSet | null = await prisma.set.findUnique({ where: { id: setId } })
    if (!set) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    }

    if (!metric) {
      return NextResponse.json(
        { error: 'metric query parameter is required' },
        { status: 400 }
      )
    }

    switch (metric) {
      case 'distribution':
        return await handleDistribution(setId)
      case 'convergence':
        return await handleConvergence(setId)
      case 'headToHead':
        return await handleHeadToHead(setId)
      case 'velocity':
        return await handleVelocity(setId)
      case 'outliers':
        return await handleOutliers(setId)
      case 'decisionTime':
        return await handleDecisionTime(setId)
      case 'whyTags':
        return await handleWhyTags(setId)
      case 'voterSummary':
        return await handleVoterSummary(setId)
      case 'rarityScatter':
        return await handleRarityScatter(setId)
      default:
        return NextResponse.json(
          { error: `Unknown metric: ${metric}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Failed to get analytics:', error)
    return NextResponse.json(
      { error: 'Failed to get analytics' },
      { status: 500 }
    )
  }
}

async function handleDistribution(setId: string) {
  const cards: Array<{ eloRating: number }> = await prisma.card.findMany({
    where: { setId },
    select: { eloRating: true },
  })

  if (cards.length === 0) {
    return NextResponse.json({ buckets: [] })
  }

  const ratings = cards.map((c) => c.eloRating)
  const min = Math.floor(Math.min(...ratings) / 50) * 50
  const max = Math.ceil(Math.max(...ratings) / 50) * 50

  const buckets: Array<{ min: number; max: number; count: number }> = []
  for (let start = min; start < max; start += 50) {
    const end = start + 50
    const count = ratings.filter((r: number) => r >= start && r < end).length
    buckets.push({ min: start, max: end, count })
  }

  // Include the max boundary in the last bucket
  if (buckets.length > 0) {
    const lastBucket = buckets[buckets.length - 1]
    const maxCount = ratings.filter((r: number) => r === lastBucket.max).length
    if (maxCount > 0) {
      lastBucket.count += maxCount
    }
  }

  return NextResponse.json({ buckets })
}

async function handleConvergence(setId: string) {
  const snapshots: Array<{
    cardId: string
    eloRating: number
    createdAt: Date
    card: { name: string }
  }> = await prisma.cardRatingSnapshot.findMany({
    where: {
      card: { setId },
    },
    include: {
      card: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Group by card
  const byCard: Record<
    string,
    { name: string; points: Array<{ date: string; rating: number }> }
  > = {}

  for (const snap of snapshots) {
    if (!byCard[snap.cardId]) {
      byCard[snap.cardId] = { name: snap.card.name, points: [] }
    }
    byCard[snap.cardId].points.push({
      date: snap.createdAt.toISOString(),
      rating: snap.eloRating,
    })
  }

  return NextResponse.json({
    cards: Object.entries(byCard).map(([cardId, data]) => ({
      cardId,
      name: data.name,
      points: data.points,
    })),
  })
}

async function handleHeadToHead(setId: string) {
  const votes: Array<{
    cardAId: string
    cardBId: string
    winnerId: string | null
  }> = await prisma.vote.findMany({
    where: { setId, undone: false, winnerId: { not: null } },
    select: { cardAId: true, cardBId: true, winnerId: true },
  })

  // Build win rate map for each pair
  const pairMap = new Map<
    string,
    { cardAId: string; cardBId: string; aWins: number; bWins: number }
  >()

  for (const vote of votes) {
    const [first, second] = [vote.cardAId, vote.cardBId].sort()
    const key = `${first}:${second}`

    if (!pairMap.has(key)) {
      pairMap.set(key, { cardAId: first, cardBId: second, aWins: 0, bWins: 0 })
    }

    const pair = pairMap.get(key)!
    if (vote.winnerId === first) {
      pair.aWins++
    } else {
      pair.bWins++
    }
  }

  // Get card names for the pairs
  const cardIds = new Set<string>()
  for (const pair of pairMap.values()) {
    cardIds.add(pair.cardAId)
    cardIds.add(pair.cardBId)
  }

  const cards: Array<{ id: string; name: string }> = await prisma.card.findMany({
    where: { id: { in: Array.from(cardIds) } },
    select: { id: true, name: true },
  })
  const nameMap = new Map(cards.map((c) => [c.id, c.name]))

  const pairs = Array.from(pairMap.values()).map((pair) => {
    const total = pair.aWins + pair.bWins
    return {
      cardAId: pair.cardAId,
      cardAName: nameMap.get(pair.cardAId) ?? 'Unknown',
      cardBId: pair.cardBId,
      cardBName: nameMap.get(pair.cardBId) ?? 'Unknown',
      cardAWins: pair.aWins,
      cardBWins: pair.bWins,
      totalGames: total,
      cardAWinRate: total > 0 ? Math.round((pair.aWins / total) * 1000) / 1000 : 0,
    }
  })

  return NextResponse.json({ pairs })
}

async function handleVelocity(setId: string) {
  const votes: Array<{ createdAt: Date }> = await prisma.vote.findMany({
    where: { setId, undone: false },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  // Group by day
  const dayMap = new Map<string, number>()
  for (const vote of votes) {
    const day = vote.createdAt.toISOString().split('T')[0]
    dayMap.set(day, (dayMap.get(day) || 0) + 1)
  }

  // Group by hour
  const hourMap = new Map<number, number>()
  for (const vote of votes) {
    const hour = vote.createdAt.getUTCHours()
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1)
  }

  return NextResponse.json({
    byDay: Array.from(dayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    byHour: Array.from(hourMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour - b.hour),
  })
}

async function handleOutliers(setId: string) {
  const cards: Array<{
    id: string
    name: string
    rarity: string
    eloRating: number
    comparisonCount: number
  }> = await prisma.card.findMany({
    where: { setId },
    select: {
      id: true,
      name: true,
      rarity: true,
      eloRating: true,
      comparisonCount: true,
    },
  })

  if (cards.length === 0) {
    return NextResponse.json({ outliers: [] })
  }

  const ratings = cards.map((c) => c.eloRating)
  const mean = ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
  const variance =
    ratings.reduce((sum: number, r: number) => sum + (r - mean) ** 2, 0) / ratings.length
  const stddev = Math.sqrt(variance)

  // Cards > 2 SD from mean
  const threshold = 2

  const outliers = cards
    .map((card) => {
      const deviation = stddev > 0 ? (card.eloRating - mean) / stddev : 0
      return {
        id: card.id,
        name: card.name,
        rarity: card.rarity,
        eloRating: card.eloRating,
        comparisonCount: card.comparisonCount,
        deviation: Math.round(deviation * 100) / 100,
        direction: deviation > 0 ? ('above' as const) : ('below' as const),
      }
    })
    .filter((c) => Math.abs(c.deviation) > threshold)
    .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))

  return NextResponse.json({
    outliers,
    mean: Math.round(mean * 100) / 100,
    stddev: Math.round(stddev * 100) / 100,
    threshold,
  })
}

async function handleDecisionTime(setId: string) {
  const votes: Array<{
    cardAId: string
    cardBId: string
    winnerId: string | null
    decisionTimeMs: number | null
  }> = await prisma.vote.findMany({
    where: {
      setId,
      undone: false,
      decisionTimeMs: { not: null },
    },
    select: {
      cardAId: true,
      cardBId: true,
      winnerId: true,
      decisionTimeMs: true,
    },
  })

  // Aggregate decision time per card
  const cardTimes = new Map<string, number[]>()

  for (const vote of votes) {
    if (vote.decisionTimeMs === null) continue

    for (const cardId of [vote.cardAId, vote.cardBId]) {
      if (!cardTimes.has(cardId)) {
        cardTimes.set(cardId, [])
      }
      cardTimes.get(cardId)!.push(vote.decisionTimeMs)
    }
  }

  const cardIds = Array.from(cardTimes.keys())
  const cards: Array<{ id: string; name: string }> = await prisma.card.findMany({
    where: { id: { in: cardIds } },
    select: { id: true, name: true },
  })
  const nameMap = new Map(cards.map((c) => [c.id, c.name]))

  const result = Array.from(cardTimes.entries()).map(([cardId, times]) => {
    const avg = times.reduce((a: number, b: number) => a + b, 0) / times.length
    return {
      cardId,
      name: nameMap.get(cardId) ?? 'Unknown',
      avgDecisionTimeMs: Math.round(avg),
      totalComparisons: times.length,
    }
  })

  result.sort((a, b) => b.avgDecisionTimeMs - a.avgDecisionTimeMs)

  return NextResponse.json({ cards: result })
}

async function handleWhyTags(setId: string) {
  const votes: Array<{
    cardAId: string
    cardBId: string
    winnerId: string | null
    whyTag: string | null
  }> = await prisma.vote.findMany({
    where: {
      setId,
      undone: false,
      whyTag: { not: null },
    },
    select: {
      cardAId: true,
      cardBId: true,
      winnerId: true,
      whyTag: true,
    },
  })

  // Per-card, track tags for wins and losses
  const cardTags = new Map<
    string,
    { wins: Map<string, number>; losses: Map<string, number> }
  >()

  const ensureCard = (id: string) => {
    if (!cardTags.has(id)) {
      cardTags.set(id, { wins: new Map(), losses: new Map() })
    }
    return cardTags.get(id)!
  }

  for (const vote of votes) {
    if (!vote.whyTag || !vote.winnerId) continue

    const winnerId = vote.winnerId
    const loserId = vote.cardAId === winnerId ? vote.cardBId : vote.cardAId

    const winnerData = ensureCard(winnerId)
    winnerData.wins.set(
      vote.whyTag,
      (winnerData.wins.get(vote.whyTag) || 0) + 1
    )

    const loserData = ensureCard(loserId)
    loserData.losses.set(
      vote.whyTag,
      (loserData.losses.get(vote.whyTag) || 0) + 1
    )
  }

  const cardIds = Array.from(cardTags.keys())
  const cards: Array<{ id: string; name: string }> = await prisma.card.findMany({
    where: { id: { in: cardIds } },
    select: { id: true, name: true },
  })
  const nameMap = new Map(cards.map((c) => [c.id, c.name]))

  const result = Array.from(cardTags.entries()).map(([cardId, data]) => ({
    cardId,
    name: nameMap.get(cardId) ?? 'Unknown',
    wins: Object.fromEntries(data.wins),
    losses: Object.fromEntries(data.losses),
  }))

  return NextResponse.json({ cards: result })
}

async function handleVoterSummary(setId: string) {
  const sessions: Array<{
    id: string
    votesCast: number
    createdAt: Date
    lastActive: Date
  }> = await prisma.voterSession.findMany({
    where: { setId },
    select: {
      id: true,
      votesCast: true,
      createdAt: true,
      lastActive: true,
    },
  })

  const uniqueVoters = sessions.length
  const activeSessions = sessions.filter((s) => s.votesCast > 0)
  const totalVotes = activeSessions.reduce((sum: number, s) => sum + s.votesCast, 0)
  const avgVotesPerSession =
    activeSessions.length > 0
      ? Math.round((totalVotes / activeSessions.length) * 100) / 100
      : 0

  // Retention: sessions with more than 10 votes
  const retainedSessions = activeSessions.filter(
    (s) => s.votesCast >= 10
  ).length
  const retentionRate =
    activeSessions.length > 0
      ? Math.round((retainedSessions / activeSessions.length) * 1000) / 1000
      : 0

  return NextResponse.json({
    uniqueVoters,
    activeSessions: activeSessions.length,
    totalVotes,
    avgVotesPerSession,
    retainedSessions,
    retentionRate,
  })
}

async function handleRarityScatter(setId: string) {
  const cards: Array<{
    id: string
    name: string
    rarity: string
    eloRating: number
    comparisonCount: number
  }> = await prisma.card.findMany({
    where: { setId },
    select: {
      id: true,
      name: true,
      rarity: true,
      eloRating: true,
      comparisonCount: true,
    },
  })

  const points = cards.map((card) => ({
    id: card.id,
    name: card.name,
    rarity: card.rarity,
    eloRating: card.eloRating,
    comparisonCount: card.comparisonCount,
  }))

  return NextResponse.json({ points })
}
