import { expect, test } from 'vitest'
import {
  modelDaily, modelEfficiencyFromDaily, whyTodayFromDaily, latestDate,
  type ModelDailyRow,
} from './modelDaily'
import type { CcusageNormalized } from '../domain/types'

function mk(
  rows: Array<{ date: string; model: string; cost: number; output?: number; total?: number }>,
): CcusageNormalized {
  return {
    daily: rows.map((r) => ({
      period: r.date, agent: 'claude',
      inputTokens: 0, outputTokens: r.output ?? 0, cacheCreationTokens: 0, cacheReadTokens: 0,
      totalTokens: r.total ?? 0, totalCost: r.cost, modelsUsed: [r.model],
      modelBreakdowns: [{
        modelName: r.model, cost: r.cost,
        inputTokens: (r.total ?? 0) - (r.output ?? 0), outputTokens: r.output ?? 0,
        cacheCreationTokens: 0, cacheReadTokens: 0,
      }],
    })),
    weekly: [], monthly: [], session: [], blocks: [],
  }
}

test('modelDaily flattens daily model breakdowns into date × model rows', () => {
  const n = mk([{ date: '2026-07-01', model: 'a', cost: 5, output: 100, total: 400 }])
  expect(modelDaily(n)).toEqual([
    { date: '2026-07-01', model: 'a', cost: 5, outputTokens: 100, totalTokens: 400 },
  ])
})

test('modelEfficiencyFromDaily sums rows then divides ($/1M output + token + share)', () => {
  const rows: ModelDailyRow[] = [
    { date: '2026-07-01', model: 'a', cost: 1, outputTokens: 1000, totalTokens: 4000 },
    { date: '2026-07-02', model: 'a', cost: 2, outputTokens: 1000, totalTokens: 4000 },
  ]
  const e = modelEfficiencyFromDaily(rows)[0]
  expect(e.model).toBe('a')
  expect(e.costPerMillionOutput).toBeCloseTo((3 / 2000) * 1e6, 6)
  expect(e.costPerMillionToken).toBeCloseTo((3 / 8000) * 1e6, 6)
  expect(e.outputShare).toBeCloseTo(2000 / 8000, 6)
})

test('modelEfficiencyFromDaily sorts cheapest-per-token first', () => {
  const rows: ModelDailyRow[] = [
    { date: '2026-07-01', model: 'pricey', cost: 10, outputTokens: 100, totalTokens: 100 },
    { date: '2026-07-01', model: 'cheap', cost: 1, outputTokens: 100, totalTokens: 100 },
  ]
  expect(modelEfficiencyFromDaily(rows).map((r) => r.model)).toEqual(['cheap', 'pricey'])
})

test('whyTodayFromDaily: anchor day vs per-day average of earlier in-range days', () => {
  const rows = modelDaily(mk([
    { date: '2026-07-03', model: 'a', cost: 10 },
    { date: '2026-07-04', model: 'a', cost: 10 },
    { date: '2026-07-05', model: 'a', cost: 30 },
  ]))
  const w = whyTodayFromDaily(rows, { from: '0000-01-01', to: '9999-12-31' }, '2026-07-05')
  expect(w.delta).toBeCloseTo(20, 6) // 30 vs avg(10,10)=10
  expect(w.byModel[0]).toEqual({ model: 'a', delta: 20 })
})

test('whyTodayFromDaily: range narrows the baseline window', () => {
  const rows = modelDaily(mk([
    { date: '2026-07-01', model: 'a', cost: 100 }, // outside a 2-day window
    { date: '2026-07-04', model: 'a', cost: 10 },
    { date: '2026-07-05', model: 'a', cost: 30 },
  ]))
  // range [07-04, 07-05] excludes the pricey 07-01 → baseline is just 07-04
  const w = whyTodayFromDaily(rows, { from: '2026-07-04', to: '2026-07-05' }, '2026-07-05')
  expect(w.delta).toBeCloseTo(20, 6) // 30 vs 10
})

test('whyTodayFromDaily: no earlier in-range days → delta is the full anchor total', () => {
  const rows = modelDaily(mk([{ date: '2026-07-05', model: 'a', cost: 30 }]))
  const w = whyTodayFromDaily(rows, { from: '0000-01-01', to: '9999-12-31' }, '2026-07-05')
  expect(w.delta).toBeCloseTo(30, 6)
})

test('latestDate returns the max date, empty string for no rows', () => {
  expect(latestDate([{ date: '2026-07-01' }, { date: '2026-07-09' }, { date: '2026-07-03' }])).toBe('2026-07-09')
  expect(latestDate([])).toBe('')
})
