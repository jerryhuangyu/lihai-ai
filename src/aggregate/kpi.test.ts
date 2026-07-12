import { expect, test } from 'vitest'
import { kpis, activeBlock, monthEndProjection, whyToday } from './kpi'
import type { CcusageNormalized } from '../domain/types'

function mk(dailyRows: Array<{ date: string; cost: number; model?: string }>): CcusageNormalized {
  return {
    daily: dailyRows.map((d) => ({
      period: d.date, agent: 'claude',
      inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0,
      totalTokens: 0, totalCost: d.cost, modelsUsed: [d.model ?? 'm'],
      modelBreakdowns: [{ modelName: d.model ?? 'm', cost: d.cost, inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 }],
    })),
    weekly: [], monthly: [], session: [], blocks: [],
  }
}

test('kpis totals + avg + day-over-day delta', () => {
  const n = mk([{ date: '2026-07-09', cost: 10 }, { date: '2026-07-10', cost: 15 }])
  const k = kpis(n)
  expect(k.totalCost).toBe(25)
  expect(k.avgPerDay).toBe(12.5)
  expect(k.deltaPct).toBeCloseTo(50, 6) // 10 -> 15
})

test('activeBlock returns the active one or null', () => {
  const n = mk([{ date: '2026-07-10', cost: 1 }])
  expect(activeBlock(n)).toBeNull()
})

test('monthEndProjection extrapolates linearly', () => {
  // 2 days into month, $20 total -> $10/day -> 31-day month => $310
  const n = mk([{ date: '2026-07-01', cost: 10 }, { date: '2026-07-02', cost: 10 }])
  expect(monthEndProjection(n, '2026-07-02')).toBeCloseTo(310, 6)
})

test('whyToday decomposes delta by model vs trailing avg', () => {
  const n = mk([
    { date: '2026-07-03', cost: 10, model: 'a' },
    { date: '2026-07-04', cost: 10, model: 'a' },
    { date: '2026-07-05', cost: 30, model: 'a' },
  ])
  const w = whyToday(n, '2026-07-05')
  expect(w.delta).toBeCloseTo(20, 6) // 30 vs avg 10
  expect(w.byModel[0]).toEqual({ model: 'a', delta: 20 })
})
