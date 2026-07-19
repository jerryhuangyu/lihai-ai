import type { CcusageNormalized, CcusageBlock } from '../domain/types'

function sortedDaily(n: CcusageNormalized) {
  return [...n.daily].sort((a, b) => a.period.localeCompare(b.period))
}

export function kpis(n: CcusageNormalized) {
  const d = sortedDaily(n)
  const totalCost = d.reduce((a, r) => a + r.totalCost, 0)
  const avgPerDay = d.length ? totalCost / d.length : 0
  let deltaPct = 0
  if (d.length >= 2) {
    const prev = d[d.length - 2].totalCost
    const last = d[d.length - 1].totalCost
    deltaPct = prev > 0 ? ((last - prev) / prev) * 100 : 0
  }
  const burnRatePerHour =
    n.blocks.find((b) => b.isActive)?.burnRate?.costPerHour ?? 0
  return { totalCost, avgPerDay, burnRatePerHour, deltaPct }
}

export function activeBlock(n: CcusageNormalized): CcusageBlock | null {
  return n.blocks.find((b) => b.isActive) ?? null
}

export function monthEndProjection(n: CcusageNormalized, todayIso: string): number {
  const month = todayIso.slice(0, 7) // YYYY-MM
  const rows = n.daily.filter((r) => r.period.startsWith(month))
  if (rows.length === 0) return 0
  const spent = rows.reduce((a, r) => a + r.totalCost, 0)
  const dayOfMonth = Number(todayIso.slice(8, 10))
  const daysInMonth = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5, 7)),
    0,
  ).getDate()
  const perDay = spent / dayOfMonth
  return perDay * daysInMonth
}

// whyToday moved to aggregate/modelDaily.ts (whyTodayFromDaily): it now takes a
// selected date range as the comparison window (today vs the range's daily
// average) so the card responds to the 7d/30d/90d/all filter, instead of a
// fixed trailing-7-day baseline.
