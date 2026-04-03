import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { LeaderboardView } from './LeaderboardView'
import { DatabaseError } from '@/components/DatabaseError'

export const dynamic = 'force-dynamic'

interface LeaderboardPageProps {
  params: Promise<{ gameId: string; setId: string }>
}

export default async function LeaderboardPage({ params }: LeaderboardPageProps) {
  const { gameId, setId } = await params

  try {
    const set = await prisma.set.findUnique({
      where: { id: setId },
      select: {
        id: true,
        gameId: true,
        name: true,
        slug: true,
        minVoteThreshold: true,
        balanceZoneSd: true,
      },
    })

    if (!set || set.gameId !== gameId) {
      notFound()
    }

    const cards = await prisma.card.findMany({
      where: { setId },
      orderBy: { eloRating: 'desc' },
    })

    const totalCards = cards.length
    const totalComparisons = cards.reduce((sum, c) => sum + c.comparisonCount, 0)
    const ratings = cards.map((c) => c.eloRating)
    const meanRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 1500
    const variance =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + (r - meanRating) ** 2, 0) / ratings.length
        : 0
    const stdDev = Math.sqrt(variance)

    const leaderboard = cards.map((card, index) => {
      const deviation = stdDev > 0 ? (card.eloRating - meanRating) / stdDev : 0
      let confidence: 'low' | 'medium' | 'high' = 'low'
      if (card.comparisonCount >= set.minVoteThreshold * 2) confidence = 'high'
      else if (card.comparisonCount >= set.minVoteThreshold) confidence = 'medium'

      let zone: 'op' | 'balanced' | 'up' = 'balanced'
      if (deviation > set.balanceZoneSd) zone = 'op'
      else if (deviation < -set.balanceZoneSd) zone = 'up'

      return {
        id: card.id,
        rank: index + 1,
        name: card.name,
        rarity: card.rarity,
        cardType: card.cardType,
        imageUrl: card.imageUrl,
        thumbnailLg: card.thumbnailLg || card.imageUrl,
        eloRating: card.eloRating,
        comparisonCount: card.comparisonCount,
        winCount: card.winCount,
        winRate: card.comparisonCount > 0 ? card.winCount / card.comparisonCount : 0,
        confidence,
        zone,
        deviation,
      }
    })

    return (
      <LeaderboardView
        cards={leaderboard}
        totalCards={totalCards}
        totalComparisons={totalComparisons}
        meanRating={meanRating}
        stdDev={stdDev}
        balanceZoneSd={set.balanceZoneSd}
        setSlug={set.slug}
      />
    )
  } catch {
    return <DatabaseError />
  }
}
