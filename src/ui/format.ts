export function usd(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function tokensCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

export function durationCompact(ms: number): string {
  const s = ms / 1000
  if (s < 60) return `${Math.round(s)}s`
  const m = s / 60
  if (m < 60) return `${Math.round(m)}m`
  return `${(m / 60).toFixed(1)}h`
}

export function pct(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`
}

export function deltaLabel(deltaPct: number): { text: string; dir: 'up' | 'down' | 'flat' } {
  const dir = deltaPct > 0 ? 'up' : deltaPct < 0 ? 'down' : 'flat'
  const sign = deltaPct > 0 ? '+' : ''
  return { text: `${sign}${deltaPct.toFixed(1)}%`, dir }
}
