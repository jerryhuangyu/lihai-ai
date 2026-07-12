import { expect, test } from 'vitest'
import { dailyCost, tokenComposition, cacheTrend, modelTimeline } from './timeseries'
import { normalizeCcusage } from '../parsers/ccusage'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'

const n = normalizeCcusage(SAMPLE_BUNDLE.ccusage)

test('dailyCost maps period+totalCost', () => {
  expect(dailyCost(n)).toEqual([{ date: '2026-07-10', cost: 3.0 }])
})

test('tokenComposition splits token types', () => {
  expect(tokenComposition(n)[0]).toEqual({
    date: '2026-07-10', input: 100, output: 2000, cacheCreation: 500, cacheRead: 8000,
  })
})

test('cacheTrend computes hit rate', () => {
  const t = cacheTrend(n)[0]
  expect(t.hitRate).toBeCloseTo(8000 / 10600, 6)
})

test('modelTimeline emits per model per date', () => {
  expect(modelTimeline(n)).toEqual([
    { date: '2026-07-10', model: 'claude-opus-4-8', cost: 3.0 },
  ])
})
