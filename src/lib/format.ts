export function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

export function formatPercentage(n: number, decimals: number = 1): string {
  const value = n < 1 && n >= 0 ? n * 100 : n
  return `${value.toFixed(decimals)}%`
}

export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`
  }
  return `${(ms / 1000).toFixed(1)}s`
}
