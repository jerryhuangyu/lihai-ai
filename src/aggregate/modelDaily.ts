import type { CcusageNormalized } from '../domain/types'

export interface ModelDailyRow {
  date: string
  model: string
  cost: number
  outputTokens: number
  totalTokens: number
}

// Per date × model cost/token rollup, derived from the ccusage daily
// breakdowns (covers ALL agents, not just Claude-only costed events).
// Persisted so model-efficiency and why-today can be recomputed for any
// selected date range on the client — the same synchronous slice pattern as
// dailyCost — without an IndexedDB round-trip.
export function modelDaily(n: CcusageNormalized): ModelDailyRow[] {
  const out: ModelDailyRow[] = []
  for (const r of n.daily) {
    for (const b of r.modelBreakdowns) {
      out.push({
        date: r.period,
        model: b.modelName,
        cost: b.cost,
        outputTokens: b.outputTokens,
        totalTokens: b.inputTokens + b.outputTokens + b.cacheCreationTokens + b.cacheReadTokens,
      })
    }
  }
  return out
}

export interface EfficiencyAgg {
  model: string
  costPerMillionOutput: number
  costPerMillionToken: number
  outputShare: number
}

// Same math as the old modelEfficiency(n), but over a (range-sliced) set of
// modelDaily rows. Summing rows first then dividing is exact because rate is a
// per-model constant, so grouping granularity doesn't matter.
export function modelEfficiencyFromDaily(rows: ModelDailyRow[]): EfficiencyAgg[] {
  const m = new Map<string, { cost: number; output: number; total: number }>()
  for (const r of rows) {
    const cur = m.get(r.model) ?? { cost: 0, output: 0, total: 0 }
    cur.cost += r.cost
    cur.output += r.outputTokens
    cur.total += r.totalTokens
    m.set(r.model, cur)
  }
  return [...m.entries()]
    .map(([model, v]) => ({
      model,
      costPerMillionOutput: v.output > 0 ? (v.cost / v.output) * 1e6 : 0,
      costPerMillionToken: v.total > 0 ? (v.cost / v.total) * 1e6 : 0,
      outputShare: v.total > 0 ? v.output / v.total : 0,
    }))
    .sort((a, b) => a.costPerMillionToken - b.costPerMillionToken)
}

// "Why is <anchor> (the latest active day) more/less expensive than usual?"
// Baseline = every EARLIER day inside the selected range, averaged per day, so
// the range drives the comparison window: 7d/30d/90d/all each answer against a
// different period. anchor is the latest data day overall (NOT range.to, which
// is a far-future sentinel for the 'all' preset).
export function whyTodayFromDaily(
  rows: ModelDailyRow[],
  range: { from: string; to: string },
  anchor: string,
): { delta: number; byModel: { model: string; delta: number }[] } {
  const inRange = rows.filter((r) => r.date >= range.from && r.date <= range.to)
  const todayRows = inRange.filter((r) => r.date === anchor)
  const baseRows = inRange.filter((r) => r.date < anchor)
  const baseDays = new Set(baseRows.map((r) => r.date)).size

  const todayTotal = todayRows.reduce((a, r) => a + r.cost, 0)
  const baseAvg = baseDays ? baseRows.reduce((a, r) => a + r.cost, 0) / baseDays : 0
  const delta = todayTotal - baseAvg

  const todayByModel = new Map<string, number>()
  for (const r of todayRows) todayByModel.set(r.model, (todayByModel.get(r.model) ?? 0) + r.cost)
  const baseSumByModel = new Map<string, number>()
  for (const r of baseRows) baseSumByModel.set(r.model, (baseSumByModel.get(r.model) ?? 0) + r.cost)

  const models = new Set([...todayByModel.keys(), ...baseSumByModel.keys()])
  const byModel = [...models]
    .map((model) => ({
      model,
      delta:
        (todayByModel.get(model) ?? 0) - (baseDays ? (baseSumByModel.get(model) ?? 0) / baseDays : 0),
    }))
    .sort((a, b) => b.delta - a.delta)

  return { delta, byModel }
}

export function latestDate(rows: { date: string }[]): string {
  let max = ''
  for (const r of rows) if (r.date > max) max = r.date
  return max
}
