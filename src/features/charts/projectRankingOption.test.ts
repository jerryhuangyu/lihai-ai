import { expect, test } from 'vitest'
import { buildProjectRankingOption } from './projectRankingOption'
const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }

test('horizontal bars, top 10, single hue, cost values', () => {
  const rows = Array.from({ length: 12 }, (_, i) => ({ project: `p${i}`, cost: 12 - i, tokens: 0 }))
  const opt: any = buildProjectRankingOption(rows, theme)
  expect(opt.series).toHaveLength(1)
  expect(opt.series[0].type).toBe('bar')
  expect(opt.yAxis.type).toBe('category')        // horizontal
  expect(opt.xAxis.type).toBe('value')
  expect(opt.series[0].data).toHaveLength(10)     // capped top 10
  expect(typeof opt.series[0].itemStyle.color).toBe('string') // one color, not per-bar array
  expect(opt.legend).toBeUndefined()              // single series
})
