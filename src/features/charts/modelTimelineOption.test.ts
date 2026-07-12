import { expect, test } from 'vitest'
import { buildModelTimelineOption } from './modelTimelineOption'
import { CATEGORICAL_LIGHT } from '../../viz/palette'

const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }

test('pivots to one series per model, fixed-order colors', () => {
  const rows = [
    { date: 'd1', model: 'opus', cost: 3 },
    { date: 'd2', model: 'opus', cost: 4 },
    { date: 'd1', model: 'sonnet', cost: 1 },
  ]
  const opt: any = buildModelTimelineOption(rows, theme)
  const names = opt.series.map((s: any) => s.name)
  expect(names).toEqual(['opus', 'sonnet'])
  expect(opt.series[0].itemStyle.color).toBe(CATEGORICAL_LIGHT[0])
  expect(opt.series[1].itemStyle.color).toBe(CATEGORICAL_LIGHT[1])
  // opus present d1,d2; sonnet only d1 → null on d2 (no fabricated zero)
  expect(opt.series[1].data).toEqual([1, null])
  expect(opt.legend).toBeTruthy()
})

test('single model → no legend', () => {
  const opt: any = buildModelTimelineOption([{ date: 'd', model: 'solo', cost: 1 }], { theme: 'light', ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' })
  expect(opt.legend).toBeUndefined()
})

test('7th model folds into 其他, never a cycled hue', () => {
  const rows = Array.from({ length: 7 }, (_, i) => ({ date: 'd1', model: `m${i}`, cost: 1 }))
  const opt: any = buildModelTimelineOption(rows, theme)
  const names = opt.series.map((s: any) => s.name)
  expect(names).toContain('其他')
  expect(opt.series).toHaveLength(6) // 5 named + 其他
})
