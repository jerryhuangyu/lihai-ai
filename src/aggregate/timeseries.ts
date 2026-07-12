import type { CcusageNormalized } from '../domain/types'

const byDate = <T extends { date: string }>(a: T, b: T) => a.date.localeCompare(b.date)

export function dailyCost(n: CcusageNormalized) {
  return n.daily
    .map((r) => ({ date: r.period, cost: r.totalCost }))
    .sort(byDate)
}

export function tokenComposition(n: CcusageNormalized) {
  return n.daily
    .map((r) => ({
      date: r.period,
      input: r.inputTokens,
      output: r.outputTokens,
      cacheCreation: r.cacheCreationTokens,
      cacheRead: r.cacheReadTokens,
    }))
    .sort(byDate)
}

export function cacheTrend(n: CcusageNormalized) {
  return n.daily
    .map((r) => ({
      date: r.period,
      hitRate: r.totalTokens > 0 ? r.cacheReadTokens / r.totalTokens : 0,
      cacheReadTokens: r.cacheReadTokens,
    }))
    .sort(byDate)
}

export function modelTimeline(n: CcusageNormalized) {
  const out: { date: string; model: string; cost: number }[] = []
  for (const r of n.daily) {
    for (const b of r.modelBreakdowns) {
      out.push({ date: r.period, model: b.modelName, cost: b.cost })
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.model.localeCompare(b.model))
}
