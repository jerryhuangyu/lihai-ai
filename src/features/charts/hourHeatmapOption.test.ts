import { expect, test } from 'vitest'
import { buildHourHeatmapOption } from './hourHeatmapOption'
import { sequentialBlue } from '../../viz/palette'
const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }
const labels = {
  weekdays: ['TEST_SUN', 'TEST_MON', 'TEST_TUE', 'TEST_WED', 'TEST_THU', 'TEST_FRI', 'TEST_SAT'],
  tooltip: {
    shareOfTotal: 'TEST_SHARE cost={{cost}} share={{share}}',
    daysActive: 'TEST_DAYS days={{days}}',
    recentDate: 'TEST_RECENT date={{date}}',
  },
}

test('heatmap series maps [hour, weekday, cost, days, lastDate] with sequential visualMap', () => {
  const opt: any = buildHourHeatmapOption(
    [{ weekday: 5, hour: 13, cost: 3, days: 2, lastDate: '2026-07-17' }],
    theme,
    labels,
  )
  expect(opt.series[0].type).toBe('heatmap')
  expect(opt.series[0].data[0]).toEqual([13, 5, 3, 2, '2026-07-17']) // [hour, weekday, cost, days, lastDate]
  expect(opt.xAxis.data).toHaveLength(24)
  expect(opt.yAxis.data).toHaveLength(7)
  expect(opt.yAxis.data).toEqual(labels.weekdays)
  expect(opt.visualMap.dimension).toBe(2) // color by cost, not the extra dims
  expect(opt.visualMap.inRange.color).toEqual(sequentialBlue('light'))
  expect(opt.visualMap.calculable).toBe(true) // draggable range filter
  expect(opt.visualMap.outOfRange.opacity).toBeLessThan(1) // filtered cells dim
})

test('tooltip shows weekday+hour, cost share, day count and latest date', () => {
  const opt: any = buildHourHeatmapOption(
    [
      { weekday: 5, hour: 13, cost: 3, days: 2, lastDate: '2026-07-17' },
      { weekday: 1, hour: 9, cost: 1, days: 1, lastDate: '2026-07-13' },
    ],
    theme,
    labels,
  )
  const html = opt.tooltip.formatter({ value: [13, 5, 3, 2, '2026-07-17'] })
  expect(html).toContain('TEST_FRI 13:00')
  expect(html).toContain('TEST_SHARE cost=$3.00 share=75.0') // 3 of total 4
  expect(html).toContain('TEST_DAYS days=2')
  expect(html).toContain('TEST_RECENT date=2026-07-17')
})

test('tooltip tolerates a stale cell missing days/lastDate (no crash)', () => {
  const opt: any = buildHourHeatmapOption([{ weekday: 5, hour: 13, cost: 3 }], theme, labels)
  expect(() => opt.tooltip.formatter({ value: [13, 5, 3, undefined, ''] })).not.toThrow()
})
