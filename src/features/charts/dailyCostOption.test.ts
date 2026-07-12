import { expect, test } from 'vitest'
import { buildDailyCostOption } from './dailyCostOption'

const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }
const labels = { series: 'TEST_DAILY_COST_SERIES' }

test('maps dates to x and cost to a single area series', () => {
  const opt: any = buildDailyCostOption([{ date: '2026-07-09', cost: 10 }, { date: '2026-07-10', cost: 15 }], theme, labels)
  expect(opt.xAxis.data).toEqual(['2026-07-09', '2026-07-10'])
  expect(opt.series).toHaveLength(1)
  expect(opt.series[0].data).toEqual([10, 15])
  expect(opt.series[0].type).toBe('line')
  expect(opt.series[0].areaStyle).toBeTruthy()
  expect(opt.series[0].name).toBe(labels.series)
})

test('single series → no legend, tooltip present', () => {
  const opt: any = buildDailyCostOption([{ date: 'd', cost: 1 }], theme, labels)
  expect(opt.legend).toBeUndefined()
  expect(opt.tooltip.trigger).toBe('axis')
})
