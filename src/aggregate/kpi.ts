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

export function whyToday(n: CcusageNormalized, todayIso: string) {
  const d = sortedDaily(n)
  const today = d.find((r) => r.period === todayIso)
  const prior = d.filter((r) => r.period < todayIso).slice(-7)
  const avg = prior.length ? prior.reduce((a, r) => a + r.totalCost, 0) / prior.length : 0
  const delta = (today?.totalCost ?? 0) - avg

  // per-model today vs per-model trailing avg
  const todayByModel = new Map<string, number>()
  for (const b of today?.modelBreakdowns ?? []) {
    todayByModel.set(b.modelName, (todayByModel.get(b.modelName) ?? 0) + b.cost)
  }
  const priorSumByModel = new Map<string, number>()
  for (const r of prior) {
    for (const b of r.modelBreakdowns) {
      priorSumByModel.set(b.modelName, (priorSumByModel.get(b.modelName) ?? 0) + b.cost)
    }
  }
  const models = new Set([...todayByModel.keys(), ...priorSumByModel.keys()])
  const byModel = [...models]
    .map((model) => ({
      model,
      delta:
        (todayByModel.get(model) ?? 0) -
        (prior.length ? (priorSumByModel.get(model) ?? 0) / prior.length : 0),
    }))
    .sort((a, b) => b.delta - a.delta)

  return { delta, byModel }
}
