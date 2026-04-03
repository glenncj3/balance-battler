export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export function generateUniqueSlug(
  name: string,
  existingSlugs: string[]
): string {
  const base = generateSlug(name)
  if (!existingSlugs.includes(base)) {
    return base
  }

  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let suffix = ''
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return `${base}-${suffix}`
}
