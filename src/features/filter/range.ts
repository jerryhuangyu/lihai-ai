export type RangePreset = '7d' | '30d' | '90d' | 'all'

const DAYS: Record<Exclude<RangePreset, 'all'>, number> = { '7d': 7, '30d': 30, '90d': 90 }

export function resolveRange(preset: RangePreset, todayIso: string): { from: string; to: string } {
  if (preset === 'all') return { from: '0000-01-01', to: '9999-12-31' }
  const [y, m, d] = todayIso.split('-').map(Number)
  // deterministic UTC date math (no Date.now)
  const end = Date.UTC(y, m - 1, d)
  const from = new Date(end - (DAYS[preset] - 1) * 86_400_000).toISOString().slice(0, 10)
  return { from, to: todayIso }
}
