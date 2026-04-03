const RARITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  common:    { bg: 'bg-[#374151]', text: 'text-[#9ca3af]', border: 'border-[#4b5563]' },
  uncommon:  { bg: 'bg-[#1e3a2f]', text: 'text-[#6ee7b7]', border: 'border-[#2d5a45]' },
  rare:      { bg: 'bg-[#1e2a4a]', text: 'text-[#93c5fd]', border: 'border-[#2d4070]' },
  epic:      { bg: 'bg-[#2e1a4a]', text: 'text-[#c084fc]', border: 'border-[#452870]' },
  mythic:    { bg: 'bg-[#3d2400]', text: 'text-[#fbbf24]', border: 'border-[#5c3600]' },
  legendary: { bg: 'bg-[#3d1500]', text: 'text-[#fb923c]', border: 'border-[#5c2000]' },
}

const FALLBACK_COLORS = [
  { bg: 'bg-[#2a1a3d]', text: 'text-[#d8b4fe]', border: 'border-[#3d2860]' },
  { bg: 'bg-[#1a3d2a]', text: 'text-[#86efac]', border: 'border-[#285c3d]' },
  { bg: 'bg-[#3d3a1a]', text: 'text-[#fde68a]', border: 'border-[#5c5628]' },
  { bg: 'bg-[#1a2d3d]', text: 'text-[#7dd3fc]', border: 'border-[#28455c]' },
]

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

export function getRarityColor(rarity: string): { bg: string; text: string; border: string } {
  const key = rarity.toLowerCase()
  const known = RARITY_COLORS[key]
  if (known) return known

  const index = hashCode(key) % FALLBACK_COLORS.length
  return FALLBACK_COLORS[index]
}
