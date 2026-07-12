import { expect, test } from 'vitest'
import { buildCacheTrendOption } from './cacheTrendOption'

const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }
const labels = { series: 'TEST_CACHE_TREND_SERIES' }

test('single % line, y capped 0..1, no legend, no second axis', () => {
  const opt: any = buildCacheTrendOption([{ date: 'd1', hitRate: 0.75, cacheReadTokens: 8000 }], theme, labels)
  expect(opt.series).toHaveLength(1)
  expect(opt.series[0].data).toEqual([0.75])
  expect(opt.yAxis.max).toBe(1)
  expect(opt.legend).toBeUndefined()
  expect(Array.isArray(opt.yAxis)).toBe(false) // one axis only
  expect(opt.series[0].name).toBe(labels.series)
})
