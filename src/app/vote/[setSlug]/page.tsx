import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { VoteLayout } from '@/components/layout/VoteLayout'
import { VotingArena } from '@/components/voting/VotingArena'
import { DatabaseError } from '@/components/DatabaseError'

export const dynamic = 'force-dynamic'

interface VotePageProps {
  params: Promise<{ setSlug: string }>
}

export default async function VotePage({ params }: VotePageProps) {
  const { setSlug } = await params

  try {
    const set = await prisma.set.findUnique({
      where: { slug: setSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        votingOpen: true,
        defaultShowMetadata: true,
        whyTagsEnabled: true,
        whyTagLabels: true,
      },
    })

    if (!set) {
      notFound()
    }

    const setConfig = {
      showCardNames: set.defaultShowMetadata,
      showCardInfo: set.defaultShowMetadata,
      requireMinComparisons: 0,
    }

    return (
      <VoteLayout setName={set.name}>
        <VotingArena setConfig={setConfig} setSlug={set.slug} />
      </VoteLayout>
    )
  } catch {
    return (
      <VoteLayout>
        <DatabaseError />
      </VoteLayout>
    )
  }
}
